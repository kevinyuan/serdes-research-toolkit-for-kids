import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { BathtubPoint } from '../types';

interface BathtubCurveProps {
  data: BathtubPoint[];
  isDark?: boolean;
  onHelp?: () => void;
}

const BathtubCurve: React.FC<BathtubCurveProps> = ({ data, isDark = false, onHelp }) => {
  return (
    <div className="h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-sm flex flex-col transition-colors group">
       <div className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 px-3 py-2 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Bathtub Curve (Est.)</h3>
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={isDark ? "#1e293b" : "#f1f5f9"} strokeDasharray="3 3" />
            <XAxis 
                dataKey="offset" 
                tick={{fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b'}} 
                label={{ value: 'Unit Interval Offset (UI)', position: 'insideBottom', offset: -5, fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
            />
            <YAxis 
                scale="log" 
                domain={[1e-12, 1]} 
                ticks={[1, 1e-3, 1e-6, 1e-9, 1e-12]}
                tickFormatter={(val) => val.toExponential(0)}
                tick={{fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b'}}
                width={40}
            />
            <Tooltip 
                formatter={(val: number) => val.toExponential(2)}
                labelFormatter={(label) => `Offset: ${label} UI`}
                contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    fontSize: '11px'
                }}
            />
            <ReferenceLine x={0} stroke={isDark ? "#475569" : "#94a3b8"} strokeDasharray="3 3" />
            <Area 
                type="monotone" 
                dataKey="ber" 
                stroke="#6366f1" 
                fill="#818cf8" 
                fillOpacity={0.2} 
                isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BathtubCurve;