import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DEFAULT_PARAMS } from './constants';
import { SimulationParams, BlockDefinition, ActivityType } from './types';
import { runSimulation } from './services/dsp';
import Pipeline from './components/Pipeline';
import ControlPanel from './components/ControlPanel';
import EyeDiagram from './components/EyeDiagram';
import Oscilloscope from './components/Oscilloscope';
import BathtubCurve from './components/BathtubCurve';
import PulseResponse from './components/PulseResponse';
import InfoModal, { HELP_TOPICS, HelpContent } from './components/InfoModal';

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [helpContent, setHelpContent] = useState<HelpContent | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [activeActivity, setActiveActivity] = useState<ActivityType | null>(ActivityType.MODULATION);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  
  const result = useMemo(() => runSimulation(params), [params]);

  // Handle Theme Class on Body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sidebar Resizing Logic
  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  const resize = (e: MouseEvent) => {
    if (isResizing.current) {
        let newWidth = e.clientX;
        if (newWidth < 280) newWidth = 280;
        if (newWidth > 600) newWidth = 600;
        setSidebarWidth(newWidth);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, []);

  const handleBlockSelect = (block: BlockDefinition) => {
      setSelectedBlockId(block.id);
      
      switch (block.id) {
          case 'gen':
              setActiveActivity(ActivityType.MODULATION);
              break;
          case 'tx':
              setActiveActivity(ActivityType.TX_EQ);
              break;
          case 'tx_dac':
              setActiveActivity(ActivityType.TX_DAC);
              break;
          case 'channel':
              setActiveActivity(ActivityType.CHANNEL);
              break;
          case 'rx_ctle':
              setActiveActivity(ActivityType.RX_CTLE);
              break;
          case 'rx_adc':
               setActiveActivity(ActivityType.ADC);
              break;
          case 'rx_eq':
              setActiveActivity(ActivityType.RX_EQ);
              break;
          case 'rx_dfe':
              setActiveActivity(ActivityType.RX_DFE);
              break;
          case 'rx_slicer':
              setActiveActivity(ActivityType.RX_SLICER);
              break;
      }
  };

  const handleHelpRequest = (block: BlockDefinition) => {
      switch (block.id) {
          case 'gen':
              setHelpContent(HELP_TOPICS.MODULE_GEN);
              break;
          case 'tx':
              setHelpContent(HELP_TOPICS.MODULE_TX);
              break;
          case 'tx_dac':
              setHelpContent({
                  title: "TX DAC (Digital to Analog)",
                  body: (
                      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                          <p>The <strong>DAC</strong> converts the digital numbers from the TX FIR filter into real analog voltages that drive the channel.</p>
                          <p>Ideally, it creates perfect steps. In reality, it has bandwidth limits and non-linearity.</p>
                      </div>
                  )
              });
              break;
          case 'channel':
              setHelpContent(HELP_TOPICS.MODULE_CHANNEL);
              break;
          case 'rx_ctle':
              setHelpContent({
                  title: "RX CTLE (Continuous Time Linear Equalizer)",
                  body: (
                      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                          <p>The <strong>CTLE</strong> is an analog filter that boosts high-frequency components of the signal to counteract channel loss.</p>
                          <p>It operates <em>before</em> the ADC, improving the signal-to-noise ratio by opening the eye without amplifying high-frequency noise as much as a digital equalizer might.</p>
                      </div>
                  )
              });
              break;
          case 'rx_adc':
               setHelpContent({
                  title: "RX ADC (Analog to Digital)",
                  body: (
                      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                          <p>The <strong>ADC</strong> samples the continuous analog signal at specific time intervals and converts voltage levels into digital numbers.</p>
                          <p>Low resolution (fewer bits) introduces "Quantization Noise" which looks like jagged steps in the signal.</p>
                      </div>
                  )
              });
              break;
          case 'rx_eq':
              setHelpContent(HELP_TOPICS.MODULE_RX_EQ);
              break;
          case 'rx_dfe':
              setHelpContent(HELP_TOPICS.MODULE_RX_DFE);
              break;
          case 'rx_slicer':
              setHelpContent(HELP_TOPICS.MODULE_RX_SLICER);
              break;
          default:
              setHelpContent(null);
      }
  };

  const handleBerAnalysis = () => {
    const issues: React.ReactNode[] = [];
    if (params.noiseLevel > 0.05) issues.push(<li key="noise"><strong>High Noise Level:</strong> {params.noiseLevel.toFixed(3)}V is quite high. Reduce noise in <strong>Channel</strong>.</li>);
    if (params.jitterRandom > 0.1 || params.jitterDeterministic > 0.1) issues.push(<li key="jitter"><strong>High Jitter:</strong> Timing jitter is closing the eye horizontally. Adjust in <strong>Channel</strong>.</li>);
    if (!params.useEqualizer) issues.push(<li key="ffe"><strong>FFE Disabled:</strong> Enable the Linear Equalizer in <strong>RX FFE</strong> to sharpen edges.</li>);
    if (params.channelResponse.length > 5 && !params.useDfe) issues.push(<li key="dfe"><strong>DFE Disabled:</strong> Long channel ISI requires <strong>RX DFE</strong> to cancel post-cursors.</li>);

    const content: HelpContent = {
        title: "BER Diagnostic Report",
        body: (
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div className={`p-4 rounded border ${result.ber < 1e-6 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                    <div className="font-bold text-lg mb-1 flex items-center gap-2">
                        <span>Current BER:</span>
                        <span className="font-mono">{result.ber === 0 ? "< 1e-12" : result.ber.toExponential(2)}</span>
                    </div>
                    <p className="text-sm opacity-90">{result.ber < 1e-6 ? "Excellent signal quality!" : "Signal quality is degraded."}</p>
                </div>
                {issues.length > 0 && (
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Suggested Improvements:</h4>
                        <ul className="list-disc pl-5 space-y-2">{issues}</ul>
                    </div>
                )}
            </div>
        )
    };
    setHelpContent(content);
  };

  const handleActivitySelect = (activity: ActivityType) => {
      setActiveActivity(activity);
      
      // Sync selection to pipeline block
      let blockId = '';
      switch (activity) {
          case ActivityType.MODULATION: blockId = 'gen'; break;
          case ActivityType.TX_EQ: blockId = 'tx'; break;
          case ActivityType.TX_DAC: blockId = 'tx_dac'; break;
          case ActivityType.CHANNEL: blockId = 'channel'; break;
          case ActivityType.RX_CTLE: blockId = 'rx_ctle'; break;
          case ActivityType.ADC: blockId = 'rx_adc'; break;
          case ActivityType.RX_EQ: blockId = 'rx_eq'; break;
          case ActivityType.RX_DFE: blockId = 'rx_dfe'; break;
          case ActivityType.RX_SLICER: blockId = 'rx_slicer'; break;
      }
      if (blockId) setSelectedBlockId(blockId);
  };

  return (
    <div className="h-screen flex flex-col font-sans text-sm bg-gray-50 dark:bg-slate-950 transition-colors overflow-hidden">
      
      {/* Professional Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-3.5 flex justify-between items-center shadow-md shadow-slate-200/50 dark:shadow-none z-20 shrink-0 transition-all sticky top-0">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 text-white flex items-center justify-center rounded-xl shadow-lg shadow-blue-900/20 dark:shadow-blue-500/20 ring-1 ring-blue-700/10 dark:ring-white/20 overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 group-hover:stroke-[2.5] transition-all">
                    <path d="M2 12C2 12 7 4 12 4C17 4 22 12 22 12C22 12 17 20 12 20C7 20 2 12 2 12Z" />
                    <path d="M12 4V20" strokeWidth="1.5" strokeOpacity="0.5" />
                    <path d="M2 12H22" strokeWidth="1.5" strokeOpacity="0.5" />
                </svg>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-cyan-600 dark:from-blue-100 dark:to-cyan-300 leading-tight tracking-tight">SerDes Research Toolkit for Kids</h1>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono tracking-wide uppercase font-bold opacity-80">V2.0.0</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
           <div className="hidden md:flex flex-col items-end pr-8 border-r-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Bit Error Rate</span>
                  <button onClick={handleBerAnalysis} className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-sm"><span className="text-[10px] font-bold">?</span></button>
              </div>
              <span className={`text-2xl font-mono font-bold leading-none ${result.ber < 1e-6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {result.ber === 0 ? "< 1e-12" : result.ber.toExponential(2)}
              </span>
           </div>
           
           <div className="flex items-center gap-3">
               <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 shadow-sm hover:shadow-md ring-1 ring-slate-200 dark:ring-slate-700"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
               </button>

               <a 
                    href="https://github.com/kevinyuan/serdes-toolkit-for-kids" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-all duration-200 shadow-sm hover:shadow-md ring-1 ring-slate-900 dark:ring-white flex items-center justify-center"
                    title="View on GitHub"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
               </a>
           </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* Sidebar: Config Content */}
        <aside 
            ref={sidebarRef}
            className="border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-y-auto shrink-0 transition-colors"
            style={{ width: sidebarWidth }}
        >
            <ControlPanel 
                params={params} 
                setParams={setParams} 
                activeActivity={activeActivity || ActivityType.MODULATION} 
                onActivitySelect={handleActivitySelect}
            />
        </aside>

        {/* Resize Handle */}
        <div onMouseDown={startResizing} className="w-1 cursor-col-resize bg-gray-100 dark:bg-slate-800 hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors z-10"></div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-black/50">
            <div className="shrink-0">
                <Pipeline onBlockSelect={handleBlockSelect} onHelpRequest={handleHelpRequest} activeBlockId={selectedBlockId} />
            </div>
            <div className="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-h-0 flex-1">
                    <EyeDiagram data={result.txSymbols} pamType={params.pamType} title="1. TX Output (After FIR)" isDark={darkMode} onHelp={() => setHelpContent(HELP_TOPICS.EYE)} />
                    <EyeDiagram data={result.rxSignalRaw} pamType={params.pamType} title="2. Channel Output" isDark={darkMode} onHelp={() => setHelpContent(HELP_TOPICS.EYE)} />
                    <EyeDiagram data={result.rxSignalEq} pamType={params.pamType} title="3. After RX FFE" isDark={darkMode} onHelp={() => setHelpContent(HELP_TOPICS.EYE)} />
                    <EyeDiagram data={result.rxSignalDfe} pamType={params.pamType} title="4. After RX DFE (Final)" isDark={darkMode} onHelp={() => setHelpContent(HELP_TOPICS.EYE)} />
                </div>
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-1 min-h-0"><PulseResponse data={result.pulseResponse} isDark={darkMode} onHelp={() => setHelpContent(HELP_TOPICS.PULSE)} /></div>
                    <div className="md:col-span-1 min-h-0"><BathtubCurve data={result.bathtubData} isDark={darkMode} onHelp={() => setHelpContent(HELP_TOPICS.BATHTUB)} /></div>
                    <div className="md:col-span-2 min-h-0"><Oscilloscope data={result.rxSignalDfe} title="Receiver Decision Input (Transient)" color={darkMode ? "#0ea5e9" : "#0284c7"} isDark={darkMode} onHelp={() => setHelpContent(HELP_TOPICS.OSCILLOSCOPE)} /></div>
                </div>
            </div>
        </div>
      </main>

      <InfoModal content={helpContent} onClose={() => { setHelpContent(null); setSelectedBlockId(null); }} />
    </div>
  );
};

export default App;