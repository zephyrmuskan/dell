import os
import json
import random
import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///trustlens.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class RecommendationState(Base):
    __tablename__ = "recommendation_state"
    
    recommendation_id = Column(String(50), primary_key=True)
    questions_asked = Column(Integer, default=0)
    questions_resolved = Column(Integer, default=0)
    helpful_votes = Column(Integer, default=0)
    total_votes = Column(Integer, default=0)
    understanding_score = Column(Integer, default=60)
    trust_score = Column(Integer, default=78)
    chat_history = Column(Text, default="[]")  # JSON string representing messages
    confidence = Column(Integer, default=None)  # Dynamic AI confidence
    last_question_relevant = Column(Integer, default=0)  # Boolean flag (0 or 1)
    trust_update_allowed = Column(Integer, default=0)  # Boolean flag (0 or 1)

# Create tables
Base.metadata.create_all(bind=engine)

# Dynamic migrations for SQLite to ensure safety without losing data
try:
    with engine.begin() as conn:
        result = conn.execute(text("PRAGMA table_info(recommendation_state);")).fetchall()
        columns = [row[1] for row in result]
        if "confidence" not in columns:
            conn.execute(text("ALTER TABLE recommendation_state ADD COLUMN confidence INTEGER DEFAULT NULL;"))
            print("[trust_companion_service] Migration: Added 'confidence' column to recommendation_state.")
        if "last_question_relevant" not in columns:
            conn.execute(text("ALTER TABLE recommendation_state ADD COLUMN last_question_relevant BOOLEAN DEFAULT 0;"))
            print("[trust_companion_service] Migration: Added 'last_question_relevant' column to recommendation_state.")
        if "trust_update_allowed" not in columns:
            conn.execute(text("ALTER TABLE recommendation_state ADD COLUMN trust_update_allowed BOOLEAN DEFAULT 0;"))
            print("[trust_companion_service] Migration: Added 'trust_update_allowed' column to recommendation_state.")
except Exception as e:
    print(f"[trust_companion_service] Migration error/warning: {e}")

def get_recommendation_details(rec_id):
    """Retrieve current details for a recommendation from the SIEM database."""
    try:
        data_path = os.path.join(os.path.dirname(__file__), 'src', 'data', 'siem_data.json')
        if os.path.exists(data_path):
            with open(data_path, 'r') as f:
                data = json.load(f)
                recs = data.get("recommendations", [])
                scenarios = data.get("scenarios", {})
                for r in recs:
                    if r["id"] == rec_id:
                        return r
                if rec_id in scenarios:
                    return scenarios[rec_id]
    except Exception as e:
        print(f"[trust_companion_service] Error reading siem_data.json: {e}")
    return None

def get_or_create_state(db_session, rec_id):
    """Get the state for a recommendation, creating it with defaults if missing."""
    state = db_session.query(RecommendationState).filter(RecommendationState.recommendation_id == rec_id).first()
    rec = get_recommendation_details(rec_id) or {}
    default_confidence = rec.get("confidence", 80)
    
    if not state:
        accuracy = rec.get("timeMachine", {}).get("accuracy", 90)
        
        initial_understanding = 60
        initial_trust = int((0.4 * default_confidence) + (0.3 * accuracy) + (0.3 * initial_understanding))
        
        state = RecommendationState(
            recommendation_id=rec_id,
            questions_asked=0,
            questions_resolved=0,
            helpful_votes=0,
            total_votes=0,
            understanding_score=initial_understanding,
            trust_score=initial_trust,
            chat_history="[]",
            confidence=default_confidence,
            last_question_relevant=0,
            trust_update_allowed=0
        )
        db_session.add(state)
        db_session.commit()
        db_session.refresh(state)
    else:
        # Backfill confidence if it is NULL
        if state.confidence is None:
            state.confidence = default_confidence
            db_session.commit()
    return state

def calculate_understanding_score(questions_asked, questions_resolved, helpful_votes, total_votes):
    """
    Calculate user understanding score (0-100%).
    Starting baseline is 60%.
    - Each question asked & resolved adds +8% (capped at 92%).
    - Helpfulness ratio (helpful/total) maps to final boost/reduction.
    """
    score = 60
    
    # Boost for asking questions
    score += min(questions_resolved * 8, 32)
    
    # Adjust based on helpful votes
    if total_votes > 0:
        helpful_ratio = helpful_votes / total_votes
        if helpful_ratio >= 0.8:
            score += 8
        elif helpful_ratio <= 0.4:
            score -= 15
            
    return max(0, min(100, score))

def calculate_trust_score(confidence, accuracy, understanding_score):
    """
    Updated Trust Formula:
    Trust Score = (0.4 * AI Confidence) + (0.3 * Historical Accuracy) + (0.3 * Understanding Score)
    """
    return int(round((0.4 * confidence) + (0.3 * accuracy) + (0.3 * understanding_score)))

def call_gemini(user_query, recommendation_details):
    """Call Google Gemini API using direct REST API requests."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "xxxx" in api_key or len(api_key) < 10:
        raise ValueError("Invalid or placeholder Gemini API Key")
        
    system_prompt = (
        "You are TrustLens AI.\n"
        "You explain AI recommendations to non-technical IT administrators.\n"
        "Rules:\n"
        "- Use plain language.\n"
        "- Avoid technical jargon.\n"
        "- Explain why the recommendation exists.\n"
        "- Explain confidence in simple terms.\n"
        "- Explain uncertainty honestly.\n"
        "- Provide practical examples.\n"
        "- Suggest useful follow-up questions.\n"
        "- Help users build confidence before making decisions.\n"
        "Answer as a trusted advisor, not as an AI model."
    )
    
    context = (
        f"Recommendation Info:\n{json.dumps(recommendation_details, indent=2)}\n\n"
        f"User Question: {user_query}"
    )
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": context}]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code != 200:
            error_msg = response.text
            if "API_KEY_SERVICE_BLOCKED" in error_msg or response.status_code == 401 or "UNAUTHENTICATED" in error_msg:
                raise RuntimeError(
                    f"Gemini API authentication failed (Key Blocked or Service Blocked by Google). "
                    f"Please verify that the 'Generative Language API' is enabled in your Google Cloud Console "
                    f"for the API key starting with '{api_key[:10]}...' in your .env file, or use a key starting with 'AIzaSy'. "
                    f"Original error: {error_msg}"
                )
            response.raise_for_status()
            
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        raise e


def call_groq(user_query, recommendation_details):
    """Call Groq API as fallback."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or "xxxx" in api_key or len(api_key) < 10:
        raise ValueError("Invalid or placeholder Groq API Key")
        
    system_prompt = (
        "You are the fallback TrustLens AI assistant.\n"
        "Provide explanations consistent with Gemini responses.\n"
        "Rules:\n"
        "- Use simple language.\n"
        "- Avoid technical terminology.\n"
        "- Be concise.\n"
        "- Focus on trust and decision support.\n"
        "- Suggest relevant follow-up questions.\n"
        "Never mention that you are a fallback model."
    )
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Recommendation details:\n{json.dumps(recommendation_details)}\n\nQuestion: {user_query}"}
        ],
        "temperature": 0.7
    }
    
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        json=payload,
        headers=headers,
        timeout=10
    )
    response.raise_for_status()
    result = response.json()
    return result["choices"][0]["message"]["content"]

def call_local_rules(rec_id, message):
    """High-quality local rule-based mock engine to ensure service robustness."""
    rec = get_recommendation_details(rec_id)
    if not rec:
        return f"I apologize, but I couldn't locate details for recommendation ID {rec_id}."
        
    msg_lower = message.lower()
    action = rec.get("action", "suggested action")
    rec_type = rec.get("type", "asset")
    
    if any(k in msg_lower for k in ["why", "reason", "recommend"]):
        why_str = "\n".join([f"- {item}" for item in rec.get("why", [])])
        return (
            f"The recommendation to **{action}** for the {rec_type} ({rec_id}) is based on the following security telemetry anomalies:\n\n"
            f"{why_str}\n\n"
            f"These points describe the behavioral indicators flagged by our detection sensors. Our threat classification models evaluate this activity as a {rec.get('severity')} risk."
        )
    elif any(k in msg_lower for k in ["evidence", "support", "proof", "source"]):
        sources = ", ".join(rec.get("sources", []))
        confidence = rec.get("confidence", 80)
        nutrition = rec.get("nutritionLabel", {})
        evidence_strength = nutrition.get("evidenceStrength", 4)
        return (
            f"The evidence supporting this recommendation is gathered from **{sources}** with an overall confidence rating of **{confidence}%**.\n\n"
            f"**Evidence Indicators:**\n"
            f"- Evidence Strength: {evidence_strength}/5 on our standardized verification scale.\n"
            f"- Data Sources Analysed: {', '.join(nutrition.get('sources', []))}\n"
            f"- Similar past cases evaluated: {nutrition.get('similarCases', 0)}\n\n"
            f"Furthermore, our multi-agent compliance validation checks confirm the anomaly matches signatures in our security database."
        )
    elif any(k in msg_lower for k in ["reject", "ignore", "dismiss", "decline"]):
        consequences = {
            "quarantine": "If you reject this recommendation, the potentially compromised host will remain connected to the network, which may allow malware to spread laterally to other systems or continue data transfers.",
            "patch": "If you reject this patching action, the server will remain exposed to known software vulnerabilities, leaving a door open for intruders to exploit the system.",
            "escalate": "If you dismiss this alert, the anomalous authentication activity will remain unverified, meaning password compromise or unauthorized account usage could continue without restriction.",
            "mfa": "If you ignore this push challenge request, the impossible travel logins cannot be verified, risking unauthorized cloud access."
        }
        fallback_consequence = "Rejecting this recommendation keeps the system in an unverified state, leaving potential security risks unresolved."
        key = "quarantine" if "quarantine" in action.lower() or "isolate" in action.lower() else \
              "patch" if "patch" in action.lower() or "update" in action.lower() else \
              "mfa" if "mfa" in action.lower() or "challenge" in action.lower() else "escalate"
        return consequences.get(key, fallback_consequence) + "\n\nWe advise setting an alternative action like monitoring or throttling if you believe this is a false alarm."
    elif any(k in msg_lower for k in ["wrong", "incorrect", "error", "false", "advocate"]):
        points = "\n".join([f"- {pt}" for pt in rec.get("devilsAdvocate", {}).get("points", [])])
        alt = rec.get("devilsAdvocate", {}).get("alternativeAction", "Monitor")
        return (
            f"Our AI Devil's Advocate agent challenged this decision and identified these factors that could make the recommendation incorrect:\n\n"
            f"{points}\n\n"
            f"If these explain the activity, you should consider the suggested alternative: **{alt}**."
        )
    elif any(k in msg_lower for k in ["approve", "accept", "execute", "apply"]):
        if "quarantine" in action.lower() or "isolate" in action.lower():
            return f"Approving this recommendation will trigger an automated command via VMware Workspace ONE UEM to isolate **{rec_id}** from the internal network immediately. The user will lose connection to corporate servers until you manually release the block."
        elif "patch" in action.lower() or "update" in action.lower():
            return f"Approving this will schedule and deploy the security patches to **{rec_id}** via Microsoft Intune. This might cause a brief service restart, so you may want to coordinate with the database team."
        else:
            return f"Approving this will issue an MFA push challenge to verify the real identity of user **{rec_id}** via VMware Workspace ONE Access. The user will be prompted to approve the notification on their mobile device."
    elif any(k in msg_lower for k in ["often", "history", "similar", "incident", "time machine", "cases", "device", "devices"]):
        tm = rec.get("timeMachine", {})
        cases = tm.get("cases", 0)
        acc = tm.get("accuracy", 0)
        bd = tm.get("breakdown", {})
        similar_list = rec.get("similarCasesList", [])
        if similar_list:
            cases_str = "\n".join([f"- **{c['case_id']}** ({c['date']}): {c['outcome']} | Decision: {c['decision']} by {c['analyst']}. {c.get('description', '')}" for c in similar_list])
            correct_count = sum(1 for c in similar_list if c['outcome'] == 'True Positive')
            fp_count = sum(1 for c in similar_list if c['outcome'] == 'False Positive')
            summary_str = f"Out of these, {correct_count} were confirmed threats (True Positives) and {fp_count} were false alarms (False Positives)."
            return (
                f"According to the Trust Time Machine, this compliance event has been triggered **{cases} times** in the past.\n\n"
                f"Here are the recent similar incidents tracked in our database for this profile:\n\n"
                f"{cases_str}\n\n"
                f"{summary_str} You can use these historical outcomes to help decide whether to approve or reject the current recommendation."
            )
        else:
            return (
                f"According to the Trust Time Machine, this compliance event has been triggered **{cases} times** in the past.\n\n"
                f"**Historical outcomes for this profile:**\n"
                f"- Past accuracy: {acc}%\n"
                f"- Correct system alerts: {bd.get('correct', 0)}\n"
                f"- False positive alerts: {bd.get('falsePositives', 0)}\n"
                f"- Escalated cases: {bd.get('escalated', 0)}\n\n"
                f"Most past actions resolved the anomaly with zero breach escalation."
            )
    else:
        # Default helpful explanation synthesised from recommendations
        why_str = ", ".join(rec.get("why", []))
        return (
            f"I am the TrustLens AI Companion. I am analyzing the recommendation to **{action}** on **{rec_id}** ({rec_type}).\n\n"
            f"This recommendation is active because of these factors: {why_str}.\n\n"
            f"You can ask me questions about evidence support, potential errors, historical accuracy, or what happens when you approve or reject this recommendation."
        )

def generate_followup_questions(message, answer):
    """Generate 3 contextual follow-up questions."""
    msg_lower = message.lower()
    
    if any(k in msg_lower for k in ["why", "reason", "recommend"]):
        return [
            "What evidence supports this?",
            "What could make this wrong?",
            "What happens if I approve it?"
        ]
    elif any(k in msg_lower for k in ["evidence", "support", "proof"]):
        return [
            "How often has this happened before?",
            "What could make this wrong?",
            "What happens if I reject it?"
        ]
    elif any(k in msg_lower for k in ["wrong", "incorrect", "error", "false"]):
        return [
            "Why was this recommended?",
            "What happens if I reject it?",
            "Show similar incidents"
        ]
    else:
        return [
            "Why was this recommended?",
            "What could make this wrong?",
            "Show similar incidents"
        ]

def detect_intent(message: str) -> str:
    msg_lower = message.lower().strip().rstrip('?').rstrip('.').rstrip('!')
    
    # Greetings
    greetings = {"hi", "hello", "hey", "good morning", "good evening", "good afternoon", "yo", "greetings", "what's up", "how are you"}
    g_words = {"hi", "hello", "hey", "yo", "greetings"}
    msg_words = set(msg_lower.split())
    if msg_lower in greetings or any(g in msg_words for g in g_words) or any(phrase in msg_lower for phrase in ["good morning", "good evening", "good afternoon", "what's up", "how are you"]):
        return "GREETING"
        
    # Check for general chat / role / capabilities
    if "who are you" in msg_lower:
        return "GENERAL_CHAT"
    if "how does trustlens work" in msg_lower:
        return "GENERAL_CHAT"
    if "what can you do" in msg_lower or "capabilities" in msg_lower:
        return "HELP"
    if msg_lower == "help":
        return "HELP"
        
    # Check for trust query
    if "trust score" in msg_lower or "explain trust" in msg_lower:
        return "TRUST_QUERY"
        
    # Check for confidence query
    if any(w in msg_lower for w in ["confidence", "confident", "certainty", "probability"]):
        return "CONFIDENCE_QUERY"
        
    # Check for evidence query
    if "evidence" in msg_lower or "telemetry" in msg_lower or "source" in msg_lower:
        return "EVIDENCE_QUERY"
        
    # Check for risk/error query
    if any(w in msg_lower for w in ["wrong", "incorrect", "error", "false", "advocate", "counterpoint", "disagree", "reject", "dismiss", "decline", "ignore"]):
        return "RISK_QUERY"
        
    # Check for incident query
    if any(w in msg_lower for w in ["incident", "malware", "similar cases", "similar incidents", "similar devices", "history", "time machine", "recent cases", "same problem", "happened before"]):
        return "INCIDENT_QUERY"
        
    # Check for recommendation query
    if any(w in msg_lower for w in ["why was this recommended", "why recommended", "recommendation", "quarantine", "patch", "action", "why quarantine"]):
        return "RECOMMENDATION_QUERY"
        
    # Casual/small talk fallback
    small_talk_words = {"how are you", "what's up", "nice to meet you", "thank you", "thanks", "ok", "okay", "cool", "awesome"}
    if any(s in msg_lower for s in small_talk_words):
        return "SMALL_TALK"
        
    return "GENERAL_CHAT"

def classify_category(message: str) -> str:
    msg_lower = message.lower().strip().rstrip('?').rstrip('.').rstrip('!')
    
    # Category D: Trust Question
    if "trust" in msg_lower or "explain trust" in msg_lower or "trust score" in msg_lower:
        return "trust"
        
    # Category E: Decision Support Question
    if any(w in msg_lower for w in ["approve", "reject", "escalate", "dismiss", "ignore", "decline", "choice", "consequence", "happen if"]):
        return "decision"
        
    # Category C: Recommendation Question
    if any(w in msg_lower for w in ["why was this recommended", "why recommended", "recommendation", "quarantine", "patch", "action", "why quarantine", "evidence", "support", "proof", "source", "telemetry", "dev1248", "srv-0451", "usr-7782", "dev-8890", "srv-1022", "similar cases", "similar incidents", "similar devices", "similar issues", "similar problems", "other devices", "similar", "device", "devices", "incident", "malware", "virus", "history", "time machine", "cases", "confidence"]):
        return "recommendation"
        
    # Category A: Greeting
    greetings = ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "what's up", "how are you"]
    g_words = {"hi", "hello", "hey", "yo", "greetings"}
    msg_words = set(msg_lower.split())
    if any(msg_lower == g for g in greetings) or any(g in msg_words for g in g_words) or any(phrase in msg_lower for phrase in ["good morning", "good evening", "good afternoon", "what's up", "how are you"]):
        return "greeting"
        
    # Category B: General Question
    if any(w in msg_lower for w in ["who are you", "what can you do", "capabilities", "how does trustlens work", "help"]):
        return "general"
        
    # Fallback to recommendation (LLM route) instead of general
    return "recommendation"


def check_message_references(message: str, rec: dict) -> bool:
    if not message:
        return False
    msg_lower = message.lower()
    
    # 1. Recommendation
    if "recommend" in msg_lower or "action" in msg_lower:
        return True
    if rec:
        action = rec.get("action", "").lower()
        if action:
            action_words = [w for w in action.split() if len(w) > 3 and w not in ["with", "from", "that", "this", "your"]]
            if any(w in msg_lower for w in action_words):
                return True
                
    # 2. Device
    if "device" in msg_lower or "server" in msg_lower or "host" in msg_lower or "asset" in msg_lower:
        return True
    if rec:
        rec_id = rec.get("id", "").lower()
        if rec_id and rec_id in msg_lower:
            return True
            
    # 3. Risk assessment
    if any(w in msg_lower for w in ["risk", "assessment", "threat", "severity", "critical", "high", "medium", "priority"]):
        return True
        
    # 4. Confidence score
    if "confidence" in msg_lower:
        return True
        
    # 5. Incident
    if any(w in msg_lower for w in ["incident", "malware", "virus", "breach", "leak", "anomalous", "anomaly", "compliance", "history", "time machine", "cases"]):
        return True
        
    # 6. AI decision
    if any(w in msg_lower for w in ["decision", "approve", "reject", "escalate", "dismiss", "ignore", "choice"]):
        return True
        
    return False

def is_recommendation_related(intent: str) -> bool:
    return intent not in {"GREETING", "SMALL_TALK", "HELP", "GENERAL_CHAT", "TRUST_QUERY"}

def is_question_relevant(message: str, rec: dict) -> bool:
    """
    Check if the user's question is relevant to the recommendation context.
    Matches against key security terms or overlapping words in the recommendation details.
    """
    if not message or not rec:
        return False
    msg_lower = message.lower()
    
    import re
    # Remove punctuation
    cleaned_msg = re.sub(r'[^\w\s]', '', msg_lower).strip()
    words = cleaned_msg.split()
    
    # Check and filter out common casual greetings and slang immediately before checking key terms
    greetings_and_slang = {"hi", "hello", "yo", "wassup", "hey", "sup", "greetings", "howdy", "hola"}
    casual_words = {
        "hi", "hello", "hey", "hola", "yo", "sup", "wassup", "greetings", "howdy",
        "good", "morning", "afternoon", "evening", "whats", "what", "is", "up",
        "bro", "dude", "man", "buddy", "mate", "slang", "test", "ok", "okay",
        "thanks", "thank", "you", "thx", "cool", "awesome", "yes", "no", "bye", "goodbye",
        "there", "here", "doing", "how", "are", "fine", "great", "well", "hihello"
    }
    
    # If the message is composed entirely of greetings, slang, or casual filler words, it is irrelevant
    if words and all(w in greetings_and_slang or w in casual_words for w in words):
        return False
    
    # 1. Broad security explainability concepts
    keywords = [
        "why", "reason", "recommend", "evidence", "support", "proof", "source", 
        "wrong", "incorrect", "error", "reject", "ignore", "dismiss", "approve", 
        "accept", "history", "similar", "incident", "explain", "details", "risk",
        "threat", "security", "anomaly", "compliance", "policy", "action"
    ]
    if any(k in msg_lower for k in keywords):
        return True
        
    # 2. Match recommendation ID / device ID
    rec_id = rec.get("id", "").lower()
    if rec_id and rec_id in msg_lower:
        return True
        
    # 3. Check for specific word overlap with Action
    action_words = rec.get("action", "").lower().split()
    action_words = [w for w in action_words if len(w) > 3 and w not in ["with", "from", "that", "this", "your"]]
    if any(w in msg_lower for w in action_words):
        return True
        
    # 4. Check for word overlap with Why/triggers
    for why_item in rec.get("why", []):
        why_words = why_item.lower().split()
        why_words = [w for w in why_words if len(w) > 3]
        if any(w in msg_lower for w in why_words):
            return True
            
    return False

def generate_answer(recommendation_id, message, db_session):
    """
    Core dual-LLM orchestration function with silent Groq failover
    and robust local rule-based fallback.
    """
    state = get_or_create_state(db_session, recommendation_id)
    rec = get_recommendation_details(recommendation_id) or {}
    
    # Detect category and intent
    conversation_type = classify_category(message)
    intent = detect_intent(message)
    
    # Fetch chat history to check for Onboarding Mode
    history = json.loads(state.chat_history or "[]")
    
    provider_used = None
    answer = None
    suggested_actions = None
    requires_feedback = False
    
    # Retrieve confidence and accuracy
    confidence = state.confidence if state.confidence is not None else rec.get("confidence", 80)
    accuracy = rec.get("timeMachine", {}).get("accuracy", 90)
    
    # Check if the message references any activation trigger
    has_reference = check_message_references(message, rec)
    
    # Capture trust update allowance BEFORE this message triggers it
    orig_trust_allowed = bool(state.trust_update_allowed)
    
    # Only recommendation or decision categories contribute to trust updates
    if conversation_type in ["recommendation", "decision"]:
        if has_reference and not state.trust_update_allowed:
            state.trust_update_allowed = 1
            db_session.commit()
            
        trust_calc_active = bool(state.trust_update_allowed)
        
        # Determine relevance: only if trust calculations are active and the query is recommendation-related
        is_relevant = False
        if trust_calc_active:
            is_relevant = is_question_relevant(message, rec)
            
        state.last_question_relevant = 1 if is_relevant else 0
        trust_allowed_val = orig_trust_allowed
        confidence_allowed_val = orig_trust_allowed
    else:
        # Greetings/general/trust queries do NOT affect scores
        state.last_question_relevant = 0
        is_relevant = False
        trust_allowed_val = False
        confidence_allowed_val = False
        
    print(f"[trust_companion_service] Question '{message}' (Category: {conversation_type}) relevance check: {is_relevant}")
    
    # Responses based on conversation category
    if conversation_type == "greeting":
        msg_clean = message.lower().strip().rstrip('?').rstrip('.').rstrip('!')
        if msg_clean in ["hi", "hey"] or any(x in msg_clean for x in ["morning", "afternoon", "evening", "up"]):
            answer = (
                "Hello 👋\n\n"
                "I'm TrustLens AI, your enterprise decision copilot.\n\n"
                "I can help you:\n\n"
                "• Understand AI recommendations\n"
                "• Explain confidence scores\n"
                "• Show supporting evidence\n"
                "• Explore risks and alternatives\n"
                "• Review historical incidents\n\n"
                "How can I help you today?"
            )
            suggested_actions = [
                "Show active recommendations",
                "Explain trust scores",
                "How does TrustLens work?",
                "Review recent incidents"
            ]
        elif "hello" in msg_clean:
            answer = (
                "Hello 👋\n\n"
                "Welcome back.\n\n"
                "Would you like to:\n\n"
                "• Review active recommendations\n"
                "• Understand a trust score\n"
                "• Explore a previous incident\n"
                "• Ask a question about an AI decision"
            )
            suggested_actions = [
                "Show active recommendations",
                "Explain trust scores",
                "How does TrustLens work?",
                "Review recent incidents"
            ]
        else:
            answer = (
                "Hello 👋\n\n"
                "I'm TrustLens AI, your enterprise decision copilot. I can help explain recommendations, confidence scores, risks, and historical incidents. What would you like to explore today?"
            )
            suggested_actions = [
                "Show active recommendations",
                "Explain trust scores",
                "How does TrustLens work?",
                "Review recent incidents"
            ]
    elif conversation_type == "general":
        msg_clean = message.lower().strip().rstrip('?').rstrip('.')
        if "what can you do" in msg_clean or "capabilities" in msg_clean or "help" in msg_clean:
            answer = (
                "I'm TrustLens AI, your enterprise decision copilot. I help IT administrators analyze security recommendations by explaining:\n\n"
                "• The context and reasoning behind AI recommendations\n"
                "• The data sources and evidence supporting them\n"
                "• Potential risks, counter-arguments (via our Devil's Advocate), and alternative actions\n"
                "• Historical accuracy and similar past incidents using the Trust Time Machine\n"
                "• Detailed confidence and calibrated trust scores"
            )
        elif "who are you" in msg_clean:
            answer = (
                "I am TrustLens AI, your friendly enterprise decision copilot. My role is to help you analyze security recommendations with transparency, explain trust scores, and support your decision-making process using non-technical language."
            )
        elif "how does trustlens work" in msg_clean:
            answer = (
                "TrustLens AI analyzes security telemetry and processes it through a series of specialized AI validation agents. We calibrate a trust score based on AI confidence, historical accuracy, and user understanding, translating complex events into clear, non-technical explanations."
            )
        else:
            answer = (
                "I am here to help guide you through AI recommendations, confidence scores, risks, and historical incidents. Let me know if you have any questions!"
            )
        answer = answer + "\n\nWould you like to:\n• Review active recommendations\n• Learn how trust works"
        suggested_actions = [
            "Review Recommendation",
            "Learn How Trust Score Works"
        ]
    elif conversation_type == "trust":
        answer = (
            "A Trust Score is our calibrated measure of recommendation reliability. It is calculated dynamically based on:\n\n"
            "• **AI Confidence**: The model's certainty based on current telemetry.\n"
            "• **Historical Accuracy**: How often similar recommendations were correct in the past.\n"
            "• **User Understanding**: Your level of clarity, which increases as you ask questions and review evidence.\n\n"
            "Interacting with recommendations helps calibrate this score so you can make informed decisions with confidence."
        )
        answer = answer + "\n\nWould you like to:\n• See Confidence Breakdown\n• View Historical Accuracy\n• Ask About Uncertainty"
        suggested_actions = [
            "See Confidence Breakdown",
            "View Historical Accuracy",
            "Ask About Uncertainty"
        ]
    else:
        # Category: recommendation or decision
        requires_feedback = True
        try:
            print(f"[trust_companion_service] Attempting primary provider (Gemini)...")
            answer = call_gemini(message, rec)
            provider_used = "gemini"
        except Exception as e:
            print(f"[trust_companion_service] Gemini failed: {e}. Falling back to Groq...")
            try:
                answer = call_groq(message, rec)
                provider_used = "groq"
            except Exception as ex:
                print(f"[trust_companion_service] Groq failed: {ex}. Falling back to Local Rules...")
                answer = call_local_rules(recommendation_id, message)
                provider_used = "gemini"
        
        if conversation_type == "recommendation":
            answer = answer + "\n\nWould you like to:\n• Why was this recommended?\n• What evidence supports this?\n• What could make this wrong?\n• What happens if I approve it?\n• What happens if I reject it?"
            suggested_actions = [
                "Why was this recommended?",
                "What evidence supports this?",
                "What could make this wrong?",
                "What happens if I approve it?",
                "What happens if I reject it?"
            ]
        else:
            answer = answer + "\n\nWould you like to:\n• Why was this recommended?\n• What evidence supports this?\n• What could make this wrong?\n• What happens if I approve it?\n• What happens if I reject it?"
            suggested_actions = [
                "Why was this recommended?",
                "What evidence supports this?",
                "What could make this wrong?",
                "What happens if I approve it?",
                "What happens if I reject it?"
            ]
            
    # Update metrics in database only if the question is relevant
    if is_relevant:
        state.questions_asked += 1
        state.questions_resolved += 1
        
        # Recalculate scores
        state.understanding_score = calculate_understanding_score(
            state.questions_asked,
            state.questions_resolved,
            state.helpful_votes,
            state.total_votes
        )
        
        state.trust_score = calculate_trust_score(
            confidence,
            accuracy,
            state.understanding_score
        )
            
    # Append message to chat history
    history = json.loads(state.chat_history or "[]")
    history.append({"role": "user", "content": message})
    history.append({
        "role": "assistant", 
        "content": answer, 
        "provider": provider_used,
        "requires_feedback": requires_feedback,
        "conversation_type": conversation_type,
        "intent": intent
    })
    state.chat_history = json.dumps(history)
    
    db_session.commit()
    
    return {
        "conversation_type": conversation_type,
        "intent": intent, # old key for compatibility
        "answer": answer,
        "trust_update_allowed": trust_allowed_val,
        "confidence_update_allowed": confidence_allowed_val,
        "requires_feedback": requires_feedback, # old key
        "suggested_actions": suggested_actions,
        "suggested_questions": suggested_actions, # old key mapping for frontend
        "provider_used": provider_used,
        "understanding_score": state.understanding_score,
        "updated_trust_score": state.trust_score,
        "confidence": state.confidence,
        "is_relevant": is_relevant,
        "questions_asked": state.questions_asked,
        "questions_resolved": state.questions_resolved
    }

def record_feedback(recommendation_id, helpful, db_session):
    """Record thumbs up/down feedback, update understanding and trust scores."""
    state = get_or_create_state(db_session, recommendation_id)
    rec = get_recommendation_details(recommendation_id) or {}
    
    # Only update confidence and scores if the last question was relevant (recomm-related and trust update allowed)
    if state.last_question_relevant:
        current_conf = state.confidence if state.confidence is not None else rec.get("confidence", 80)
        if helpful:
            new_conf = min(100, current_conf + 5)
            state.confidence = new_conf
            print(f"[trust_companion_service] Positive feedback for relevant question. Increased AI confidence from {current_conf} to {new_conf}")
        else:
            new_conf = max(0, current_conf - 5)
            state.confidence = new_conf
            print(f"[trust_companion_service] Negative feedback for relevant question. Decreased AI confidence from {current_conf} to {new_conf}")
            
        state.total_votes += 1
        if helpful:
            state.helpful_votes += 1
            
        state.understanding_score = calculate_understanding_score(
            state.questions_asked,
            state.questions_resolved,
            state.helpful_votes,
            state.total_votes
        )
        
        confidence = state.confidence if state.confidence is not None else rec.get("confidence", 80)
        accuracy = rec.get("timeMachine", {}).get("accuracy", 90)
        state.trust_score = calculate_trust_score(
            confidence,
            accuracy,
            state.understanding_score
        )
        db_session.commit()
    
    return {
        "understanding_score": state.understanding_score,
        "updated_trust_score": state.trust_score,
        "confidence": state.confidence,
        "questions_asked": state.questions_asked,
        "questions_resolved": state.questions_resolved
    }
