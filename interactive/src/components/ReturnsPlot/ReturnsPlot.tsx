import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ReturnsChartData } from '../../types';
import { AlignedTooltip } from '../shared/AlignedTooltip';
import { SERIES_COLORS, CHART_STYLE, formatAxisDollar } from '../../theme';

interface Props {
  data: ReturnsChartData[];
  annualRate: number;
}

function formatDollar(value: number): string {
  return '$' + Math.round(value).toLocaleString();
}

export function ReturnsPlot({ data, annualRate }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showDots, setShowDots] = useState(false);

  if (data.length === 0) return null;

  const rateLabel = `Expected @ ${(annualRate * 100).toFixed(2)}%/yr`;
  const latest = data[data.length - 1];
  const latestPoints = [
    { label: 'Principle', value: latest.principle, color: SERIES_COLORS.principle },
    { label: 'Balance',   value: latest.balance,   color: SERIES_COLORS.balance },
    { label: rateLabel,   value: latest.expected,  color: SERIES_COLORS.expected },
  ];

  function toggleSeries(name: string) {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ textAlign: 'center' }}>Financial Returns Over Time</h2>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 60 }}>
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
          <Tooltip content={<AlignedTooltip />} />
          <Legend verticalAlign="top" onClick={e => toggleSeries(e.value)}
            formatter={(value) => (
              <span style={{ cursor: 'pointer', opacity: hidden.has(value) ? 0.35 : 1 }}>{value}</span>
            )}
          />
          <Line type="linear" dataKey="principle" name="Principle"
            stroke={SERIES_COLORS.principle} dot={showDots ? { r: 3 } : false} strokeWidth={2}
            hide={hidden.has('Principle')} />
          <Line type="linear" dataKey="balance" name="Balance"
            stroke={SERIES_COLORS.balance} dot={showDots ? { r: 3 } : false} strokeWidth={2}
            hide={hidden.has('Balance')} />
          <Line type="linear" dataKey="expected" name={rateLabel}
            stroke={SERIES_COLORS.expected} dot={showDots ? { r: 3 } : false} strokeWidth={2}
            hide={hidden.has(rateLabel)} />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, fontSize: 14, paddingInline: 30 }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {latestPoints.map(({ label, value, color }) => (
              <tr key={label}>
                <td style={{ textAlign: 'right', paddingRight: 12, color }}>{label}:</td>
                <td style={{ textAlign: 'left', color }}>{formatDollar(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <label style={{ cursor: 'pointer', userSelect: 'none', fontSize: 13 }}>
          <input type="checkbox" checked={showDots} onChange={e => setShowDots(e.target.checked)} style={{ marginRight: 6 }} />
          Show data point markers
        </label>
      </div>
    </div>
  );
}
