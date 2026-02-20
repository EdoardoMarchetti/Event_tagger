/**
 * API client for Event Tagger backend.
 * 
 * This module provides functions to interact with the FastAPI backend,
 * handling all HTTP requests and type definitions.
 */

// ============================================================================
// Types
// ============================================================================

export interface EventCreate {
  minute: number;
  second: number;
  time_in_second: number;
  team: 'Home' | 'Away';
  event_type: string;
  cross_outcome?: 'None' | 'Completed' | 'Blocked' | 'Intercepted' | 'Saved' | null;
  shot_outcome?: 'None' | 'Goal' | 'Post' | 'Blocked' | 'Out' | 'Saved' | null;
  zone?: number | null;
}

export interface EventResponse {
  id: number;
  minute: number;
  second: number;
  time_in_second: number;
  team: string;
  event_type: string;
  cross_outcome: string | null;
  shot_outcome: string | null;
  zone: number | null;
  created_at: string;
}

export interface EventStats {
  team: string;
  goals: number;
  shots: number;
  shots_on_target: number;
  cross_attempts: number;
  cross_completed: number;
  transitions: number;
}

export interface StopwatchStatus {
  running: boolean;
  elapsed_time: number;
  start_time: string | null;
}

export interface PitchData {
  figure: any; // Plotly figure dict
  zone_dict: Record<string, number[]>;
  hot_zone: Record<string, number>;
  rows: number;
  columns: number;
  field_dimen: number[];
}

export interface HeatmapOptions {
  rows?: number;
  columns?: number;
  field_length?: number;
  field_width?: number;
  event_type?: string | null;
}

export interface PitchDataOptions {
  rows?: number;
  columns?: number;
  field_length?: number;
  field_width?: number;
}

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getHeaders(sessionId?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }
  
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

// ============================================================================
// Session Management
// ============================================================================

export function getSessionId(): string {
  // Generate a simple session ID or use a stored one
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
  return 'default';
}

// ============================================================================
// Events API
// ============================================================================

export async function createEvent(
  event: EventCreate,
  sessionId?: string
): Promise<EventResponse> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'POST',
    headers: getHeaders(sid),
    body: JSON.stringify(event),
  });
  return handleResponse<EventResponse>(response);
}

export async function getEvents(sessionId?: string): Promise<EventResponse[]> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'GET',
    headers: getHeaders(sid),
  });
  return handleResponse<EventResponse[]>(response);
}

export async function deleteEvent(
  eventId: number,
  sessionId?: string
): Promise<void> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
    method: 'DELETE',
    headers: getHeaders(sid),
  });
  return handleResponse<void>(response);
}

export async function getEventStats(sessionId?: string): Promise<EventStats[]> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/events/stats`, {
    method: 'GET',
    headers: getHeaders(sid),
  });
  return handleResponse<EventStats[]>(response);
}

export async function clearAllEvents(sessionId?: string): Promise<void> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/events`, {
    method: 'DELETE',
    headers: getHeaders(sid),
  });
  return handleResponse<void>(response);
}

// ============================================================================
// Stopwatch API
// ============================================================================

export async function startStopwatch(sessionId?: string): Promise<StopwatchStatus> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/stopwatch/start`, {
    method: 'POST',
    headers: getHeaders(sid),
  });
  return handleResponse<StopwatchStatus>(response);
}

export async function stopStopwatch(sessionId?: string): Promise<StopwatchStatus> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/stopwatch/stop`, {
    method: 'POST',
    headers: getHeaders(sid),
  });
  return handleResponse<StopwatchStatus>(response);
}

export async function getStopwatchStatus(sessionId?: string): Promise<StopwatchStatus> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/stopwatch/status?t=${Date.now()}`, {
    method: 'GET',
    headers: getHeaders(sid),
    cache: 'no-store',
  });
  return handleResponse<StopwatchStatus>(response);
}

export async function getElapsedTime(sessionId?: string): Promise<{ elapsed_time: number }> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/stopwatch/elapsed?t=${Date.now()}`, {
    method: 'GET',
    headers: getHeaders(sid),
    cache: 'no-store',
  });
  return handleResponse<{ elapsed_time: number }>(response);
}

export async function resetStopwatch(sessionId?: string): Promise<StopwatchStatus> {
  const sid = sessionId || getSessionId();
  const response = await fetch(`${API_BASE_URL}/api/stopwatch/reset`, {
    method: 'POST',
    headers: getHeaders(sid),
  });
  return handleResponse<StopwatchStatus>(response);
}

// ============================================================================
// Visualization API
// ============================================================================

export async function getHeatmap(
  options: HeatmapOptions,
  sessionId?: string
): Promise<any> {
  const sid = sessionId || getSessionId();
  const params = new URLSearchParams();
  
  if (options.rows !== undefined) params.append('rows', options.rows.toString());
  if (options.columns !== undefined) params.append('columns', options.columns.toString());
  if (options.field_length !== undefined) params.append('field_length', options.field_length.toString());
  if (options.field_width !== undefined) params.append('field_width', options.field_width.toString());
  if (options.event_type) params.append('event_type', options.event_type);
  
  const response = await fetch(`${API_BASE_URL}/api/visualization/heatmap?${params.toString()}`, {
    method: 'POST',
    headers: getHeaders(sid),
  });
  return handleResponse<any>(response);
}

export async function getPitchData(
  options: PitchDataOptions,
  sessionId?: string
): Promise<PitchData> {
  const sid = sessionId || getSessionId();
  const params = new URLSearchParams();
  
  if (options.rows !== undefined) params.append('rows', options.rows.toString());
  if (options.columns !== undefined) params.append('columns', options.columns.toString());
  if (options.field_length !== undefined) params.append('field_length', options.field_length.toString());
  if (options.field_width !== undefined) params.append('field_width', options.field_width.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/visualization/pitch?${params.toString()}`, {
    method: 'GET',
    headers: getHeaders(sid),
  });
  return handleResponse<PitchData>(response);
}

// ============================================================================
// Export API
// ============================================================================

async function downloadFile(
  url: string,
  filename: string,
  sessionId?: string
): Promise<void> {
  const sid = sessionId || getSessionId();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Session-ID': sid,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Export error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export async function exportCSV(
  filename?: string,
  sessionId?: string
): Promise<void> {
  const sid = sessionId || getSessionId();
  const params = filename ? `?filename=${encodeURIComponent(filename)}` : '';
  await downloadFile(
    `${API_BASE_URL}/api/export/csv${params}`,
    filename || 'events.csv',
    sid
  );
}

export async function exportXML(
  filename?: string,
  sessionId?: string
): Promise<void> {
  const sid = sessionId || getSessionId();
  const params = filename ? `?filename=${encodeURIComponent(filename)}` : '';
  await downloadFile(
    `${API_BASE_URL}/api/export/xml${params}`,
    filename || 'events_LiveTagProFormat.xml',
    sid
  );
}

export async function exportZIP(
  filename?: string,
  sessionId?: string
): Promise<void> {
  const sid = sessionId || getSessionId();
  const params = filename ? `?filename=${encodeURIComponent(filename)}` : '';
  await downloadFile(
    `${API_BASE_URL}/api/export/zip${params}`,
    `${filename || 'events'}.zip`,
    sid
  );
}
