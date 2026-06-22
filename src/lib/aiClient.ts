/* eslint-disable @typescript-eslint/no-explicit-any, preserve-caught-error */
/**
 * AI Client — calls Gemini and Groq directly via their REST APIs.
 * Tries Electron IPC first, then direct Google AI / Groq REST APIs, then backend as last resort.
 */

declare const process: any;

const BACKEND = "http://127.0.0.1:8000"; // Calibrated to local FastAPI port
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

// API keys loaded via environment variables for direct browser calls
export const GEMINI_API_KEY = (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) || (import.meta.env?.VITE_GEMINI_API_KEY as string) || "YOUR_GEMINI_API_KEY_HERE";
export const GROQ_API_KEY = (typeof process !== "undefined" && process.env?.GROQ_API_KEY) || (import.meta.env?.VITE_GROQ_API_KEY as string) || "YOUR_GROQ_API_KEY_HERE";

let _backendGeminiModel = DEFAULT_GEMINI_MODEL;
let _backendGroqModel = DEFAULT_GROQ_MODEL;

export function setGeminiModel(m: string) { _backendGeminiModel = m || DEFAULT_GEMINI_MODEL; }
export function setGroqModel(m: string) { _backendGroqModel = m || DEFAULT_GROQ_MODEL; }

// ─── Direct REST call to Gemini API ──────────────────────────────────────────
async function geminiDirect(prompt: string, model?: string): Promise<string> {
  if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE" || !GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Set GEMINI_API_KEY in .env.");
  }
  const apiModel = model && model.startsWith("gemini") ? model : "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── Direct REST call to Groq API ────────────────────────────────────────────
async function groqDirect(prompt: string, model?: string): Promise<string> {
  if (GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE" || !GROQ_API_KEY) {
    throw new Error("Groq API key not configured. Set GROQ_API_KEY in .env.");
  }
  const apiModel = model || DEFAULT_GROQ_MODEL;
  const url = `https://api.groq.com/openai/v1/chat/completions`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: apiModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq API ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── Core Calls ──────────────────────────────────────────────────────────────

export async function geminiChat(prompt: string, { model, onChunk }: { model?: string, onChunk?: (text: string) => void } = {}): Promise<string> {
  const useModel = model || _backendGeminiModel;

  // 1. Electron IPC check
  if ((window as any).taskPilotDesktop?.geminiChat) {
    const result = await (window as any).taskPilotDesktop.geminiChat(prompt, useModel);
    if (!result.success) throw new Error(result.error);
    if (onChunk) onChunk(result.text);
    return result.text;
  }

  // 2. Direct REST API call
  try {
    const text = await geminiDirect(prompt, useModel);
    if (onChunk) onChunk(text);
    return text;
  } catch (directErr) {
    // 3. Fallback: try local backend
    try {
      const resp = await fetch(`${BACKEND}/api/taskpilot/gemini-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: useModel })
      });
      if (!resp.ok) throw new Error(`backend ${resp.status}`);
      const data = await resp.json();
      if (onChunk) onChunk(data.text);
      return data.text;
    } catch {
      throw directErr; // Surface original direct API error
    }
  }
}

export async function groqChat(prompt: string, { model, onChunk }: { model?: string, onChunk?: (text: string) => void } = {}): Promise<string> {
  const useModel = model || _backendGroqModel;

  // 1. Electron IPC check
  if ((window as any).taskPilotDesktop?.groqChat) {
    const result = await (window as any).taskPilotDesktop.groqChat(prompt, useModel);
    if (!result.success) throw new Error(result.error);
    if (onChunk) onChunk(result.text);
    return result.text;
  }

  // 2. Direct REST API call
  try {
    const text = await groqDirect(prompt, useModel);
    if (onChunk) onChunk(text);
    return text;
  } catch (directErr) {
    // 3. Fallback: try local backend
    try {
      const resp = await fetch(`${BACKEND}/api/taskpilot/groq-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: useModel })
      });
      if (!resp.ok) throw new Error(`backend ${resp.status}`);
      const data = await resp.json();
      if (onChunk) onChunk(data.text);
      return data.text;
    } catch {
      throw directErr; // Surface original direct API error
    }
  }
}

// ─── Robust JSON Extractor ───────────────────────────────────────────────────
function extractJSON(raw: string): any {
  if (!raw) return null;
  // Strip markdown code fences
  const text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Try direct parse first
  try { return JSON.parse(text); } catch { /* ignore parsing failure and fall back */ }
  // Find the first [ or { and try to extract from there
  const arrStart = text.indexOf("[");
  const objStart = text.indexOf("{");
  // Pick whichever comes first
  const starts = [arrStart, objStart].filter(i => i !== -1);
  if (starts.length === 0) return null;
  const start = Math.min(...starts);
  const openChar = text[start];
  const closeChar = openChar === "[" ? "]" : "}";
  // Walk forward counting brackets to find the matching close
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === openChar) depth++;
    else if (text[i] === closeChar) { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

// ─── Specialized Gemini Helpers ──────────────────────────────────────────────

export async function geminiPrioritizeTasks(tasks: any[]): Promise<any[]> {
  const prompt = `You are TaskPilot AI — an agentic task prioritisation assistant.

Given the JSON array of engineering tasks below, rank them from highest to lowest priority.
For each task add TWO fields:
  "score": integer 0–100
  "rankReasons": array of 3 short strings explaining the score

Use these factors: severity (P1>P2>P3>P4), deadline urgency, business impact, dependency risk.
Return ONLY a valid JSON array. No markdown, no explanation outside JSON.

Tasks:
${JSON.stringify(tasks, null, 2)}`;

  const raw = await geminiChat(prompt, { model: "gemini-2.5-flash" });
  const result = extractJSON(raw);
  if (Array.isArray(result)) return result;
  console.warn("[TaskPilot] Gemini prioritisation: could not extract JSON, using local scores");
  return tasks;
}

export async function geminiExtractActions(text: string, source = "email"): Promise<any[]> {
  const prompt = `You are TaskPilot AI. Extract every actionable task from this ${source}.

Return a JSON array where each item has:
  "title": concise task title (max 80 chars)
  "description": one sentence detail
  "assignee": person mentioned, or ""
  "deadline": ISO date if mentioned, or null
  "severity": "P1"|"P2"|"P3"|"P4" — infer from urgency language
  "impact": integer 1–10

Return ONLY valid JSON. No markdown.

Text:
${text}`;

  const raw = await geminiChat(prompt, { model: "gemini-2.5-flash" });
  return extractJSON(raw) || [];
}

export async function geminiDailyPlan(tasks: any[], engineerName: string, calendarBlocks: any[] = []): Promise<string> {
  const top = tasks.slice(0, 8);
  const meetings = calendarBlocks.map(b => `${b.start}–${b.end}: ${b.title}`).join(", ");
  const prompt = `You are TaskPilot AI. Generate a structured, actionable daily plan for ${engineerName}.

Today's calendar blocks: ${meetings || "none"}

Top prioritised tasks (in order):
${top.map((t, i) => `${i + 1}. [${t.severity || "P2"}] ${t.canonicalTitle || t.title} — score ${t.score || "?"} — due ${t.due || "?"}`).join("\n")}

Write a clear markdown daily plan with:
- A one-sentence motivating opener
- ### Top 3 Priorities (with 1-line rationale each)
- ### Time-Blocked Schedule (fit around calendar blocks)
- ### Watch List (next 3 tasks)
- ### End-of-Day Goal

Be concise, direct, and actionable. Use real task names.`;

  return geminiChat(prompt, { model: "gemini-2.5-flash" });
}

export async function geminiSummariseEmail(emailBody: string, subject = ""): Promise<string> {
  const prompt = `You are TaskPilot AI. Summarise this email for a software engineer.

Subject: ${subject}
Body:
${emailBody}

Return markdown with:
- **TL;DR** (one sentence)
- **Key Points** (bullet list)
- **Action Items** (bullet list, each starting with ✅)
- **Urgency**: Critical / High / Medium / Low`;

  return geminiChat(prompt, { model: "gemini-2.5-flash" });
}

export async function geminiAnalyseMeeting(notes: string, meetingTitle = ""): Promise<any> {
  const prompt = `You are TaskPilot AI. Analyse these meeting notes for "${meetingTitle}".

Notes:
${notes}

Return a JSON object with:
  "summary": string (2–3 sentences)
  "decisions": string[] (key decisions made)
  "actionItems": [{ "title", "assignee", "deadline", "severity" }]
  "followUpMeetings": [{ "title", "suggestedDate", "attendees": [], "agenda": string }]
  "risks": string[]
  "shouldwork": {
    "recommendAttend": boolean (whether the engineer should attend),
    "score": integer 0-100 (importance/urgency score),
    "reasoning": string (detailed reasoning for attending or skipping)
  },
  "transcript": [
    { "speaker": string, "text": string }
  ] (simulated dialogue of the meeting discussion in dialogue format, containing 4 to 6 statements matching the topic)

Return ONLY valid JSON.`;

  const raw = await geminiChat(prompt, { model: "gemini-2.5-flash" });
  const result = extractJSON(raw);
  if (result && typeof result === "object" && result.summary) return result;
  return {
    summary: "Could not parse meeting analysis.",
    decisions: [],
    actionItems: [],
    followUpMeetings: [],
    risks: [],
    shouldwork: {
      recommendAttend: true,
      score: 80,
      reasoning: "Failed to parse AI model response. Defaulting to recommended attendance."
    },
    transcript: [
      { speaker: "Facilitator", text: "Welcome everyone, let's go over our current checklist." },
      { speaker: "Engineer", text: "I am working on the items from our sprint backlog." },
      { speaker: "Manager", text: "Great, let's sync up and make sure we balance the loads." }
    ]
  };
}

export async function geminiAnswerQuery(question: string, state: any): Promise<string> {
  const top5 = state.prioritized.slice(0, 5).map((t: any, i: number) =>
    `${i + 1}. [${t.severity}] ${t.canonicalTitle} — score ${t.score} — due ${t.due}`
  ).join("\n");

  const prompt = `You are TaskPilot AI — an intelligent, proactive engineering assistant.

Current state:
- Total tasks: ${state.prioritized.length}
- Completed today: ${state.completedCount}
- Top 5 tasks:\n${top5}
- Active alerts: ${state.alerts.length}

Engineer's question: "${question}"

Answer concisely (2–4 sentences max). Be specific, data-driven, and actionable.
Reference real task names and scores when relevant.`;

  return geminiChat(prompt, { model: "gemini-2.5-flash" });
}

export async function geminiAgentRun(intent: string, context: any, onStep?: (text: string) => void): Promise<string> {
  const prompt = `You are TaskPilot AI — an autonomous agentic assistant.

Current context:
- Active task: ${context.activeTask}
- Total queue: ${context.queueSize} tasks
- Sources connected: ${context.sources}
- Profile: ${context.profile}

The engineer just asked: "${intent}"

Act like a real AI agent: reason step-by-step, check priorities, surface hidden risks, and give a concrete recommendation.
Format your response as:

🔍 **Scanning...** (what you checked)
🧠 **Reasoning...** (your analysis)  
⚡ **Recommendation:** (specific, actionable next step)
📊 **Confidence:** X% (your confidence in this recommendation)

Be specific, reference real data, and act proactively.`;

  return geminiChat(prompt, { model: "gemini-2.5-flash", onChunk: onStep });
}

export async function geminiWeeklyStandup(tasks: any[], completedIds: string[], engineerName: string): Promise<string> {
  const completed = tasks.filter(t => completedIds.includes(t.id));
  const pending = tasks.filter(t => !completedIds.includes(t.id));

  const prompt = `You are TaskPilot AI. Generate a standup-ready weekly summary for ${engineerName}.

Completed this week (${completed.length}):
${completed.map(t => `- ${t.canonicalTitle || t.title}`).join("\n") || "None"}

Still pending (${pending.slice(0, 5).length}):
${pending.slice(0, 5).map(t => `- [${t.severity}] ${t.canonicalTitle || t.title} (score: ${t.score})`).join("\n")}

Write a 3-paragraph weekly summary:
1. Accomplishments (what was done)
2. In-progress and blockers
3. Next week priorities and risks

Keep it professional and suitable for a manager standup report.`;

  return geminiChat(prompt, { model: "gemini-2.5-flash" });
}

export async function geminiMeetingPrioritizer(meetings: any[], calendarBlocks: any[]): Promise<any[]> {
  const prompt = `You are TaskPilot AI. Analyse these pending meetings and upcoming calendar blocks.

Pending meetings to schedule:
${JSON.stringify(meetings, null, 2)}

Existing calendar blocks:
${JSON.stringify(calendarBlocks, null, 2)}

Return a JSON array of recommended meeting schedules:
[{
  "meetingTitle": string,
  "priority": "Critical"|"High"|"Medium"|"Low",
  "priorityScore": integer 0-100,
  "suggestedTime": ISO datetime string,
  "duration": minutes as integer,
  "reasoning": string,
  "attendees": string[],
  "agenda": string,
  "isConflict": boolean,
  "conflictsWith": string or null
}]

Return ONLY valid JSON.`;

  const raw = await geminiChat(prompt, { model: "gemini-2.5-flash" });
  return extractJSON(raw) || [];
}

// ─── Specialized Groq Helpers ───────────────────────────────────────────────

export async function groqPrioritizeTasks(tasks: any[]): Promise<any[]> {
  const prompt = `You are TaskPilot AI — an agentic task prioritisation assistant.

Given the JSON array of engineering tasks below, rank them from highest to lowest priority.
For each task add TWO fields:
  "score": integer 0–100
  "rankReasons": array of 3 short strings explaining the score

Use these factors: severity (P1>P2>P3>P4), deadline urgency, business impact, dependency risk.
Return ONLY a valid JSON array. No markdown, no explanation outside JSON.

Tasks:
${JSON.stringify(tasks, null, 2)}`;

  const raw = await groqChat(prompt, { model: DEFAULT_GROQ_MODEL });
  const result = extractJSON(raw);
  if (Array.isArray(result)) return result;
  console.warn("[TaskPilot] Groq prioritisation: could not extract JSON, using local scores");
  return tasks;
}

export async function groqExtractActions(text: string, source = "email"): Promise<any[]> {
  const prompt = `You are TaskPilot AI. Extract every actionable task from this ${source}.

Return a JSON array where each item has:
  "title": concise task title (max 80 chars)
  "description": one sentence detail
  "assignee": person mentioned, or ""
  "deadline": ISO date if mentioned, or null
  "severity": "P1"|"P2"|"P3"|"P4" — infer from urgency language
  "impact": integer 1–10

Return ONLY valid JSON. No markdown.

Text:
${text}`;

  const raw = await groqChat(prompt, { model: DEFAULT_GROQ_MODEL });
  return extractJSON(raw) || [];
}

export async function groqDailyPlan(tasks: any[], engineerName: string, calendarBlocks: any[] = []): Promise<string> {
  const top = tasks.slice(0, 8);
  const meetings = calendarBlocks.map(b => `${b.start}–${b.end}: ${b.title}`).join(", ");
  const prompt = `You are TaskPilot AI. Generate a structured, actionable daily plan for ${engineerName}.

Today's calendar blocks: ${meetings || "none"}

Top prioritised tasks (in order):
${top.map((t, i) => `${i + 1}. [${t.severity || "P2"}] ${t.canonicalTitle || t.title} — score ${t.score || "?"} — due ${t.due || "?"}`).join("\n")}

Write a clear markdown daily plan with:
- A one-sentence motivating opener
- ### Top 3 Priorities (with 1-line rationale each)
- ### Time-Blocked Schedule (fit around calendar blocks)
- ### Watch List (next 3 tasks)
- ### End-of-Day Goal

Be concise, direct, and actionable. Use real task names.`;

  return groqChat(prompt, { model: DEFAULT_GROQ_MODEL });
}

export async function groqSummariseEmail(emailBody: string, subject = ""): Promise<string> {
  const prompt = `You are TaskPilot AI. Summarise this email for a software engineer.

Subject: ${subject}
Body:
${emailBody}

Return markdown with:
- **TL;DR** (one sentence)
- **Key Points** (bullet list)
- **Action Items** (bullet list, each starting with ✅)
- **Urgency**: Critical / High / Medium / Low`;

  return groqChat(prompt, { model: DEFAULT_GROQ_MODEL });
}

export async function groqAnalyseMeeting(notes: string, meetingTitle = ""): Promise<any> {
  const prompt = `You are TaskPilot AI. Analyse these meeting notes for "${meetingTitle}".

Notes:
${notes}

Return a JSON object with:
  "summary": string (2–3 sentences)
  "decisions": string[] (key decisions made)
  "actionItems": [{ "title", "assignee", "deadline", "severity" }]
  "followUpMeetings": [{ "title", "suggestedDate", "attendees": [], "agenda": string }]
  "risks": string[]
  "shouldwork": {
    "recommendAttend": boolean (whether the engineer should attend),
    "score": integer 0-100 (importance/urgency score),
    "reasoning": string (detailed reasoning for attending or skipping)
  },
  "transcript": [
    { "speaker": string, "text": string }
  ] (simulated dialogue of the meeting discussion in dialogue format, containing 4 to 6 statements matching the topic)

Return ONLY valid JSON.`;

  const raw = await groqChat(prompt, { model: DEFAULT_GROQ_MODEL });
  const result = extractJSON(raw);
  if (result && typeof result === "object" && result.summary) return result;
  return {
    summary: "Could not parse meeting analysis.",
    decisions: [],
    actionItems: [],
    followUpMeetings: [],
    risks: [],
    shouldwork: {
      recommendAttend: true,
      score: 80,
      reasoning: "Failed to parse AI model response. Defaulting to recommended attendance."
    },
    transcript: [
      { speaker: "Facilitator", text: "Welcome everyone, let's go over our current checklist." },
      { speaker: "Engineer", text: "I am working on the items from our sprint backlog." },
      { speaker: "Manager", text: "Great, let's sync up and make sure we balance the loads." }
    ]
  };
}

export async function groqAnswerQuery(question: string, state: any): Promise<string> {
  const top5 = state.prioritized.slice(0, 5).map((t: any, i: number) =>
    `${i + 1}. [${t.severity}] ${t.canonicalTitle} — score ${t.score} — due ${t.due}`
  ).join("\n");

  const prompt = `You are TaskPilot AI — an intelligent, proactive engineering assistant.

Current state:
- Total tasks: ${state.prioritized.length}
- Completed today: ${state.completedCount}
- Top 5 tasks:\n${top5}
- Active alerts: ${state.alerts.length}

Engineer's question: "${question}"

Answer concisely (2–4 sentences max). Be specific, data-driven, and actionable.
Reference real task names and scores when relevant.`;

  return groqChat(prompt, { model: DEFAULT_GROQ_MODEL });
}

export async function groqAgentRun(intent: string, context: any, onStep?: (text: string) => void): Promise<string> {
  const prompt = `You are TaskPilot AI — an autonomous agentic assistant.

Current context:
- Active task: ${context.activeTask}
- Total queue: ${context.queueSize} tasks
- Sources connected: ${context.sources}
- Profile: ${context.profile}

The engineer just asked: "${intent}"

Act like a real AI agent: reason step-by-step, check priorities, surface hidden risks, and give a concrete recommendation.
Format your response as:

🔍 **Scanning...** (what you checked)
🧠 **Reasoning...** (your analysis)  
⚡ **Recommendation:** (specific, actionable next step)
📊 **Confidence:** X% (your confidence in this recommendation)

Be specific, reference real data, and act proactively.`;

  return groqChat(prompt, { model: DEFAULT_GROQ_MODEL, onChunk: onStep });
}

export async function groqWeeklyStandup(tasks: any[], completedIds: string[], engineerName: string): Promise<string> {
  const completed = tasks.filter(t => completedIds.includes(t.id));
  const pending = tasks.filter(t => !completedIds.includes(t.id));

  const prompt = `You are TaskPilot AI. Generate a standup-ready weekly summary for ${engineerName}.

Completed this week (${completed.length}):
${completed.map(t => `- ${t.canonicalTitle || t.title}`).join("\n") || "None"}

Still pending (${pending.slice(0, 5).length}):
${pending.slice(0, 5).map(t => `- [${t.severity}] ${t.canonicalTitle || t.title} (score: ${t.score})`).join("\n")}

Write a 3-paragraph weekly summary:
1. Accomplishments (what was done)
2. In-progress and blockers
3. Next week priorities and risks

Keep it professional and suitable for a manager standup report.`;

  return groqChat(prompt, { model: DEFAULT_GROQ_MODEL });
}

export async function groqMeetingPrioritizer(meetings: any[], calendarBlocks: any[]): Promise<any[]> {
  const prompt = `You are TaskPilot AI. Analyse these pending meetings and upcoming calendar blocks.

Pending meetings to schedule:
${JSON.stringify(meetings, null, 2)}

Existing calendar blocks:
${JSON.stringify(calendarBlocks, null, 2)}

Return a JSON array of recommended meeting schedules:
[{
  "meetingTitle": string,
  "priority": "Critical"|"High"|"Medium"|"Low",
  "priorityScore": integer 0-100,
  "suggestedTime": ISO datetime string,
  "duration": minutes as integer,
  "reasoning": string,
  "attendees": string[],
  "agenda": string,
  "isConflict": boolean,
  "conflictsWith": string or null
}]

Return ONLY valid JSON.`;

  const raw = await groqChat(prompt, { model: DEFAULT_GROQ_MODEL });
  return extractJSON(raw) || [];
}
