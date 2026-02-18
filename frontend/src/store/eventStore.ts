/**
 * Zustand store for managing application state.
 * 
 * This store centralizes all state management including:
 * - Events
 * - Stopwatch
 * - Session management
 * - Hot zones
 * - Statistics
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  EventResponse,
  EventCreate,
  EventStats,
  StopwatchStatus,
  createEvent,
  getEvents,
  deleteEvent,
  getEventStats,
  startStopwatch,
  stopStopwatch,
  getStopwatchStatus,
  getElapsedTime,
  getPitchData,
  PitchData,
  getSessionId,
} from '@/lib/api';

interface EventState {
  // Events
  events: EventResponse[];
  stats: EventStats[] | null;
  hotZones: Record<string, number>;
  
  // Loading states
  eventsLoading: boolean;
  statsLoading: boolean;
  
  // Error states
  eventsError: Error | null;
  statsError: Error | null;
  
  // Actions
  fetchEvents: () => Promise<void>;
  addEvent: (event: EventCreate) => Promise<EventResponse>;
  removeEvent: (eventId: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  clearEvents: () => void;
}

interface StopwatchState {
  // Stopwatch state
  running: boolean;
  elapsedTime: number;
  startTime: string | null;
  
  // Loading/error states
  stopwatchLoading: boolean;
  stopwatchError: Error | null;
  
  // Polling interval ref (managed internally)
  _intervalRef: ReturnType<typeof setInterval> | null;
  
  // Actions
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
  _startPolling: () => void;
  _stopPolling: () => void;
}

interface PitchState {
  // Pitch configuration
  pitchData: PitchData | null;
  rows: number;
  columns: number;
  fieldLength: number;
  fieldWidth: number;
  
  // Loading/error states
  pitchLoading: boolean;
  pitchError: Error | null;
  
  // Actions
  fetchPitchData: (options?: {
    rows?: number;
    columns?: number;
    field_length?: number;
    field_width?: number;
  }) => Promise<void>;
  updateConfig: (config: {
    rows?: number;
    columns?: number;
    fieldLength?: number;
    fieldWidth?: number;
  }) => void;
}

interface SessionState {
  sessionId: string;
  setSessionId: (id: string) => void;
  resetSession: () => void;
}

type AppState = EventState & StopwatchState & PitchState & SessionState;

export const useEventStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // ====================================================================
        // Session State
        // ====================================================================
        sessionId: getSessionId(),
        setSessionId: (id: string) => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('session_id', id);
          }
          set({ sessionId: id });
        },
        resetSession: () => {
          const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('session_id', newId);
          }
          set({
            sessionId: newId,
            events: [],
            stats: null,
            hotZones: {},
            running: false,
            elapsedTime: 0,
            startTime: null,
          });
          get().clearEvents();
          get().reset();
        },

        // ====================================================================
        // Event State
        // ====================================================================
        events: [],
        stats: null,
        hotZones: {},
        eventsLoading: false,
        statsLoading: false,
        eventsError: null,
        statsError: null,

        fetchEvents: async () => {
          set({ eventsLoading: true, eventsError: null });
          try {
            const events = await getEvents(get().sessionId);
            set({ events, eventsLoading: false });
            
            // Update hot zones from pitch data if available
            const pitchData = get().pitchData;
            if (pitchData && pitchData.hot_zone) {
              set({ hotZones: pitchData.hot_zone });
            }
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to fetch events');
            set({ eventsError: err, eventsLoading: false });
            console.error('Failed to fetch events:', err);
          }
        },

        addEvent: async (event: EventCreate) => {
          try {
            set({ eventsError: null });
            const newEvent = await createEvent(event, get().sessionId);
            set((state) => ({
              events: [...state.events, newEvent],
              stats: null, // Invalidate stats cache
            }));
            
            // Refresh pitch data to update hot zones
            await get().fetchPitchData();
            
            return newEvent;
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to create event');
            set({ eventsError: err });
            console.error('Failed to create event:', err);
            throw err;
          }
        },

        removeEvent: async (eventId: number) => {
          try {
            set({ eventsError: null });
            await deleteEvent(eventId, get().sessionId);
            set((state) => ({
              events: state.events.filter((e) => e.id !== eventId),
              stats: null, // Invalidate stats cache
            }));
            
            // Refresh pitch data to update hot zones
            await get().fetchPitchData();
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to delete event');
            set({ eventsError: err });
            console.error('Failed to delete event:', err);
            throw err;
          }
        },

        fetchStats: async () => {
          set({ statsLoading: true, statsError: null });
          try {
            const stats = await getEventStats(get().sessionId);
            set({ stats, statsLoading: false });
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to fetch stats');
            set({ statsError: err, statsLoading: false });
            console.error('Failed to fetch stats:', err);
          }
        },

        clearEvents: () => {
          set({
            events: [],
            stats: null,
            hotZones: {},
            eventsError: null,
            statsError: null,
          });
        },

        // ====================================================================
        // Stopwatch State
        // ====================================================================
        running: false,
        elapsedTime: 0,
        startTime: null,
        stopwatchLoading: false,
        stopwatchError: null,
        _intervalRef: null,

        start: async () => {
          try {
            set({ stopwatchLoading: true, stopwatchError: null });
            const status = await startStopwatch(get().sessionId);
            set({
              running: status.running,
              elapsedTime: status.elapsed_time,
              startTime: status.start_time || null,
              stopwatchLoading: false,
            });
            get()._startPolling();
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to start stopwatch');
            set({ stopwatchError: err, stopwatchLoading: false });
            console.error('Failed to start stopwatch:', err);
          }
        },

        stop: async () => {
          try {
            set({ stopwatchLoading: true, stopwatchError: null });
            const status = await stopStopwatch(get().sessionId);
            set({
              running: status.running,
              elapsedTime: status.elapsed_time,
              startTime: null,
              stopwatchLoading: false,
            });
            get()._stopPolling();
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to stop stopwatch');
            set({ stopwatchError: err, stopwatchLoading: false });
            console.error('Failed to stop stopwatch:', err);
          }
        },

        reset: async () => {
          get()._stopPolling();
          set({
            running: false,
            elapsedTime: 0,
            startTime: null,
            stopwatchError: null,
          });
        },

        refresh: async () => {
          try {
            set({ stopwatchError: null });
            const status = await getStopwatchStatus(get().sessionId);
            set({
              running: status.running,
              elapsedTime: status.elapsed_time,
              startTime: status.start_time || null,
            });
            
            // Start/stop polling based on status
            if (status.running) {
              get()._startPolling();
            } else {
              get()._stopPolling();
            }
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to refresh stopwatch');
            set({ stopwatchError: err });
            console.error('Failed to refresh stopwatch:', err);
          }
        },

        _startPolling: () => {
          get()._stopPolling(); // Clear any existing interval
          
          const interval = setInterval(async () => {
            try {
              const response = await getElapsedTime(get().sessionId);
              set({ elapsedTime: response.elapsed_time });
            } catch (error) {
              console.error('Failed to get elapsed time:', error);
              // Don't set error state here to avoid spamming
            }
          }, 500);
          
          set({ _intervalRef: interval });
        },

        _stopPolling: () => {
          const interval = get()._intervalRef;
          if (interval) {
            clearInterval(interval);
            set({ _intervalRef: null });
          }
        },

        // ====================================================================
        // Pitch State
        // ====================================================================
        pitchData: null,
        rows: 3,
        columns: 3,
        fieldLength: 120,
        fieldWidth: 80,
        pitchLoading: false,
        pitchError: null,

        fetchPitchData: async (options = {}) => {
          const config = {
            rows: options.rows ?? get().rows,
            columns: options.columns ?? get().columns,
            field_length: options.field_length ?? get().fieldLength,
            field_width: options.field_width ?? get().fieldWidth,
          };
          
          set({ pitchLoading: true, pitchError: null });
          try {
            const pitchData = await getPitchData(
              {
                rows: config.rows,
                columns: config.columns,
                field_length: config.field_length,
                field_width: config.field_width,
              },
              get().sessionId
            );
            
            set({
              pitchData,
              rows: config.rows,
              columns: config.columns,
              fieldLength: config.field_length,
              fieldWidth: config.field_width,
              hotZones: pitchData.hot_zone || {},
              pitchLoading: false,
            });
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to fetch pitch data');
            set({ pitchError: err, pitchLoading: false });
            console.error('Failed to fetch pitch data:', err);
          }
        },

        updateConfig: (config) => {
          set((state) => ({
            rows: config.rows ?? state.rows,
            columns: config.columns ?? state.columns,
            fieldLength: config.fieldLength ?? state.fieldLength,
            fieldWidth: config.fieldWidth ?? state.fieldWidth,
          }));
        },
      }),
      {
        name: 'event-tagger-store',
        partialize: (state) => ({
          // Only persist configuration, not runtime state
          sessionId: state.sessionId,
          rows: state.rows,
          columns: state.columns,
          fieldLength: state.fieldLength,
          fieldWidth: state.fieldWidth,
        }),
      }
    ),
    { name: 'EventTaggerStore' }
  )
);
