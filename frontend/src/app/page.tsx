'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Stopwatch from '@/components/Stopwatch';
import EventForm from '@/components/EventForm';
import EventTable from '@/components/EventTable';
import PitchSelector from '@/components/PitchSelector';
import Visualization from '@/components/Visualization';
import { useEvents } from '@/hooks/useEvents';
import { useStopwatch } from '@/hooks/useStopwatch';
import { exportZIP, clearAllEvents } from '@/lib/api';
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
  const stopwatchHook = useStopwatch(sessionId);
  const { running, reset: resetStopwatch, elapsedTime } = stopwatchHook;
  
  // Track elapsedTime changes in render
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:25',message:'elapsedTime changed in page.tsx',data:{elapsedTime,running},timestamp:Date.now(),runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }, [elapsedTime, running]);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [eventFormSaveRef, setEventFormSaveRef] = useState<(() => void) | null>(null);
  const isSubmittingRef = useRef(false);
  
  // Stabilize setEventFormSaveRef to prevent unnecessary re-renders
  const setEventFormSaveRefStable = useCallback((fn: (() => void) | null) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:30',message:'setEventFormSaveRef called',data:{hasFn:!!fn},timestamp:Date.now(),runId:'run3',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setEventFormSaveRef(fn);
  }, []);
  
  // Track eventFormSaveRef changes
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:36',message:'eventFormSaveRef changed',data:{hasRef:!!eventFormSaveRef},timestamp:Date.now(),runId:'run3',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  }, [eventFormSaveRef]);
  
  // Wrap setSelectedZone to log when zone changes
  const handleZoneSelect = useCallback((zone: number | null) => {
    // #region agent log
    console.log('[DEBUG] handleZoneSelect called', { zone, zoneType: typeof zone });
    // #endregion
    setSelectedZone(zone);
  }, []);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [tags, setTags] = useState<string[]>(() => {
    // #region agent log
    const storedTags = typeof window !== 'undefined' ? localStorage.getItem('event_tags') : null;
    const parsedTags = storedTags && storedTags !== '[]' && storedTags !== 'null' ? JSON.parse(storedTags) : [];
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:40',message:'Initializing tags',data:{storedTags,parsedTags},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return parsedTags;
  });
  
  const tagsInitializedRef = useRef(false);
  
  // Persist tags to localStorage
  useEffect(() => {
    // Skip first render to avoid overwriting with empty array on initial load
    if (!tagsInitializedRef.current) {
      tagsInitializedRef.current = true;
      return;
    }
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:52',message:'Saving tags to localStorage',data:{tags},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (typeof window !== 'undefined') {
      if (tags.length > 0) {
        localStorage.setItem('event_tags', JSON.stringify(tags));
      } else {
        // Don't save empty array, just remove the key
        localStorage.removeItem('event_tags');
      }
    }
  }, [tags]);
  const [tagInput, setTagInput] = useState('');
  const [filename, setFilename] = useState('');
  const [heatmapRefreshTrigger, setHeatmapRefreshTrigger] = useState(0);

  const predefinedEvents = [
    'Transition',
    'Corner',
    'Dead-ball',
    'Slow-attack',
    'Penalty',
    'Free-kick',
    'Throw-in',
    'Goal-kick',
    'Offside',
    'Foul',
    'Yellow-card',
    'Red-card',
    'Substitution',
    'Build-up',
    'Defending'
  ];

  const handleAddTag = () => {
    const tagValue = tagInput.trim();
    if (!tagValue) return;

    // Cerca il primo evento predefinito che corrisponde (case-insensitive)
    const matchingEvent = predefinedEvents.find(
      event => event.toLowerCase().startsWith(tagValue.toLowerCase()) && !tags.includes(event)
    );

    // Se c'è una corrispondenza, usa quella, altrimenti usa il valore inserito
    const tagToAdd = matchingEvent || tagValue;

    if (!tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Refresh events when stopwatch stops
  useEffect(() => {
    if (!running) {
      fetchEvents();
    }
  }, [running, fetchEvents]);


  const handleEventSubmit = useCallback(async (eventData: any) => {
    // #region agent log
    console.log('[DEBUG] handleEventSubmit', { eventData, zone: eventData.zone, selectedZone });
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:91',message:'handleEventSubmit called',data:{eventData},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:95',message:'Calling addEvent',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      await addEvent(eventData);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:97',message:'addEvent completed successfully',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setSelectedZone(null); // Reset selection after saving
      setHeatmapRefreshTrigger((prev) => prev + 1); // Trigger heatmap refresh
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:101',message:'addEvent failed',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    }
  }, [addEvent, selectedZone]);

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

  const handleResetConfirm = async () => {
    try {
      // Reset stopwatch
      await resetStopwatch();
      // Clear all events
      await clearAllEvents(sessionId);
      // Refresh events list
      await fetchEvents();
      // Reset local state
      setSelectedZone(null);
      setTags([]);
      setTagInput('');
      setFilename('');
      setHeatmapRefreshTrigger((prev) => prev + 1);
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Failed to reset:', error);
      alert('Failed to reset. Please try again.');
    }
  };

  return (
    <main className="space-y-8">
      <h1 className="text-4xl font-bold">Event Tagger</h1>

      {/* Match Settings Section */}
      <section className="bg-gray-50 p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Match Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Home Team Name</label>
            <input
              type="text"
              value={homeTeamName}
              onChange={(e) => setHomeTeamName(e.target.value)}
              placeholder="Enter home team name"
              className="w-full px-3 py-2 border rounded bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Away Team Name</label>
            <input
              type="text"
              value={awayTeamName}
              onChange={(e) => setAwayTeamName(e.target.value)}
              placeholder="Enter away team name"
              className="w-full px-3 py-2 border rounded bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Field Grid - Rows</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 3)}
              className="w-full px-3 py-2 border rounded bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Field Grid - Columns</label>
            <input
              type="number"
              min="1"
              max="10"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value) || 3)}
              className="w-full px-3 py-2 border rounded bg-white text-gray-900"
            />
          </div>
        </div>
        
        {/* Add a Tag */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium mb-2 text-blue-900">
            <strong>Add a Tag</strong>: Search predefined events or enter a custom tag
          </label>
          
          {/* Single Input with Search and Custom Support */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  list="predefined-events"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Search events or type custom tag..."
                  className="w-full px-3 py-2 border rounded bg-white text-gray-900 pr-10"
                />
                <datalist id="predefined-events">
                  {predefinedEvents
                    .filter(event => !tags.includes(event))
                    .map((event) => (
                      <option key={event} value={event} />
                    ))}
                </datalist>
              </div>
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.includes(tagInput.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Type to search predefined events or enter a custom tag name
            </p>
          </div>

          {/* Selected Tags Pills */}
          {tags.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2 text-blue-900">Selected Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-blue-200 transition-colors"
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <hr className="border-gray-300" />

      {/* Stopwatch Section */}
      <section>
        <Stopwatch sessionId={sessionId} />
      </section>

      <hr className="border-gray-300" />

      {/* Event Description Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Event description</h2>
        <div className="p-4 border rounded space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Event Form */}
            <div className="w-full">
              <EventForm
                sessionId={sessionId}
                onSubmit={handleEventSubmit}
                selectedZone={selectedZone}
                basicTags={tags}
                onTagsChange={setTags}
                rows={rows}
                columns={columns}
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                onSaveRef={setEventFormSaveRefStable}
              />
            </div>

            {/* Right Column: Pitch Selector */}
            <div className="w-full">
              <PitchSelector
                rows={rows}
                columns={columns}
                sessionId={sessionId}
                onZoneSelect={handleZoneSelect}
                selectedZone={selectedZone}
              />
            </div>
          </div>

          {/* Save Button and Current Time - Full Width */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
            {/* #region agent log */}
            {(() => {
              fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:309',message:'Rendering Current time section',data:{elapsedTime,running},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              return null;
            })()}
            {/* #endregion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:312',message:'Save button clicked',data:{eventFormSaveRef:!!eventFormSaveRef,isSubmitting:isSubmittingRef.current},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                  if (!isSubmittingRef.current && eventFormSaveRef) {
                    isSubmittingRef.current = true;
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:317',message:'Calling eventFormSaveRef',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    // #endregion
                    eventFormSaveRef();
                    setTimeout(() => {
                      isSubmittingRef.current = false;
                    }, 1000);
                  } else {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:323',message:'Save button blocked',data:{isSubmitting:isSubmittingRef.current,hasRef:!!eventFormSaveRef},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                  }
                }}
                disabled={isSubmittingRef.current}
                className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <div className="bg-gray-800 text-white p-3 rounded-lg text-center flex flex-col justify-center">
                <div className="text-sm font-medium">Current time</div>
                <div className="text-lg font-mono font-bold">
                  {Math.floor(elapsedTime / 60)}:{Math.floor(elapsedTime % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
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
            <label className="block text-sm font-medium mb-1 text-gray-900">Define filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename (without extension)"
              className="w-full max-w-md px-3 py-2 border rounded bg-white text-gray-900 placeholder-gray-500"
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

      <hr className="border-gray-300" />

      {/* Reset Section */}
      <section className="flex justify-center pb-8">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 font-semibold transition-colors"
        >
          Reset All
        </button>
      </section>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Confirm Reset</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to reset everything? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reset the stopwatch timer</li>
                <li>Delete all collected events</li>
                <li>Clear all tags</li>
                <li>Reset the selected zone</li>
              </ul>
              <strong className="text-red-600">This action cannot be undone!</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
