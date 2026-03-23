import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { StackedChartData } from '../../types';
import { AlignedTooltip } from '../shared/AlignedTooltip';
import { CHART_STYLE, formatAxisDollar } from '../../theme';

interface Props {
  data: StackedChartData[];
  seriesKeys: string[];
  seriesColors: string[];
}

function formatDollar(value: number): string {
  return '$' + Math.round(value).toLocaleString();
}

export function StackedPlot({ data, seriesKeys, seriesColors }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  if (data.length === 0) return null;

  function toggleSeries(name: string) {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ textAlign: 'center' }}>Account Values Over Time</h2>
      <ResponsiveContainer width="100%" height={500}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            interval="preserveStartEnd"
            tick={{ fontSize: 11, fill: CHART_STYLE.axisText }}
            stroke={CHART_STYLE.grid}
          />
          <YAxis
            tickFormatter={formatAxisDollar}
            domain={[0, 'auto']}
            width={60}
            tick={{ fill: CHART_STYLE.axisText }}
            stroke={CHART_STYLE.grid}
          />
          <Tooltip content={<AlignedTooltip hideZeros />} />
          {seriesKeys.map((key, i) => (
            <Area
              key={key}
              type="linear"
              dataKey={key}
              stackId="a"
              stroke={seriesColors[i]}
              fill={seriesColors[i]}
              fillOpacity={0.8}
              hide={hidden.has(key)}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px 20px', marginTop: 12, paddingInline: 30 }}>
        {seriesKeys.map((key, i) => (
          <span
            key={key}
            onClick={() => toggleSeries(key)}
            style={{ cursor: 'pointer', opacity: hidden.has(key) ? 0.35 : 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: seriesColors[i] }} />
            {key}
          </span>
        ))}
      </div>
    </div>
  );
}
