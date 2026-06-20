import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Dna, 
  ClipboardList, 
  RotateCcw,
  ShieldAlert as ShieldIcon,
  LogOut
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentScreen, setCurrentScreen, resetDemo, autonomyLevel, setAutonomyLevel, user, logout } = useWorkflow();

  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin User';
  const displayRole = user?.email || 'IT Administrator';
  const avatarUrl = user?.user_metadata?.avatar_url;

  const navItems = [
    { id: 1, label: 'MDM Compliance Dashboard', icon: LayoutDashboard, screen: 1 },
    { id: 2, label: 'Device Analysis', icon: ShieldAlert, screen: 2 },
    { id: 3, label: 'UEM Trust Validation', icon: Dna, screen: 3 },
    { id: 4, label: 'MDM Command Center', icon: ClipboardList, screen: 4 },
  ];

  return (
    <aside className="w-64 glass-sidebar h-screen text-slate-700 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
      {/* Brand Header */}
      <div>
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
          <div className="bg-brand-blue/10 p-2 rounded-lg border border-brand-blue/20 text-brand-blue">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-wide m-0">TrustLens AI</h1>
            <p className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase">Intune & Workspace ONE UEM</p>
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-glow-blue'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-500'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Autonomy Dial */}
        <div className="mt-8 px-4 border-t border-slate-100 pt-6">
          <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase px-2 mb-3">AI Autonomy Level</p>
          
          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex flex-col space-y-1">
            {([1, 2, 3, 4] as const).map((level) => {
              const active = autonomyLevel === level;
              const labels = {
                1: '1. Always Ask Me',
                2: '2. Recommend Only',
                3: '3. Auto Approve Low Risk',
                4: '4. Act & Notify'
              };
              const activeColors = {
                1: 'bg-slate-200 text-slate-800 shadow-sm',
                2: 'bg-indigo-100 text-indigo-800 border border-indigo-200/50 shadow-sm',
                3: 'bg-brand-blue text-white shadow-glow-blue',
                4: 'bg-brand-emerald text-white shadow-glow-emerald'
              };

              return (
                <button
                  key={level}
                  onClick={() => setAutonomyLevel(level)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 text-left cursor-pointer ${
                    active 
                      ? activeColors[level] 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {labels[level]}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-3.5 px-2 transition-all duration-300 italic">
            "{
              autonomyLevel === 1
                ? "Level 1: Every recommendation requires manual human approval."
                : autonomyLevel === 2
                ? "Level 2: AI suggests actions but humans must approve execution."
                : autonomyLevel === 3
                ? "Level 3: Low-risk tasks auto-approve; critical actions require review."
                : "Level 4: AI executes all actions immediately and logs audit details."
            }"
          </p>
        </div>

        {/* Connected MDM Gateways */}
        <div className="mt-6 px-4 border-t border-slate-100 pt-6">
          <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase px-2 mb-3">Integrated Gateways</p>
          
          <div className="space-y-2">
            {/* Intune Gateway Card */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-slate-100/50 transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-brand-emerald animate-pulse" />
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-900 block">Microsoft Intune</span>
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">14,250 Devs • Active Sync</span>
                </div>
              </div>
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-100 uppercase tracking-wider font-mono">
                Graph
              </span>
            </div>

            {/* Workspace ONE Gateway Card */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-slate-100/50 transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-brand-emerald animate-pulse" />
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-900 block">Workspace ONE</span>
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">9,840 Devs • Active Scan</span>
                </div>
              </div>
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider font-mono">
                REST
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile & Reset Demo */}
      <div className="p-4 border-t border-slate-100 space-y-4">
        {/* Reset Action */}
        <button
          onClick={resetDemo}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all duration-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo Flow</span>
        </button>

        {/* User Card */}
        <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-inner" 
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-blue to-purple-600 flex items-center justify-center font-bold text-white text-sm border border-white/10 shadow-inner">
              {getInitials()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate m-0">{displayName}</p>
            <p className="text-[9px] text-slate-400 font-extrabold truncate m-0 uppercase tracking-wider">{displayRole}</p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent"
          >
            <LogOut className="h-4 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
