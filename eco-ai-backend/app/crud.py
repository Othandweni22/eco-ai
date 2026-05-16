from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import bcrypt
from jose import jwt
from app import models, schemas, utils
from app.config import settings
from app.utils import convert_to_point_wkt

# User operations
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        password_hash=utils.hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return None
    return user

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

# Report operations
def create_report(
    db: Session, 
    user_id: int, 
    image_path: str, 
    thumbnail_path: str,
    latitude: float, 
    longitude: float, 
    description: Optional[str] = None
) -> models.Report:
    point_wkt = convert_to_point_wkt(latitude, longitude)
    
    db_report = models.Report(
        user_id=user_id,
        image_path=image_path,
        thumbnail_path=thumbnail_path,
        latitude=latitude,
        longitude=longitude,
        location=func.ST_GeomFromText(point_wkt, 4326),
        description=description,
        status=models.ReportStatus.PENDING
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_report(db: Session, report_id: int) -> Optional[models.Report]:
    return db.query(models.Report).filter(models.Report.id == report_id).first()

def get_reports(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    priority_min: Optional[int] = None,
    priority_max: Optional[int] = None
) -> List[models.Report]:
    query = db.query(models.Report)
    
    if user_id:
        query = query.filter(models.Report.user_id == user_id)
    
    if status:
        query = query.filter(models.Report.status == status)
    
    # Join with analysis for priority filtering
    if priority_min is not None or priority_max is not None:
        query = query.join(models.AnalysisResult)
        
        if priority_min is not None:
            query = query.filter(models.AnalysisResult.priority_score >= priority_min)
        if priority_max is not None:
            query = query.filter(models.AnalysisResult.priority_score <= priority_max)
    
    query = query.order_by(models.Report.report_date.desc())
    return query.offset(skip).limit(limit).all()

def update_report_status(db: Session, report_id: int, status: str) -> Optional[models.Report]:
    db_report = get_report(db, report_id)
    if db_report:
        db_report.status = status
        db.commit()
        db.refresh(db_report)
    return db_report

# Analysis operations
def create_analysis_result(
    db: Session, 
    report_id: int, 
    analysis_data: Dict[str, Any]
) -> models.AnalysisResult:
    db_analysis = models.AnalysisResult(
        report_id=report_id,
        waste_types=analysis_data.get("waste_types", {}),
        confidence_scores=analysis_data.get("confidence_scores", {}),
        priority_score=analysis_data.get("priority_score", 50),
        risk_factors=analysis_data.get("risk_factors", []),
        ai_model_version=analysis_data.get("ai_model_version", "unknown"),
        processing_time=analysis_data.get("processing_time", 0)
    )
    
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

def get_analysis_by_report_id(db: Session, report_id: int) -> Optional[models.AnalysisResult]:
    return db.query(models.AnalysisResult).filter(
        models.AnalysisResult.report_id == report_id
    ).first()

# Case operations
def create_case(
    db: Session, 
    report_id: int, 
    priority_score: int
) -> models.Case:
    from app.services.priority_service import PriorityService
    
    priority_level = PriorityService.get_priority_level(priority_score)
    
    # Estimate cleanup cost based on priority
    base_cost = 100  # Base cost in currency units
    if priority_level == "critical":
        estimated_cost = base_cost * 3
    elif priority_level == "high":
        estimated_cost = base_cost * 2
    elif priority_level == "medium":
        estimated_cost = base_cost * 1.5
    else:
        estimated_cost = base_cost
    
    db_case = models.Case(
        report_id=report_id,
        priority_level=priority_level,
        estimated_cleanup_cost=estimated_cost,
        status=models.CaseStatus.NEW
    )
    
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

def get_case(db: Session, case_id: int) -> Optional[models.Case]:
    return db.query(models.Case).filter(models.Case.id == case_id).first()

def get_cases(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority_level: Optional[str] = None,
    assigned_officer_id: Optional[int] = None
) -> List[models.Case]:
    query = db.query(models.Case)
    
    if status:
        try:
            status_enum = models.CaseStatus(status)
            query = query.filter(models.Case.status == status_enum)
        except ValueError:
            pass  # invalid status — ignore filter
    
    if priority_level:
        query = query.filter(models.Case.priority_level == priority_level)
    
    if assigned_officer_id:
        query = query.filter(models.Case.assigned_officer_id == assigned_officer_id)
    
    # Order by priority (critical > high > medium > low > monitor) then newest first
    from sqlalchemy import case as sa_case
    priority_order = sa_case(
        (models.Case.priority_level == "critical", 0),
        (models.Case.priority_level == "high",     1),
        (models.Case.priority_level == "medium",   2),
        (models.Case.priority_level == "low",      3),
        else_=4
    )
    query = query.order_by(priority_order, models.Case.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

def update_case(
    db: Session, 
    case_id: int, 
    case_update: Dict[str, Any]
) -> Optional[models.Case]:
    db_case = get_case(db, case_id)
    if db_case:
        for key, value in case_update.items():
            if hasattr(db_case, key) and value is not None:
                setattr(db_case, key, value)
        
        db.commit()
        db.refresh(db_case)
    
    return db_case

# Location metadata operations
def get_location_metadata(
    db: Session, 
    latitude: float, 
    longitude: float
) -> Optional[models.LocationMetadata]:
    # Find existing metadata within 10 meters
    point_wkt = convert_to_point_wkt(latitude, longitude)
    
    return db.query(models.LocationMetadata).filter(
        func.ST_DWithin(
            models.LocationMetadata.location,
            func.ST_GeomFromText(point_wkt, 4326),
            10  # 10 meters tolerance
        )
    ).first()

def create_location_metadata(
    db: Session, 
    latitude: float, 
    longitude: float,
    osm_data: Dict[str, Any]
) -> models.LocationMetadata:
    from app.services.osm_service import OSMService
    
    metadata = OSMService.extract_location_metadata(osm_data, latitude, longitude)
    point_wkt = convert_to_point_wkt(latitude, longitude)
    
    db_metadata = models.LocationMetadata(
        latitude=latitude,
        longitude=longitude,
        location=func.ST_GeomFromText(point_wkt, 4326),
        osm_data=osm_data,
        land_use=metadata.get("land_use"),
        waterway_distance=metadata.get("waterway_distance"),
        protected_area=metadata.get("protected_area", False),
        sensitivity_score=metadata.get("sensitivity_score", 0)
    )
    
    db.add(db_metadata)
    db.commit()
    db.refresh(db_metadata)
    return db_metadata

def update_location_incident_count(
    db: Session, 
    latitude: float, 
    longitude: float
) -> None:
    """Increment historical incident count for location"""
    metadata = get_location_metadata(db, latitude, longitude)
    if metadata:
        metadata.historical_incident_count += 1
        db.commit()

def get_recent_incidents_near_location(
    db: Session,
    latitude: float,
    longitude: float,
    radius_m: float = 100,
    days: int = 30
) -> List[models.Report]:
    """Get recent reports near a location"""
    point_wkt = convert_to_point_wkt(latitude, longitude)
    date_threshold = datetime.utcnow() - timedelta(days=days)
    
    return db.query(models.Report).filter(
        and_(
            func.ST_DWithin(
                models.Report.location,
                func.ST_GeomFromText(point_wkt, 4326),
                radius_m / 111000  # Convert meters to degrees
            ),
            models.Report.report_date >= date_threshold,
            models.Report.status.in_([models.ReportStatus.ANALYZED, models.ReportStatus.PROCESSING])
        )
    ).all()

# Analytics operations
def get_analytics(db: Session) -> Dict[str, Any]:
    """Get system analytics"""
    # Total reports
    total_reports = db.query(func.count(models.Report.id)).scalar() or 0
    
    # Reports by status
    reports_by_status = dict(db.query(
        models.Report.status,
        func.count(models.Report.id)
    ).group_by(models.Report.status).all())
    
    # Cases by priority
    cases_by_priority = dict(db.query(
        models.Case.priority_level,
        func.count(models.Case.id)
    ).group_by(models.Case.priority_level).all())
    
    # Average response time (time from report to case completion)
    avg_response_time = None
    completed_cases = db.query(models.Case).filter(
        models.Case.status == models.CaseStatus.COMPLETED
    ).all()
    
    if completed_cases:
        total_seconds = 0
        count = 0
        for case in completed_cases:
            if case.report and case.completed_date:
                response_time = (case.completed_date - case.report.report_date).total_seconds()
                total_seconds += response_time
                count += 1
        
        if count > 0:
            avg_response_time = total_seconds / count
    
    # Top hotspots (locations with most incidents)
    top_hotspots = db.query(
        models.Report.latitude,
        models.Report.longitude,
        func.count(models.Report.id).label('incident_count')
    ).group_by(
        models.Report.latitude,
        models.Report.longitude
    ).order_by(
        func.count(models.Report.id).desc()
    ).limit(10).all()
    
    hotspots_data = []
    for hotspot in top_hotspots:
        hotspots_data.append({
            "latitude": hotspot.latitude,
            "longitude": hotspot.longitude,
            "incident_count": hotspot.incident_count
        })
    
    return {
        "total_reports": total_reports,
        "reports_by_status": reports_by_status,
        "cases_by_priority": cases_by_priority,
        "avg_response_time": avg_response_time,
        "top_hotspots": hotspots_data
    }

def get_heatmap_data(db: Session) -> List[Dict[str, Any]]:
    """Get data for heatmap visualization"""
    reports = db.query(
        models.Report.latitude,
        models.Report.longitude,
        models.AnalysisResult.priority_score
    ).join(
        models.AnalysisResult,
        models.Report.id == models.AnalysisResult.report_id
    ).filter(
        models.AnalysisResult.priority_score.isnot(None)
    ).all()
    
    heatmap_data = []
    for report in reports:
        from app.services.priority_service import PriorityService
        priority_level = PriorityService.get_priority_level(report.priority_score)
        
        heatmap_data.append({
            "latitude": report.latitude,
            "longitude": report.longitude,
            "intensity": report.priority_score / 100.0,  # Normalize to 0-1
            "priority_level": priority_level
        })
    
    return heatmap_data