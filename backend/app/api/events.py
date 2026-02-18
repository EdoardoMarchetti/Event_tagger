"""
API endpoints for event management.
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List
from app.models.event import EventCreate, EventResponse, EventStats
from app.services.event_service import (
    create_event,
    get_events,
    delete_event,
    get_event_stats
)

router = APIRouter()


def get_session_id(x_session_id: Optional[str] = Header(None, alias="X-Session-ID")) -> str:
    """
    Extract session ID from header or use default.
    
    Args:
        x_session_id: Session ID from header
        
    Returns:
        str: Session ID
    """
    return x_session_id or "default"


@router.post("", response_model=EventResponse, status_code=201)
async def create_event_endpoint(
    event: EventCreate,
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Create a new event.
    
    Args:
        event: Event data to create
        session_id: Session identifier from header
        
    Returns:
        EventResponse: Created event
    """
    return create_event(session_id, event)


@router.get("", response_model=List[EventResponse])
async def get_events_endpoint(
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Get all events for a session.
    
    Args:
        session_id: Session identifier from header
        
    Returns:
        List[EventResponse]: List of events
    """
    return get_events(session_id)


@router.delete("/{event_id}", status_code=204)
async def delete_event_endpoint(
    event_id: int,
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Delete an event by ID.
    
    Args:
        event_id: Event ID to delete
        session_id: Session identifier from header
        
    Returns:
        204 No Content if successful
    """
    success = delete_event(session_id, event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return None


@router.get("/stats", response_model=List[EventStats])
async def get_event_stats_endpoint(
    session_id: str = Header(..., alias="X-Session-ID")
):
    """
    Get event statistics per team.
    
    Args:
        session_id: Session identifier from header
        
    Returns:
        List[EventStats]: Statistics for each team
    """
    return get_event_stats(session_id)
