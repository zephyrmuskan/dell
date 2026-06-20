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
  const { recommendations, setActiveRecId, setCurrentScreen, dashboardStats, autonomyLevel } = useWorkflow();

  const handleAnalyze = (id: string) => {
    setActiveRecId(id);
    setCurrentScreen(2);
  };

  // Aggregated card data
  const metrics = [
    { label: 'Total Fleet Alerts', value: dashboardStats.total_alerts, color: 'text-brand-blue bg-brand-blue/5 border-brand-blue/20', icon: Shield },
    { label: 'Critical Threats', value: dashboardStats.critical, color: 'text-brand-red bg-brand-red/5 border-brand-red/20 animate-pulse-slow', icon: CriticalIcon },
    { label: 'High Priority Rules', value: dashboardStats.high, color: 'text-brand-amber bg-brand-amber/5 border-brand-amber/20', icon: AlertTriangle },
    { label: 'Medium Compliance', value: dashboardStats.medium, color: 'text-indigo-500 bg-indigo-500/5 border-indigo-500/20', icon: Info },
  ];

  const getGatewayBadge = (id: string) => {
    if (id.startsWith('DEV') || id.startsWith('USR') || id.startsWith('EKS')) {
      return {
        style: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        label: 'Workspace ONE UEM'
      };
    } else {
      return {
        style: 'bg-sky-50 text-sky-700 border-sky-200/80',
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
      className="space-y-8"
    >
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">Fleet Compliance & Security Gateway</h2>
        <p className="text-sm text-slate-500 font-medium">Real-time threat monitoring and autonomous policy recommendations for Microsoft Intune & VMware Workspace ONE fleets.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <GlassCard 
              key={idx} 
              className="relative overflow-hidden group hover:-translate-y-1 hover:border-brand-blue/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">{metric.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{metric.value}</h3>
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
            <h3 className="text-lg font-bold text-slate-900 m-0">Compliance Policy Recommendations</h3>
            <p className="text-xs text-slate-500">Suggested remediation actions derived from MDM compliance sensor telemetry.</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
            <Cpu className="h-3 w-3 mr-1" />
            {recommendations.filter(r => r.status === 'Pending').length} Pending Actions
          </span>
        </div>

        <GlassCard className="p-0 overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-sm">
                {recommendations.map((rec) => {
                  // Determine status badge color
                  const statusColors = {
                    Pending: 'bg-slate-100 text-slate-600 border-slate-200',
                    Approved: 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20',
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
                      className="hover:bg-slate-50/70 transition-colors duration-150 group"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <AlertBadge severity={rec.severity} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{rec.id}</div>
                        <div className="text-xs text-slate-500 font-medium">{rec.type}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${gwBadge.style}`}>
                          {gwBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                        {rec.action}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900">{rec.confidence}%</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                            {rec.confidence >= 80 ? 'High' : 'Medium'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
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
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-blue bg-brand-blue/10 hover:bg-brand-blue hover:text-white transition-all duration-200"
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
