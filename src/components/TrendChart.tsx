'use client';

import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface TrendChartProps {
  data: any[];
  categories: {
    key: string;
    color: string;
    label: string;
  }[];
  title?: string;
  loading?: boolean;
}

export function TrendChart({ data, categories, title, loading }: TrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading || !isMounted) {
    return (
      <div className="w-full bg-poh-bg-secondary p-6 rounded-xl border border-poh-stroke shadow-sm h-[380px] flex flex-col">
        {title && <h3 className="text-lg font-semibold mb-4 text-poh-text-primary">{title}</h3>}
        <div className="flex-1 flex items-center justify-center bg-poh-bg-primary/50 rounded-lg animate-pulse">
          <span className="text-poh-text-secondary">Loading Chart...</span>
        </div>
      </div>
    );
  }

  // Ensure data is valid array
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="w-full bg-poh-bg-secondary p-6 rounded-xl border border-poh-stroke shadow-sm h-[380px] flex flex-col">
      {title && <h3 className="text-lg font-semibold mb-4 text-poh-text-primary">{title}</h3>}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {categories.map((cat) => (
                <linearGradient key={cat.key} id={`color-${cat.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cat.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={cat.color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-secondary)" 
              fontSize={12}
              tickFormatter={(value) => {
                if (!value) return '';
                const date = new Date(Number(value) * 1000);
                return format(date, 'MMM d');
              }}
            />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--stroke)',
                color: 'var(--text-primary)'
              }}
              labelFormatter={(value) => {
                if (!value) return '';
                return format(new Date(Number(value) * 1000), 'MMM d, yyyy');
              }}
            />
            <Legend />
            {categories.map((cat) => (
              <Area
                key={cat.key}
                type="monotone"
                dataKey={cat.key}
                name={cat.label}
                stroke={cat.color}
                fillOpacity={1}
                fill={`url(#color-${cat.key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
