'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  addUtcDays,
  endOfUtcDay,
  formatUtcDate,
  parseUtcDateInput,
  startOfUtcDay,
} from '@/lib/utcDate';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onRangeChange: (start: Date | null, end: Date | null) => void;
}

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<string>('30d');

  const presets = [
    { label: '7 Days', value: '7d', days: 7 },
    { label: '30 Days', value: '30d', days: 30 },
    { label: '90 Days', value: '90d', days: 90 },
    { label: 'All Time', value: 'all', days: 3650 }, // Approximation
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    setActivePreset(preset.value);
    const end = endOfUtcDay(new Date());
    let start: Date;

    if (preset.value === 'all') {
      start = startOfUtcDay(new Date('2024-09-01T00:00:00.000Z'));
    } else {
      start = startOfUtcDay(addUtcDays(end, -preset.days));
    }

    onRangeChange(start, end);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    setActivePreset('custom');
    const date = parseUtcDateInput(value);
    if (type === 'start') {
      onRangeChange(date, endDate);
    } else {
      onRangeChange(startDate, date);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center bg-poh-bg-secondary p-4 rounded-xl border border-poh-stroke">
      <div className="flex bg-poh-bg-primary p-1 rounded-lg">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              activePreset === preset.value
                ? "bg-poh-orange text-white shadow-sm"
                : "text-poh-text-secondary hover:text-poh-text-primary hover:bg-black/5"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          className="bg-poh-bg-primary border border-poh-stroke rounded-md px-3 py-1.5 text-sm text-poh-text-primary outline-none focus:ring-2 focus:ring-poh-orange/50"
          value={startDate ? formatUtcDate(startDate) : ''}
          onChange={(e) => handleCustomDateChange('start', e.target.value)}
        />
        <span className="text-poh-text-secondary">-</span>
        <input
          type="date"
          className="bg-poh-bg-primary border border-poh-stroke rounded-md px-3 py-1.5 text-sm text-poh-text-primary outline-none focus:ring-2 focus:ring-poh-orange/50"
          value={endDate ? formatUtcDate(endDate) : ''}
          onChange={(e) => handleCustomDateChange('end', e.target.value)}
        />
      </div>
    </div>
  );
}
