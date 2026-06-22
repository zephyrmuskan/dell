import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { Sparkles, HelpCircle } from 'lucide-react';

export const AIConsensusEngine: React.FC = () => {
  const { activeRec, trustScore } = useWorkflow();

  const actionName = activeRec?.action || "Quarantine Device";
  const confidence = activeRec?.confidence || 87;
  const accuracy = activeRec?.timeMachine?.accuracy || 90;
  const cases = activeRec?.timeMachine?.cases || 30;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-full select-none text-slate-200">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-brand-cyan" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider m-0">AI Consensus Engine</h3>
          </div>
          <div className="relative group">
            <HelpCircle className="h-4 w-4 text-slate-500 hover:text-slate-350 cursor-help" />
            {/* Custom Tooltip */}
            <div className="absolute right-0 bottom-6 hidden group-hover:block bg-slate-950 text-slate-350 text-[10px] p-2.5 rounded-xl border border-slate-800 w-64 shadow-2xl z-20 font-semibold leading-relaxed">
              Consolidation matrix that weights historical accuracy against individual model confidence thresholds to resolve agent disagreements.
            </div>
          </div>
        </div>

        {/* Weights details */}
        <div className="space-y-2 text-xs font-semibold">
          <div className="flex justify-between items-center text-slate-400">
            <span>Remediation Confidence</span>
            <span className="font-mono text-white">{confidence}%</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Historical Accuracy</span>
            <span className="font-mono text-white">{accuracy}%</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Devil's Advocate Confidence</span>
            <span className="font-mono text-white">35%</span>
          </div>
          
          <div className="border-t border-slate-800 my-2 pt-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black font-mono">Consensus Result</span>
            <p className="text-xs font-black text-brand-cyan mt-1 m-0">{actionName}</p>
          </div>

          <div className="mt-2 bg-slate-950 border border-slate-900/60 p-2.5 rounded-xl">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black font-mono">Reason for Decision</span>
            <p className="text-[10px] text-slate-350 mt-1 m-0 leading-relaxed font-medium">
              Higher evidence support ({confidence}%) and stronger historical alignment ({accuracy}% accuracy across {cases} cases).
            </p>
          </div>
        </div>
      </div>

      {/* Trust Score Banner */}
      <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black font-mono leading-none">Decision Confidence</span>
            <div className="relative group leading-none">
              <HelpCircle className="h-3 w-3 text-slate-600 hover:text-slate-400 cursor-help" />
              <div className="absolute left-0 bottom-4 hidden group-hover:block bg-slate-950 text-slate-350 text-[9px] p-2 rounded-lg border border-slate-800 w-48 shadow-xl z-20 leading-normal font-semibold">
                Represents how strongly the agent supports its conclusion based on available evidence.
              </div>
            </div>
          </div>
          <span className="text-sm font-black text-white mt-1">{confidence}%</span>
        </div>
        
        <div className="flex items-center space-x-2.5">
          <div className="text-right">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black font-mono leading-none">Trust Score</span>
            <p className="text-sm font-black text-emerald-400 mt-1 m-0 leading-none">{trustScore}%</p>
          </div>
          <div className="h-8 w-8 rounded-full border border-emerald-500/25 flex items-center justify-center text-xs font-mono font-black bg-emerald-500/10 text-emerald-400 shadow-glow-emerald">
            {trustScore}
          </div>
        </div>
      </div>
    </div>
  );
};
