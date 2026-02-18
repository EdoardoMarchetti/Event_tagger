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
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const eventFormSaveRef = useRef<(() => void) | null>(null);
  const isSubmittingRef = useRef(false);
  
  // Store save callback in a ref so cleanup (e.g. Strict Mode) cannot overwrite it with null via batched state
  const setEventFormSaveRefStable = useCallback((fn: (() => void) | null) => {
    eventFormSaveRef.current = fn;
  }, []);
  
  const handleZoneSelect = useCallback((zone: number | null) => {
    setSelectedZone(zone);
  }, []);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  // Start with [] so server and client first render match (avoids hydration mismatch)
  const [tags, setTags] = useState<string[]>([]);
  const tagsInitializedRef = useRef(false);

  // Load tags from localStorage after mount (client-only)
  useEffect(() => {
    const storedTags = typeof window !== 'undefined' ? localStorage.getItem('event_tags') : null;
    const parsedTags = storedTags && storedTags !== '[]' && storedTags !== 'null' ? JSON.parse(storedTags) : [];
    if (parsedTags.length > 0) setTags(parsedTags);
  }, []);

  // Persist tags to localStorage when they change (skip first run to avoid overwriting loaded data)
  useEffect(() => {
    if (!tagsInitializedRef.current) {
      tagsInitializedRef.current = true;
      return;
    }
    if (typeof window !== 'undefined') {
      if (tags.length > 0) {
        localStorage.setItem('event_tags', JSON.stringify(tags));
      } else {
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
    try {
      await addEvent(eventData);
      setSelectedZone(null); // Reset selection after saving
      setHeatmapRefreshTrigger((prev) => prev + 1); // Trigger heatmap refresh
    } catch (error) {
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

  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [timerExpanded, setTimerExpanded] = useState(true);

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Event Tagger
        </h1>
        <p className="text-white text-base font-medium">Track and analyze match events in real-time</p>
      </div>

        {/* Match Settings Section - Collapsible Card */}
        <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-700 bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
              Match Settings
            </h2>
            <svg 
              className={`w-5 h-5 text-white transition-transform ${settingsExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {settingsExpanded && (
            <div className="px-6 pb-6 space-y-6 border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Home Team</label>
                  <input
                    type="text"
                    value={homeTeamName}
                    onChange={(e) => setHomeTeamName(e.target.value)}
                    placeholder="Enter home team name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Away Team</label>
                  <input
                    type="text"
                    value={awayTeamName}
                    onChange={(e) => setAwayTeamName(e.target.value)}
                    placeholder="Enter away team name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Grid Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rows}
                    onChange={(e) => setRows(parseInt(e.target.value) || 3)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">Grid Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={columns}
                    onChange={(e) => setColumns(parseInt(e.target.value) || 3)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              {/* Tags Section */}
              <div className="p-5 rounded-lg border-2 border-gray-200">
                <label className="block text-sm font-semibold mb-3 text-white uppercase tracking-wide">
                  Event Tags
                </label>
                
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
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
                      className="px-6 py-2.5 bg-slate-700 text-white rounded-md hover:bg-slate-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-white mt-2">
                    Type to search predefined events or enter a custom tag name
                  </p>
                </div>

                {tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">Selected Tags ({tags.length})</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-700 text-white rounded-full text-sm font-medium shadow-sm hover:bg-slate-800 transition-colors"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-0.5 hover:text-slate-300 transition-colors font-bold text-base leading-none"
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
            </div>
          )}
        </section>

        {/* Stopwatch Section - Prominent Card */}
        <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setTimerExpanded(!timerExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-700 bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
              Match Timer
            </h2>
            <svg 
              className={`w-5 h-5 text-white transition-transform ${timerExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {timerExpanded && (
            <div className="p-6">
              <Stopwatch sessionId={sessionId} />
            </div>
          )}
        </section>

        {/* Event Description Section */}
        <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
              Event Description
            </h2>
          </div>
          <div className="p-6 space-y-6">
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
                  onZoneSelect={handleZoneSelect}
                  selectedZone={selectedZone}
                />
              </div>
            </div>

            {/* Save Button and Current Time - Enhanced */}
            <div className="bg-white p-5 rounded-lg border-2 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const saveFn = eventFormSaveRef.current;
                    if (!isSubmittingRef.current && saveFn) {
                      isSubmittingRef.current = true;
                      saveFn();
                      setTimeout(() => {
                        isSubmittingRef.current = false;
                      }, 1000);
                    }
                  }}
                  disabled={isSubmittingRef.current}
                  className="px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingRef.current ? 'Saving...' : 'Save Event'}
                </button>
                <div className="bg-slate-900 text-white p-4 rounded-md text-center flex flex-col justify-center">
                  <div className="text-xs font-medium text-white uppercase tracking-wide mb-1">Current Match Time</div>
                  <div className="text-2xl font-mono font-semibold text-white">
                    {Math.floor(elapsedTime / 60)}:{Math.floor(elapsedTime % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Collected Events Section */}
        <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
                Collected Events
              </h2>
              {events.length > 0 && (
                <span className="bg-slate-700 px-3 py-1 rounded-md text-sm font-medium text-white">
                  {events.length} {events.length === 1 ? 'event' : 'events'}
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            <EventTable events={events} onDelete={handleDeleteEvent} />

            {/* Export Section */}
            <div className="mt-6 p-5 rounded-lg border-2 border-gray-200">
              <h3 className="text-base font-semibold mb-4 text-white uppercase tracking-wide">
                Export Data
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Filename</label>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="Enter filename (without extension)"
                    className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={handleExport}
                  disabled={!filename.trim()}
                  className="px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Download ZIP File
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Visualization Section */}
        <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
              Visualizations & Analytics
            </h2>
          </div>
          <div className="p-6">
            <Visualization
              sessionId={sessionId}
              rows={rows}
              columns={columns}
              refreshTrigger={heatmapRefreshTrigger}
              availableEventTypes={tags}
            />
          </div>
        </section>

        {/* Reset Section */}
        <section className="flex justify-center">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition-colors"
          >
            Reset All Data
          </button>
        </section>

      {/* Reset Confirmation Modal - Enhanced */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 bg-white">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white uppercase tracking-wide">
                Confirm Reset
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6 leading-relaxed font-medium">
                Are you sure you want to reset everything? This will:
              </p>
              <ul className="list-none space-y-2 mb-6">
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Reset the stopwatch timer</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Delete all collected events ({events.length} {events.length === 1 ? 'event' : 'events'})</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Clear all tags ({tags.length} {tags.length === 1 ? 'tag' : 'tags'})</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Reset the selected zone</span>
                </li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-800 font-semibold text-center text-sm">
                  This action cannot be undone
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetConfirm}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition-colors"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
