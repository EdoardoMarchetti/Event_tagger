"""
Pydantic models for event data validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class Team(str, Enum):
    """Team options."""
    HOME = "Home"
    AWAY = "Away"


class CrossOutcome(str, Enum):
    """Cross outcome options."""
    NONE = "None"
    COMPLETED = "Completed"
    BLOCKED = "Blocked"
    INTERCEPTED = "Intercepted"
    SAVED = "Saved"


class ShotOutcome(str, Enum):
    """Shot outcome options."""
    NONE = "None"
    GOAL = "Goal"
    POST = "Post"
    BLOCKED = "Blocked"
    OUT = "Out"
    SAVED = "Saved"


class EventCreate(BaseModel):
    """
    Input model for creating a new event.
    
    Attributes:
        minute: Minute of the event (>= 0)
        second: Second of the event (0-59)
        time_in_second: Total time in seconds (>= 0)
        team: Team name (Home or Away)
        event_type: Type of event (e.g., Transition, Corner, Dead-ball, etc.)
        cross_outcome: Cross outcome if applicable (None, Completed, Blocked, Intercepted, Saved)
        shot_outcome: Shot outcome if applicable (None, Goal, Post, Blocked, Out, Saved)
        zone: Zone number on the pitch (optional)
    """
    minute: float = Field(ge=0, description="Minute of the event")
    second: float = Field(ge=0, le=59, description="Second of the event (0-59)")
    time_in_second: float = Field(ge=0, description="Total time elapsed in seconds")
    team: Literal["Home", "Away"] = Field(description="Team name")
    event_type: str = Field(min_length=1, description="Type of event")
    cross_outcome: Optional[Literal["None", "Completed", "Blocked", "Intercepted", "Saved"]] = Field(
        default=None, 
        description="Cross outcome if applicable"
    )
    shot_outcome: Optional[Literal["None", "Goal", "Post", "Blocked", "Out", "Saved"]] = Field(
        default=None,
        description="Shot outcome if applicable"
    )
    zone: Optional[int] = Field(default=None, ge=0, description="Zone number on the pitch")

    @field_validator('shot_outcome')
    @classmethod
    def validate_shot_outcome_with_cross(cls, v, info):
        """Validate that shot_outcome can only be set when cross_outcome is None or Completed."""
        if v and v != "None":
            cross_outcome = info.data.get('cross_outcome')
            if cross_outcome and cross_outcome not in ["None", "Completed"]:
                raise ValueError(
                    "shot_outcome can only be set when cross_outcome is 'None' or 'Completed'"
                )
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "minute": 15.5,
                "second": 30.0,
                "time_in_second": 930.0,
                "team": "Home",
                "event_type": "Transition",
                "cross_outcome": "None",
                "shot_outcome": "Goal",
                "zone": 5
            }
        }


class EventResponse(BaseModel):
    """
    Output model for event data.
    
    Attributes:
        id: Unique event identifier
        minute: Minute of the event
        second: Second of the event
        time_in_second: Total time in seconds
        team: Team name
        event_type: Type of event
        cross_outcome: Cross outcome if applicable
        shot_outcome: Shot outcome if applicable
        zone: Zone number on the pitch
        created_at: Timestamp when the event was created
    """
    id: int = Field(ge=0, description="Unique event identifier")
    minute: float = Field(ge=0, description="Minute of the event")
    second: float = Field(ge=0, le=59, description="Second of the event")
    time_in_second: float = Field(ge=0, description="Total time elapsed in seconds")
    team: str = Field(description="Team name")
    event_type: str = Field(description="Type of event")
    cross_outcome: Optional[str] = Field(default=None, description="Cross outcome if applicable")
    shot_outcome: Optional[str] = Field(default=None, description="Shot outcome if applicable")
    zone: Optional[int] = Field(default=None, ge=0, description="Zone number on the pitch")
    created_at: datetime = Field(description="Timestamp when the event was created")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 0,
                "minute": 15.5,
                "second": 30.0,
                "time_in_second": 930.0,
                "team": "Home",
                "event_type": "Transition",
                "cross_outcome": "None",
                "shot_outcome": "Goal",
                "zone": 5,
                "created_at": "2024-01-01T12:00:00"
            }
        }


class EventStats(BaseModel):
    """
    Model for event statistics per team.
    
    Attributes:
        team: Team name
        goals: Number of goals scored
        shots: Total number of shots attempted
        shots_on_target: Number of shots on target (Goal, Save, Post)
        cross_attempts: Total number of cross attempts
        cross_completed: Number of completed crosses
        transitions: Number of transition events
    """
    team: str = Field(description="Team name")
    goals: int = Field(ge=0, description="Number of goals scored")
    shots: int = Field(ge=0, description="Total number of shots attempted")
    shots_on_target: int = Field(ge=0, description="Number of shots on target")
    cross_attempts: int = Field(ge=0, description="Total number of cross attempts")
    cross_completed: int = Field(ge=0, description="Number of completed crosses")
    transitions: int = Field(ge=0, description="Number of transition events")

    class Config:
        json_schema_extra = {
            "example": {
                "team": "Home",
                "goals": 2,
                "shots": 8,
                "shots_on_target": 5,
                "cross_attempts": 12,
                "cross_completed": 7,
                "transitions": 15
            }
        }
