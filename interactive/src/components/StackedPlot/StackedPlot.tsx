import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
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
  const containerRef = useRef<HTMLDivElement>(null);

  if (data.length === 0) return null;

  function handleExport() {
    if (!containerRef.current) return;
    toPng(containerRef.current, { cacheBust: true }).then(dataUrl => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'stacked-plot.png';
      a.click();
    });
  }

  function toggleSeries(name: string) {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <button
        onClick={handleExport}
        title="Export as image"
        style={{ position: 'absolute', top: 0, right: 24, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)', opacity: 0.6 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
      <div ref={containerRef}>
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
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, paddingInline: 30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', columnGap: 40, rowGap: 4, fontSize: 14 }}>
          {seriesKeys.map((key, i) => {
            const finalValue = data[data.length - 1][key] as number;
            return (
              <div
                key={key}
                onClick={() => toggleSeries(key)}
                style={{ cursor: 'pointer', opacity: hidden.has(key) ? 0.35 : 1, display: 'flex', alignItems: 'center', gap: 0 }}
              >
                <span style={{ display: 'inline-block', width: 12, height: 3, background: seriesColors[i], borderRadius: 1, marginRight: 8, flexShrink: 0 }} />
                <span style={{ color: seriesColors[i], textAlign: 'right', marginRight: 12 }}>{key}:</span>
                <span style={{ color: seriesColors[i] }}>{formatDollar(finalValue)}</span>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
