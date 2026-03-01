import React from 'react';
import { BlockDefinition } from '../types';
import { BLOCKS } from '../constants';

interface PipelineProps {
  onBlockSelect: (block: BlockDefinition) => void;
  onHelpRequest: (block: BlockDefinition) => void;
  activeBlockId: string | null;
}

const Pipeline: React.FC<PipelineProps> = ({ onBlockSelect, onHelpRequest, activeBlockId }) => {
  
  const getTypeStyles = (type: string, isActive: boolean) => {
    const base = "relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300";
    
    if (isActive) {
        // Unified Active State (Professional Blue)
        return `${base} bg-blue-600 text-white shadow-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-900/20`;
    } else {
        // Inactive state: Blue Outline (Default = Previous Hover State)
        return `${base} bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm hover:shadow-md hover:scale-105`;
    }
  };

  const getLabelStyles = (type: string, isActive: boolean) => {
      const base = "text-xs font-bold transition-colors whitespace-nowrap px-2 py-0.5 rounded-full";
      if (isActive) {
          return `${base} text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30`;
      }
      // Inactive labels - More visible by default
      return `${base} text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-200`;
  };

  return (
    <div className="w-full border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 py-8 px-4 overflow-x-auto transition-colors">
      <div className="flex items-start justify-between min-w-[850px] mx-auto gap-0">
        {BLOCKS.map((block, index) => {
          const isActive = activeBlockId === block.id;
          
          return (
            <React.Fragment key={block.id}>
              {/* Module Wrapper */}
              <div 
                onClick={() => onBlockSelect(block)}
                className={`
                    group relative flex flex-col items-center cursor-pointer transition-all duration-300
                    shrink-0 z-10
                    ${isActive ? 'scale-110' : 'hover:-translate-y-1'}
                `}
              >
                
                {/* Icon Container */}
                <div className={getTypeStyles(block.type, isActive)}>
                  {/* Help Icon - Floating on corner */}
                   <button 
                      className={`
                        absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center
                        text-[10px] font-bold shadow-sm transition-all duration-200 z-20 border border-white dark:border-slate-800
                        ${isActive 
                          ? 'bg-white/90 text-blue-900 shadow-sm hover:bg-amber-400 hover:text-white hover:scale-125 hover:shadow-md' 
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-blue-600 hover:text-white hover:scale-125 hover:shadow-md'
                        }
                      `}
                      title="Learn more"
                      onClick={(e) => {
                          e.stopPropagation(); 
                          onHelpRequest(block);
                      }}
                    >
                      ?
                    </button>

                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-7 h-7 md:w-8 md:h-8 fill-current"
                  >
                    <path d={block.iconPath} />
                  </svg>
                </div>

                {/* Label - Only Name */}
                <div className="mt-3 text-center">
                    <div className={getLabelStyles(block.type, isActive)}>
                        {block.name}
                    </div>
                </div>
              </div>
              
              {/* Connecting Line/Arrow */}
              {index < BLOCKS.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-slate-800 relative mx-1 min-w-[16px] rounded-full mt-7 md:mt-8">
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full flex justify-between px-1 overflow-hidden">
                       <div className={`w-1 h-1 rounded-full animate-[ping_1.5s_linear_infinite] ${isActive ? 'bg-gray-400' : 'bg-gray-300 dark:bg-slate-600'}`} style={{animationDelay: '0ms'}}></div>
                       <div className={`w-1 h-1 rounded-full animate-[ping_1.5s_linear_infinite] ${isActive ? 'bg-gray-400' : 'bg-gray-300 dark:bg-slate-600'}`} style={{animationDelay: '500ms'}}></div>
                       <div className={`w-1 h-1 rounded-full animate-[ping_1.5s_linear_infinite] ${isActive ? 'bg-gray-400' : 'bg-gray-300 dark:bg-slate-600'}`} style={{animationDelay: '1000ms'}}></div>
                    </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;