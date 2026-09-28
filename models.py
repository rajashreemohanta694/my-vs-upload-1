"""
Pydantic data models for the AI Threat Monitoring API.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    SAFE = "Safe"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class ThreatCategory(str, Enum):
    PHISHING = "Phishing"
    MALWARE = "Malware"
    ACCOUNT_TAKEOVER = "Account Takeover"
    ANOMALOUS_LOGIN = "Anomalous Login"
    DATA_EXFILTRATION = "Data Exfiltration"
    INSIDER_THREAT = "Insider Threat"
    BRUTE_FORCE = "Brute Force"
    SUSPICIOUS_LINK = "Suspicious Link"


class ThreatStatus(str, Enum):
    NEW = "New"
    INVESTIGATING = "Investigating"
    CONTAINED = "Contained"
    RESOLVED = "Resolved"


class RecommendedAction(str, Enum):
    BLOCK_LINK = "Block malicious link"
    QUARANTINE_EMAIL = "Quarantine email"
    REVOKE_SESSION = "Revoke session"
    STRENGTHEN_AUTH = "Strengthen authentication (force MFA)"
    ALERT_ADMIN = "Alert administrator"
    ESCALATE = "Escalate incident"
    MONITOR = "Continue monitoring"


class EvidenceItem(BaseModel):
    signal: str
    detail: str
    weight: float = Field(ge=0, le=1)


class Threat(BaseModel):
    id: str
    title: str
    category: ThreatCategory
    source: str
    target_user: str
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    status: ThreatStatus
    detected_at: datetime
    detection_methods: List[str]
    evidence: List[EvidenceItem]
    recommended_actions: List[RecommendedAction]
    explanation: str
    ip_address: Optional[str] = None
    location: Optional[str] = None


class Alert(BaseModel):
    id: str
    threat_id: str
    message: str
    risk_level: RiskLevel
    created_at: datetime
    acknowledged: bool = False


class ActionRequest(BaseModel):
    threat_id: str
    action: RecommendedAction


class ActionResponse(BaseModel):
    success: bool
    threat_id: str
    action: RecommendedAction
    message: str
    performed_at: datetime


class OverviewStats(BaseModel):
    total_threats_24h: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    safe_count: int
    active_alerts: int
    avg_risk_score: float
    threats_blocked: int
    emails_quarantined: int
    sessions_revoked: int
    trend_labels: List[str]
    trend_scores: List[float]
    category_breakdown: dict
