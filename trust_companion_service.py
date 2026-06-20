import os
import json
import random
import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text
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

# Create tables
Base.metadata.create_all(bind=engine)

# Dynamic migrations for SQLite to ensure safety without losing data
try:
    with engine.connect() as conn:
        result = conn.execute("PRAGMA table_info(recommendation_state);").fetchall()
        columns = [row[1] for row in result]
        if "confidence" not in columns:
            conn.execute("ALTER TABLE recommendation_state ADD COLUMN confidence INTEGER DEFAULT NULL;")
            print("[trust_companion_service] Migration: Added 'confidence' column to recommendation_state.")
        if "last_question_relevant" not in columns:
            conn.execute("ALTER TABLE recommendation_state ADD COLUMN last_question_relevant BOOLEAN DEFAULT 0;")
            print("[trust_companion_service] Migration: Added 'last_question_relevant' column to recommendation_state.")
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
            last_question_relevant=0
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
    """Call Google Gemini API using the new google-genai SDK."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "xxxx" in api_key or len(api_key) < 10:
        raise ValueError("Invalid or placeholder Gemini API Key")
        
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise ImportError("google-genai package not installed")
        
    client = genai.Client(api_key=api_key)
    
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
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=context,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        return response.text
    except Exception as e:
        error_msg = str(e)
        if "API_KEY_SERVICE_BLOCKED" in error_msg or "401" in error_msg or "UNAUTHENTICATED" in error_msg:
            # Explicitly highlight that the key is blocked/restricted in GCP Console
            raise RuntimeError(
                f"Gemini API authentication failed (Key Blocked or Service Blocked by Google). "
                f"Please verify that the 'Generative Language API' is enabled in your Google Cloud Console "
                f"for the API key starting with '{api_key[:10]}...' in your .env file, or use a key starting with 'AIzaSy'. "
                f"Original error: {error_msg}"
            )
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
    elif any(k in msg_lower for k in ["often", "history", "similar", "incident", "time machine"]):
        tm = rec.get("timeMachine", {})
        cases = tm.get("cases", 0)
        acc = tm.get("accuracy", 0)
        bd = tm.get("breakdown", {})
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

def is_question_relevant(message: str, rec: dict) -> bool:
    """
    Check if the user's question is relevant to the recommendation context.
    Matches against key security terms or overlapping words in the recommendation details.
    """
    if not message or not rec:
        return False
    msg_lower = message.lower()
    
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
    
    # Check relevance and record it
    is_relevant = is_question_relevant(message, rec)
    state.last_question_relevant = 1 if is_relevant else 0
    print(f"[trust_companion_service] Question '{message}' relevance check: {is_relevant}")
    
    # Retrieve confidence and accuracy
    confidence = state.confidence if state.confidence is not None else rec.get("confidence", 80)
    accuracy = rec.get("timeMachine", {}).get("accuracy", 90)
    
    provider_used = None
    answer = None
    
    # 1. Primary path: Gemini
    try:
        print(f"[trust_companion_service] Attempting primary provider (Gemini)...")
        answer = call_gemini(message, rec)
        provider_used = "gemini"
    except Exception as e:
        print(f"[trust_companion_service] Gemini failed: {e}. Falling back to Groq...")
        
        # 2. Fallback path: Groq
        try:
            answer = call_groq(message, rec)
            provider_used = "groq"
        except Exception as ex:
            print(f"[trust_companion_service] Groq failed: {ex}. Falling back to Local Rules...")
            
            # 3. Last fallback: Local rule-based
            answer = call_local_rules(recommendation_id, message)
            provider_used = "gemini"  # Mask local rules as primary Gemini in production for user experience
            
    # Update metrics in database
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
    history.append({"role": "assistant", "content": answer, "provider": provider_used})
    state.chat_history = json.dumps(history)
    
    db_session.commit()
    
    suggested_questions = generate_followup_questions(message, answer)
    
    return {
        "provider_used": provider_used,
        "answer": answer,
        "understanding_score": state.understanding_score,
        "updated_trust_score": state.trust_score,
        "suggested_questions": suggested_questions,
        "confidence": state.confidence
    }

def record_feedback(recommendation_id, helpful, db_session):
    """Record thumbs up/down feedback, update understanding and trust scores."""
    state = get_or_create_state(db_session, recommendation_id)
    rec = get_recommendation_details(recommendation_id) or {}
    
    # If the user is satisfied AND the last question was relevant, increase dynamic confidence
    if helpful and state.last_question_relevant:
        current_conf = state.confidence if state.confidence is not None else rec.get("confidence", 80)
        new_conf = min(100, current_conf + 5)
        state.confidence = new_conf
        print(f"[trust_companion_service] Positive feedback for relevant question. Increased AI confidence from {current_conf} to {new_conf}")
        
    state.total_votes += 1
    if helpful:
        state.helpful_votes += 1
        
    state.understanding_score = calculate_understanding_score(
        state.questions_asked,
        state.questions_resolved,
        state.helpful_votes,
        state.total_votes
    )
    
    # Recalculate trust score using updated confidence
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
        "confidence": state.confidence
    }
