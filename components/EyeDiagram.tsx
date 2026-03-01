import React, { useRef, useEffect } from 'react';
import { PamType } from '../types';

interface EyeDiagramProps {
  data: number[];
  pamType: PamType;
  width?: number;
  height?: number;
  title: string;
  isDark?: boolean;
  onHelp?: () => void;
}

const EyeDiagram: React.FC<EyeDiagramProps> = ({ data, pamType, width = 400, height = 300, title, isDark = false, onHelp }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions with Margins for Labels
    const PAD_L = 35;
    const PAD_R = 10;
    const PAD_T = 10;
    const PAD_B = 20;
    const W = width - PAD_L - PAD_R;
    const H = height - PAD_T - PAD_B;

    // Theme Colors
    const BG_COLOR = isDark ? '#0f172a' : '#ffffff'; 
    const GRID_COLOR = isDark ? '#1e293b' : '#e2e8f0'; 
    const AXIS_COLOR = isDark ? '#475569' : '#94a3b8'; 
    const TRACE_COLOR = isDark ? '#38bdf8' : '#2563eb'; 
    const THRESHOLD_COLOR = isDark ? '#f87171' : '#ef4444'; 
    const TEXT_COLOR = isDark ? '#94a3b8' : '#64748b';

    // Clear and Background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // --- Draw Grid ---
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Vertical lines (Time divisions)
    const vDivs = 4; // 0, 0.5, 1.0, 1.5, 2.0 UI
    for (let i = 0; i <= vDivs; i++) {
        const x = PAD_L + (W / vDivs) * i;
        ctx.moveTo(x, PAD_T);
        ctx.lineTo(x, height - PAD_B);
    }
    // Horizontal lines (Voltage divisions)
    const hDivs = 4;
    for (let i = 0; i <= hDivs; i++) {
        const y = PAD_T + (H / hDivs) * i;
        ctx.moveTo(PAD_L, y);
        ctx.lineTo(width - PAD_R, y);
    }
    ctx.stroke();

    // --- Center Axes (Zero Lines) ---
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    // Horizontal Center (0V)
    const zeroY = PAD_T + H / 2;
    ctx.moveTo(PAD_L, zeroY);
    ctx.lineTo(width - PAD_R, zeroY); 
    
    // Vertical Center (1.0 UI - Middle of Eye)
    const centerX = PAD_L + W / 2;
    ctx.moveTo(centerX, PAD_T);
    ctx.lineTo(centerX, height - PAD_B); 
    ctx.stroke();

    // --- Auto-Scaling Logic ---
    let maxAbs = 0;
    const step = Math.max(1, Math.floor(data.length / 1000));
    for(let i=0; i<data.length; i+=step) {
        const abs = Math.abs(data[i]);
        if(abs > maxAbs) maxAbs = abs;
    }
    
    const minScale = pamType === PamType.PAM4 ? 3.5 : 1.5;
    const displayLimit = Math.max(maxAbs, minScale) * 1.1; 

    const scaleY = (H / 2) / displayLimit;

    // --- Draw Signal Traces ---
    const samplesPerUI = 32; 
    ctx.strokeStyle = TRACE_COLOR;
    ctx.globalAlpha = isDark ? 0.2 : 0.15;
    ctx.lineWidth = 1.5;

    const drawTrace = (y1: number, y2: number, y3: number) => {
       ctx.beginPath();
       for(let j=0; j<=samplesPerUI*2; j++) {
           const t = j / (samplesPerUI * 2); // 0 to 1 (representing 2 UI window)
           const x = PAD_L + t * W;
           
           let yVal = 0;
           if (t < 0.5) {
               const localT = t * 2; 
               const mu2 = (1 - Math.cos(localT * Math.PI)) / 2;
               yVal = (y1 * (1 - mu2) + y2 * mu2);
           } else {
               const localT = (t - 0.5) * 2;
               const mu2 = (1 - Math.cos(localT * Math.PI)) / 2;
               yVal = (y2 * (1 - mu2) + y3 * mu2);
           }
           
           const yPixel = zeroY - yVal * scaleY;
           
           if (j === 0) ctx.moveTo(x, yPixel);
           else ctx.lineTo(x, yPixel);
       }
       ctx.stroke();
    };

    const stride = 5; 
    const limit = Math.min(data.length - 2, 800); 
    
    for (let i = 1; i < limit; i+=stride) {
        drawTrace(data[i-1], data[i], data[i+1]);
    }
    
    // --- Draw Decision Thresholds ---
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = THRESHOLD_COLOR;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    
    const drawHLine = (val: number) => {
        const y = zeroY - val * scaleY;
        ctx.beginPath();
        ctx.moveTo(PAD_L, y);
        ctx.lineTo(width - PAD_R, y);
        ctx.stroke();
    };

    drawHLine(0);
    if (pamType === PamType.PAM4) {
        drawHLine(2);
        drawHLine(-2);
    }
    ctx.setLineDash([]);

    // --- Draw Labels ---
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '10px sans-serif'; // Inter if loaded, else sans
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Y Axis Labels
    const yTicks = 4;
    for(let i=0; i<=yTicks; i++) {
        // Map i (0..4) to (-limit .. +limit)
        const pct = i / yTicks; // 0..1
        const val = displayLimit - (pct * 2 * displayLimit); // +Lim to -Lim
        const y = PAD_T + (H * pct);
        ctx.fillText(val.toFixed(1), PAD_L - 4, y);
    }

    // X Axis Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTicks = 4; // 0, 0.5, 1.0, 1.5, 2.0
    for(let i=0; i<=xTicks; i++) {
        const uiVal = i * 0.5;
        const x = PAD_L + (W / xTicks) * i;
        ctx.fillText(uiVal.toFixed(1) + " UI", x, height - PAD_B + 4);
    }

  }, [data, pamType, width, height, isDark]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden flex flex-col h-full transition-colors relative group">
      <div className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 px-3 py-1 flex justify-between items-center shrink-0">
         <h3 className="text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
         <div className="flex items-center gap-2">
             <span className="text-[9px] text-gray-500 dark:text-slate-500">2.0 UI Window</span>
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
      <div className="flex-1 relative bg-white dark:bg-slate-900 min-h-0">
         {/* Use ResizeObserver logic ideally, but here we just fit to container roughly */}
        <canvas ref={canvasRef} width={width} height={height} className="w-full h-full block" />
      </div>
    </div>
  );
};

export default EyeDiagram;