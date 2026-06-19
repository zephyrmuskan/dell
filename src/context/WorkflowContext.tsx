import React, { createContext, useContext, useState, type ReactNode } from 'react';
import siemData from '../data/siem_data.json';

export type Severity = 'Critical' | 'High' | 'Medium';
export type RecommendationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Escalated' | 'Details Requested';
export type AutonomyLevel = 'collaborative' | 'copilot' | 'autonomous';

export interface ShapFactor {
  feature: string;
  val: number;
  type: 'positive' | 'negative';
}

export interface SubagentStep {
  name: string;
  status: string;
  score: number;
  details: string;
}

export interface PastCase {
  case_id: string;
  date: string;
  outcome: string;
  decision: string;
  analyst: string;
  description: string;
}

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
  shapImportance: ShapFactor[];
  subagents: SubagentStep[];
  similarCasesList: PastCase[];
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
  injectScenario: (scenarioId: string) => void;
  autonomyLevel: AutonomyLevel;
  setAutonomyLevel: (level: AutonomyLevel) => void;
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

  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('collaborative');

  const adaptedRecommendations = recommendations.map((rec) => {
    if (autonomyLevel === 'autonomous') {
      return { ...rec, status: rec.status === 'Pending' ? 'Approved' : rec.status } as Recommendation;
    } else if (autonomyLevel === 'copilot') {
      if (rec.severity === 'Medium') {
        return { ...rec, status: rec.status === 'Pending' ? 'Approved' : rec.status } as Recommendation;
      }
    }
    return rec;
  });

  const activeRec = adaptedRecommendations.find((r) => r.id === activeRecId) || adaptedRecommendations[0];

  const dashboardStats = {
    total_alerts: initialStats.total_alerts + (adaptedRecommendations.length - initialRecommendations.length),
    critical: initialStats.critical + adaptedRecommendations.filter(r => r.severity === 'Critical' && !initialRecommendations.some(ir => ir.id === r.id)).length,
    high: initialStats.high + adaptedRecommendations.filter(r => r.severity === 'High' && !initialRecommendations.some(ir => ir.id === r.id)).length,
    medium: initialStats.medium + adaptedRecommendations.filter(r => r.severity === 'Medium' && !initialRecommendations.some(ir => ir.id === r.id)).length,
  };

  const injectScenario = (scenarioId: string) => {
    const sc = (siemData.scenarios as any)[scenarioId];
    if (!sc) return;

    if (recommendations.some((r) => r.id === sc.id)) {
      setActiveRecId(sc.id);
      setCurrentScreen(1);
      return;
    }

    const newRec: Recommendation = { ...sc, status: 'Pending' };
    setRecommendations((prev) => [newRec, ...prev]);

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logMsg = `[SIMULATION] Threat scenario injected: "${sc.action}" recommended for ${sc.id}.`;

    setActivityLog((prev) => [
      ...prev,
      { time: timeString, event: logMsg, type: 'system' }
    ]);

    setActiveRecId(sc.id);
    setCurrentScreen(1);
  };

  const submitDecision = (
    decision: 'Approved' | 'Rejected' | 'Escalated' | 'Details Requested',
    notes?: string
  ) => {
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
    
    setShowSuccessToast(true);
    setCurrentScreen(1);
    
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
    setAutonomyLevel('collaborative');
  };

  return (
    <WorkflowContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        recommendations: adaptedRecommendations,
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
        dashboardStats,
        injectScenario,
        autonomyLevel,
        setAutonomyLevel
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
