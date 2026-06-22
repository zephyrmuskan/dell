import React, { useState, useEffect, useRef } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { 
  Search, ShieldAlert, Wrench, AlertTriangle, 
  History, Cpu, RotateCcw, FastForward, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AgentStatus = 'idle' | 'thinking' | 'analyzing' | 'responding' | 'completed';

export const AICollaborationBoard: React.FC = () => {
  const { activeRec, trustScore } = useWorkflow();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepStatus, setStepStatus] = useState<AgentStatus>('thinking');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const agentNames = [
    "Detection Agent",
    "Risk Assessment Agent",
    "Devil's Advocate Agent",
    "Remediation Agent",
    "Trust Time Machine",
    "AI Consensus Engine"
  ];

  // Map icons with light-theme friendly colors
  const getAgentIcon = (name: string) => {
    const cls = "h-5 w-5";
    switch (name) {
      case "Detection Agent": return <Search className={`${cls} text-cyan-600`} />;
      case "Risk Assessment Agent": return <ShieldAlert className={`${cls} text-rose-600`} />;
      case "Remediation Agent": return <Wrench className={`${cls} text-emerald-600`} />;
      case "Devil's Advocate Agent": return <AlertTriangle className={`${cls} text-amber-600`} />;
      case "Trust Time Machine": return <History className={`${cls} text-blue-600`} />;
      case "AI Consensus Engine": return <Cpu className={`${cls} text-indigo-600`} />;
      default: return <Cpu className={`${cls} text-slate-500`} />;
    }
  };

  // Map roles
  const getAgentRole = (name: string) => {
    switch (name) {
      case "Detection Agent": return "Telemetry & Anomaly Analyzer";
      case "Risk Assessment Agent": return "Severity & Urgency Evaluator";
      case "Devil's Advocate Agent": return "Validation & Falsification Challenger";
      case "Remediation Agent": return "Policy & Resolution Suggester";
      case "Trust Time Machine": return "Historical Incident Profiler";
      case "AI Consensus Engine": return "Consensus Coordinator";
      default: return "AI Assistant";
    }
  };

  // Map backend model names
  const getAgentModel = (name: string) => {
    switch (name) {
      case "Detection Agent": return "distilbert-base-uncased";
      case "Risk Assessment Agent": return "Gemini 2.5 Flash";
      case "Remediation Agent": return "Gemini 2.5 Flash";
      case "Devil's Advocate Agent": return "Qwen2.5-7B-Instruct";
      case "Trust Time Machine": return "all-MiniLM-L6-v2";
      case "AI Consensus Engine": return "TrustLens Decision Heuristics";
      default: return "AI Model";
    }
  };

  // Reset and restart simulation on alert change
  useEffect(() => {
    restartSimulation();
    return () => clearTimer();
  }, [activeRec?.id]);

  // Scroll to bottom of conversation automatically as steps unlock
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activeStepIndex, stepStatus]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const restartSimulation = () => {
    clearTimer();
    setActiveStepIndex(0);
    setStepStatus('thinking');
    runSimulation(0, 'thinking');
  };

  const runSimulation = (stepIndex: number, currentStatus: AgentStatus) => {
    clearTimer();
    if (stepIndex >= agentNames.length) {
      return;
    }

    let delay = 600;
    let nextStatus: AgentStatus = 'idle';
    let nextIndex = stepIndex;

    if (currentStatus === 'thinking') {
      nextStatus = 'analyzing';
      delay = 600;
    } else if (currentStatus === 'analyzing') {
      nextStatus = 'responding';
      delay = 800;
    } else if (currentStatus === 'responding') {
      nextStatus = 'completed';
      delay = 1000;
    } else if (currentStatus === 'completed') {
      nextIndex = stepIndex + 1;
      nextStatus = 'thinking';
      delay = 500;
    }

    timerRef.current = setTimeout(() => {
      if (nextIndex < agentNames.length) {
        setActiveStepIndex(nextIndex);
        setStepStatus(nextStatus);
        runSimulation(nextIndex, nextStatus);
      }
    }, delay);
  };

  const skipSimulation = () => {
    clearTimer();
    setActiveStepIndex(agentNames.length - 1);
    setStepStatus('completed');
  };

  // Get status of a specific agent card
  const getStatusOfAgent = (name: string): AgentStatus => {
    const idx = agentNames.indexOf(name);
    if (idx < activeStepIndex) return 'completed';
    if (idx > activeStepIndex) return 'idle';
    return stepStatus;
  };

  // Dynamic utterances
  const getAgentUtterance = (name: string) => {
    const actionName = activeRec?.action || "Quarantine Device";
    const devId = activeRec?.id || "DEV1248";
    const severity = activeRec?.severity || "Critical";
    const confidence = activeRec?.confidence || 87;

    switch (name) {
      case "Detection Agent":
        return {
          title: "I analyzed the telemetry logs.",
          bullets: [
            `Evaluated endpoint device telemetry for ${devId}.`,
            ...(activeRec?.why ? activeRec.why.slice(0, 3) : [])
          ],
          extra: `Confidence: ${confidence + 5 > 100 ? 100 : confidence + 5}%`
        };

      case "Risk Assessment Agent":
        return {
          title: "Reviewing Detection Agent findings.",
          bullets: [
            `Indicators closely match patterns of recent ${severity.toLowerCase()} malware compliance exceptions.`,
            `Risk level calibrated as "${severity}" with business impact classified as high.`
          ],
          extra: `Risk Level: ${severity} | Confidence: ${confidence + 2 > 100 ? 100 : confidence + 2}%`
        };

      case "Devil's Advocate Agent":
        return {
          title: "Counterpoint:",
          bullets: activeRec?.devilsAdvocate?.points ? activeRec.devilsAdvocate.points.slice(0, 2) : [],
          extra: `Alternative Action: Monitor for 24 Hours | Confidence: 35%`
        };

      case "Remediation Agent":
        return {
          title: "Considering both viewpoints.",
          bullets: [
            `The potential threat exposure and speed are high.`,
            `Baseline indicators warrant containment. I recommend executing standard policy.`
          ],
          extra: `Recommendation: ${actionName} | Confidence: ${confidence}%`
        };

      case "Trust Time Machine":
        return {
          title: `Found ${activeRec?.timeMachine?.cases || 0} similar incidents.`,
          bullets: activeRec?.timeMachine ? [
            `${activeRec.timeMachine.breakdown.correct} correct ${actionName.toLowerCase() === 'quarantine device' ? 'quarantines' : 'actions'} executed fleet-wide.`,
            `${activeRec.timeMachine.breakdown.falsePositives} false positive instances resolved during fallback monitoring.`,
            `${activeRec.timeMachine.breakdown.escalated} incident escalated for security response team intervention.`
          ] : [],
          extra: `Historical Accuracy: ${activeRec?.timeMachine?.accuracy || 0}%`
        };

      case "AI Consensus Engine":
        return {
          title: "Consensus Summary:",
          bullets: activeRec ? [
            `Detection Agent: Support ${actionName}`,
            `Risk Agent: Support ${actionName}`,
            `Remediation Agent: Support ${actionName}`,
            `Devil's Advocate: ${activeRec.devilsAdvocate?.alternativeAction || "Monitor"}`
          ] : [],
          extra: `Final Vote: 3 Support / 1 Oppose | Trust Score: ${trustScore}%`
        };

      default:
        return { title: "Ready.", bullets: [], extra: "" };
    }
  };

  // Render handoff between agent cards
  const renderHandoff = (fromAgent: string, toAgent: string) => {
    const idx = agentNames.indexOf(fromAgent);
    if (idx > activeStepIndex || (idx === activeStepIndex && stepStatus !== 'completed')) {
      return null;
    }

    const actionName = activeRec?.action || "Quarantine Device";
    const confidence = activeRec?.confidence || 87;

    let contextData: { label: string; value: string }[] = [];
    if (fromAgent === "Detection Agent") {
      contextData = [
        { label: "Threat Type", value: "Anomaly Pattern" },
        { label: "Indicators", value: String(activeRec?.why?.length || 0) },
        { label: "Confidence", value: `${confidence + 5}%` }
      ];
    } else if (fromAgent === "Risk Assessment Agent") {
      contextData = [
        { label: "Risk Level", value: activeRec?.severity || "Critical" },
        { label: "Impact", value: "High Severity Alert" },
        { label: "Fleet Baselines", value: `${activeRec?.trustDNA?.fleetSimilarity || 88}% similarity` }
      ];
    } else if (fromAgent === "Devil's Advocate Agent") {
      contextData = [
        { label: "Dispute Flagged", value: "True Alert Doubted" },
        { label: "Alt proposed", value: activeRec?.devilsAdvocate?.alternativeAction || "Monitor" }
      ];
    } else if (fromAgent === "Remediation Agent") {
      contextData = [
        { label: "Target Policy", value: actionName },
        { label: "Confidence Score", value: `${confidence}%` }
      ];
    } else if (fromAgent === "Trust Time Machine") {
      contextData = [
        { label: "Historical Accuracy", value: `${activeRec?.timeMachine?.accuracy || 90}%` },
        { label: "Similar Cases", value: `${activeRec?.timeMachine?.cases || 0} cases` }
      ];
    }

    return (
      <div className="flex flex-col items-center my-2.5 px-4 w-full">
        {/* Animated flow indicator line */}
        <div className="w-0.5 h-4 bg-gradient-to-b from-indigo-500/80 to-slate-200" />
        
        {/* Compact Handoff context banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 w-full max-w-lg shadow-sm text-[10px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 select-none">
          <div className="flex items-center space-x-1.5 font-bold">
            <Activity className="h-3 w-3 text-indigo-500 animate-pulse" />
            <span className="text-slate-800 uppercase tracking-wider">Handoff context passed:</span>
            <span className="text-slate-500 font-medium">To {toAgent.replace(" Agent", "")}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-mono font-bold bg-white border border-slate-200/60 rounded px-1.5 py-0.5">
            {contextData.map((d, i) => (
              <span key={i} className="text-slate-500">
                {d.label}: <span className="text-indigo-600 font-extrabold">{d.value}</span>
                {i < contextData.length - 1 && <span className="mx-1 text-slate-300">|</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="w-0.5 h-4 bg-gradient-to-b from-slate-200 to-indigo-500/80" />
      </div>
    );
  };

  const getStatusBadgeClass = (status: AgentStatus) => {
    switch (status) {
      case 'idle':
        return 'bg-slate-100 text-slate-400 border-slate-200';
      case 'thinking':
        return 'bg-amber-50 text-amber-700 border-amber-200/60 animate-pulse';
      case 'analyzing':
        return 'bg-blue-50 text-blue-700 border-blue-200/60 animate-pulse';
      case 'responding':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/60 animate-pulse';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    }
  };

  return (
    <div className="flex flex-col h-[65vh] bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm relative text-slate-800">
      
      {/* Simulation Controller Header */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between z-10 select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">AI Collaborative Reasoning</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={restartSimulation}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition text-xs font-bold flex items-center space-x-1 cursor-pointer"
            title="Replay Discussion"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>
          
          {(activeStepIndex < agentNames.length - 1 || stepStatus !== 'completed') && (
            <button
              onClick={skipSimulation}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-xs font-bold flex items-center space-x-1 cursor-pointer"
              title="Skip Simulation"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span>Skip</span>
            </button>
          )}
        </div>
      </div>

      {/* Discussion Room Scrollable Container */}
      <div 
         ref={containerRef}
         className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence>
          {agentNames.map((name, index) => {
            const status = getStatusOfAgent(name);
            if (status === 'idle') return null;

            const role = getAgentRole(name);
            const content = getAgentUtterance(name);
            const isCompleted = status === 'completed';

            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full flex flex-col items-center"
              >
                {/* Agent Card */}
                <div 
                  className={`w-full max-w-xl p-4 border rounded-2xl transition-all shadow-sm bg-white ${
                    isCompleted 
                      ? 'border-slate-200' 
                      : 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.08)] bg-white/95'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-center w-full select-none">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-slate-50 border border-slate-150 rounded-lg">
                        {getAgentIcon(name)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 m-0 tracking-wide">{name}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1.5 mt-0.5 leading-none">
                          <span className="text-[9px] text-slate-500 font-semibold tracking-wider font-mono">{role}</span>
                          <span className="hidden sm:inline text-slate-300 text-[9px]">•</span>
                          <span className="text-indigo-600 text-[8px] font-black uppercase tracking-wider font-mono mt-1 sm:mt-0">{getAgentModel(name)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest font-mono ${getStatusBadgeClass(status)}`}>
                      {status === 'thinking' && 'Thinking...'}
                      {status === 'analyzing' && 'Analyzing...'}
                      {status === 'responding' && 'Responding...'}
                      {status === 'completed' && 'Completed'}
                    </span>
                  </div>

                  {/* Card Content */}
                  {status === 'completed' ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3.5 space-y-2 border-t border-slate-100 pt-3"
                    >
                      <p className="text-[11px] font-extrabold text-slate-800 font-sans tracking-wide leading-relaxed">
                        {content.title}
                      </p>
                      <ul className="space-y-1.5 pl-0 m-0 list-none">
                        {content.bullets.map((b, i) => (
                          <li key={i} className="text-[11px] text-slate-650 leading-relaxed font-semibold flex items-start space-x-2">
                            <span className="text-indigo-500 mt-1 flex-shrink-0">•</span>
                            <span className="break-words">{b}</span>
                          </li>
                        ))}
                      </ul>
                      {content.extra && (
                        <div className="flex justify-between items-center text-[10px] bg-slate-50 border border-slate-150 px-2.5 py-1.5 rounded-lg mt-2.5 font-mono select-none">
                          <span className="text-slate-400 uppercase tracking-widest font-bold">Decision Confidence</span>
                          <span className="font-extrabold text-indigo-600">{content.extra}</span>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="mt-4 flex items-center space-x-2 justify-center py-2 text-slate-500 text-xs font-semibold uppercase tracking-wider font-mono select-none">
                      <div className="flex space-x-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold ml-2">
                        {status === 'thinking' && 'Accessing baselines...'}
                        {status === 'analyzing' && 'Scanning historical matches...'}
                        {status === 'responding' && 'Generating log records...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Handoff context */}
                {index < agentNames.length - 1 && renderHandoff(name, agentNames[index + 1])}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
