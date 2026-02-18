"""
Models for session state management.
"""
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime


class StopwatchStatus(BaseModel):
    """Model for stopwatch status."""
    running: bool
    elapsed_time: float
    start_time: Optional[datetime] = None


class SessionState(BaseModel):
    """Model for session state."""
    session_id: str
    stopwatch: StopwatchStatus
    hot_zone: Dict[int, int] = {}
    created_at: datetime
