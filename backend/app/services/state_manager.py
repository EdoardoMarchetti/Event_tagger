"""
Centralized state management service for the backend.

This service provides a unified interface for managing session state,
making it easier to migrate from in-memory storage to a database in the future.
"""
from typing import Dict, Optional, List
from datetime import datetime
from collections import defaultdict
import threading

from app.models.event import EventResponse, EventCreate
from app.models.session import StopwatchStatus


class SessionState:
    """Represents the complete state of a session."""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.events: List[Dict] = []
        self.hot_zones: Dict[int, int] = defaultdict(int)
        self.stopwatch = StopwatchStatus(
            running=False,
            elapsed_time=0.0,
            start_time=None
        )
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
    
    def update_timestamp(self):
        """Update the last modified timestamp."""
        self.updated_at = datetime.now()


class StateManager:
    """
    Centralized state manager for all sessions.
    
    Thread-safe in-memory storage that can be easily replaced with
    a database backend in production.
    """
    
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}
        self._lock = threading.RLock()  # Reentrant lock for nested calls
    
    def get_or_create_session(self, session_id: str) -> SessionState:
        """
        Get existing session or create a new one.
        
        Args:
            session_id: Session identifier
            
        Returns:
            SessionState: Session state object
        """
        with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = SessionState(session_id)
            return self._sessions[session_id]
    
    def get_session(self, session_id: str) -> Optional[SessionState]:
        """
        Get session state if it exists.
        
        Args:
            session_id: Session identifier
            
        Returns:
            SessionState or None if not found
        """
        with self._lock:
            return self._sessions.get(session_id)
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and all its data.
        
        Args:
            session_id: Session identifier
            
        Returns:
            bool: True if deleted, False if not found
        """
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
            return False
    
    def list_sessions(self) -> List[str]:
        """
        List all active session IDs.
        
        Returns:
            List[str]: List of session IDs
        """
        with self._lock:
            return list(self._sessions.keys())
    
    def clear_all(self):
        """Clear all sessions (useful for testing)."""
        with self._lock:
            self._sessions.clear()
    
    def get_session_count(self) -> int:
        """Get the number of active sessions."""
        with self._lock:
            return len(self._sessions)


# Global state manager instance
_state_manager = StateManager()


def get_state_manager() -> StateManager:
    """
    Get the global state manager instance.
    
    Returns:
        StateManager: Global state manager
    """
    return _state_manager
