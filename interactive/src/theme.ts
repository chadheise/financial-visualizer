// Chart series colors — muted palette that works on dark backgrounds
export const SERIES_COLORS = {
  principle: '#c97b7b',  // muted rose
  balance:   '#6a9fd4',  // soft steel blue
  expected:  '#6aad87',  // muted sage green
} as const;

// Recharts component stroke/fill colors that respect the dark theme
export const CHART_STYLE = {
  grid:      '#2e303a',  // --border dark
  axisText:  '#9ca3af',  // --text dark
  brushFill: '#1f2028',  // --code-bg dark
} as const;

// Y-axis tick formatter — abbreviated so labels are always a consistent width
export function formatAxisDollar(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs}`;
}

// Tooltip container styles (uses CSS variables to auto-adapt light/dark)
export const TOOLTIP_STYLE: React.CSSProperties = {
  background:   'var(--bg)',
  border:       '1px solid var(--border)',
  borderRadius: 4,
  padding:      '8px 12px',
  fontSize:     13,
  color:        'var(--text)',
};
