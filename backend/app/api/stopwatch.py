"""
API endpoints for stopwatch functionality.
"""
from fastapi import APIRouter, Header
from app.models.session import StopwatchStatus
from app.services.stopwatch_service import (
    start_stopwatch as start_stopwatch_service,
    stop_stopwatch as stop_stopwatch_service,
    get_stopwatch_status as get_stopwatch_status_service,
    get_elapsed_time as get_elapsed_time_service,
    reset_stopwatch as reset_stopwatch_service
)

router = APIRouter()


@router.post("/start", response_model=StopwatchStatus)
async def start_stopwatch(
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Start the stopwatch for a session.
    
    Args:
        session_id: Session identifier from header
        
    Returns:
        StopwatchStatus: Updated stopwatch status
    """
    return start_stopwatch_service(session_id)


@router.post("/stop", response_model=StopwatchStatus)
async def stop_stopwatch(
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Stop the stopwatch for a session.
    
    Args:
        session_id: Session identifier from header
        
    Returns:
        StopwatchStatus: Updated stopwatch status
    """
    return stop_stopwatch_service(session_id)


@router.get("/status", response_model=StopwatchStatus)
async def get_stopwatch_status(
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Get current stopwatch status.
    
    Args:
        session_id: Session identifier from header
        
    Returns:
        StopwatchStatus: Current stopwatch status
    """
    return get_stopwatch_status_service(session_id)


@router.get("/elapsed")
async def get_elapsed_time(
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Get current elapsed time in seconds.
    
    Args:
        session_id: Session identifier from header
        
    Returns:
        dict: Elapsed time in seconds
    """
    elapsed = get_elapsed_time_service(session_id)
    return {"elapsed_time": elapsed}


@router.post("/reset", response_model=StopwatchStatus)
async def reset_stopwatch(
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Reset the stopwatch for a session.
    
    Args:
        session_id: Session identifier from header
        
    Returns:
        StopwatchStatus: Reset stopwatch status
    """
    return reset_stopwatch_service(session_id)
