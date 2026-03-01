import { PamType, SimulationParams, BlockDefinition } from './types';

export const DEFAULT_PARAMS: SimulationParams = {
  pamType: PamType.PAM2,
  dataRateGbps: 10,
  channelResponse: [0.05, 0.8, 0.4, 0.1, 0.05, 0.0, -0.05], // More realistic ISI
  equalizerTaps: [0.0, 1.0, 0.0], // RX Pass-through initially
  txEqualizerTaps: [0.0, 1.0, -0.2], // TX Pre-emphasis default
  dfeTaps: [0.0], // DFE disabled by default
  
  // Impairments defaults
  noiseLevel: 0.015, // 15mV RMS
  jitterRandom: 0.02, // 0.02 UI RMS
  jitterDeterministic: 0.00, // 0 UI
  adcBits: 0, // 0 means Ideal (Infinite precision)

  useEqualizer: true,
  useLms: false,
  adaptDfe: false, // Default to separate training (FFE only first)
  lmsStepSize: 0.01,

  useTxEqualizer: true,
  useDfe: true,

  // TX DAC Config
  txVoltageSwing: 1.0, // 1.0 Vpp
  txRiseTime: 0.0, // 0 UI (Ideal)

  // RX CDR/Slicer Config
  rxTargetPhase: 0.0, // 0 UI Offset
  rxThreshold: 0.0, // 0 V Offset

  // RX CTLE Config
  useCtle: true,
  ctleGain: 0, // 0 dB DC Gain
  ctlePeaking: 3, // 3 dB Peaking at Nyquist
};

// Enhanced SVG paths for technical icons (Industrial/Abstract Design)
export const ICONS = {
  // PRBS: Circle
  CPU: "M12 2a10 10 0 1 0 10 10a10 10 0 0 0 -10 -10",
  
  // TX FIR: Triangle (Right)
  WAVE: "M4 4l16 8l-16 8z",
  
  // Channel: Rectangle (Wide)
  RESISTOR: "M2 8h20v8h-20z",
  
  // RX CTLE: Triangle (Right)
  AMPLIFIER: "M4 4l16 8l-16 8z",

  // RX FFE: 3 Squares
  FILTER: "M2 10h5v5h-5z M9.5 10h5v5h-5z M17 10h5v5h-5z",
  
  // RX DFE: Pentagon
  FEEDBACK: "M12 2l9.5 6.9l-3.6 11.1h-11.8l-3.6 -11.1z",
  
  // Slicer: Diamond
  EYE: "M12 2l10 10l-10 10l-10 -10z",
  
  // Digital to Analog (Staircase)
  DAC: "M2 20h4v-4h4v-4h4v-4h4v-4",
  
  // Analog to Digital (Grid)
  ADC: "M4 4h16v16h-16z M4 12h16 M12 4v16",
};

export const BLOCKS: BlockDefinition[] = [
  { 
    id: 'gen', 
    name: 'Data Source', 
    iconPath: ICONS.CPU, 
    description: 'Pseudo-Random Bit Sequence Generator (PRBS-7/31). Creates the test pattern.', 
    type: 'generator' 
  },
  { 
    id: 'tx', 
    name: 'TX FIR', 
    iconPath: ICONS.WAVE, 
    description: 'Transmitter Feed-Forward Equalizer. Pre-distorts signal to counter channel loss.', 
    type: 'tx' 
  },
  { 
    id: 'tx_dac', 
    name: 'TX DAC', 
    iconPath: ICONS.DAC, 
    description: 'Digital-to-Analog Converter. Transforms digital tap values into physical voltage levels.', 
    type: 'tx' 
  },
  { 
    id: 'channel', 
    name: 'Channel', 
    iconPath: ICONS.RESISTOR, 
    description: 'Includes ISI, Voltage Noise (AWGN), and Timing Jitter (RJ/DJ).', 
    type: 'channel' 
  },
  {
    id: 'rx_ctle',
    name: 'RX CTLE',
    iconPath: ICONS.AMPLIFIER,
    description: 'Continuous Time Linear Equalizer. Analog filter that boosts high frequencies before the ADC.',
    type: 'rx'
  },
  { 
    id: 'rx_adc', 
    name: 'RX ADC', 
    iconPath: ICONS.ADC, 
    description: 'Analog-to-Digital Converter. Samples and quantizes the incoming waveform.', 
    type: 'rx' 
  },
  { 
    id: 'rx_eq', 
    name: 'RX FFE', 
    iconPath: ICONS.FILTER, 
    description: 'Feed-Forward Equalizer. Includes LMS Adaptation logic.', 
    type: 'rx' 
  },
  { 
    id: 'rx_dfe', 
    name: 'RX DFE', 
    iconPath: ICONS.FEEDBACK, 
    description: 'Decision Feedback Equalizer. Uses past bits to subtract post-cursor ISI without noise amplification.', 
    type: 'rx' 
  },
  { 
    id: 'rx_slicer', 
    name: 'CDR/Slicer', 
    iconPath: ICONS.EYE, 
    description: 'Clock Data Recovery and Decision circuit. Recovers bits from analog waveform.', 
    type: 'rx' 
  },
];

export const SYSTEM_INSTRUCTION = `You are a Senior Signal Integrity Engineer explaining SerDes concepts to a junior engineer.
Be precise, professional, but accessible. Use standard terminology (ISI, Jitter, Insertion Loss, Nyquist, DFE, FFE, Quantization, LMS).
Explain the physics/math briefly if asked.
Keep responses concise (max 3 sentences) unless asked for details.
Context: The user is using a web-based SerDes simulator.`;
