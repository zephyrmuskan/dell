/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components */
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
  companionMessages: Array<{role: 'user' | 'assistant', content: string, provider?: string, requires_feedback?: boolean, agentName?: string, agentIcon?: string}>;
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
  watchAgentDiscussion: boolean;
  setWatchAgentDiscussion: (val: boolean) => void;

  // Multi-Agent Transparency Integration
  agentChain: AgentChainStep[];
  inspectedAgents: string[];
  inspectAgent: (agentName: string) => void;

  // Supabase Auth Integration
  user: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginAsDemoUser: (role?: 'admin' | 'analyst' | 'stakeholder') => void;

  // Search & Date Filter Integration
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  customDateRange: { start: string; end: string };
  setCustomDateRange: (val: { start: string; end: string }) => void;
  filteredRecommendations: Recommendation[];
  filteredActivityLog: ActivityLogEntry[];
  filteredSimilarCases: PastCase[];
}

const initialRecommendations = siemData.recommendations as Recommendation[];
const initialLogs = siemData.activity_logs as ActivityLogEntry[];
const initialStats = siemData.dashboard_stats;

const isQuestionRelevant = (message: string, rec: Recommendation): boolean => {
  if (!message || !rec) return false;
  const msgLower = message.toLowerCase();

  // Remove punctuation and clean up whitespace
  const cleanedMsg = msgLower.replace(/[^\w\s]/g, '').trim();
  const words = cleanedMsg.split(/\s+/).filter(Boolean);

  const greetingsAndSlang = new Set(["hi", "hello", "yo", "wassup", "hey", "sup", "greetings", "howdy", "hola"]);
  const casualWords = new Set([
    "hi", "hello", "hey", "hola", "yo", "sup", "wassup", "greetings", "howdy",
    "good", "morning", "afternoon", "evening", "whats", "what", "is", "up",
    "bro", "dude", "man", "buddy", "mate", "slang", "test", "ok", "okay",
    "thanks", "thank", "you", "thx", "cool", "awesome", "yes", "no", "bye", "goodbye",
    "there", "here", "doing", "how", "are", "fine", "great", "well", "hihello"
  ]);

  // If the message is composed entirely of greetings, slang, or casual filler words, it is irrelevant
  if (words.length > 0 && words.every(w => greetingsAndSlang.has(w) || casualWords.has(w))) {
    return false;
  }

  // 1. Broad security explainability concepts
  const keywords = [
    "why", "reason", "recommend", "evidence", "support", "proof", "source", 
    "wrong", "incorrect", "error", "reject", "ignore", "dismiss", "approve", 
    "accept", "history", "similar", "incident", "explain", "details", "risk",
    "threat", "security", "anomaly", "compliance", "policy", "action"
  ];
  if (keywords.some(k => msgLower.includes(k))) {
    return true;
  }

  // 2. Match recommendation ID / device ID
  const recId = rec.id ? rec.id.toLowerCase() : "";
  if (recId && msgLower.includes(recId)) {
    return true;
  }

  // 3. Check for specific word overlap with Action
  const actionWords = rec.action ? rec.action.toLowerCase().split(/\s+/) : [];
  const filteredActionWords = actionWords.filter((w: string) => w.length > 3 && !["with", "from", "that", "this", "your"].includes(w));
  if (filteredActionWords.some((w: string) => msgLower.includes(w))) {
    return true;
  }

  // 4. Check for word overlap with Why/triggers
  const whyList = rec.why || [];
  for (const whyItem of whyList) {
    const whyWords = whyItem.toLowerCase().split(/\s+/);
    const filteredWhyWords = whyWords.filter((w: string) => w.length > 3);
    if (filteredWhyWords.some((w: string) => msgLower.includes(w))) {
      return true;
    }
  }

  return false;
};

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [activeRecId, setActiveRecId] = useState<string>('DEV1248');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(initialLogs);
  const [selectedAltAction, setSelectedAltAction] = useState<boolean>(false);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Search and Date filter state management
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilterState] = useState<string>(() => {
    return localStorage.getItem('dateFilter') || 'all';
  });
  const [customDateRange, setCustomDateRangeState] = useState<{ start: string; end: string }>(() => {
    try {
      const saved = localStorage.getItem('customDateRange');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          start: parsed?.start || '',
          end: parsed?.end || ''
        };
      }
    } catch (e) {
      console.error('Failed to parse customDateRange from localStorage', e);
    }
    return { start: '', end: '' };
  });

  const setDateFilter = (filter: string) => {
    setDateFilterState(filter);
    localStorage.setItem('dateFilter', filter);
  };

  const setCustomDateRange = (range: { start: string; end: string }) => {
    setCustomDateRangeState(range);
    localStorage.setItem('customDateRange', JSON.stringify(range));
  };


  // Supabase Auth Integration States & Methods
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthSession = async (session: any) => {
    if (session?.user) {
      const pendingPersona = localStorage.getItem('oauth_persona');
      if (pendingPersona) {
        localStorage.removeItem('oauth_persona');
        
        let full_name = 'Alex Mercer';
        let display_role = 'IT Administrator';
        
        if (pendingPersona === 'analyst') {
          full_name = 'Elena Vance';
          display_role = 'IT Security Analyst';
        } else if (pendingPersona === 'stakeholder') {
          full_name = 'Diana Prince';
          display_role = 'Compliance Director';
        }

        try {
          const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
            data: {
              full_name: session.user.user_metadata?.full_name || full_name,
              role: display_role,
              persona: pendingPersona
            }
          });
          if (!error && updatedUser) {
            setUser(updatedUser);
          } else {
            setUser({
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                full_name: session.user.user_metadata?.full_name || full_name,
                role: display_role,
                persona: pendingPersona
              }
            });
          }
        } catch (e) {
          console.warn("Failed to update Supabase user metadata:", e);
          setUser({
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              full_name: session.user.user_metadata?.full_name || full_name,
              role: display_role,
              persona: pendingPersona
            }
          });
        }
      } else {
        const meta = session.user.user_metadata || {};
        if (!meta.persona) {
          setUser({
            ...session.user,
            user_metadata: {
              ...meta,
              persona: 'admin',
              role: meta.role || 'IT Administrator',
              full_name: meta.full_name || 'Alex Mercer'
            }
          });
        } else {
          setUser(session.user);
        }
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthSession(session);
    });

    // Listen to authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const loginAsDemoUser = (role: 'admin' | 'analyst' | 'stakeholder' = 'admin') => {
    let email = 'admin@trustlens.ai';
    let full_name = 'Alex Mercer';
    let display_role = 'IT Administrator';
    
    if (role === 'analyst') {
      email = 'analyst@trustlens.ai';
      full_name = 'Elena Vance';
      display_role = 'IT Security Analyst';
    } else if (role === 'stakeholder') {
      email = 'director@trustlens.ai';
      full_name = 'Diana Prince';
      display_role = 'Compliance Director';
    }

    setUser({
      id: 'demo-user-id-' + role,
      email: email,
      user_metadata: {
        full_name: full_name,
        role: display_role,
        persona: role
      }
    });
  };

  const [autonomyLevel, setAutonomyLevelState] = useState<number>(1); // Default to Level 1 (Always Ask)
  const [agentChain, setAgentChain] = useState<AgentChainStep[]>([]);
  const [inspectedAgents, setInspectedAgents] = useState<string[]>([]);

  // AI Trust Companion States
  const [companionMessages, setCompanionMessages] = useState<Array<{role: 'user' | 'assistant', content: string, provider?: string, requires_feedback?: boolean, agentName?: string, agentIcon?: string}>>([]);
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
  const [lastQuestionRelevant, setLastQuestionRelevant] = useState<boolean>(false);
  const [watchAgentDiscussion, setWatchAgentDiscussion] = useState<boolean>(true);

  const loadAutonomyLevel = async () => {
    try {
      const res = await fetch('/api/autonomy-level');
      if (res.ok) {
        const data = await res.json();
        setAutonomyLevelState(data.level ?? 1);
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
          output_data: `{"classification": "${targetRec.severity}", "confidence": ${targetRec.confidence + 5 > 100 ? 100 : targetRec.confidence + 5}, "indicators": ["Telemetry spike detected", "Auth sequence anomaly"]}`,
          confidence: targetRec.confidence + 5 > 100 ? 100 : targetRec.confidence + 5,
          reasoning: `Telemetry patterns deviate from standard baseline logs. Flags suspicious commands or sequences.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Risk Assessment Agent",
          role: "Severity & Urgency Evaluator",
          input_data: `{"classification": "${targetRec.severity}", "confidence": ${targetRec.confidence + 5 > 100 ? 100 : targetRec.confidence + 5}, "indicators": ["Telemetry spike"]}`,
          output_data: `{"risk_level": "${targetRec.severity}", "risk_score": ${targetRec.trustDNA.score}, "business_impact": "Potential compromise of 8 devices"}`,
          confidence: targetRec.confidence + 2 > 100 ? 100 : targetRec.confidence + 2,
          reasoning: `Evaluated threat criticality by comparing host operations to fleet baselines. Urgent actions mapped accordingly.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Remediation Agent",
          role: "Policy & Resolution Suggester",
          input_data: `{"risk_level": "${targetRec.severity}", "risk_score": ${targetRec.trustDNA.score}, "business_impact": "Potential compromise"}`,
          output_data: `{"recommendation": "${action}", "confidence": ${targetRec.confidence}}`,
          confidence: targetRec.confidence,
          reasoning: `Identified optimal policy update via Graph/REST gateway APIs to resolve the risk signature.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Devil's Advocate Agent",
          role: "Validation & Falsification Challenger",
          input_data: `{"recommendation": "${action}", "confidence": ${targetRec.confidence}}`,
          output_data: `{"counterpoints": ["Recent patch installed", "Limited device history"], "alternative_action": "${da.alternativeAction}"}`,
          confidence: 35,
          reasoning: `Challenged decision: ${da.points.join("; ")}`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Trust Time Machine Agent",
          role: "Historical Incident Profiler",
          input_data: `Incident Context: '${targetRec.why.join(" ")}'`,
          output_data: `{"similar_cases": ${targetRec.timeMachine.cases}, "correct": ${targetRec.timeMachine.breakdown.correct}, "false_positive": ${targetRec.timeMachine.breakdown.falsePositives}, "historical_accuracy": ${targetRec.timeMachine.accuracy}}`,
          confidence: targetRec.timeMachine.accuracy,
          reasoning: `Found ${targetRec.timeMachine.cases} similar cases in history with a baseline accuracy of ${targetRec.timeMachine.accuracy}%.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Incident Report Agent",
          role: "Compliance & Documentation Agent",
          input_data: `{"recommendation": "${action}", "confidence": ${targetRec.confidence}}`,
          output_data: `{"summary": "Proposed ${action} policy flag.", "root_cause": "Anomalous system operations flagged.", "failed_safeguard": "Insufficient historical context."}`,
          confidence: 90,
          reasoning: `Generated documentation card summarizing root cause analysis and failed safeguard policy mapping.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Orchestrator Agent",
          role: "Multi-Agent Decision Coordinator",
          input_data: "Ingested outputs from all 6 upstream agents.",
          output_data: `{"final_recommendation": "${action}", "confidence": ${targetRec.confidence}, "trust_score": ${trustScore}}`,
          confidence: targetRec.confidence,
          reasoning: `Orchestrator resolved agent flows. Final Action: ${action} with trust score ${trustScore}%.`,
          timestamp: new Date().toISOString()
        },
        {
          name: "Trust Companion Agent",
          role: "Dialogue & Explainability Interface",
          input_data: `{"final_recommendation": "${action}", "confidence": ${targetRec.confidence}, "trust_score": ${trustScore}}`,
          output_data: `{"answer": "Dialogue console active. Understanding Score is at ${understandingScore}%.", "trust_update_allowed": false, "follow_up_questions": ["Why not monitor?", "Show similar incidents"]}`,
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
        
        // Use updated trust formula with dynamic confidence if available
        const confidenceToUse = data.confidence !== undefined && data.confidence !== null ? data.confidence : targetRec.confidence;
        const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
        const autonomyScore = 7;
        const transControl = visibilityScore + autonomyScore;
        const newTrust = Math.round(
          0.35 * confidenceToUse + 
          0.25 * targetRec.timeMachine.accuracy + 
          0.25 * (data.understanding_score ?? 60) + 
          transControl
        );
        setTrustScore(newTrust);
        
        // Synchronize dynamic confidence to recommendations state
        if (data.confidence !== undefined && data.confidence !== null) {
          setRecommendations((prev) =>
            prev.map((r) =>
              r.id === recId ? { ...r, confidence: data.confidence } : r
            )
          );
        }

        setQuestionsAsked(data.questions_asked ?? 0);
        setQuestionsResolved(data.questions_resolved ?? 0);
        setHelpfulVotes(data.helpful_votes ?? 0);
        setTotalVotes(data.total_votes ?? 0);
        
        if (data.messages && data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg.role === 'assistant' && lastMsg.intent === 'GREETING') {
            setSuggestedQuestions([
              "Show active recommendations",
              "Explain trust scores",
              "How does TrustLens work?",
              "Review recent incidents"
            ]);
          } else {
            setSuggestedQuestions([
              "Why was this recommended?",
              "What evidence supports this?",
              "What could make this wrong?",
              "What happens if I approve it?",
              "What happens if I reject it?"
            ]);
          }
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
      setLastQuestionRelevant(false);
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

  const classifyIntent = (message: string): 'TIME_MACHINE' | 'DEVILS_ADVOCATE' | 'RECOMMENDATION' | 'CONSENSUS' | 'GREETING' | 'DECISION' | 'GENERAL' => {
    const msg = message.toLowerCase().trim();
    
    // Greeting
    const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "greetings"];
    if (greetings.some(g => msg === g || msg.startsWith(g + " ") || msg.startsWith(g + "?") || msg.startsWith(g + "!"))) {
      return 'GREETING';
    }

    // Trust Time Machine
    if (
      msg.includes("similar cases") || 
      msg.includes("similar incidents") || 
      msg.includes("similar devices") || 
      msg.includes("similar problems") || 
      msg.includes("similar issues") || 
      msg.includes("history") || 
      msg.includes("time machine") || 
      msg.includes("past cases") || 
      msg.includes("recent cases") || 
      msg.includes("happened before") || 
      msg.includes("often has this")
    ) {
      return 'TIME_MACHINE';
    }

    // Devil's Advocate
    if (
      msg.includes("wrong") || 
      msg.includes("incorrect") || 
      msg.includes("error") || 
      msg.includes("false") || 
      msg.includes("advocate") || 
      msg.includes("counterpoint") || 
      msg.includes("counter-argument") || 
      msg.includes("disagree") || 
      msg.includes("alternative action")
    ) {
      return 'DEVILS_ADVOCATE';
    }

    // Consensus Engine
    if (
      msg.includes("confident") || 
      msg.includes("confidence") || 
      msg.includes("trust score") || 
      msg.includes("consensus") || 
      msg.includes("certainty") || 
      msg.includes("probability") || 
      msg.includes("how confident") || 
      msg.includes("explain trust")
    ) {
      return 'CONSENSUS';
    }

    // Decision / Consequence
    if (
      msg.includes("reject") || 
      msg.includes("approve") || 
      msg.includes("accept") || 
      msg.includes("decline") || 
      msg.includes("happen if") || 
      msg.includes("dismiss") || 
      msg.includes("ignore")
    ) {
      return 'DECISION';
    }

    // Recommendation / Evidence / Telemetry
    if (
      msg.includes("why") || 
      msg.includes("reason") || 
      msg.includes("recommend") || 
      msg.includes("evidence") || 
      msg.includes("support") || 
      msg.includes("proof") || 
      msg.includes("telemetry") || 
      msg.includes("source") || 
      msg.includes("trigger")
    ) {
      return 'RECOMMENDATION';
    }

    // General / help
    if (
      msg.includes("who are you") || 
      msg.includes("what can you do") || 
      msg.includes("capabilities") || 
      msg.includes("how does trustlens work") || 
      msg.includes("help")
    ) {
      return 'GENERAL';
    }

    return 'RECOMMENDATION'; // default fallback for other queries to trigger discussion
  };

  const streamAgentDiscussion = (
    rec: Recommendation,
    tScore: number,
    uScore: number,
    requiresFeedback: boolean,
    userMsg: string
  ) => {
    const intent = classifyIntent(userMsg);
    const detConf = rec.confidence + 5 > 100 ? 100 : rec.confidence + 5;
    const riskConf = rec.confidence + 2 > 100 ? 100 : rec.confidence + 2;

    // Build collaborative statements based on intent
    let steps: { name: string; icon: string; content: string }[] = [];

    if (intent === 'TIME_MACHINE') {
      steps = [
        {
          name: "Trust Time Machine Agent",
          icon: "⏳",
          content: `**Role:** Historical Incident Profiler
• **Confidence:** ${rec.timeMachine.accuracy}%
• **Opinion:** Checking past cases, this alert profile has triggered **${rec.timeMachine.cases} times** in our history, with a historical accuracy rate of **${rec.timeMachine.accuracy}%**.
Breakdown: ${rec.timeMachine.breakdown.correct} correct actions, ${rec.timeMachine.breakdown.falsePositives} false positives.
Here is the historical record:
${rec.similarCasesList ? rec.similarCasesList.slice(0, 2).map(c => `- **${c.case_id}** (${c.date}): ${c.outcome} | Decision: ${c.decision} by ${c.analyst}`).join('\n') : '- CASE-0865: Resolved as false alarm.'}`
        },
        {
          name: "Consensus Engine",
          icon: "🎯",
          content: `**Role:** Decision Coordinator
• **Opinion:** I agree with the Time Machine's analysis. Citing these historical cases, our confidence in the recommended action is validated at **${rec.timeMachine.accuracy}%** based on past outcomes.`
        }
      ];
    } else if (intent === 'DEVILS_ADVOCATE') {
      steps = [
        {
          name: "Devil's Advocate Agent",
          icon: "😈",
          content: `**Role:** Validation & Falsification Challenger
• **Confidence:** 35%
• **Opinion:** I challenge the proposed resolution! This activity may be a false positive due to standard updates.
My analysis reveals these counter-indicators:
${rec.devilsAdvocate.points.map(p => `- ${p}`).join('\n')}
We should consider the alternative action: **"${rec.devilsAdvocate.alternativeAction}"**.`
        },
        {
          name: "Risk Assessment Agent",
          icon: "📊",
          content: `**Role:** Severity & Urgency Evaluator
• **Confidence:** ${riskConf}%
• **Opinion:** I disagree with the Devil's Advocate's recommendation to monitor. The threat severity is **${rec.severity}** and the potential risk score is **${rec.trustDNA.score}%**, which warrants immediate action rather than passive monitoring.`
        },
        {
          name: "Consensus Engine",
          icon: "🎯",
          content: `**Role:** Decision Coordinator
• **Opinion:** Final vote summary on Devil's Advocate dispute: 1 supports alternative action, 3 support resolution action. The challenge is resolved. Calibrated Trust Score is **${tScore}%**.`
        }
      ];
    } else if (intent === 'CONSENSUS') {
      steps = [
        {
          name: "Consensus Engine",
          icon: "🎯",
          content: `**Role:** Decision Coordinator
• **Confidence:** ${rec.confidence}%
• **Opinion:** We gathered all upstream agent votes to calibrate the final trust parameters.
🎯 **Calibrated Trust Score:** **${tScore}%**
🛡️ **Resolution Action:** **"${rec.action}"**
**Agent Vote Summary:**
- 🔍 Detection Agent: Approve "${rec.action}" (${detConf}% confidence)
- 📊 Risk Assessment: Approve "${rec.action}" (${riskConf}% confidence)
- 🛠 Remediation Suggester: Approve "${rec.action}" (${rec.confidence}% confidence)
- 😈 Devil's Advocate: Objects (35% confidence, suggests "${rec.devilsAdvocate.alternativeAction}")
- ⏳ Trust Time Machine: Approve (Accuracy: ${rec.timeMachine.accuracy}%)`
        }
      ];
    } else if (intent === 'DECISION') {
      steps = [
        {
          name: "Remediation Agent",
          icon: "🛠",
          content: `**Role:** Policy & Resolution Suggester
• **Confidence:** ${rec.confidence}%
• **Opinion:** I suggest executing **"${rec.action}"** immediately to isolate device **${rec.id}** and protect the local network.`
        },
        {
          name: "Devil's Advocate Agent",
          icon: "😈",
          content: `**Role:** Validation & Falsification Challenger
• **Confidence:** 35%
• **Opinion:** I challenge the Remediation Agent's plan. A quarantine will cause immediate user disruption. We should evaluate if the anomaly matches normal patch schedules first.`
        },
        {
          name: "Consensus Engine",
          icon: "🎯",
          content: `**Role:** Decision Coordinator
• **Opinion:** Resolution: Proceed with **"${rec.action}"** as the potential risk outweighs the user disruption. Final trust rating: **${tScore}%**.`
        }
      ];
    } else {
      // Default / RECOMMENDATION
      steps = [
        {
          name: "Detection Agent",
          icon: "🔍",
          content: `**Role:** Telemetry & Anomaly Analyzer
• **Confidence:** ${detConf}%
• **Opinion:** I analyzed the raw logs and network signals for device **${rec.id}**. I detected anomaly signals indicating: ${rec.why[0].replace(/^[•-]\s*/, '')}. This telemetry deviates significantly from standard baselines, suggesting a potential security concern.`
        },
        {
          name: "Risk Assessment Agent",
          icon: "📊",
          content: `**Role:** Severity & Urgency Evaluator
• **Confidence:** ${riskConf}%
• **Opinion:** I agree with the Detection Agent's anomaly findings. My evaluation of the telemetry on **${rec.id}** confirms the threat matches a **${rec.severity}** severity rating, with an assessed risk score of **${rec.trustDNA.score}%** due to potential network exposure.`
        },
        {
          name: "Devil's Advocate Agent",
          icon: "😈",
          content: `**Role:** Validation & Falsification Challenger
• **Confidence:** 35%
• **Opinion:** I challenge the Risk Agent's threat evaluation! I disagree that this is a confirmed threat. Standard system processes could explain this telemetry pattern. Specifically, ${rec.devilsAdvocate.points[0].toLowerCase()}. Before executing a disruptive isolation command, we should consider the alternative: **"${rec.devilsAdvocate.alternativeAction}"**.`
        },
        {
          name: "Remediation Agent",
          icon: "🛠",
          content: `**Role:** Policy & Resolution Suggester
• **Confidence:** ${rec.confidence}%
• **Opinion:** Considering both viewpoints, I request historical evidence. The Trust Time Machine reports that this alert profile has triggered **${rec.timeMachine.cases} times** in the past with a fleet verification accuracy of **${rec.timeMachine.accuracy}%**. Citing these historical cases, proceeding with the action **"${rec.action}"** is the safest path to mitigate risk.`
        },
        {
          name: "Consensus Engine",
          icon: "🎯",
          content: `**Role:** Decision Coordinator
• **Opinion:** Final consensus resolved. The agent council has voted on the proposed policy.
**Vote Summary:** 3 support **"${rec.action}"**, 1 supports **"${rec.devilsAdvocate.alternativeAction}"**.
**Calibrated Trust Score:** **${tScore}%**
**Decision:** Approved to execute **"${rec.action}"**.`
        }
      ];
    }

    // Filter out previous temporary user duplicates and append the user message
    setCompanionMessages((prev) => [
      ...prev.filter(m => m.role !== 'user' || m.content !== userMsg),
      { role: 'user', content: userMsg }
    ]);

    setIsCompanionLoading(true);

    // If watchAgentDiscussion is false, generate a final consensus response directly
    if (!watchAgentDiscussion) {
      setTimeout(() => {
        const finalConsensusText = `### 🎯 Final Consensus Response
The agent council has completed its review regarding **${rec.id}**.

* **Resolution Action:** **${rec.action}** (Approved)
* **Calibrated Trust Score:** **${tScore}%** (Understanding: ${uScore}%, Confidence: ${rec.confidence}%)
* **Alternative Proposed (Challenged):** **${rec.devilsAdvocate.alternativeAction}**

**Discussion Summary:**
* **Threat Alert:** Classify anomaly as **${rec.severity}** severity based on telemetry.
* **Devil's Advocate Challenge:** Raised concern that it could be *${rec.devilsAdvocate.points[0]}*.
* **Historical Validation:** Checked **${rec.timeMachine.cases} similar cases** in the Trust Time Machine (**${rec.timeMachine.accuracy}% accuracy**).
* **Final Vote:** 3 support **${rec.action}**, 1 supports **${rec.devilsAdvocate.alternativeAction}**.`;

        setCompanionMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: finalConsensusText,
            agentName: "Consensus Engine",
            agentIcon: "🎯",
            requires_feedback: requiresFeedback
          }
        ]);
        setIsCompanionLoading(false);
      }, 800);
      return;
    }

    // Stream the collaborative discussion steps one-by-one
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setCompanionMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: step.content,
            agentName: step.name,
            agentIcon: step.icon,
            requires_feedback: idx === steps.length - 1 && requiresFeedback
          }
        ]);

        if (idx === steps.length - 1) {
          setIsCompanionLoading(false);
        }
      }, (idx + 1) * 1200); // 1.2s delay for each agent
    });
  };

  const askTrustLens = async (message: string) => {
    setIsCompanionLoading(true);
    setCompanionMessages((prev) => [...prev, { role: 'user', content: message }]);
    
    try {
      // 1. Query the backend directly
      const res = await fetch('/api/trust-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation_id: activeRecId, message })
      });
      
      if (!res.ok) {
        throw new Error(`Backend returned status ${res.status}`);
      }
      
      const data = await res.json();
      
      const newUnderstanding = data.understanding_score;
      setUnderstandingScore(newUnderstanding);

      const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
      const autonomyScore = 7;
      const transControl = visibilityScore + autonomyScore;
      const confidenceToUse = data.confidence !== undefined && data.confidence !== null ? data.confidence : activeRec.confidence;
      
      const newTrust = Math.round(
        0.35 * confidenceToUse + 
        0.25 * activeRec.timeMachine.accuracy + 
        0.25 * newUnderstanding + 
        transControl
      );
      setTrustScore(newTrust);

      if (data.confidence !== undefined && data.confidence !== null) {
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === activeRecId ? { ...r, confidence: data.confidence } : r
          )
        );
      }

      setQuestionsAsked(data.questions_asked);
      setQuestionsResolved(data.questions_resolved);
      setSuggestedQuestions(data.suggested_questions || [
        "Why was this recommended?",
        "What evidence supports this?",
        "What could make this wrong?",
        "What happens if I reject it?"
      ]);

      if (data.conversation_type === "greeting" || data.conversation_type === "general") {
        setCompanionMessages((prev) => [
          ...prev.filter(m => m.role !== 'user' || m.content !== message),
          { role: 'user', content: message },
          { role: 'assistant', content: data.answer || "Ready to assist." }
        ]);
        setIsCompanionLoading(false);
      } else {
        streamAgentDiscussion(activeRec, newTrust, newUnderstanding, !!data.requires_feedback, message);
      }

    } catch (e) {
      console.warn("Gemini chatbot interface call failed, using mock fallbacks:", e);
      setTimeout(() => {
        const isRelevant = isQuestionRelevant(message, activeRec);
        setLastQuestionRelevant(isRelevant);
        
        let newAsked = questionsAsked;
        let newResolved = questionsResolved;
        let newUnderstanding = understandingScore;
        let newTrust = trustScore;

        if (isRelevant) {
          newAsked = questionsAsked + 1;
          newResolved = questionsResolved + 1;
          newUnderstanding = Math.min(100, 60 + newResolved * 8);
          
          const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
          const autonomyScore = 7;
          const transControl = visibilityScore + autonomyScore;
          newTrust = Math.round(0.35 * activeRec.confidence + 0.25 * activeRec.timeMachine.accuracy + 0.25 * newUnderstanding + transControl);
        }
        
        setUnderstandingScore(newUnderstanding);
        setTrustScore(newTrust);
        setQuestionsAsked(newAsked);
        setQuestionsResolved(newResolved);

        const msgClean = message.toLowerCase().trim().replace(/[?!.]/g, "");
        const isGreeting = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"].some(g => msgClean === g || msgClean.startsWith(g));
        const isGeneral = ["what can you do", "who are you", "how does trustlens work", "capabilities", "help"].some(g => msgClean.includes(g));

        if (isGreeting || isGeneral) {
          let localAnswer = `I am TrustLens AI, your enterprise decision copilot. How can I help you today?`;
          if (msgClean.includes("hi") || msgClean.includes("hey") || msgClean.includes("hello")) {
            localAnswer = `Hello 👋\n\nI'm TrustLens AI, your enterprise decision copilot. I can help explain recommendations, confidence scores, risks, and historical incidents. What would you like to explore today?`;
          } else if (msgClean.includes("what can you do") || msgClean.includes("capabilities") || msgClean.includes("help")) {
            localAnswer = `I'm TrustLens AI, your enterprise decision copilot. I help IT administrators analyze security recommendations by explaining:\n\n` +
              `• The context and reasoning behind AI recommendations\n` +
              `• The data sources and evidence supporting them\n` +
              `• Potential risks, counter-arguments (via our Devil's Advocate), and alternative actions\n` +
              `• Historical accuracy and similar past incidents using the Trust Time Machine\n` +
              `• Detailed confidence and calibrated trust scores`;
          } else if (msgClean.includes("who are you")) {
            localAnswer = `I am TrustLens AI, your friendly enterprise decision copilot. My role is to help you analyze security recommendations with transparency, explain trust scores, and support your decision-making process using non-technical language.`;
          } else if (msgClean.includes("how does trustlens work")) {
            localAnswer = `TrustLens AI analyzes security telemetry and processes it through a series of specialized AI validation agents. We calibrate a trust score based on AI confidence, historical accuracy, and user understanding, translating complex events into clear, non-technical explanations.`;
          }

          setCompanionMessages((prev) => [
            ...prev.filter(m => m.role !== 'user' || m.content !== message),
            { role: 'user', content: message },
            { role: 'assistant', content: localAnswer }
          ]);
          setSuggestedQuestions([
            "Why was this recommended?",
            "Explain trust scores",
            "How does TrustLens work?"
          ]);
          setIsCompanionLoading(false);
        } else {
          setSuggestedQuestions([
            "What could make this wrong?",
            "What happens if I reject it?",
            "Show similar incidents"
          ]);
          streamAgentDiscussion(activeRec, newTrust, newUnderstanding, true, message);
        }
      }, 700);
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
        const confidenceToUse = data.confidence !== undefined && data.confidence !== null ? data.confidence : targetRec.confidence;
        const newTrust = Math.round(
          0.35 * confidenceToUse + 
          0.25 * targetRec.timeMachine.accuracy + 
          0.25 * data.understanding_score + 
          transControl
        );
        setTrustScore(newTrust);
        
        if (data.confidence !== undefined && data.confidence !== null) {
          setRecommendations((prev) =>
            prev.map((r) =>
              r.id === activeRecId ? { ...r, confidence: data.confidence } : r
            )
          );
        }

        setQuestionsAsked(data.questions_asked ?? questionsAsked);
        setQuestionsResolved(data.questions_resolved ?? questionsResolved);
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
      setUnderstandingScore(newUnderstanding);

      if (lastQuestionRelevant) {
        const currentConf = activeRec.confidence;
        const newConf = helpful ? Math.min(100, currentConf + 5) : Math.max(0, currentConf - 5);
        
        // Update recommendations list state with dynamic confidence
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === activeRecId ? { ...r, confidence: newConf } : r
          )
        );

        // Recalculate trust score using updated confidence
        const visibilityScore = inspectedAgents.length > 0 ? 8 : 4;
        const autonomyScore = 7;
        const transControl = visibilityScore + autonomyScore;
        const newTrust = Math.round(0.35 * newConf + 0.25 * activeRec.timeMachine.accuracy + 0.25 * newUnderstanding + transControl);
        setTrustScore(newTrust);
      }
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadAutonomyLevel();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadCompanionState(activeRecId);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getSimulatedDate = (id: string): Date => {
    const now = new Date();
    if (id === 'DEV1248' || id === 'DEV-8890') {
      return now;
    }
    if (id === 'SRV-0451') {
      const d = new Date();
      d.setDate(now.getDate() - 3); // 3 days ago
      return d;
    }
    if (id === 'USR-7782') {
      const d = new Date();
      d.setDate(now.getDate() - 10); // 10 days ago
      return d;
    }
    if (id === 'SRV-1022') {
      const d = new Date();
      d.setDate(now.getDate() - 15); // 15 days ago
      return d;
    }
    const d = new Date();
    d.setDate(now.getDate() - 5);
    return d;
  };

  const isDateInFilter = (id: string): boolean => {
    const recDate = getSimulatedDate(id);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (dateFilter === 'all') return true;
    
    if (dateFilter === 'today') {
      return recDate >= startOfToday && recDate <= now;
    }
    
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return recDate >= sevenDaysAgo && recDate <= now;
    }
    
    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return recDate >= thirtyDaysAgo && recDate <= now;
    }
    
    if (dateFilter === 'custom') {
      if (!customDateRange.start) return true;
      const startDate = new Date(customDateRange.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = customDateRange.end ? new Date(customDateRange.end) : new Date();
      endDate.setHours(23, 59, 59, 999);
      return recDate >= startDate && recDate <= endDate;
    }
    
    return true;
  };

  const isCaseDateInFilter = (dateStr: string): boolean => {
    const recDate = new Date(dateStr);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (dateFilter === 'all') return true;
    
    if (dateFilter === 'today') {
      return recDate >= startOfToday && recDate <= now;
    }
    
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return recDate >= sevenDaysAgo && recDate <= now;
    }
    
    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return recDate >= thirtyDaysAgo && recDate <= now;
    }
    
    if (dateFilter === 'custom') {
      if (!customDateRange.start) return true;
      const startDate = new Date(customDateRange.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = customDateRange.end ? new Date(customDateRange.end) : new Date();
      endDate.setHours(23, 59, 59, 999);
      return recDate >= startDate && recDate <= endDate;
    }
    
    return true;
  };

  const filteredRecommendations = adaptedRecommendations.filter((rec) => {
    if (!isDateInFilter(rec.id)) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      rec.id.toLowerCase().includes(query) ||
      rec.action.toLowerCase().includes(query) ||
      rec.severity.toLowerCase().includes(query) ||
      rec.why.some(w => w.toLowerCase().includes(query)) ||
      (rec.type && rec.type.toLowerCase().includes(query))
    );
  });

  const activeRec = adaptedRecommendations.find((r) => r.id === activeRecId) || adaptedRecommendations[0];

  const filteredActivityLog = activityLog.filter((_log) => {
    if (dateFilter === 'custom' && customDateRange.start) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(customDateRange.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = customDateRange.end ? new Date(customDateRange.end) : new Date();
      endDate.setHours(23, 59, 59, 999);
      return today >= startDate && today <= endDate;
    }
    return true;
  });

  const filteredSimilarCases = activeRec?.similarCasesList
    ? activeRec.similarCasesList.filter((c) => isCaseDateInFilter(c.date))
    : [];

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
    
    const baseMsg = selectedAltAction
      ? `Alternative action chosen: "${activeRec.devilsAdvocate.alternativeAction}". Status updated.`
      : `Recommendation ${decision} by Admin IT Administrator.`;
    const eventMsg = notes && notes.trim() !== '' ? `${baseMsg} Comment: "${notes.trim()}"` : baseMsg;

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
    setAutonomyLevelState(1);
    setInspectedAgents([]);
    setAgentChain([]);

    // Reset companion states
    setCompanionMessages([]);
    setUnderstandingScore(60);
    setLastQuestionRelevant(false);
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
        watchAgentDiscussion,
        setWatchAgentDiscussion,
        user,
        loading,
        logout,
        loginAsDemoUser,
        searchQuery,
        setSearchQuery,
        dateFilter,
        setDateFilter,
        customDateRange,
        setCustomDateRange,
        filteredRecommendations,
        filteredActivityLog,
        filteredSimilarCases
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
