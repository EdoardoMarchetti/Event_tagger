import { useState, useEffect, useCallback } from 'react';
import { createEvent, getEvents, deleteEvent, getEventStats, EventResponse, EventCreate, EventStats } from '@/lib/api';

export function useEvents(sessionId?: string) {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<EventStats[] | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents(sessionId);
      setEvents(data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch events');
      setError(error);
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const addEvent = useCallback(async (eventData: EventCreate) => {
    try {
      setError(null);
      const newEvent = await createEvent(eventData, sessionId);
      setEvents((prev) => [...prev, newEvent]);
      // Invalidate stats cache when new event is added
      setStats(null);
      return newEvent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create event');
      setError(error);
      console.error('Failed to create event:', error);
      throw error;
    }
  }, [sessionId]);

  const removeEvent = useCallback(async (eventId: number) => {
    try {
      setError(null);
      await deleteEvent(eventId, sessionId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      // Invalidate stats cache when event is deleted
      setStats(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete event');
      setError(error);
      console.error('Failed to delete event:', error);
      throw error;
    }
  }, [sessionId]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getEventStats(sessionId);
      setStats(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch stats');
      console.error('Failed to fetch stats:', error);
      // Don't set error state here to avoid overwriting main error
    } finally {
      setStatsLoading(false);
    }
  }, [sessionId]);

  // Fetch events on mount or when sessionId changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    stats,
    statsLoading,
    fetchEvents,
    addEvent,
    removeEvent,
    fetchStats,
  };
}
