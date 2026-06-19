import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';
import { 
  ArrowLeft, 
  ArrowRight, 
  Dna, 
  HelpCircle, 
  History,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ValidationScreen: React.FC = () => {
  const { 
    activeRec, 
    setCurrentScreen, 
    selectedAltAction, 
    setSelectedAltAction 
  } = useWorkflow();

  const { trustDNA, devilsAdvocate, timeMachine } = activeRec;

  // Render SVG circle helper for dials
  const renderCircleDial = (percentage: number, colorClass: string, glowClass: string) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center h-28 w-28 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Animated path circle */}
          <motion.circle
            cx="56"
            cy="56"
            r={radius}
            className={colorClass}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className={`absolute flex flex-col items-center justify-center bg-white h-20 w-20 rounded-full border border-slate-200/50 shadow-inner ${glowClass}`}>
          <span className="text-xl font-extrabold text-slate-800">{percentage}%</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
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
            <div className="py-2">
              {renderCircleDial(trustDNA.score, 'stroke-brand-blue', 'shadow-glow-blue')}
            </div>

            {/* Progress Bars */}
            <div className="space-y-3.5 pt-2">
              <ProgressBar label="Data Quality" value={trustDNA.dataQuality} color="emerald" />
              <ProgressBar label="Policy Match" value={trustDNA.policyMatch} color="emerald" />
              <ProgressBar label="Fleet Similarity" value={trustDNA.fleetSimilarity} color="blue" />
              <ProgressBar label="Threat Intel Match" value={trustDNA.threatIntelMatch} color="blue" />
              <ProgressBar label="Unknown Risk Factors" value={trustDNA.unknownRisk} color="amber" />
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

            {/* Sub-header */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Why this recommendation may be wrong:</h4>
            </div>

            {/* Bullet reasons */}
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
            <div className="py-2">
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
    </motion.div>
  );
};

export default ValidationScreen;
