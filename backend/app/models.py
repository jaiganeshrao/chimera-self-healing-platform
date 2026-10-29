from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class ServiceModel(Base):
    __tablename__ = "services"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    health_check_url = Column(String(512), nullable=False)
    status = Column(String(32), default="healthy", index=True)
    registration_date = Column(DateTime, default=datetime.utcnow)
    last_health_check = Column(DateTime, default=datetime.utcnow)
    consecutive_failures = Column(Integer, default=0)
    response_time_ms = Column(Integer, default=0)
    cpu_usage_pct = Column(Float, default=0.0)
    memory_usage_pct = Column(Float, default=0.0)
    tags = Column(JSON, default=list)

    incidents = relationship("IncidentModel", back_populates="service")
    metrics = relationship("MonitoringMetricModel", back_populates="service")


class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True)
    service_id = Column(String(64), ForeignKey("services.id"), nullable=False, index=True)
    service_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False, index=True)
    severity = Column(String(32), nullable=False)
    description = Column(Text, nullable=False)
    supporting_evidence = Column(JSON, default=list)
    confirmed_facts = Column(JSON, default=list)
    suspected_root_cause = Column(Text, nullable=False)
    diagnostic_method = Column(String(64), default="HYBRID_ENSEMBLE")
    ml_confidence = Column(Float, nullable=True)
    status = Column(String(64), default="DETECTED", index=True)
    detection_timestamp = Column(DateTime, default=datetime.utcnow)
    resolution_timestamp = Column(DateTime, nullable=True)
    recommended_action = Column(String(64), nullable=False)
    recovery_attempts_count = Column(Integer, default=0)

    service = relationship("ServiceModel", back_populates="incidents")
    recovery_attempts = relationship("RecoveryAttemptModel", back_populates="incident")


class RecoveryAttemptModel(Base):
    __tablename__ = "recovery_attempts"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), ForeignKey("incidents.id"), nullable=False, index=True)
    service_id = Column(String(64), ForeignKey("services.id"), nullable=False)
    recovery_action = Column(String(64), nullable=False)
    attempt_number = Column(Integer, default=1)
    start_timestamp = Column(DateTime, default=datetime.utcnow)
    end_timestamp = Column(DateTime, nullable=True)
    result = Column(String(32), default="PENDING")
    error_details = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    verification_details = Column(JSON, nullable=True)

    incident = relationship("IncidentModel", back_populates="recovery_attempts")


class MonitoringMetricModel(Base):
    __tablename__ = "monitoring_metrics"

    id = Column(String(64), primary_key=True, index=True)
    service_id = Column(String(64), ForeignKey("services.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    response_time_ms = Column(Integer, default=0)
    http_status = Column(Integer, default=200)
    cpu_usage_pct = Column(Float, default=0.0)
    memory_usage_pct = Column(Float, default=0.0)
    is_available = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    service = relationship("ServiceModel", back_populates="metrics")


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    related_incident_id = Column(String(64), nullable=True)
    service_id = Column(String(64), nullable=True)
    action_details = Column(Text, nullable=False)
    result = Column(String(32), default="INFO")
