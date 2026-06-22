import os
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, text
from sqlalchemy.orm import Session
from trust_companion_service import Base, SessionLocal

# Database model for AutonomySettings
class AutonomySetting(Base):
    __tablename__ = "autonomy_settings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), default="admin", unique=True)
    autonomy_level = Column(Integer, default=1) # Default is Level 1 (Always Ask)
    last_updated = Column(String(50))
    version = Column(Integer, default=1) # Schema/Data version for migration

# Ensure database tables exist
db = SessionLocal()
try:
    Base.metadata.create_all(bind=db.get_bind())
    # Dynamic migration to add version column if it doesn't exist
    with db.get_bind().begin() as conn:
        result = conn.execute(text("PRAGMA table_info(autonomy_settings);")).fetchall()
        columns = [row[1] for row in result]
        if "version" not in columns:
            conn.execute(text("ALTER TABLE autonomy_settings ADD COLUMN version INTEGER DEFAULT 0;"))
            print("[autonomy_service] Migration: Added 'version' column to autonomy_settings.")
finally:
    db.close()

def get_autonomy_level(db_session: Session, user_id: str = "admin") -> int:
    """Retrieve the current autonomy level for the user."""
    setting = db_session.query(AutonomySetting).filter(AutonomySetting.user_id == user_id).first()
    if not setting:
        # Create default Level 1 (Always Ask)
        setting = AutonomySetting(
            user_id=user_id,
            autonomy_level=1,
            last_updated=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            version=1
        )
        db_session.add(setting)
        db_session.commit()
        db_session.refresh(setting)
    else:
        # Auto-migrate old values to new 1-3 sequence ONLY if version is less than 1
        if getattr(setting, "version", 0) < 1:
            if setting.autonomy_level == 4:
                setting.autonomy_level = 3
            elif setting.autonomy_level == 3:
                setting.autonomy_level = 2
            elif setting.autonomy_level == 2:
                setting.autonomy_level = 1
            setting.version = 1
            setting.last_updated = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
            db_session.commit()
            
    return setting.autonomy_level

def set_autonomy_level(db_session: Session, level: int, user_id: str = "admin") -> int:
    """Set the current autonomy level for the user."""
    setting = db_session.query(AutonomySetting).filter(AutonomySetting.user_id == user_id).first()
    if not setting:
        setting = AutonomySetting(user_id=user_id, version=1)
        db_session.add(setting)
    
    setting.autonomy_level = level
    setting.version = 1
    setting.last_updated = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    db_session.commit()
    db_session.refresh(setting)
    return setting.autonomy_level

def evaluate_action_risk(action: str) -> str:
    """Evaluate whether an action is 'Low Risk' or 'Critical'."""
    act_lower = action.lower()
    if "patch" in act_lower or "update" in act_lower or "install" in act_lower:
        return "Low Risk"
    else:
        return "Critical"

def determine_execution_mode(autonomy_level: int, risk_level: str) -> str:
    """
    Determine execution mode based on autonomy level and risk level:
    - Level 1: Always Ask Me -> Human Review Required
    - Level 2: Auto Approve Low Risk -> Executed Automatically if Low Risk else Human Review Required
    - Level 3: Act and Notify -> Executed Automatically
    """
    if autonomy_level == 1:
        return "Human Review Required"
    elif autonomy_level == 2:
        return "Executed Automatically" if risk_level == "Low Risk" else "Human Review Required"
    elif autonomy_level >= 3:
        return "Executed Automatically"
    return "Human Review Required"

def execute_action(db_session: Session, recommendation_id: str, action: str, autonomy_level: int) -> dict:
    """Evaluate and process a recommendation action based on autonomy rules."""
    risk_level = evaluate_action_risk(action)
    execution_mode = determine_execution_mode(autonomy_level, risk_level)
    
    # Generate audit logging statement
    timestamp = datetime.utcnow().strftime("%H:%M %p")
    if execution_mode == "Executed Automatically":
        audit_log = f"{action} was executed automatically. Reason: Low Risk (Autonomy Level {autonomy_level})."
        status = "Approved"
    else:
        audit_log = f"Human review required for {action}. Reason: Critical action or strict autonomy policy."
        status = "Pending"
        
    return {
        "recommendation_id": recommendation_id,
        "action": action,
        "risk_level": risk_level,
        "execution_mode": execution_mode,
        "status": status,
        "audit_log": audit_log,
        "timestamp": timestamp
    }
