import React from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { GlassCard } from '../components/GlassCard';
import { 
  ArrowLeft, 
  ArrowRight, 
  HelpCircle, 
  FileText,
  FileCheck,
  ServerCrash
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LaymanExplanation {
  whatHappened: string[];
  whyImportant: string[];
  recommendation: string[];
  sureness: string;
  wrongPossibility: string[];
  approveConsequence: string[];
  ignoreConsequence: string[];
}

export const AnalysisScreen: React.FC = () => {
  const { activeRec, setCurrentScreen } = useWorkflow();
  const { id, action, confidence, nutritionLabel, shapImportance } = activeRec;

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
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs font-bold text-slate-400">
          Alert ID: <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono font-extrabold">{id}-REC</span>
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-xl text-brand-red mt-1">
            <ServerCrash className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-brand-red/10 text-brand-red text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-brand-red/20">
                Action Required
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">{id}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5 m-0">Suggested Step: {action}</h2>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
          <div className="text-right">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">How sure we are</p>
            <p className="text-sm font-black text-slate-800 m-0">{confidence >= 80 ? 'Highly Confident' : 'Moderately Confident'}</p>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-brand-blue flex items-center justify-center font-black text-slate-900 text-xs shadow-glow-blue bg-white">
            {confidence}%
          </div>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Plain Language Explanation */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <GlassCard className="p-6 border-slate-200 bg-white shadow-sm space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-4">
              <FileText className="h-5 w-5 text-brand-blue" />
              <div>
                <h3 className="text-base font-bold text-slate-900 m-0">Recommendation for IT Admins</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Written for IT administrators</p>
              </div>
            </div>

            {/* 1. What happened? */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-2" />
                1. What happened?
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 font-semibold">
                {layman.whatHappened.map((pt, idx) => <li key={idx}>{pt}</li>)}
              </ul>
            </div>

            {/* 2. Why is it important? */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-brand-red flex items-center uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red mr-2" />
                2. Why is it important?
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 font-semibold">
                {layman.whyImportant.map((pt, idx) => <li key={idx}>{pt}</li>)}
              </ul>
            </div>

            {/* 3. What do we recommend? */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-brand-blue flex items-center uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-blue mr-2" />
                3. What do we recommend?
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-900 font-bold">
                {layman.recommendation.map((pt, idx) => <li key={idx}>{pt}</li>)}
              </ul>
            </div>

            {/* 4. How sure are we? */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-brand-emerald flex items-center uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald mr-2" />
                4. How sure are we?
              </h4>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed pl-3.5 m-0">
                {layman.sureness}
              </p>
            </div>

            {/* 5. What could make this recommendation wrong? */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-brand-amber flex items-center uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-amber mr-2" />
                5. What could make this recommendation wrong?
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 font-semibold">
                {layman.wrongPossibility.map((pt, idx) => <li key={idx}>{pt}</li>)}
              </ul>
            </div>

            {/* 6. What happens if you approve it? */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald mr-2" />
                6. What happens if you approve it?
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 font-semibold">
                {layman.approveConsequence.map((pt, idx) => <li key={idx}>{pt}</li>)}
              </ul>
            </div>

            {/* 7. What happens if you ignore it? */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red mr-2" />
                7. What happens if you ignore it?
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 font-semibold">
                {layman.ignoreConsequence.map((pt, idx) => <li key={idx}>{pt}</li>)}
              </ul>
            </div>
          </GlassCard>

          {/* MDM Command Dispatch Payload */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-brand-blue/10 rounded-lg text-brand-blue border border-brand-blue/20">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 m-0">MDM Gateway Action Payload</h3>
            </div>

            {(() => {
              const isIntune = !(id.startsWith('DEV') || id.startsWith('USR') || id.startsWith('EKS'));
              const payload = isIntune
                ? action.toLowerCase().includes('quarantine')
                  ? {
                      gateway: 'Microsoft Intune',
                      method: 'POST',
                      url: `https://graph.microsoft.com/v1.0/deviceManagement/managedDevices('${id}')/retire`,
                      body: { keepEnrollmentData: false, wipeDevice: false }
                    }
                  : action.toLowerCase().includes('patch')
                  ? {
                      gateway: 'Microsoft Intune',
                      method: 'POST',
                      url: `https://graph.microsoft.com/v1.0/deviceManagement/deviceCompliancePolicies('${id}')/assign`,
                      body: { targetGroup: "Update-Ring-Win11-Critical", forceReboot: true }
                    }
                  : {
                      gateway: 'Microsoft Intune',
                      method: 'PATCH',
                      url: `https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies('CAP-088-ENFORCE-MFA')`,
                      body: { state: "enabled", targetUsers: [id] }
                    }
                : action.toLowerCase().includes('quarantine')
                ? {
                    gateway: 'VMware Workspace ONE UEM',
                    method: 'POST',
                    url: `https://as711.awmdm.com/API/mdm/devices/${id}/commands?command=quarantine`,
                    body: { CustomMessage: "Quarantined due to anomalous behavior telemetry." }
                  }
                : action.toLowerCase().includes('patch')
                ? {
                    gateway: 'VMware Workspace ONE UEM',
                    method: 'POST',
                    url: `https://as711.awmdm.com/API/mdm/smartgroups/SG-DB-SERVERS-PATCH/install`,
                    body: { PatchId: 10482, Schedule: "Immediate" }
                  }
                : {
                    gateway: 'VMware Workspace ONE Access',
                    method: 'POST',
                    url: `https://access.workspaceone.com/API/v1/users/${id}/mfaChallenge`,
                    body: { triggerType: "StepUpAuthentication", provider: "DUO_MFA" }
                  };

              return (
                <GlassCard className="p-5 bg-slate-900 border-slate-950 text-slate-100 font-mono text-xs rounded-xl space-y-3 relative overflow-hidden select-text">
                  <div className="absolute top-0 right-0 bg-slate-800 text-slate-400 px-3 py-1 rounded-bl-lg font-sans text-[9px] font-black uppercase tracking-wider">
                    {payload.gateway} API Request
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Request Endpoint</span>
                    <div className="flex items-center space-x-2 text-slate-200">
                      <span className="font-extrabold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-900/60 text-[10px]">
                        {payload.method}
                      </span>
                      <span className="break-all font-semibold select-all">{payload.url}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">JSON Body Payload</span>
                    <pre className="text-[11px] text-emerald-400 select-all p-3 bg-slate-950 rounded-lg overflow-x-auto leading-relaxed border border-slate-800/80">
                      {JSON.stringify(payload.body, null, 2)}
                    </pre>
                  </div>
                </GlassCard>
              );
            })()}
          </div>
        </div>

        {/* Right Section: AI Facts & Attribution */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-slate-500" />
            <div className="flex items-center space-x-1">
              <h3 className="text-base font-bold text-slate-800 m-0">AI Verification Details</h3>
              <span title="Provides standardized facts regarding analysis models, data sources, and limits.">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors" />
              </span>
            </div>
          </div>

          {/* FDA Styled Nutrition Label */}
          <div className="bg-white border-2 border-slate-900 rounded-xl p-6 shadow-sm relative font-sans text-slate-900">
            {/* Header */}
            <h4 className="text-xl font-black tracking-tight border-b-4 border-slate-900 pb-1 m-0">AI FACT CHECK</h4>
            <p className="text-[10px] font-bold text-slate-500 border-b border-slate-900 py-1.5 uppercase tracking-wide">Standardized transparency reporting</p>
            
            {/* Confidence & Strength */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 py-2">
              <span className="text-sm font-black uppercase">How sure we are</span>
              <span className="text-sm font-black">{confidence}% ({confidence >= 80 ? 'Highly Confident' : 'Moderately Confident'})</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-900 py-2.5">
              <span className="text-xs font-bold uppercase text-slate-600 font-sans">Reliability of Signs Found</span>
              <div className="flex items-center space-x-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span 
                    key={i} 
                    className={`h-3 w-3 rounded-full border border-slate-900/10 ${
                      i < nutritionLabel.evidenceStrength 
                        ? 'bg-brand-emerald shadow-glow-emerald' 
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-500 ml-1">({nutritionLabel.evidenceStrength}/5)</span>
              </div>
            </div>

            {/* Data Sources */}
            <div className="flex flex-col border-b border-slate-900 py-2.5">
              <span className="text-xs font-bold uppercase text-slate-600">Information Checked</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {nutritionLabel.sources.map((src, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    {src}
                  </span>
                ))}
              </div>
            </div>

            {/* Other stats */}
            <div className="flex items-center justify-between border-b border-slate-900 py-2.5">
              <span className="text-xs font-bold uppercase text-slate-600">Similar Cases Evaluated</span>
              <span className="text-xs font-black">{nutritionLabel.similarCases.toLocaleString()}</span>
            </div>

            <div className="flex flex-col border-b border-slate-900 py-2.5">
              <span className="text-xs font-bold uppercase text-slate-600">System Limitations</span>
              <span className="text-xs font-semibold text-slate-800 mt-1 italic">
                "We are still learning what normal behavior patterns look like for this specific device."
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Analysis Model</span>
              <span>{nutritionLabel.model}</span>
            </div>
          </div>

          {/* SHAP Feature Importance Card */}
          <GlassCard className="p-5 border-slate-200 bg-white shadow-sm mt-4 space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider m-0">Analysis Weight Details</h4>
                <span className="text-[9px] font-semibold text-slate-400">Impact level</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-1">These details show what signs had the most impact on our decision score.</p>
            </div>

            <div className="space-y-3">
              {shapImportance && shapImportance.map((factor, idx) => {
                const isPos = factor.type === 'positive';
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span className="text-slate-700">{getFriendlyFeatureName(factor.feature)}</span>
                      <span className={isPos ? 'text-brand-red font-bold' : 'text-brand-emerald font-bold'}>
                        {isPos ? '+' : ''}{factor.val}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
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

            <div className="flex items-center justify-center space-x-4 border-t border-slate-100 pt-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-brand-red/80"></span>
                <span>Increases Threat Score</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-brand-emerald/80"></span>
                <span>Decreases Threat Score</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Button footer */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => setCurrentScreen(3)}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-extrabold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-glow-blue hover:shadow-premium-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>View Trust Validation</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default AnalysisScreen;
