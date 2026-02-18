'use client';

import { useState, useEffect, useCallback } from 'react';
import Stopwatch from '@/components/Stopwatch';
import EventForm from '@/components/EventForm';
import EventTable from '@/components/EventTable';
import PitchSelector from '@/components/PitchSelector';
import Visualization from '@/components/Visualization';
import { useEvents } from '@/hooks/useEvents';
import { useStopwatch } from '@/hooks/useStopwatch';
import { exportZIP } from '@/lib/api';
import { getSessionId } from '@/lib/api';

export default function Home({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {}) {
  const sessionId = typeof window !== 'undefined' ? getSessionId() : 'default';
  const { events, addEvent, removeEvent, fetchEvents } = useEvents(sessionId);
  const { running } = useStopwatch(sessionId);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  
  // Wrap setSelectedZone to log when zone changes
  const handleZoneSelect = useCallback((zone: number | null) => {
    // #region agent log
    console.log('[DEBUG] handleZoneSelect called', { zone, zoneType: typeof zone });
    // #endregion
    setSelectedZone(zone);
  }, []);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [tags, setTags] = useState<string[]>(['Transition', 'Corner', 'Dead-ball', 'Slow-attck', 'Penalty']);
  const [filename, setFilename] = useState('');
  const [heatmapRefreshTrigger, setHeatmapRefreshTrigger] = useState(0);

  // Refresh events when stopwatch stops
  useEffect(() => {
    if (!running) {
      fetchEvents();
    }
  }, [running, fetchEvents]);

  const handleEventSubmit = async (eventData: any) => {
    // #region agent log
    console.log('[DEBUG] handleEventSubmit', { eventData, zone: eventData.zone, selectedZone });
    // #endregion
    try {
      await addEvent(eventData);
      setSelectedZone(null); // Reset selection after saving
      setHeatmapRefreshTrigger((prev) => prev + 1); // Trigger heatmap refresh
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await removeEvent(eventId);
        setHeatmapRefreshTrigger((prev) => prev + 1); // Trigger heatmap refresh
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const handleExport = async () => {
    try {
      await exportZIP(filename || 'events', sessionId);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <main className="space-y-8">
      <h1 className="text-4xl font-bold">Event Tagger</h1>

      {/* Stopwatch Section */}
      <section>
        <Stopwatch sessionId={sessionId} />
      </section>

      <hr className="border-gray-300" />

      {/* Event Description Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Event description</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Event Form */}
          <div>
            <EventForm
              sessionId={sessionId}
              onSubmit={handleEventSubmit}
              selectedZone={selectedZone}
              basicTags={tags}
              onTagsChange={setTags}
              rows={rows}
              columns={columns}
              onRowsChange={setRows}
              onColumnsChange={setColumns}
            />
          </div>

          {/* Right Column: Pitch Selector */}
          <div>
            <PitchSelector
              rows={rows}
              columns={columns}
              sessionId={sessionId}
              onZoneSelect={handleZoneSelect}
              selectedZone={selectedZone}
            />
          </div>
        </div>
      </section>

      <hr className="border-gray-300" />

      {/* Collected Events Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Collected events</h2>
        <EventTable events={events} onDelete={handleDeleteEvent} />

        {/* Export Section */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Define filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename (without extension)"
              className="w-full max-w-md px-3 py-2 border rounded"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={!filename.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download file
          </button>
        </div>
      </section>

      <hr className="border-gray-300" />

      {/* Visualization Section */}
      <section>
        <Visualization
          sessionId={sessionId}
          rows={rows}
          columns={columns}
          refreshTrigger={heatmapRefreshTrigger}
          availableEventTypes={tags}
        />
      </section>
    </main>
  );
}
