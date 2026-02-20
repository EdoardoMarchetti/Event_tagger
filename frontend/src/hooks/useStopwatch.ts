import { useState, useEffect, useCallback, useRef } from 'react';
import { startStopwatch, stopStopwatch, getStopwatchStatus, getElapsedTime, resetStopwatch, StopwatchStatus } from '@/lib/api';

function sendDebugIngest(payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'development') return;

  fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

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
      // Immediately start polling after starting
      if (status.running) {
        // Force a refresh to start polling
        fetchStatus();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start stopwatch');
      setError(error);
      console.error('Failed to start stopwatch:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, fetchStatus]);

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

  const reset = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await resetStopwatch(sessionId);
      setRunning(status.running);
      setElapsedTime(status.elapsed_time);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reset stopwatch');
      setError(error);
      console.error('Failed to reset stopwatch:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Poll for elapsed time when running
  useEffect(() => {
    // #region agent log
    sendDebugIngest({
      location: 'useStopwatch.ts:76',
      message: 'Polling effect triggered',
      data: { running, elapsedTime },
      timestamp: Date.now(),
      runId: 'run1',
      hypothesisId: 'A',
    });
    // #endregion
    if (running) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Immediate first update
      getElapsedTime(sessionId).then((data) => {
        // #region agent log
        sendDebugIngest({
          location: 'useStopwatch.ts:85',
          message: 'Immediate elapsed time update',
          data: { elapsedTime: data.elapsed_time },
          timestamp: Date.now(),
          runId: 'run1',
          hypothesisId: 'C',
        });
        // #endregion
        setElapsedTime(data.elapsed_time);
      }).catch((err) => {
        console.error('Failed to get elapsed time:', err);
      });

      // Poll every 500ms
      intervalRef.current = setInterval(async () => {
        try {
          const data = await getElapsedTime(sessionId);
          // #region agent log
          sendDebugIngest({
            location: 'useStopwatch.ts:105',
            message: 'Polling update - before setElapsedTime',
            data: { oldElapsedTime: elapsedTime, newElapsedTime: data.elapsed_time },
            timestamp: Date.now(),
            runId: 'run2',
            hypothesisId: 'C',
          });
          // #endregion
          setElapsedTime(data.elapsed_time);
          // #region agent log
          sendDebugIngest({
            location: 'useStopwatch.ts:109',
            message: 'Polling update - after setElapsedTime',
            data: { elapsedTime: data.elapsed_time },
            timestamp: Date.now(),
            runId: 'run2',
            hypothesisId: 'C',
          });
          // #endregion
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
      // Still fetch current elapsed time when stopped
      getElapsedTime(sessionId).then((data) => {
        setElapsedTime(data.elapsed_time);
      }).catch((err) => {
        console.error('Failed to get elapsed time:', err);
      });
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
    reset,
    refresh: fetchStatus,
  };
}
