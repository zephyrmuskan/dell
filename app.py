import os
import sys
from dotenv import load_dotenv
load_dotenv()

# Startup Validation - fail fast if any key is missing in .env
for key in ["GEMINI_API_KEY", "GROQ_API_KEY", "HF_API_KEY"]:
    val = os.getenv(key)
    if not val:
        print(f"Missing {key} in .env")
        sys.exit(1)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import trust_companion_service as service
import multi_agent_service
import autonomy_service

app = FastAPI(title="TrustLens AI Trust Companion API")

# Add CORS Middleware to support local dev routing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to retrieve SQLite database session
def get_db():
    db = service.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatRequest(BaseModel):
    recommendation_id: str
    message: str

class FeedbackRequest(BaseModel):
    recommendation_id: str
    helpful: bool

class AutonomyLevelRequest(BaseModel):
    level: int

@app.get("/trust-chat/{recommendation_id}")
def get_chat_state(recommendation_id: str, db=Depends(get_db)):
    """Retrieve chat history, dynamic metrics, and updated scores for a specific recommendation."""
    state = service.get_or_create_state(db, recommendation_id)
    history = json.loads(state.chat_history or "[]")
    return {
        "recommendation_id": recommendation_id,
        "understanding_score": state.understanding_score,
        "updated_trust_score": state.trust_score,
        "questions_asked": state.questions_asked,
        "questions_resolved": state.questions_resolved,
        "helpful_votes": state.helpful_votes,
        "total_votes": state.total_votes,
        "messages": history,
        "confidence": state.confidence
    }

@app.post("/trust-chat")
def post_chat(req: ChatRequest, db=Depends(get_db)):
    """Submit a question, process it through the Gemini/Groq/Local failover sequence, and retrieve the explanation."""
    try:
        result = service.generate_answer(
            recommendation_id=req.recommendation_id,
            message=req.message,
            db_session=db
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trust-chat/feedback")
def post_feedback(req: FeedbackRequest, db=Depends(get_db)):
    """Submit thumbs up/down helpfulness feedback and retrieve the newly recalculated scores."""
    try:
        result = service.record_feedback(
            recommendation_id=req.recommendation_id,
            helpful=req.helpful,
            db_session=db
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent-chain/{recommendation_id}")
def get_agent_chain(recommendation_id: str, db=Depends(get_db)):
    """Retrieve the full decision chain of AI agents for a recommendation."""
    try:
        state = service.get_or_create_state(db, recommendation_id)
        chain = multi_agent_service.generate_agent_chain(db, recommendation_id, state.understanding_score)
        return {"agents": chain}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/autonomy-level")
def get_autonomy_level(db=Depends(get_db)):
    """Retrieve the global AI autonomy level configuration."""
    try:
        level = autonomy_service.get_autonomy_level(db)
        return {"level": level}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/autonomy-level")
def post_autonomy_level(req: AutonomyLevelRequest, db=Depends(get_db)):
    """Update the global AI autonomy level configuration."""
    try:
        if req.level not in [1, 2, 3]:
            raise HTTPException(status_code=400, detail="Invalid autonomy level. Must be 1, 2, or 3.")
        updated_level = autonomy_service.set_autonomy_level(db, req.level)
        return {
            "status": "updated",
            "current_level": updated_level
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api-status")
def get_api_status():
    """Retrieve configuration status of Gemini, Groq, and Hugging Face APIs."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    hf_key = os.getenv("HF_API_KEY")
    
    def is_configured(val):
        if not val:
            return False
        val_lower = val.lower()
        if "placeholder" in val_lower or "your_" in val_lower or val.startswith("xxxx") or len(val) < 5:
            return False
        return True
        
    return {
        "gemini": is_configured(gemini_key),
        "groq": is_configured(groq_key),
        "huggingface": is_configured(hf_key)
    }

@app.post("/test-connection/{provider}")
def test_connection(provider: str):
    """Perform a health check on the specified AI provider API."""
    import requests
    
    if provider == "gemini":
        key = os.getenv("GEMINI_API_KEY")
        if not key:
            raise HTTPException(status_code=400, detail="Gemini key not configured")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": "ping"}]}],
            "generationConfig": {"maxOutputTokens": 5}
        }
        try:
            resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=5)
            if resp.status_code == 200:
                return {"status": "Connected Successfully"}
            else:
                return {"status": "Connection Failed"}
        except Exception as e:
            return {"status": "Connection Failed"}
            
    elif provider == "groq":
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise HTTPException(status_code=400, detail="Groq key not configured")
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 5
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=5)
            if resp.status_code == 200:
                return {"status": "Connected Successfully"}
            else:
                return {"status": "Connection Failed"}
        except Exception as e:
            return {"status": "Connection Failed"}
            
    elif provider == "huggingface":
        key = os.getenv("HF_API_KEY")
        if not key:
            raise HTTPException(status_code=400, detail="HuggingFace key not configured")
        url = "https://api-inference.huggingface.co/models/distilbert-base-uncased"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            "inputs": "ping"
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=5)
            if resp.status_code in [200, 201, 503]:
                if resp.status_code == 503 and "loading" not in resp.text.lower():
                    return {"status": "Connection Failed"}
                return {"status": "Connected Successfully"}
            else:
                return {"status": "Connection Failed"}
        except Exception as e:
            return {"status": "Connection Failed"}
            
    else:
        raise HTTPException(status_code=400, detail="Unknown provider")

if __name__ == "__main__":
    import uvicorn
    # Run server on port 8000
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
