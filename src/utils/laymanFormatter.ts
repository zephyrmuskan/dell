export function safeParseJSON(str: string): any {
  if (!str) return null;
  if (typeof str === 'object') return str;

  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === 'string') {
      return safeParseJSON(parsed);
    }
    return parsed;
  } catch {
    // Try to extract JSON from markdown code block if present
    const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export function formatInputLayman(agentName: string, inputStr: string): string {
  if (!inputStr) return "No input data received.";
  
  // Try parsing to see if it's JSON
  const data = safeParseJSON(inputStr);

  switch (agentName) {
    case "Detection Agent": {
      // e.g., Telemetry raw logs: ["Security Logs", "Telemetry"]
      let sources = "";
      if (data && Array.isArray(data)) {
        sources = data.join(", ");
      } else if (typeof data === 'object' && data !== null) {
        sources = JSON.stringify(data);
      } else {
        // Try regex extract from raw string e.g. ["Security Logs", "Telemetry"]
        const arrayMatch = inputStr.match(/\[([\s\S]*?)\]/);
        if (arrayMatch && arrayMatch[1]) {
          sources = arrayMatch[1].replace(/["']/g, '').trim();
        } else {
          sources = inputStr.replace(/Telemetry raw logs:\s*/i, '').trim();
        }
      }
      return `We analyzed the system's active logs and network signals from: [${sources || "System Telemetry"}]. We are looking for any behavior that deviates from standard routine operation.`;
    }

    case "Risk Assessment Agent": {
      if (data && typeof data === 'object') {
        const cls = data.classification || "Suspicious";
        const conf = data.confidence ? `${data.confidence}%` : "estimated";
        return `We reviewed the initial findings from the Detection Agent, which flagged a ${cls} security event with ${conf} confidence. We are evaluating how this event impacts business continuity and the urgency of a response.`;
      }
      return `We reviewed the initial suspicious activity flagged by the Detection Agent. We are evaluating the severity and operational impact of this event.`;
    }

    case "Remediation Agent": {
      if (data && typeof data === 'object') {
        const risk = data.risk_level || "Critical";
        const score = data.risk_score ? `score ${data.risk_score}%` : "high score";
        const impact = data.business_impact || "potential system impact";
        return `We analyzed the Risk Evaluator's summary (${risk} risk level, risk ${score}, and ${impact}). We are now mapping this signature to our library of approved security actions to find the best defense.`;
      }
      return `We analyzed the risk assessment details. We are matching the risk footprint to our library of approved security actions to find the best defense.`;
    }

    case "Devil's Advocate Agent": {
      if (data && typeof data === 'object') {
        const action = data.recommendation || "quarantine";
        const conf = data.confidence ? `confidence of ${data.confidence}%` : "high confidence";
        return `We took the Remediation Agent's recommendation to "${action}" (${conf}). We are systematically challenging this decision to rule out false alarms, testing for normal system actions like software updates or backups.`;
      }
      return `We took the proposed remediation recommendation. We are systematically challenging this decision to rule out false alarms and identify legitimate background tasks.`;
    }

    case "Trust Time Machine Agent": {
      return `We checked the database of past events to find historical security incidents that look similar to this device's current situation.`;
    }

    case "Incident Report Agent": {
      if (data && typeof data === 'object') {
        const action = data.recommendation || "containment action";
        return `We gathered the proposed resolution plan ("${action}") and the surrounding telemetry logs. We are compiling these into an official incident ticket and easy-to-read documentation card.`;
      }
      return `We gathered the threat indicators and proposed remediation. We are compiling these into an official incident ticket and compliance record.`;
    }

    case "Orchestrator Agent": {
      return `We gathered the decisions, severity details, false-positive doubts, and historical accuracy records from all preceding steps. We will run a weighted consensus algorithm to calibrate the final trust score.`;
    }

    case "Trust Companion Agent": {
      if (data && typeof data === 'object') {
        const action = data.final_recommendation || "containment";
        const trust = data.trust_score ? `trust score of ${data.trust_score}%` : "calibrated trust";
        return `We loaded the final decision ("${action}" with a ${trust}). We are initiating the interactive chat assistant to explain this decision to you and answer any questions in plain terms.`;
      }
      return `We loaded the finalized decision and trust weights. We are initiating the interactive companion to explain the reasoning and answer any questions in plain terms.`;
    }

    default:
      return inputStr;
  }
}

export function formatOutputLayman(agentName: string, outputStr: string): string {
  if (!outputStr) return "Analysis pending...";
  
  const data = safeParseJSON(outputStr);

  switch (agentName) {
    case "Detection Agent": {
      if (data && typeof data === 'object') {
        const cls = data.classification || "Suspicious";
        const conf = data.confidence || 92;
        const indicators = Array.isArray(data.indicators) ? data.indicators : [];
        const indList = indicators.map((i: string) => `- ${i}`).join("\n");
        return `• Threat Classification: **${cls}**\n• Confidence Level: **${conf}%**\n\n**Detected Indicators:**\n${indList || "- Abnormal system telemetry patterns."}`;
      }
      return outputStr;
    }

    case "Risk Assessment Agent": {
      if (data && typeof data === 'object') {
        const level = data.risk_level || "Critical";
        const score = data.risk_score || 92;
        const impact = data.business_impact || "Potential threat escalation";
        return `• Assessed Severity: **${level}**\n• Severity Score: **${score}%**\n• Estimated Business Impact: **${impact}**`;
      }
      return outputStr;
    }

    case "Remediation Agent": {
      if (data && typeof data === 'object') {
        const action = data.recommendation || "Monitor Device";
        const conf = data.confidence || 87;
        return `• Recommended Action: **${action}**\n• Policy Match Confidence: **${conf}%**`;
      }
      return outputStr;
    }

    case "Devil's Advocate Agent": {
      if (data && typeof data === 'object') {
        const alt = data.alternative_action || "Monitor Device";
        const points = Array.isArray(data.counterpoints) ? data.counterpoints : [];
        const ptList = points.map((p: string) => `- ${p}`).join("\n");
        return `• Suggested Alternative Action: **${alt}**\n\n**Challenging Counterpoints:**\n${ptList || "- Background software update activity matches behavior.\n- Antivirus has already handled this signature."}`;
      }
      return outputStr;
    }

    case "Trust Time Machine Agent": {
      if (data && typeof data === 'object') {
        const cases = data.similar_cases || 0;
        const correct = data.correct || 0;
        const fp = data.false_positive || 0;
        const acc = data.historical_accuracy || 83;
        return `• Similar Historical Incidents: **${cases} cases**\n• Correct Alerts (True Positives): **${correct}**\n• False Alarms (False Positives): **${fp}**\n• Past Decision Accuracy Rate: **${acc}%**`;
      }
      return outputStr;
    }

    case "Incident Report Agent": {
      if (data && typeof data === 'object') {
        const summary = data.summary || "No summary provided.";
        const rc = data.root_cause || "Pending root-cause analysis.";
        const sf = data.failed_safeguard || "No failed safeguards detected.";
        return `• Summary: **${summary}**\n• Root Cause: **${rc}**\n• Failed Control/Safeguard: **${sf}**`;
      }
      return outputStr;
    }

    case "Orchestrator Agent": {
      if (data && typeof data === 'object') {
        const finalAct = data.final_recommendation || "Monitor Device";
        const trust = data.trust_score || 78;
        return `• Consensus Decision: **${finalAct}**\n• Calibrated Trust Score: **${trust}%**\n\n*The Orchestrator combined AI confidence, historical logs, and user understanding to deliver this decision.*`;
      }
      return outputStr;
    }

    case "Trust Companion Agent": {
      if (data && typeof data === 'object') {
        const answer = data.answer || "Ready to assist.";
        return `• Assistant Status: **Active & Ready**\n• Dialogue Output: **${answer}**\n\n*Feel free to query the chatbot on the left for details on logs, risks, or options.*`;
      }
      return outputStr;
    }

    default:
      return outputStr;
  }
}

export function formatSummaryLayman(agentName: string, outputStr: string): string {
  if (!outputStr) return "Awaiting agent execution...";
  
  const data = safeParseJSON(outputStr);
  if (!data) return outputStr;

  switch (agentName) {
    case "Detection Agent": {
      const cls = data.classification || "Suspicious";
      const count = Array.isArray(data.indicators) ? data.indicators.length : 0;
      return `Threat: ${cls} (Detected ${count} anomalous indicators)`;
    }

    case "Risk Assessment Agent": {
      const level = data.risk_level || "Medium";
      const impact = data.business_impact || "Normal operations";
      return `Risk: ${level} | Impact: ${impact}`;
    }

    case "Remediation Agent": {
      const rec = data.recommendation || "Monitor Device";
      const conf = data.confidence || 80;
      return `Recommended Action: ${rec} (Confidence: ${conf}%)`;
    }

    case "Devil's Advocate Agent": {
      const alt = data.alternative_action || "Monitor Device";
      const count = Array.isArray(data.counterpoints) ? data.counterpoints.length : 0;
      return `Alternative: ${alt} (Flagged ${count} challenges)`;
    }

    case "Trust Time Machine Agent": {
      const cases = data.similar_cases || 0;
      const acc = data.historical_accuracy || 80;
      return `History: Found ${cases} past incidents (Historical Accuracy: ${acc}%)`;
    }

    case "Incident Report Agent": {
      const rc = data.root_cause || "Checked";
      return `Root Cause: ${rc}`;
    }

    case "Orchestrator Agent": {
      const rec = data.final_recommendation || "Monitor Device";
      const trust = data.trust_score || 78;
      return `Consensus: ${rec} (Trust Score: ${trust}%)`;
    }

    case "Trust Companion Agent": {
      return `Interactive chatbot interface is open and ready to assist.`;
    }

    default:
      return outputStr;
  }
}
