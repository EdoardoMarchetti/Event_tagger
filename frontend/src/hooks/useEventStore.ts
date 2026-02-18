/**
 * Convenience hooks for accessing the Zustand store.
 * 
 * These hooks provide a simpler API for components to use the store,
 * with automatic initialization and cleanup.
 */

import { useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';

/**
 * Hook for accessing event-related state and actions.
 */
export function useEvents() {
  const events = useEventStore((state) => state.events);
  const stats = useEventStore((state) => state.stats);
  const hotZones = useEventStore((state) => state.hotZones);
  const eventsLoading = useEventStore((state) => state.eventsLoading);
  const statsLoading = useEventStore((state) => state.statsLoading);
  const eventsError = useEventStore((state) => state.eventsError);
  const statsError = useEventStore((state) => state.statsError);
  const fetchEvents = useEventStore((state) => state.fetchEvents);
  const addEvent = useEventStore((state) => state.addEvent);
  const removeEvent = useEventStore((state) => state.removeEvent);
  const fetchStats = useEventStore((state) => state.fetchStats);
  const clearEvents = useEventStore((state) => state.clearEvents);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    stats,
    hotZones,
    eventsLoading,
    statsLoading,
    eventsError,
    statsError,
    fetchEvents,
    addEvent,
    removeEvent,
    fetchStats,
    clearEvents,
  };
}

/**
 * Hook for accessing stopwatch state and actions.
 */
export function useStopwatch() {
  const running = useEventStore((state) => state.running);
  const elapsedTime = useEventStore((state) => state.elapsedTime);
  const startTime = useEventStore((state) => state.startTime);
  const loading = useEventStore((state) => state.stopwatchLoading);
  const error = useEventStore((state) => state.stopwatchError);
  const start = useEventStore((state) => state.start);
  const stop = useEventStore((state) => state.stop);
  const reset = useEventStore((state) => state.reset);
  const refresh = useEventStore((state) => state.refresh);

  // Refresh stopwatch status on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      useEventStore.getState()._stopPolling();
    };
  }, []);

  return {
    running,
    elapsedTime,
    startTime,
    loading,
    error,
    start,
    stop,
    reset,
    refresh,
  };
}

/**
 * Hook for accessing pitch configuration and data.
 */
export function usePitch() {
  const pitchData = useEventStore((state) => state.pitchData);
  const rows = useEventStore((state) => state.rows);
  const columns = useEventStore((state) => state.columns);
  const fieldLength = useEventStore((state) => state.fieldLength);
  const fieldWidth = useEventStore((state) => state.fieldWidth);
  const loading = useEventStore((state) => state.pitchLoading);
  const error = useEventStore((state) => state.pitchError);
  const fetchPitchData = useEventStore((state) => state.fetchPitchData);
  const updateConfig = useEventStore((state) => state.updateConfig);

  // Fetch pitch data on mount
  useEffect(() => {
    fetchPitchData();
  }, [fetchPitchData]);

  return {
    pitchData,
    rows,
    columns,
    fieldLength,
    fieldWidth,
    loading,
    error,
    fetchPitchData,
    updateConfig,
  };
}

/**
 * Hook for accessing session state.
 */
export function useSession() {
  const sessionId = useEventStore((state) => state.sessionId);
  const setSessionId = useEventStore((state) => state.setSessionId);
  const resetSession = useEventStore((state) => state.resetSession);

  return {
    sessionId,
    setSessionId,
    resetSession,
  };
}
