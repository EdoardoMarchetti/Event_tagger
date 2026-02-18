"""
Business logic for stopwatch functionality.
"""
from datetime import datetime
from app.models.session import StopwatchStatus
from app.services.state_manager import get_state_manager


def start_stopwatch(session_id: str) -> StopwatchStatus:
    """
    Start the stopwatch for a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        StopwatchStatus: Updated stopwatch status
    """
    state_manager = get_state_manager()
    session_state = state_manager.get_or_create_session(session_id)
    
    if not session_state.stopwatch.running:
        session_state.stopwatch.running = True
        session_state.stopwatch.start_time = datetime.now()
        session_state.update_timestamp()
    
    return session_state.stopwatch


def stop_stopwatch(session_id: str) -> StopwatchStatus:
    """
    Stop the stopwatch for a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        StopwatchStatus: Updated stopwatch status
    """
    state_manager = get_state_manager()
    session_state = state_manager.get_or_create_session(session_id)
    
    if session_state.stopwatch.running:
        # Calculate final elapsed time
        if session_state.stopwatch.start_time:
            elapsed = (datetime.now() - session_state.stopwatch.start_time).total_seconds()
            session_state.stopwatch.elapsed_time += elapsed
        session_state.stopwatch.running = False
        session_state.stopwatch.start_time = None
        session_state.update_timestamp()
    
    return session_state.stopwatch


def get_stopwatch_status(session_id: str) -> StopwatchStatus:
    """
    Get current stopwatch status.
    
    Args:
        session_id: Session identifier
        
    Returns:
        StopwatchStatus: Current stopwatch status
    """
    state_manager = get_state_manager()
    session_state = state_manager.get_or_create_session(session_id)
    
    # If running, calculate current elapsed time
    if session_state.stopwatch.running and session_state.stopwatch.start_time:
        elapsed = (datetime.now() - session_state.stopwatch.start_time).total_seconds()
        current_elapsed = session_state.stopwatch.elapsed_time + elapsed
        # Return a copy with updated elapsed time
        return StopwatchStatus(
            running=session_state.stopwatch.running,
            elapsed_time=current_elapsed,
            start_time=session_state.stopwatch.start_time
        )
    
    return session_state.stopwatch


def get_elapsed_time(session_id: str) -> float:
    """
    Get current elapsed time in seconds.
    
    Args:
        session_id: Session identifier
        
    Returns:
        float: Elapsed time in seconds
    """
    status = get_stopwatch_status(session_id)
    return status.elapsed_time


def reset_stopwatch(session_id: str) -> StopwatchStatus:
    """
    Reset the stopwatch for a session.
    
    Args:
        session_id: Session identifier
        
    Returns:
        StopwatchStatus: Reset stopwatch status
    """
    state_manager = get_state_manager()
    session_state = state_manager.get_or_create_session(session_id)
    
    session_state.stopwatch.running = False
    session_state.stopwatch.elapsed_time = 0.0
    session_state.stopwatch.start_time = None
    session_state.update_timestamp()
    
    return session_state.stopwatch
