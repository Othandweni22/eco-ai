from fastapi import status, Depends, APIRouter
from app import schemas
from app import models
from app.database import get_db
from sqlalchemy.orm import Session
from app import utils

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut
)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        password_hash=utils.hash(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
