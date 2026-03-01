import React from 'react';

export interface HelpContent {
  title: string;
  body: React.ReactNode;
}

export const HELP_TOPICS = {
  // --- Plot Topics ---
  EYE: {
    title: "Eye Diagram Theory",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>Eye Diagram</strong> is the fundamental tool for analyzing high-speed digital signals. 
          It is constructed by overlaying multiple "snapshots" of the signal, each showing 2 bit periods (Unit Intervals).
        </p>
        
        <h4 className="font-bold text-gray-900 dark:text-white mt-4 border-b border-gray-200 dark:border-gray-700 pb-1">Key Metrics</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Eye Height (Vertical Opening):</strong> Represents the noise margin. A taller eye means the system can tolerate more voltage noise without errors.</li>
          <li><strong>Eye Width (Horizontal Opening):</strong> Represents the timing margin. A wider eye means the system is robust against clock jitter.</li>
        </ul>

        <h4 className="font-bold text-gray-900 dark:text-white mt-4 border-b border-gray-200 dark:border-gray-700 pb-1">Calculation</h4>
        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md font-mono text-xs overflow-x-auto border border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400 mb-1">// Modulo time wrapping</p>
          <p>t_plot = t_absolute % (2 * Unit_Interval)</p>
        </div>
        <p className="italic text-xs text-gray-500">
          An "Open Eye" allows the receiver to easily distinguish between 0 and 1. A "Closed Eye" results in Bit Errors.
        </p>
      </div>
    )
  },
  OSCILLOSCOPE: {
    title: "Transient Response (Oscilloscope)",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>Transient Response</strong> shows the actual voltage waveform over time as it arrives at the receiver. 
          Unlike the Eye Diagram, this is a continuous stream of data.
        </p>

        <h4 className="font-bold text-gray-900 dark:text-white mt-4 border-b border-gray-200 dark:border-gray-700 pb-1">Signal Model</h4>
        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md font-mono text-xs overflow-x-auto border border-gray-200 dark:border-slate-700">
          <p>y[n] = (x * h)[n] + Noise[n]</p>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-xs mt-2">
          <li><strong>x:</strong> Transmitted Bits (+1/-1)</li>
          <li><strong>h:</strong> Channel Impulse Response</li>
          <li><strong>*:</strong> Convolution Operation</li>
        </ul>

        <p>
          This view is useful for spotting <strong>Pattern Dependent Jitter (PDJ)</strong>, where specific sequences of bits (e.g., 101 vs 111) cause different voltage levels due to the channel's memory (ISI).
        </p>
      </div>
    )
  },
  PULSE: {
    title: "Pulse Response (Single Bit)",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>Pulse Response</strong> shows what happens when a single "1" bit is transmitted surrounded by "0"s. 
          It characterizes the channel's memory, also known as Inter-Symbol Interference (ISI).
        </p>

        <h4 className="font-bold text-gray-900 dark:text-white mt-4 border-b border-gray-200 dark:border-gray-700 pb-1">Components</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Main Cursor (Peak):</strong> The energy of the current bit. We want this to be maximized (usually normalized to 1.0).</li>
          <li><strong>Pre-Cursor ISI:</strong> Energy arriving <em>before</em> the peak (due to dispersion).</li>
          <li><strong>Post-Cursor ISI:</strong> Energy trailing <em>after</em> the peak (reflections, capacitance). This corrupts future bits.</li>
        </ul>

        <h4 className="font-bold text-gray-900 dark:text-white mt-4 border-b border-gray-200 dark:border-gray-700 pb-1">Equation</h4>
        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md font-mono text-xs overflow-x-auto border border-gray-200 dark:border-slate-700">
          <p>h_effective = h_channel * h_equalizer</p>
        </div>
        <p className="text-xs"> Ideally, the result is a perfect spike (Delta function). The Equalizer tries to shape the channel response into this ideal form.</p>
      </div>
    )
  },
  BATHTUB: {
    title: "Bathtub Curve (BER vs Phase)",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>Bathtub Curve</strong> visualizes the Bit Error Rate (BER) as we shift the sampling clock phase across the bit period (Unit Interval).
        </p>

        <h4 className="font-bold text-gray-900 dark:text-white mt-4 border-b border-gray-200 dark:border-gray-700 pb-1">Why "Bathtub"?</h4>
        <p>
          The curve resembles the cross-section of a bathtub. The flat "bottom" represents the safe sampling window where errors are minimal. The steep "walls" represent the transition regions where errors spike.
        </p>

        <h4 className="font-bold text-gray-900 dark:text-white mt-4 border-b border-gray-200 dark:border-gray-700 pb-1">Math Estimation</h4>
        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md font-mono text-xs overflow-x-auto border border-gray-200 dark:border-slate-700">
           <p>BER(t) ≈ 0.5 * erfc( Signal(t) / (σ_noise * √2) )</p>
        </div>
        
        <p className="text-xs mt-2">
          <strong>Horizontal Opening:</strong> The width of the curve at a specific BER (e.g., 1e-12) tells us the total jitter budget.
        </p>
      </div>
    )
  },

  // --- Pipeline Module Topics ---
  MODULE_GEN: {
    title: "PRBS Generator",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>PRBS (Pseudo-Random Bit Sequence)</strong> generator creates the test data pattern for the simulation.
        </p>
        <p>
          In real labs, we don't just send "0000" or "1010". We send complex, random-looking patterns (like PRBS-7 or PRBS-31) that repeat after a very long time. This ensures we test every possible combination of bits (e.g., a lone "1" after many "0"s, or a "010101" clock pattern) to stress the system.
        </p>
        <div className="bg-gray-100 dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700">
             <strong className="text-xs uppercase text-gray-500">Key Concept:</strong>
             <p className="text-xs font-medium">Randomness ensures we find "worst-case" patterns that cause errors.</p>
        </div>
      </div>
    )
  },
  MODULE_TX: {
    title: "TX FIR (Transmitter Equalizer)",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>TX FIR</strong> (Finite Impulse Response) filter pre-distorts the signal before it enters the channel.
        </p>
        <h4 className="font-bold text-gray-900 dark:text-white mt-2">Mechanism</h4>
        <p>
           It typically uses "De-emphasis" or "Pre-emphasis". By lowering the voltage of low-frequency bits (long strings of 1s or 0s) and boosting transitions, it counteracts the Low-Pass nature of the channel.
        </p>
        <div className="bg-gray-100 dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700 mt-2">
             <strong className="text-xs uppercase text-gray-500">Key Term:</strong>
             <p className="text-xs font-medium">Pre-cursor / Post-cursor: Taps that affect the bit before or after the main bit to cancel ISI.</p>
        </div>
      </div>
    )
  },
  MODULE_CHANNEL: {
    title: "Channel (Transmission Medium)",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>Channel</strong> represents the physical path the signal travels, such as a PCB trace, connector, or copper cable.
        </p>
        <h4 className="font-bold text-gray-900 dark:text-white mt-2">Impairments</h4>
        <ul className="list-disc pl-5 space-y-1">
            <li>
                <strong>Insertion Loss (Low-Pass Filter):</strong> The channel blocks fast signal changes, causing pulses to spread out and interfere with neighbors (ISI).
            </li>
            <li>
                <strong>Noise (AWGN):</strong> Random electrical noise from thermal effects or other electronics is added to the signal as it travels.
            </li>
        </ul>
        <div className="bg-gray-100 dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700 mt-2">
             <strong className="text-xs uppercase text-gray-500">Key Term:</strong>
             <p className="text-xs font-medium">ISI (Inter-Symbol Interference): When energy from one bit spills over into the next, closing the eye.</p>
        </div>
      </div>
    )
  },
  MODULE_RX_EQ: {
    title: "RX FFE (Feed-Forward Equalizer)",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>FFE</strong> is a linear digital filter inside the receiver designed to undo the damage caused by the channel.
        </p>
        <h4 className="font-bold text-gray-900 dark:text-white mt-2">How it works</h4>
        <p>
            Since the channel acts like a Low-Pass filter (blurring signal), the Equalizer acts like a High-Pass filter (sharpening signal).
        </p>
        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md font-mono text-xs overflow-x-auto border border-gray-200 dark:border-slate-700">
          <p>y[n] = c_0*x[n] - c_1*x[n-1]</p>
        </div>
        <p>
            <strong>Downside:</strong> Because it boosts high frequencies to recover the signal, it also boosts high-frequency noise!
        </p>
      </div>
    )
  },
  MODULE_RX_DFE: {
    title: "RX DFE (Decision Feedback Equalizer)",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>DFE</strong> is a non-linear equalizer that uses the <em>history of resolved bits</em> to cancel ISI.
        </p>
        <h4 className="font-bold text-gray-900 dark:text-white mt-2">The Magic</h4>
        <p>
            Unlike FFE, DFE does not amplify noise. It looks at the previous bit (which we already decided was a '1' or '0'), calculates how much "tail" that bit left behind, and subtracts exactly that amount from the current signal.
        </p>
        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md font-mono text-xs overflow-x-auto border border-gray-200 dark:border-slate-700">
          <p>y[n] = x[n] - (Tap_1 * Decision[n-1])</p>
        </div>
        <p className="mt-2 text-orange-500 dark:text-orange-400 font-medium text-xs">
            Risk: Error Propagation. If the DFE makes a wrong decision on bit N, it will subtract the wrong amount from bit N+1, likely causing another error.
        </p>
      </div>
    )
  },
  MODULE_RX_SLICER: {
    title: "CDR & Slicer (Receiver Decision)",
    body: (
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong>CDR (Clock Data Recovery)</strong> and <strong>Slicer</strong> are the final decision makers.
        </p>
        <ul className="list-disc pl-5 space-y-1">
            <li><strong>CDR:</strong> Figures out <em>when</em> to measure the signal. It tries to align the sampling clock to the center of the "eye" (maximum opening).</li>
            <li><strong>Slicer:</strong> Measures the voltage at that instant and decides if it is a 0 or 1.</li>
        </ul>
        <p className="mt-2 text-red-500 dark:text-red-400 font-medium text-xs">
            If the eye is closed due to noise or ISI, the slicer will guess wrong. This is a Bit Error.
        </p>
      </div>
    )
  }
};

interface InfoModalProps {
  content: HelpContent | null;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ content, onClose }) => {
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-lg shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        <div className="bg-gray-50 dark:bg-slate-950 p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800 dark:text-white">{content.title}</h2>
            <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            {content.body}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800">
            <button 
                onClick={onClose}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors shadow-sm"
            >
                Got it
            </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;