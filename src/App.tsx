import React from "react";
import { WorkflowProvider, useWorkflow } from './context/WorkflowContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardScreen } from './screens/DashboardScreen';
import { AnalysisScreen } from './screens/AnalysisScreen';
import { ValidationScreen } from './screens/ValidationScreen';
import { DecisionScreen } from './screens/DecisionScreen';
import { AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import  LoginPage from "./screens/LoginPage";
import LandingPage from "./screens/LandingPage";
const MainLayout: React.FC = () => {
  const { currentScreen, showSuccessToast } = useWorkflow();

  const renderScreen = () => {
    switch (currentScreen) {
      case 1:
        return <DashboardScreen key="dashboard" />;
      case 2:
        return <AnalysisScreen key="analysis" />;
      case 3:
        return <ValidationScreen key="validation" />;
      case 4:
        return <DecisionScreen key="decision" />;
      default:
        return <DashboardScreen key="dashboard" />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased selection:bg-brand-blue selection:text-white">
      {/* Dark Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <Header />

        {/* Content Body Container */}
        <main className="flex-1 overflow-y-auto px-8 py-8 relative">
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>
        </main>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccessToast && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center bg-white/95 backdrop-blur-md border border-brand-emerald/40 shadow-premium-xl rounded-2xl p-4 space-x-3.5 max-w-sm animate-pulse-slow">
              <div className="p-2 bg-brand-emerald/10 text-brand-emerald rounded-xl border border-brand-emerald/20 flex-shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 m-0">MDM Command Dispatched</h4>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-normal">
                  MDM policy command dispatched successfully. Real-time configuration updates pushed to the managing tenant.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

 



const AppContent: React.FC = () => {
  const { user, loading } = useWorkflow();
  const [showLanding, setShowLanding] = React.useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-blue border-t-transparent animate-spin"></div>
          <p className="text-slate-500 font-semibold text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return <LandingPage onEnterApp={() => setShowLanding(false)} />;
    }
    return <LoginPage onLogin={() => {}} />;
  }

  return <MainLayout />;
};

function App() {
  return (
    <WorkflowProvider>
      <AppContent />
    </WorkflowProvider>
  );
}

export default App ;
