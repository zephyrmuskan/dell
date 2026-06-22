import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { GlassCard } from '../components/GlassCard';
import { AlertBadge } from '../components/AlertBadge';
import { 
  Shield, 
  ShieldAlert as CriticalIcon,
  AlertTriangle, 
  Info,
  ChevronRight,
  Database,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardScreen: React.FC = () => {
  const { filteredRecommendations: recommendations, setActiveRecId, setCurrentScreen, dashboardStats, autonomyLevel, user } = useWorkflow();

  const handleAnalyze = (id: string) => {
    setActiveRecId(id);
    setCurrentScreen(2);
  };

  const persona = user?.user_metadata?.persona || 'admin';

  // Aggregated card data
  const metrics = [
    { label: 'Total Fleet Alerts', value: dashboardStats.total_alerts, color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20 shadow-glow-blue', icon: Shield },
    { label: 'Critical Threats', value: dashboardStats.critical, color: 'text-brand-red bg-brand-red/10 border-brand-red/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse-slow', icon: CriticalIcon },
    { label: 'High Priority Rules', value: dashboardStats.high, color: 'text-brand-amber bg-brand-amber/10 border-brand-amber/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]', icon: AlertTriangle },
    { label: 'Medium Compliance', value: dashboardStats.medium, color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20 shadow-[0_0_15px_rgba(129,140,248,0.15)]', icon: Info },
  ];

  const getGatewayBadge = (id: string) => {
    if (id.startsWith('DEV') || id.startsWith('USR') || id.startsWith('EKS')) {
      return {
        style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
        label: 'Workspace ONE UEM'
      };
    } else {
      return {
        style: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
        label: 'Microsoft Intune'
      };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-200/80 font-display select-none">
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-brand-cyan/20 flex items-center justify-center font-bold text-brand-cyan border border-brand-cyan/20 text-lg flex-shrink-0 mt-0.5">
            {persona === 'admin' ? '🛠' : persona === 'analyst' ? '🔍' : '📋'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 m-0">
              Welcome back, {user?.user_metadata?.full_name || 'Operator'}
            </h4>
            <p className="text-xs text-slate-600 font-semibold mt-0.5 leading-normal">
              Role: <span className="text-indigo-600 font-bold">{user?.user_metadata?.role || 'System Operator'}</span> 
              {persona === 'stakeholder' 
                ? ' • Optimized plain-language console explanations active.' 
                : persona === 'analyst' 
                ? ' • Detailed telemetry and anomaly metrics active.' 
                : ' • System fleet command and audit controls active.'
              }
            </p>
          </div>
        </div>
        <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full font-mono border flex-shrink-0 ml-4 ${
          persona === 'admin' 
            ? 'bg-brand-cyan/20 text-indigo-800 border-brand-cyan/40' 
            : persona === 'analyst' 
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {persona === 'admin' ? 'IT Administrator' : persona === 'analyst' ? 'IT Security Analyst' : 'Compliance Stakeholder'}
        </span>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0 font-display">Fleet Compliance & Security Gateway</h2>
        <p className="text-sm text-slate-600 font-semibold mt-1 leading-relaxed">Real-time threat monitoring and autonomous policy recommendations for Microsoft Intune & VMware Workspace ONE fleets.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <GlassCard 
              key={idx} 
              className="relative overflow-hidden group hover:-translate-y-1 hover:border-brand-cyan/30 transition-all duration-300 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 tracking-wide uppercase font-display">{metric.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1.5 font-mono">{metric.value}</h3>
                </div>
                <div className={`p-3 rounded-xl border ${metric.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </GlassCard>
          );
        })}
      </div>

      {/* AI Recommendation Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0 font-display">Compliance Policy Recommendations</h3>
            <p className="text-xs text-slate-600 font-semibold">Suggested remediation actions derived from MDM compliance sensor telemetry.</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-cyan/15 text-indigo-800 border border-brand-cyan/30 shadow-sm">
            <Cpu className="h-3 w-3 mr-1" />
            {recommendations.filter(r => r.status === 'Pending').length} Pending Actions
          </span>
        </div>

        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">MDM Gateway</th>
                  <th className="px-4 py-3">Suggested Action</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Sources</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {recommendations.map((rec) => {
                  const statusColors = {
                    Pending: 'bg-slate-100 text-slate-700 border-slate-200',
                    Approved: 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]',
                    Rejected: 'bg-brand-red/10 text-brand-red border-brand-red/20',
                    Escalated: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20',
                    'Details Requested': 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                  };

                  let displayStatus = rec.status as string;
                  if (rec.status === 'Approved') {
                    if (autonomyLevel === 4) {
                      displayStatus = 'Auto-Executed';
                    } else if (autonomyLevel === 3 && rec.severity === 'Medium') {
                      displayStatus = 'Auto-Resolved';
                    } else {
                      displayStatus = 'Approved';
                    }
                  }

                  const gwBadge = getGatewayBadge(rec.id);

                  return (
                    <tr 
                      key={rec.id}
                      className="hover:bg-slate-50 transition-colors duration-150 group"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <AlertBadge severity={rec.severity} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">{rec.id}</div>
                        <div className="text-xs text-slate-600 font-semibold">{rec.type}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold border ${gwBadge.style}`}>
                          {gwBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-extrabold text-slate-900">
                        {rec.action}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-800">{rec.confidence}%</span>
                          <span className="text-xs font-extrabold text-slate-700 uppercase px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200/80">
                            {rec.confidence >= 80 ? 'High' : 'Medium'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-bold">
                          <Database className="h-3 w-3 text-slate-400" />
                          <span>{rec.sources.join(' + ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                          displayStatus === 'Auto-Executed' || displayStatus === 'Auto-Resolved'
                            ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20'
                            : statusColors[rec.status]
                        }`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleAnalyze(rec.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-900 bg-brand-cyan/20 hover:bg-brand-cyan hover:text-brand-navy border border-brand-cyan/30 transition-all duration-200 cursor-pointer"
                        >
                          <span>{rec.status === 'Approved' ? 'View Audit' : 'Analyze'}</span>
                          <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default DashboardScreen;
