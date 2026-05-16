#!/usr/bin/env python3
import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

def setup_database():
    """Create database and enable PostGIS extension"""
    
    # Connect to default postgres database to create our database
    default_engine = create_engine(
        "postgresql://postgres:87tenfad94@localhost:5432/postgisdb"
    )
    
    # Create database if it doesn't exist
    with default_engine.connect() as conn:
        conn.execute(text("COMMIT"))  # End any existing transaction
        result = conn.execute(
            text(f"SELECT 1 FROM pg_database WHERE datname = '{settings.database_url.split('/')[-1]}'")
        )
        
        if not result.fetchone():
            print(f"Creating database: {settings.database_url.split('/')[-1]}")
            conn.execute(text(f"CREATE DATABASE {settings.database_url.split('/')[-1]}"))
    
    # Now connect to our database and enable PostGIS
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # Enable PostGIS extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.commit()
    
    print("Database setup completed successfully!")

if __name__ == "__main__":
    setup_database()