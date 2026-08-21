"""
SQLAlchemy Database Models for logging user decisions, scenarios, and accuracy metrics.
"""

from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    client_ip = Column(String(50), nullable=True)

    scenarios = relationship("Scenario", back_populates="user_session", cascade="all, delete-orphan")
    decision_logs = relationship("DecisionLog", back_populates="user_session", cascade="all, delete-orphan")


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("user_sessions.id"), nullable=False)
    tiles_json = Column(Text, nullable=False)  # JSON array of 14 tile codes
    seat_wind = Column(String(5), default="1z")
    prevailing_wind = Column(String(5), default="1z")
    optimal_discard = Column(String(5), nullable=False)
    reasoning_zh = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_session = relationship("UserSession", back_populates="scenarios")
    decision_log = relationship("DecisionLog", back_populates="scenario", uselist=False)


class DecisionLog(Base):
    __tablename__ = "decision_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    session_id = Column(String(36), ForeignKey("user_sessions.id"), nullable=False)
    user_discard = Column(String(5), nullable=False)
    optimal_discard = Column(String(5), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    priority_level = Column(Integer, default=1)
    delta_reasoning_zh = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_session = relationship("UserSession", back_populates="decision_logs")
    scenario = relationship("Scenario", back_populates="decision_log")


class AccuracyMetric(Base):
    __tablename__ = "accuracy_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(36), unique=True, nullable=False)
    total_scenarios = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    accuracy_percentage = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
