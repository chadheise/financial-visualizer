import type { TooltipProps } from 'recharts';
import { TOOLTIP_STYLE } from '../../theme';

function formatDollar(value: number): string {
  return '$' + Math.round(value).toLocaleString();
}

interface AlignedTooltipProps extends TooltipProps<number, string> {
  hideZeros?: boolean;
}

export function AlignedTooltip({ active, payload, label, hideZeros }: AlignedTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const rows = hideZeros ? payload.filter(entry => (entry.value ?? 0) !== 0) : payload;
  if (rows.length === 0) return null;

  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ marginBottom: 6, fontWeight: 'bold' }}>{label}</div>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map(entry => (
            <tr key={entry.name}>
              <td style={{ textAlign: 'right', paddingRight: 10, color: entry.color }}>
                {entry.name}:
              </td>
              <td style={{ textAlign: 'left', color: entry.color }}>
                {formatDollar(entry.value ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
