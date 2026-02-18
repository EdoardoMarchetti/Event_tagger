import { useState, useEffect, useCallback, useRef } from 'react';
import { startStopwatch, stopStopwatch, getStopwatchStatus, getElapsedTime, StopwatchStatus } from '@/lib/api';

export function useStopwatch(sessionId?: string) {
  const [running, setRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch current status from backend
  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const status = await getStopwatchStatus(sessionId);
      setRunning(status.running);
      setElapsedTime(status.elapsed_time);
      return status;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch stopwatch status');
      setError(error);
      console.error('Failed to fetch stopwatch status:', error);
      return null;
    }
  }, [sessionId]);

  const start = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await startStopwatch(sessionId);
      setRunning(status.running);
      setElapsedTime(status.elapsed_time);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start stopwatch');
      setError(error);
      console.error('Failed to start stopwatch:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const stop = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await stopStopwatch(sessionId);
      setRunning(status.running);
      setElapsedTime(status.elapsed_time);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop stopwatch');
      setError(error);
      console.error('Failed to stop stopwatch:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Poll for elapsed time when running
  useEffect(() => {
    if (running) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Poll every 500ms
      intervalRef.current = setInterval(async () => {
        try {
          const data = await getElapsedTime(sessionId);
          setElapsedTime(data.elapsed_time);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to get elapsed time');
          console.error('Failed to get elapsed time:', error);
          // Don't set error state here to avoid spamming, just log it
        }
      }, 500);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Clear interval when stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [running, sessionId]);

  // Check initial status on mount or when sessionId changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    running,
    elapsedTime,
    loading,
    error,
    start,
    stop,
    refresh: fetchStatus,
  };
}
