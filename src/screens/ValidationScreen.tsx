import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';
import { SimilarCasesModal } from '../components/SimilarCasesModal';
import { 
  ArrowLeft, 
  ArrowRight, 
  Dna, 
  HelpCircle, 
  History,
  Eye,
  AlertTriangle,
  Database,
  Search,
  Cpu,
  Scale
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ValidationScreen: React.FC = () => {
  const { 
    activeRec, 
    setCurrentScreen, 
    selectedAltAction, 
    setSelectedAltAction 
  } = useWorkflow();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { trustDNA, devilsAdvocate, timeMachine, subagents, similarCasesList, action } = activeRec;

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
            className="stroke-slate-100"
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
        <div className={`absolute flex flex-col items-center justify-center bg-white h-18 w-18 rounded-full border border-slate-200/50 shadow-inner ${glowClass}`}>
          <span className="text-lg font-black text-slate-800">{percentage}%</span>
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
        </div>
      </div>
    );
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
          onClick={() => setCurrentScreen(2)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Recommendation Analysis</span>
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 m-0">AI Validation & Verification</h2>
        </div>
      </div>

      {/* Grid of 3 side-by-side cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Trust DNA */}
        <GlassCard className="flex flex-col justify-between hover:border-brand-blue/30 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-brand-blue/10 rounded-lg text-brand-blue border border-brand-blue/20">
                  <Dna className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 m-0">AI Trust DNA</h3>
              </div>
              <span title="Trust DNA maps underlying model parameters and input data quality metrics.">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </span>
            </div>

            {/* Score Ring */}
            <div className="py-1">
              {renderCircleDial(trustDNA.score, 'stroke-brand-blue', 'shadow-glow-blue')}
            </div>

            {/* Progress Bars */}
            <div className="space-y-3 pt-1">
              <ProgressBar label="Data Quality" value={trustDNA.dataQuality} color="emerald" />
              <ProgressBar label="Policy Match" value={trustDNA.policyMatch} color="emerald" />
              <ProgressBar label="Fleet Similarity" value={trustDNA.fleetSimilarity} color="blue" />
              <ProgressBar label="Threat Intel Match" value={trustDNA.threatIntelMatch} color="blue" />
              <ProgressBar label="Unknown Risk Factors" value={trustDNA.unknownRisk} color="amber" />
            </div>

            {/* Multi-Agent Handoff Visualizer */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider m-0">Multi-Agent Handoff Visualizer</h4>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">Consensus Flow</span>
              </div>
              
              <div className="relative pl-0.5 space-y-5">
                {subagents && subagents.map((step, idx) => {
                  const isLast = idx === subagents.length - 1;
                  const isAdvocate = step.name.includes("Devil");
                  
                  // Pick colors based on role
                  const iconBg = isAdvocate 
                    ? 'bg-brand-amber/10 text-brand-amber border-brand-amber/30 shadow-glow-amber animate-pulse' 
                    : 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/30';
                  
                  const getAgentIcon = (name: string) => {
                    if (name.includes("Ingestion")) return <Database className="h-3.5 w-3.5" />;
                    if (name.includes("Intel")) return <Search className="h-3.5 w-3.5" />;
                    if (name.includes("Anomaly") || name.includes("Classifier")) return <Cpu className="h-3.5 w-3.5" />;
                    return <Scale className="h-3.5 w-3.5" />;
                  };

                  const getMDMStepDetails = (recId: string, name: string, originalDetails: string) => {
                    const isIntune = !(recId.startsWith('DEV') || recId.startsWith('USR') || recId.startsWith('EKS'));
                    const sourceSystem = isIntune ? 'Microsoft Intune Graph API' : 'VMware Workspace ONE UEM REST API';
                    
                    if (name.includes('Ingestion')) {
                      return `Queries ${sourceSystem} for endpoint hardware compliance status, local OS event logs, and compliance policy settings.`;
                    }
                    if (name.includes('Intel')) {
                      return `Correlates active processes with global CVE databases, Microsoft Security Copilot threat signals, and Workspace ONE Intelligence risk scores.`;
                    }
                    if (name.includes('Anomaly') || name.includes('Classifier')) {
                      return `Evaluates behavioral deviation of host operations relative to the active compliance fleet baseline.`;
                    }
                    if (name.includes('Devil')) {
                      return `Challenges assumptions by verifying active update rings, smart groups, and authorized IT administrator policy overrides.`;
                    }
                    return originalDetails;
                  };

                  return (
                    <div key={idx} className="relative flex items-start group">
                      {/* Vertical line connection */}
                      {!isLast && (
                        <div className="absolute left-4.5 top-9 bottom-[-20px] w-[2px] bg-gradient-to-b from-slate-200 via-slate-200 to-transparent"></div>
                      )}
                      
                      {/* Step Indicator with Icon */}
                      <div className={`z-10 flex items-center justify-center h-9 w-9 rounded-xl border-2 border-white shadow-premium transition-all duration-300 transform group-hover:scale-110 ${iconBg}`}>
                        {getAgentIcon(step.name)}
                      </div>
                      
                      {/* Content Card */}
                      <div className="ml-4 flex-1 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/80 p-3 rounded-xl transition-all duration-300">
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black tracking-tight ${isAdvocate ? 'text-brand-amber' : 'text-slate-800'}`}>
                            {step.name}
                          </span>
                          <span className="text-[9px] font-extrabold text-slate-400 bg-white border border-slate-200/50 px-1.5 py-0.5 rounded font-mono">
                            Conf: {step.score}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-1 m-0">
                          {getMDMStepDetails(activeRec.id, step.name, step.details)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Devil's Advocate */}
        <GlassCard className="flex flex-col justify-between hover:border-brand-red/30 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-brand-red/10 rounded-lg text-brand-red border border-brand-red/20">
                  <AlertTriangle className="h-4 w-4 animate-pulse-slow" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 m-0">AI Devil's Advocate</h3>
              </div>
              <span title="Falsification logs: analysis of indicators that contradict the recommendation.">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </span>
            </div>

            <div>
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Why this recommendation may be wrong:</h4>
            </div>

            <ul className="space-y-3 pl-0 list-none m-0">
              {devilsAdvocate.points.map((point, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs font-semibold text-slate-700 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-red mt-1.5 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Alternative Action */}
          <div className="pt-6 border-t border-slate-100 mt-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Recommended Alternative Action</p>
            <button
              onClick={() => setSelectedAltAction(!selectedAltAction)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                selectedAltAction
                  ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald shadow-glow-emerald font-extrabold'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-950 font-bold'
              }`}
            >
              <div className="flex items-center space-x-2.5 text-xs">
                <Eye className={`h-4 w-4 ${selectedAltAction ? 'text-brand-emerald' : 'text-slate-400'}`} />
                <span>{devilsAdvocate.alternativeAction}</span>
              </div>
              <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-extrabold border ${
                selectedAltAction 
                  ? 'bg-brand-emerald text-white border-brand-emerald' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {selectedAltAction ? 'Selected' : 'Select'}
              </span>
            </button>
          </div>
        </GlassCard>

        {/* Card 3: Trust Time Machine */}
        <GlassCard className="flex flex-col justify-between hover:border-brand-amber/30 group">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-brand-amber/10 rounded-lg text-brand-amber border border-brand-amber/20">
                  <History className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Trust Time Machine</h3>
              </div>
              <span title="Historical accuracy and feedback stats on similar security triggers.">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
              </span>
            </div>

            {/* Subheader accuracy */}
            <div className="py-1">
              {renderCircleDial(timeMachine.accuracy, 'stroke-brand-amber', 'shadow-glow-amber')}
            </div>

            {/* Based on... */}
            <div className="text-center">
              <p className="text-xs font-extrabold text-slate-800 m-0">Based on {timeMachine.cases} Similar Cases</p>
              <p className="text-[10px] text-slate-400 font-medium">Historical baseline evaluation</p>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-brand-emerald" />
                  <span>Correct Recommendations</span>
                </div>
                <span className="font-extrabold text-slate-800">{timeMachine.breakdown.correct} ({Math.round(timeMachine.breakdown.correct / timeMachine.cases * 100)}%)</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-brand-red" />
                  <span>False Positives</span>
                </div>
                <span className="font-extrabold text-slate-800">{timeMachine.breakdown.falsePositives} ({Math.round(timeMachine.breakdown.falsePositives / timeMachine.cases * 100)}%)</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-brand-amber" />
                  <span>Escalated / Outlier Cases</span>
                </div>
                <span className="font-extrabold text-slate-800">{timeMachine.breakdown.escalated} ({Math.round(timeMachine.breakdown.escalated / timeMachine.cases * 100)}%)</span>
              </div>
            </div>

            {/* Similarity Explorer trigger */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-brand-amber/30 hover:border-brand-amber bg-brand-amber/5 hover:bg-brand-amber/10 text-xs font-bold text-brand-amber transition-all duration-200 active:scale-95"
              >
                <span>Explore Similar Cases</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => setCurrentScreen(4)}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-extrabold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-glow-blue hover:shadow-premium-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Proceed to Decision</span>
          <ArrowRight className="h-4 w-4" />
        </button>
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
