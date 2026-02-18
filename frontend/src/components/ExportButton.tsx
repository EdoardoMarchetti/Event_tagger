'use client';

import { exportCSV, exportXML, exportZIP } from '@/lib/api';

interface ExportButtonProps {
  sessionId?: string;
}

export default function ExportButton({ sessionId }: ExportButtonProps) {
  const handleExport = async (type: 'csv' | 'xml' | 'zip') => {
    try {
      switch (type) {
        case 'csv':
          await exportCSV(undefined, sessionId);
          break;
        case 'xml':
          await exportXML(undefined, sessionId);
          break;
        case 'zip':
          await exportZIP(undefined, sessionId);
          break;
      }

    } catch (error) {
      console.error(`Failed to export ${type}:`, error);
      alert(`Failed to export ${type}`);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('csv')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Export CSV
      </button>
      <button
        onClick={() => handleExport('xml')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Export XML
      </button>
      <button
        onClick={() => handleExport('zip')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Export ZIP
      </button>
    </div>
  );
}
