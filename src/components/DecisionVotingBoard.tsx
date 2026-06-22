import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { CheckCircle2, XCircle, Users, Activity } from 'lucide-react';

export const DecisionVotingBoard: React.FC = () => {
  const { activeRec } = useWorkflow();

  const actionName = activeRec?.action || "Quarantine Device";
  const altAction = activeRec?.devilsAdvocate?.alternativeAction || "Monitor for 24 Hours";

  // Mock voting status matching the Orchestrator outcomes
  const votes = [
    { name: "Detection Agent", support: true, action: actionName },
    { name: "Risk Assessment Agent", support: true, action: actionName },
    { name: "Remediation Agent", support: true, action: actionName },
    { name: "Devil's Advocate Agent", support: false, action: altAction }
  ];

  const supportCount = votes.filter(v => v.support).length;
  const opposeCount = votes.filter(v => !v.support).length;

  const consensusStrength = supportCount >= 3 ? "High" : "Medium";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-full select-none">
      <div>
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 mb-3">
          <Users className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-black uppercase text-white tracking-wider m-0">Decision Voting Board</h3>
        </div>

        <div className="space-y-2.5">
          {votes.map((vote) => (
            <div key={vote.name} className="flex items-center justify-between text-xs bg-slate-950 px-3 py-2 rounded-xl border border-slate-900">
              <div className="flex items-center space-x-2">
                {vote.support ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                )}
                <span className="font-bold text-slate-350">{vote.name.replace(" Agent", "")}</span>
              </div>
              <span className={`font-semibold font-mono text-[10px] uppercase truncate max-w-[150px] ${vote.support ? 'text-emerald-400' : 'text-rose-400'}`}>
                {vote.support ? '✓ ' : '✗ '}{vote.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 font-bold text-slate-400">
          <Activity className="h-3.5 w-3.5 text-slate-500" />
          <span>CONSENSUS:</span>
          <span className="text-white font-extrabold">{supportCount} - {opposeCount}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 font-bold">STRENGTH:</span>
          <span className={`font-black uppercase px-2 py-0.5 rounded text-[9px] border tracking-wider ${
            consensusStrength === 'High' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {consensusStrength}
          </span>
        </div>
      </div>
    </div>
  );
};
