import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Dna, 
  ClipboardList, 
  RotateCcw,
  ShieldAlert as ShieldIcon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentScreen, setCurrentScreen, resetDemo, autonomyLevel, setAutonomyLevel } = useWorkflow();

  const navItems = [
    { id: 1, label: 'Dashboard', icon: LayoutDashboard, screen: 1 },
    { id: 2, label: 'Recommendations', icon: ShieldAlert, screen: 2 },
    { id: 3, label: 'Trust Validation', icon: Dna, screen: 3 },
    { id: 4, label: 'Activity Log', icon: ClipboardList, screen: 4 },
  ];

  return (
    <aside className="w-64 glass-sidebar min-h-screen text-slate-300 flex flex-col justify-between flex-shrink-0">
      {/* Brand Header */}
      <div>
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800/60">
          <div className="bg-brand-blue/20 p-2 rounded-lg border border-brand-blue/30 text-brand-blue">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide m-0">TrustLens AI</h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Dell Trust Interface</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentScreen === item.screen;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.screen)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-glow-blue'
                    : 'hover:bg-slate-800/40 hover:text-white text-slate-400'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Autonomy Dial */}
        <div className="mt-8 px-4 border-t border-slate-800/40 pt-6">
          <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase px-4 mb-3">AI Autonomy Level</p>
          
          <div className="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 flex flex-col space-y-1">
            {(['collaborative', 'copilot', 'autonomous'] as const).map((level) => {
              const active = autonomyLevel === level;
              const labels = {
                collaborative: 'Collaborative',
                copilot: 'Co-Pilot',
                autonomous: 'Autonomous'
              };
              const activeColors = {
                collaborative: 'bg-slate-700 text-white shadow-sm',
                copilot: 'bg-brand-blue text-white shadow-glow-blue',
                autonomous: 'bg-brand-emerald text-white shadow-glow-emerald'
              };

              return (
                <button
                  key={level}
                  onClick={() => setAutonomyLevel(level)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 text-center ${
                    active 
                      ? activeColors[level] 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/20'
                  }`}
                >
                  {labels[level]}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-3.5 px-2 transition-all duration-300 italic">
            "{
              autonomyLevel === 'collaborative'
                ? "Always Ask: Proposes suggestions; humans approve every step."
                : autonomyLevel === 'copilot'
                ? "Co-Pilot: AI auto-resolves Medium threats; prompts on High/Critical."
                : "Act & Audit: Auto-executes all recommendations and logs them."
            }"
          </p>
        </div>
      </div>

      {/* Profile & Reset Demo */}
      <div className="p-4 border-t border-slate-800/60 space-y-4">
        {/* Reset Action */}
        <button
          onClick={resetDemo}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 hover:text-white transition-all duration-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo Flow</span>
        </button>

        {/* User Card */}
        <div className="flex items-center space-x-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-blue to-purple-600 flex items-center justify-center font-bold text-white text-sm border border-white/10 shadow-inner">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate m-0">Admin User</p>
            <p className="text-[10px] text-slate-500 font-medium truncate m-0">IT Administrator</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-brand-emerald animate-pulse"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
