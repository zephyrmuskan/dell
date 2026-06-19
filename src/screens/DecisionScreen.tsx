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
  ShieldAlert,
  Cpu,
  BookmarkCheck,
  UserCheck,
  ChevronRight,
  Eye,
  Info
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
    setDecisionNotes
  } = useWorkflow();

  const [selectedAction, setSelectedAction] = useState<'Approved' | 'Rejected' | 'Escalated' | 'Details Requested' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleActionSelect = (action: 'Approved' | 'Rejected' | 'Escalated' | 'Details Requested') => {
    setSelectedAction(action);
    setErrorMsg(null);
  };

  const handleSubmit = () => {
    if (!selectedAction) {
      setErrorMsg('Please select an action before submitting the decision.');
      return;
    }
    submitDecision(selectedAction, decisionNotes);
  };

  // Replay steps configuration
  const steps = [
    { label: 'Threat Detected', icon: ShieldAlert, active: true, done: true },
    { label: 'AI Analysis', icon: Cpu, active: true, done: true },
    { label: 'Recommendation Generated', icon: BookmarkCheck, active: true, done: true },
    { label: 'Human Decision', icon: UserCheck, active: true, done: false }
  ];

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
          <h2 className="text-xl font-black text-slate-900 m-0">Human Decision Center</h2>
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

          {/* Choose Action */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 m-0">Choose Action</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Approve Card */}
              <button
                onClick={() => handleActionSelect('Approved')}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] ${
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
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Execute Recommendation</p>
                </div>
              </button>

              {/* Reject Card */}
              <button
                onClick={() => handleActionSelect('Rejected')}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] ${
                  selectedAction === 'Rejected'
                    ? 'bg-brand-red/10 border-brand-red text-brand-red shadow-glow-red font-extrabold'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 font-bold'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedAction === 'Rejected' ? 'bg-brand-red text-white' : 'bg-brand-red/10 text-brand-red'}`}>
                  <X className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <p className="text-xs m-0">Reject</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Dismiss as False Positive</p>
                </div>
              </button>

              {/* Escalate Card */}
              <button
                onClick={() => handleActionSelect('Escalated')}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] ${
                  selectedAction === 'Escalated'
                    ? 'bg-brand-amber/10 border-brand-amber text-brand-amber shadow-glow-amber font-extrabold'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 font-bold'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedAction === 'Escalated' ? 'bg-brand-amber text-white' : 'bg-brand-amber/10 text-brand-amber'}`}>
                  <AlertOctagon className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <p className="text-xs m-0">Escalate</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Flag to Security Team</p>
                </div>
              </button>

              {/* Request More Details Card */}
              <button
                onClick={() => handleActionSelect('Details Requested')}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] ${
                  selectedAction === 'Details Requested'
                    ? 'bg-brand-blue/10 border-brand-blue text-brand-blue shadow-glow-blue font-extrabold'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 font-bold'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedAction === 'Details Requested' ? 'bg-brand-blue text-white' : 'bg-brand-blue/10 text-brand-blue'}`}>
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div className="mt-4">
                  <p className="text-xs m-0">More Details</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Request Deep Audit Log</p>
                </div>
              </button>
            </div>
          </div>

          {/* Override Justification Notes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">Override Justification Notes (Optional)</label>
              <span className="text-[10px] font-semibold text-slate-400">Added to Audit Logs</span>
            </div>
            <textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Provide context, rationalization, or comments regarding this action..."
              className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue text-xs font-semibold placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>

        {/* Right Column: Activity Log */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-slate-500" />
            <h3 className="text-base font-bold text-slate-800 m-0">Activity Log</h3>
          </div>

          <GlassCard className="flex-1 bg-white p-5 border-slate-200/50 shadow-premium max-h-[380px] overflow-y-auto">
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

      {/* Bottom Section: Incident Replay Timeline */}
      <GlassCard className="bg-slate-50/50 border-slate-200/50 p-6">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <Info className="h-4.5 w-4.5 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Incident Replay Timeline</h3>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-300 hidden md:block" />}
                <div className="flex items-center space-x-3 flex-1 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm w-full md:w-auto">
                  <div className={`p-2 rounded-lg ${
                    step.done 
                      ? 'bg-brand-emerald/10 text-brand-emerald' 
                      : step.active 
                        ? 'bg-brand-blue/10 text-brand-blue animate-pulse' 
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider m-0">Stage {idx + 1}</p>
                    <p className="text-xs font-extrabold text-slate-800 m-0">{step.label}</p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </GlassCard>

      {/* Submit footer */}
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-4 pt-4 border-t border-slate-200/60">
        <div>
          {selectedAction && (
            <p className="text-xs font-bold text-slate-500 flex items-center m-0">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-blue mr-1.5 animate-ping" />
              This will dispatch the command to {!(activeRec.id.startsWith('DEV') || activeRec.id.startsWith('USR') || activeRec.id.startsWith('EKS')) ? 'Microsoft Intune Graph API' : 'VMware Workspace ONE REST API'}.
            </p>
          )}
          {errorMsg && (
            <p className="text-xs font-bold text-brand-red flex items-center m-0">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red mr-1.5 animate-ping" />
              {errorMsg}
            </p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3 rounded-xl text-sm font-extrabold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-glow-blue hover:shadow-premium-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Submit Decision</span>
          <Check className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default DecisionScreen;
