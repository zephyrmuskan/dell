import React, { createContext, useContext, useState, type ReactNode } from 'react';
import siemData from '../data/siem_data.json';

export type Severity = 'Critical' | 'High' | 'Medium';
export type RecommendationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Escalated' | 'Details Requested';

export interface Recommendation {
  id: string;
  type: string;
  action: string;
  severity: Severity;
  confidence: number;
  sources: string[];
  status: RecommendationStatus;
  why: string[];
  nutritionLabel: {
    evidenceStrength: number;
    sources: string[];
    similarCases: number;
    limitations: string;
    model: string;
  };
  trustDNA: {
    score: number;
    dataQuality: number;
    policyMatch: number;
    fleetSimilarity: number;
    threatIntelMatch: number;
    unknownRisk: number;
  };
  devilsAdvocate: {
    points: string[];
    alternativeAction: string;
  };
  timeMachine: {
    accuracy: number;
    cases: number;
    breakdown: {
      correct: number;
      falsePositives: number;
      escalated: number;
    };
  };
}

export interface ActivityLogEntry {
  time: string;
  event: string;
  user?: string;
  type: 'system' | 'ai' | 'user';
}

interface WorkflowContextType {
  currentScreen: number;
  setCurrentScreen: (screen: number) => void;
  recommendations: Recommendation[];
  activeRecId: string;
  setActiveRecId: (id: string) => void;
  activeRec: Recommendation;
  activityLog: ActivityLogEntry[];
  submitDecision: (decision: 'Approved' | 'Rejected' | 'Escalated' | 'Details Requested', notes?: string) => void;
  resetDemo: () => void;
  selectedAltAction: boolean;
  setSelectedAltAction: (val: boolean) => void;
  decisionNotes: string;
  setDecisionNotes: (val: string) => void;
  showSuccessToast: boolean;
  setShowSuccessToast: (val: boolean) => void;
  dashboardStats: {
    total_alerts: number;
    critical: number;
    high: number;
    medium: number;
  };
}

const initialRecommendations = siemData.recommendations as Recommendation[];
const initialLogs = siemData.activity_logs as ActivityLogEntry[];
const initialStats = siemData.dashboard_stats;

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [activeRecId, setActiveRecId] = useState<string>('DEV1248');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(initialLogs);
  const [selectedAltAction, setSelectedAltAction] = useState<boolean>(false);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  const activeRec = recommendations.find((r) => r.id === activeRecId) || recommendations[0];

  const submitDecision = (
    decision: 'Approved' | 'Rejected' | 'Escalated' | 'Details Requested',
    notes?: string
  ) => {
    // 1. Update the status of the recommendation
    setRecommendations((prev) =>
      prev.map((rec) => {
        if (rec.id === activeRecId) {
          let status: RecommendationStatus = 'Approved';
          if (decision === 'Rejected') status = 'Rejected';
          if (decision === 'Escalated') status = 'Escalated';
          if (decision === 'Details Requested') status = 'Details Requested';
          return { ...rec, status };
        }
        return rec;
      })
    );

    // 2. Append to the log
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let eventMsg = '';
    if (selectedAltAction) {
      const altAction = activeRec.devilsAdvocate.alternativeAction;
      eventMsg = `Alternative action chosen: "${altAction}". Status updated.`;
    } else {
      eventMsg = `Recommendation ${decision} by Admin IT Administrator.`;
    }

    if (notes && notes.trim() !== '') {
      eventMsg += ` Comment: "${notes.trim()}"`;
    }

    const newLog: ActivityLogEntry = {
      time: timeString,
      event: eventMsg,
      type: 'user'
    };

    setActivityLog((prev) => [...prev, newLog]);
    
    // 3. Show Success Toast
    setShowSuccessToast(true);
    
    // 4. Return to Dashboard
    setCurrentScreen(1);
    
    // Reset states
    setSelectedAltAction(false);
    setDecisionNotes('');
    
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  const resetDemo = () => {
    setRecommendations(initialRecommendations);
    setActivityLog(initialLogs);
    setActiveRecId('DEV1248');
    setCurrentScreen(1);
    setSelectedAltAction(false);
    setDecisionNotes('');
    setShowSuccessToast(false);
  };

  return (
    <WorkflowContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        recommendations,
        activeRecId,
        setActiveRecId,
        activeRec,
        activityLog,
        submitDecision,
        resetDemo,
        selectedAltAction,
        setSelectedAltAction,
        decisionNotes,
        setDecisionNotes,
        showSuccessToast,
        setShowSuccessToast,
        dashboardStats: initialStats
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
