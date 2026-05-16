from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    ADMIN   = "admin"

class ReportStatus(str, Enum):
    PENDING    = "pending"
    PROCESSING = "processing"
    ANALYZED   = "analyzed"
    REJECTED   = "rejected"

class PriorityLevel(str, Enum):
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"

class CaseStatus(str, Enum):
    NEW         = "new"
    ASSIGNED    = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"
    CANCELLED   = "cancelled"

# ── User ──────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.CITIZEN

class UserCreate(UserBase):
    password: str

class CreateUser(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    is_superuser: bool = False
    is_active: bool    = False

    class Config:
        from_attributes = True

class User(UserBase):
    id:         int
    is_active:  bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id:           int
    full_name:    Optional[str]
    email:        EmailStr
    is_superuser: bool
    is_active:    bool
    created_at:   datetime

    class Config:
        from_attributes = True

# ── Auth ──────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type:   str
    is_superuser: bool
    user_id:      int

class TokenData(BaseModel):
    id:    str | None = None
    email: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    user:         Optional[User] = None
    is_superuser: Optional[bool] = None
    user_id:      Optional[int]  = None

    class Config:
        from_attributes = True

# ── Location / Report ─────────────────────────────────────────────────────────

class LocationBase(BaseModel):
    latitude:  float = Field(..., ge=-90,  le=90)
    longitude: float = Field(..., ge=-180, le=180)

class ReportBase(LocationBase):
    description: Optional[str] = None

class ReportCreate(ReportBase):
    pass

class DetectedItem(BaseModel):
    label:      str
    class_name: str
    category:   str
    confidence: float
    count:      int
    bbox:       List[float]

class AnalysisResultBase(BaseModel):
    waste_types:       Dict[str, float]
    confidence_scores: Dict[str, Any]   # overall/waste_present are floats, detection_count is int
    priority_score:    int = Field(..., ge=1, le=100)
    risk_factors:      List[str]
    ai_model_version:  str
    processing_time:   float
    detected_items:    Optional[List[DetectedItem]] = None

class Report(ReportBase):
    id:            int
    user_id:       int
    image_url:     str
    thumbnail_url: Optional[str]
    report_date:   datetime
    status:        ReportStatus
    analysis:      Optional[AnalysisResultBase] = None

    class Config:
        from_attributes = True

class ReportWithUser(Report):
    user: User

# ── Case ──────────────────────────────────────────────────────────────────────
# FIX: Case now inherits ALL fields from CaseBase so the frontend
# receives priority_level, status, notes, estimated_cleanup_cost etc.

class CaseBase(BaseModel):
    priority_level:          PriorityLevel
    estimated_cleanup_cost:  Optional[float]    = None
    scheduled_date:          Optional[datetime] = None
    status:                  CaseStatus = CaseStatus.NEW
    notes:                   Optional[str] = None

class CaseCreate(CaseBase):
    report_id:            int
    assigned_officer_id:  Optional[int] = None

class Case(CaseBase):          # <-- inherits priority_level, status, notes, cost, date
    id:                   int
    report_id:            Optional[int]
    assigned_officer_id:  Optional[int]
    completed_date:       Optional[datetime] = None
    created_at:           datetime
    updated_at:           Optional[datetime]
    assigned_officer:     Optional[User] = None

    class Config:
        from_attributes = True

class CaseWithReport(Case):
    report: Optional[Report] = None

# ── Location metadata ─────────────────────────────────────────────────────────

class LocationMetadataBase(BaseModel):
    latitude:                  float
    longitude:                 float
    osm_data:                  Dict[str, Any]
    land_use:                  Optional[str]
    waterway_distance:         Optional[float]
    protected_area:            bool = False
    historical_incident_count: int  = 0
    sensitivity_score:         int  = 0

class LocationMetadata(LocationMetadataBase):
    id:           int
    last_updated: datetime

    class Config:
        from_attributes = True

# ── Analytics ─────────────────────────────────────────────────────────────────

class HeatmapData(BaseModel):
    latitude:       float
    longitude:      float
    intensity:      float
    priority_level: PriorityLevel

class AnalyticsData(BaseModel):
    total_reports:    int
    reports_by_status: Dict[str, int]
    cases_by_priority: Dict[str, int]
    avg_response_time: Optional[float]
    top_hotspots:      List[Dict[str, Any]]

# ── Detailed analysis (AI endpoint) ──────────────────────────────────────────

class DetailedAnalysisResult(BaseModel):
    waste_types:       Dict[str, float]
    confidence_scores: Dict[str, Any]
    priority_score:    int
    risk_factors:      List[str]
    ai_model_version:  str
    processing_time:   float
    detections:        List[Dict[str, Any]] = []
    waste_categories:  Dict[str, int]       = {}
    image_analysis:    Dict[str, Any]       = {}
    component_scores:  Optional[Dict[str, float]] = None
    priority_level:    Optional[str] = None
    priority_explanation: Optional[str] = None
    detected_items:    Optional[List[DetectedItem]] = None

    class Config:
        from_attributes = True

class DetailedReport(Report):
    analysis: Optional[DetailedAnalysisResult] = None

    class Config:
        from_attributes = True
