import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { GlassCard } from '../components/GlassCard';
import { 
  ArrowLeft, 
  Check, 
  X, 
  AlertOctagon, 
  HelpCircle, 
  Clock, 
  Eye,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DecisionScreen: React.FC = () => {
  const { 
    activeRec, 
    setCurrentScreen, 
    submitDecision, 
    activityLog, 
    selectedAltAction,
    decisionNotes,
    setDecisionNotes,
    autonomyLevel,
    setAutonomyLevel
  } = useWorkflow();

  const [selectedAction, setSelectedAction] = useState<'Approved' | 'Rejected' | 'Escalated' | 'Details Requested' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLowRiskAction = activeRec.action.toLowerCase().includes("patch") || 
                         activeRec.action.toLowerCase().includes("update") ||
                         activeRec.action.toLowerCase().includes("install");
  
  const isAutoExecuted = autonomyLevel === 4 || (autonomyLevel === 3 && isLowRiskAction);

  const handleActionSelect = (action: 'Approved' | 'Rejected' | 'Escalated' | 'Details Requested') => {
    setSelectedAction(action);
    setErrorMsg(null);
  };

  const handleSubmit = () => {
    if (isAutoExecuted) {
      setCurrentScreen(1); // Return to Dashboard
      return;
    }
    if (!selectedAction) {
      setErrorMsg('Please select an action before submitting the decision.');
      return;
    }
    submitDecision(selectedAction, decisionNotes);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen(3)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Trust Validation</span>
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 m-0">MDM Command Center</h2>
        </div>
      </div>

      {/* Alternative Action Banner */}
      {selectedAltAction && (
        <div className="bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald-800 rounded-2xl p-4 flex items-center space-x-3 shadow-glow-emerald">
          <Eye className="h-5 w-5 text-brand-emerald flex-shrink-0 animate-pulse" />
          <div className="text-xs font-semibold">
            <span className="font-extrabold uppercase bg-brand-emerald text-white px-2 py-0.5 rounded text-[10px] mr-2">Override Active</span>
            You selected the Devil's Advocate alternative: <strong className="underline">"{activeRec.devilsAdvocate.alternativeAction}"</strong>. Submitting decision will apply this override action instead.
          </div>
        </div>
      )}

      {/* Main split panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Decision Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recommendation Review */}
          <GlassCard className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 m-0">Recommendation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-semibold">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Recommendation</span>
                <span className="text-slate-800 font-extrabold text-sm block mt-1">
                  {selectedAltAction ? activeRec.devilsAdvocate.alternativeAction : activeRec.action}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Confidence</span>
                <span className="text-slate-800 font-extrabold text-sm block mt-1">{activeRec.confidence}%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Historical Accuracy</span>
                <span className="text-slate-800 font-extrabold text-sm block mt-1">{activeRec.timeMachine.accuracy}%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Criticality Risk</span>
                <span className={`font-extrabold text-sm block mt-1 ${activeRec.severity === 'Critical' ? 'text-brand-red' : 'text-brand-amber'}`}>
                  {activeRec.severity}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">MDM Target Gateway</span>
                <span className="text-slate-800 font-extrabold text-sm block mt-1">
                  {!(activeRec.id.startsWith('DEV') || activeRec.id.startsWith('USR') || activeRec.id.startsWith('EKS'))
                    ? 'Microsoft Intune'
                    : 'Workspace ONE'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Choose Action or Auto-executed Banner */}
          {isAutoExecuted ? (
            <GlassCard className="p-6 border-brand-emerald bg-brand-emerald/5 shadow-glow-emerald rounded-3xl flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 rounded-full animate-bounce">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-brand-emerald text-white uppercase tracking-widest font-mono">
                  ✓ Executed Automatically
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-3 m-0">Policy Dispatched by Autonomy Rules</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-1.5 leading-normal max-w-md">
                  This low-risk or act-and-notify command was automatically resolved and pushed to your fleet UEM/MDM gateway under Autonomy Level {autonomyLevel}.
                </p>
              </div>

              <div className="w-full bg-white p-4 rounded-xl border border-slate-200 text-left space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wide">
                  <span>Execution Audit Details</span>
                  <span className="font-mono">Active Policy</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <div className="text-slate-400">Action Deployed:</div>
                  <div className="text-slate-950 font-extrabold text-right">{activeRec.action}</div>
                  <div className="text-slate-400">Risk Assessment:</div>
                  <div className="text-brand-emerald font-black text-right">Low Risk / Pre-Approved</div>
                  <div className="text-slate-400">MDM Gateway API:</div>
                  <div className="text-slate-950 font-extrabold text-right">
                    {!(activeRec.id.startsWith('DEV') || activeRec.id.startsWith('USR') || activeRec.id.startsWith('EKS'))
                      ? 'Microsoft Intune (Graph)'
                      : 'Workspace ONE (REST)'}
                  </div>
                  <div className="text-slate-400">Audit Status:</div>
                  <div className="text-brand-emerald font-black text-right uppercase">Success (200 OK)</div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Choose Action */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 m-0">Select Action</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Approve Card */}
                  <button
                    onClick={() => handleActionSelect('Approved')}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      selectedAction === 'Approved'
                        ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald shadow-glow-emerald font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${selectedAction === 'Approved' ? 'bg-brand-emerald text-white' : 'bg-brand-emerald/10 text-brand-emerald'}`}>
                      <Check className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                      <p className="text-xs m-0">Approve</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Apply suggested rule</p>
                    </div>
                  </button>

                  {/* Reject Card */}
                  <button
                    onClick={() => handleActionSelect('Rejected')}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      selectedAction === 'Rejected'
                        ? 'bg-brand-red/10 border-brand-red text-brand-red shadow-glow-red font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${selectedAction === 'Rejected' ? 'bg-brand-red text-white' : 'bg-brand-red/10 text-brand-red'}`}>
                      <X className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                      <p className="text-xs m-0">Dismiss Alert</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">No action needed (alert matches safe behavior)</p>
                    </div>
                  </button>

                  {/* Escalate Card */}
                  <button
                    onClick={() => handleActionSelect('Escalated')}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      selectedAction === 'Escalated'
                        ? 'bg-brand-amber/10 border-brand-amber text-brand-amber shadow-glow-amber font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${selectedAction === 'Escalated' ? 'bg-brand-amber text-white' : 'bg-brand-amber/10 text-brand-amber'}`}>
                      <AlertOctagon className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                      <p className="text-xs m-0">Send for Help</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Ask advanced security team to verify</p>
                    </div>
                  </button>

                  {/* Request More Details Card */}
                  <button
                    onClick={() => handleActionSelect('Details Requested')}
                    className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      selectedAction === 'Details Requested'
                        ? 'bg-brand-blue/10 border-brand-blue text-brand-blue shadow-glow-blue font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${selectedAction === 'Details Requested' ? 'bg-brand-blue text-white' : 'bg-brand-blue/10 text-brand-blue'}`}>
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                      <p className="text-xs m-0">Ask for Explanation</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Get plain language details</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Override Justification Notes */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">Reason for action (Optional)</label>
                  <span className="text-[10px] font-semibold text-slate-400">Saved to fleet audit trail</span>
                </div>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Explain your decision for audit purposes..."
                  className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-xs font-semibold placeholder:text-slate-400 transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Right Column: Autonomy Control & Activity Log */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          {/* Autonomy Control Card */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4.5 w-4.5 text-slate-500" />
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider m-0">Autonomy Control</h3>
            </div>
            
            <GlassCard className="p-4 border-slate-200 bg-white shadow-sm space-y-4">
              <div className="space-y-2">
                {[
                  { level: 1, label: 'Always Ask Me', desc: 'Every recommendation requires approval.' },
                  { level: 2, label: 'Recommend Only', desc: 'AI suggests actions. Human decides.' },
                  { level: 3, label: 'Auto Approve Low Risk', desc: 'Low-risk actions execute automatically.' },
                  { level: 4, label: 'Act and Notify', desc: 'AI executes actions immediately.' }
                ].map((opt) => (
                  <button
                    key={opt.level}
                    onClick={() => setAutonomyLevel(opt.level)}
                    type="button"
                    className={`w-full flex items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                      autonomyLevel === opt.level
                        ? 'bg-brand-blue/5 border-brand-blue shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center h-4 mt-0.5 flex-shrink-0">
                      <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                        autonomyLevel === opt.level 
                          ? 'border-brand-blue' 
                          : 'border-slate-300'
                      }`}>
                        {autonomyLevel === opt.level && (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <span className={`text-[10px] font-black block ${
                        autonomyLevel === opt.level ? 'text-brand-blue' : 'text-slate-900'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">{opt.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Dynamic Behavior Preview Card */}
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 text-[10px]">
                <div className="flex justify-between items-center font-bold text-slate-400 uppercase tracking-wide">
                  <span>Current Mode Preview</span>
                  <span className="font-black text-brand-blue">Level {autonomyLevel}</span>
                </div>
                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-600">Patch Deployment</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] uppercase ${
                      autonomyLevel >= 3 
                        ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                        : 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20'
                    }`}>
                      {autonomyLevel >= 3 ? '✓ Auto-Approve' : '⚠ Human Review'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-600">Device Quarantine</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] uppercase ${
                      autonomyLevel === 4 
                        ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                        : 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20'
                    }`}>
                      {autonomyLevel === 4 ? '✓ Auto-Approve' : '⚠ Human Review'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Activity Log Card */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-slate-500" />
              <h3 className="text-base font-bold text-slate-800 m-0">Activity Log</h3>
            </div>

            <GlassCard className="bg-white p-5 border-slate-200/50 shadow-premium max-h-[220px] overflow-y-auto">
              <div className="relative border-l border-slate-200 ml-2 space-y-5 py-1">
                {activityLog.map((log, idx) => {
                  const isUser = log.type === 'user';
                  const isAI = log.type === 'ai';

                  return (
                    <div key={idx} className="relative pl-6">
                      {/* Timestamp Dot indicator */}
                      <span className={`absolute -left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                        isUser ? 'bg-brand-blue' : isAI ? 'bg-purple-600' : 'bg-slate-400'
                      }`}></span>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className={`uppercase ${
                            isUser ? 'text-brand-blue' : isAI ? 'text-purple-600 font-extrabold' : 'text-slate-500'
                          }`}>
                            {log.type === 'ai' ? 'TrustLens AI' : log.type === 'user' ? 'Operator' : 'Telemetry'}
                          </span>
                          <span className="text-slate-400 font-mono font-medium">{log.time}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed m-0">
                          {log.event}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>


      {/* Submit footer */}
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-4 pt-4 border-t border-slate-200/60">
        <div>
          {isAutoExecuted ? (
            <p className="text-xs font-bold text-brand-emerald flex items-center m-0">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald mr-1.5 animate-ping" />
              Action completed automatically under active autonomy policy guidelines.
            </p>
          ) : selectedAction ? (
            <p className="text-xs font-bold text-slate-500 flex items-center m-0">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-blue mr-1.5 animate-ping" />
              This will dispatch the command to {!(activeRec.id.startsWith('DEV') || activeRec.id.startsWith('USR') || activeRec.id.startsWith('EKS')) ? 'Microsoft Intune Graph API' : 'VMware Workspace ONE REST API'}.
            </p>
          ) : null}
          {errorMsg && (
            <p className="text-xs font-bold text-brand-red flex items-center m-0">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red mr-1.5 animate-ping" />
              {errorMsg}
            </p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3 rounded-xl text-sm font-extrabold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-glow-blue hover:shadow-premium-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span>{isAutoExecuted ? "Return to Dashboard" : "Submit Decision"}</span>
          <Check className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default DecisionScreen;
