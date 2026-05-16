import time
import random
from typing import Dict, List, Tuple
from app.config import settings

class MockAIService:
    """Mock AI service for Phase 1 - simulates waste detection"""
    
    WASTE_TYPES = [
        "construction_waste",
        "furniture", 
        "appliances",
        "hazardous_materials",
        "plastic_waste",
        "organic_waste",
        "metal_scrap",
        "electronics",
        "tires",
        "clothing_textiles"
    ]
    
    RISK_FACTORS = [
        "waterway_proximity",
        "hazardous_materials",
        "high_traffic_area",
        "protected_area",
        "residential_zone",
        "recurring_location",
        "large_volume",
        "blocking_access",
        "near_school",
        "near_hospital"
    ]
    
    @staticmethod
    def analyze_image(image_path: str, latitude: float, longitude: float) -> Dict:
        """Mock AI analysis of an image"""
        # Simulate processing time
        time.sleep(settings.mock_ai_delay)
        
        # Generate random waste detections (1-3 types)
        num_wastes = random.randint(1, 3)
        detected_wastes = random.sample(MockAIService.WASTE_TYPES, num_wastes)
        
        waste_types = {}
        for waste in detected_wastes:
            waste_types[waste] = round(random.uniform(0.5, 0.95), 2)
        
        # Generate random risk factors (0-4 factors)
        num_risks = random.randint(0, 4)
        risk_factors = random.sample(MockAIService.RISK_FACTORS, num_risks)
        
        # Calculate mock priority score based on detected wastes
        base_score = sum(waste_types.values()) / len(waste_types) * 50
        base_score += len(risk_factors) * 10
        base_score = min(100, max(1, int(base_score + random.uniform(-10, 10))))
        
        return {
            "waste_types": waste_types,
            "confidence_scores": {
                "overall": round(random.uniform(0.6, 0.95), 2),
                "waste_present": round(random.uniform(0.7, 0.98), 2)
            },
            "priority_score": base_score,
            "risk_factors": risk_factors,
            "ai_model_version": "mock_v1.0",
            "processing_time": settings.mock_ai_delay
        }
    
    @staticmethod
    def get_priority_level(score: int) -> str:
        """Convert priority score to level"""
        if score >= 80:
            return "critical"
        elif score >= 60:
            return "high"
        elif score >= 40:
            return "medium"
        else:
            return "low"