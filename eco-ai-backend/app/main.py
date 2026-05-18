from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from datetime import datetime
from app.database import engine, Base
from app.api.endpoints import reports, admin, public, auth, ai, user
from app.api.websocket import router as ws_router


# Create tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    Base.metadata.create_all(bind=engine)

    # Create test user if not exists
    from app.database import SessionLocal
    from app import crud, schemas

    db = SessionLocal()
    try:
        # Create test admin user
        admin_email = "admin@example.com"
        existing_admin = crud.get_user_by_email(db, admin_email)
        if not existing_admin:
            admin_user = schemas.UserCreate(
                email=admin_email,
                full_name="Admin User",
                role="admin",
                password="admin123",
            )
            crud.create_user(db, admin_user)
            print("Created test admin user")

        # Create test officer user
        officer_email = "officer@example.com"
        existing_officer = crud.get_user_by_email(db, officer_email)
        if not existing_officer:
            officer_user = schemas.UserCreate(
                email=officer_email,
                full_name="Officer User",
                role="officer",
                password="officer123",
            )
            crud.create_user(db, officer_user)
            print("Created test officer user")

        # Create test citizen user
        citizen_email = "citizen@example.com"
        existing_citizen = crud.get_user_by_email(db, citizen_email)
        if not existing_citizen:
            citizen_user = schemas.UserCreate(
                email=citizen_email,
                full_name="Citizen User",
                role="citizen",
                password="citizen123",
            )
            crud.create_user(db, citizen_user)
            print("Created test citizen user")

        db.commit()
    except Exception as e:
        print(f"Error creating test users: {e}")
        db.rollback()
    finally:
        db.close()

    yield

    # Shutdown
    print("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Illegal Dumping Detection API",
    description="API for detecting and managing illegal dumping reports",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS - FIXED FOR MOBILE DEPLOYMENT
# Define the exact origins that are allowed to access your API
origins = [
    "https://eco-ai-frontend.onrender.com",  # Your deployed frontend on Render
    # Add more origins if needed (e.g., custom domain, local development)
    # "http://localhost:3000",  # For local testing on your computer
    # "https://your-custom-domain.com",  # If you add a custom domain later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use the explicit list instead of "*"
    allow_credentials=True,
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],     # Allow all headers
    expose_headers=["*"],    # Expose all headers to the frontend
)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Add to the router includes
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])

app.include_router(user.router, prefix="/api/v1/auth/register", tags=["users"])

# Include routers
app.include_router(reports.router, prefix="/api/v1", tags=["reports"])

app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

# Add this import

# Add this router inclusion (after other routers)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])

# app.include_router(auth.router)

app.include_router(public.router, prefix="/api/v1/public", tags=["public"])

app.include_router(ws_router, prefix="/ws", tags=["websocket"])


# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Illegal Dumping Detection API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Import datetime for health check