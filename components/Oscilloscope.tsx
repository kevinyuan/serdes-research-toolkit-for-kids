import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

interface OscilloscopeProps {
  data: number[];
  title: string;
  color: string;
  isDark?: boolean;
  onHelp?: () => void;
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({ data, title, color, isDark = false, onHelp }) => {
  const chartData = data.slice(-100).map((val, idx) => ({ idx, val }));

  return (
    <div className="h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-sm flex flex-col transition-colors group">
       <div className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 px-3 py-2 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
            <div className="flex items-center gap-2">
                 <span className="text-[10px] text-gray-500 dark:text-slate-500">Real-time Transient</span>
                 {onHelp && (
                     <button 
                        onClick={onHelp}
                        className="w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Explain this plot"
                     >
                        <span className="text-[10px] font-bold">?</span>
                     </button>
                 )}
            </div>
       </div>
      <div className="flex-1 w-full p-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{top: 5, right: 5, bottom: 5, left: -20}}>
            <CartesianGrid stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
            <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b'}}
                width={35}
            />
            <XAxis 
                dataKey="idx" 
                tick={{fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b'}}
                interval="preserveStartEnd"
            />
            <Tooltip 
                contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    fontSize: '12px'
                }}
                itemStyle={{color: color}}
                formatter={(val: number) => [val.toFixed(3) + ' V', 'Voltage']}
                labelFormatter={(label) => `Sample: ${label}`}
            />
            <Line 
                type="monotone" 
                dataKey="val" 
                stroke={color} 
                strokeWidth={1.5} 
                dot={false} 
                isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Oscilloscope;