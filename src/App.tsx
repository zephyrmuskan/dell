//<<<<<<< HEAD
//import React from 'react';

import React, { useEffect, useState } from "react";
//>>>>>>> 81897b8da0bccdd8f61c4dcf0db274fd71a698d9
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

//>>>>>>> 81897b8da0bccdd8f61c4dcf0db274fd71a698d9
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

 



function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data === "ENTER_APP") {
        setShowDashboard(true);
      }
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    };
  }, []);

  if (!isLoggedIn) {
  return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  // if (!showDashboard) {
  //   return <LandingPage />;
  // } 

  

 //>>>>>>> 81897b8da0bccdd8f61c4dcf0db274fd71a698d9
  return (
    <WorkflowProvider>
      <MainLayout />
    </WorkflowProvider>
  );
}

export default App ;
