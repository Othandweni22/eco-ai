import uuid
# import magic
import filetype
from pathlib import Path
from fastapi import UploadFile, HTTPException
from typing import Tuple
from PIL import Image
from app.config import settings
from passlib.context import CryptContext  # type: ignore


pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

def hash(password: str):
    return pwd_context.hash(password)


def verify(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset pointer

    if file_size > settings.max_upload_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.max_upload_size / 1024 / 1024}MB",
        )

    # Detect file type using 'filetype'
    kind = filetype.guess(file.file.read(2048))
    file.file.seek(0)  # Reset pointer

    if kind is None or kind.mime not in settings.allowed_image_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_image_types)}",
        )
    
def save_uploaded_image(file: UploadFile) -> Tuple[Path, Path]:
    """Save uploaded image and create thumbnail"""
    validate_image_file(file)

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Create date-based directory structure
    from datetime import datetime

    now = datetime.now()
    year_month_dir = settings.upload_dir / str(now.year) / f"{now.month:02d}"
    year_month_dir.mkdir(parents=True, exist_ok=True)

    # Save original image
    original_path = year_month_dir / f"original_{unique_filename}"

    with open(original_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)

    # Create thumbnail
    thumbnail_path = year_month_dir / f"thumbnail_{unique_filename}"
    create_thumbnail(original_path, thumbnail_path)

    # FIX: Convert paths to use forward slashes when storing in database
    # The actual files are saved correctly, but the stored path needs normalization
    return original_path, thumbnail_path


def create_thumbnail(
    original_path: Path, thumbnail_path: Path, size: Tuple[int, int] = (300, 300)
) -> None:
    """Create thumbnail from original image"""
    try:
        with Image.open(original_path) as img:
            img.thumbnail(size)
            img.save(thumbnail_path, "JPEG", quality=85)
    except Exception as e:
        # If thumbnail creation fails, we'll just use the original
        print(f"Thumbnail creation failed: {e}")
        thumbnail_path = original_path


def get_relative_path(full_path: Path) -> str:
    """Convert absolute path to relative path for storage"""
    return str(full_path.relative_to(settings.upload_dir))


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in meters using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2

    R = 6371000  # Earth's radius in meters

    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def convert_to_point_wkt(latitude: float, longitude: float) -> str:
    """Convert latitude/longitude to WKT point string"""
    return f"POINT({longitude} {latitude})"
