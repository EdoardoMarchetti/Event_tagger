'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  homeTeamName?: string;
  awayTeamName?: string;
  onSaveRef?: (saveFn: (() => void) | null) => void;
}

export default function EventForm({
  sessionId,
  onSubmit,
  selectedZone,
  basicTags = ['Transition', 'Corner', 'Dead-ball', 'Slow-attck', 'Penalty'],
  onTagsChange,
  rows: rowsProp = 3,
  columns: columnsProp = 3,
  homeTeamName = '',
  awayTeamName = '',
  onSaveRef,
}: EventFormProps) {
  const { elapsedTime } = useStopwatch(sessionId);
  // Use ref to store elapsedTime to avoid recreating handleSubmit
  const elapsedTimeRef = useRef(elapsedTime);
  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);
  
  const [team, setTeam] = useState<'Home' | 'Away'>('Home');
  const [eventType, setEventType] = useState<string>('');
  const [crossOutcome, setCrossOutcome] = useState<'None' | 'Completed' | 'Blocked' | 'Intercepted' | 'Saved'>('None');
  const [shotOutcome, setShotOutcome] = useState<'None' | 'Goal' | 'Post' | 'Blocked' | 'Out' | 'Saved'>('None');
  const [tags, setTags] = useState<string[]>(basicTags);

  useEffect(() => {
    setTags(basicTags);
  }, [basicTags]);

  useEffect(() => {
    if (tags.length > 0 && !tags.includes(eventType)) {
      setEventType(tags[0]);
    }
  }, [tags, eventType]);

  const handleSubmit = useCallback(() => {
    if (!eventType) {
      alert('Please select an event type');
      return;
    }

    // Read current elapsedTime from ref instead of closure
    const currentElapsedTime = elapsedTimeRef.current;
    const minute = Math.floor(currentElapsedTime / 60);
    const second = Math.floor(currentElapsedTime % 60);

    const eventData: EventCreate = {
      minute,
      second,
      time_in_second: currentElapsedTime,
      team,
      event_type: eventType,
      cross_outcome: crossOutcome === 'None' ? null : crossOutcome,
      shot_outcome: shotOutcome === 'None' ? null : shotOutcome,
      zone: selectedZone ?? null,
    };

    if (onSubmit) {
      onSubmit(eventData);
    }
  }, [eventType, selectedZone, team, crossOutcome, shotOutcome, onSubmit]);

  // Expose handleSubmit via ref if provided - use ref to avoid recreating callback
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (onSaveRef) {
      const saveFunction = () => {
        handleSubmitRef.current();
      };
      onSaveRef(saveFunction);
    }
    return () => {
      if (onSaveRef) {
        onSaveRef(null);
      }
    };
  }, [onSaveRef]);

  const canSetShotOutcome = crossOutcome === 'None' || crossOutcome === 'Completed';

  return (
    <div className="space-y-4 w-full">
      {/* Team Selection */}
      <div className="bg-gray-50 p-4 rounded-md border border-gray-300">
        <label className="block text-sm font-semibold mb-3 text-gray-900 uppercase tracking-wide">Team</label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer bg-white px-4 py-2.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              value="Home"
              checked={team === 'Home'}
              onChange={(e) => setTeam(e.target.value as 'Home' | 'Away')}
              className="mr-2"
            />
            <span className="text-gray-900 font-medium">{homeTeamName || 'Home'}</span>
          </label>
          <label className="flex items-center cursor-pointer bg-white px-4 py-2.5 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              value="Away"
              checked={team === 'Away'}
              onChange={(e) => setTeam(e.target.value as 'Home' | 'Away')}
              className="mr-2"
            />
            <span className="text-gray-900 font-medium">{awayTeamName || 'Away'}</span>
          </label>
        </div>
      </div>

      {/* Event Type, Cross, Shot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="w-full bg-gray-50 p-4 rounded-md border border-gray-300">
          <label className="block text-sm font-semibold mb-3 text-gray-900 uppercase tracking-wide">Event Type</label>
          <div className="space-y-2">
            {tags.map((tag) => (
              <label key={tag} className="flex items-center cursor-pointer bg-white px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value={tag}
                  checked={eventType === tag}
                  onChange={(e) => setEventType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-900 text-sm">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full bg-gray-50 p-4 rounded-md border border-gray-300">
          <label className="block text-sm font-semibold mb-3 text-gray-900 uppercase tracking-wide">Cross Outcome</label>
          <div className="space-y-2">
            {['None', 'Completed', 'Blocked', 'Intercepted', 'Saved'].map((outcome) => (
              <label key={outcome} className="flex items-center cursor-pointer bg-white px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
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
                <span className="text-gray-900 text-sm">{outcome}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full bg-gray-50 p-4 rounded-md border border-gray-300">
          <label className="block text-sm font-semibold mb-3 text-gray-900 uppercase tracking-wide">Shot Outcome</label>
          <div className="space-y-2">
            {['None', 'Goal', 'Post', 'Blocked', 'Out', 'Saved'].map((outcome) => (
              <label key={outcome} className="flex items-center cursor-pointer bg-white px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value={outcome}
                  checked={shotOutcome === outcome}
                  onChange={(e) => setShotOutcome(e.target.value as typeof shotOutcome)}
                  disabled={!canSetShotOutcome && outcome !== 'None'}
                  className="mr-2"
                />
                <span className={!canSetShotOutcome && outcome !== 'None' ? 'text-gray-400' : 'text-gray-900 text-sm'}>
                  {outcome}
                </span>
              </label>
            ))}
          </div>
          {!canSetShotOutcome && (
            <p className="text-xs text-gray-600 mt-2">
              Shot outcome can only be set when cross is None or Completed
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
