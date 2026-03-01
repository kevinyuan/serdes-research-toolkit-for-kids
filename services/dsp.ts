import { PamType, SimulationParams, SimulationResult, BathtubPoint } from '../types';

// Helper: Gaussian Random
const randn_bm = (): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// Helper: Convolution
const convolve = (signal: number[], kernel: number[]): number[] => {
  const outputLength = signal.length + kernel.length - 1;
  const output = new Float32Array(outputLength);
  for (let i = 0; i < signal.length; i++) {
    for (let j = 0; j < kernel.length; j++) {
      output[i + j] += signal[i] * kernel[j];
    }
  }
  return Array.from(output);
};

// Interpolation helper for bathtub/eye calc
const interpolate = (y1: number, y2: number, mu: number) => {
   // Linear is too sharp, Cosine is better for simple "analog-like" look
   const mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
   return (y1 * (1 - mu2) + y2 * mu2);
};

// Quantization Helper
const quantize = (val: number, bits: number): number => {
    if (bits <= 0) return val;
    // Assuming FSR (Full Scale Range) of +/- 1.5V (typical for internal logic scaling)
    const FSR = 1.5; 
    const levels = Math.pow(2, bits);
    const step = (2 * FSR) / levels;
    
    let q = Math.round(val / step) * step;
    
    // Saturation/Clipping
    if (q > FSR) q = FSR;
    if (q < -FSR) q = -FSR;
    
    return q;
};

// --- Linear Algebra Helpers for Zero Forcing ---

const transpose = (matrix: number[][]): number[][] => {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
};

const multiplyMatrices = (m1: number[][], m2: number[][]): number[][] => {
    const r1 = m1.length;
    const c1 = m1[0].length;
    const c2 = m2[0].length;
    const result = Array(r1).fill(0).map(() => Array(c2).fill(0));
    for (let i = 0; i < r1; i++) {
        for (let j = 0; j < c2; j++) {
            let sum = 0;
            for (let k = 0; k < c1; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
};

const multiplyMatrixVector = (m: number[][], v: number[]): number[] => {
    return m.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
};

const solveLinearSystem = (A: number[][], b: number[]): number[] => {
    // Gaussian elimination with partial pivoting
    const n = A.length;
    // Clone to avoid side effects
    const M = A.map(row => [...row]);
    const x = [...b];

    for (let i = 0; i < n; i++) {
        // Pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                maxRow = k;
            }
        }

        // Swap rows in M and x
        [M[i], M[maxRow]] = [M[maxRow], M[i]];
        [x[i], x[maxRow]] = [x[maxRow], x[i]];

        // Eliminate
        for (let k = i + 1; k < n; k++) {
            const factor = M[k][i] / M[i][i];
            x[k] -= factor * x[i];
            for (let j = i; j < n; j++) {
                M[k][j] -= factor * M[i][j];
            }
        }
    }

    // Back substitution
    const res = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += M[i][j] * res[j];
        }
        res[i] = (x[i] - sum) / M[i][i];
    }
    return res;
};

export const calculateZeroForcing = (channel: number[], numTaps: number): number[] => {
    // Solve H * w = d for w using Least Squares
    const lenH = channel.length;
    const totalLen = lenH + numTaps - 1;
    
    // 1. Construct Toeplitz Matrix H of size (lenH + numTaps - 1) x numTaps
    const HMatrix: number[][] = [];
    for (let r = 0; r < totalLen; r++) {
        HMatrix[r] = new Array(numTaps).fill(0);
        for (let c = 0; c < numTaps; c++) {
             const idx = r - c;
             if (idx >= 0 && idx < lenH) {
                 HMatrix[r][c] = channel[idx];
             }
        }
    }

    // 2. Find Main Cursor to set target delay
    let maxVal = -Infinity;
    let maxIdx = 0;
    channel.forEach((v, i) => { 
        if (Math.abs(v) > maxVal) { maxVal = Math.abs(v); maxIdx = i; }
    });
    
    // Heuristic: Align main cursor with the center of the equalizer
    const targetDelay = maxIdx + Math.floor(numTaps / 2);

    // 3. Construct Target Vector d (Delta function)
    const d = new Array(totalLen).fill(0);
    if (targetDelay < totalLen) {
        d[targetDelay] = 1;
    }

    // 4. Solve (H^T * H) * w = H^T * d
    try {
        const H_T = transpose(HMatrix);
        const A = multiplyMatrices(H_T, HMatrix); // Correlation matrix
        const b = multiplyMatrixVector(H_T, d);   // Cross-correlation vector
        
        const w = solveLinearSystem(A, b);
        
        // Safety check for NaN
        if (w.some(val => isNaN(val) || !isFinite(val))) throw new Error("NaN result");
        
        return w;
    } catch (e) {
        console.warn("ZF Calculation failed, returning pass-through", e);
        // Fallback
        const fallback = new Array(numTaps).fill(0);
        fallback[Math.floor(numTaps/2)] = 1;
        return fallback;
    }
};

// --- Helper: Slicer Logic ---
const sliceSymbol = (val: number, pamType: PamType, thresholdOffset: number = 0): number => {
    const v = val - thresholdOffset;
    if (pamType === PamType.PAM2) {
        return v >= 0 ? 1 : -1;
    } else {
        if (v < -2) return -3;
        if (v < 0) return -1;
        if (v < 2) return 1;
        return 3;
    }
};

export const runSimulation = (params: SimulationParams, numBits: number = 4000): SimulationResult => {
  const { pamType, channelResponse, equalizerTaps, txEqualizerTaps, dfeTaps, noiseLevel, useEqualizer, useTxEqualizer, useDfe, jitterRandom, jitterDeterministic, adcBits, useLms, lmsStepSize, adaptDfe, txVoltageSwing, txRiseTime, rxTargetPhase, rxThreshold, useCtle, ctleGain, ctlePeaking } = params;

  // 1. Generate Bits
  const bits: number[] = [];
  for (let i = 0; i < numBits; i++) {
    bits.push(Math.random() > 0.5 ? 1 : 0);
  }

  // 2. Map to Symbols (Ideal Logic Levels)
  let idealSymbols: number[] = [];
  if (pamType === PamType.PAM2) {
    idealSymbols = bits.map(b => (b === 0 ? -1 : 1));
  } else {
    const bitsProc = bits.length % 2 !== 0 ? bits.slice(0, -1) : bits;
    for (let i = 0; i < bitsProc.length; i += 2) {
      const val = (bitsProc[i] << 1) | bitsProc[i + 1];
      if (val === 0) idealSymbols.push(-3);
      else if (val === 1) idealSymbols.push(-1);
      else if (val === 2) idealSymbols.push(1);
      else if (val === 3) idealSymbols.push(3);
    }
  }

  // 3. Apply TX Equalizer (FIR) & DAC Scaling
  let txSignal: number[] = [];
  const txScale = txVoltageSwing / (pamType === PamType.PAM2 ? 2 : 6); // Normalize so max swing matches Vpp
  
  // Apply TX FIR
  let preDacSignal: number[] = [];
  if (useTxEqualizer) {
      preDacSignal = convolve(idealSymbols, txEqualizerTaps);
  } else {
      preDacSignal = [...idealSymbols];
  }

  // Apply DAC Voltage Scaling
  txSignal = preDacSignal.map(s => s * txScale);

  // Apply DAC Rise Time (Simple Low Pass Filter approximation)
  if (txRiseTime > 0) {
      // Simple 3-tap smoothing kernel based on rise time
      // alpha = 0 (sharp) to 0.5 (very smooth)
      const alpha = Math.min(0.45, txRiseTime); 
      const kernel = [alpha/2, 1 - alpha, alpha/2];
      txSignal = convolve(txSignal, kernel);
  }

  // 4. Channel Convolution (TX Signal -> Channel)
  let channelOut = convolve(txSignal, channelResponse);

  // 5. Apply Impairments (Noise -> Jitter -> ADC)
  
  // A. Add Voltage Noise (AWGN)
  let rxAnalog = channelOut.map(v => v + randn_bm() * noiseLevel);

  // B. Add Timing Jitter
  if (jitterRandom > 0 || jitterDeterministic > 0) {
      rxAnalog = rxAnalog.map((v, i) => {
          if (i === 0 || i === rxAnalog.length - 1) return v;
          const slope = (rxAnalog[i+1] - rxAnalog[i-1]) / 2;
          const rj = randn_bm() * jitterRandom;
          const dj = Math.sin(i * 0.1) * jitterDeterministic; 
          const dt = rj + dj;
          return v + slope * dt;
      });
  }

  // B2. Apply RX CTLE (Analog EQ)
  // Simple 1st-order High-Pass Model: y[n] = G * (x[n] - alpha * x[n-1])
  // Designed to match DC Gain and Nyquist Peaking specifications.
  if (useCtle) {
      const R = Math.pow(10, ctlePeaking / 20); // Peaking Ratio (Linear)
      const alpha = (R - 1) / (R + 1); // Zero location parameter
      const dcGainLin = Math.pow(10, ctleGain / 20); // Target DC Gain (Linear)
      const G = dcGainLin / (1 - alpha); // Normalization factor to preserve DC Gain
      
      const ctleOut = new Array(rxAnalog.length).fill(0);
      let prev = 0;
      // Initialize prev with first sample to avoid transient
      if (rxAnalog.length > 0) prev = rxAnalog[0];

      for(let i=0; i<rxAnalog.length; i++) {
          const curr = rxAnalog[i];
          ctleOut[i] = G * (curr - alpha * prev);
          prev = curr;
      }
      rxAnalog = ctleOut;
  }

  // C. ADC Quantization
  if (adcBits > 0) {
      rxAnalog = rxAnalog.map(v => quantize(v, adcBits));
  }

  const rxSignalRaw = [...rxAnalog]; // Store for display

  // 6. Equalizer Processing (FFE + DFE)
  // When using LMS, we process symbol-by-symbol for both FFE and DFE
  let rxSignalEq: number[] = [];
  let rxSignalDfe: number[] = [];
  const decisions: number[] = new Array(rxSignalRaw.length).fill(0);

  if (useEqualizer) {
    if (useLms) {
        // --- Adaptive LMS Mode (Joint or Separate) ---
        const numFfeTaps = equalizerTaps.length;
        const numDfeTaps = dfeTaps.length;
        
        // Mutable tap arrays for this run
        const currentFfeTaps = [...equalizerTaps]; 
        const currentDfeTaps = [...dfeTaps];
        
        rxSignalEq = new Array(rxSignalRaw.length).fill(0);
        rxSignalDfe = new Array(rxSignalRaw.length).fill(0);
        
        for (let i = 0; i < rxSignalRaw.length; i++) {
            // A. FFE Output
            let y_ffe = 0;
            for (let j = 0; j < numFfeTaps; j++) {
                const inputIdx = i - j;
                if (inputIdx >= 0 && inputIdx < rxSignalRaw.length) {
                    y_ffe += rxSignalRaw[inputIdx] * currentFfeTaps[j];
                }
            }
            rxSignalEq[i] = y_ffe;

            // B. DFE Feedback Subtraction
            // DFE subtracts post-cursors based on previous *decisions*
            let y_dfe_val = y_ffe;
            let feedback = 0;
            if (useDfe && numDfeTaps > 0) {
                for (let k = 0; k < numDfeTaps; k++) {
                    const decIdx = i - (k + 1);
                    if (decIdx >= 0) {
                         // Feedback is sum(h_dfe[k] * decision[n-k-1])
                         feedback += currentDfeTaps[k] * decisions[decIdx];
                    }
                }
                y_dfe_val = y_ffe - feedback;
            }
            rxSignalDfe[i] = y_dfe_val;

            // C. Decision (Slicer) with Threshold Offset
            // Note: LMS typically trains towards ideal levels, so we apply threshold at decision time
            const decision = sliceSymbol(y_dfe_val, pamType, rxThreshold);
            decisions[i] = decision;

            // D. Error Calculation
            const error = decision - y_dfe_val;

            // E. Weight Update (LMS)
            
            // Update FFE Taps
            // w[n+1] = w[n] + mu * e[n] * x[n]
            for (let j = 0; j < numFfeTaps; j++) {
                const inputIdx = i - j;
                if (inputIdx >= 0 && inputIdx < rxSignalRaw.length) {
                    currentFfeTaps[j] += lmsStepSize * error * rxSignalRaw[inputIdx];
                }
            }

            // Update DFE Taps (if enabled)
            if (useDfe && adaptDfe && numDfeTaps > 0) {
                for (let k = 0; k < numDfeTaps; k++) {
                    const decIdx = i - (k + 1);
                    if (decIdx >= 0) {
                         currentDfeTaps[k] -= lmsStepSize * error * decisions[decIdx];
                    }
                }
            }
        }
        
    } else {
        // --- Fixed Taps Mode ---
        // 1. FFE
        rxSignalEq = convolve(rxSignalRaw, equalizerTaps);
        
        // 2. DFE
        rxSignalDfe = [...rxSignalEq];
        if (useDfe && dfeTaps.length > 0) {
             for (let i = 0; i < rxSignalEq.length; i++) {
                let feedback = 0;
                for (let tapIdx = 0; tapIdx < dfeTaps.length; tapIdx++) {
                    const decIdx = i - (tapIdx + 1);
                    if (decIdx >= 0) {
                        feedback += decisions[decIdx] * dfeTaps[tapIdx];
                    }
                }
                const valAfterFeedback = rxSignalEq[i] - feedback;
                rxSignalDfe[i] = valAfterFeedback;
                decisions[i] = sliceSymbol(valAfterFeedback, pamType, rxThreshold);
            }
        } else {
            for(let i=0; i<rxSignalEq.length; i++) decisions[i] = sliceSymbol(rxSignalEq[i], pamType, rxThreshold);
        }
    }
  } else {
    rxSignalEq = [...rxSignalRaw];
    rxSignalDfe = [...rxSignalRaw];
    for(let i=0; i<rxSignalEq.length; i++) decisions[i] = sliceSymbol(rxSignalEq[i], pamType, rxThreshold);
  }

  // 7. Calculate Delays for Alignment (Simplified for BER check)
  const findPeakIndex = (arr: number[]) => arr.indexOf(Math.max(...arr));
  const channelDelay = findPeakIndex(channelResponse);
  const txDelay = useTxEqualizer ? findPeakIndex(txEqualizerTaps) : 0;
  const rxDelay = useEqualizer ? findPeakIndex(equalizerTaps) : 0;
  const totalDelay = channelDelay + txDelay + rxDelay;

  // 9. Error Counting (BER)
  let errors = 0;
  let comparedCount = 0;

  for (let i = 0; i < idealSymbols.length; i++) {
    const rxIdx = i + totalDelay;
    if (rxIdx >= rxSignalDfe.length) break;

    // Apply CDR Phase Offset for BER Check
    // We interpolate the value at the sampling point
    const y1 = rxSignalDfe[rxIdx];
    const y2 = rxIdx + 1 < rxSignalDfe.length ? rxSignalDfe[rxIdx+1] : y1;
    const yPrev = rxIdx - 1 >= 0 ? rxSignalDfe[rxIdx-1] : y1;
    
    let val = y1;
    if (rxTargetPhase !== 0) {
        if (rxTargetPhase > 0) {
            val = interpolate(y1, y2, rxTargetPhase * 2); // *2 because interpolate expects 0-1 for full interval, but here we are just shifting slightly? 
            // Actually interpolate(y1, y2, mu) where mu is 0..1. 
            // If rxTargetPhase is 0.5 UI, we want halfway.
            // My interpolate function: mu2 = (1 - cos(mu*PI))/2.
            // Let's just use linear for simplicity in phase offset to avoid confusion.
            // val = y1 * (1-rxTargetPhase) + y2 * rxTargetPhase;
            
            // Using the existing interpolate function:
            // It takes mu from 0 to 1.
            // rxTargetPhase is -0.5 to 0.5.
            // If > 0, we interpolate towards next sample.
            val = interpolate(y1, y2, rxTargetPhase);
        } else {
            val = interpolate(y1, yPrev, Math.abs(rxTargetPhase));
        }
    }

    const decided = sliceSymbol(val, pamType, rxThreshold);

    if (decided !== idealSymbols[i]) {
      errors++;
    }
    comparedCount++;
  }

  const ber = comparedCount > 0 ? errors / comparedCount : 0;

  // 10. Bathtub Curve (Using DFE Output)
  const bathtubData: BathtubPoint[] = [];
  const phases = [-0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5];
  const scanLimit = Math.min(idealSymbols.length, 1000); 

  phases.forEach(phase => { 
    let phaseErrors = 0;
    let phaseCount = 0;
    
    for (let i = 0; i < scanLimit - 1; i++) {
      const rxIdx = i + totalDelay;
      if (rxIdx >= rxSignalDfe.length - 1) break;
      
      const y1 = rxSignalDfe[rxIdx];
      const y2 = rxSignalDfe[rxIdx+1]; 
      
      let val = 0;
      if (phase >= 0) {
         val = interpolate(y1, y2, phase * 2);
      } else {
         const yPrev = rxSignalDfe[rxIdx-1] || 0;
         val = interpolate(y1, yPrev, Math.abs(phase) * 2);
      }

      const decided = sliceSymbol(val, pamType);
      if (decided !== idealSymbols[i]) {
        phaseErrors++;
      }
      phaseCount++;
    }
    
    bathtubData.push({
      offset: phase,
      ber: phaseCount > 0 ? Math.max(phaseErrors / phaseCount, 1e-12) : 1e-12
    });
  });

  // 11. Pulse Response Calc (Linear Part only - TX*CH*FFE)
  const txImpulse = useTxEqualizer ? txEqualizerTaps : [1.0];
  const rxImpulse = useEqualizer ? equalizerTaps : [1.0];
  const txAndChannel = convolve(channelResponse, txImpulse);
  let pulseResponse = convolve(txAndChannel, rxImpulse);
  
  return {
    txSymbols: txSignal,
    rxSignalRaw,
    rxSignalEq,
    rxSignalDfe, // The final signal
    bits,
    ber,
    bathtubData,
    pulseResponse
  };
};