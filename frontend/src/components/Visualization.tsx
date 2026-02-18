'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getHeatmap } from '@/lib/api';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface VisualizationProps {
  sessionId?: string;
  rows?: number;
  columns?: number;
  fieldLength?: number;
  fieldWidth?: number;
  refreshTrigger?: number; // Increment this to trigger refresh
  availableEventTypes?: string[]; // Available event types for filtering
}

export default function Visualization({
  sessionId,
  rows = 3,
  columns = 3,
  fieldLength = 120,
  fieldWidth = 80,
  refreshTrigger = 0,
  availableEventTypes = [],
}: VisualizationProps) {
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);

  const loadVisualizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Reset heatmap data when loading new filter to avoid showing stale data
      setHeatmapData(null);

      // Load heatmap
      try {
        const heatmap = await getHeatmap(
          {
            rows,
            columns,
            field_length: fieldLength,
            field_width: fieldWidth,
            event_type: selectedEventType,
          },
          sessionId
        );
        setHeatmapData(heatmap);
      } catch (err) {
        console.warn('Failed to load heatmap:', err);
        // Reset heatmap data on error to show error message instead of previous heatmap
        setHeatmapData(null);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load heatmap';
        // Check if error is due to no zone data for the selected event type
        if (errorMessage.includes('No zone data') || errorMessage.includes('No zone data found')) {
          if (selectedEventType) {
            setError(`No zone data available for event type "${selectedEventType}"`);
          } else {
            setError('No zone data available for the selected filter');
          }
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load visualizations';
      setError(errorMessage);
      setHeatmapData(null);
      console.error('Failed to load visualizations:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, rows, columns, fieldLength, fieldWidth, selectedEventType]);

  useEffect(() => {
    loadVisualizations();
  }, [sessionId, rows, columns, fieldLength, fieldWidth, selectedEventType, refreshTrigger, loadVisualizations]);

  if (loading && !heatmapData) {
    return (
      <div className="w-full h-96 bg-gray-100 border rounded flex items-center justify-center">
        <p className="text-gray-600">Loading heatmap...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Heatmap */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Events Heat Map</h3>
          {/* Event Type Filter */}
          {availableEventTypes.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filter by event type:</label>
              <select
                value={selectedEventType || ''}
                onChange={(e) => setSelectedEventType(e.target.value || null)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="">All events</option>
                {availableEventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {heatmapData ? (
          <div className="bg-white border rounded p-4">
            <Plot
              data={heatmapData.data}
              layout={{
                ...heatmapData.layout,
                autosize: true,
              }}
              config={{
                displayModeBar: true,
                responsive: true,
              }}
              style={{ width: '100%', height: '600px' }}
            />
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-100 border rounded flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 text-lg font-medium">
                {error || 'No data available for heatmap'}
              </p>
              {selectedEventType && !error && (
                <p className="text-gray-500 text-sm mt-2">
                  No zone data found for event type "{selectedEventType}"
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadVisualizations}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Refresh Visualizations'}
        </button>
      </div>
    </div>
  );
}
