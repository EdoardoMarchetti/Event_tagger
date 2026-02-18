'use client';

import { useState, useEffect } from 'react';
import { EventCreate } from '@/lib/api';
import { useStopwatch } from '@/hooks/useStopwatch';

interface EventFormProps {
  sessionId?: string;
  onSubmit?: (eventData: EventCreate) => void;
  selectedZone?: number | null;
  basicTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  rows?: number;
  columns?: number;
  onRowsChange?: (rows: number) => void;
  onColumnsChange?: (columns: number) => void;
}

export default function EventForm({
  sessionId,
  onSubmit,
  selectedZone,
  basicTags = ['Transition', 'Corner', 'Dead-ball', 'Slow-attck', 'Penalty'],
  onTagsChange,
  rows: rowsProp = 3,
  columns: columnsProp = 3,
  onRowsChange,
  onColumnsChange,
}: EventFormProps) {
  const { elapsedTime } = useStopwatch(sessionId);
  const [team, setTeam] = useState<'Home' | 'Away'>('Home');
  const [eventType, setEventType] = useState<string>('');
  const [crossOutcome, setCrossOutcome] = useState<'None' | 'Completed' | 'Blocked' | 'Intercepted' | 'Saved'>('None');
  const [shotOutcome, setShotOutcome] = useState<'None' | 'Goal' | 'Post' | 'Blocked' | 'Out' | 'Saved'>('None');
  const [customTag, setCustomTag] = useState('');
  const [tags, setTags] = useState<string[]>(basicTags);
  const [rows, setRows] = useState(rowsProp);
  const [columns, setColumns] = useState(columnsProp);

  useEffect(() => {
    setTags(basicTags);
  }, [basicTags]);

  useEffect(() => {
    setRows(rowsProp);
  }, [rowsProp]);

  useEffect(() => {
    setColumns(columnsProp);
  }, [columnsProp]);

  useEffect(() => {
    if (tags.length > 0 && !tags.includes(eventType)) {
      setEventType(tags[0]);
    }
  }, [tags, eventType]);

  const handleAddTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      const newTags = [...tags, customTag.trim()];
      setTags(newTags);
      setCustomTag('');
      if (onTagsChange) {
        onTagsChange(newTags);
      }
    }
  };

  const handleSubmit = () => {
    if (!eventType) {
      alert('Please select an event type');
      return;
    }

    const minute = Math.floor(elapsedTime / 60);
    const second = Math.floor(elapsedTime % 60);  // Ensure second is integer and < 60

    // #region agent log
    console.log('[DEBUG] EventForm handleSubmit BEFORE creating eventData', { 
      selectedZone, 
      selectedZoneType: typeof selectedZone,
      selectedZoneValue: selectedZone,
      selectedZoneIsNull: selectedZone === null,
      selectedZoneIsUndefined: selectedZone === undefined
    });
    // #endregion

    const eventData: EventCreate = {
      minute,
      second,
      time_in_second: elapsedTime,
      team,
      event_type: eventType,
      cross_outcome: crossOutcome === 'None' ? null : crossOutcome,
      shot_outcome: shotOutcome === 'None' ? null : shotOutcome,
      zone: selectedZone ?? null,
    };

    // #region agent log
    console.log('[DEBUG] EventForm handleSubmit AFTER creating eventData', { selectedZone, zone: eventData.zone, eventData });
    // #endregion

    if (onSubmit) {
      onSubmit(eventData);
    }
  };

  const canSetShotOutcome = crossOutcome === 'None' || crossOutcome === 'Completed';

  return (
    <div className="p-4 border rounded space-y-4">
      <h2 className="text-xl font-bold mb-4">Event description</h2>

      {/* Pitch Configuration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Number of columns on pitch</label>
          <input
            type="number"
            min={3}
            value={columns}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 3;
              setColumns(val);
              if (onColumnsChange) onColumnsChange(val);
            }}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Number of rows on pitch</label>
          <input
            type="number"
            min={3}
            value={rows}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 3;
              setRows(val);
              if (onRowsChange) onRowsChange(val);
            }}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Add Custom Tag */}
      <div>
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
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <select
          multiple
          value={tags}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (option) => option.value);
            setTags(selected);
            if (onTagsChange) {
              onTagsChange(selected);
            }
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
      <div>
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

      {/* Event Type, Cross, Shot */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select event</label>
          <div className="space-y-2">
            {tags.map((tag) => (
              <label key={tag} className="flex items-center">
                <input
                  type="radio"
                  value={tag}
                  checked={eventType === tag}
                  onChange={(e) => setEventType(e.target.value)}
                  className="mr-2"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cross?</label>
          <div className="space-y-2">
            {['None', 'Completed', 'Blocked', 'Intercepted', 'Saved'].map((outcome) => (
              <label key={outcome} className="flex items-center">
                <input
                  type="radio"
                  value={outcome}
                  checked={crossOutcome === outcome}
                  onChange={(e) => {
                    const newCrossOutcome = e.target.value as typeof crossOutcome;
                    setCrossOutcome(newCrossOutcome);
                    if (newCrossOutcome !== 'None' && newCrossOutcome !== 'Completed') {
                      setShotOutcome('None');
                    }
                  }}
                  className="mr-2"
                />
                {outcome}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Shot outcome</label>
          <div className="space-y-2">
            {['None', 'Goal', 'Post', 'Blocked', 'Out', 'Saved'].map((outcome) => (
              <label key={outcome} className="flex items-center">
                <input
                  type="radio"
                  value={outcome}
                  checked={shotOutcome === outcome}
                  onChange={(e) => setShotOutcome(e.target.value as typeof shotOutcome)}
                  disabled={!canSetShotOutcome && outcome !== 'None'}
                  className="mr-2"
                />
                <span className={!canSetShotOutcome && outcome !== 'None' ? 'text-gray-400' : ''}>
                  {outcome}
                </span>
              </label>
            ))}
          </div>
          {!canSetShotOutcome && (
            <p className="text-xs text-gray-500 mt-1">
              Shot outcome can only be set when cross is None or Completed
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
      >
        Save
      </button>

      {/* Display current time */}
      <div className="text-sm text-gray-600">
        Current time: {Math.floor(elapsedTime / 60)}:{Math.floor(elapsedTime % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
}
