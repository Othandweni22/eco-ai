# app/services/priority_service.py (Updated)
import math
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, crud
from app.utils import calculate_distance

class PriorityService:
    """Enhanced priority service with AI integration"""
    
    # Weights for different factors
    WEIGHTS = {
        "ai_detection": 0.35,      # AI waste detection confidence and types
        "location_sensitivity": 0.25, # OSM location data
        "historical_incidents": 0.20, # Previous incidents at location
        "temporal_factors": 0.10,    # Time-based factors
        "weather_impact": 0.05,      # Weather conditions (future enhancement)
        "social_vulnerability": 0.05, # Nearby vulnerable populations (future)
    }
    
    # Hazard multipliers for different waste types
    HAZARD_MULTIPLIERS = {
        "hazardous_materials": 3.0,
        "electronics": 2.5,
        "tires": 2.0,
        "metal_scrap": 1.8,
        "appliances": 1.7,
        "construction_waste": 1.5,
        "vehicle_part": 1.5,
        "mattress": 1.3,
        "furniture": 1.2,
        "plastic_waste": 1.1,
        "pallets": 1.1,
        "green_waste": 1.0,
        "organic_waste": 1.0,
        "clothing_textiles": 0.9,
        "garbage_bags": 0.8,
    }
    
    @staticmethod
    def calculate_priority_score(
        db: Session,
        ai_analysis: Dict[str, Any],
        latitude: float,
        longitude: float,
        report_date: datetime,
        image_analysis: Optional[Dict] = None
    ) -> Tuple[int, Dict[str, float]]:
        """
        Calculate comprehensive priority score (1-100) with component scores
        
        Returns:
            Tuple of (priority_score, component_scores)
        """
        component_scores = {}
        
        # 1. AI Detection Score (weight: 35%)
        ai_score = PriorityService._calculate_ai_detection_score(ai_analysis, image_analysis)
        component_scores["ai_detection"] = ai_score
        
        # 2. Location Sensitivity Score (weight: 25%)
        location_score = PriorityService._get_location_sensitivity_score(db, latitude, longitude)
        component_scores["location_sensitivity"] = location_score
        
        # 3. Historical Incidents Score (weight: 20%)
        historical_score = PriorityService._calculate_historical_score(db, latitude, longitude)
        component_scores["historical_incidents"] = historical_score
        
        # 4. Temporal Factors Score (weight: 10%)
        temporal_score = PriorityService._calculate_temporal_score(report_date)
        component_scores["temporal_factors"] = temporal_score
        
        # 5. Weather Impact Score (weight: 5%) - Future enhancement
        weather_score = PriorityService._get_weather_score(latitude, longitude, report_date)
        component_scores["weather_impact"] = weather_score
        
        # 6. Social Vulnerability Score (weight: 5%) - Future enhancement
        social_score = PriorityService._get_social_vulnerability_score(latitude, longitude)
        component_scores["social_vulnerability"] = social_score
        
        # Calculate weighted sum
        total_score = 0
        for factor, weight in PriorityService.WEIGHTS.items():
            total_score += component_scores.get(factor, 50) * weight
        
        # Apply risk factors multiplier
        risk_multiplier = PriorityService._calculate_risk_multiplier(ai_analysis.get("risk_factors", []))
        total_score *= risk_multiplier
        
        # Ensure score is within bounds
        priority_score = int(round(min(100, max(1, total_score))))
        
        return priority_score, component_scores
    
    @staticmethod
    def _calculate_ai_detection_score(ai_analysis: Dict[str, Any], image_analysis: Optional[Dict]) -> float:
        """Calculate score based on AI detection results"""
        waste_types = ai_analysis.get("waste_types", {})
        confidence_scores = ai_analysis.get("confidence_scores", {})
        
        if not waste_types:
            return 20.0  # Low score if no waste detected
        
        # Base score from overall confidence
        overall_confidence = confidence_scores.get("overall", 0.5)
        base_score = overall_confidence * 60
        
        # Add for hazardous materials
        hazard_bonus = 0
        for waste_type, confidence in waste_types.items():
            hazard_multiplier = PriorityService.HAZARD_MULTIPLIERS.get(waste_type, 1.0)
            hazard_bonus += confidence * 20 * (hazard_multiplier - 1.0)
        
        # Add for volume/density (if image analysis available)
        volume_bonus = 0
        if image_analysis:
            detection_count = image_analysis.get("detection_count", 0)
            total_area = image_analysis.get("total_area", 0)
            
            if detection_count > 5:
                volume_bonus += 15
            elif detection_count > 2:
                volume_bonus += 10
            
            if total_area > 50000:  # Large area
                volume_bonus += 10
        
        total_score = base_score + hazard_bonus + volume_bonus
        
        return min(100.0, total_score)
    
    @staticmethod
    def _get_location_sensitivity_score(db: Session, latitude: float, longitude: float) -> float:
        """Get location sensitivity score from OSM data"""
        location_metadata = crud.get_location_metadata(db, latitude, longitude)
        
        if not location_metadata:
            return 50.0  # Default score
        
        score = 50.0
        
        # Adjust based on OSM features
        if location_metadata.protected_area:
            score += 25
        
        if location_metadata.waterway_distance:
            if location_metadata.waterway_distance < 25:
                score += 30
            elif location_metadata.waterway_distance < 50:
                score += 20
            elif location_metadata.waterway_distance < 100:
                score += 10
        
        # Land use adjustments
        land_use = location_metadata.land_use or ""
        if land_use in ["residential", "school", "hospital", "park"]:
            score += 15
        elif land_use in ["industrial", "commercial", "construction"]:
            score += 5
        elif land_use in ["farmland", "forest", "meadow"]:
            score += 10
        
        # Use cached sensitivity score if available
        if location_metadata.sensitivity_score:
            score = location_metadata.sensitivity_score
        
        return min(100.0, max(0.0, score))
    
    @staticmethod
    def _calculate_historical_score(db: Session, latitude: float, longitude: float) -> float:
        """Calculate score based on historical incidents"""
        # Get incidents in last 90 days within 50m radius
        recent_incidents = crud.get_recent_incidents_near_location(
            db, latitude, longitude, radius_m=50, days=90
        )
        
        count = len(recent_incidents)
        
        if count == 0:
            return 30.0
        elif count == 1:
            return 50.0
        elif count <= 3:
            return 70.0
        elif count <= 6:
            return 85.0
        else:
            return 95.0
    
    @staticmethod
    def _calculate_temporal_score(report_date: datetime) -> float:
        """Calculate score based on temporal factors"""
        score = 50.0
        
        # Weekend or holiday bonus
        if report_date.weekday() >= 5:  # Saturday or Sunday
            score += 10
        
        # Night time bonus (10pm to 6am)
        hour = report_date.hour
        if hour >= 22 or hour < 6:
            score += 15
        
        # Rush hour bonus (likely more visible)
        if (7 <= hour <= 9) or (16 <= hour <= 18):
            score += 5
        
        return min(100.0, score)
    
    @staticmethod
    def _get_weather_score(latitude: float, longitude: float, report_date: datetime) -> float:
        """Get weather impact score (placeholder for future integration)"""
        # TODO: Integrate with weather API
        # For now, return base score
        return 50.0
    
    @staticmethod
    def _get_social_vulnerability_score(latitude: float, longitude: float) -> float:
        """Get social vulnerability score (placeholder for future integration)"""
        # TODO: Integrate with census/demographic data
        # For now, return base score
        return 50.0
    
    @staticmethod
    def _calculate_risk_multiplier(risk_factors: List[str]) -> float:
        """Calculate multiplier based on risk factors"""
        if not risk_factors:
            return 1.0
        
        multiplier = 1.0
        
        # Apply multipliers for specific risk factors
        risk_multipliers = {
            "hazardous_materials_present": 1.3,
            "large_volume": 1.2,
            "construction_dumping": 1.15,
            "appliance_dumping": 1.1,
            "furniture_dumping": 1.05,
            "mixed_waste_types": 1.05,
        }
        
        for risk_factor in risk_factors:
            if risk_factor in risk_multipliers:
                multiplier *= risk_multipliers[risk_factor]
        
        return min(1.5, multiplier)  # Cap at 1.5x
    
    @staticmethod
    def get_priority_level(score: int) -> str:
        """Convert score to priority level with detailed thresholds"""
        if score >= 85:
            return "critical"
        elif score >= 70:
            return "high"
        elif score >= 50:
            return "medium"
        elif score >= 30:
            return "low"
        else:
            return "monitor"  # Very low priority - just monitor
    
    @staticmethod
    def get_priority_color(level: str) -> str:
        """Get color for priority level"""
        colors = {
            "critical": "#ff4444",  # Red
            "high": "#ffaa00",      # Orange
            "medium": "#ffdd00",    # Yellow
            "low": "#44ff44",       # Green
            "monitor": "#aaaaaa"    # Gray
        }
        return colors.get(level, "#aaaaaa")
    
    @staticmethod
    def get_response_time(level: str) -> Tuple[int, str]:
        """Get recommended response time for priority level"""
        response_times = {
            "critical": (4, "hours"),
            "high": (24, "hours"),
            "medium": (72, "hours"),
            "low": (7, "days"),
            "monitor": (30, "days")
        }
        return response_times.get(level, (30, "days"))
    
    @staticmethod
    def generate_priority_explanation(component_scores: Dict[str, float], 
                                    ai_analysis: Dict[str, Any]) -> str:
        """Generate human-readable explanation of priority score"""
        explanations = []
        
        # AI Detection explanation
        ai_score = component_scores.get("ai_detection", 0)
        if ai_score >= 70:
            explanations.append("High confidence waste detection")
        elif ai_score >= 40:
            explanations.append("Moderate waste detection")
        else:
            explanations.append("Limited waste detection")
        
        # Location explanation
        location_score = component_scores.get("location_sensitivity", 0)
        if location_score >= 70:
            explanations.append("Sensitive location (waterways/protected areas)")
        elif location_score >= 50:
            explanations.append("Moderately sensitive location")
        
        # Historical incidents explanation
        historical_score = component_scores.get("historical_incidents", 0)
        if historical_score >= 70:
            explanations.append("Recurring dumping location")
        elif historical_score >= 50:
            explanations.append("Some previous incidents nearby")
        
        # Add specific waste types if detected
        waste_types = ai_analysis.get("waste_types", {})
        if waste_types:
            top_wastes = sorted(waste_types.items(), key=lambda x: x[1], reverse=True)[:3]
            waste_names = [w[0].replace('_', ' ') for w in top_wastes]
            explanations.append(f"Detected: {', '.join(waste_names)}")
        
        # Risk factors
        risk_factors = ai_analysis.get("risk_factors", [])
        if risk_factors:
            factor_text = ', '.join([rf.replace('_', ' ') for rf in risk_factors[:2]])
            explanations.append(f"Risk factors: {factor_text}")
        
        return ". ".join(explanations) + "."
    
# from typing import Dict, List
# from datetime import datetime
# from sqlalchemy.orm import Session
# from app import crud

# class PriorityService:
#     """Service for calculating priority scores with OSM integration"""
    
#     @staticmethod
#     def calculate_priority_score(
#         db: Session,
#         waste_types: Dict[str, float],
#         latitude: float,
#         longitude: float,
#         risk_factors: List[str],
#         report_date: datetime
#     ) -> int:
#         """Calculate priority score (1-100)"""
#         base_score = 0
        
#         # 1. Waste type scoring (weight: 40%)
#         waste_score = PriorityService._calculate_waste_score(waste_types)
#         base_score += waste_score * 0.4
        
#         # 2. Location sensitivity from OSM (weight: 30%)
#         location_score = PriorityService._get_location_sensitivity(db, latitude, longitude)
#         base_score += location_score * 0.3
        
#         # 3. Temporal factors (weight: 10%)
#         temporal_score = PriorityService._calculate_temporal_score(report_date)
#         base_score += temporal_score * 0.1
        
#         # 4. Historical incidents (weight: 20%)
#         historical_score = PriorityService._calculate_historical_score(db, latitude, longitude)
#         base_score += historical_score * 0.2
        
#         # Add risk factor bonuses
#         risk_bonus = len(risk_factors) * 5
#         base_score = min(100, base_score + risk_bonus)
        
#         return int(round(base_score))
    
#     @staticmethod
#     def _calculate_waste_score(waste_types: Dict[str, float]) -> float:
#         """Calculate score based on waste types and confidence"""
#         if not waste_types:
#             return 0
        
#         # Hazardous materials get higher weight
#         hazardous_wastes = ["hazardous_materials", "electronics", "tires"]
        
#         total_score = 0
#         for waste_type, confidence in waste_types.items():
#             weight = 1.5 if waste_type in hazardous_wastes else 1.0
#             total_score += confidence * 100 * weight
        
#         return min(100, total_score / len(waste_types))
    
#     @staticmethod
#     def _get_location_sensitivity(db: Session, latitude: float, longitude: float) -> float:
#         """Get location sensitivity score from OSM data"""
#         # Get or fetch location metadata
#         location_metadata = crud.get_location_metadata(db, latitude, longitude)
        
#         if not location_metadata:
#             # If no OSM data yet, use default score
#             return 50.0
        
#         score = 50  # Base score
        
#         # Adjust based on OSM features
#         if location_metadata.protected_area:
#             score += 30
#         if location_metadata.waterway_distance and location_metadata.waterway_distance < 50:
#             score += 25
#         elif location_metadata.waterway_distance and location_metadata.waterway_distance < 100:
#             score += 15
        
#         # Land use adjustments
#         if location_metadata.land_use in ["residential", "school", "hospital"]:
#             score += 20
#         elif location_metadata.land_use in ["industrial", "commercial"]:
#             score -= 10
        
#         return min(100, max(0, score))
    
#     @staticmethod
#     def _calculate_temporal_score(report_date: datetime) -> float:
#         """Calculate score based on temporal factors"""
#         score = 50  # Base score
        
#         # Weekend or night reports get higher priority
#         if report_date.weekday() >= 5:  # Saturday or Sunday
#             score += 15
        
#         hour = report_date.hour
#         if hour >= 22 or hour < 6:  # Night time
#             score += 10
        
#         return score
    
#     @staticmethod
#     def _calculate_historical_score(db: Session, latitude: float, longitude: float) -> float:
#         """Calculate score based on historical incidents"""
#         # Count incidents within 100m in last 30 days
#         recent_incidents = crud.get_recent_incidents_near_location(
#             db, latitude, longitude, radius_m=100, days=30
#         )
        
#         count = len(recent_incidents)
        
#         if count == 0:
#             return 30
#         elif count == 1:
#             return 50
#         elif count <= 3:
#             return 70
#         else:
#             return 90
    
#     @staticmethod
#     def get_priority_level(score: int) -> str:
#         """Convert score to priority level"""
#         if score >= 80:
#             return "critical"
#         elif score >= 60:
#             return "high"
#         elif score >= 40:
#             return "medium"
#         else:
#             return "low"

