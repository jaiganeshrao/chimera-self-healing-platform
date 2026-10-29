from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    description: Optional[str] = ""
    health_check_url: str
    tags: Optional[List[str]] = []


class ServiceOut(BaseModel):
    id: str
    name: str
    description: str
    health_check_url: str
    status: str
    registration_date: datetime
    last_health_check: datetime
    consecutive_failures: int
    response_time_ms: int
    cpu_usage_pct: float
    memory_usage_pct: float
    tags: List[str]

    class Config:
        from_attributes = True


class IncidentOut(BaseModel):
    id: str
    service_id: str
    service_name: str
    category: str
    severity: str
    description: str
    supporting_evidence: List[str]
    confirmed_facts: List[str]
    suspected_root_cause: str
    diagnostic_method: str
    ml_confidence: Optional[float]
    status: str
    detection_timestamp: datetime
    resolution_timestamp: Optional[datetime]
    recommended_action: str
    recovery_attempts_count: int

    class Config:
        from_attributes = True


class RecoveryTriggerRequest(BaseModel):
    action: Optional[str] = None


class RecoveryAttemptOut(BaseModel):
    id: str
    incident_id: str
    service_id: str
    recovery_action: str
    attempt_number: int
    start_timestamp: datetime
    end_timestamp: Optional[datetime]
    result: str
    error_details: Optional[str]
    verified: bool
    verification_details: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class SystemSettingsSchema(BaseModel):
    monitoring_interval_sec: int = 4
    timeout_ms: int = 3000
    error_rate_threshold_pct: int = 25
    cpu_threshold_pct: int = 80
    memory_threshold_pct: int = 85
    max_recovery_attempts: int = 3
    recovery_cooldown_sec: int = 25
    auto_recovery_enabled: bool = True
    verification_probes_count: int = 3
    allowed_hosts: List[str] = ["localhost", "127.0.0.1", "ais-dev"]


class AnalyticsOverviewSchema(BaseModel):
    total_services: int
    healthy_services: int
    degraded_services: int
    unavailable_services: int
    recovering_services: int
    active_incidents: int
    total_incidents_all_time: int
    successful_recoveries: int
    failed_recoveries: int
    recovery_success_rate: int
    mean_time_to_recovery_sec: int
    average_response_time_ms: int
