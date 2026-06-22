import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { Bell, Calendar, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    activeRecId, 
    searchQuery, 
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange
  } = useWorkflow();

  const [searchVal, setSearchVal] = React.useState(searchQuery);
  const [showDateDropdown, setShowDateDropdown] = React.useState(false);
  const dateRef = React.useRef<HTMLDivElement | null>(null);

  // Click outside listener to close date dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActiveFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case 'custom': 
        return customDateRange.start 
          ? `${customDateRange.start} to ${customDateRange.end || 'Now'}` 
          : 'Custom Range';
      default: return 'All Time';
    }
  };

  // Sync state with global searchQuery changes
  React.useEffect(() => {
    setSearchVal(searchQuery);
  }, [searchQuery]);

  // Debounce search query by 300ms
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal, setSearchQuery]);

  const handleBreadcrumbClick = (screen: number) => {
    if (screen < currentScreen) {
      setCurrentScreen(screen);
    }
  };

  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'MDM Compliance Dashboard', screen: 1 }];

    if (currentScreen === 5) {
      crumbs.push({ label: 'AI Collaboration Board', screen: 5 });
      return crumbs;
    }

    if (currentScreen >= 2) {
      crumbs.push({ label: `Device Analysis (${activeRecId})`, screen: 2 });
    }
    if (currentScreen >= 3) {
      crumbs.push({ label: 'UEM Trust Validation', screen: 3 });
    }
    if (currentScreen >= 4) {
      crumbs.push({ label: 'MDM Command Center', screen: 4 });
    }

    return crumbs;
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={crumb.screen}>
            {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
            <button
              onClick={() => handleBreadcrumbClick(crumb.screen)}
              className={`hover:text-slate-900 transition-colors ${
                crumb.screen === currentScreen
                  ? 'text-brand-cyan font-bold cursor-default'
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
        {/* Compliance Status Pill */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse"></span>
          <span>Fleet Compliance: 99.8%</span>
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search devices, policies..."
            className="w-56 pl-9 pr-4 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan focus:bg-white transition-all duration-200"
          />
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Functional Date Picker Filter */}
        <div ref={dateRef} className="relative">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 transition cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>{getActiveFilterLabel()}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Date Filter Dropdown */}
          <AnimatePresence>
            {showDateDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-premium-xl z-50 p-3 w-[260px] space-y-2.5"
              >
                <span className="text-[9px] text-slate-450 uppercase tracking-widest font-black font-mono block border-b border-slate-100 pb-1.5">
                  Filter by Compliance Date
                </span>
                
                {/* Options */}
                <div className="flex flex-col space-y-1">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: '7days', label: 'Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days' },
                    { id: 'custom', label: 'Custom Range' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setDateFilter(opt.id);
                        if (opt.id !== 'custom') {
                          setShowDateDropdown(false);
                        }
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition ${
                        dateFilter === opt.id 
                          ? 'bg-indigo-500/10 text-indigo-950 font-black' 
                          : 'hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Picker Inputs */}
                {dateFilter === 'custom' && (
                  <div className="border-t border-slate-100 pt-2.5 space-y-2 text-[10px] font-semibold text-slate-650">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider font-bold mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customDateRange?.start || ''}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] outline-none text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider font-bold mb-1">End Date</label>
                        <input
                          type="date"
                          value={customDateRange?.end || ''}
                          onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] outline-none text-slate-800"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDateDropdown(false)}
                      className="w-full bg-slate-900 text-white font-bold text-center py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition cursor-pointer"
                    >
                      Apply Filter
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
