'use client';

import { useStopwatch } from '@/hooks/useStopwatch';

interface StopwatchProps {
  sessionId?: string;
}

export default function Stopwatch({ sessionId }: StopwatchProps) {
  const { running, elapsedTime, loading, start, stop } = useStopwatch(sessionId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (running) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Start the stopwatch</h2>
      <p className="text-gray-600">
        Click on start / stop button when the match starts to sync events timestamp with recording
      </p>
      
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl font-mono font-bold">{formatTime(elapsedTime)}</div>
        
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-6 py-3 rounded font-semibold transition-colors ${
              running
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Loading...' : running ? 'Stop' : 'Start / Stop'}
          </button>
          
          <div className="text-center">
            {running ? (
              <>
                <p className="text-green-600 font-semibold">Running</p>
                <p className="text-yellow-600 text-sm mt-1">
                  ⚠️ BEFORE STOP SAVE THE DATA. WHEN YOU STOP YOU DELETE THE DATA
                </p>
              </>
            ) : (
              <p className="text-gray-500">Stopped</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
