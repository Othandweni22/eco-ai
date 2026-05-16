import time
import cv2
import numpy as np
from typing import Dict, List, Any, Optional
from pathlib import Path
from PIL import Image

from app.services.model_loader import model_loader
from app.config import settings


class AIService:
    """
    Waste detection service using the 22-class waste detection YOLOv8 model.

    Model classes:
        battery, can, cardboard_bowl, cardboard_box,
        chemical_plastic_bottle, chemical_plastic_gallon, chemical_spray_can,
        light_bulb, paint_bucket, plastic_bag, plastic_bottle,
        plastic_bottle_cap, plastic_box, plastic_cultery, plastic_cup,
        plastic_cup_lid, reuseable_paper, scrap_paper, scrap_plastic,
        snack_bag, stick, straw

    Each class is mapped to the richer waste category taxonomy the rest of
    the system (priority scoring, risk factors, frontend) already uses.
    Nothing outside this file needs to change.

    Detection flow
    --------------
    analyze_image / analyze_image_bytes
        -> YOLO inference (conf=0.08, iou=0.45)
        -> _process_detections()
        -> _generate_analysis_result()
            -> _primary_category() / _all_categories()
            -> _generate_risk_factors()
            -> _calculate_base_priority_score()
        -> returns standard result dict
    """

    # ── 22-class model -> rich waste category mapping ─────────────────────────

    CATEGORY_MAP: Dict[str, List[str]] = {
        "battery":                  ["hazardous_materials", "electronics"],
        "can":                      ["metal_scrap"],
        "cardboard_bowl":           ["organic_waste", "garbage_bags"],
        "cardboard_box":            ["garbage_bags", "pallets"],
        "chemical_plastic_bottle":  ["hazardous_materials"],
        "chemical_plastic_gallon":  ["hazardous_materials"],
        "chemical_spray_can":       ["hazardous_materials"],
        "light_bulb":               ["hazardous_materials", "electronics"],
        "paint_bucket":             ["hazardous_materials"],
        "plastic_bag":              ["plastic_waste", "garbage_bags"],
        "plastic_bottle":           ["plastic_waste"],
        "plastic_bottle_cap":       ["plastic_waste"],
        "plastic_box":              ["plastic_waste"],
        "plastic_cultery":          ["plastic_waste"],
        "plastic_cup":              ["plastic_waste"],
        "plastic_cup_lid":          ["plastic_waste"],
        "reuseable_paper":          ["organic_waste"],
        "scrap_paper":              ["organic_waste", "garbage_bags"],
        "scrap_plastic":            ["plastic_waste", "metal_scrap"],
        "snack_bag":                ["plastic_waste", "garbage_bags"],
        "stick":                    ["green_waste"],
        "straw":                    ["plastic_waste"],
    }

    PRIMARY_CATEGORY: Dict[str, str] = {
        "battery":                  "hazardous_materials",
        "can":                      "metal_scrap",
        "cardboard_bowl":           "garbage_bags",
        "cardboard_box":            "garbage_bags",
        "chemical_plastic_bottle":  "hazardous_materials",
        "chemical_plastic_gallon":  "hazardous_materials",
        "chemical_spray_can":       "hazardous_materials",
        "light_bulb":               "hazardous_materials",
        "paint_bucket":             "hazardous_materials",
        "plastic_bag":              "plastic_waste",
        "plastic_bottle":           "plastic_waste",
        "plastic_bottle_cap":       "plastic_waste",
        "plastic_box":              "plastic_waste",
        "plastic_cultery":          "plastic_waste",
        "plastic_cup":              "plastic_waste",
        "plastic_cup_lid":          "plastic_waste",
        "reuseable_paper":          "organic_waste",
        "scrap_paper":              "organic_waste",
        "scrap_plastic":            "plastic_waste",
        "snack_bag":                "plastic_waste",
        "stick":                    "green_waste",
        "straw":                    "plastic_waste",
    }

    HUMAN_LABELS: Dict[str, str] = {
        "battery":                  "Battery",
        "can":                      "Metal can",
        "cardboard_bowl":           "Cardboard bowl",
        "cardboard_box":            "Cardboard box",
        "chemical_plastic_bottle":  "Chemical bottle (hazardous)",
        "chemical_plastic_gallon":  "Chemical gallon (hazardous)",
        "chemical_spray_can":       "Chemical spray can (hazardous)",
        "light_bulb":               "Light bulb",
        "paint_bucket":             "Paint bucket (hazardous)",
        "plastic_bag":              "Plastic bag",
        "plastic_bottle":           "Plastic bottle",
        "plastic_bottle_cap":       "Plastic bottle cap",
        "plastic_box":              "Plastic box",
        "plastic_cultery":          "Plastic cutlery",
        "plastic_cup":              "Plastic cup",
        "plastic_cup_lid":          "Plastic cup lid",
        "reuseable_paper":          "Paper",
        "scrap_paper":              "Scrap paper",
        "scrap_plastic":            "Scrap plastic",
        "snack_bag":                "Snack bag",
        "stick":                    "Stick / wood debris",
        "straw":                    "Plastic straw",
    }

    # Hazard multipliers for priority scoring
    HAZARD_LEVELS: Dict[str, float] = {
        "hazardous_materials":  3.0,
        "electronics":          2.5,
        "tires":                2.0,
        "metal_scrap":          1.5,
        "appliances":           1.5,
        "construction_waste":   1.2,
        "furniture":            1.0,
        "plastic_waste":        1.0,
        "organic_waste":        0.8,
        "clothing_textiles":    0.8,
        "mattress":             1.2,
        "vehicle_part":         1.8,
        "garbage_bags":         0.7,
        "pallets":              0.9,
        "green_waste":          0.7,
    }

    # Low threshold because field photos have lower confidence than studio shots
    CONF_THRESHOLD = 0.70
    IOU_THRESHOLD  = 0.45

    def __init__(self):
        self.model_loaded = False
        self._load_model()

    def _load_model(self) -> None:
        try:
            if not model_loader.model:
                model_loader.load_model()
            self.model_loaded = True
            print(f"AI service ready. Model: {model_loader._active_model_name} "
                  f"({len(model_loader.classes)} classes)")
        except Exception as e:
            print(f"Failed to load AI model: {e}")
            self.model_loaded = False

    # ── public API ─────────────────────────────────────────────────────────────

    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Analyse a saved image file and return detection results."""
        start = time.time()

        if not self.model_loaded:
            self._load_model()
            if not self.model_loaded:
                return self._fallback_result()

        try:
            image = self._load_image(image_path)
            if image is None:
                print(f"Could not load image: {image_path}")
                return self._fallback_result()

            raw        = model_loader.model(image, conf=self.CONF_THRESHOLD,
                                            iou=self.IOU_THRESHOLD, verbose=False)
            detections = self._process_detections(raw[0])
            result     = self._generate_analysis_result(detections)
            result["processing_time"] = time.time() - start
            return result

        except Exception as e:
            print(f"AI analysis error: {e}")
            import traceback; traceback.print_exc()
            return self._fallback_result(processing_time=time.time() - start)

    def analyze_image_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """Analyse raw image bytes — used by /reports and /ai/model/test endpoints."""
        try:
            tmp = Path("temp_analysis.jpg")
            tmp.write_bytes(image_bytes)
            result = self.analyze_image(str(tmp))
            if tmp.exists():
                tmp.unlink()
            return result
        except Exception as e:
            print(f"Error analysing bytes: {e}")
            return self._fallback_result()

    # ── image loading ──────────────────────────────────────────────────────────

    def _load_image(self, image_path: str) -> Optional[np.ndarray]:
        """
        Load image as RGB numpy array.
        Handles jpg, png, webp and other formats cv2 may struggle with.
        """
        try:
            # Try cv2 first (fastest)
            img = cv2.imread(image_path)
            if img is not None:
                return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # cv2 failed — common with webp. Fall back to PIL.
            print(f"cv2 failed for {image_path}, trying PIL...")
            with Image.open(image_path) as pil:
                arr = np.array(pil.convert("RGB"))
                print(f"PIL loaded image: {arr.shape}")
                return arr

        except Exception as e:
            print(f"Error loading image {image_path}: {e}")
            return None

    # ── detection processing ───────────────────────────────────────────────────

    def _process_detections(self, result) -> List[Dict[str, Any]]:
        """Convert raw YOLO boxes into structured detection dicts."""
        detections = []
        if result.boxes is None:
            return detections

        for box in result.boxes:
            class_id   = int(box.cls[0])
            confidence = float(box.conf[0])
            bbox       = box.xyxy[0].cpu().numpy()
            class_name = model_loader.classes.get(class_id, f"class_{class_id}")

            detections.append({
                "class_id":       class_id,
                "class_name":     class_name,
                "waste_category": self._primary_category(class_name),
                "all_categories": self._all_categories(class_name),
                "confidence":     confidence,
                "bbox":           bbox.tolist(),
                "area":           float((bbox[2] - bbox[0]) * (bbox[3] - bbox[1])),
            })

        return detections

    def _primary_category(self, class_name: str) -> str:
        return self.PRIMARY_CATEGORY.get(
            class_name.lower(),
            class_name.lower(),
        )

    def _all_categories(self, class_name: str) -> List[str]:
        return self.CATEGORY_MAP.get(class_name.lower(), [class_name.lower()])

    # ── result generation ──────────────────────────────────────────────────────

    def _generate_analysis_result(self, detections: List[Dict]) -> Dict[str, Any]:
        if not detections:
            return {
                "waste_types":       {},
                "confidence_scores": {"overall": 0.0, "waste_present": 0.0, "detection_count": 0},
                "priority_score":    10,
                "risk_factors":      ["no_waste_detected"],
                "ai_model_version":  f"waste_det_{model_loader._active_model_name}",
                "detections":        [],
                "detected_items":    [],
                "waste_categories":  {},
                "image_analysis":    {
                    "detection_count":  0,
                    "total_area":       0,
                    "avg_confidence":   0,
                    "hazardous_present": False,
                },
            }

        # Aggregate by category
        waste_categories: Dict[str, int]         = {}
        category_confs:   Dict[str, List[float]] = {}
        category_areas:   Dict[str, float]       = {}

        for det in detections:
            conf = det["confidence"]
            area = det["area"]
            for cat in det["all_categories"]:
                waste_categories[cat] = waste_categories.get(cat, 0) + 1
                category_confs.setdefault(cat, []).append(conf)
                category_areas[cat]   = category_areas.get(cat, 0.0) + area

        # Waste type scores: mean confidence × hazard multiplier, capped at 0.99
        waste_types = {
            cat: min(0.99, float(np.mean(category_confs[cat]))
                          * self.HAZARD_LEVELS.get(cat, 1.0))
            for cat in waste_categories
        }

        all_confs      = [d["confidence"] for d in detections]
        overall_conf   = float(np.mean(all_confs))
        total_area     = float(sum(d["area"] for d in detections))
        hazardous_cats = {"hazardous_materials", "electronics", "tires", "vehicle_part"}

        return {
            "waste_types":       waste_types,
            "confidence_scores": {
                "overall":         overall_conf,
                "waste_present":   float(max(all_confs)),
                "detection_count": len(detections),
            },
            "priority_score":    int(self._calculate_base_priority_score(
                                     waste_categories, overall_conf, total_area)),
            "risk_factors":      self._generate_risk_factors(waste_categories, total_area),
            "ai_model_version":  f"waste_det_{model_loader._active_model_name}",
            "detections":        detections,
            "detected_items":    self._build_detected_items_list(detections),
            "waste_categories":  waste_categories,
            "image_analysis": {
                "detection_count":   len(detections),
                "total_area":        total_area,
                "avg_confidence":    overall_conf,
                "hazardous_present": bool(hazardous_cats & set(waste_categories.keys())),
            },
        }

    def _build_detected_items_list(self, detections: List[Dict]) -> List[Dict[str, Any]]:
        """
        Deduplicated list of detected items for the frontend.
        Groups by class_name, keeps the highest-confidence bbox.
        """
        grouped: Dict[str, Dict] = {}
        for det in detections:
            cn = det["class_name"]
            if cn not in grouped:
                grouped[cn] = {
                    "label":      self.HUMAN_LABELS.get(cn, cn.replace("_", " ").title()),
                    "class_name": cn,
                    "category":   det["waste_category"],
                    "confidence": round(det["confidence"], 3),
                    "count":      1,
                    "bbox":       det["bbox"],
                }
            else:
                grouped[cn]["count"] += 1
                if det["confidence"] > grouped[cn]["confidence"]:
                    grouped[cn]["confidence"] = round(det["confidence"], 3)
                    grouped[cn]["bbox"]       = det["bbox"]

        return sorted(grouped.values(), key=lambda x: x["confidence"], reverse=True)

    # ── risk & priority ────────────────────────────────────────────────────────

    def _generate_risk_factors(self, waste_categories: Dict[str, int],
                               total_area: float) -> List[str]:
        risk      = []
        hazardous = {"hazardous_materials", "electronics", "tires", "vehicle_part"}

        if hazardous & set(waste_categories):
            risk.append("hazardous_materials_present")
        if total_area > 50_000:
            risk.append("large_volume")
        elif total_area > 20_000:
            risk.append("moderate_volume")
        if len(waste_categories) > 2:
            risk.append("mixed_waste_types")
        if waste_categories.get("construction_waste", 0) > 3:
            risk.append("construction_dumping")
        if "appliances" in waste_categories:
            risk.append("appliance_dumping")
        if waste_categories.get("furniture", 0) > 2:
            risk.append("furniture_dumping")
        if not risk:
            risk.append("illegal_dumping_detected")
        return risk

    def _calculate_base_priority_score(self, waste_categories: Dict[str, int],
                                       overall_confidence: float,
                                       total_area: float) -> int:
        score = 30
        score += int(overall_confidence * 20)
        score += min(30, sum(
            int(self.HAZARD_LEVELS.get(cat, 1.0) * count * 5)
            for cat, count in waste_categories.items()
        ))
        if total_area > 50_000:
            score += 15
        elif total_area > 20_000:
            score += 10
        elif total_area > 5_000:
            score += 5

        total_dets = sum(waste_categories.values())
        if total_dets > 5:
            score += 10
        elif total_dets > 2:
            score += 5

        return min(95, max(10, score))

    # ── fallback ───────────────────────────────────────────────────────────────

    def _fallback_result(self, processing_time: float = 0.5) -> Dict[str, Any]:
        return {
            "waste_types":       {},
            "confidence_scores": {"overall": 0.0, "waste_present": 0.0, "detection_count": 0},
            "priority_score":    20,
            "risk_factors":      ["ai_analysis_failed"],
            "ai_model_version":  "fallback",
            "detections":        [],
            "detected_items":    [],
            "waste_categories":  {},
            "image_analysis": {
                "detection_count":   0,
                "total_area":        0,
                "avg_confidence":    0,
                "hazardous_present": False,
            },
            "processing_time": processing_time,
        }

    # ── admin helpers ──────────────────────────────────────────────────────────

    def get_model_info(self) -> Dict[str, Any]:
        if not self.model_loaded:
            return {"status": "not_loaded"}
        info = model_loader.get_model_info()
        info.update({
            "category_map":    self.CATEGORY_MAP,
            "hazard_levels":   self.HAZARD_LEVELS,
            "conf_threshold":  self.CONF_THRESHOLD,
        })
        return info

    def visualize_detections(self, image_path: str, output_path: str) -> bool:
        try:
            if not self.model_loaded:
                return False
            results = model_loader.model(
                image_path, conf=self.CONF_THRESHOLD, save=True, project="temp_viz"
            )
            if results and hasattr(results[0], "save_dir"):
                import shutil
                save_dir  = Path(results[0].save_dir)
                out_files = list(save_dir.glob("*.jpg"))
                if out_files:
                    shutil.move(str(out_files[0]), output_path)
                    if save_dir.exists():
                        shutil.rmtree(save_dir.parent)
                    return True
            return False
        except Exception as e:
            print(f"Visualisation error: {e}")
            return False


# Singleton
ai_service = AIService()
