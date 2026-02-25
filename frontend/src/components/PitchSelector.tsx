'use client';

import { useCallback, useRef } from 'react';

interface PitchSelectorProps {
  rows?: number;
  columns?: number;
  fieldLength?: number;
  fieldWidth?: number;
  onZoneSelect?: (zone: number | null) => void;
  selectedZone?: number | null;
}

export default function PitchSelector({
  rows = 3,
  columns = 3,
  fieldLength = 120,
  fieldWidth = 80,
  onZoneSelect,
  selectedZone,
}: PitchSelectorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onZoneSelect || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const colWidth = rect.width / columns;
      const rowHeight = rect.height / rows;

      const colIndex = Math.floor(x / colWidth);
      const rowIndex = Math.floor(y / rowHeight);

      if (colIndex < 0 || colIndex >= columns || rowIndex < 0 || rowIndex >= rows) {
        onZoneSelect(null);
        return;
      }

      const zone = rowIndex * columns + colIndex;

      onZoneSelect(zone);
    },
    [columns, rows, onZoneSelect]
  );

  const totalZones = rows * columns;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative w-full max-w-xl mx-auto aspect-[3/2] bg-green-700 border-4 border-white rounded-lg overflow-hidden cursor-default"
        onClick={handleClick}
      >
        {/* Midfield line */}
        <div className="pointer-events-none absolute inset-[6%]">
          <div className="absolute inset-y-0 left-1/2 w-[3px] bg-white/80 -translate-x-1/2" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 w-20 h-20 border-4 border-white/80 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Grid overlay with zones */}
        <div
          className="absolute inset-[6%] grid"
          style={{
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
          }}
        >
          {Array.from({ length: totalZones }).map((_, index) => {
            const isSelected = selectedZone === index;
            return (
              <div
                key={index}
                className={`relative flex items-center justify-center border border-white/60 ${
                  isSelected ? 'bg-yellow-300/60' : 'bg-transparent'
                }`}
              >
                <span
                  className="text-white font-semibold text-lg select-none"
                  style={{
                    textShadow:
                      '0 0 1px #000, 0 0 2px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000',
                  }}
                >
                  {index}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedZone !== null && selectedZone !== undefined && (
        <p className="text-center mt-2 text-sm text-gray-600">
          Selected zone: {selectedZone} ({rows}x{columns}, field {fieldLength}x{fieldWidth})
        </p>
      )}
    </div>
  );
}
