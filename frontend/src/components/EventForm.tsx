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
  onSaveRef?: (saveFn: () => void) => void;
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:59',message:'handleSubmit called',data:{eventType,hasOnSubmit:!!onSubmit},timestamp:Date.now(),runId:'run4',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!eventType) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:62',message:'handleSubmit blocked - no eventType',data:{eventType},timestamp:Date.now(),runId:'run4',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      alert('Please select an event type');
      return;
    }

    // Read current elapsedTime from ref instead of closure
    const currentElapsedTime = elapsedTimeRef.current;
    const minute = Math.floor(currentElapsedTime / 60);
    const second = Math.floor(currentElapsedTime % 60);

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
      time_in_second: currentElapsedTime,
      team,
      event_type: eventType,
      cross_outcome: crossOutcome === 'None' ? null : crossOutcome,
      shot_outcome: shotOutcome === 'None' ? null : shotOutcome,
      zone: selectedZone ?? null,
    };

    // #region agent log
    console.log('[DEBUG] EventForm handleSubmit AFTER creating eventData', { selectedZone, zone: eventData.zone, eventData });
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:85',message:'About to call onSubmit',data:{hasOnSubmit:!!onSubmit,eventData},timestamp:Date.now(),runId:'run4',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (onSubmit) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:92',message:'Calling onSubmit',data:{},timestamp:Date.now(),runId:'run4',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      onSubmit(eventData);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:95',message:'onSubmit is null/undefined',data:{},timestamp:Date.now(),runId:'run4',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
  }, [eventType, selectedZone, team, crossOutcome, shotOutcome, onSubmit]); // Removed elapsedTime from dependencies

  // Expose handleSubmit via ref if provided - use ref to avoid recreating callback
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  // Track handleSubmit recreation
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:113',message:'handleSubmit recreated',data:{eventType,elapsedTime:elapsedTimeRef.current,selectedZone,team,crossOutcome,shotOutcome,hasOnSubmit:!!onSubmit},timestamp:Date.now(),runId:'run4',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, [handleSubmit]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:119',message:'onSaveRef effect running',data:{hasOnSaveRef:!!onSaveRef,hasHandleSubmit:!!handleSubmitRef.current},timestamp:Date.now(),runId:'run4',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (onSaveRef) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:122',message:'Setting onSaveRef',data:{hasHandleSubmit:!!handleSubmitRef.current},timestamp:Date.now(),runId:'run4',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const saveFunction = () => handleSubmitRef.current();
      onSaveRef(saveFunction);
    }
    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6f348056-91fd-48ed-9289-df6b2c791865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.tsx:128',message:'onSaveRef cleanup running',data:{hasOnSaveRef:!!onSaveRef},timestamp:Date.now(),runId:'run4',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      if (onSaveRef) {
        onSaveRef(null);
      }
    };
  }, [onSaveRef]); // Only depend on onSaveRef - handleSubmit is stable now

  const canSetShotOutcome = crossOutcome === 'None' || crossOutcome === 'Completed';

  return (
    <div className="space-y-4 w-full">
      {/* Team Selection */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <label className="block text-sm font-medium mb-2 text-green-900">Select team</label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer bg-white px-4 py-2 rounded border border-green-300 hover:bg-green-100 transition-colors">
            <input
              type="radio"
              value="Home"
              checked={team === 'Home'}
              onChange={(e) => setTeam(e.target.value as 'Home' | 'Away')}
              className="mr-2"
            />
            <span className="text-gray-900 font-medium">{homeTeamName || 'Home'}</span>
          </label>
          <label className="flex items-center cursor-pointer bg-white px-4 py-2 rounded border border-green-300 hover:bg-green-100 transition-colors">
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
        <div className="w-full bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <label className="block text-sm font-medium mb-2 text-indigo-900">Select event</label>
          <div className="space-y-2">
            {tags.map((tag) => (
              <label key={tag} className="flex items-center cursor-pointer bg-white px-3 py-2 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors">
                <input
                  type="radio"
                  value={tag}
                  checked={eventType === tag}
                  onChange={(e) => setEventType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-900">{tag}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full bg-orange-50 p-4 rounded-lg border border-orange-200">
          <label className="block text-sm font-medium mb-2 text-orange-900">Cross?</label>
          <div className="space-y-2">
            {['None', 'Completed', 'Blocked', 'Intercepted', 'Saved'].map((outcome) => (
              <label key={outcome} className="flex items-center cursor-pointer bg-white px-3 py-2 rounded border border-orange-200 hover:bg-orange-100 transition-colors">
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
                <span className="text-gray-900">{outcome}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full bg-teal-50 p-4 rounded-lg border border-teal-200">
          <label className="block text-sm font-medium mb-2 text-teal-900">Shot outcome</label>
          <div className="space-y-2">
            {['None', 'Goal', 'Post', 'Blocked', 'Out', 'Saved'].map((outcome) => (
              <label key={outcome} className="flex items-center cursor-pointer bg-white px-3 py-2 rounded border border-teal-200 hover:bg-teal-100 transition-colors">
                <input
                  type="radio"
                  value={outcome}
                  checked={shotOutcome === outcome}
                  onChange={(e) => setShotOutcome(e.target.value as typeof shotOutcome)}
                  disabled={!canSetShotOutcome && outcome !== 'None'}
                  className="mr-2"
                />
                <span className={!canSetShotOutcome && outcome !== 'None' ? 'text-gray-400' : 'text-gray-900'}>
                  {outcome}
                </span>
              </label>
            ))}
          </div>
          {!canSetShotOutcome && (
            <p className="text-xs text-teal-700 mt-1">
              Shot outcome can only be set when cross is None or Completed
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
