import React, { useEffect } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { AICollaborationBoard } from '../components/AICollaborationBoard';
import { DecisionVotingBoard } from '../components/DecisionVotingBoard';
import { AIConsensusEngine } from '../components/AIConsensusEngine';
import { AskTrustLensPanel } from '../components/AskTrustLensPanel';
import { Cpu, ShieldAlert, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const AICollaborationBoardScreen: React.FC = () => {
  const { 
    recommendations, 
    activeRecId, 
    setActiveRecId, 
    trustScore,
    loadCompanionState
  } = useWorkflow();

  const activeRec = recommendations.find(r => r.id === activeRecId) || recommendations[0];

  useEffect(() => {
    loadCompanionState(activeRecId);
  }, [activeRecId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-7xl mx-auto w-full select-none text-slate-200 space-y-4"
    >
      
      {/* 1. Recommendation Summary Header (Full-width) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between shadow-xl space-y-3 md:space-y-0">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-brand-cyan/15 text-brand-cyan text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-brand-cyan/25 tracking-wider">
                AI War Room
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Active Decision Council</span>
            </div>
            <h2 className="text-base font-black text-white mt-1 m-0 tracking-wide font-display">Multi-Agent Collaboration Board</h2>
            <p className="text-[10px] text-slate-400 font-semibold m-0 leading-normal font-sans italic mt-0.5">
              "Trust isn't built from a single answer. It's built from transparent collaboration."
            </p>
          </div>
        </div>

        {/* Dynamic Details & Alert Selector */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-950 border border-slate-850 px-4 py-2.5 rounded-xl">
          {/* Compliance Selector Dropdown */}
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider font-mono">Select Compliance Alert</span>
            <select
              value={activeRecId}
              onChange={(e) => setActiveRecId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg outline-none focus:border-indigo-500 cursor-pointer mt-1 font-sans"
            >
              {recommendations.map(r => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                  [{r.severity}] {r.id} - {r.action}
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Active Alert summary stats */}
          <div className="flex flex-col justify-center">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider font-mono">Orchestrated Action</span>
            <span className="text-xs font-extrabold text-white mt-1 truncate max-w-[150px]">{activeRec.action}</span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col justify-center">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider font-mono">Severity</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border mt-1 tracking-wider font-mono ${
              activeRec.severity === 'Critical' 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : activeRec.severity === 'High' 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-200/20'
            }`}>
              {activeRec.severity}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center space-x-2">
            <div className="text-right">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider font-mono">Trust Score</span>
              <p className="text-xs font-black text-white mt-0.5 leading-none font-mono">{trustScore}%</p>
            </div>
            <div className="h-8 w-8 rounded-full border border-emerald-500/20 flex items-center justify-center font-black text-emerald-400 text-xs bg-emerald-500/5 font-mono shadow-glow-emerald">
              {trustScore}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-4">
        
        {/* Left Column (Discussion Room + Voting Board) */}
        <div className="lg:col-span-8 space-y-4">
          <div>
            <AICollaborationBoard />
          </div>
          <div>
            <DecisionVotingBoard />
          </div>
        </div>

        {/* Right Column (Consensus Engine + Trust Companion Panel) */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <AIConsensusEngine />
          </div>
          <div>
            <AskTrustLensPanel />
          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default AICollaborationBoardScreen;
