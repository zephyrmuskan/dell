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
    agentChain,
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
  
  const isAutoExecuted = autonomyLevel === 3 || (autonomyLevel === 2 && isLowRiskAction);

  const incidentReportStep = agentChain?.find(a => a.name === "Incident Report Agent");
  let incidentSummary = "AI Quarantine action overridden by operator due to dispute policy triggers.";
  let incidentRootCause = "Devil's Advocate raised valid local antivirus flags or software update patterns.";
  let incidentSafeguard = "Validation checks failed on historical incident vector similarity search.";

  if (incidentReportStep?.output_data) {
    try {
      const data = JSON.parse(incidentReportStep.output_data);
      if (data.summary) incidentSummary = data.summary;
      if (data.root_cause) incidentRootCause = data.root_cause;
      if (data.failed_safeguard) incidentSafeguard = data.failed_safeguard;
    } catch {
      if (typeof incidentReportStep.output_data === 'string' && incidentReportStep.output_data.length > 5) {
        incidentSummary = incidentReportStep.output_data;
      }
    }
  }

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
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors font-display cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Trust Validation</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display m-0">MDM Command Center</h2>
        </div>
      </div>

      {/* Alternative Action Banner */}
      {selectedAltAction && (
        <div className="bg-brand-emerald/10 border border-brand-emerald/30 text-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
          <Eye className="h-5 w-5 text-brand-emerald flex-shrink-0 animate-pulse" />
          <div className="text-xs font-semibold font-display">
            <span className="font-extrabold uppercase bg-brand-emerald text-white px-2 py-0.5 rounded text-xs mr-2">Override Active</span>
            You selected the Devil's Advocate alternative: <strong className="underline">"{activeRec.devilsAdvocate.alternativeAction}"</strong>. Submitting decision will apply this override action instead.
          </div>
        </div>
      )}

      {/* Main split panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Decision Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recommendation Review */}
          <GlassCard className="space-y-4 p-5">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 m-0 font-display">Recommendation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-semibold font-display">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block font-display">Target Recommendation</span>
                <span className="text-slate-855 font-extrabold text-sm block mt-1 font-display leading-tight">
                  {selectedAltAction ? activeRec.devilsAdvocate.alternativeAction : activeRec.action}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block font-display">AI Confidence</span>
                <span className="text-slate-855 font-extrabold text-sm block mt-1 font-mono">{activeRec.confidence}%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block font-display">Historical Accuracy</span>
                <span className="text-slate-855 font-extrabold text-sm block mt-1 font-mono">{activeRec.timeMachine.accuracy}%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block font-display">Criticality Risk</span>
                <span className={`font-bold text-sm block mt-1 font-display ${activeRec.severity === 'Critical' ? 'text-brand-red' : 'text-brand-amber'}`}>
                  {activeRec.severity}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block font-display">MDM Target Gateway</span>
                <span className="text-slate-855 font-extrabold text-sm block mt-1 font-display">
                  {!(activeRec.id.startsWith('DEV') || activeRec.id.startsWith('USR') || activeRec.id.startsWith('EKS'))
                    ? 'Microsoft Intune'
                    : 'Workspace ONE'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* SHAP Telemetry Attributions Matrix */}
          <GlassCard className="space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800 m-0 font-display">ML Attribution Matrix (SHAP Feature Importance)</h3>
              </div>
              <div className="relative group">
                <HelpCircle className="h-4 w-4 text-slate-455 hover:text-slate-600 cursor-help" />
                <div className="absolute right-0 bottom-6 hidden group-hover:block bg-slate-950 text-slate-300 text-[10px] p-2.5 rounded-xl border border-slate-800 w-72 shadow-2xl z-20 font-semibold leading-relaxed">
                  SHAP (SHapley Additive exPlanations) values explain how much each telemetry feature contributed to the AI's final recommended action. Hover over a feature to see its plain language description.
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-550 font-semibold leading-relaxed m-0 font-display">
              The chart below breaks down the telemetry attributions. <span className="text-brand-red font-bold">Positive values</span> push the AI model towards quarantine/mitigation, while <span className="text-brand-emerald font-bold">negative values</span> support normal behavior or lesser intervention.
            </p>

            <div className="space-y-3">
              {(() => {
                const getFriendlyFeatureName = (feature: string) => {
                  const translations: Record<string, string> = {
                    "Deviation From Normal Routine": "Activity differs from standard routines (e.g. working hours or actions).",
                    "Activity Unpredictability Level": "Unpredictable sequence of actions compared to typical admin/user habits.",
                    "Overall Threat Severity Score": "Estimated severity rating of the threat risk based on global security feeds.",
                    "Data Source Reliability": "Calculated reliability score of the source telemetry systems and log pipelines.",
                    "Rapid Repeated Access Actions": "High rate of actions in a short period (often a sign of scripted attacks).",
                    "Unusual Ordering of Steps": "A non-standard command order (e.g. trying to modify system files right after disabling security agents).",
                    "Matches Known Virus Profile": "Activity signature matches known malware or virus hashes.",
                    "Spike in Failed Password Attempts": "Recent spike in failed passwords, suggesting brute-force guessing.",
                    "Device Antivirus Turned Off": "The system firewall or antivirus tool was turned off or disabled.",
                    "Strange Background Command Execution": "Unapproved scripts or command lines executing in the background.",
                    "Local Firewalls Running": "Validates if local host firewalls are active and blocking unauthorized ingress.",
                    "Severity of Known Software Vulnerabilities": "Risk score of outdated software version flaws on the target machine.",
                    "Open Network Port Flagged": "An open port that accepts unsolicited incoming network traffic, posing ingress risks.",
                    "Unsecured Cloud API Commands": "Unencrypted or unauthenticated API queries sent to database clusters.",
                    "Protected Cloud Network Rule Active": "Confirms active cloud network filtering rules are guarding server boundaries.",
                    "Impossible Travel Distance Alert": "Logins from distant countries in a time window physically impossible to travel.",
                    "Attempted Access to Restricted Personnel Files": "Attempted reads on restricted directory files (unauthorized data scanning).",
                    "Multiple Logins from Different Locations": "Parallel active user sessions initiated from unrelated geographic networks.",
                    "Verified Company VPN Connection": "Access initiated through corporate secure VPN, reducing brute-force alerts.",
                    "File Write Frequency": "Speed of file modifications. A sudden spike can indicate ransomware encryption.",
                    "VSSADMIN Command Call": "Call to VSSADMIN backup command (often used by ransomware to delete local backups to prevent recovery).",
                    "Entropy Variance": "Abnormal randomness level in files, a key indicator of files being encrypted by ransomware.",
                    "Endpoint Agent Active": "Confirms the local security agent is active, online, and reporting healthy status.",
                    "Outbound Bytes Spike": "Sudden massive size of outgoing data, suggesting potential data exfiltration (theft).",
                    "Port Tunneling Heuristic": "Attempt to encapsulate protocols (e.g., SSH over HTTPS) to bypass network firewall rules.",
                    "Unauthorized Remote IP": "Connection attempted to a remote server that is not on the corporate allowed list.",
                    "Migration Cron Active": "Confirms a scheduled system data migration task is currently running."
                  };
                  return translations[feature] || feature;
                };

                return activeRec.shapImportance && activeRec.shapImportance.length > 0 ? (
                  activeRec.shapImportance.map((factor, idx) => {
                    const isPos = factor.type === 'positive';
                    const percentage = Math.abs(factor.val);
                    return (
                      <div key={idx} className="group relative space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <div className="flex items-center space-x-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${isPos ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                            <span className="text-slate-700 font-display group-hover:text-slate-950 transition-colors">
                              {factor.feature}
                            </span>
                          </div>
                          <span className={`font-mono font-extrabold ${isPos ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isPos ? '+' : '-'}{percentage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isPos 
                                ? 'bg-gradient-to-r from-rose-500 to-orange-400 group-hover:from-rose-600 group-hover:to-orange-500 shadow-sm' 
                                : 'bg-gradient-to-r from-emerald-500 to-teal-400 group-hover:from-emerald-600 group-hover:to-teal-500 shadow-sm'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        
                        {/* Plain Language Tooltip description shown on row hover */}
                        <div className="hidden group-hover:block absolute left-0 -top-7 bg-slate-950 border border-slate-800 text-slate-250 text-[10px] px-2.5 py-1 rounded-lg shadow-xl z-20 font-bold">
                          {getFriendlyFeatureName(factor.feature)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">No SHAP attribution data available for this recommendation.</p>
                );
              })()}
            </div>
          </GlassCard>


          {/* Choose Action or Auto-executed Banner */}
          {isAutoExecuted ? (
            <GlassCard className="p-6 border-brand-emerald/30 bg-brand-emerald/5 shadow-sm rounded-3xl flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 rounded-full animate-bounce">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-emerald text-white uppercase tracking-widest font-mono">
                  ✓ Executed Automatically
                </span>
                <h3 className="text-base font-extrabold text-slate-800 mt-3 m-0 font-display">Policy Dispatched by Autonomy Rules</h3>
                <p className="text-xs text-slate-650 font-semibold mt-1.5 leading-normal max-w-md font-display">
                  This low-risk or act-and-notify command was automatically resolved and pushed to your fleet UEM/MDM gateway under Autonomy Level <span className="font-mono">{autonomyLevel}</span>.
                </p>
              </div>

              <div className="w-full bg-white p-4 rounded-xl border border-slate-200 text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wide font-display">
                  <span>Execution Audit Details</span>
                  <span className="font-mono">Active Policy</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <div className="text-slate-500 font-display">Action Deployed:</div>
                  <div className="text-slate-800 font-bold text-right font-display">{activeRec.action}</div>
                  <div className="text-slate-500 font-display">Risk Assessment:</div>
                  <div className="text-brand-emerald font-bold text-right font-display">Low Risk / Pre-Approved</div>
                  <div className="text-slate-500 font-display">MDM Gateway API:</div>
                  <div className="text-slate-800 font-bold text-right font-display">
                    {!(activeRec.id.startsWith('DEV') || activeRec.id.startsWith('USR') || activeRec.id.startsWith('EKS'))
                      ? 'Microsoft Intune (Graph)'
                      : 'Workspace ONE (REST)'}
                  </div>
                  <div className="text-slate-500 font-display">Audit Status:</div>
                  <div className="text-brand-emerald font-bold text-right uppercase font-mono">Success (200 OK)</div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Choose Action */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 m-0 font-display">Select Action</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Approve Card */}
                  <button
                    onClick={() => handleActionSelect('Approved')}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      selectedAction === 'Approved'
                        ? 'bg-brand-emerald/15 border-brand-emerald text-brand-emerald shadow-sm font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${selectedAction === 'Approved' ? 'bg-brand-emerald text-white' : 'bg-brand-emerald/10 text-brand-emerald'}`}>
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="mt-2 font-display">
                      <p className="text-sm font-extrabold m-0">Approve</p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Apply suggested rule</p>
                    </div>
                  </button>

                  {/* Reject Card */}
                  <button
                    onClick={() => handleActionSelect('Rejected')}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      selectedAction === 'Rejected'
                        ? 'bg-brand-red/15 border-brand-red text-brand-red shadow-sm font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${selectedAction === 'Rejected' ? 'bg-brand-red text-white' : 'bg-brand-red/10 text-brand-red'}`}>
                      <X className="h-4 w-4" />
                    </div>
                    <div className="mt-2 font-display">
                      <p className="text-sm font-extrabold m-0">Dismiss Alert</p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">No action needed</p>
                    </div>
                  </button>

                  {/* Escalate Card */}
                  <button
                    onClick={() => handleActionSelect('Escalated')}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      selectedAction === 'Escalated'
                        ? 'bg-brand-amber/15 border-brand-amber text-brand-amber shadow-sm font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${selectedAction === 'Escalated' ? 'bg-brand-amber text-white' : 'bg-brand-amber/10 text-brand-amber'}`}>
                      <AlertOctagon className="h-4 w-4" />
                    </div>
                    <div className="mt-2 font-display">
                      <p className="text-sm font-extrabold m-0">Send for Help</p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Ask advanced security</p>
                    </div>
                  </button>

                  {/* Request More Details Card */}
                  <button
                    onClick={() => handleActionSelect('Details Requested')}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      selectedAction === 'Details Requested'
                        ? 'bg-brand-blue/15 border-brand-blue text-brand-blue shadow-sm font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${selectedAction === 'Details Requested' ? 'bg-brand-blue text-white' : 'bg-brand-blue/10 text-brand-blue'}`}>
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div className="mt-2 font-display">
                      <p className="text-sm font-extrabold m-0">Ask Details</p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Plain language explanation</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* AI Incident Card */}
              {(selectedAction === 'Rejected' || selectedAction === 'Escalated' || selectedAltAction) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/5 border border-amber-500/25 p-5 rounded-2xl shadow-sm space-y-3.5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider m-0 flex items-center space-x-1.5 font-display">
                        <span>⚠ AI Incident & Safeguard Card</span>
                      </h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
                        Generated by flan-t5-base incident analyzer
                      </p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-200 tracking-widest font-mono">
                      Safeguard Overridden
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs font-semibold">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider font-mono block">What Happened</span>
                      <p className="text-slate-800 mt-1 m-0 leading-relaxed font-medium">
                        {incidentSummary}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider font-mono block">Why (Root Cause)</span>
                        <p className="text-slate-800 mt-1 m-0 leading-relaxed font-medium">
                          {incidentRootCause}
                        </p>
                      </div>
                      
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider font-mono block">Failed Control / Safeguard</span>
                        <p className="text-slate-800 mt-1 m-0 leading-relaxed font-medium">
                          {incidentSafeguard}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Override Justification Notes */}
              <div className="space-y-1">
                <div className="flex justify-between items-center font-display">
                  <label className="text-xs font-bold text-slate-750">Reason for action (Optional)</label>
                  <span className="text-xs font-semibold text-slate-500 font-sans">Saved to fleet audit trail</span>
                </div>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Explain your decision for audit purposes..."
                  className="w-full h-16 p-2.5 rounded-xl border border-slate-300 bg-white focus:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan text-sm font-semibold placeholder:text-slate-400 text-slate-800 transition-all font-display"
                />
              </div>
            </>
          )}
        </div>

        {/* Right Column: Autonomy Control & Activity Log */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Autonomy Control Card */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-brand-cyan" />
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider m-0 font-display">Autonomy Control</h3>
            </div>
            
            <GlassCard className="p-3 border-slate-200 space-y-3">
              <div className="grid grid-cols-1 gap-2 font-display">
                {[
                  { 
                    level: 1, 
                    label: 'Always Ask Me', 
                    desc: 'Require approval for all remediation actions.', 
                    example: 'Example: Isolating endpoints or firewall blocks pause for manual verification.' 
                  },
                  { 
                    level: 2, 
                    label: 'Auto Low Risk', 
                    desc: 'Auto-execute low-risk, pre-approved rules.', 
                    example: 'Example: Software updates or compliance patches deploy instantly; quarantines hold.' 
                  },
                  { 
                    level: 3, 
                    label: 'Act and Notify', 
                    desc: 'Auto-resolve all alerts immediately.', 
                    example: 'Example: High-severity device isolations run instantly, sending notifications post-action.' 
                  }
                ].map((opt) => (
                  <button
                    key={opt.level}
                    onClick={() => setAutonomyLevel(opt.level)}
                    type="button"
                    className={`w-full flex items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                      autonomyLevel === opt.level
                        ? 'bg-brand-blue/10 border-brand-blue shadow-sm text-indigo-900 font-extrabold'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center h-4 mt-0.5 flex-shrink-0">
                      <div className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                        autonomyLevel === opt.level 
                          ? 'border-brand-cyan' 
                          : 'border-slate-300'
                      }`}>
                        {autonomyLevel === opt.level && (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                        )}
                      </div>
                    </div>
                    <div className="ml-2 flex-1 min-w-0">
                      <span className={`text-xs font-bold block font-display leading-tight ${
                        autonomyLevel === opt.level ? 'text-indigo-950' : 'text-slate-800'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 block mt-0.5 font-display leading-snug">{opt.desc}</span>
                      <span className="text-[8.5px] font-medium text-slate-450 block mt-1 italic leading-normal border-t border-slate-150/60 pt-1">{opt.example}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Dynamic Behavior Preview Card */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-[10px]">
                <div className="flex justify-between items-center font-bold text-slate-500 uppercase tracking-wide font-display">
                  <span>Current Mode Preview</span>
                  <span className="font-bold text-indigo-900 font-display font-mono">Level {autonomyLevel}</span>
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-200 font-display">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-700 font-display">Patch Deployment</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                      autonomyLevel >= 2 
                        ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                        : 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20'
                    }`}>
                      {autonomyLevel >= 2 ? '✓ Auto-Approve' : '⚠ Human Review'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-700 font-display">Device Quarantine</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                      autonomyLevel === 3 
                        ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                        : 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20'
                    }`}>
                      {autonomyLevel === 3 ? '✓ Auto-Approve' : '⚠ Human Review'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Activity Log Card */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 m-0 font-display">Activity Log</h3>
            </div>

            <GlassCard className="p-3 border-slate-200 max-h-[160px] overflow-y-auto bg-white">
              <div className="relative border-l border-slate-200 ml-2 space-y-3.5 py-0.5">
                {activityLog.map((log, idx) => {
                  const isUser = log.type === 'user';
                  const isAI = log.type === 'ai';

                  return (
                    <div key={idx} className="relative pl-6">
                      {/* Timestamp Dot indicator */}
                      <span className={`absolute -left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                        isUser ? 'bg-brand-cyan' : isAI ? 'bg-indigo-500 animate-pulse' : 'bg-slate-350'
                      }`}></span>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className={`uppercase font-display ${
                            isUser ? 'text-indigo-950 font-black' : isAI ? 'text-indigo-650 font-extrabold animate-pulse' : 'text-slate-400'
                          }`}>
                            {log.type === 'ai' ? 'TrustLens AI' : log.type === 'user' ? 'Operator' : 'Telemetry'}
                          </span>
                          <span className="text-slate-500 font-mono font-bold text-xs">{log.time}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-750 leading-relaxed m-0">
                          {log.event}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Submit footer */}
          <div className="flex flex-col space-y-3 pt-4 border-t border-slate-200 font-display">
            <div>
              {isAutoExecuted ? (
                <p className="text-xs font-bold text-brand-emerald flex items-center m-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald mr-1.5 animate-ping" />
                  Action completed automatically under active autonomy policy guidelines.
                </p>
              ) : selectedAction ? (
                <p className="text-xs font-bold text-slate-650 flex items-center m-0 leading-normal">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan mr-1.5 animate-ping" />
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
              className="w-full inline-flex items-center justify-center space-x-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer font-display"
            >
              <span>{isAutoExecuted ? "Return to Dashboard" : "Submit Decision"}</span>
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DecisionScreen;
