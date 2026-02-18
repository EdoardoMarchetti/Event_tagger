"""
Business logic for event management.
"""
from typing import List, Dict, Optional
from collections import defaultdict
import pandas as pd
from datetime import datetime

from app.models.event import EventCreate, EventResponse, EventStats
from app.utils.data_manipulation import create_event_dataframe
from app.services.state_manager import get_state_manager


def create_event(session_id: str, event_data: EventCreate) -> EventResponse:
    """
    Create a new event for a session.
    
    Args:
        session_id: Session identifier
        event_data: Event data to create
        
    Returns:
        EventResponse: Created event with ID
    """
    # #region agent log
    print(f'[DEBUG] create_event called: zone={event_data.zone}, type={type(event_data.zone)}')
    # #endregion
    state_manager = get_state_manager()
    session_state = state_manager.get_or_create_session(session_id)
    
    # Generate event ID (simple increment)
    event_id = len(session_state.events)
    
    # Create event dict
    event_dict = {
        'id': event_id,
        'minute': event_data.minute,
        'second': event_data.second,
        'time_in_second': event_data.time_in_second,
        'team': event_data.team,
        'event_type': event_data.event_type,
        'cross_outcome': event_data.cross_outcome,
        'shot_outcome': event_data.shot_outcome,
        'zone': event_data.zone,
        'created_at': datetime.now()
    }
    
    # #region agent log
    print(f'[DEBUG] event_dict created: zone={event_dict["zone"]}, type={type(event_dict["zone"])}')
    # #endregion
    
    # Store event
    session_state.events.append(event_dict)
    
    # Update hot zone if zone is provided
    if event_data.zone is not None:
        session_state.hot_zones[event_data.zone] += 1
    
    session_state.update_timestamp()
    result = EventResponse(**event_dict)
    # #region agent log
    print(f'[DEBUG] EventResponse created: zone={result.zone}, type={type(result.zone)}')
    # #endregion
    return result


def get_events(session_id: str) -> List[EventResponse]:
    """
    Get all events for a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        List[EventResponse]: List of events
    """
    state_manager = get_state_manager()
    session_state = state_manager.get_or_create_session(session_id)
    return [EventResponse(**event) for event in session_state.events]


def delete_event(session_id: str, event_id: int) -> bool:
    """
    Delete an event by ID.
    
    Args:
        session_id: Session identifier
        event_id: Event ID to delete
        
    Returns:
        bool: True if deleted, False if not found
    """
    state_manager = get_state_manager()
    session_state = state_manager.get_or_create_session(session_id)
    
    if event_id >= len(session_state.events):
        return False
    
    # Get event to check zone
    event = session_state.events[event_id]
    
    # Remove from storage
    del session_state.events[event_id]
    
    # Reindex remaining events
    for i, evt in enumerate(session_state.events):
        evt['id'] = i
    
    # Update hot zone if zone was set
    if event.get('zone') is not None:
        zone = event['zone']
        if session_state.hot_zones.get(zone, 0) > 0:
            session_state.hot_zones[zone] -= 1
    
    session_state.update_timestamp()
    return True


def get_events_dataframe(session_id: str) -> pd.DataFrame:
    """
    Get events as a DataFrame.
    
    Args:
        session_id: Session identifier
        
    Returns:
        pd.DataFrame: Events as DataFrame
    """
    events = get_events(session_id)
    if not events:
        return pd.DataFrame(columns=[
            'minute', 'second', 'time_in_second', 'team', 'event_type',
            'cross_outcome', 'shot_outcome', 'zone'
        ])
    
    return pd.DataFrame([{
        'minute': e.minute,
        'second': e.second,
        'time_in_second': e.time_in_second,
        'team': e.team,
        'event_type': e.event_type,
        'cross_outcome': e.cross_outcome,
        'shot_outcome': e.shot_outcome,
        'zone': e.zone
    } for e in events])


def get_event_stats(session_id: str) -> List[EventStats]:
    """
    Calculate event statistics per team.
    
    Args:
        session_id: Session identifier
        
    Returns:
        List[EventStats]: Statistics for each team
    """
    df = get_events_dataframe(session_id)
    
    if df.empty:
        return []
    
    stats_list = []
    for team in df['team'].unique():
        team_df = df.loc[df['team'] == team, :]
        stats = EventStats(
            team=team,
            goals=team_df['shot_outcome'].isin(['Goal']).sum(),
            shots=len(team_df.loc[team_df['shot_outcome'] != 'None']),
            shots_on_target=team_df['shot_outcome'].isin(['Goal', 'Save', 'Post']).sum(),
            cross_attempts=len(team_df.loc[team_df['cross_outcome'] != 'None']),
            cross_completed=len(team_df[team_df['cross_outcome'] == 'Completed']),
            transitions=len(team_df[team_df['event_type'] == 'Transition'])
        )
        stats_list.append(stats)
    
    return stats_list


def get_hot_zone(session_id: str, event_type: Optional[str] = None) -> Dict[int, int]:
    """
    Get hot zone counts for a session, optionally filtered by event type.
    
    Args:
        session_id: Session identifier
        event_type: Optional event type filter (e.g., 'Transition', 'Corner', etc.)
        
    Returns:
        Dict[int, int]: Zone number -> count mapping
    """
    state_manager = get_state_manager()
    session_state = state_manager.get_or_create_session(session_id)
    
    if event_type is None:
        # Return all hot zones
        return dict(session_state.hot_zones)
    
    # Filter by event type
    hot_zones_filtered: Dict[int, int] = defaultdict(int)
    for event in session_state.events:
        if event.get('event_type') == event_type and event.get('zone') is not None:
            hot_zones_filtered[event['zone']] += 1
    
    return dict(hot_zones_filtered)


def clear_session(session_id: str) -> None:
    """
    Clear all events and hot zones for a session.
    
    Args:
        session_id: Session identifier
    """
    state_manager = get_state_manager()
    session_state = state_manager.get_session(session_id)
    if session_state:
        session_state.events.clear()
        session_state.hot_zones.clear()
        session_state.update_timestamp()
