# app/api/endpoints/ai.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pathlib import Path
from app import crud
from app.services.priority_service import PriorityService
import json

from app.database import get_db
from app.dependencies import get_current_admin
from app.services.ai_service import ai_service
from app.services.model_loader import model_loader

router = APIRouter()

@router.get("/model/info")
async def get_model_info(
    current_user = Depends(get_current_admin)
) -> Dict[str, Any]:
    """
    Get information about the current AI model.
    """
    return ai_service.get_model_info()

@router.get("/model/performance")
async def get_model_performance(
    current_user = Depends(get_current_admin),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get model performance statistics.
    """
    # Calculate accuracy metrics from recent reports
    recent_reports = crud.get_reports(db, limit=100, status="analyzed")
    
    total_reports = len(recent_reports)
    if total_reports == 0:
        return {
            "total_reports": 0,
            "avg_confidence": 0,
            "detection_rate": 0,
            "avg_processing_time": 0
        }
    
    total_confidence = 0
    detections_with_waste = 0
    total_processing_time = 0
    
    for report in recent_reports:
        if report.analysis:
            confidence = report.analysis.confidence_scores.get("overall", 0) if report.analysis.confidence_scores else 0
            total_confidence += confidence
            
            if report.analysis.waste_types:
                detections_with_waste += 1
            
            total_processing_time += report.analysis.processing_time or 0
    
    return {
        "total_reports": total_reports,
        "avg_confidence": round(total_confidence / total_reports, 3) if total_reports > 0 else 0,
        "detection_rate": round(detections_with_waste / total_reports, 3) if total_reports > 0 else 0,
        "avg_processing_time": round(total_processing_time / total_reports, 3) if total_reports > 0 else 0,
        "waste_distribution": get_waste_distribution(recent_reports)
    }

def get_waste_distribution(reports: List) -> Dict[str, int]:
    """Calculate waste type distribution from reports."""
    distribution = {}
    
    for report in reports:
        if report.analysis and report.analysis.waste_types:
            for waste_type in report.analysis.waste_types.keys():
                distribution[waste_type] = distribution.get(waste_type, 0) + 1
    
    return dict(sorted(distribution.items(), key=lambda x: x[1], reverse=True))

@router.post("/model/update-classes")
async def update_model_classes(
    classes_file: UploadFile = File(...),
    current_user = Depends(get_current_admin)
) -> Dict[str, Any]:
    """
    Update waste class definitions from uploaded file.
    
    File format: JSON with class_id: class_name mapping
    """
    try:
        content = await classes_file.read()
        classes_data = json.loads(content)
        
        # Validate classes data
        if not isinstance(classes_data, dict):
            raise HTTPException(status_code=400, detail="Invalid format. Expected JSON object.")
        
        # Update classes
        model_loader.update_classes(classes_data)
        
        return {
            "message": "Classes updated successfully",
            "classes": classes_data,
            "count": len(classes_data)
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/available")
async def get_available_models(
    current_user = Depends(get_current_admin)
) -> List[str]:
    """
    Get list of available model files.
    """
    return model_loader.get_available_models()

@router.post("/model/switch/{model_name}")
async def switch_model(
    model_name: str,
    current_user = Depends(get_current_admin)
) -> Dict[str, Any]:
    """
    Switch to a different model.
    """
    try:
        model_loader.load_model(model_name)
        # Reinitialize AI service with new model
        ai_service._load_model()
        
        return {
            "message": f"Switched to model {model_name}",
            "model_info": ai_service.get_model_info()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch model: {str(e)}")

@router.post("/model/test")
async def test_model(
    image: UploadFile = File(...),
    current_user = Depends(get_current_admin)
) -> Dict[str, Any]:
    """
    Test the AI model with an image and get detailed results.
    """
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Run analysis
        result = ai_service.analyze_image_bytes(image_bytes)
        
        return {
            "analysis": result,
            "model_info": ai_service.get_model_info(),
            "priority_level": PriorityService.get_priority_level(result["priority_score"]),
            "explanation": "Test analysis completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@router.post("/model/visualize")
async def visualize_detections(
    image: UploadFile = File(...),
    current_user = Depends(get_current_admin)
):
    """
    Get visualization of detections on image.
    """
    try:
        # Save uploaded image temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            content = await image.read()
            tmp.write(content)
            input_path = tmp.name
        
        # Create output path
        output_path = input_path.replace(".jpg", "_detections.jpg")
        
        # Generate visualization
        success = ai_service.visualize_detections(input_path, output_path)
        
        if not success or not Path(output_path).exists():
            raise HTTPException(status_code=500, detail="Failed to generate visualization")
        
        # Return the image
        from fastapi.responses import FileResponse
        return FileResponse(output_path, media_type="image/jpeg", 
                          filename="detections_visualization.jpg")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp files
        import os
        for path in [input_path, output_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass