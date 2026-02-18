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
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Minute</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Second</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Time (s)</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Team</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Event Type</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Cross Outcome</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Shot Outcome</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Zone</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={9} className="border border-gray-300 px-4 py-2 text-center text-gray-500 bg-white">
                No events yet
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 bg-white">
                <td className="border border-gray-300 px-4 py-2 text-gray-900">{event.minute.toFixed(1)}</td>
                <td className="border border-gray-300 px-4 py-2 text-gray-900">{event.second.toFixed(1)}</td>
                <td className="border border-gray-300 px-4 py-2 text-gray-900">{event.time_in_second.toFixed(1)}</td>
                <td className="border border-gray-300 px-4 py-2 text-gray-900">{event.team}</td>
                <td className="border border-gray-300 px-4 py-2 text-gray-900">{event.event_type}</td>
                <td className="border border-gray-300 px-4 py-2 text-gray-900">
                  {event.cross_outcome || 'None'}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-900">
                  {event.shot_outcome || 'None'}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-gray-900">
                  {event.zone !== null && event.zone !== undefined ? event.zone : '-'}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {onDelete && (
                    <button
                      onClick={() => onDelete(event.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
