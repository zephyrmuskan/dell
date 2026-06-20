import os
import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import Session
from trust_companion_service import Base, SessionLocal, get_recommendation_details

# Database model for AgentDecisions
class AgentDecision(Base):
    __tablename__ = "agent_decisions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    recommendation_id = Column(String(50), index=True)
    agent_name = Column(String(100))
    role = Column(String(100))
    input_data = Column(Text)
    output_data = Column(Text)
    confidence = Column(Integer)
    reasoning = Column(Text)
    timestamp = Column(String(50))

# Ensure database tables exist
db = SessionLocal()
try:
    Base.metadata.create_all(bind=db.get_bind())
finally:
    db.close()

def run_detection_agent(rec_details: dict) -> dict:
    """Analyze telemetry and detect anomalies."""
    rec_id = rec_details.get("id", "UNKNOWN")
    rec_type = rec_details.get("type", "Asset")
    
    # Customize based on recommendation details
    why_list = rec_details.get("why", [])
    telemetry_summary = why_list[0] if why_list else "Anomalous system operations flagged."
    
    decision = f"Unusual activity sequence detected on {rec_type} ({rec_id})."
    confidence = min(100, rec_details.get("confidence", 80) + 5)
    
    return {
        "agent_name": "Detection Agent",
        "role": "Telemetry & Anomaly Analyzer",
        "input_data": f"Raw telemetry stream from security logs and network interfaces for {rec_id}.",
        "output_data": f"Anomaly Detected: {telemetry_summary}",
        "confidence": confidence,
        "reasoning": f"Detection heuristics flagged telemetry patterns deviating from standard baseline logs. Anomaly signature: {decision}",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

def run_risk_agent(rec_details: dict, detection_output: str) -> dict:
    """Evaluate threat severity and calculate risk score."""
    rec_id = rec_details.get("id", "UNKNOWN")
    severity = rec_details.get("severity", "Medium")
    base_confidence = rec_details.get("confidence", 80)
    
    # Calculate a risk score
    risk_score = 75 if severity == "High" else 90 if severity == "Critical" else 55
    
    decision = f"Risk evaluated as {severity} ({risk_score}% Severity)."
    confidence = max(50, base_confidence + 2)
    
    return {
        "agent_name": "Risk Assessment Agent",
        "role": "Severity & Urgency Evaluator",
        "input_data": f"Detection output: '{detection_output}'",
        "output_data": f"Threat Level: {severity} Priority. Risk Score: {risk_score}%",
        "confidence": confidence,
        "reasoning": f"Calculated risk index by cross-referencing anomaly alerts against active assets. Impact level assessed as {severity} urgency.",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

def run_remediation_agent(rec_details: dict, risk_output: str) -> dict:
    """Suggest corrective action."""
    rec_id = rec_details.get("id", "UNKNOWN")
    action = rec_details.get("action", "Remediate Alert")
    base_confidence = rec_details.get("confidence", 80)
    
    decision = f"Recommended remediation action: {action}"
    
    return {
        "agent_name": "Remediation Agent",
        "role": "Policy & Resolution Suggester",
        "input_data": f"Risk assessment outcome: '{risk_output}'",
        "output_data": f"Suggested Action: {action}",
        "confidence": base_confidence,
        "reasoning": f"Identified optimal MDM mitigation script to resolve the risk and secure the tenant environment. Action target: {action}.",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

def run_devils_advocate_agent(rec_details: dict, remediation_output: str) -> dict:
    """Challenge recommendation and identify uncertainty."""
    da = rec_details.get("devilsAdvocate", {})
    points = da.get("points", ["Could be normal activity"])
    alt_action = da.get("alternativeAction", "Monitor")
    
    decision = f"Identified potential false-positive arguments: {', '.join(points)}"
    
    return {
        "agent_name": "Devil's Advocate Agent",
        "role": "Validation & Falsification Challenger",
        "input_data": f"Suggested remediation action: '{remediation_output}'",
        "output_data": f"False-Positive Risks Checked. Recommended Alternative: {alt_action}",
        "confidence": 35, # Always lower for the counter-agent
        "reasoning": f"Challenged primary recommendation using alternative hypotheses: {'; '.join(points)}. Alternative option: {alt_action}",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

def run_trust_companion_agent(rec_details: dict, devils_advocate_output: str, understanding_score: int) -> dict:
    """Answer user questions and clarify decisions."""
    rec_id = rec_details.get("id", "UNKNOWN")
    
    decision = f"Recalculating operator transparency and understanding metrics."
    
    return {
        "agent_name": "Trust Companion Agent",
        "role": "Dialogue & Explainability Interface",
        "input_data": f"Devil's advocate counter-evidence: '{devils_advocate_output}'. Current operator understanding: {understanding_score}%",
        "output_data": f"Dialogue support active. Understanding Score is at {understanding_score}%.",
        "confidence": 85,
        "reasoning": f"Prepared interactive plain-language response models and follow-up prompts to address administrator concerns regarding {rec_id}.",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

def generate_agent_chain(db_session: Session, recommendation_id: str, understanding_score: int = 60) -> list:
    """Generate or retrieve a full chain of agent decisions for a recommendation."""
    # Check if we already have the decisions saved in the db
    existing = db_session.query(AgentDecision).filter(AgentDecision.recommendation_id == recommendation_id).all()
    if existing:
        # Sort in order: Detection, Risk, Remediation, Devil's Advocate, Trust Companion
        order = ["Detection Agent", "Risk Assessment Agent", "Remediation Agent", "Devil's Advocate Agent", "Trust Companion Agent"]
        sorted_existing = []
        for name in order:
            for item in existing:
                if item.agent_name == name:
                    sorted_existing.append(item)
                    break
        # If we found all 5, return them
        if len(sorted_existing) == len(order):
            return [
                {
                    "name": item.agent_name,
                    "role": item.role,
                    "input_data": item.input_data,
                    "output_data": item.output_data,
                    "confidence": item.confidence,
                    "reasoning": item.reasoning,
                    "timestamp": item.timestamp
                }
                for item in sorted_existing
            ]
        
        # If partial, delete and regenerate
        for item in existing:
            db_session.delete(item)
        db_session.commit()

    # Load recommendation details
    rec = get_recommendation_details(recommendation_id)
    if not rec:
        return []

    # Run agents sequentially
    det = run_detection_agent(rec)
    risk = run_risk_agent(rec, det["output_data"])
    rem = run_remediation_agent(rec, risk["output_data"])
    da = run_devils_advocate_agent(rec, rem["output_data"])
    comp = run_trust_companion_agent(rec, da["output_data"], understanding_score)

    agents = [det, risk, rem, da, comp]
    
    # Save to database
    for agent in agents:
        db_decision = AgentDecision(
            recommendation_id=recommendation_id,
            agent_name=agent["agent_name"],
            role=agent["role"],
            input_data=agent["input_data"],
            output_data=agent["output_data"],
            confidence=agent["confidence"],
            reasoning=agent["reasoning"],
            timestamp=agent["timestamp"]
        )
        db_session.add(db_decision)
    
    db_session.commit()
    
    # Return formatted list
    return [
        {
            "name": agent["agent_name"],
            "role": agent["role"],
            "input_data": agent["input_data"],
            "output_data": agent["output_data"],
            "confidence": agent["confidence"],
            "reasoning": agent["reasoning"],
            "timestamp": agent["timestamp"]
        }
        for agent in agents
    ]
