import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { Sparkles, HelpCircle } from 'lucide-react';

export const AIConsensusEngine: React.FC = () => {
  const { activeRec, trustScore } = useWorkflow();

  const actionName = activeRec?.action || "Quarantine Device";
  const confidence = activeRec?.confidence || 87;
  const cases = activeRec?.timeMachine?.cases || 30;
  const accuracy = activeRec?.timeMachine?.accuracy || 90;

  // Mock votes count: 3 Support, 1 Oppose matching Voting Board
  const supportCount = 3;
  const opposeCount = 1;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between select-none text-slate-800">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider m-0">AI Consensus Engine</h3>
          </div>
          <div className="relative group">
            <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-650 cursor-help" />
            {/* Custom Tooltip */}
            <div className="absolute right-0 bottom-6 hidden group-hover:block bg-white text-slate-750 text-[10px] p-2.5 rounded-xl border border-slate-200 w-64 shadow-premium-xl z-20 font-semibold leading-relaxed">
              Consolidation matrix that weights historical accuracy against individual model confidence thresholds to resolve agent disagreements.
            </div>
          </div>
        </div>

        {/* Weights details - Split in grid layout to reduce vertical height */}
        <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
          {/* Left Column: Decision info */}
          <div className="space-y-2.5">
            <div>
              <span className="text-[9px] text-slate-450 uppercase tracking-widest font-black font-mono">Consensus Result</span>
              <p className="text-xs font-black text-indigo-600 leading-tight mt-0.5">{actionName}</p>
            </div>
            <div>
              <span className="text-[9px] text-slate-455 uppercase tracking-widest font-black font-mono">Agent Votes</span>
              <p className="text-[11px] font-bold text-slate-700 leading-tight mt-0.5">
                <span className="text-emerald-600 font-extrabold">{supportCount} Support</span> / <span className="text-rose-500 font-extrabold">{opposeCount} Oppose</span>
              </p>
            </div>
          </div>

          {/* Right Column: Score dial indicator */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-450 uppercase tracking-widest font-black font-mono leading-none">Trust Score</span>
              <span className="text-sm font-black text-slate-900 mt-1 leading-none">{trustScore}%</span>
              <span className="text-[8px] text-slate-400 font-bold mt-1 leading-none">Conf: {confidence}%</span>
            </div>
            <div className="h-9 w-9 rounded-full border border-indigo-500/25 flex flex-col items-center justify-center text-[10px] font-mono font-black bg-indigo-500/10 text-indigo-650 shadow-sm relative">
              <span>{trustScore}</span>
            </div>
          </div>
        </div>

        {/* Reason summary */}
        <div className="mt-3 bg-slate-50/70 border border-slate-200/60 p-2 rounded-xl text-[10px] text-slate-600 font-semibold leading-relaxed">
          <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black font-mono block">Decision Reason</span>
          Evidence supports remediation ({confidence}%) with high historical accuracy ({accuracy}% across {cases} cases).
        </div>
      </div>
    </div>
  );
};
