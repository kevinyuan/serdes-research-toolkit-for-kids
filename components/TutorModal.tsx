import React, { useState, useEffect } from 'react';
import { BlockDefinition } from '../types';
import { askProfessorSparky } from '../services/geminiService';

interface TutorModalProps {
  block: BlockDefinition | null;
  onClose: () => void;
  contextData: string;
}

const TutorModal: React.FC<TutorModalProps> = ({ block, onClose, contextData }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (block) {
      setLoading(true);
      const question = `Explain the ${block.name} technical details professionally.`;
      askProfessorSparky(contextData, question).then(text => {
        setExplanation(text);
        setLoading(false);
      });
    }
  }, [block, contextData]);

  if (!block) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-slate-950 p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="text-gray-700 dark:text-slate-200">
                    <h2 className="font-bold text-lg">{block.name}</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-xs font-mono">Module Inspector</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 text-xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-5/6"></div>
                </div>
            ) : (
                 <div className="prose prose-sm prose-slate dark:prose-invert text-gray-700 dark:text-slate-300">
                    <p className="whitespace-pre-wrap">{explanation}</p>
                 </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default TutorModal;