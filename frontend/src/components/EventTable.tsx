'use client';

import { EventResponse } from '@/lib/api';

interface EventTableProps {
  events: EventResponse[];
  onDelete?: (eventId: number) => void;
}

export default function EventTable({ events, onDelete }: EventTableProps) {
  const formatTime = (minute: number, second: number) => {
    return `${Math.floor(minute)}:${Math.floor(second).toString().padStart(2, '0')}`;
  };

  return (
    <div className="overflow-x-auto rounded-lg border-2 border-gray-200 shadow-sm">
      {events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border-2 border-gray-200">
          <p className="text-gray-500 text-base font-medium mb-1">No events collected yet</p>
          <p className="text-gray-400 text-sm">Start tagging events to see them here</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Team</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Event Type</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cross</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Shot</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Zone</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event, index) => (
              <tr 
                key={event.id} 
                className={`hover:bg-slate-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-mono font-semibold text-gray-900">
                    {Math.floor(event.minute)}:{Math.floor(event.second).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500">{event.time_in_second.toFixed(1)}s</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    event.team === 'Home' 
                      ? 'bg-slate-100 text-slate-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {event.team}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-sm ${
                    event.cross_outcome && event.cross_outcome !== 'None' 
                      ? 'text-gray-900 font-medium' 
                      : 'text-gray-400'
                  }`}>
                    {event.cross_outcome || 'None'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-sm ${
                    event.shot_outcome && event.shot_outcome !== 'None'
                      ? event.shot_outcome === 'Goal'
                        ? 'text-green-600 font-bold'
                        : 'text-gray-900 font-medium'
                      : 'text-gray-400'
                  }`}>
                    {event.shot_outcome || 'None'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {event.zone !== null && event.zone !== undefined ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 font-bold text-sm">
                      {event.zone}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {onDelete && (
                    <button
                      onClick={() => onDelete(event.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
