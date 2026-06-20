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
        if req.level not in [1, 2, 3, 4]:
            raise HTTPException(status_code=400, detail="Invalid autonomy level. Must be 1, 2, 3, or 4.")
        updated_level = autonomy_service.set_autonomy_level(db, req.level)
        return {
            "status": "updated",
            "current_level": updated_level
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run server on port 8000
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
