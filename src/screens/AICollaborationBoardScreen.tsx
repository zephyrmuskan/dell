import React, { useEffect, useState, useRef } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { AICollaborationBoard } from '../components/AICollaborationBoard';
import { DecisionVotingBoard } from '../components/DecisionVotingBoard';
import { AIConsensusEngine } from '../components/AIConsensusEngine';
import { AskTrustLensPanel } from '../components/AskTrustLensPanel';
import { Cpu, Search, Bell, Clock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AICollaborationBoardScreen: React.FC = () => {
  const { 
    recommendations, 
    activeRecId, 
    setActiveRecId, 
    loadCompanionState,
    setSearchQuery,
    filteredActivityLog
  } = useWorkflow();

  const [searchVal, setSearchVal] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadCompanionState(activeRecId);
  }, [activeRecId]);

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 305);
    return () => clearTimeout(handler);
  }, [searchVal, setSearchQuery]);

  // Click outside listener to close custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchMatch = (recId: string) => {
    setActiveRecId(recId);
    setSearchVal('');
    setShowSearchDropdown(false);
  };



  // Find matching search recommendations & logs
  const matchingRecs = searchVal.trim()
    ? recommendations.filter(r => 
        r.id.toLowerCase().includes(searchVal.toLowerCase()) ||
        r.action.toLowerCase().includes(searchVal.toLowerCase()) ||
        r.severity.toLowerCase().includes(searchVal.toLowerCase())
      )
    : [];

  const matchingLogs = searchVal.trim()
    ? filteredActivityLog.filter(l => 
        l.event.toLowerCase().includes(searchVal.toLowerCase())
      ).slice(0, 3)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-7xl mx-auto w-full select-none text-slate-800 space-y-5"
    >
      {/* HEADER SECTION CONTROLS ROW */}
      <div className="relative z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm select-none">
        
        {/* Device Selector */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600">
            <Cpu className="h-5 w-5 animate-pulse-slow" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider font-mono">MDM Target Agent</span>
            <select
              value={activeRecId}
              onChange={(e) => setActiveRecId(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl outline-none focus:border-indigo-500 cursor-pointer font-sans mt-0.5"
            >
              {recommendations.map(r => (
                <option key={r.id} value={r.id} className="bg-white text-slate-700">
                  [{r.severity}] {r.id} - {r.action.slice(0, 16)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search, Filter & Notification Controls */}
        <div className="flex flex-wrap items-center gap-3.5 flex-1 justify-end">
          
          {/* Debounced Search Bar */}
          <div ref={searchRef} className="relative w-full max-w-[280px]">
            <div className="relative">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => { setSearchVal(e.target.value); setShowSearchDropdown(true); }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Fuzzy search device alerts..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 text-xs text-slate-800 font-medium pl-8 pr-3 py-2 rounded-xl outline-none transition"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
            
            {/* Search Dropdown Panel */}
            <AnimatePresence>
              {showSearchDropdown && searchVal.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-premium-xl max-h-[300px] overflow-y-auto z-50 p-2.5 space-y-3"
                >
                  {matchingRecs.length === 0 && matchingLogs.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-xs font-semibold">
                      No search results found.
                    </div>
                  ) : (
                    <>
                      {/* Recommendations */}
                      {matchingRecs.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black font-mono block px-1.5">Recommendations</span>
                          {matchingRecs.map(rec => (
                            <button
                              key={rec.id}
                              onClick={() => handleSelectSearchMatch(rec.id)}
                              className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg flex flex-col justify-center cursor-pointer"
                            >
                              <span className="text-xs font-black text-slate-850 leading-tight">{rec.id} ({rec.severity})</span>
                              <span className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{rec.action}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Logs */}
                      {matchingLogs.length > 0 && (
                        <div className="space-y-1 border-t border-slate-100 pt-2">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black font-mono block px-1.5">Telemetry Audit Logs</span>
                          {matchingLogs.map((log, idx) => (
                            <div key={idx} className="px-2 py-1 flex justify-between items-start text-[10px] font-semibold text-slate-550 leading-tight">
                              <span className="truncate max-w-[190px]">{log.event}</span>
                              <span className="text-[8px] text-slate-400 font-mono flex-shrink-0 ml-1">{log.time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>



          {/* Notifications Center */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl relative transition cursor-pointer"
            >
              <Bell className="h-4 w-4 text-slate-600" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-white">
                3
              </span>
            </button>

            {/* Notification Dropdown List */}
            <AnimatePresence>
              {showNotifDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-premium-xl z-50 p-3 w-[260px] space-y-2.5"
                >
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black font-mono block border-b border-slate-100 pb-1.5">
                    MDM Active Notifications
                  </span>
                  <div className="space-y-2 text-[10px] font-semibold text-slate-650">
                    <div className="p-2 bg-slate-50 border border-slate-150 rounded-xl flex items-start space-x-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-extrabold text-slate-800 m-0">Device Isolate Alert</p>
                        <p className="text-[9px] text-slate-500 leading-normal mt-0.5">DEV1248 quarantine action pending human validation review.</p>
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-150 rounded-xl flex items-start space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-extrabold text-slate-800 m-0">Patch Synced</p>
                        <p className="text-[9px] text-slate-500 leading-normal mt-0.5">Vulnerability catalogs parsed for Intune host fleets.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* DYNAMIC TWO-COLUMN GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column (col-span-8): Discussion timeline */}
        <div className="lg:col-span-8 min-w-0 flex flex-col h-full">
          <AICollaborationBoard />
        </div>

        {/* Right Column (col-span-4): Stacked side panel elements */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-start">
          <AskTrustLensPanel />
          <DecisionVotingBoard />
          <AIConsensusEngine />
        </div>

      </div>

    </motion.div>
  );
};

export default AICollaborationBoardScreen;
