import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ReturnsChartData } from '../../types';
import { AlignedTooltip } from '../shared/AlignedTooltip';
import { SERIES_COLORS, CHART_STYLE, formatAxisDollar, RETURNS_LABELS } from '../../theme';

interface Props {
  data: ReturnsChartData[];
  annualRate: number;
  realRate: number | null;
  showBenchmark: boolean;
  comparisonName: string | null;
  comparisonRealRate: number | null;
  indexName: string | null;
  indexRealRate: number | null;
}

function formatDollar(value: number): string {
  return '$' + Math.round(value).toLocaleString();
}

export function ReturnsPlot({ data, annualRate, realRate, showBenchmark, comparisonName, comparisonRealRate, indexName, indexRealRate }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showDots, setShowDots] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleExport() {
    if (!containerRef.current) return;
    toPng(containerRef.current, { cacheBust: true }).then(dataUrl => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'returns-plot.png';
      a.click();
    });
  }

  if (data.length === 0) return null;

  const rateLabel = `Benchmark (${(annualRate * 100).toFixed(2)}%/yr)`;
  const realRateLabel = realRate !== null ? `Real (${(realRate * 100).toFixed(2)}%/yr)` : 'Real Return';
  const latest = data[data.length - 1];
  const primarySeries = [
    { key: 'Balance', label: realRate !== null ? `Balance (${(realRate * 100).toFixed(2)}%/yr)` : 'Balance', value: latest.balance, color: SERIES_COLORS.balance },
    { key: 'Principle',   label: 'Principle',   value: latest.principle,    color: SERIES_COLORS.principle },
    { key: realRateLabel, label: realRateLabel, value: latest.realExpected, color: SERIES_COLORS.realExpected },
    ...(showBenchmark ? [{ key: rateLabel, label: rateLabel, value: latest.expected, color: SERIES_COLORS.expected }] : []),
  ];
  const comparisonSeries = [
    ...(indexName && latest.indexExpected !== undefined ? [{
      key: 'indexExpected',
      label: indexRealRate !== null ? `${indexName} (${(indexRealRate * 100).toFixed(2)}%/yr)` : indexName,
      value: latest.indexExpected,
      color: SERIES_COLORS.indexExpected,
    }] : []),
    ...(comparisonName && latest.comparisonBalance !== undefined ? [{
      key: comparisonName,
      label: comparisonRealRate !== null ? `${comparisonName} ${RETURNS_LABELS.realSeries(comparisonRealRate)}` : comparisonName,
      value: latest.comparisonBalance,
      color: SERIES_COLORS.comparisonBalance,
    }] : []),
  ];

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
          <Line type="linear" dataKey="principle" name="Principle"
            stroke={SERIES_COLORS.principle} dot={showDots ? { r: 3 } : false} strokeWidth={2}
            hide={hidden.has('Principle')} />
          <Line type="linear" dataKey="balance" name="Balance"
            stroke={SERIES_COLORS.balance} dot={showDots ? { r: 3 } : false} strokeWidth={2}
            hide={hidden.has('Balance')} />
          <Line type="linear" dataKey="expected" name={rateLabel}
            stroke={SERIES_COLORS.expected} dot={showDots ? { r: 3 } : false} strokeWidth={2}
            hide={!showBenchmark || hidden.has(rateLabel)} />
          <Line type="linear" dataKey="realExpected" name={realRateLabel}
            stroke={SERIES_COLORS.realExpected} dot={showDots ? { r: 3 } : false} strokeWidth={2}
            hide={hidden.has(realRateLabel)} />
          {comparisonName && (
            <Line type="linear" dataKey="comparisonBalance" name={comparisonName}
              stroke={SERIES_COLORS.comparisonBalance} dot={showDots ? { r: 3 } : false} strokeWidth={2}
              hide={hidden.has(comparisonName)} connectNulls={false} />
          )}

          {indexName && (
            <Line type="linear" dataKey="indexExpected" name="Index Expected"
              stroke={SERIES_COLORS.indexExpected} dot={showDots ? { r: 3 } : false} strokeWidth={2}
              hide={hidden.has('indexExpected')} connectNulls={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, alignItems: 'flex-start', marginTop: 12, fontSize: 14, paddingInline: 30 }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {primarySeries.map(({ key, label, value, color }) => (
              <tr
                key={key}
                onClick={() => toggleSeries(key)}
                style={{ cursor: 'pointer', opacity: hidden.has(key) ? 0.35 : 1 }}
              >
                <td style={{ paddingRight: 8, paddingBottom: 2 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 3, background: color, borderRadius: 1, verticalAlign: 'middle' }} />
                </td>
                <td style={{ textAlign: 'right', paddingRight: 12, color }}>{label}:</td>
                <td style={{ textAlign: 'left', color }}>{formatDollar(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {comparisonSeries.length > 0 && (
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {comparisonSeries.map(({ key, label, value, color }) => (
                <tr
                  key={key}
                  onClick={() => toggleSeries(key)}
                  style={{ cursor: 'pointer', opacity: hidden.has(key) ? 0.35 : 1 }}
                >
                  <td style={{ paddingRight: 8, paddingBottom: 2 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 3, background: color, borderRadius: 1, verticalAlign: 'middle' }} />
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 12, color }}>{label}:</td>
                  <td style={{ textAlign: 'left', color }}>{formatDollar(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <label style={{ cursor: 'pointer', userSelect: 'none', fontSize: 13 }}>
          <input type="checkbox" checked={showDots} onChange={e => setShowDots(e.target.checked)} style={{ marginRight: 6 }} />
          Show data point markers
        </label>
      </div>
    </div>
  );
}
