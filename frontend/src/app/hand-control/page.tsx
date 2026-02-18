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
  const [tags, setTags] = useState<string[]>(['Transition', 'Corner', 'Dead-ball', 'Slow-attck', 'Penalty']);
  const [customTag, setCustomTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(tags);
  const [team, setTeam] = useState<'Home' | 'Away'>('Home');
  const [filename, setFilename] = useState('');

  // Update selectedTags when tags change
  useEffect(() => {
    setSelectedTags(tags);
  }, [tags]);

  // Refresh events when stopwatch stops
  useEffect(() => {
    if (!running) {
      fetchEvents();
    }
  }, [running, fetchEvents]);

  const handleAddTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      const newTags = [...tags, customTag.trim()];
      setTags(newTags);
      setSelectedTags(newTags);
      setCustomTag('');
    }
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

  // Calculate grid layout for buttons
  const nCols = Math.ceil(Math.sqrt(selectedTags.length));
  const nRows = Math.ceil(selectedTags.length / nCols);

  return (
    <main className="space-y-8">
      <h1 className="text-4xl font-bold">Event Tagger Hand Control</h1>

      {/* Stopwatch Section */}
      <section>
        <Stopwatch sessionId={sessionId} />
      </section>

      <hr className="border-gray-300" />

      {/* Event Description Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Event description</h2>

        {/* Add Custom Tag */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            <strong>Add a Tag</strong>: Add custom events such as Build up or Defending situation
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Enter custom tag"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        {/* Tag Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Tags</label>
          <select
            multiple
            value={selectedTags}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              setSelectedTags(selected);
            }}
            className="w-full px-3 py-2 border rounded min-h-[100px]"
            size={Math.min(tags.length, 5)}
          >
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>

        {/* Team Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select team</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="Home"
                checked={team === 'Home'}
                onChange={(e) => setTeam(e.target.value as 'Home' | 'Away')}
                className="mr-2"
              />
              Home
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="Away"
                checked={team === 'Away'}
                onChange={(e) => setTeam(e.target.value as 'Home' | 'Away')}
                className="mr-2"
              />
              Away
            </label>
          </div>
        </div>

        {/* Tag Buttons Grid */}
        <div className="mb-4">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${nCols}, minmax(0, 1fr))`,
            }}
          >
            {selectedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSaveTag(tag)}
                disabled={!running}
                className="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {tag}
              </button>
            ))}
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
    </main>
  );
}
