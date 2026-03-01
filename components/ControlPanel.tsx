import React, { useState, useEffect, useRef } from 'react';
import { SimulationParams, PamType, ActivityType } from '../types';
import { calculateZeroForcing } from '../services/dsp';

interface ControlPanelProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  activeActivity: ActivityType;
  onActivitySelect: (activity: ActivityType) => void;
}

interface InteractiveTapProps {
    value: number;
    onChange: (v: number) => void;
    active: boolean;
    label?: string; // Optional label for specific tap
}

// --- Reusable UI Components ---

const InteractiveTap: React.FC<InteractiveTapProps> = ({ value, onChange, active, label }) => {
    const [localText, setLocalText] = useState(value.toString());
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const MIN_VAL = -2.0; 
    const MAX_VAL = 2.0;

    useEffect(() => {
        setLocalText(value.toFixed(3));
    }, [value]);

    const handleCommit = () => {
        let parsed = parseFloat(localText);
        if (isNaN(parsed)) parsed = 0;
        if (parsed > 10) parsed = 10;
        if (parsed < -10) parsed = -10;
        onChange(parsed);
        setLocalText(parsed.toFixed(3));
    };

    const updateValue = (clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const y = clientY - rect.top;
        const height = rect.height;
        let newVal = MAX_VAL - (y / height) * (MAX_VAL - MIN_VAL);
        if (newVal > MAX_VAL) newVal = MAX_VAL;
        if (newVal < MIN_VAL) newVal = MIN_VAL;
        if (Math.abs(newVal) < 0.02) newVal = 0;
        onChange(newVal);
    };

    const onPointerDown = (e: React.PointerEvent) => {
        if (!active) return;
        isDragging.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateValue(e.clientY);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || !active) return;
        updateValue(e.clientY);
    };
    const onPointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const range = MAX_VAL - MIN_VAL;
    const norm = (value - MIN_VAL) / range;
    const clampedNorm = Math.max(0, Math.min(1, norm));
    const thumbTopPct = (1 - clampedNorm) * 100;
    
    const zeroNorm = (0 - MIN_VAL) / range;
    const barTop = value > 0 ? thumbTopPct : zeroNorm * 100;
    const barHeight = Math.abs(norm - zeroNorm) * 100;

    return (
        <div className={`flex flex-col items-center gap-2 ${!active ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
             <div 
                ref={containerRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="relative w-8 h-32 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-sm cursor-ns-resize hover:bg-gray-50 dark:hover:bg-slate-700 group transition-colors"
             >
                <div className="absolute top-1/2 left-0 w-full h-px bg-gray-300 dark:bg-slate-600"></div>
                <div 
                    className="absolute w-full bg-blue-200/50 dark:bg-blue-500/30"
                    style={{ top: `${barTop}%`, height: `${barHeight}%` }}
                ></div>
                <div 
                    className="absolute left-0 w-full h-1 bg-blue-600 dark:bg-blue-400 shadow-sm transition-transform group-hover:scale-x-110"
                    style={{ top: `${thumbTopPct}%`, transform: 'translateY(-50%)' }}
                ></div>
             </div>
             {label && <span className="text-[9px] font-bold text-gray-500">{label}</span>}
             <input
                type="text"
                disabled={!active}
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleCommit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(); }}
                className="w-12 text-center text-[10px] border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 rounded-sm py-0.5 text-gray-700 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-colors"
             />
        </div>
    )
};

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; subLabel?: string }> = ({ label, checked, onChange, disabled, subLabel }) => (
    <label className={`flex items-center justify-between gap-3 cursor-pointer group select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex flex-col">
            <span className="text-[10px] font-medium text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-200 transition-colors">{label}</span>
            {subLabel && <span className="text-[9px] text-gray-400 dark:text-slate-500">{subLabel}</span>}
        </div>
        <div className="relative">
            <input 
                type="checkbox" 
                className="sr-only" 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)} 
                disabled={disabled}
            />
            <div className={`w-8 h-4 rounded-full shadow-inner transition-colors duration-200 ease-in-out ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}></div>
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
        </div>
    </label>
);

// ... (previous imports)

const CollapsibleSection: React.FC<{ 
    title: string; 
    subtitle?: string;
    children: React.ReactNode; 
    defaultOpen?: boolean;
    isActive: boolean;
    onToggle: () => void;
    isOpen: boolean;
    onInteract?: () => void;
}> = ({ title, subtitle, children, isActive, onToggle, isOpen, onInteract }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isActive && ref.current) {
             setTimeout(() => {
                ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }, 100);
        }
    }, [isActive]);

    return (
        <div 
            ref={ref} 
            className={`
                border-b border-gray-200 dark:border-slate-800 transition-all duration-300
                ${isActive 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-600 dark:border-l-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-900 border-l-4 border-l-transparent'
                }
            `}
            onClickCapture={onInteract}
        >
            <button 
                onClick={onToggle}
                className={`w-full flex justify-between items-center p-2 text-left transition-colors ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-slate-300'}`}
            >
                <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs uppercase tracking-wider block ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-slate-200'}`}>{title}</span>
                    {subtitle && <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal hidden sm:inline-block">- {subtitle}</span>}
                </div>
                <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            <div 
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-2 bg-white/50 dark:bg-slate-950/50">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Standardized List Component for Taps
interface TapListProps {
    values: number[];
    onUpdate: (index: number, val: number) => void;
    active: boolean;
    onAdd?: () => void;
    labels?: string[];
}

const TapList: React.FC<TapListProps> = ({ values, onUpdate, active, onAdd, labels }) => (
    <div className="w-full overflow-x-auto pb-4 pt-2">
        <div className="flex items-start gap-1 min-w-max">
            {values.map((val, i) => (
                <InteractiveTap 
                    key={i} 
                    value={val} 
                    onChange={(v) => onUpdate(i, v)} 
                    active={active} 
                    label={labels ? labels[i] : undefined}
                />
            ))}
            {onAdd && (
                 <div className="flex flex-col items-center">
                    <button 
                        onClick={onAdd}
                        className="w-8 h-32 flex items-center justify-center border border-dashed border-gray-300 dark:border-slate-700 rounded-sm text-gray-400 dark:text-slate-600 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                        title="Add Tap"
                    >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                    {/* Spacer to align with input fields of taps */}
                    <div className="h-7 w-full"></div>
                </div>
            )}
        </div>
    </div>
);

// --- Main Component ---

const ControlPanel: React.FC<ControlPanelProps> = ({ params, setParams, activeActivity, onActivitySelect }) => {
  const [prevChannel, setPrevChannel] = useState<number[]>([0.05, 0.8, 0.4, 0.1, 0.05, 0.0, -0.05]);
  const [prevNoise, setPrevNoise] = useState(0.015);
  
  // State to track open sections. Initialize all to true.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
      [ActivityType.MODULATION]: true,
      [ActivityType.TX_EQ]: true,
      [ActivityType.TX_DAC]: true,
      [ActivityType.CHANNEL]: true,
      [ActivityType.RX_CTLE]: true,
      [ActivityType.ADC]: true,
      [ActivityType.RX_EQ]: true,
      [ActivityType.RX_DFE]: true,
      [ActivityType.RX_SLICER]: true,
  });

  // Ensure active section is open when it becomes active
  useEffect(() => {
      if (activeActivity) {
          setOpenSections(prev => ({ ...prev, [activeActivity]: true }));
      }
  }, [activeActivity]);

  const isIdeal = params.channelResponse.length === 5 && 
                  Math.abs(params.channelResponse[0] - 1.0) < 0.001 && 
                  params.channelResponse.slice(1).every(v => Math.abs(v) < 0.001) &&
                  params.noiseLevel === 0;

  // --- Handlers ---

  const updateChannel = (i: number, v: number) => {
    const arr = [...params.channelResponse];
    arr[i] = v;
    setParams({ ...params, channelResponse: arr });
  };

  const addChannelTap = () => {
        if (params.channelResponse.length >= 20) return;
        const arr = [...params.channelResponse, 0];
        setParams(p => ({...p, channelResponse: arr }));
  };

  const updateChannelCount = (count: number) => {
      let newCount = Math.max(1, Math.min(20, count));
      const current = params.channelResponse;
      let newArr = [...current];
      if (newCount > current.length) {
          const added = new Array(newCount - current.length).fill(0);
          newArr = [...newArr, ...added];
      } else if (newCount < current.length) {
          newArr = newArr.slice(0, newCount);
      }
      setParams({...params, channelResponse: newArr});
  };

  const updateRxEq = (i: number, v: number) => {
    const arr = [...params.equalizerTaps];
    arr[i] = v;
    setParams({ ...params, equalizerTaps: arr });
  };
  
  const addRxEqTap = () => {
      if (params.equalizerTaps.length >= 20) return;
      let newTaps = [...params.equalizerTaps, 0];
      setParams({ ...params, equalizerTaps: newTaps });
  };

  const updateTxEq = (i: number, v: number) => {
    const arr = [...params.txEqualizerTaps];
    arr[i] = v;
    setParams({ ...params, txEqualizerTaps: arr });
  };

  const addTxEqTap = () => {
    if (params.txEqualizerTaps.length >= 10) return;
    const arr = [...params.txEqualizerTaps, 0];
    setParams({ ...params, txEqualizerTaps: arr });
  };

  const updateDfeTap = (i: number, v: number) => {
      const arr = [...params.dfeTaps];
      arr[i] = v;
      setParams({ ...params, dfeTaps: arr });
  };
  
  const addDfeTap = () => {
      if (params.dfeTaps.length >= 5) return;
      const arr = [...params.dfeTaps, 0];
      setParams({ ...params, dfeTaps: arr });
  };

  const updateRxEqCount = (count: number) => {
      let newCount = Math.max(1, Math.min(20, count));
      let newTaps: number[];
      
      const current = params.equalizerTaps;
      newTaps = [...current];
      if (newCount > current.length) {
          const added = new Array(newCount - current.length).fill(0);
          newTaps = [...newTaps, ...added];
      } else if (newCount < current.length) {
          newTaps = newTaps.slice(0, newCount);
      }
      
      setParams({...params, equalizerTaps: newTaps});
  };

  const updateTxEqCount = (count: number) => {
    let newCount = Math.max(1, Math.min(10, count));
    const current = params.txEqualizerTaps;
    let newTaps = [...current];
    if (newCount > current.length) {
        const added = new Array(newCount - current.length).fill(0);
        newTaps = [...newTaps, ...added];
    } else if (newCount < current.length) {
        newTaps = newTaps.slice(0, newCount);
    }
    setParams({...params, txEqualizerTaps: newTaps});
  };

  const updateDfeCount = (count: number) => {
      let newCount = Math.max(1, Math.min(5, count)); // DFE usually 1-5 taps
      const current = params.dfeTaps;
      let newTaps = [...current];
      if (newCount > current.length) {
          const added = new Array(newCount - current.length).fill(0);
          newTaps = [...newTaps, ...added];
      } else if (newCount < current.length) {
          newTaps = newTaps.slice(0, newCount);
      }
      setParams({...params, dfeTaps: newTaps});
  };

  const handleRetrain = () => {
      const zfTaps = calculateZeroForcing(params.channelResponse, params.equalizerTaps.length);
      setParams(p => ({ ...p, equalizerTaps: zfTaps }));
  };

  const handleEnableFfeToggle = (enabled: boolean) => {
      setParams(p => ({...p, useEqualizer: enabled}));
  };
  
  const handleLmsToggle = (enabled: boolean) => {
      setParams(p => ({...p, useLms: enabled}));
  };

  const toggleIdeal = (e: React.ChangeEvent<HTMLInputElement>) => {
      const ideal = e.target.checked;
      let newChannel: number[];
      if (ideal) {
          setPrevChannel([...params.channelResponse]);
          setPrevNoise(params.noiseLevel);
          newChannel = [1.0, 0.0, 0.0, 0.0, 0.0];
          setParams(p => ({ ...p, channelResponse: newChannel, noiseLevel: 0 }));
      } else {
          newChannel = (prevChannel && prevChannel.length > 0 && !(prevChannel[0]===1 && prevChannel[1]===0)) 
                          ? prevChannel 
                          : [0.05, 0.8, 0.4, 0.1, 0.05, 0.0, -0.05];
          setParams(p => ({ ...p, channelResponse: newChannel, noiseLevel: prevNoise }));
      }
  };

  const renderModulation = () => (
      <div className="space-y-6">
          {/* SectionHeader removed */}
          <div>
              <label className="text-[10px] font-medium text-gray-500 dark:text-slate-500 uppercase mb-2 block">Signaling Mode</label>
              <div className="flex rounded-sm overflow-hidden border border-gray-300 dark:border-slate-700">
                  <button
                      onClick={() => setParams(p => ({ ...p, pamType: PamType.PAM2 }))}
                      className={`flex-1 py-2 text-xs font-bold transition-colors ${params.pamType === PamType.PAM2 ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                  >
                      NRZ (PAM-2)
                  </button>
                  <div className="w-px bg-gray-300 dark:bg-slate-700"></div>
                  <button
                      onClick={() => setParams(p => ({ ...p, pamType: PamType.PAM4 }))}
                      className={`flex-1 py-2 text-xs font-bold transition-colors ${params.pamType === PamType.PAM4 ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                  >
                      PAM-4
                  </button>
              </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded border border-blue-100 dark:border-blue-900/30">
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>NRZ</strong> sends 1 bit per symbol (+1V / -1V).<br/>
                  <strong>PAM-4</strong> sends 2 bits per symbol (+3V, +1V, -1V, -3V), doubling data rate at the cost of signal-to-noise ratio.
              </p>
          </div>
      </div>
  );

  const renderTxEq = () => (
      <div className="space-y-6">
          {/* SectionHeader removed */}
          <div className="flex justify-between items-center">
              <ToggleSwitch 
                label="Enable TX FIR" 
                checked={params.useTxEqualizer} 
                onChange={(checked) => setParams(p => ({...p, useTxEqualizer: checked}))} 
              />
              
              <div className={`flex items-center gap-2 transition-opacity ${!params.useTxEqualizer ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 uppercase">Taps</label>
                <input 
                    type="range"
                    min="1" max="10"
                    step="1"
                    value={params.txEqualizerTaps.length}
                    onChange={(e) => updateTxEqCount(parseInt(e.target.value))}
                    className="w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] font-mono font-bold w-4 text-right text-gray-700 dark:text-slate-300">{params.txEqualizerTaps.length}</span>
              </div>
          </div>

          <TapList 
            values={params.txEqualizerTaps} 
            onUpdate={updateTxEq} 
            active={params.useTxEqualizer} 
            onAdd={params.txEqualizerTaps.length < 10 ? addTxEqTap : undefined}
          />
          
          <p className="text-[10px] text-gray-400 italic">
              Use negative taps for de-emphasis to cancel post-cursor energy before it leaves the TX.
          </p>
      </div>
  );

  const renderTxDac = () => (
      <div className="space-y-6">
          {/* SectionHeader removed */}
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">Output Swing (Vpp)</label>
                  <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.txVoltageSwing.toFixed(2)} V</span>
              </div>
              <input
                  type="range" min="0.5" max="1.5" step="0.05" value={params.txVoltageSwing}
                  onChange={(e) => setParams(p => ({ ...p, txVoltageSwing: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">Rise/Fall Time (Bandwidth)</label>
                  <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.txRiseTime.toFixed(2)} UI</span>
              </div>
              <input
                  type="range" min="0.0" max="0.5" step="0.01" value={params.txRiseTime}
                  onChange={(e) => setParams(p => ({ ...p, txRiseTime: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[9px] text-gray-400 mt-2">Simulates limited bandwidth of the DAC driver.</p>
          </div>
      </div>
  );

  const renderChannel = () => (
      <div className="space-y-6">
          {/* SectionHeader removed */}
          
          <div className="flex justify-between items-center pb-2">
            <div className="flex flex-col">
                <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 uppercase">Impulse Response</label>
                <label className="inline-flex items-center cursor-pointer group mt-1">
                    <span className="mr-2 text-[10px] font-medium text-gray-500 dark:text-slate-500">Ideal</span>
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={isIdeal} onChange={toggleIdeal} />
                        <div className={`w-8 h-4 rounded-full shadow-inner transition-colors ${isIdeal ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}></div>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transform transition-transform ${isIdeal ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                </label>
            </div>
            
            <div className="flex items-center gap-2">
                <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 uppercase">Taps</label>
                <input 
                    type="range" min="1" max="20" step="1"
                    value={params.channelResponse.length}
                    onChange={(e) => updateChannelCount(parseInt(e.target.value))}
                    className="w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                 <span className="text-[10px] font-mono font-bold w-4 text-right text-gray-700 dark:text-slate-300">{params.channelResponse.length}</span>
             </div>
        </div>

        <TapList values={params.channelResponse} onUpdate={updateChannel} active={true} onAdd={params.channelResponse.length < 20 ? addChannelTap : undefined} />
        
        <div className={`space-y-4 transition-opacity ${isIdeal ? 'opacity-50' : ''}`}>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded border border-gray-200 dark:border-slate-800">
                <div className="flex justify-between mb-2">
                    <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">Noise (AWGN)</label>
                    <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.noiseLevel.toFixed(3)} V</span>
                </div>
                <input
                    type="range" min="0" max="0.2" step="0.005" value={params.noiseLevel} disabled={isIdeal}
                    onChange={(e) => setParams(p => ({ ...p, noiseLevel: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded border border-gray-200 dark:border-slate-800">
                    <div className="flex justify-between mb-2">
                        <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">RJ (Random Jitter)</label>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.jitterRandom.toFixed(3)} UI</span>
                    </div>
                    <input
                        type="range" min="0" max="0.2" step="0.005" value={params.jitterRandom}
                        onChange={(e) => setParams(p => ({ ...p, jitterRandom: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded border border-gray-200 dark:border-slate-800">
                    <div className="flex justify-between mb-2">
                        <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">DJ (Deterministic Jitter)</label>
                        <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.jitterDeterministic.toFixed(3)} UI</span>
                    </div>
                    <input
                        type="range" min="0" max="0.3" step="0.005" value={params.jitterDeterministic}
                        onChange={(e) => setParams(p => ({ ...p, jitterDeterministic: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                </div>
            </div>
        </div>
      </div>
  );

  const renderAdc = () => (
      <div className="space-y-6">
          {/* SectionHeader removed */}
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded border border-gray-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <ToggleSwitch label="Enable Quantization" checked={params.adcBits > 0} onChange={(checked) => setParams(p => ({...p, adcBits: checked ? 6 : 0}))} />
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                    {params.adcBits === 0 ? "Ideal (∞ Bits)" : `${params.adcBits} Bits`}
                </span>
            </div>
            
            <div className={`transition-opacity duration-200 ${params.adcBits === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between text-[9px] text-gray-500 mb-2">
                    <span>4 (Low Res)</span>
                    <span>16 (High Res)</span>
                </div>
                <input
                    type="range" min="4" max="16" step="1" value={params.adcBits === 0 ? 6 : params.adcBits}
                    onChange={(e) => setParams(p => ({...p, adcBits: parseInt(e.target.value)}))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
         </div>
      </div>
  );

  const renderRxEq = () => (
      <div className="space-y-6">
          {/* SectionHeader removed */}
          <div className="flex justify-between items-center">
             <ToggleSwitch label="Enable FFE" checked={params.useEqualizer} onChange={handleEnableFfeToggle} />
             <div className="flex items-center gap-2">
                <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 uppercase">Taps</label>
                <input type="range" min="1" max="20" step="1" value={params.equalizerTaps.length} onChange={(e) => updateRxEqCount(parseInt(e.target.value))} className="w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <span className="text-[10px] font-mono font-bold w-4 text-right text-blue-600 dark:text-blue-400">{params.equalizerTaps.length}</span>
             </div>
          </div>
          
          <div className={`bg-gray-50 dark:bg-slate-800/50 rounded border border-gray-200 dark:border-slate-800 p-4 transition-opacity ${!params.useEqualizer ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase">One-Shot Training</span>
                    <span className="text-[9px] text-gray-400">Zero-Forcing (ZF) Algo</span>
                 </div>
                 <button onClick={handleRetrain} disabled={!params.useEqualizer || params.useLms} className="px-4 py-1.5 text-[10px] font-bold rounded border bg-white hover:bg-blue-50 text-blue-600 border-blue-200 dark:bg-slate-950 dark:text-blue-400 dark:border-blue-900 transition-colors">Apply ZF</button>
              </div>
              <div className="h-px bg-gray-200 dark:bg-slate-700 mb-4"></div>
              <ToggleSwitch label="LMS Adaptation" subLabel="Continuous Learning" checked={params.useLms} onChange={handleLmsToggle} disabled={!params.useEqualizer} />
              {params.useLms && (
                <div className="mt-4 pl-2 border-l-2 border-blue-300 dark:border-blue-900">
                    <div className="flex justify-between mb-1">
                        <label className="text-[9px] font-bold text-gray-500">Step Size (μ)</label>
                        <span className="text-[9px] font-mono text-blue-600">{params.lmsStepSize.toFixed(4)}</span>
                    </div>
                    <input type="range" min="0.0001" max="0.05" step="0.0001" value={params.lmsStepSize} onChange={(e) => setParams(p => ({ ...p, lmsStepSize: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-blue-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                </div>
              )}
          </div>

          <TapList values={params.equalizerTaps} onUpdate={updateRxEq} active={params.useEqualizer} onAdd={params.equalizerTaps.length < 20 ? addRxEqTap : undefined} />
      </div>
  );

  const renderRxDfe = () => (
      <div className="space-y-6">
          {/* SectionHeader removed */}
          <div className="flex justify-between items-center">
             <ToggleSwitch label="Enable DFE" checked={params.useDfe} onChange={(checked) => setParams(p => ({...p, useDfe: checked}))} />
             <div className="flex items-center gap-2">
                <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400 uppercase">Taps</label>
                <input type="range" min="1" max="5" step="1" value={params.dfeTaps.length} onChange={(e) => updateDfeCount(parseInt(e.target.value))} className="w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <span className="text-[10px] font-mono font-bold w-4 text-right text-gray-700 dark:text-slate-300">{params.dfeTaps.length}</span>
             </div>
          </div>
          
          <div className={`bg-blue-50 dark:bg-blue-900/10 p-4 rounded border border-blue-100 dark:border-blue-900/30 transition-opacity ${!params.useDfe ? 'opacity-50' : ''}`}>
             <ToggleSwitch label="Adapt DFE Taps" subLabel="Link with LMS" checked={params.adaptDfe} onChange={(checked) => setParams(p => ({...p, adaptDfe: checked}))} disabled={!params.useDfe || !params.useLms} />
          </div>

          <TapList values={params.dfeTaps} onUpdate={updateDfeTap} active={params.useDfe} labels={params.dfeTaps.map((_, i) => `h${i+1}`)} onAdd={params.dfeTaps.length < 5 ? addDfeTap : undefined} />
      </div>
  );

  const renderRxSlicer = () => (
      <div className="space-y-6">
          {/* SectionHeader removed */}
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">Sampling Phase Offset</label>
                  <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.rxTargetPhase > 0 ? '+' : ''}{params.rxTargetPhase.toFixed(2)} UI</span>
              </div>
              <input
                  type="range" min="-0.5" max="0.5" step="0.01" value={params.rxTargetPhase}
                  onChange={(e) => setParams(p => ({ ...p, rxTargetPhase: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[9px] text-gray-400 mt-2">Manually adjust the CDR sampling point.</p>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">Decision Threshold Offset</label>
                  <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.rxThreshold > 0 ? '+' : ''}{params.rxThreshold.toFixed(3)} V</span>
              </div>
              <input
                  type="range" min="-0.2" max="0.2" step="0.005" value={params.rxThreshold}
                  onChange={(e) => setParams(p => ({ ...p, rxThreshold: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
          </div>
      </div>
  );

  const renderRxCtle = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <ToggleSwitch 
                label="Enable CTLE" 
                checked={params.useCtle} 
                onChange={(checked) => setParams(p => ({...p, useCtle: checked}))} 
              />
          </div>

          <div className={`space-y-4 transition-opacity ${!params.useCtle ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded border border-gray-200 dark:border-slate-800">
                  <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">DC Gain</label>
                      <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.ctleGain.toFixed(1)} dB</span>
                  </div>
                  <input
                      type="range" min="-12" max="0" step="0.5" value={params.ctleGain}
                      onChange={(e) => setParams(p => ({ ...p, ctleGain: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-[9px] text-gray-400 mt-2">Low frequency gain. Usually negative or 0 dB.</p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded border border-gray-200 dark:border-slate-800">
                  <div className="flex justify-between mb-2">
                      <label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase">Peaking (at Nyquist)</label>
                      <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">{params.ctlePeaking.toFixed(1)} dB</span>
                  </div>
                  <input
                      type="range" min="0" max="15" step="0.5" value={params.ctlePeaking}
                      onChange={(e) => setParams(p => ({ ...p, ctlePeaking: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-[9px] text-gray-400 mt-2">High frequency boost to compensate for channel loss.</p>
              </div>
          </div>
      </div>
  );

  return (
    <div className="w-full pb-24 px-0 pt-0 border-t border-gray-200 dark:border-slate-800">
      <CollapsibleSection 
          title="Data Source" 
          subtitle="Select signaling type and symbols"
          id={ActivityType.MODULATION}
          isActive={activeActivity === ActivityType.MODULATION}
          isOpen={openSections[ActivityType.MODULATION]}
          onToggle={() => toggleSection(ActivityType.MODULATION)}
          onInteract={() => onActivitySelect(ActivityType.MODULATION)}
      >
          {renderModulation()}
      </CollapsibleSection>

      <CollapsibleSection 
          title="TX FIR Equalizer" 
          subtitle="Pre-distort signal at the transmitter"
          id={ActivityType.TX_EQ}
          isActive={activeActivity === ActivityType.TX_EQ}
          isOpen={openSections[ActivityType.TX_EQ]}
          onToggle={() => toggleSection(ActivityType.TX_EQ)}
          onInteract={() => onActivitySelect(ActivityType.TX_EQ)}
      >
          {renderTxEq()}
      </CollapsibleSection>

      <CollapsibleSection 
          title="TX DAC" 
          subtitle="Digital to Analog Converter"
          id={ActivityType.TX_DAC}
          isActive={activeActivity === ActivityType.TX_DAC}
          isOpen={openSections[ActivityType.TX_DAC]}
          onToggle={() => toggleSection(ActivityType.TX_DAC)}
          onInteract={() => onActivitySelect(ActivityType.TX_DAC)}
      >
          {renderTxDac()}
      </CollapsibleSection>

      <CollapsibleSection 
          title="Channel Impairments" 
          subtitle="Physical media response and noise"
          id={ActivityType.CHANNEL}
          isActive={activeActivity === ActivityType.CHANNEL}
          isOpen={openSections[ActivityType.CHANNEL]}
          onToggle={() => toggleSection(ActivityType.CHANNEL)}
          onInteract={() => onActivitySelect(ActivityType.CHANNEL)}
      >
          {renderChannel()}
      </CollapsibleSection>

      <CollapsibleSection 
          title="RX CTLE" 
          subtitle="Analog Continuous Time Linear Equalizer"
          id={ActivityType.RX_CTLE}
          isActive={activeActivity === ActivityType.RX_CTLE}
          isOpen={openSections[ActivityType.RX_CTLE]}
          onToggle={() => toggleSection(ActivityType.RX_CTLE)}
          onInteract={() => onActivitySelect(ActivityType.RX_CTLE)}
      >
          {renderRxCtle()}
      </CollapsibleSection>

      <CollapsibleSection 
          title="RX Front-End (ADC)" 
          subtitle="Sampling and quantization"
          id={ActivityType.ADC}
          isActive={activeActivity === ActivityType.ADC}
          isOpen={openSections[ActivityType.ADC]}
          onToggle={() => toggleSection(ActivityType.ADC)}
          onInteract={() => onActivitySelect(ActivityType.ADC)}
      >
          {renderAdc()}
      </CollapsibleSection>

      <CollapsibleSection 
          title="RX FFE Equalizer" 
          subtitle="Linear Feed-Forward Equalizer"
          id={ActivityType.RX_EQ}
          isActive={activeActivity === ActivityType.RX_EQ}
          isOpen={openSections[ActivityType.RX_EQ]}
          onToggle={() => toggleSection(ActivityType.RX_EQ)}
          onInteract={() => onActivitySelect(ActivityType.RX_EQ)}
      >
          {renderRxEq()}
      </CollapsibleSection>

      <CollapsibleSection 
          title="RX DFE Equalizer" 
          subtitle="Non-Linear Decision Feedback"
          id={ActivityType.RX_DFE}
          isActive={activeActivity === ActivityType.RX_DFE}
          isOpen={openSections[ActivityType.RX_DFE]}
          onToggle={() => toggleSection(ActivityType.RX_DFE)}
          onInteract={() => onActivitySelect(ActivityType.RX_DFE)}
      >
          {renderRxDfe()}
      </CollapsibleSection>

      <CollapsibleSection 
          title="RX CDR/Slicer" 
          subtitle="Clock Recovery and Decision"
          id={ActivityType.RX_SLICER}
          isActive={activeActivity === ActivityType.RX_SLICER}
          isOpen={openSections[ActivityType.RX_SLICER]}
          onToggle={() => toggleSection(ActivityType.RX_SLICER)}
          onInteract={() => onActivitySelect(ActivityType.RX_SLICER)}
      >
          {renderRxSlicer()}
      </CollapsibleSection>
    </div>
  );
};

export default ControlPanel;