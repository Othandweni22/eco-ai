#!/usr/bin/env python3
import sys
import os
from datetime import datetime, timedelta
import random

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app import models, crud
from app.schemas import UserCreate

def seed_database():
    """Seed the database with test data"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create test users if they don't exist
        test_users = [
            {
                "email": "admin@example.com",
                "full_name": "Admin User",
                "role": "admin",
                "password": "admin123"
            },
            {
                "email": "officer1@example.com",
                "full_name": "John Officer",
                "role": "officer",
                "password": "officer123"
            },
            {
                "email": "officer2@example.com",
                "full_name": "Jane Officer",
                "role": "officer",
                "password": "officer123"
            },
            {
                "email": "citizen1@example.com",
                "full_name": "Alice Citizen",
                "role": "citizen",
                "password": "citizen123"
            },
            {
                "email": "citizen2@example.com",
                "full_name": "Bob Citizen",
                "role": "citizen",
                "password": "citizen123"
            }
        ]
        
        for user_data in test_users:
            existing_user = crud.get_user_by_email(db, user_data["email"])
            if not existing_user:
                user_create = UserCreate(**user_data)
                crud.create_user(db, user_create)
                print(f"Created user: {user_data['email']}")
        
        # Create some test reports
        # London coordinates for realistic test data
        london_lat = 51.5074
        london_lon = -0.1278
        
        # Waste types for random generation
        waste_types_list = [
            "construction_waste",
            "furniture",
            "appliances",
            "plastic_waste",
            "metal_scrap"
        ]
        
        print("\nCreating test reports...")
        for i in range(20):
            # Generate random coordinates around London
            lat = london_lat + random.uniform(-0.05, 0.05)
            lon = london_lon + random.uniform(-0.05, 0.05)
            
            # Generate random date within last 30 days
            report_date = datetime.utcnow() - timedelta(days=random.randint(0, 30))
            
            # Create report
            report = models.Report(
                user_id=random.choice([4, 5]),  # citizen users
                image_path=f"test/report_{i}.jpg",
                thumbnail_path=f"test/thumbnail_{i}.jpg",
                latitude=lat,
                longitude=lon,
                description=f"Test illegal dumping report #{i+1}",
                report_date=report_date,
                status=random.choice(["analyzed", "processing", "pending"])
            )
            
            db.add(report)
            db.flush()  # Get the ID
            
            # Create analysis result for some reports
            if report.status == "analyzed":
                waste_types = {}
                for wt in random.sample(waste_types_list, random.randint(1, 3)):
                    waste_types[wt] = round(random.uniform(0.5, 0.95), 2)
                
                priority_score = random.randint(20, 95)
                
                analysis = models.AnalysisResult(
                    report_id=report.id,
                    waste_types=waste_types,
                    confidence_scores={
                        "overall": round(random.uniform(0.6, 0.95), 2),
                        "waste_present": round(random.uniform(0.7, 0.98), 2)
                    },
                    priority_score=priority_score,
                    risk_factors=random.sample(
                        ["waterway_proximity", "residential_zone", "large_volume"],
                        random.randint(0, 2)
                    ),
                    ai_model_version="mock_v1.0",
                    processing_time=random.uniform(1.5, 3.0)
                )
                
                db.add(analysis)
                
                # Create case for high priority reports
                if priority_score >= 40:
                    case = models.Case(
                        report_id=report.id,
                        priority_level="high" if priority_score >= 60 else "medium",
                        estimated_cleanup_cost=random.uniform(100, 500),
                        status=random.choice(["new", "assigned", "in_progress"]),
                        notes="Test case for demonstration"
                    )
                    
                    if case.status == "assigned":
                        case.assigned_officer_id = random.choice([2, 3])  # officer users
                    
                    db.add(case)
            
            if (i + 1) % 5 == 0:
                print(f"Created {i + 1} test reports...")
        
        db.commit()
        print("\nDatabase seeded successfully!")
        
        # Print summary
        print("\n=== Database Summary ===")
        print(f"Users: {db.query(models.User).count()}")
        print(f"Reports: {db.query(models.Report).count()}")
        print(f"Analysis Results: {db.query(models.AnalysisResult).count()}")
        print(f"Cases: {db.query(models.Case).count()}")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()