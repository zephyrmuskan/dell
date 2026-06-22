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
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full select-none text-slate-800">
      <div>
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-3">
          <Users className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider m-0">Decision Voting Board</h3>
        </div>

        <div className="space-y-2.5">
          {votes.map((vote) => (
            <div key={vote.name} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
              <div className="flex items-center space-x-2">
                {vote.support ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                )}
                <span className="font-bold text-slate-700">{vote.name.replace(" Agent", "")}</span>
              </div>
              <span className={`font-semibold font-mono text-[10px] uppercase truncate max-w-[150px] ${vote.support ? 'text-emerald-600' : 'text-rose-600'}`}>
                {vote.support ? '✓ ' : '✗ '}{vote.action}
              </span>
            </div>
          ))}
        </div>

        {/* SHAP Telemetry Drivers */}
        {activeRec?.shapImportance && activeRec.shapImportance.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-200">
            <span className="text-[10px] text-slate-450 uppercase tracking-widest font-black font-mono">Top Telemetry Drivers</span>
            <div className="mt-2 space-y-2">
              {[...activeRec.shapImportance]
                .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
                .slice(0, 3)
                .map((factor, idx) => {
                  const isPos = factor.type === 'positive';
                  const percentage = Math.abs(factor.val);
                  return (
                    <div key={idx} className="flex flex-col space-y-0.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-600 truncate max-w-[170px]">{factor.feature}</span>
                        <span className={isPos ? 'text-rose-600 font-extrabold font-mono' : 'text-emerald-600 font-extrabold font-mono'}>
                          {isPos ? '+' : '-'}{percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full ${isPos ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-3 mt-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div className="flex items-center space-x-1.5 font-bold">
          <Activity className="h-3.5 w-3.5 text-slate-400 animate-pulse" />
          <span>CONSENSUS:</span>
          <span className="text-slate-900 font-extrabold">{supportCount} - {opposeCount}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 font-bold">STRENGTH:</span>
          <span className={`font-black uppercase px-2 py-0.5 rounded text-[9px] border tracking-wider ${
            consensusStrength === 'High' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
              : 'bg-amber-50 text-amber-700 border-amber-200/50'
          }`}>
            {consensusStrength}
          </span>
        </div>
      </div>
    </div>
  );
};
