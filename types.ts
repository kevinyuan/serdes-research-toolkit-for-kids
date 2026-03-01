export enum PamType {
  PAM2 = 'PAM2',
  PAM4 = 'PAM4',
}

export enum ActivityType {
  MODULATION = 'MODULATION',
  TX_EQ = 'TX_EQ',
  TX_DAC = 'TX_DAC',
  CHANNEL = 'CHANNEL',
  RX_CTLE = 'RX_CTLE',
  ADC = 'ADC',
  RX_EQ = 'RX_EQ',
  RX_DFE = 'RX_DFE',
  RX_SLICER = 'RX_SLICER',
}

export interface SimulationParams {
  pamType: PamType;
  dataRateGbps: number;
  channelResponse: number[]; // H[n] impulse response
  equalizerTaps: number[]; // RX FFE H_eq[n]
  txEqualizerTaps: number[]; // TX FIR taps
  dfeTaps: number[]; // RX DFE Feedback taps (h1, h2, h3...)
  
  // RX CTLE Config
  useCtle: boolean;
  ctleGain: number; // DC Gain (dB)
  ctlePeaking: number; // Peaking Gain (dB) at Nyquist
  
  // Impairments
  noiseLevel: number; // AWGN (RMS Voltage)
  jitterRandom: number; // RJ (RMS in Unit Interval)
  jitterDeterministic: number; // DJ (Peak-to-Peak in Unit Interval)
  adcBits: number; // ADC Resolution (0 = Ideal/Infinite)

  useEqualizer: boolean; // RX FFE enable
  useLms: boolean; // Enable Adaptive LMS mode
  adaptDfe: boolean; // Enable DFE adaptation during LMS
  lmsStepSize: number; // LMS Learning Rate (mu)
  
  useTxEqualizer: boolean; // TX FIR enable
  useDfe: boolean; // RX DFE enable

  // TX DAC Config
  txVoltageSwing: number; // Peak-to-Peak Voltage (Vpp)
  txRiseTime: number; // Rise/Fall Time (UI)

  // RX CDR/Slicer Config
  rxTargetPhase: number; // Sampling Phase Offset (UI)
  rxThreshold: number; // Decision Threshold Offset (V)
}

export interface BathtubPoint {
  offset: number; // UI offset (-0.5 to 0.5)
  ber: number;    // Bit Error Rate at this offset
}

export interface SimulationResult {
  txSymbols: number[]; // Now represents the actual Analog TX Output (possibly pre-emphasized)
  rxSignalRaw: number[]; // After channel + noise + jitter + ADC
  rxSignalEq: number[]; // After FFE
  rxSignalDfe: number[]; // After DFE (Final Analog value before slicing)
  bits: number[];
  ber: number;
  bathtubData: BathtubPoint[];
  pulseResponse: number[]; // The effective pulse response (TX * Channel * RX)
}

export interface BlockDefinition {
  id: string;
  name: string;
  description: string;
  iconPath: string; // SVG Path data
  type: 'generator' | 'tx' | 'channel' | 'rx' | 'analysis';
}