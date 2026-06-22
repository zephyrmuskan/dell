import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Sliders

} from 'lucide-react';
import { motion } from 'framer-motion';

export const SettingsScreen: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<Record<string, boolean>>({
    gemini: false,
    groq: false,
    huggingface: false,
  });
  const [testResults, setTestResults] = useState<Record<string, { status: string; loading: boolean }>>({
    gemini: { status: '', loading: false },
    groq: { status: '', loading: false },
    huggingface: { status: '', loading: false },
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/api-status');
      if (res.ok) {
        const data = await res.json();
        setApiStatus({
          gemini: !!data.gemini,
          groq: !!data.groq,
          huggingface: !!data.huggingface,
        });
      }
    } catch (e) {
      console.error("Failed to load API status", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async (provider: 'gemini' | 'groq' | 'huggingface') => {
    setTestResults(prev => ({
      ...prev,
      [provider]: { status: '', loading: true }
    }));

    try {
      const res = await fetch(`/api/test-connection/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setTestResults(prev => ({
          ...prev,
          [provider]: { status: data.status, loading: false }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [provider]: { status: 'Connection Failed', loading: false }
        }));
      }
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { status: 'Connection Failed', loading: false }
      }));
    }
  };

  const providers = [
    {
      id: 'gemini' as const,
      name: 'Gemini',
      desc: 'Used as the primary LLM engine for the Risk Assessment, Remediation, and Trust Companion agents.',
      model: 'Model: gemini-2.5-flash',
    },
    {
      id: 'groq' as const,
      name: 'Groq',
      desc: 'Used as the fallback LLM engine for failovers to guarantee high-availability. Silent and transparent.',
      model: 'Model: llama-3.3-70b-versatile',
    },
    {
      id: 'huggingface' as const,
      name: 'Hugging Face',
      desc: 'Powers the Detection (distilbert-base-uncased), Devil\'s Advocate (Qwen2.5-7B-Instruct), and Incident Report (flan-t5-base) agents.',
      model: 'Models: distilbert, Qwen2.5, Flan-T5',
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Settings Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0 font-display flex items-center gap-2">
          <Sliders className="h-6 w-6 text-indigo-600" />
          <span>System & API Settings</span>
        </h2>
        <p className="text-sm text-slate-600 font-semibold mt-1 leading-relaxed">
          Configure API endpoints, perform system health checks, and verify connections for all active AI agents.
        </p>
      </div>

      {/* API Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((p) => {
          const isConfigured = apiStatus[p.id];
          const test = testResults[p.id];

          return (
            <GlassCard key={p.id} className="p-6 flex flex-col justify-between hover:border-brand-cyan/25 transition-all duration-300">
              <div className="space-y-4">
                {/* Provider Title & Status Indicator */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 m-0">{p.name}</h3>
                  <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    isConfigured 
                      ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' 
                      : 'bg-brand-red/10 text-brand-red border-brand-red/20'
                  }`}>
                    {isConfigured ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>✓ {p.name} Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>❌ Not Configured</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Details */}
                <p className="text-xs text-slate-600 font-semibold leading-relaxed m-0">
                  {p.desc}
                </p>
                <div className="text-[10px] text-indigo-800 bg-slate-100 border border-slate-200/80 px-2 py-1 rounded font-mono font-bold w-fit">
                  {p.model}
                </div>
              </div>

              {/* Action and Test Results Area */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col space-y-3">
                <button
                  onClick={() => handleTestConnection(p.id)}
                  disabled={test.loading}
                  className="w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-900 bg-brand-cyan/20 hover:bg-brand-cyan hover:text-brand-navy border border-brand-cyan/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${test.loading ? 'animate-spin' : ''}`} />
                  <span>{test.loading ? 'Testing...' : `Test ${p.name}`}</span>
                </button>

                {/* Health Check Status Return */}
                {test.status && (
                  <div className={`text-xs font-black text-center py-1.5 px-3 rounded-lg border transition-all duration-300 ${
                    test.status === 'Connected Successfully'
                      ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20'
                      : 'bg-brand-red/10 text-brand-red border-brand-red/20'
                  }`}>
                    {test.status}
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SettingsScreen;
