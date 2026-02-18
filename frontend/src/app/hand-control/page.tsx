'use client';

import { useState, useEffect } from 'react';
import Stopwatch from '@/components/Stopwatch';
import EventTable from '@/components/EventTable';
import { useEvents } from '@/hooks/useEvents';
import { useStopwatch } from '@/hooks/useStopwatch';
import { exportZIP, createEvent, EventCreate, getSessionId } from '@/lib/api';

export default function HandControlPage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {}) {
  const sessionId = typeof window !== 'undefined' ? getSessionId() : 'default';
  const { events, addEvent, removeEvent, fetchEvents } = useEvents(sessionId);
  const { running, elapsedTime } = useStopwatch(sessionId);
  const [tags, setTags] = useState<string[]>(['Transition', 'Corner', 'Dead-ball', 'Slow-attack', 'Penalty']);
  const [tagInput, setTagInput] = useState('');
  const [team, setTeam] = useState<'Home' | 'Away'>('Home');
  const [filename, setFilename] = useState('');
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);

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

  // Refresh events when stopwatch stops
  useEffect(() => {
    if (!running) {
      fetchEvents();
    }
  }, [running, fetchEvents]);

  const handleAddTag = () => {
    const tagValue = tagInput.trim();
    if (!tagValue) return;

    const matchingEvent = predefinedEvents.find(
      event => event.toLowerCase().startsWith(tagValue.toLowerCase()) && !tags.includes(event)
    );

    const tagToAdd = matchingEvent || tagValue;

    if (!tags.includes(tagToAdd)) {
      setTags([...tags, tagToAdd]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSaveTag = async (tag: string) => {
    if (!running) {
      alert('Please start the stopwatch before saving events.');
      return;
    }

    const minute = Math.floor(elapsedTime / 60);
    const second = Math.floor(elapsedTime % 60);  // Ensure second is integer and < 60

    const eventData: EventCreate = {
      minute,
      second,
      time_in_second: elapsedTime,
      team,
      event_type: tag,
      cross_outcome: null,
      shot_outcome: null,
      zone: null,
    };

    try {
      await addEvent(eventData);
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await removeEvent(eventId);
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

  // Calculate grid layout for buttons (uses tags from Match Settings)
  const nCols = tags.length > 0 ? Math.ceil(Math.sqrt(tags.length)) : 1;

  const [stopwatchExpanded, setStopwatchExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [eventDescriptionExpanded, setEventDescriptionExpanded] = useState(true);
  const [eventsExpanded, setEventsExpanded] = useState(true);

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Event Tagger Hand Control
        </h1>
        <p className="text-white text-base font-medium">Quick event tagging with hand control</p>
      </div>

      {/* Match Settings Section */}
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

      {/* Stopwatch Section */}
      <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
        <button
          onClick={() => setStopwatchExpanded(!stopwatchExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-700 bg-slate-900"
        >
          <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
            Match Timer
          </h2>
          <svg 
            className={`w-5 h-5 text-white transition-transform ${stopwatchExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {stopwatchExpanded && (
          <div className="p-6">
            <Stopwatch sessionId={sessionId} />
          </div>
        )}
      </section>

      {/* Event Description Section */}
      <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
        <button
          onClick={() => setEventDescriptionExpanded(!eventDescriptionExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-700 bg-slate-900"
        >
          <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
            Event Description
          </h2>
          <svg 
            className={`w-5 h-5 text-white transition-transform ${eventDescriptionExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {eventDescriptionExpanded && (
          <div className="p-6 space-y-6">

            {/* Team Selection */}
            <div className="p-5 rounded-lg border-2 border-gray-200">
              <label className="block text-sm font-semibold mb-3 text-white uppercase tracking-wide">Team</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer bg-white px-4 py-2.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="Home"
                    checked={team === 'Home'}
                    onChange={(e) => setTeam(e.target.value as 'Home' | 'Away')}
                    className="mr-2"
                  />
                  <span className="text-gray-900 font-medium">Home</span>
                </label>
                <label className="flex items-center cursor-pointer bg-white px-4 py-2.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="Away"
                    checked={team === 'Away'}
                    onChange={(e) => setTeam(e.target.value as 'Home' | 'Away')}
                    className="mr-2"
                  />
                  <span className="text-gray-900 font-medium">Away</span>
                </label>
              </div>
            </div>

            {/* Tag Buttons Grid - uses tags from Match Settings */}
            <div className="p-5 rounded-lg border-2 border-gray-200">
              <label className="block text-sm font-semibold mb-3 text-white uppercase tracking-wide">Quick Tag Buttons</label>
              {tags.length === 0 ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-md p-4">
                  <p className="text-red-800 font-medium">
                    Nessun tag configurato. Imposta i tag nella sezione Match Settings sopra.
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    Aggiungi almeno un evento (es. Transition, Corner, Build-up) nella sezione &quot;Event Tags&quot; di Match Settings per abilitare i pulsanti rapidi.
                  </p>
                </div>
              ) : (
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${nCols}, minmax(0, 1fr))`,
                  }}
                >
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSaveTag(tag)}
                      disabled={!running}
                      className="px-4 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Collected Events Section */}
      <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
        <button
          onClick={() => setEventsExpanded(!eventsExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-700 bg-slate-900"
        >
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
              Collected Events
            </h2>
            {events.length > 0 && (
              <span className="bg-slate-700 px-3 py-1 rounded-md text-sm font-medium text-white">
                {events.length} {events.length === 1 ? 'event' : 'events'}
              </span>
            )}
          </div>
          <svg 
            className={`w-5 h-5 text-white transition-transform ml-4 ${eventsExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {eventsExpanded && (
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
        )}
      </section>
    </main>
  );
}
