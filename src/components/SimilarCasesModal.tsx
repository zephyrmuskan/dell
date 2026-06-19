import React from 'react';
import { X, Calendar } from 'lucide-react';

export interface PastCase {
  case_id: string;
  date: string;
  outcome: string;
  decision: string;
  analyst: string;
  description: string;
}

interface SimilarCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: PastCase[];
  action: string;
}

export const SimilarCasesModal: React.FC<SimilarCasesModalProps> = ({ isOpen, onClose, cases, action }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Modal Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-premium-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-pulse-slow">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900 m-0">Trust Time Machine — Historical Incidents</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Showing similar historical cases for: <span className="font-bold underline text-brand-blue">{action}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/70 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-250 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Case ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Analyst</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Real Outcome</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {cases.map((item, idx) => {
                const isCorrect = item.outcome === 'True Positive';
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.case_id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-450" />
                        <span>{item.date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{item.analyst}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        item.decision === 'Approved' 
                          ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' 
                          : 'bg-brand-red/10 text-brand-red border-brand-red/20'
                      }`}>
                        {item.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        isCorrect 
                          ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' 
                          : 'bg-brand-red/10 text-brand-red border-brand-red/20'
                      }`}>
                        {item.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-205 border border-slate-250 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Time Machine
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimilarCasesModal;
