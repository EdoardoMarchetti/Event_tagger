"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Event Tagger API",
    description="Backend API for Event Tagger application",
    version="1.0.0"
)

# Configure CORS (allow_credentials=True requires explicit origins, not "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://eventtagger.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.api import events, stopwatch, visualization, export

app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(stopwatch.router, prefix="/api/stopwatch", tags=["stopwatch"])
app.include_router(visualization.router, prefix="/api/visualization", tags=["visualization"])
app.include_router(export.router, prefix="/api/export", tags=["export"])


@app.get("/")
async def root():
    return {"message": "Event Tagger API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
