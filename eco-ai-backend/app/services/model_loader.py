import os
from pathlib import Path
from typing import Dict, List, Any
import numpy as np

# ── PyTorch 2.6 fix: patch torch.load BEFORE importing YOLO ──────────────────
import torch

_original_torch_load = torch.load

def _patched_load(*args, **kwargs):
    kwargs["weights_only"] = False
    return _original_torch_load(*args, **kwargs)

torch.load = _patched_load
# ─────────────────────────────────────────────────────────────────────────────

from ultralytics import YOLO


class ModelLoader:
    """
    Load and manage the waste-detection YOLOv8 model.

    The model in use (waste_detection_best.pt) has 22 classes:
        battery, can, cardboard_bowl, cardboard_box,
        chemical_plastic_bottle, chemical_plastic_gallon, chemical_spray_can,
        light_bulb, paint_bucket, plastic_bag, plastic_bottle,
        plastic_bottle_cap, plastic_box, plastic_cultery, plastic_cup,
        plastic_cup_lid, reuseable_paper, scrap_paper, scrap_plastic,
        snack_bag, stick, straw

    Class names are read directly from the model — no hardcoded list needed.

    HOW TO USE
    ----------
    Copy your trained weights into:
        backend/app/models/yolov8/waste_detection_best.pt
    Restart the backend — it loads automatically.
    """

    PREFERRED_MODEL_NAME = "waste_detection_best.pt"
    FALLBACK_MODEL_NAME  = "yolov8n.pt"

    def __init__(self, model_dir: Path = Path("app/models/yolov8")):
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.model = None
        self.classes: Dict[int, str] = {}
        self.device = self._get_device()
        self._active_model_name = ""

    def _get_device(self) -> str:
        if torch.cuda.is_available():
            return "cuda"
        elif torch.backends.mps.is_available():
            return "mps"
        return "cpu"

    def load_model(self, model_name: str = "") -> None:
        """
        Load the waste detection model.

        Priority:
          1. Explicitly passed model_name (if file exists)
          2. waste_detection_best.pt
          3. Any other .pt file in model_dir
          4. Download yolov8n.pt as last resort
        """
        resolved   = self._resolve_model_name(model_name)
        model_path = self.model_dir / resolved

        if not model_path.exists():
            if resolved == self.FALLBACK_MODEL_NAME:
                print(f"Downloading fallback model {resolved}...")
                self._download_yolo(resolved)
            else:
                raise FileNotFoundError(
                    f"Model file not found: {model_path}\n"
                    f"Copy your weights to {model_path} and restart."
                )

        print(f"Loading model {resolved} on {self.device}...")
        self.model = YOLO(str(model_path))   # torch.load already patched above
        self._active_model_name = resolved
        self.classes = self._resolve_classes()
        self._warmup()
        print(f"Model ready — {len(self.classes)} classes: {list(self.classes.values())}")

    def _resolve_model_name(self, requested: str) -> str:
        if requested and (self.model_dir / requested).exists():
            return requested
        if (self.model_dir / self.PREFERRED_MODEL_NAME).exists():
            return self.PREFERRED_MODEL_NAME
        pt_files = [f.name for f in self.model_dir.glob("*.pt")]
        if pt_files:
            chosen = sorted(pt_files)[0]
            print(f"Using available model: {chosen}")
            return chosen
        print(
            f"WARNING: {self.PREFERRED_MODEL_NAME} not found.\n"
            "Falling back to generic yolov8n — detection quality will be poor.\n"
            f"Copy your waste detection weights to: {self.model_dir / self.PREFERRED_MODEL_NAME}"
        )
        return self.FALLBACK_MODEL_NAME

    def _resolve_classes(self) -> Dict[int, str]:
        """Always read class names directly from the loaded model."""
        if self.model and hasattr(self.model, "names"):
            return dict(self.model.names)
        # Fallback: read classes.txt
        classes_file = self.model_dir / "classes.txt"
        if classes_file.exists():
            with open(classes_file) as f:
                return {i: line.strip() for i, line in enumerate(f) if line.strip()}
        return {}

    def _download_yolo(self, model_name: str) -> None:
        import urllib.request, tempfile
        urls = {
            "yolov8n.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt",
            "yolov8s.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s.pt",
            "yolov8m.pt": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt",
        }
        url = urls.get(model_name)
        if not url:
            raise ValueError(f"No download URL for {model_name}")
        tmp = Path(tempfile.gettempdir()) / model_name
        urllib.request.urlretrieve(url, tmp)
        tmp.rename(self.model_dir / model_name)
        print(f"Downloaded {model_name}")

    def _warmup(self) -> None:
        if self.model:
            try:
                dummy = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
                self.model(dummy, verbose=False)
            except Exception:
                pass

    def get_model_info(self) -> Dict[str, Any]:
        if not self.model:
            return {"status": "not_loaded"}
        return {
            "status":      "loaded",
            "device":      self.device,
            "classes":     self.classes,
            "num_classes": len(self.classes),
            "model_file":  self._active_model_name,
            "model_type":  "yolov8_waste_detection",
        }

    def get_available_models(self) -> List[str]:
        return [f.name for f in self.model_dir.glob("*.pt")]

    def update_classes(self, new_classes: Dict[int, str]) -> None:
        self.classes = new_classes
        classes_file = self.model_dir / "classes.txt"
        with open(classes_file, "w") as f:
            for idx in sorted(new_classes.keys()):
                f.write(f"{new_classes[idx]}\n")


# Singleton
model_loader = ModelLoader()
