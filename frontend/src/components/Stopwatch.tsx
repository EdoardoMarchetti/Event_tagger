'use client';

import { useStopwatch } from '@/hooks/useStopwatch';

interface StopwatchProps {
  sessionId?: string;
  stopwatch?: {
    running: boolean;
    elapsedTime: number;
    loading: boolean;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => Promise<void>;
  };
}

export default function Stopwatch({ sessionId, stopwatch }: StopwatchProps) {
  const fallback = useStopwatch(sessionId);
  const { running, elapsedTime, loading, start, stop, reset } = stopwatch ?? fallback;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-gray-600 mb-2 text-sm font-medium">
          Click start/pause to sync events with recording
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-6">
        {/* Timer Display - Large and Prominent */}
        <div className={`relative ${running ? '' : ''}`}>
          <div className={`text-6xl md:text-7xl font-mono font-semibold ${
            running 
              ? 'text-slate-700' 
              : 'text-gray-400'
          } transition-colors duration-300`}>
            {formatTime(elapsedTime)}
          </div>
          {running && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          )}
        </div>
        
        {/* Control Buttons */}
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="flex gap-3 w-full">
            <button
              onClick={start}
              disabled={loading || running}
              className={`flex-1 px-6 py-3 rounded-md font-semibold transition-colors ${
                running
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-800 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Loading...' : 'Start'}
            </button>
            
            <button
              onClick={stop}
              disabled={loading || !running}
              className={`flex-1 px-6 py-3 rounded-md font-semibold transition-colors ${
                !running
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Loading...' : 'Pause'}
            </button>
            
            <button
              onClick={reset}
              disabled={loading}
              className="px-6 py-3 rounded-md font-semibold transition-colors bg-slate-600 hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
          
          {/* Status Indicator */}
          <div className={`text-center w-full p-4 rounded-md border-2 transition-all ${
            running 
              ? 'bg-white border-slate-300' 
              : 'bg-white border-gray-300'
          }`}>
            {running ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                <p className="text-slate-700 font-semibold">Running</p>
              </div>
            ) : (
              <p className="text-gray-600 font-medium">Stopped</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
