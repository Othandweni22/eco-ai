# Create a test script test_ai.py
from app.services.ai_service import ai_service
from pathlib import Path

# Test with a sample image
test_image = Path("test_image.jpg")
if test_image.exists():
    result = ai_service.analyze_image(str(test_image))
    print("AI Analysis Result:")
    print(f"Detections: {len(result.get('detections', []))}")
    print(f"Waste Types: {result.get('waste_types', {})}")
    print(f"Priority Score: {result.get('priority_score')}")
    print(f"Processing Time: {result.get('processing_time')}s")
else:
    print(f"Please create a test image at {test_image}")