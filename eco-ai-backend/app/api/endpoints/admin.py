from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime as dt

from app import crud, schemas, models
from app.database import get_db
from app.dependencies import get_current_officer, get_current_admin
from app.services.image_service import ImageService
from app.api.endpoints.reports import convert_report_to_schema

router = APIRouter()

# ── Pydantic request bodies ───────────────────────────────────────────────────

class RoleUpdate(BaseModel):
    role: schemas.UserRole

class ActiveUpdate(BaseModel):
    is_active: bool

class UserAdminCreate(BaseModel):
    email: str
    full_name: str
    role: schemas.UserRole = schemas.UserRole.CITIZEN
    password: str

class CaseUpdate(BaseModel):
    """
    Flexible case update — every field is optional so the frontend
    can send any subset without triggering a 422.
    """
    status: Optional[str] = None
    assigned_officer_id: Optional[int] = None
    scheduled_date: Optional[str] = None       # YYYY-MM-DD or full ISO
    estimated_cleanup_cost: Optional[float] = None
    notes: Optional[str] = None
    priority_level: Optional[str] = None


# ── User management ───────────────────────────────────────────────────────────

@router.get("/users", response_model=List[schemas.User])
def list_users(
    role: Optional[str] = None,
    current_user: schemas.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = crud.get_users(db, skip=0, limit=1000)
    if role:
        users = [u for u in users if u.role.value == role]
    return users


@router.post("/users", response_model=schemas.User, status_code=201)
def create_user_admin(
    body: UserAdminCreate,
    current_user: schemas.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    existing = crud.get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    from app import utils
    db_user = models.User(
        email=body.email,
        full_name=body.full_name,
        role=body.role,
        password_hash=utils.hash(body.password),
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    body: dict,
    current_user: schemas.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    allowed = {"full_name", "role", "is_active"}
    for key, value in body.items():
        if key in allowed:
            if key == "role":
                db_user.role = models.UserRole(value)
            else:
                setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.patch("/users/{user_id}/role", response_model=schemas.User)
def update_user_role(
    user_id: int,
    body: RoleUpdate,
    current_user: schemas.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    db_user.role = models.UserRole(body.role)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.patch("/users/{user_id}/active", response_model=schemas.User)
def toggle_user_active(
    user_id: int,
    body: ActiveUpdate,
    current_user: schemas.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    db_user.is_active = body.is_active
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: schemas.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db_user = crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}


# ── Case endpoints ────────────────────────────────────────────────────────────

@router.get("/cases", response_model=List[schemas.CaseWithReport])
def read_cases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority_level: Optional[str] = None,
    assigned_officer_id: Optional[int] = None,
    current_user: schemas.User = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    cases = crud.get_cases(
        db, skip=skip, limit=limit, status=status,
        priority_level=priority_level,
        assigned_officer_id=assigned_officer_id,
    )
    return [convert_case_to_schema(c) for c in cases]


@router.get("/cases/{case_id}", response_model=schemas.CaseWithReport)
def read_case(
    case_id: int,
    current_user: schemas.User = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    db_case = crud.get_case(db, case_id=case_id)
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return convert_case_to_schema(db_case)


@router.put("/cases/{case_id}")
def update_case(
    case_id: int,
    case_update: CaseUpdate,
    current_user: schemas.User = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    """
    Update a case. Accepts any subset of fields — nothing is required.
    The frontend can send just { status } or just { assigned_officer_id }
    without triggering a 422.
    """
    db_case = crud.get_case(db, case_id)
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")

    # Only process fields the client actually sent
    sent = case_update.dict(exclude_unset=True)

    if "status" in sent and sent["status"] is not None:
        try:
            db_case.status = models.CaseStatus(sent["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {sent['status']}")

    if "priority_level" in sent and sent["priority_level"] is not None:
        db_case.priority_level = sent["priority_level"]

    if "assigned_officer_id" in sent:
        # Allow null to unassign
        db_case.assigned_officer_id = sent["assigned_officer_id"]

    if "scheduled_date" in sent:
        if sent["scheduled_date"]:
            try:
                # Accept YYYY-MM-DD or full ISO datetime
                raw = sent["scheduled_date"]
                if "T" in raw:
                    db_case.scheduled_date = dt.fromisoformat(raw)
                else:
                    db_case.scheduled_date = dt.strptime(raw, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid date: {sent['scheduled_date']}")
        else:
            db_case.scheduled_date = None

    if "estimated_cleanup_cost" in sent:
        db_case.estimated_cleanup_cost = sent["estimated_cleanup_cost"]

    if "notes" in sent:
        db_case.notes = sent["notes"]

    db_case.updated_at = dt.utcnow()
    db.commit()
    db.refresh(db_case)
    return convert_case_to_schema(db_case)


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=schemas.AnalyticsData)
def get_analytics(
    current_user: schemas.User = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    return schemas.AnalyticsData(**crud.get_analytics(db))


@router.get("/analytics/detailed")
def get_detailed_analytics(
    days: int = Query(30),
    current_user: schemas.User = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    from datetime import timedelta
    from app.services.priority_service import PriorityService

    date_threshold = dt.utcnow() - timedelta(days=days)
    reports = db.query(models.Report).filter(
        models.Report.report_date >= date_threshold,
        models.Report.status == models.ReportStatus.ANALYZED,
    ).all()

    total = len(reports)
    ai = {
        "total_processed": total,
        "reports_with_detections": 0,
        "avg_confidence": 0,
        "avg_processing_time": 0,
        "waste_type_distribution": {},
        "priority_distribution": {"critical": 0, "high": 0, "medium": 0, "low": 0, "monitor": 0},
    }

    total_conf = 0.0
    total_time = 0.0
    with_detections = 0

    for r in reports:
        if r.analysis:
            conf = (r.analysis.confidence_scores or {}).get("overall", 0)
            total_conf += conf
            total_time += r.analysis.processing_time or 0
            if r.analysis.waste_types:
                with_detections += 1
                for wt in r.analysis.waste_types:
                    ai["waste_type_distribution"][wt] = ai["waste_type_distribution"].get(wt, 0) + 1
            lvl = PriorityService.get_priority_level(r.analysis.priority_score or 50)
            ai["priority_distribution"][lvl] = ai["priority_distribution"].get(lvl, 0) + 1

    if total > 0:
        ai["reports_with_detections"] = with_detections
        ai["detection_rate"] = round(with_detections / total * 100, 1)
        ai["avg_confidence"] = round(total_conf / total, 3)
        ai["avg_processing_time"] = round(total_time / total, 3)

    ai["waste_type_distribution"] = dict(
        sorted(ai["waste_type_distribution"].items(), key=lambda x: x[1], reverse=True)
    )

    return {
        **crud.get_analytics(db),
        "ai_performance": ai,
        "analysis_period_days": days,
        "period_start": date_threshold.isoformat(),
        "period_end": dt.utcnow().isoformat(),
    }


@router.get("/heatmap")
def get_heatmap(
    current_user: schemas.User = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    return {"heatmap": crud.get_heatmap_data(db)}


@router.get("/reports/unprocessed", response_model=List[schemas.Report])
def get_unprocessed_reports(
    skip: int = 0,
    limit: int = 50,
    current_user: schemas.User = Depends(get_current_officer),
    db: Session = Depends(get_db),
):
    reports = crud.get_reports(db, skip=skip, limit=limit, status="pending")
    return [convert_report_to_schema(r) for r in reports]


@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    current_user: schemas.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    db_report = crud.get_report(db, report_id)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if db_report.image_path:
        ImageService.delete_image(db_report.image_path)
    if db_report.thumbnail_path:
        ImageService.delete_image(db_report.thumbnail_path)
    db.delete(db_report)
    db.commit()
    return {"message": "Report deleted successfully"}


# ── Helper ────────────────────────────────────────────────────────────────────

def convert_case_to_schema(db_case: models.Case) -> schemas.CaseWithReport:
    case_data = {
        "id": db_case.id,
        "report_id": db_case.report_id,
        "assigned_officer_id": db_case.assigned_officer_id,
        "priority_level": db_case.priority_level.value if hasattr(db_case.priority_level, "value") else db_case.priority_level,
        "estimated_cleanup_cost": db_case.estimated_cleanup_cost,
        "scheduled_date": db_case.scheduled_date,
        "completed_date": db_case.completed_date,
        "status": db_case.status.value if hasattr(db_case.status, "value") else db_case.status,
        "notes": db_case.notes,
        "created_at": db_case.created_at,
        "updated_at": db_case.updated_at,
        "report": None,
    }
    if db_case.report:
        case_data["report"] = convert_report_to_schema(db_case.report)
    return schemas.CaseWithReport(**case_data)
