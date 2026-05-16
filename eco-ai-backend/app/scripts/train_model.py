# scripts/train_model.py
#!/usr/bin/env python3
"""
Script to fine-tune YOLOv8 on custom waste detection dataset.
"""
import os
import sys
import yaml
from pathlib import Path
from ultralytics import YOLO

def train_waste_detection_model():
    """Fine-tune YOLOv8 for waste detection"""
    
    # Paths
    data_dir = Path("data/waste_dataset")
    model_dir = Path("app/models/yolov8")
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if dataset exists
    if not data_dir.exists():
        print(f"Dataset not found at {data_dir}")
        print("Please prepare your dataset in YOLO format:")
        print("  data/waste_dataset/images/train/")
        print("  data/waste_dataset/images/val/")
        print("  data/waste_dataset/labels/train/")
        print("  data/waste_dataset/labels/val/")
        print("  data/waste_dataset/data.yaml")
        return
    
    # Create data.yaml if it doesn't exist
    data_yaml = data_dir / "data.yaml"
    if not data_yaml.exists():
        # Create default data.yaml
        class_names = [
            "construction_waste", "furniture", "appliances", "hazardous_materials",
            "plastic_waste", "organic_waste", "metal_scrap", "electronics",
            "tires", "clothing_textiles"
        ]
        
        data_config = {
            "path": str(data_dir.absolute()),
            "train": "images/train",
            "val": "images/val",
            "names": {i: name for i, name in enumerate(class_names)}
        }
        
        with open(data_yaml, 'w') as f:
            yaml.dump(data_config, f)
    
    # Load base model
    print("Loading base model...")
    model = YOLO("yolov8n.pt")  # Start with nano model
    
    # Train the model
    print("Starting training...")
    results = model.train(
        data=str(data_yaml),
        epochs=50,
        imgsz=640,
        batch=16,
        name="waste_detection_v1",
        pretrained=True,
        optimizer="AdamW",
        lr0=0.001,
        weight_decay=0.0005,
        device="0" if torch.cuda.is_available() else "cpu"
    )
    
    # Save the trained model
    trained_model_path = model_dir / "waste_detection_v1.pt"
    model.export(format="torchscript", imgsz=640, optimize=True)
    
    print(f"Training completed! Model saved to {trained_model_path}")
    
    # Print metrics
    if hasattr(results, "metrics"):
        print("\nTraining Metrics:")
        print(f"Precision: {results.metrics.get('precision', 'N/A')}")
        print(f"Recall: {results.metrics.get('recall', 'N/A')}")
        print(f"mAP50: {results.metrics.get('mAP50', 'N/A')}")
        print(f"mAP50-95: {results.metrics.get('mAP50-95', 'N/A')}")

if __name__ == "__main__":
    import torch
    train_waste_detection_model()