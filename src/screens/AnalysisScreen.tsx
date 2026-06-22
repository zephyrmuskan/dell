import React, { useState, useEffect, useRef } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { GlassCard } from '../components/GlassCard';
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText,
  FileCheck,
  ServerCrash,
  Send,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Bot,
  User,
  MessageSquare,
  Database,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LaymanExplanation {
  whatHappened: string[];
  whyImportant: string[];
  recommendation: string[];
  sureness: string;
  wrongPossibility: string[];
  approveConsequence: string[];
  ignoreConsequence: string[];
}

const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Split content by code blocks first
  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 select-text font-sans leading-relaxed">
      {blocks.map((block, index) => {
        // Code Block case
        if (block.startsWith('```')) {
          const match = block.match(/```(\w*)\n([\s\S]*?)```/);
          const code = match ? match[2] : block.slice(3, -3);
          return (
            <pre key={index} className="bg-slate-950 text-slate-350 font-mono text-[11px] p-4 rounded-xl border border-slate-800 overflow-x-auto my-2 select-text">
              <code>{code}</code>
            </pre>
          );
        }

        // Standard Text case
        const lines = block.split('\n');
        return (
          <React.Fragment key={index}>
            {lines.map((line, lineIdx) => {
              const trimmedLine = line.trim();
              
              // Handle list item (starts with - or * or numbering)
              if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                const content = trimmedLine.slice(2);
                return (
                  <ul key={lineIdx} className="list-disc pl-5 my-1 text-sm text-slate-850">
                    <li className="font-semibold text-slate-800">{renderInlineMarkdown(content)}</li>
                  </ul>
                );
              }

              // Handle headers
              if (trimmedLine.startsWith('### ')) {
                return <h5 key={lineIdx} className="text-xs font-black uppercase tracking-wider text-slate-900 mt-3 mb-1">{renderInlineMarkdown(trimmedLine.slice(4))}</h5>;
              }
              if (trimmedLine.startsWith('## ')) {
                return <h4 key={lineIdx} className="text-sm font-black text-slate-900 mt-4 mb-1">{renderInlineMarkdown(trimmedLine.slice(3))}</h4>;
              }

              // Default paragraph
              if (trimmedLine === '') {
                return <div key={lineIdx} className="h-2" />;
              }

              return (
                <p key={lineIdx} className="text-sm text-slate-800 font-semibold m-0 leading-relaxed">
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Helper to render bold and inline code
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-black text-slate-950">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-slate-200 text-indigo-900 px-1 py-0.5 rounded font-mono text-xs font-bold border border-slate-300/40">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const DetailModal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-brand-navy/95 border border-white/10 rounded-3xl p-6 shadow-premium-xl max-w-lg w-full relative"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <h3 className="text-base font-bold text-white m-0">{title}</h3>
            <button 
              onClick={onClose}
              type="button"
              className="text-white/60 hover:text-white text-sm font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1 text-white">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const AnalysisScreen: React.FC = () => {
  const { 
    activeRec, 
    setCurrentScreen,
    companionMessages,
    trustScore,
    isCompanionLoading,
    askTrustLens,
    sendFeedback,
    user
  } = useWorkflow();

  const { id, action, confidence, nutritionLabel, shapImportance } = activeRec;

  const persona = user?.user_metadata?.persona || 'admin';

  const [inputValue, setInputValue] = useState('');
  const [feedbackClicked, setFeedbackClicked] = useState(false);
  const [prevScore, setPrevScore] = useState(trustScore);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showFactCheck, setShowFactCheck] = useState(false);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatPaneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (trustScore !== prevScore) {
      const bannerTimer = setTimeout(() => {
        setShowUpdateBanner(true);
      }, 0);
      const timer = setTimeout(() => {
        setShowUpdateBanner(false);
        setPrevScore(trustScore);
      }, 6000);
      return () => {
        clearTimeout(bannerTimer);
        clearTimeout(timer);
      };
    }
  }, [trustScore, prevScore]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPrevScore(trustScore);
      setShowUpdateBanner(false);
      setFeedbackClicked(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeRec.id, trustScore]);

  useEffect(() => {
    if (chatPaneRef.current) {
      chatPaneRef.current.scrollTop = chatPaneRef.current.scrollHeight;
    }
  }, [companionMessages, isCompanionLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFeedbackClicked(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [companionMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    askTrustLens(inputValue.trim());
    setInputValue('');
  };

  const getFriendlyFeatureName = (feature: string) => {
    const translations: Record<string, string> = {
      "Deviation From Normal Routine": "Activity differs from standard daily routines",
      "Activity Unpredictability Level": "Unpredictable order of actions",
      "Overall Threat Severity Score": "Calculated risk severity rating",
      "Data Source Reliability": "Reliability of the source logs",
      "Rapid Repeated Access Actions": "High number of actions within a short time",
      "Unusual Ordering of Steps": "Strange sequence of commands",
      "Matches Known Virus Profile": "Looks like previous security threats",
      "Spike in Failed Password Attempts": "Recent spike in incorrect passwords",
      "Device Antivirus Turned Off": "Security firewall or antivirus turned off",
      "Strange Background Command Execution": "Unusual background system activity",
      "Local Firewalls Running": "Active local firewalls protecting the device",
      "Severity of Known Software Vulnerabilities": "Severity of outdated software flaws",
      "Open Network Port Flagged": "Unsecured open network port",
      "Unsecured Cloud API Commands": "Unprotected cloud database queries",
      "Protected Cloud Network Rule Active": "Secure cloud firewall policies",
      "Impossible Travel Distance Alert": "Login distance physically impossible to travel",
      "Attempted Access to Restricted Personnel Files": "Attempt to read restricted files",
      "Multiple Logins from Different Locations": "Logins from different locations at once",
      "Verified Company VPN Connection": "Login came from verified company VPN",
      "File Write Frequency": "Speed of file modifications",
      "VSSADMIN Command Call": "Attempt to alter local backup records",
      "Entropy Variance": "Unusual file formatting modifications",
      "Endpoint Agent Active": "Healthy state of the local security agent",
      "Outbound Bytes Spike": "Spike in outgoing network traffic size",
      "Port Tunneling Heuristic": "Attempt to bypass standard network ports",
      "Unauthorized Remote IP": "Data sent to an unapproved server IP",
      "Migration Cron Active": "Scheduled database backup job active"
    };
    return translations[feature] || feature;
  };

  const getLaymanExplanation = (id: string, action: string): LaymanExplanation => {
    const explanation: LaymanExplanation = {
      whatHappened: [
        "The system noticed behavior that does not match standard daily routines.",
        "We detected unusual logs from the device compliance manager."
      ],
      whyImportant: [
        "Unusual patterns might mean an unauthorized person is accessing the fleet.",
        "It could put our organization's sensitive files at risk."
      ],
      recommendation: [
        `We suggest deploying the ${action} policy to secure this asset.`
      ],
      sureness: "We are confident about this suggestion because past events of this nature match this profile.",
      wrongPossibility: [
        "The device might be executing a valid background script or updating software.",
        "An administrator might be running manual network diagnostics."
      ],
      approveConsequence: [
        `The command will be dispatched to the gateway immediately.`,
        "This might briefly limit device capabilities or require user verification."
      ],
      ignoreConsequence: [
        "If this is a real issue, security rules could be bypassed.",
        "The asset will remain in an unverified compliance state."
      ]
    };

    if (id === 'DEV1248') {
      explanation.whatHappened = [
        "This device is running commands in a way that is very different from its normal daily routine.",
        "We found activity that looks similar to previous security threats."
      ];
      explanation.whyImportant = [
        "If a device behaves this way, it suggests someone else might have gained control of it.",
        "This puts our company networks and files at risk."
      ];
      explanation.recommendation = [
        "We recommend disconnecting this device from the network immediately to keep other devices safe."
      ];
      explanation.sureness = "We are highly confident about this recommendation because similar situations in the past showed the same warning signs, and our validation checks confirmed these anomalies.";
      explanation.wrongPossibility = [
        "The user might be installing an approved system software update.",
        "A background backup tool could be running and re-arranging files."
      ];
      explanation.approveConsequence = [
        "The device will be isolated from the company network immediately via VMware Workspace ONE UEM.",
        "The user will lose access to internal files until you manually approve reconnection."
      ];
      explanation.ignoreConsequence = [
        "If this is a real attack, it could spread to other devices on our network.",
        "An intruder could continue transferring data without being stopped."
      ];
    }
    
    if (id === 'SRV-0451') {
      explanation.whatHappened = [
        "The server is running outdated software with a known security flaw.",
        "External traffic has been trying to connect to its open network ports."
      ];
      explanation.whyImportant = [
        "Leaving software outdated creates an open doorway for intruders.",
        "They could exploit this flaw to disrupt our database and services."
      ];
      explanation.recommendation = [
        "We recommend deploying the security patch update to fix this vulnerability."
      ];
      explanation.sureness = "We are moderately confident because the software vulnerability is confirmed, though the network traffic could just be a routine scan rather than a targeted threat.";
      explanation.wrongPossibility = [
        "The traffic might be a standard database maintenance check by our IT team.",
        "The vulnerability scanner could have outdated information about the server's current state."
      ];
      explanation.approveConsequence = [
        "The patch will be deployed automatically via Microsoft Intune.",
        "This might cause a brief 2-minute service restart for users."
      ];
      explanation.ignoreConsequence = [
        "The server remains vulnerable to known security flaws.",
        "Any future scans could easily access the database if an exploit is attempted."
      ];
    }

    if (id === 'USR-7782') {
      explanation.whatHappened = [
        "The account logged in from two different locations at the same time.",
        "It is physically impossible to travel between these locations in that timeframe."
      ];
      explanation.whyImportant = [
        "This indicates that another person might have obtained the user's password.",
        "They could be reading restricted internal files and employee catalogs."
      ];
      explanation.recommendation = [
        "We recommend triggering a security challenge to verify the real identity of the user."
      ];
      explanation.sureness = "We are highly confident because logins from impossible distances are extremely reliable indicators of password sharing or compromise.";
      explanation.wrongPossibility = [
        "The user might be using a company virtual network (VPN) that changes their virtual location.",
        "An automated cloud storage sync tool could be active on their home computer."
      ];
      explanation.approveConsequence = [
        "A verification challenge is sent to the user's mobile device via VMware Workspace ONE Access.",
        "They must approve a push notification to continue working."
      ];
      explanation.ignoreConsequence = [
        "An intruder with the password will retain unrestricted access to internal portals.",
        "They could download sensitive files without further checks."
      ];
    }

    if (id === 'DEV-8890') {
      explanation.whatHappened = [
        "The device is modifying a large number of files in a very short time.",
        "It is also attempting to delete local backup records."
      ];
      explanation.whyImportant = [
        "Mass file modification and backup deletion are strong warning signs of a system hijacking.",
        "Intruders use this method to lock your documents and demand payment."
      ];
      explanation.recommendation = [
        "We recommend isolating this device from the network immediately."
      ];
      explanation.sureness = "We are highly confident because the combination of file lock actions and backup deletions matches classic attack profiles.";
      explanation.wrongPossibility = [
        "The user might be running a bulk file compression utility or archiving old files.",
        "An administrator might be running a routine local disk utility script."
      ];
      explanation.approveConsequence = [
        "The device is quarantined from the network via Workspace ONE.",
        "The user will be locked out of the network until you manually release the block."
      ];
      explanation.ignoreConsequence = [
        "All files on the device could be encrypted and lost.",
        "The issue might spread to shared folders, locking other colleagues' files."
      ];
    }

    if (id === 'SRV-1022') {
      explanation.whatHappened = [
        "The database server sent an unusually large amount of data (4.5 GB) to an external server.",
        "This external server is not on our approved network list."
      ];
      explanation.whyImportant = [
        "Large data transfers suggest that sensitive databases or files are being copied and stolen.",
        "It could lead to a massive exposure of customer catalog records."
      ];
      explanation.recommendation = [
        "We recommend blocking the recipient external network address immediately."
      ];
      explanation.sureness = "We are moderately confident because outbound traffic of this size from a database server is highly abnormal, though there is a small chance it is planned.";
      explanation.wrongPossibility = [
        "The transfer might be a scheduled database backup run by a colleague who did not register the target server IP.",
        "The server might be executing an authorized migration task."
      ];
      explanation.approveConsequence = [
        "The target IP is blocked immediately at the firewall via Microsoft Intune configuration profiles.",
        "No further traffic can be sent to or from that external address."
      ];
      explanation.ignoreConsequence = [
        "The data copy will finish transferring, exposing confidential records to external parties.",
        "It will be impossible to recover the files once they are sent."
      ];
    }

    return explanation;
  };

  const layman = getLaymanExplanation(id, action);

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Back & Breadcrumb header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen(1)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs font-bold text-slate-500">
          Alert ID: <span className="text-indigo-800 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded font-mono font-extrabold">{id}-REC</span>
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-xl text-brand-red mt-1">
            <ServerCrash className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-brand-red/10 text-brand-red text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-brand-red/20">
                Action Required
              </span>
              <span className="text-xs text-slate-500 font-semibold font-mono">{id}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5 m-0 font-display">Suggested Step: {action}</h2>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-6 bg-slate-200/40 border border-slate-200 px-5 py-2.5 rounded-2xl">
          {/* AI Confidence Dial */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">AI Confidence</p>
              <p className="text-xs font-black text-slate-800 m-0">{confidence >= 80 ? 'Highly Confident' : 'Moderately Confident'}</p>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-brand-cyan flex items-center justify-center font-black text-slate-800 text-xs shadow-sm bg-slate-50 font-mono">
              {confidence}%
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-300"></div>

          {/* Dynamic Trust Score Dial */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Calibrated Trust</p>
              <p className="text-xs font-black text-slate-800 m-0">
                {trustScore >= 85 ? 'Very Strong' : trustScore >= 75 ? 'Healthy' : 'Needs Verification'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full border-2 border-brand-emerald flex items-center justify-center font-black text-slate-800 text-xs shadow-sm bg-slate-50 font-mono">
              {trustScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modals */}
      <DetailModal 
        isOpen={showFactCheck} 
        onClose={() => setShowFactCheck(false)} 
        title={persona === 'stakeholder' ? 'Simplified AI Audit' : 'AI Fact Check'}
      >
        <div className="font-sans text-slate-800">
          <h4 className="text-xl font-black tracking-tight border-b-4 border-slate-800 pb-1 m-0">
            {persona === 'stakeholder' ? 'SIMPLIFIED AI AUDIT' : 'AI FACT CHECK'}
          </h4>
          <p className="text-xs font-bold text-slate-500 border-b border-slate-200 py-1.5 uppercase tracking-wide">
            {persona === 'stakeholder' ? 'Easy explanation of our checks' : 'Standardized transparency reporting'}
          </p>
          
          <div className="flex items-center justify-between border-b border-slate-200 py-2">
            <span className="text-sm font-black uppercase">{persona === 'stakeholder' ? 'AI Confidence Score' : 'How sure we are'}</span>
            <span className="text-sm font-black font-mono text-indigo-700">{confidence}% ({confidence >= 80 ? 'Highly Confident' : 'Moderately Confident'})</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 py-2.5">
            <span className="text-xs font-bold uppercase text-slate-600 font-sans">
              {persona === 'stakeholder' ? 'Evidence Reliability Rating' : 'Reliability of Signs Found'}
            </span>
            <div className="flex items-center space-x-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span 
                  key={i} 
                  className={`h-3 w-3 rounded-full border border-slate-200 ${
                    i < nutritionLabel.evidenceStrength 
                      ? 'bg-brand-emerald shadow-sm' 
                      : 'bg-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-500 ml-1 font-mono">({nutritionLabel.evidenceStrength}/5)</span>
            </div>
          </div>

          <div className="flex flex-col border-b border-slate-200 py-2.5">
            <span className="text-xs font-bold uppercase text-slate-600">{persona === 'stakeholder' ? 'Systems Checked' : 'Information Checked'}</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {nutritionLabel.sources.map((src, i) => (
                <span key={i} className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded">
                  {src}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200 py-2.5">
            <span className="text-xs font-bold uppercase text-slate-600">{persona === 'stakeholder' ? 'Past Records Scanned' : 'Similar Cases Evaluated'}</span>
            <span className="text-xs font-black font-mono text-slate-800">{nutritionLabel.similarCases.toLocaleString()}</span>
          </div>

          <div className="flex flex-col border-b border-slate-200 py-2.5">
            <span className="text-xs font-bold uppercase text-slate-600">System Accuracy Limits</span>
            <span className="text-xs font-semibold text-slate-500 mt-1 italic">
              "We are still learning what normal behavior patterns look like for this specific device."
            </span>
          </div>

          {persona !== 'stakeholder' && (
            <div className="flex items-center justify-between pt-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Analysis Model</span>
              <span>{nutritionLabel.model}</span>
            </div>
          )}
        </div>
      </DetailModal>

      <DetailModal 
        isOpen={showAnalysisDetails} 
        onClose={() => setShowAnalysisDetails(false)} 
        title={persona === 'stakeholder' ? 'Why It Matters (Key Factors)' : 'Analysis Weight Details'}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 font-medium">
              {persona === 'stakeholder' 
                ? 'This simplified chart shows which behaviors had the most influence on the AI recommendation.' 
                : 'These details show what signs had the most impact on our decision score.'}
            </p>
          </div>

          <div className="space-y-3">
            {shapImportance && shapImportance.map((factor, idx) => {
              const isPos = factor.type === 'positive';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700">{getFriendlyFeatureName(factor.feature)}</span>
                    <span className={`font-mono ${isPos ? 'text-brand-red font-bold' : 'text-brand-emerald font-bold'}`}>
                      {isPos ? '+' : ''}{factor.val}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isPos ? 'bg-brand-red/80' : 'bg-brand-emerald/80'
                      }`}
                      style={{ width: `${factor.val}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center space-x-4 border-t border-slate-200 pt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-brand-red/80"></span>
              <span>{persona === 'stakeholder' ? 'Increases Threat Risk' : 'Increases Threat Score'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-brand-emerald/80"></span>
              <span>{persona === 'stakeholder' ? 'Decreases Threat Risk' : 'Decreases Threat Score'}</span>
            </div>
          </div>
        </div>
      </DetailModal>

      {/* Grid panels */}
      <div className="grid grid-cols-1 grid-cols-12 gap-6">
        {/* Left Section: Plain Language Explanation */}
        <div className="col-span-12 flex flex-col h-[calc(100vh-310px)] min-h-[420px]">
          <GlassCard className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileText className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 m-0">
                    {persona === 'stakeholder' ? 'Plain Language Summary for Stakeholders' : 'Recommendation for IT Admins'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    {persona === 'stakeholder' ? 'Written in plain, non-technical language' : 'Written for IT administrators'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => setShowFactCheck(true)}
                  type="button"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-200/60 hover:bg-slate-300/40 border border-slate-350 rounded-xl transition cursor-pointer active:scale-95 font-display"
                >
                  <FileCheck className="h-3.5 w-3.5 text-brand-emerald" />
                  <span>Fact Check</span>
                </button>
                <button
                  onClick={() => setShowAnalysisDetails(true)}
                  type="button"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-200/60 hover:bg-slate-300/40 border border-slate-350 rounded-xl transition cursor-pointer active:scale-95 font-display"
                >
                  <Database className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Details</span>
                </button>
              </div>
            </div>

            {/* Scrollable middle container containing explanations */}
            <div className="flex-1 overflow-y-auto pr-3 space-y-6 my-4">
              {/* 1. What happened? */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600 mr-2 animate-pulse" />
                  1. What happened?
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800 font-semibold leading-relaxed">
                  {layman.whatHappened.map((pt, idx) => <li key={idx}>{pt}</li>)}
                </ul>
              </div>

              {/* 2. Why is it important? */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-brand-red flex items-center uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-red mr-2 animate-pulse" />
                  2. Why is it important?
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800 font-semibold leading-relaxed">
                  {layman.whyImportant.map((pt, idx) => <li key={idx}>{pt}</li>)}
                </ul>
              </div>

              {/* 3. What do we recommend? */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-indigo-600 flex items-center uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mr-2 animate-pulse" />
                  3. What do we recommend?
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-900 font-extrabold leading-relaxed">
                  {layman.recommendation.map((pt, idx) => <li key={idx}>{pt}</li>)}
                </ul>
              </div>

              {/* 4. How sure are we? */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-brand-emerald flex items-center uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald mr-2 animate-pulse" />
                  4. How sure are we?
                </h4>
                <p className="text-sm text-slate-800 font-semibold leading-relaxed pl-3.5 m-0">
                  {layman.sureness}
                </p>
              </div>

              {/* 5. What could make this recommendation wrong? */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-brand-amber flex items-center uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-amber mr-2 animate-pulse" />
                  5. What could make this recommendation wrong?
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800 font-semibold leading-relaxed">
                  {layman.wrongPossibility.map((pt, idx) => <li key={idx}>{pt}</li>)}
                </ul>
              </div>

              {/* 6. What happens if you approve it? */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-brand-emerald flex items-center uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald mr-2 animate-pulse" />
                  6. What happens if you approve it?
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800 font-semibold leading-relaxed">
                  {layman.approveConsequence.map((pt, idx) => <li key={idx}>{pt}</li>)}
                </ul>
              </div>

              {/* 7. What happens if you ignore it? */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-brand-red flex items-center uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-red mr-2 animate-pulse" />
                  7. What happens if you ignore it?
                </h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800 font-semibold leading-relaxed">
                  {layman.ignoreConsequence.map((pt, idx) => <li key={idx}>{pt}</li>)}
                </ul>
              </div>
            </div>

            {/* Footer with Ask TrustLens AI stacked above View Trust Validation */}
            <div className="flex-shrink-0 pt-4 border-t border-slate-200 flex flex-col space-y-2.5 items-end">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                type="button"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-extrabold text-brand-navy bg-brand-cyan hover:opacity-90 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-brand-cyan/25"
                title="Ask TrustLens AI"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-extrabold text-xs ml-2">Ask TrustLens AI</span>
              </button>

              <button
                onClick={() => setCurrentScreen(3)}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-extrabold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>View Trust Validation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Floating Chat Window Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-36 right-8 w-96 h-[550px] max-h-[80vh] z-50 flex flex-col bg-white border border-slate-200 shadow-premium-xl rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-4 py-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-brand-cyan/15 rounded text-brand-cyan border border-brand-cyan/20 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 m-0 leading-tight">Ask TrustLens</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 leading-none">Dialogue Explainability Agent</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  title="Close Chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Score Updated Toast Banner inside Chat Console */}
            <AnimatePresence>
              {showUpdateBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="bg-brand-emerald/10 border border-brand-emerald/30 text-brand-emerald px-4 py-2 mx-4 mt-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm flex-shrink-0 animate-pulse-slow"
                >
                  <div className="flex items-center space-x-2">
                    <span className="bg-brand-emerald text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">
                      Trust Updated
                    </span>
                    <span>Score adjusted: <strong className="font-extrabold text-slate-800">{prevScore}% → {trustScore}%</strong></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Pane */}
            <div ref={chatPaneRef} className="flex-1 overflow-y-auto px-4 space-y-4 py-3 min-h-0 bg-slate-50/30">
              {companionMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-full space-y-3 px-4 py-8">
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400">
                    <Bot className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 m-0">Interactive Trust Companion</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm mt-1">
                      Challenge the quarantine recommendation, ask about database security compliance evidence, or query what could make this false.
                    </p>
                  </div>
                </div>
              ) : (
                companionMessages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isLastAssistant = !isUser && idx === companionMessages.length - 1;
                  
                  return (
                    <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser ? (
                        <div className="flex flex-col w-full max-w-[90%] space-y-1.5">
                          <div className="flex items-center space-x-1.5 pl-1.5">
                            {msg.agentIcon ? (
                              <span className="text-sm mr-0.5">{msg.agentIcon}</span>
                            ) : (
                              <Bot className="h-3.5 w-3.5 text-brand-cyan" />
                            )}
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800">{msg.agentName || "TrustLens AI"}</span>
                          </div>
                          
                          <div className="bg-slate-100 border border-slate-200/80 rounded-2xl rounded-tl-none p-3 text-sm text-slate-800 shadow-sm leading-relaxed relative">
                            <MarkdownText text={msg.content} />
                            
                            {/* Helpfulness feedback widget */}
                            {isLastAssistant && msg.requires_feedback && (
                              <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Was this explanation helpful?</span>
                                <button
                                  onClick={() => { sendFeedback(true); setFeedbackClicked(true); }}
                                  disabled={feedbackClicked}
                                  type="button"
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    feedbackClicked 
                                      ? 'bg-slate-200 text-slate-400 border-slate-300' 
                                      : 'bg-white hover:bg-brand-emerald/10 text-slate-500 hover:text-brand-emerald border-slate-200 hover:border-brand-emerald/30'
                                  }`}
                                  title="Yes, helpful"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => { sendFeedback(false); setFeedbackClicked(true); }}
                                  disabled={feedbackClicked}
                                  type="button"
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    feedbackClicked 
                                      ? 'bg-slate-200 text-slate-400 border-slate-300' 
                                      : 'bg-white hover:bg-brand-red/10 text-slate-500 hover:text-brand-red border-slate-200 hover:border-brand-red/30'
                                  }`}
                                  title="No, unhelpful"
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                </button>
                                {feedbackClicked && (
                                  <motion.span 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-[10px] font-black text-brand-emerald ml-1.5"
                                  >
                                    Feedback saved!
                                  </motion.span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end max-w-[85%] space-y-1">
                          <div className="flex items-center space-x-1 pr-1.5">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">You ({persona === 'stakeholder' ? 'Officer' : persona === 'analyst' ? 'Analyst' : 'Admin'})</span>
                            <User className="h-3 w-3 text-slate-400" />
                          </div>
                          <div className="bg-brand-cyan/20 border border-brand-cyan/30 rounded-2xl rounded-tr-none px-4 py-2 text-sm text-indigo-950 font-bold shadow-sm leading-relaxed">
                            {msg.content}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing loader state */}
              {isCompanionLoading && (
                <div className="flex justify-start">
                  <div className="flex flex-col w-full max-w-[90%] space-y-1.5">
                    <div className="flex items-center space-x-1.5 pl-1.5">
                      <Bot className="h-3.5 w-3.5 text-brand-cyan" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600">TrustLens AI</span>
                      <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider animate-pulse">
                        Computing...
                      </span>
                    </div>
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 w-[60%] flex space-x-1.5 items-center justify-start">
                      <span className="h-2 w-2 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-white">
              <form onSubmit={handleSend} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isCompanionLoading}
                  placeholder="Ask a question..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-350 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan text-xs font-semibold placeholder:text-slate-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isCompanionLoading || !inputValue.trim()}
                  className="p-3 rounded-xl bg-brand-cyan hover:opacity-90 text-brand-navy font-bold shadow-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnalysisScreen;
