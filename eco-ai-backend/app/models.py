from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    ADMIN = "admin"

class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    ANALYZED = "analyzed"
    REJECTED = "rejected"

class CaseStatus(str, enum.Enum):
    NEW = "new"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.CITIZEN)
    is_superuser = Column(Boolean, nullable=False, server_default="false")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    password_hash = Column(String, nullable=False)  # <--- add this
    
    # Relationships
    reports = relationship("Report", back_populates="user")
    assigned_cases = relationship("Case", back_populates="assigned_officer")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String, nullable=False)
    thumbnail_path = Column(String)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    description = Column(Text)
    report_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    
    # Relationships
    user = relationship("User", back_populates="reports")
    analysis = relationship("AnalysisResult", back_populates="report", uselist=False)
    case = relationship("Case", back_populates="report", uselist=False)

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), unique=True)
    waste_types = Column(JSONB)  # {"construction": 0.85, "furniture": 0.72}
    confidence_scores = Column(JSONB)  # {"overall": 0.78, "waste_present": 0.92}
    priority_score = Column(Integer)  # 1-100
    risk_factors = Column(JSONB)  # ["waterway_proximity", "hazardous_materials"]
    ai_model_version = Column(String, default="mock_v1.0")
    processing_time = Column(Float)  # seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    detected_items = Column(JSONB, nullable=True)
    # Relationships
    report = relationship("Report", back_populates="analysis")

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), unique=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"))
    priority_level = Column(Enum(PriorityLevel), default=PriorityLevel.LOW)
    estimated_cleanup_cost = Column(Float)
    scheduled_date = Column(DateTime(timezone=True))
    completed_date = Column(DateTime(timezone=True))
    status = Column(Enum(CaseStatus), default=CaseStatus.NEW)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    report = relationship("Report", back_populates="case")
    assigned_officer = relationship("User", back_populates="assigned_cases")

class LocationMetadata(Base):
    __tablename__ = "locations_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    osm_data = Column(JSONB)  # Cached OSM response
    land_use = Column(String)
    waterway_distance = Column(Float)  # meters
    protected_area = Column(Boolean, default=False)
    historical_incident_count = Column(Integer, default=0)
    sensitivity_score = Column(Integer, default=0)  # 0-100
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (Index('idx_location', location),)