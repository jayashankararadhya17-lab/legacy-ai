from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, analysis, architecture, modernization  # <-- Ensure analysis router is imported

app = FastAPI(
    title="LegacyAI",
    description="AI-powered Legacy System Analysis and Modernization",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Both prefixes must map correctly to what Axios requests
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"]) # <-- Critical line
app.include_router(architecture.router, prefix="/api/architecture", tags=["architecture"])
app.include_router(modernization.router, prefix="/api/modernization", tags=["modernization"])
@app.get("/")
def home():
    return {
        "message": "Welcome to LegacyAI!",
        "status": "Backend is running"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}