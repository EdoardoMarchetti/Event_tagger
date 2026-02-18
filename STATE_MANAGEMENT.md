# State Management Documentation

This document describes the state management implementation for both frontend and backend.

## Backend State Management

### Architecture

The backend uses a centralized `StateManager` class (`backend/app/services/state_manager.py`) that provides thread-safe in-memory storage for all sessions. This design makes it easy to migrate to a database backend in the future.

### Key Components

- **`StateManager`**: Centralized state manager with thread-safe operations
- **`SessionState`**: Represents the complete state of a session (events, stopwatch, hot zones)
- **Service Layer**: `event_service.py` and `stopwatch_service.py` use the state manager

### Usage

```python
from app.services.state_manager import get_state_manager

# Get the global state manager
state_manager = get_state_manager()

# Get or create a session
session_state = state_manager.get_or_create_session(session_id)

# Access session data
events = session_state.events
hot_zones = session_state.hot_zones
stopwatch = session_state.stopwatch

# Update timestamp
session_state.update_timestamp()
```

### Migration to Database

To migrate to a database backend:

1. Create a new `DatabaseStateManager` class that implements the same interface
2. Replace `get_state_manager()` to return the database-backed manager
3. Update `SessionState` to work with ORM models if needed

## Frontend State Management

### Architecture

The frontend uses **Zustand** for state management (`frontend/src/store/eventStore.ts`). The store centralizes all application state including:

- Events and statistics
- Stopwatch state
- Pitch configuration and data
- Session management
- Hot zones

### Usage Options

#### Option 1: Direct Store Access (Recommended)

```typescript
import { useEventStore } from '@/store/eventStore';

function MyComponent() {
  const events = useEventStore((state) => state.events);
  const addEvent = useEventStore((state) => state.addEvent);
  const fetchEvents = useEventStore((state) => state.fetchEvents);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div>
      {events.map(event => <div key={event.id}>{event.event_type}</div>)}
    </div>
  );
}
```

#### Option 2: Convenience Hooks

```typescript
import { useEvents, useStopwatch, usePitch } from '@/hooks/useEventStore';

function MyComponent() {
  const { events, addEvent, fetchEvents } = useEvents();
  const { running, elapsedTime, start, stop } = useStopwatch();
  const { pitchData, rows, columns } = usePitch();

  // Hooks automatically fetch data on mount
  return <div>...</div>;
}
```

### Store Structure

```typescript
interface AppState {
  // Session
  sessionId: string;
  setSessionId: (id: string) => void;
  resetSession: () => void;

  // Events
  events: EventResponse[];
  stats: EventStats[] | null;
  hotZones: Record<string, number>;
  eventsLoading: boolean;
  statsLoading: boolean;
  eventsError: Error | null;
  statsError: Error | null;
  fetchEvents: () => Promise<void>;
  addEvent: (event: EventCreate) => Promise<EventResponse>;
  removeEvent: (eventId: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  clearEvents: () => void;

  // Stopwatch
  running: boolean;
  elapsedTime: number;
  startTime: string | null;
  loading: boolean;
  error: Error | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;

  // Pitch
  pitchData: PitchData | null;
  rows: number;
  columns: number;
  fieldLength: number;
  fieldWidth: number;
  fetchPitchData: (options?) => Promise<void>;
  updateConfig: (config) => void;
}
```

### Persistence

The store uses Zustand's `persist` middleware to save configuration to localStorage:
- Session ID
- Pitch configuration (rows, columns, field dimensions)

Runtime state (events, stopwatch) is not persisted and is fetched from the backend.

### Migration from Old Hooks

The old hooks (`useEvents.ts`, `useStopwatch.ts`) are still available for backward compatibility. To migrate:

**Before:**
```typescript
import { useEvents } from '@/hooks/useEvents';
const { events, addEvent } = useEvents(sessionId);
```

**After:**
```typescript
import { useEvents } from '@/hooks/useEventStore';
const { events, addEvent } = useEvents();
// sessionId is managed automatically by the store
```

## Benefits

1. **Centralized State**: All state in one place, easier to debug and maintain
2. **Type Safety**: Full TypeScript support
3. **Performance**: Zustand's selector-based subscriptions prevent unnecessary re-renders
4. **Persistence**: Configuration automatically saved to localStorage
5. **Thread Safety**: Backend state manager uses locks for concurrent access
6. **Migration Path**: Easy to migrate backend to database without changing service APIs

## Testing

### Backend

```python
from app.services.state_manager import get_state_manager

def test_state_manager():
    manager = get_state_manager()
    session = manager.get_or_create_session("test")
    assert session.session_id == "test"
```

### Frontend

```typescript
import { useEventStore } from '@/store/eventStore';

// In tests, you can directly access the store
const store = useEventStore.getState();
store.addEvent(mockEvent);
expect(store.events).toHaveLength(1);
```
