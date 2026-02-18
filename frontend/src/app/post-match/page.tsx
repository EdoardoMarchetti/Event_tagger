'use client';

import { useState, useEffect } from 'react';

interface CSVRow {
  [key: string]: string | number;
}

export default function PostMatchPage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {}) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [startColumn, setStartColumn] = useState<string>('');
  const [endColumn, setEndColumn] = useState<string>('');
  const [offset, setOffset] = useState(10);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [configExpanded, setConfigExpanded] = useState(true);
  const [dataExpanded, setDataExpanded] = useState(true);
  const [videoIframeLoaded, setVideoIframeLoaded] = useState(false);
  const [clipIframeLoaded, setClipIframeLoaded] = useState(false);

  // Reset loading when video changes
  useEffect(() => {
    setVideoIframeLoaded(false);
  }, [videoId]);

  useEffect(() => {
    setClipIframeLoaded(false);
  }, [videoId, startTime, endTime]);

  // Extract video ID from YouTube URL (watch, youtu.be, shorts, embed)
  useEffect(() => {
    const url = (youtubeUrl || '').trim();
    
    // Debounce to avoid excessive re-renders while typing
    const timeoutId = setTimeout(() => {
      if (url) {
        // More robust regex that handles various YouTube URL formats
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        ];
        
        let extractedId = '';
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match && match[1]) {
            extractedId = match[1];
            break;
          }
        }
        
        setVideoId(extractedId);
      } else {
        setVideoId('');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [youtubeUrl]);

  // Calculate start and end time when row is selected
  useEffect(() => {
    if (selectedRow !== null && csvData.length > 0 && startColumn) {
      const row = csvData[selectedRow];
      const start = Number(row[startColumn]);
      
      if (!isNaN(start)) {
        if (endColumn && row[endColumn] !== undefined) {
          const end = Number(row[endColumn]);
          if (!isNaN(end)) {
            setStartTime(Math.floor(start));
            setEndTime(Math.floor(end));
          } else {
            setStartTime(Math.floor(start - offset));
            setEndTime(Math.floor(start + offset));
          }
        } else {
          setStartTime(Math.floor(start - offset));
          setEndTime(Math.floor(start + offset));
        }
      } else {
        setStartTime(null);
        setEndTime(null);
      }
    } else {
      setStartTime(null);
      setEndTime(null);
    }
  }, [selectedRow, csvData, startColumn, endColumn, offset]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim());
        setCsvHeaders(headers);
        
        const rows: CSVRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const row: CSVRow = {};
            headers.forEach((header, index) => {
              const value = values[index]?.trim() || '';
              row[header] = isNaN(Number(value)) ? value : Number(value);
            });
            rows.push(row);
          }
        }
        setCsvData(rows);
        setSelectedRow(null);
      }
    };
    reader.readAsText(file);
  };

  const generateYouTubeEmbed = (vidId: string, start?: number | null, end?: number | null) => {
    // Validate video ID
    if (!vidId || vidId.length !== 11) {
      return '';
    }
    
    const baseUrl = `https://www.youtube-nocookie.com/embed/${vidId}`;
    const params: string[] = [];
    
    if (start !== null && start !== undefined && !isNaN(start) && start >= 0) {
      params.push(`start=${Math.floor(start)}`);
    }
    if (end !== null && end !== undefined && !isNaN(end) && end > 0) {
      params.push(`end=${Math.floor(end)}`);
    }
    
    const url = params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
    return url;
  };

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Post Match
        </h1>
        <p className="text-white text-base font-medium">YouTube video and CSV data for clip selection</p>
      </div>

      {/* Configuration & Video Section */}
      <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
        <button
          onClick={() => setConfigExpanded(!configExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-700 bg-slate-900"
        >
          <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
            Configuration & Video
          </h2>
          <svg
            className={`w-5 h-5 text-white transition-transform ${configExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {configExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Selectors */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">YouTube URL</label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-white">CSV file</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-700 file:text-white file:font-medium focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                {csvHeaders.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-white">
                        Start event column (seconds)
                      </label>
                      <select
                        value={startColumn}
                        onChange={(e) => setStartColumn(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select column</option>
                        {csvHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-sm text-white mb-2">
                        End column or offset to create the interval around the start
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-white">End column</label>
                          <select
                            value={endColumn}
                            onChange={(e) => setEndColumn(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                          >
                            <option value="">None</option>
                            {csvHeaders.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-white">Offset (s)</label>
                          <input
                            type="number"
                            min={0}
                            value={offset}
                            onChange={(e) => setOffset(parseInt(e.target.value) || 10)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Video */}
              <div className="overflow-hidden">
                <h3 className="text-lg font-semibold text-white mb-3 uppercase tracking-wide">Complete Video</h3>
                {(() => {
                  const embedUrl = videoId && videoId.length === 11 ? generateYouTubeEmbed(videoId) : '';
                  if (embedUrl) {
                    return (
                      <div className="relative flex justify-center overflow-hidden rounded-md w-full max-w-[560px] min-h-[315px]">
                        {!videoIframeLoaded && (
                          <div
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-md bg-slate-800/90"
                            aria-hidden="true"
                          >
                            <div
                              className="h-10 w-10 animate-spin rounded-full border-2 border-slate-400 border-t-white"
                              role="status"
                            />
                            <span className="text-sm font-medium text-slate-300">Caricamento video...</span>
                          </div>
                        )}
                        <iframe
                          key={videoId}
                          width="560"
                          height="315"
                          src={embedUrl}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="max-w-full h-auto rounded-md"
                          onLoad={() => setVideoIframeLoaded(true)}
                        />
                      </div>
                    );
                  } else if (youtubeUrl.trim()) {
                    return (
                      <div className="flex items-center justify-center min-h-[315px] rounded-md overflow-hidden bg-gray-800/50">
                        <p className="text-gray-400">Invalid YouTube URL format</p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center justify-center min-h-[315px] rounded-md overflow-hidden bg-gray-800/50">
                        <p className="text-gray-400">Insert a valid YouTube URL</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CSV Data & Clip Section */}
      {csvData.length > 0 && (
        <section className="rounded-lg shadow-md border-2 border-gray-200 mb-6 overflow-hidden">
          <button
            onClick={() => setDataExpanded(!dataExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-700 bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
              CSV Data & Clip
            </h2>
            <svg
              className={`w-5 h-5 text-white transition-transform ${dataExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dataExpanded && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: CSV Table */}
                <div className="p-5 rounded-lg border-2 border-gray-200">
                  <h3 className="text-base font-semibold text-white mb-3 uppercase tracking-wide">Select a row</h3>
                  <div className="overflow-x-auto rounded-lg border-2 border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {csvHeaders.map((header) => (
                            <th key={header} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvData.map((row, index) => (
                          <tr
                            key={index}
                            onClick={() => setSelectedRow(index)}
                            className={`cursor-pointer transition-colors ${
                              selectedRow === index
                                ? 'bg-slate-200'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {csvHeaders.map((header) => (
                              <td key={header} className="px-4 py-3 text-sm text-gray-900">
                                {row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Clip */}
                <div className="p-5 rounded-lg border-2 border-gray-200">
                  <h3 className="text-base font-semibold text-white mb-3 uppercase tracking-wide">Clip</h3>
                  {(() => {
                    if (videoId && videoId.length === 11 && (startTime !== null || endTime !== null)) {
                      const embedUrl = generateYouTubeEmbed(videoId, startTime, endTime);
                      if (embedUrl) {
                        return (
                          <div>
                            <div className="relative flex justify-center min-h-[315px]">
                              {!clipIframeLoaded && (
                                <div
                                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-md bg-slate-800/90"
                                  aria-hidden="true"
                                >
                                  <div
                                    className="h-10 w-10 animate-spin rounded-full border-2 border-slate-400 border-t-white"
                                    role="status"
                                  />
                                  <span className="text-sm font-medium text-slate-300">Caricamento clip...</span>
                                </div>
                              )}
                              <iframe
                                key={`${videoId}-${startTime}-${endTime}`}
                                width="560"
                                height="315"
                                src={embedUrl}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="max-w-full rounded-md"
                                onLoad={() => setClipIframeLoaded(true)}
                              />
                            </div>
                            {startTime !== null && endTime !== null && (
                              <p className="text-sm text-white mt-3 text-center font-medium">
                                Time range: {startTime}s – {endTime}s
                              </p>
                            )}
                          </div>
                        );
                      }
                    }
                    return (
                      <div className="flex items-center justify-center h-full min-h-[315px] bg-white border-2 border-gray-200 rounded-md">
                        <p className="text-gray-500">
                          {videoId && videoId.length === 11
                            ? 'Select a row to view clip'
                            : 'Insert a valid YouTube URL first'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
