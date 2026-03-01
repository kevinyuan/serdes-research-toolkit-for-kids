import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

interface PulseResponseProps {
  data: number[];
  isDark?: boolean;
  onHelp?: () => void;
}

const PulseResponse: React.FC<PulseResponseProps> = ({ data, isDark = false, onHelp }) => {
  const chartData = data.map((val, i) => ({ tap: i, val }));

  return (
    <div className="h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-sm flex flex-col transition-colors group">
       <div className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 px-3 py-2 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Pulse Response (h[n])</h3>
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
      <div className="flex-1 w-full p-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{top: 5, right: 5, bottom: 5, left: -20}}>
            <CartesianGrid stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
            <XAxis 
                dataKey="tap" 
                tick={{fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b'}}
            />
            <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b'}}
                width={35}
            />
            <ReferenceLine y={0} stroke={isDark ? "#475569" : "#cbd5e1"} />
            <Tooltip 
                cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    fontSize: '11px'
                }}
                formatter={(val: number) => val.toFixed(4)}
            />
            <Bar dataKey="val" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PulseResponse;