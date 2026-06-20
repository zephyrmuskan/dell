import React, { createContext, useContext, useState, type ReactNode } from 'react';
import siemData from '../data/siem_data.json';
import { supabase } from '../lib/supabaseClient';

export type Severity = 'Critical' | 'High' | 'Medium';
export type RecommendationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Escalated' | 'Details Requested';
export type AutonomyLevel = 1 | 2 | 3 | 4;

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

export interface AgentChainStep {
  name: string;
  role: string;
  input_data: string;
  output_data: string;
  confidence: number;
  reasoning: string;
  timestamp: string;
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
  autonomyLevel: number;
  setAutonomyLevel: (level: number) => Promise<void>;
  
  // AI Trust Companion Integration
  companionMessages: Array<{role: 'user' | 'assistant', content: string, provider?: string}>;
  understandingScore: number;
  trustScore: number;
  questionsAsked: number;
  questionsResolved: number;
  helpfulVotes: number;
  totalVotes: number;
  suggestedQuestions: string[];
  isCompanionLoading: boolean;
  askTrustLens: (message: string) => Promise<void>;
  sendFeedback: (helpful: boolean) => Promise<void>;
  loadCompanionState: (recId: string) => Promise<void>;

  // Multi-Agent Transparency Integration
  agentChain: AgentChainStep[];
  inspectedAgents: string[];
  inspectAgent: (agentName: string) => void;

  // Supabase Auth Integration
  user: any | null;
  loading: boolean;
  logout: () => Promise<void>;
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

  // Supabase Auth Integration States & Methods
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const [autonomyLevel, setAutonomyLevelState] = useState<number>(2); // Default to Level 2 (Recommend Only)
  const [agentChain, setAgentChain] = useState<AgentChainStep[]>([]);
  const [inspectedAgents, setInspectedAgents] = useState<string[]>([]);

  // AI Trust Companion States
  const [companionMessages, setCompanionMessages] = useState<Array<{role: 'user' | 'assistant', content: string, provider?: string}>>([]);
  const [understandingScore, setUnderstandingScore] = useState<number>(60);
  const [trustScore, setTrustScore] = useState<number>(78);
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [questionsResolved, setQuestionsResolved] = useState<number>(0);
  const [helpfulVotes, setHelpfulVotes] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Why was this recommended?",
    "What evidence supports this?",
    "What could make this wrong?",
    "What happens if I reject it?"
  ]);
  const [isCompanionLoading, setIsCompanionLoading] = useState<boolean>(false);

  const loadAutonomyLevel = async () => {
    try {
      const res = await fetch('/api/autonomy-level');
      if (res.ok) {
        const data = await res.json();
        setAutonomyLevelState(data.level ?? 2);
      }
    } catch (e) {
      console.warn("Error loading autonomy level from backend, using default:", e);
    }
  };

  const setAutonomyLevel = async (level: number) => {
    setAutonomyLevelState(level);
    try {
      await fetch('/api/autonomy-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
    } catch (e) {
      console.warn("Error updating autonomy level on backend:", e);
    }
  };

  const loadAgentChain = async (recId: string) => {
    try {
      const res = await fetch(`/api/agent-chain/${recId}`);
      if (res.ok) {
        const data = await res.json();
        setAgentChain(data.agents || []);
      } else {
        throw new Error("Failed to load agent chain");
      }
    } catch (e) {
      console.warn("Using fallback agent chain for:", recId, e);
      // Fallback agent chain mock data
      const targetRec = recommendations.find((r) => r.id === recId) || recommendations[0];
      const action = targetRec.action;
      const da = targetRec.devilsAdvocate;
      setAgentChain([
        {
          name: "Detection Agent",
          role: "Telemetry & Anomaly Analyzer",
          input_data: `Raw telemetry stream from security logs and network interfaces for ${recId}.`,
          output_data: `Anomaly Detected: ${targetRec.why[0] || 'Unusual activity sequence detected.'}`,
          confidence: targetRec.confidence + 5 > 100 ? 100 : targetRec.confidence + 5,
          reasoning: `Telemetry patterns deviate from standard baseline logs. Flags suspicious commands or sequences.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Risk Assessment Agent",
          role: "Severity & Urgency Evaluator",
          input_data: `Anomaly Detected: ${targetRec.why[0] || 'Unusual activity sequence detected.'}`,
          output_data: `Threat Level: ${targetRec.severity}. Risk Score: ${targetRec.trustDNA.score}%`,
          confidence: targetRec.confidence + 2 > 100 ? 100 : targetRec.confidence + 2,
          reasoning: `Evaluated threat criticality by comparing host operations to fleet baselines. Urgent actions mapped accordingly.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Remediation Agent",
          role: "Policy & Resolution Suggester",
          input_data: `Threat Level: ${targetRec.severity}. Risk Score: ${targetRec.trustDNA.score}%`,
          output_data: `Suggested Action: ${action}`,
          confidence: targetRec.confidence,
          reasoning: `Identified optimal policy update via Graph/REST gateway APIs to resolve the risk signature.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Devil's Advocate Agent",
          role: "Validation & Falsification Challenger",
          input_data: `Suggested Action: ${action}`,
          output_data: `False-Positive Risks Checked. Suggested Alternative: ${da.alternativeAction}`,
          confidence: 35,
          reasoning: `Challenged decision: ${da.points.join("; ")}`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Trust Companion Agent",
          role: "Dialogue & Explainability Interface",
          input_data: `Devil's advocate counter-evidence. Operator understanding at ${understandingScore}%`,
          output_data: `Explainability console active. Understanding Score is at ${understandingScore}%.`,
          confidence: 85,
          reasoning: `Prepared plain-language explanation models and dialogue context.`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const inspectAgent = (agentName: string) => {
    if (!inspectedAgents.includes(agentName)) {
      setInspectedAgents((prev) => {
        const next = [...prev, agentName];
        
        // Recalculate trust score instantly based on new inspected list
        const targetRec = adaptedRecommendations.find((r) => r.id === activeRecId) || activeRec;
        const visibilityScore = next.length > 0 ? 8 : 4;
        const autonomyScore = 7;
        const transControl = visibilityScore + autonomyScore;
        const newTrust = Math.round(
          0.35 * targetRec.confidence +
          0.25 * targetRec.timeMachine.accuracy +
          0.25 * understandingScore +
          transControl
        );
        setTrustScore(newTrust);
        return next;
      });
    }
  };

  const loadCompanionState = async (recId: string) => {
    const targetRec = recommendations.find((r) => r.id === recId) || recommendations[0];
    loadAgentChain(recId);
    try {
      const res = await fetch(`/api/trust-chat/${recId}`);
      if (res.ok) {
        const data = await res.json();
        setCompanionMessages(data.messages || []);
        setUnderstandingScore(data.understanding_score ?? 60);
        
        // Use updated trust formula
        const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
        const autonomyScore = 7;
        const transControl = visibilityScore + autonomyScore;
        const newTrust = Math.round(
          0.35 * targetRec.confidence + 
          0.25 * targetRec.timeMachine.accuracy + 
          0.25 * (data.understanding_score ?? 60) + 
          transControl
        );
        setTrustScore(newTrust);
        
        setQuestionsAsked(data.questions_asked ?? 0);
        setQuestionsResolved(data.questions_resolved ?? 0);
        setHelpfulVotes(data.helpful_votes ?? 0);
        setTotalVotes(data.total_votes ?? 0);
        
        if (data.messages && data.messages.length > 0) {
          setSuggestedQuestions([
            "What could make this wrong?",
            "What happens if I reject it?",
            "Show similar incidents"
          ]);
        } else {
          setSuggestedQuestions([
            "Why was this recommended?",
            "What evidence supports this?",
            "What could make this wrong?",
            "What happens if I reject it?"
          ]);
        }
      } else {
        throw new Error("Backend response error");
      }
    } catch (e) {
      console.warn("Backend unavailable, loading local mock companion state:", e);
      setCompanionMessages([]);
      setUnderstandingScore(60);
      const conf = targetRec.confidence;
      const acc = targetRec.timeMachine.accuracy;
      
      // Use updated trust formula
      const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
      const autonomyScore = 7;
      const transControl = visibilityScore + autonomyScore;
      const tScore = Math.round(0.35 * conf + 0.25 * acc + 0.25 * 60 + transControl);
      
      setTrustScore(tScore);
      setQuestionsAsked(0);
      setQuestionsResolved(0);
      setHelpfulVotes(0);
      setTotalVotes(0);
      setSuggestedQuestions([
        "Why was this recommended?",
        "What evidence supports this?",
        "What could make this wrong?",
        "What happens if I reject it?"
      ]);
    }
  };

  const askTrustLens = async (message: string) => {
    setIsCompanionLoading(true);
    setCompanionMessages((prev) => [...prev, { role: 'user', content: message }]);
    
    try {
      const res = await fetch('/api/trust-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: activeRecId, message })
      });
      if (res.ok) {
        const data = await res.json();
        setCompanionMessages((prev) => [
          ...prev.filter(m => m.role !== 'user' || m.content !== message),
          { role: 'user', content: message },
          { role: 'assistant', content: data.answer, provider: data.provider_used }
        ]);
        setUnderstandingScore(data.understanding_score);
        
        // Use updated trust formula
        const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
        const autonomyScore = 7;
        const transControl = visibilityScore + autonomyScore;
        const targetRec = recommendations.find(r => r.id === activeRecId) || recommendations[0];
        const newTrust = Math.round(
          0.35 * targetRec.confidence + 
          0.25 * targetRec.timeMachine.accuracy + 
          0.25 * data.understanding_score + 
          transControl
        );
        setTrustScore(newTrust);
        
        setQuestionsAsked((prev) => prev + 1);
        setQuestionsResolved((prev) => prev + 1);
        setSuggestedQuestions(data.suggested_questions || [
          "What happens if I reject it?",
          "Show similar incidents",
          "Why are you uncertain?"
        ]);
      } else {
        throw new Error("POST request failed");
      }
    } catch (e) {
      console.warn("Using local rules simulation for Ask TrustLens:", e);
      setTimeout(() => {
        let answer = `I am simulating answers for ${activeRecId}. This action was suggested due to security triggers.`;
        const msgLower = String(message).toLowerCase();
        
        if (msgLower.includes("why") || msgLower.includes("reason") || msgLower.includes("recommend")) {
          answer = `The recommendation to **${activeRec.action}** for **${activeRecId}** is active because:\n` + 
            activeRec.why.map(w => `- ${w}`).join("\n") + 
            `\n\nThis behavior deviation is marked as a ${activeRec.severity} priority anomaly.`;
        } else if (msgLower.includes("evidence") || msgLower.includes("support")) {
          answer = `We support this recommendation with evidence from **${activeRec.sources.join(" + ")}** with ${activeRec.confidence}% confidence. Our security checks confirm data quality is at ${activeRec.trustDNA.dataQuality}% and policy rules matches at ${activeRec.trustDNA.policyMatch}%.`;
        } else if (msgLower.includes("wrong") || msgLower.includes("incorrect") || msgLower.includes("error")) {
          answer = `This recommendation could be a false alarm if:\n` +
            activeRec.devilsAdvocate.points.map(p => `- ${p}`).join("\n") +
            `\n\nIf these explain the activity, we advise running the alternative: **${activeRec.devilsAdvocate.alternativeAction}**.`;
        } else if (msgLower.includes("reject") || msgLower.includes("ignore") || msgLower.includes("dismiss")) {
          answer = `Rejecting this recommended policy will keep **${activeRecId}** connected in its current unverified state, risking potential threat activity progression.`;
        } else if (msgLower.includes("approve") || msgLower.includes("accept")) {
          answer = `Approving this recommendation will dispatch an immediate policy command to the managing tenant. This ensures the device compliance rules are re-evaluated and corrected.`;
        } else if (msgLower.includes("often") || msgLower.includes("history") || msgLower.includes("similar") || msgLower.includes("incident")) {
          answer = `The Trust Time Machine has logged **${activeRec.timeMachine.cases} similar alerts** historically. Our model evaluated correct matches for **${activeRec.timeMachine.breakdown.correct} cases** (${activeRec.timeMachine.accuracy}% accuracy baseline).`;
        }
        
        const nextQ = [
          "What could make this wrong?",
          "What happens if I reject it?",
          "Show similar incidents"
        ];
        
        const newAsked = questionsAsked + 1;
        const newResolved = questionsResolved + 1;
        const newUnderstanding = Math.min(100, 60 + newResolved * 8);
        
        // Use updated trust formula
        const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
        const autonomyScore = 7;
        const transControl = visibilityScore + autonomyScore;
        const newTrust = Math.round(0.35 * activeRec.confidence + 0.25 * activeRec.timeMachine.accuracy + 0.25 * newUnderstanding + transControl);
        
        setCompanionMessages((prev) => [
          ...prev.filter(m => m.role !== 'user' || m.content !== message),
          { role: 'user', content: message },
          { role: 'assistant', content: answer, provider: 'gemini' }
        ]);
        setUnderstandingScore(newUnderstanding);
        setTrustScore(newTrust);
        setQuestionsAsked(newAsked);
        setQuestionsResolved(newResolved);
        setSuggestedQuestions(nextQ);
      }, 700);
    } finally {
      setIsCompanionLoading(false);
    }
  };

  const sendFeedback = async (helpful: boolean) => {
    try {
      const res = await fetch('/api/trust-chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: activeRecId, helpful })
      });
      if (res.ok) {
        const data = await res.json();
        setUnderstandingScore(data.understanding_score);
        
        // Use updated trust formula
        const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
        const autonomyScore = 7;
        const transControl = visibilityScore + autonomyScore;
        const targetRec = recommendations.find(r => r.id === activeRecId) || recommendations[0];
        const newTrust = Math.round(
          0.35 * targetRec.confidence + 
          0.25 * targetRec.timeMachine.accuracy + 
          0.25 * data.understanding_score + 
          transControl
        );
        setTrustScore(newTrust);
        
        setTotalVotes((prev) => prev + 1);
        if (helpful) setHelpfulVotes((prev) => prev + 1);
      } else {
        throw new Error("Feedback POST failed");
      }
    } catch (e) {
      console.warn("Using local rules simulation for feedback:", e);
      const newTotal = totalVotes + 1;
      const newHelpful = helpful ? helpfulVotes + 1 : helpfulVotes;
      setTotalVotes(newTotal);
      setHelpfulVotes(newHelpful);
      
      const ratio = newHelpful / newTotal;
      let scoreAdjust = 0;
      if (ratio >= 0.8) scoreAdjust = 8;
      else if (ratio <= 0.4) scoreAdjust = -15;
      
      const newUnderstanding = Math.max(0, Math.min(100, (60 + questionsResolved * 8) + scoreAdjust));
      
      // Use updated trust formula
      const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
      const autonomyScore = 7;
      const transControl = visibilityScore + autonomyScore;
      const newTrust = Math.round(0.35 * activeRec.confidence + 0.25 * activeRec.timeMachine.accuracy + 0.25 * newUnderstanding + transControl);
      
      setUnderstandingScore(newUnderstanding);
      setTrustScore(newTrust);
    }
  };

  React.useEffect(() => {
    loadAutonomyLevel();
  }, []);

  React.useEffect(() => {
    loadCompanionState(activeRecId);
  }, [activeRecId]);

  const adaptedRecommendations = recommendations.map((rec) => {
    const isLowRiskAction = rec.action.toLowerCase().includes("patch") || 
                           rec.action.toLowerCase().includes("update") ||
                           rec.action.toLowerCase().includes("install");
    if (autonomyLevel === 4) {
      return { ...rec, status: rec.status === 'Pending' ? 'Approved' : rec.status } as Recommendation;
    } else if (autonomyLevel === 3) {
      if (isLowRiskAction) {
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
    setAutonomyLevelState(2);
    setInspectedAgents([]);
    setAgentChain([]);

    // Reset companion states
    setCompanionMessages([]);
    setUnderstandingScore(60);
    const targetRec = initialRecommendations.find(r => r.id === 'DEV1248') || initialRecommendations[0];
    const initialTrust = Math.round(0.35 * targetRec.confidence + 0.25 * targetRec.timeMachine.accuracy + 0.25 * 60 + 11);
    setTrustScore(initialTrust);
    setQuestionsAsked(0);
    setQuestionsResolved(0);
    setHelpfulVotes(0);
    setTotalVotes(0);
    setSuggestedQuestions([
      "Why was this recommended?",
      "What evidence supports this?",
      "What could make this wrong?",
      "What happens if I reject it?"
    ]);
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
        setAutonomyLevel,
        companionMessages,
        understandingScore,
        trustScore,
        questionsAsked,
        questionsResolved,
        helpfulVotes,
        totalVotes,
        suggestedQuestions,
        isCompanionLoading,
        askTrustLens,
        sendFeedback,
        loadCompanionState,
        agentChain,
        inspectedAgents,
        inspectAgent,
        user,
        loading,
        logout
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
