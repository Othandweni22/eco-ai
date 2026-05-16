import os
from typing import Dict, Any
from app.config import settings

class ImageService:
    @staticmethod
    def get_image_url(image_path: str) -> str:
            """Generate URL for stored image"""
            if not image_path:
                return ""
            
            # Get the backend URL from environment or config
            # In development, your FastAPI backend is likely on port 8000
            backend_url = "http://localhost:8000"  # or use settings.BACKEND_URL
            
            # Normalize the path
            normalized_path = image_path.replace('\\', '/')
            
            # Remove /uploads prefix if it's already there to avoid duplication
            if normalized_path.startswith('/uploads/'):
                normalized_path = normalized_path[8:]  # Remove '/uploads/'
            
            return f"{backend_url}/uploads/{normalized_path}"

    @staticmethod
    def delete_image(image_path: str) -> bool:
        """Delete image file from storage"""
        try:
            full_path = settings.upload_dir / image_path
            if full_path.exists():
                os.remove(full_path)
                return True
        except Exception as e:
            print(f"Error deleting image {image_path}: {e}")
        
        return False
    
    @staticmethod
    def get_image_info(image_path: str) -> Dict[str, Any]:
        """Get image metadata"""
        full_path = settings.upload_dir / image_path
        
        if not full_path.exists():
            return {}
        
        try:
            from PIL import Image
            with Image.open(full_path) as img:
                return {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format,
                    "mode": img.mode,
                    "size": full_path.stat().st_size
                }
        except Exception:
            return {}