from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
import json

from app import crud, schemas, models
from app.database import get_db
from app.dependencies import get_current_user, get_current_active_user
from app.utils import save_uploaded_image
from app.services.mock_ai_service import MockAIService
from app.services.priority_service import PriorityService
from app.services.osm_service import OSMService
from app.services.ai_service import ai_service
from app.services.image_service import ImageService

router = APIRouter()

@router.post("/reports", response_model=schemas.Report)
async def create_report(
    background_tasks: BackgroundTasks,
    description: Optional[str] = None,
    latitude: float = Form(...),  # Changed from Depends to Form
    longitude: float = Form(...),  # Changed from Depends to Form
    image: UploadFile = File(...),
    current_user: schemas.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new illegal dumping report with image upload.
    """
    # Save uploaded image
    original_path, thumbnail_path = save_uploaded_image(image)
    
    # Create report in database
    db_report = crud.create_report(
        db=db,
        user_id=current_user.id,
        image_path=str(original_path.relative_to("uploads")).replace('\\', '/'),
        thumbnail_path=str(thumbnail_path.relative_to("uploads")).replace('\\', '/') if thumbnail_path else None,
        latitude=latitude,
        longitude=longitude,
        description=description
    )
    
    # Start background processing
    background_tasks.add_task(
        process_report_async,
        db_report.id,
        latitude,
        longitude,
        str(original_path)
    )
    
    # Convert to response schema
    return convert_report_to_schema(db_report)

@router.get("/reports", response_model=List[schemas.Report])
def read_reports(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve reports. Officers/admins see all, citizens see only their own.
    """
    if current_user.role in [schemas.UserRole.CITIZEN]:
        reports = crud.get_reports(
            db, skip=skip, limit=limit, user_id=current_user.id, status=status
        )
    else:
        reports = crud.get_reports(db, skip=skip, limit=limit, status=status)
    
    return [convert_report_to_schema(report) for report in reports]

@router.get("/reports/{report_id}", response_model=schemas.Report)
def read_report(
    report_id: int,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific report by ID.
    """
    db_report = crud.get_report(db, report_id=report_id)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if (current_user.role == schemas.UserRole.CITIZEN and 
        db_report.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return convert_report_to_schema(db_report)

@router.get("/reports/nearby")
def get_nearby_reports(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
    db: Session = Depends(get_db)
):
    """
    Get reports near a location (public endpoint).
    """
    # This is a simplified version - in production, use PostGIS spatial queries
    all_reports = crud.get_reports(db, skip=0, limit=100)
    
    nearby_reports = []
    for report in all_reports:
        # Calculate distance (simplified - would use PostGIS in production)
        from app.utils import calculate_distance
        distance = calculate_distance(
            latitude, longitude,
            report.latitude, report.longitude
        )
        
        if distance <= radius_km * 1000:  # Convert km to meters
            nearby_reports.append({
                "id": report.id,
                "latitude": report.latitude,
                "longitude": report.longitude,
                "distance_m": int(distance),
                "report_date": report.report_date
            })
    
    return {"reports": nearby_reports, "count": len(nearby_reports)}


async def process_report_async(report_id: int, latitude: float, longitude: float, image_path: str):
    """
    Process report asynchronously with real AI analysis.
    """
    from app.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Update report status
        report = crud.get_report(db, report_id)
        if not report:
            return
        
        report.status = models.ReportStatus.PROCESSING
        db.commit()
        
        print(f"Starting AI analysis for report {report_id}...")
        
        # 1. Real AI analysis
        ai_result = ai_service.analyze_image(image_path)
        
        print(f"AI analysis completed for report {report_id}. Detections: {len(ai_result.get('detections', []))}")
        
        # 2. Get or fetch OSM data
        location_metadata = crud.get_location_metadata(db, latitude, longitude)
        if not location_metadata:
            print(f"Fetching OSM data for report {report_id}...")
            osm_data = OSMService.get_location_metadata(latitude, longitude)
            location_metadata = crud.create_location_metadata(db, latitude, longitude, osm_data)
        
        # 3. Calculate comprehensive priority score
        priority_score, component_scores = PriorityService.calculate_priority_score(
            db=db,
            ai_analysis=ai_result,
            latitude=latitude,
            longitude=longitude,
            report_date=report.report_date,
            image_analysis=ai_result.get("image_analysis")
        )
        
        ai_result["priority_score"] = priority_score
        ai_result["component_scores"] = component_scores
        
        # 4. Create analysis result with extended data
        analysis_data = {
            **ai_result,
            "component_scores": component_scores,
            "priority_level": PriorityService.get_priority_level(priority_score),
            "priority_explanation": PriorityService.generate_priority_explanation(
                component_scores, ai_result
            )
        }
        
        crud.create_analysis_result(db, report_id, analysis_data)
        
        # 5. Update location incident count
        crud.update_location_incident_count(db, latitude, longitude)
        
        # 6. Create case if priority score is above threshold
        if priority_score >= 30:  # Threshold for creating a case
            case = crud.create_case(db, report_id, priority_score)
            
            # Generate notification for high priority cases
            if priority_score >= 70:
                from app.api.websocket import send_notification
                send_notification("high_priority_case", {
                    "case_id": case.id,
                    "report_id": report_id,
                    "priority_score": priority_score,
                    "priority_level": PriorityService.get_priority_level(priority_score),
                    "location": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        # 7. Update report status
        report.status = models.ReportStatus.ANALYZED
        db.commit()
        
        print(f"Report {report_id} processed successfully. Priority: {priority_score}")
        
        # Log successful processing
        log_processing_result(report_id, ai_result, priority_score)
        
    except Exception as e:
        print(f"Error processing report {report_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Update report status to indicate error
        report = crud.get_report(db, report_id)
        if report:
            report.status = models.ReportStatus.PENDING
            db.commit()
    finally:
        db.close()

def log_processing_result(report_id: int, ai_result: Dict, priority_score: int):
    """Log processing results for monitoring."""
    detection_count = len(ai_result.get("detections", []))
    processing_time = ai_result.get("processing_time", 0)
    
    log_entry = {
        "report_id": report_id,
        "timestamp": datetime.utcnow().isoformat(),
        "detection_count": detection_count,
        "priority_score": priority_score,
        "processing_time": processing_time,
        "ai_model_version": ai_result.get("ai_model_version", "unknown")
    }
    
    # You could save this to a log file or database table
    print(f"Processing log: {json.dumps(log_entry)}")


# Helper function to convert DB model to response schema
def convert_report_to_schema(db_report: models.Report) -> schemas.Report:
    """Convert database report model to API response schema."""
    report_data = {
        "id": db_report.id,
        "user_id": db_report.user_id,
        "image_url": ImageService.get_image_url(db_report.image_path),
        "thumbnail_url": ImageService.get_image_url(db_report.thumbnail_path) if db_report.thumbnail_path else None,
        "latitude": db_report.latitude,
        "longitude": db_report.longitude,
        "description": db_report.description,
        "report_date": db_report.report_date,
        "status": db_report.status.value,
        "analysis": None
    }
    
    # Include analysis results if available
    if db_report.analysis:
        report_data["analysis"] = {
            "waste_types": db_report.analysis.waste_types or {},
            "confidence_scores": db_report.analysis.confidence_scores or {},
            "priority_score": db_report.analysis.priority_score or 50,
            "risk_factors": db_report.analysis.risk_factors or [],
            "ai_model_version": db_report.analysis.ai_model_version or "unknown",
            "processing_time": db_report.analysis.processing_time or 0,
            # detected_items stored in the extra JSON blob if present
            "detected_items": db_report.analysis.detected_items or [],
        }
    
    return schemas.Report(**report_data)