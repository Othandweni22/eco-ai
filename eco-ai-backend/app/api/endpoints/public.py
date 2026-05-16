from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.config import settings

router = APIRouter()

@router.get("/stats/area")
def get_area_statistics(
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
    db: Session = Depends(get_db)
):
    """
    Get anonymous statistics for an area (public endpoint).
    """
    # Get reports in area
    from app.api.endpoints.reports import get_nearby_reports
    nearby_data = get_nearby_reports(latitude, longitude, radius_km, db)
    
    # Count by status
    all_reports = crud.get_reports(db)
    reports_in_area = []
    
    for report in all_reports:
        from app.utils import calculate_distance
        distance = calculate_distance(
            latitude, longitude,
            report.latitude, report.longitude
        )
        
        if distance <= radius_km * 1000:
            reports_in_area.append(report)
    
    # Calculate statistics
    total = len(reports_in_area)
    by_status = {}
    by_priority = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    
    for report in reports_in_area:
        # Count by status
        status_key = report.status.value
        by_status[status_key] = by_status.get(status_key, 0) + 1
        
        # Count by priority if analyzed
        if report.analysis and report.analysis.priority_score:
            from app.services.priority_service import PriorityService
            priority = PriorityService.get_priority_level(report.analysis.priority_score)
            by_priority[priority] = by_priority.get(priority, 0) + 1
    
    return {
        "total_reports": total,
        "reports_by_status": by_status,
        "reports_by_priority": by_priority,
        "recent_reports": nearby_data["reports"][:5]  # Last 5 reports
    }

@router.get("/images/{image_path:path}")
async def get_image(image_path: str):
    """
    Serve uploaded images (public endpoint with path validation).
    """
    # Security check: prevent directory traversal
    # safe_path = Path(image_path).resolve()
    full_path = settings.upload_dir / image_path
    
    # Ensure the path is within upload directory
    try:
        full_path.relative_to(settings.upload_dir)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(full_path)