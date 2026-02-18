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

  // Extract video ID from YouTube URL
  useEffect(() => {
    if (youtubeUrl) {
      const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (match && match[1]) {
        setVideoId(match[1]);
      } else {
        setVideoId('');
      }
    } else {
      setVideoId('');
    }
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
    const baseUrl = `https://www.youtube-nocookie.com/embed/${vidId}`;
    const params: string[] = [];
    
    if (start !== null && start !== undefined) {
      params.push(`start=${Math.floor(start)}`);
    }
    if (end !== null && end !== undefined) {
      params.push(`end=${Math.floor(end)}`);
    }
    
    const url = params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
    return url;
  };

  return (
    <main className="space-y-8">
      <h1 className="text-4xl font-bold">Post Match ⚽</h1>

      {/* Top Section: Selectors and Video */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Selectors */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Enter YouTube URL</label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Choose a CSV file</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {csvHeaders.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start event column time (must be in seconds)
                </label>
                <select
                  value={startColumn}
                  onChange={(e) => setStartColumn(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
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
                <p className="text-sm text-gray-600 mb-2">
                  Select the column indicating the end or the offset to create the interval around the start
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">End event column time</label>
                    <select
                      value={endColumn}
                      onChange={(e) => setEndColumn(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
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
                    <label className="block text-sm font-medium mb-1">Offset (s)</label>
                    <input
                      type="number"
                      min={0}
                      value={offset}
                      onChange={(e) => setOffset(parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Video */}
        <div>
          {videoId ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Complete Video</h3>
              <div className="flex justify-center">
                <iframe
                  width="560"
                  height="315"
                  src={generateYouTubeEmbed(videoId)}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="max-w-full"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[315px] bg-gray-100 border rounded">
              <p className="text-gray-500">Insert a valid URL</p>
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-300" />

      {/* Bottom Section: CSV Data and Clip */}
      {csvData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: CSV Data */}
          <div>
            <h3 className="text-lg font-semibold mb-2">CSV Data: Select a row</h3>
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {csvHeaders.map((header) => (
                      <th key={header} className="border px-2 py-1 text-left text-sm">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((row, index) => (
                    <tr
                      key={index}
                      onClick={() => setSelectedRow(index)}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedRow === index ? 'bg-blue-100' : ''
                      }`}
                    >
                      {csvHeaders.map((header) => (
                        <td key={header} className="border px-2 py-1 text-sm">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Clip */}
          <div>
            {videoId && (startTime !== null || endTime !== null) ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Clip</h3>
                <div className="flex justify-center">
                  <iframe
                    width="560"
                    height="315"
                    src={generateYouTubeEmbed(videoId, startTime, endTime)}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="max-w-full"
                  />
                </div>
                {startTime !== null && endTime !== null && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Time range: {startTime}s - {endTime}s
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[315px] bg-gray-100 border rounded">
                <p className="text-gray-500">Select a row to view clip</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
