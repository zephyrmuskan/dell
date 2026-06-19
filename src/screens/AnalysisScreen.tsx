import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { GlassCard } from '../components/GlassCard';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  FileText,
  FileCheck,
  ServerCrash
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AnalysisScreen: React.FC = () => {
  const { activeRec, setCurrentScreen } = useWorkflow();

  const { id, action, confidence, why, nutritionLabel, shapImportance } = activeRec;

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Back & Breadcrumb header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen(1)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs font-bold text-slate-400">
          Recommendation ID: <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono font-extrabold">{id}-REC</span>
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="bg-white/80 border border-slate-200/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-premium">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-xl text-brand-red mt-1">
            <ServerCrash className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-brand-red/10 text-brand-red text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-brand-red/20">
                Critical Alert
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">{id}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5 m-0">Recommendation: {action}</h2>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
          <div className="text-right">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AI Confidence</p>
            <p className="text-sm font-black text-slate-800 m-0">{confidence >= 80 ? 'High Confidence' : 'Moderate Confidence'}</p>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-brand-blue flex items-center justify-center font-black text-slate-900 text-xs shadow-glow-blue bg-white">
            {confidence}%
          </div>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Why this recommendation? */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-slate-500" />
              <h3 className="text-base font-bold text-slate-800 m-0">Why this recommendation?</h3>
            </div>

            <div className="space-y-3">
              {why.map((reason, idx) => {
                const [title, description] = reason.split(' - ');
                return (
                  <GlassCard key={idx} className="p-4 flex items-start space-x-3.5 bg-white/95 border-slate-200/40 hover:-translate-y-0.5">
                    <div className="p-1 bg-brand-emerald/10 rounded-full border border-brand-emerald/30 text-brand-emerald mt-0.5">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 m-0">{title}</h4>
                      {description && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* MDM Command Dispatch Payload */}
          <div className="space-y-4 pt-4 border-t border-slate-200/60">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-brand-blue/10 rounded-lg text-brand-blue border border-brand-blue/20">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 m-0">MDM Gateway Action Payload</h3>
            </div>

            {(() => {
              const isIntune = !(id.startsWith('DEV') || id.startsWith('USR') || id.startsWith('EKS'));
              const payload = isIntune
                ? action.toLowerCase().includes('quarantine')
                  ? {
                      gateway: 'Microsoft Intune',
                      method: 'POST',
                      url: `https://graph.microsoft.com/v1.0/deviceManagement/managedDevices('${id}')/retire`,
                      body: { keepEnrollmentData: false, wipeDevice: false }
                    }
                  : action.toLowerCase().includes('patch')
                  ? {
                      gateway: 'Microsoft Intune',
                      method: 'POST',
                      url: `https://graph.microsoft.com/v1.0/deviceManagement/deviceCompliancePolicies('${id}')/assign`,
                      body: { targetGroup: "Update-Ring-Win11-Critical", forceReboot: true }
                    }
                  : {
                      gateway: 'Microsoft Intune',
                      method: 'PATCH',
                      url: `https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies('CAP-088-ENFORCE-MFA')`,
                      body: { state: "enabled", targetUsers: [id] }
                    }
                : action.toLowerCase().includes('quarantine')
                ? {
                    gateway: 'VMware Workspace ONE UEM',
                    method: 'POST',
                    url: `https://as711.awmdm.com/API/mdm/devices/${id}/commands?command=quarantine`,
                    body: { CustomMessage: "Quarantined due to anomalous behavior telemetry." }
                  }
                : action.toLowerCase().includes('patch')
                ? {
                    gateway: 'VMware Workspace ONE UEM',
                    method: 'POST',
                    url: `https://as711.awmdm.com/API/mdm/smartgroups/SG-DB-SERVERS-PATCH/install`,
                    body: { PatchId: 10482, Schedule: "Immediate" }
                  }
                : {
                    gateway: 'VMware Workspace ONE Access',
                    method: 'POST',
                    url: `https://access.workspaceone.com/API/v1/users/${id}/mfaChallenge`,
                    body: { triggerType: "StepUpAuthentication", provider: "DUO_MFA" }
                  };

              return (
                <GlassCard className="p-5 bg-slate-900 border-slate-950 text-slate-100 font-mono text-xs rounded-xl space-y-3 relative overflow-hidden select-text">
                  <div className="absolute top-0 right-0 bg-slate-800 text-slate-400 px-3 py-1 rounded-bl-lg font-sans text-[9px] font-black uppercase tracking-wider">
                    {payload.gateway} API Request
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Request Endpoint</span>
                    <div className="flex items-center space-x-2 text-slate-200">
                      <span className="font-extrabold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-900/60 text-[10px]">
                        {payload.method}
                      </span>
                      <span className="break-all font-semibold select-all">{payload.url}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">JSON Body Payload</span>
                    <pre className="text-[11px] text-emerald-400 select-all p-3 bg-slate-950 rounded-lg overflow-x-auto leading-relaxed border border-slate-800/80">
                      {JSON.stringify(payload.body, null, 2)}
                    </pre>
                  </div>
                </GlassCard>
              );
            })()}
          </div>
        </div>

        {/* Right Section: AI Nutrition Label */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-slate-500" />
            <div className="flex items-center space-x-1">
              <h3 className="text-base font-bold text-slate-800 m-0">AI Nutrition Label</h3>
              <span title="Provides standardized facts regarding AI models, data sources, and accuracy.">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
              </span>
            </div>
          </div>

          {/* FDA Styled Nutrition Label */}
          <div className="bg-white border-2 border-slate-900 rounded-xl p-6 shadow-premium relative font-sans text-slate-900">
            {/* Header */}
            <h4 className="text-xl font-black tracking-tight border-b-4 border-slate-900 pb-1 m-0">AI FACT CHECK</h4>
            <p className="text-[10px] font-bold text-slate-500 border-b border-slate-900 py-1.5 uppercase tracking-wide">Standardized transparency reporting</p>
            
            {/* Confidence & Strength */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 py-2">
              <span className="text-sm font-black uppercase">Confidence Level</span>
              <span className="text-sm font-black">{confidence}% ({confidence >= 80 ? 'High' : 'Medium'})</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-900 py-2.5">
              <span className="text-xs font-bold uppercase text-slate-600">Evidence Strength</span>
              <div className="flex items-center space-x-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span 
                    key={i} 
                    className={`h-3 w-3 rounded-full border border-slate-900/10 ${
                      i < nutritionLabel.evidenceStrength 
                        ? 'bg-brand-emerald shadow-glow-emerald' 
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-500 ml-1">({nutritionLabel.evidenceStrength}/5)</span>
              </div>
            </div>

            {/* Data Sources */}
            <div className="flex flex-col border-b border-slate-900 py-2.5">
              <span className="text-xs font-bold uppercase text-slate-600">Data Sources Used</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {nutritionLabel.sources.map((src, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    {src}
                  </span>
                ))}
              </div>
            </div>

            {/* Other stats */}
            <div className="flex items-center justify-between border-b border-slate-900 py-2.5">
              <span className="text-xs font-bold uppercase text-slate-600">Similar Cases Analyzed</span>
              <span className="text-xs font-black">{nutritionLabel.similarCases.toLocaleString()}</span>
            </div>

            <div className="flex flex-col border-b border-slate-900 py-2.5">
              <span className="text-xs font-bold uppercase text-slate-600">Known Limitations</span>
              <span className="text-xs font-semibold text-slate-800 mt-1 italic">
                "{nutritionLabel.limitations}"
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Model Architecture</span>
              <span>{nutritionLabel.model}</span>
            </div>
          </div>

          {/* SHAP Feature Importance Card */}
          <GlassCard className="p-5 border-slate-200/50 bg-white/95 mt-4 space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider m-0">SHAP Feature Attribution</h4>
                <span className="text-[9px] font-semibold text-slate-400">Model Weights</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Impact of local feature values on AI risk score calculation.</p>
            </div>

            <div className="space-y-3">
              {shapImportance && shapImportance.map((factor, idx) => {
                const isPos = factor.type === 'positive';
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span className="text-slate-700">{factor.feature}</span>
                      <span className={isPos ? 'text-brand-red font-bold' : 'text-brand-emerald font-bold'}>
                        {isPos ? '+' : ''}{factor.val}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isPos ? 'bg-brand-red/80' : 'bg-brand-emerald/80'
                        }`}
                        style={{ width: `${factor.val}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center space-x-4 border-t border-slate-100 pt-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-brand-red/80"></span>
                <span>Elevates Risk</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-brand-emerald/80"></span>
                <span>Reduces Risk</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Button footer */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => setCurrentScreen(3)}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-extrabold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-glow-blue hover:shadow-premium-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>View Trust Validation</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default AnalysisScreen;
