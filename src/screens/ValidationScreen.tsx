import React, { useState } from 'react';
import { useWorkflow, type AgentChainStep } from '../context/WorkflowContext';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';
import { SimilarCasesModal } from '../components/SimilarCasesModal';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye,
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatSummaryLayman, formatInputLayman, formatOutputLayman } from '../utils/laymanFormatter';

const renderInlineMarkdown = (text: string) => {
  if (!text) return "";
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-extrabold text-slate-950">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-slate-200 text-indigo-900 px-1 py-0.5 rounded font-mono text-[10px] font-bold border border-slate-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const renderFormattedText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start space-x-1.5 text-xs text-inherit">
              <span className="mt-1 flex-shrink-0">•</span>
              <span className="font-medium text-inherit">{renderInlineMarkdown(trimmed.slice(2))}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="text-xs font-medium text-inherit m-0 leading-normal">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
};

export const ValidationScreen: React.FC = () => {
  const { 
    activeRec, 
    setCurrentScreen, 
    selectedAltAction, 
    setSelectedAltAction,
    understandingScore,
    trustScore,
    agentChain,
    inspectedAgents,
    inspectAgent
  } = useWorkflow();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<AgentChainStep | null>(null);

  const { trustDNA, devilsAdvocate, timeMachine, similarCasesList, action } = activeRec;

  // Render SVG circle helper for dials
  const renderCircleDial = (percentage: number, colorClass: string, glowClass: string) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center h-24 w-24 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-white/10"
            strokeWidth="7"
            fill="transparent"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            className={colorClass}
            strokeWidth="7"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className={`absolute flex flex-col items-center justify-center bg-brand-navy/90 h-18 w-18 rounded-full border border-white/10 shadow-inner ${glowClass}`}>
          <span className="text-lg font-bold text-white font-mono">{percentage}%</span>
          <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest font-display">Score</span>
        </div>
      </div>
    );
  };

  // Large Dial visualizer for main trust score
  const renderLargeCircleDial = (percentage: number, colorClass: string, glowClass: string) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center h-36 w-36 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-white/10"
            strokeWidth="10"
            fill="transparent"
          />
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            className={colorClass}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className={`absolute flex flex-col items-center justify-center bg-brand-navy/90 h-28 w-28 rounded-full border border-white/10 shadow-inner ${glowClass}`}>
          <span className="text-3xl font-bold text-white font-mono">{percentage}%</span>
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1 font-display">Trust Score</span>
        </div>
      </div>
    );
  };

  // Monospace block bar helper
  const renderBlockBar = (percentage: number, colorClass: string) => {
    const blocksCount = Math.round(percentage / 10);
    const filledBlocks = '█'.repeat(blocksCount);
    const emptyBlocks = '░'.repeat(10 - blocksCount);
    return (
      <span className={`font-mono text-xs ${colorClass}`}>
        {filledBlocks}
        <span className="text-white/10">{emptyBlocks}</span>
      </span>
    );
  };


  const steps = [
    { number: 1, label: 'Security Score' },
    { number: 2, label: 'Risk Checks' },
    { number: 3, label: 'System History' },
    { number: 4, label: 'Trust Visualizer' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen(2)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors font-display cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Device Analysis</span>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display m-0">UEM Trust Validation</h2>
        </div>
      </div>

      {/* Connected validation steps layout */}
      <div className="max-w-5xl mx-auto">
        <GlassCard className="p-6 flex flex-col justify-between h-[540px]">
          {/* Stepper Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-5 flex-shrink-0">
            {steps.map((s, idx) => {
              const isActive = activeStep === s.number;
              const isCompleted = activeStep > s.number;
              
              return (
                <React.Fragment key={s.number}>
                  <button
                    onClick={() => setActiveStep(s.number)}
                    type="button"
                    className="flex flex-col items-center focus:outline-none cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                        isActive 
                          ? 'bg-brand-cyan text-brand-navy shadow-sm scale-110' 
                          : isCompleted 
                          ? 'bg-brand-emerald text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                      }`}>
                        {s.number}
                      </div>
                      <span className={`text-xs font-extrabold transition-all font-display hidden md:inline ${
                        isActive 
                          ? 'text-slate-900 font-bold' 
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`h-[2px] flex-1 mx-2 transition-all duration-500 ${
                      activeStep > s.number ? 'bg-brand-emerald' : 'bg-slate-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            {activeStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
                <div className="md:col-span-5 space-y-4 pr-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide font-display">Scanned Attributes</h4>
                  <div className="py-1">
                    {renderCircleDial(trustDNA.score, 'stroke-brand-cyan', 'shadow-sm')}
                  </div>
                  <div className="space-y-3 pt-1">
                    <ProgressBar label="Reliability of Source Logs" value={trustDNA.dataQuality} color="emerald" />
                    <ProgressBar label="Matches Organization Rules" value={trustDNA.policyMatch} color="emerald" />
                    <ProgressBar label="Similar Behavior in Other Devices" value={trustDNA.fleetSimilarity} color="blue" />
                    <ProgressBar label="Matches Known Security Threats" value={trustDNA.threatIntelMatch} color="blue" />
                    <ProgressBar label="Unexplained Activities" value={trustDNA.unknownRisk} color="amber" />
                  </div>
                </div>
                <div className="md:col-span-7 flex flex-col min-h-0 overflow-hidden border-l border-slate-200 pl-4">
                  <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide font-display m-0">AI Decision Journey</h4>
                    <button
                      onClick={() => setCurrentScreen(5)}
                      type="button"
                      className="text-[10px] font-black text-indigo-800 bg-brand-cyan/20 hover:bg-brand-cyan hover:text-brand-navy border border-brand-cyan/35 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-display"
                    >
                      Open Interactive Graph
                    </button>
                  </div>

                  {/* Visual Timeline and Inspector Panel */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
                    {/* Left Column (Timeline list) */}
                    <div className="lg:col-span-7 overflow-y-auto pr-1 space-y-3">
                      {[
                        ...agentChain,
                        {
                          name: "Human Decision Maker",
                          role: "Final Approval Authority",
                          input_data: agentChain.length > 0 ? agentChain[agentChain.length - 1].output_data : "Trust Companion explanation complete.",
                          output_data: activeRec.status === 'Pending' ? "Admin Decision Pending" : `Action ${activeRec.status}`,
                          confidence: 100,
                          reasoning: activeRec.status === 'Pending'
                            ? "The AI agent chain has finalized the context transfer. System is awaiting manual operator decision (Approve/Reject/Escalate) in the MDM Command Center."
                            : `Operator verified recommendations and triggered policy execution. Final state: ${activeRec.status}.`,
                          timestamp: new Date().toISOString()
                        }
                      ].map((agent, idx, list) => {
                        const isLast = idx === list.length - 1;
                        const isInspected = inspectedAgents.includes(agent.name);
                        const isHuman = agent.name === "Human Decision Maker";
                        const isSelected = selectedAgent?.name === agent.name;

                        let iconText = "🤖";
                        if (agent.name.includes("Detection")) iconText = "🔍";
                        else if (agent.name.includes("Risk")) iconText = "📊";
                        else if (agent.name.includes("Remediation")) iconText = "🛠";
                        else if (agent.name.includes("Devil")) iconText = "😈";
                        else if (agent.name.includes("Companion")) iconText = "🤖";
                        else if (isHuman) iconText = "👨";

                        return (
                          <div key={idx} className="relative">
                            {!isLast && (
                              <div className="absolute left-5.5 top-10 bottom-[-16px] w-[2px] bg-slate-200 z-0"></div>
                            )}

                            <button
                              onClick={() => {
                                setSelectedAgent(agent);
                                if (!isHuman) inspectAgent(agent.name);
                              }}
                              type="button"
                              className={`w-full flex items-start p-3 rounded-xl border text-left transition-all z-10 relative cursor-pointer active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-brand-cyan/10 border-brand-cyan shadow-sm'
                                  : isHuman
                                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                  : isInspected
                                  ? 'bg-slate-50 border-brand-emerald/40 hover:border-brand-emerald/70 shadow-sm'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {/* Bubble Icon */}
                              <div className={`flex items-center justify-center h-8 w-8 rounded-lg text-sm border font-sans z-10 flex-shrink-0 ${
                                isHuman 
                                  ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                  : isSelected
                                  ? 'bg-brand-cyan/20 text-indigo-900 border-brand-cyan/30'
                                  : isInspected
                                  ? 'bg-brand-emerald/15 text-brand-emerald border-brand-emerald/30'
                                  : 'bg-slate-50 text-slate-400 border-slate-200/60'
                              }`}>
                                {iconText}
                              </div>

                              {/* Text content */}
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <span className={`text-xs font-bold font-display truncate block ${
                                    isHuman ? 'text-slate-900 font-extrabold' : isSelected ? 'text-indigo-850 font-black' : 'text-slate-800'
                                  }`}>
                                    {agent.name}
                                  </span>
                                  {agent.confidence > 0 && (
                                    <span className="text-[10px] font-extrabold bg-slate-100 border border-slate-200 px-1 py-0.2 rounded font-mono">
                                      {agent.confidence}%
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 block tracking-wider uppercase mt-0.5 font-display">{agent.role}</span>
                                <p className="text-xs text-slate-850 font-bold truncate mt-1.5 m-0">
                                  {agent.name === "Human Decision Maker"
                                    ? agent.output_data
                                    : formatSummaryLayman(agent.name, agent.output_data)}
                                </p>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column (Inspector Card details) */}
                    <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto">
                      {selectedAgent ? (
                        <div className="space-y-3.5 text-slate-800">
                          <div>
                            <div className="flex items-center justify-between font-display">
                              <span className="text-xs font-bold uppercase text-slate-500 tracking-widest">Agent Details</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-cyan/20 text-indigo-800 border border-brand-cyan/30 uppercase tracking-widest font-mono">
                                Conf: {selectedAgent.confidence}%
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 mt-1 m-0 font-display">{selectedAgent.name}</h4>
                            <p className="text-[10px] font-semibold text-slate-550 uppercase tracking-wider mt-0.5 font-display">{selectedAgent.role}</p>
                          </div>

                          <div className="border-t border-slate-200 pt-2.5 space-y-3">
                            {/* Input Received */}
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-display">Input Received:</span>
                              <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 leading-relaxed max-h-[140px] overflow-y-auto">
                                {selectedAgent.name === "Human Decision Maker" 
                                  ? selectedAgent.input_data 
                                  : renderFormattedText(formatInputLayman(selectedAgent.name, selectedAgent.input_data))}
                              </div>
                            </div>

                            {/* Decision Made */}
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-display">Decision Made:</span>
                              <div className="mt-1 p-2 bg-brand-cyan/20 rounded-lg border border-brand-cyan/30 text-xs font-semibold text-indigo-900 leading-relaxed max-h-[160px] overflow-y-auto">
                                {selectedAgent.name === "Human Decision Maker"
                                  ? selectedAgent.output_data
                                  : renderFormattedText(formatOutputLayman(selectedAgent.name, selectedAgent.output_data))}
                              </div>
                            </div>

                            {/* Detailed Reasoning */}
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-display">Reasoning Logic:</span>
                              <p className="mt-1 text-xs font-bold text-slate-700 leading-relaxed italic m-0">
                                "{selectedAgent.reasoning}"
                              </p>
                            </div>
                          </div>

                          <div className="text-xs font-bold text-slate-500 uppercase text-right pt-2 border-t border-slate-200 font-display">
                            Logged: {selectedAgent.timestamp.split('T')[0]}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center h-full py-12 px-2 space-y-3">
                          <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-slate-400 shadow-sm">
                            <Cpu className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 m-0 font-display">Agent Inspector</h4>
                            <p className="text-xs text-slate-650 font-semibold leading-relaxed mt-1.5">
                              Click any agent node in the Decision Journey timeline to inspect input context transfers, logical reasoning steps, and confidence logs.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-brand-red animate-pulse-slow" />
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide m-0 font-display">Devil's Advocate Analysis</h4>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0 font-display">Assumptions & Contradictions Checked:</h5>
                  </div>
                  <ul className="space-y-3 pl-0 list-none m-0 max-h-[180px] overflow-y-auto pr-1">
                    {devilsAdvocate.points.map((point, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5 text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-red mt-1.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alternative Action */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 m-0 font-display">Suggested Alternative Action</p>
                  <button
                    onClick={() => setSelectedAltAction(!selectedAltAction)}
                    type="button"
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                      selectedAltAction
                        ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald shadow-sm font-extrabold'
                        : 'bg-white hover:bg-slate-100 border-slate-250 text-slate-700 hover:text-slate-900 font-bold'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 text-sm">
                      <Eye className={`h-4 w-4 ${selectedAltAction ? 'text-brand-emerald' : 'text-slate-400'}`} />
                      <span>{devilsAdvocate.alternativeAction}</span>
                    </div>
                    <span className={`text-xs uppercase px-2 py-0.5 rounded font-bold border font-display ${
                      selectedAltAction 
                        ? 'bg-brand-emerald text-white border-brand-emerald' 
                        : 'bg-slate-150 text-slate-500 border-slate-200'
                    }`}>
                      {selectedAltAction ? 'Selected' : 'Select'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
                <div className="md:col-span-5 flex flex-col justify-center items-center text-center space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide font-display">Historical Accuracy</h4>
                  <div className="py-1">
                    {renderCircleDial(timeMachine.accuracy, 'stroke-brand-amber', 'shadow-sm')}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 m-0 font-display">Based on <span className="font-mono">{timeMachine.cases}</span> similar cases</p>
                    <p className="text-[11px] text-slate-550 font-semibold uppercase tracking-wider mt-0.5 font-display">Past accuracy baseline</p>
                  </div>
                </div>
                <div className="md:col-span-7 flex flex-col justify-between border-l border-slate-200 pl-4 min-h-0">
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide font-display">Case Outcome Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center space-x-2">
                           <span className="h-2.5 w-2.5 rounded-full bg-brand-emerald" />
                           <span>Correct system alerts</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">{timeMachine.breakdown.correct} ({Math.round(timeMachine.breakdown.correct / timeMachine.cases * 100)}%)</span>
                      </div>

                      <div className="flex items-center justify-between text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center space-x-2">
                           <span className="h-2.5 w-2.5 rounded-full bg-brand-red" />
                           <span>Alerts with no real issues found</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">{timeMachine.breakdown.falsePositives} ({Math.round(timeMachine.breakdown.falsePositives / timeMachine.cases * 100)}%)</span>
                      </div>

                      <div className="flex items-center justify-between text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center space-x-2">
                           <span className="h-2.5 w-2.5 rounded-full bg-brand-amber" />
                           <span>Unusual cases sent for human help</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">{timeMachine.breakdown.escalated} ({Math.round(timeMachine.breakdown.escalated / timeMachine.cases * 100)}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      type="button"
                      className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl border border-brand-amber/40 hover:border-brand-amber bg-amber-50 hover:bg-amber-100 text-sm font-extrabold text-amber-800 transition-all duration-200 cursor-pointer active:scale-95 font-display"
                    >
                      <span>See similar past cases</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
                <div className="md:col-span-5 flex flex-col justify-center items-center text-center space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide font-display">Calibrated Trust Dial</h4>
                  <div className="py-1">
                    {renderLargeCircleDial(trustScore, 'stroke-brand-emerald', 'shadow-sm')}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 m-0 font-display">Calibrated Score: <span className="font-mono">{trustScore}%</span></p>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5 font-display">Dynamic Attribution</p>
                  </div>
                </div>
                <div className="md:col-span-7 flex flex-col justify-center border-l border-slate-200 pl-4 min-h-0 space-y-4">
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-slate-800 font-mono text-xs space-y-3 leading-normal relative select-none">
                    <div className="absolute top-0 right-0 bg-slate-100 text-slate-650 px-3 py-0.5 rounded-bl-lg font-display text-xs font-bold uppercase tracking-wider border-l border-b border-slate-200">
                      Attribution Weights
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-550 uppercase tracking-widest border-b border-slate-250 pb-1.5 m-0 font-display">
                      Weighted Balance Formula
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-display font-medium text-slate-700">AI Confidence (40%)</span>
                        <div className="flex items-center space-x-2 font-semibold">
                          {renderBlockBar(activeRec.confidence, 'text-brand-cyan')}
                          <span className="text-slate-950 font-black w-8 text-right font-mono">{activeRec.confidence}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-display font-medium text-slate-700">Historical Acc (30%)</span>
                        <div className="flex items-center space-x-2 font-semibold">
                          {renderBlockBar(timeMachine.accuracy, 'text-brand-amber')}
                          <span className="text-slate-950 font-black w-8 text-right font-mono">{timeMachine.accuracy}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-display font-medium text-slate-700">User Understand (30%)</span>
                        <div className="flex items-center space-x-2 font-semibold">
                          {renderBlockBar(understandingScore, 'text-brand-emerald')}
                          <span className="text-slate-950 font-black w-8 text-right font-mono">{understandingScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-center font-display text-xs font-bold text-slate-500">
                      (0.4 × <span className="font-mono">{activeRec.confidence}%</span>) + (0.3 × <span className="font-mono">{activeRec.timeMachine.accuracy}%</span>) + (0.3 × <span className="font-mono">{understandingScore}%</span>) = <span className="text-brand-emerald font-bold text-sm font-mono">{trustScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Footer Controls */}
          <div className="flex justify-between items-center border-t border-slate-200 pt-4 flex-shrink-0 mt-5">
            <div>
              {activeStep > 1 ? (
                <button
                  onClick={() => setActiveStep(activeStep - 1)}
                  type="button"
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition cursor-pointer active:scale-95 font-display"
                >
                  <span>Back</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">* Click steps to navigate</span>
              )}
            </div>
            
            <div>
              {activeStep < 4 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  type="button"
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold font-display text-white bg-indigo-900 hover:bg-indigo-850 rounded-xl shadow-sm transition cursor-pointer active:scale-95"
                >
                  <span>Next Step</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentScreen(4)}
                  type="button"
                  className="inline-flex items-center space-x-1.5 px-6 py-3 text-sm font-bold font-display text-white bg-indigo-900 hover:bg-indigo-850 shadow-sm rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer animate-pulse-slow"
                >
                  <span>Proceed to Command Center</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

        {/* Similar Cases Modal */}
        <SimilarCasesModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          cases={similarCasesList} 
          action={action} 
        />
      </motion.div>
  );
};

export default ValidationScreen;
