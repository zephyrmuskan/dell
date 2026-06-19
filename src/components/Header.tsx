import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { Bell, Calendar, ChevronRight, Search } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentScreen, setCurrentScreen, activeRecId } = useWorkflow();

  const handleBreadcrumbClick = (screen: number) => {
    if (screen < currentScreen) {
      setCurrentScreen(screen);
    }
  };

  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Dashboard', screen: 1 }];

    if (currentScreen >= 2) {
      crumbs.push({ label: `Recommendation Analysis (${activeRecId})`, screen: 2 });
    }
    if (currentScreen >= 3) {
      crumbs.push({ label: 'Trust Validation', screen: 3 });
    }
    if (currentScreen >= 4) {
      crumbs.push({ label: 'Decision Center', screen: 4 });
    }

    return crumbs;
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={crumb.screen}>
            {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
            <button
              onClick={() => handleBreadcrumbClick(crumb.screen)}
              className={`hover:text-slate-900 transition-colors ${
                crumb.screen === currentScreen
                  ? 'text-slate-900 font-bold cursor-default'
                  : 'cursor-pointer'
              }`}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* Right side widgets */}
      <div className="flex items-center space-x-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search assets, threats..."
            className="w-56 pl-9 pr-4 py-1.5 rounded-full border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue focus:bg-white transition-all duration-200"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Date Widget */}
        <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>12 June 2026</span>
        </div>

        {/* Alerts Bell */}
        <div className="relative cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors group">
          <Bell className="h-4.5 w-4.5 text-slate-600 transition-transform group-hover:rotate-12" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-red ring-2 ring-white"></span>
        </div>
      </div>
    </header>
  );
};

export default Header;
