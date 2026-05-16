import requests
from typing import Dict, Any
from app.config import settings
from app.utils import calculate_distance

class OSMService:
    """Service for interacting with OpenStreetMap Overpass API"""
    
    @staticmethod
    def query_osm(latitude: float, longitude: float, radius: int = 100) -> Dict[str, Any]:
        """
        Query OSM for features around a location
        
        radius: search radius in meters
        """
        # Convert radius to degrees (approximate)
        radius_deg = radius / 111000  # 1 degree ≈ 111km
        
        # Overpass QL query
        query = f"""
        [out:json][timeout:25];
        (
          // Waterways
          way["waterway"](around:{radius},{latitude},{longitude});
          relation["waterway"](around:{radius},{latitude},{longitude});
          
          // Protected areas
          way["boundary"="protected_area"](around:{radius},{latitude},{longitude});
          relation["boundary"="protected_area"](around:{radius},{latitude},{longitude});
          
          // Land use
          way["landuse"](around:{radius},{latitude},{longitude});
          relation["landuse"](around:{radius},{latitude},{longitude});
          
          // Amenities (schools, hospitals)
          node["amenity"](around:{radius},{latitude},{longitude});
          way["amenity"](around:{radius},{latitude},{longitude});
        );
        out body;
        >;
        out skel qt;
        """
        
        try:
            response = requests.post(
                settings.osm_overpass_url,
                data={'data': query},
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"OSM query failed: {e}")
            return {"elements": []}
    
    @staticmethod
    def extract_location_metadata(osm_data: Dict[str, Any], latitude: float, longitude: float) -> Dict[str, Any]:
        """Extract and process relevant information from OSM response"""
        elements = osm_data.get("elements", [])
        
        metadata = {
            "osm_data": osm_data,
            "land_use": None,
            "waterway_distance": None,
            "protected_area": False,
            "nearby_amenities": []
        }
        
        min_waterway_distance = float('inf')
        
        for element in elements:
            tags = element.get("tags", {})
            
            # Check for waterways
            if "waterway" in tags:
                # Calculate distance to waterway (simplified - using node position)
                if "lat" in element and "lon" in element:
                    distance = calculate_distance(
                        latitude, longitude,
                        element["lat"], element["lon"]
                    )
                    min_waterway_distance = min(min_waterway_distance, distance)
            
            # Check for protected areas
            if tags.get("boundary") == "protected_area":
                metadata["protected_area"] = True
            
            # Check for land use
            if "landuse" in tags and not metadata["land_use"]:
                metadata["land_use"] = tags["landuse"]
            
            # Check for amenities
            if "amenity" in tags:
                amenity = {
                    "type": tags["amenity"],
                    "name": tags.get("name", "Unknown")
                }
                metadata["nearby_amenities"].append(amenity)
        
        if min_waterway_distance != float('inf'):
            metadata["waterway_distance"] = min_waterway_distance
        
        # Calculate sensitivity score
        sensitivity_score = 0
        
        if metadata["protected_area"]:
            sensitivity_score += 40
        
        if metadata["waterway_distance"]:
            if metadata["waterway_distance"] < 50:
                sensitivity_score += 30
            elif metadata["waterway_distance"] < 100:
                sensitivity_score += 20
            elif metadata["waterway_distance"] < 200:
                sensitivity_score += 10
        
        if metadata["land_use"] in ["residential", "school", "hospital"]:
            sensitivity_score += 20
        elif metadata["land_use"] in ["industrial", "commercial"]:
            sensitivity_score += 5
        
        metadata["sensitivity_score"] = min(100, sensitivity_score)
        
        return metadata
    
    @staticmethod
    def get_location_metadata(latitude: float, longitude: float) -> Dict[str, Any]:
        """Get comprehensive location metadata from OSM"""
        osm_data = OSMService.query_osm(latitude, longitude)
        return OSMService.extract_location_metadata(osm_data, latitude, longitude)