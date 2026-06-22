import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Dna, 
  ClipboardList, 
  RotateCcw,
  ShieldAlert as ShieldIcon,
  LogOut,
  Cpu,
  Settings
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
    { id: 5, label: 'AI Collaboration Board', icon: Cpu, screen: 5 },
    { id: 6, label: 'API Status & Settings', icon: Settings, screen: 6 },
  ];

  return (
    <aside role="navigation" aria-label="Sidebar Navigation" className="w-64 sidebar-navy h-screen text-white/80 flex flex-col justify-between flex-shrink-0 overflow-y-auto select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 flex items-center space-x-2.5 border-b border-white/5">
          <div className="bg-brand-cyan/10 p-1.5 rounded-lg border border-brand-cyan/20 text-brand-cyan">
            <ShieldIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white font-display tracking-wide m-0">TrustLens AI</h1>
            <p className="text-[8px] text-white/40 font-bold tracking-wider uppercase">Intune & Workspace ONE UEM</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="mt-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentScreen === item.screen;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.screen)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 group focus:ring-2 focus:ring-brand-cyan focus:outline-none ${
                  isActive
                    ? 'bg-white/10 text-white border-l-2 border-brand-cyan shadow-glow-blue'
                    : 'hover:bg-white/10 hover:text-white text-white/75'
                }`}
                aria-label={`Go to ${item.label}`}
              >
                <Icon className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Autonomy Dial */}
        <div className="mt-4 px-3 border-t border-white/5 pt-4">
          <p className="text-[9px] text-white/40 font-extrabold tracking-wider uppercase px-1 mb-2 font-display">AI Autonomy Level</p>
          
          <div className="bg-white/5 p-1 rounded-lg border border-white/5 grid grid-cols-3 gap-1" role="radiogroup" aria-label="AI Autonomy Level Selection">
            {([1, 2, 3] as const).map((level) => {
              const active = autonomyLevel === level;
              const labels = {
                1: 'Lvl 1 (Ask)',
                2: 'Lvl 2 (Auto)',
                3: 'Lvl 3 (Act)'
              };
              const activeColors = {
                1: 'bg-white/10 text-white border border-white/10 shadow-sm',
                2: 'bg-brand-blue/30 text-brand-cyan border border-brand-blue/40 shadow-glow-blue',
                3: 'bg-brand-emerald/25 text-[#34d399] border border-brand-emerald/35 shadow-glow-emerald'
              };

              return (
                <button
                  key={level}
                  onClick={() => setAutonomyLevel(level)}
                  role="radio"
                  aria-checked={active}
                  className={`px-1 py-1 rounded text-[9px] font-bold transition-all duration-200 text-center cursor-pointer focus:ring-2 focus:ring-brand-cyan focus:outline-none ${
                    active 
                      ? activeColors[level as keyof typeof activeColors] 
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                  aria-label={`Set AI autonomy to ${labels[level as keyof typeof labels]}`}
                >
                  {labels[level as keyof typeof labels]}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-white/70 font-semibold leading-relaxed mt-2 px-1 transition-all duration-300 italic min-h-[28px] line-clamp-2">
            "{
              autonomyLevel === 1
                ? "Level 1: Every recommendation requires manual human approval."
                : autonomyLevel === 2
                ? "Level 2: Low-risk tasks auto-approve; critical actions require review."
                : "Level 3: AI executes all actions immediately and logs audit details."
            }"
          </p>
        </div>

        {/* Connected MDM Gateways */}
        <div className="mt-4 px-3 border-t border-white/5 pt-4">
          <p className="text-[9px] text-white/40 font-extrabold tracking-wider uppercase px-1 mb-2 font-display">Integrated Gateways</p>
          
          <div className="grid grid-cols-2 gap-1.5">
            {/* Intune Gateway Card */}
            <div className="flex flex-col p-1.5 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 justify-between h-[48px]">
              <div className="flex items-center space-x-1">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse" />
                <span className="text-[9px] font-bold text-white truncate">Intune</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[7px] font-bold text-white/40">14.2K devs</span>
                <span className="text-[7px] font-bold px-1 rounded bg-white/10 text-brand-cyan border border-white/5 font-mono">Graph</span>
              </div>
            </div>

            {/* Workspace ONE Gateway Card */}
            <div className="flex flex-col p-1.5 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 justify-between h-[48px]">
              <div className="flex items-center space-x-1">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse" />
                <span className="text-[9px] font-bold text-white truncate">WS One</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[7px] font-bold text-white/40">9.8K devs</span>
                <span className="text-[7px] font-bold px-1 rounded bg-white/10 text-brand-cyan border border-white/5 font-mono">REST</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile & Reset Demo */}
      <div className="p-3 border-t border-white/5 space-y-2.5">
        {/* Reset Action */}
        <button
          onClick={resetDemo}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 hover:text-white transition-all duration-200 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Demo Flow</span>
        </button>

        {/* User Card */}
        <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-lg border border-white/5">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="h-8 w-8 rounded-full object-cover border border-white/10 shadow-inner" 
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-brand-cyan to-indigo-600 flex items-center justify-center font-bold text-white text-xs border border-white/10 shadow-inner">
              {getInitials()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate m-0 leading-tight">{displayName}</p>
            <p className="text-[9px] text-white/65 font-bold truncate m-0 uppercase tracking-wider">{displayRole}</p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-brand-red transition-colors cursor-pointer border-none bg-transparent"
          >
            <LogOut className="h-3.5 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
