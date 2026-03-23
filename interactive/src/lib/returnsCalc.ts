import type { SourceEntry, ReturnsChartData } from '../types';

function daysInYear(year: number): number {
  // Same as Python: (Dec 31 - Jan 1).days + 1
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

function parseDate(dateStr: string): Date {
  const [m, d, y] = dateStr.split('/').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  const ms = parseDate(b).getTime() - parseDate(a).getTime();
  return Math.round(ms / 86400000);
}

export function createPrincipleSeries(entries: SourceEntry[]): number[] {
  let running = 0;
  return entries.map(e => {
    running += e.investment;
    return running;
  });
}

export function createBalanceSeries(entries: SourceEntry[]): number[] {
  let running = 0;
  return entries.map(e => {
    running += e.investment + e.earnings;
    return running;
  });
}

export function createExpectedSeries(entries: SourceEntry[], annualRate: number): number[] {
  const series: number[] = [];
  let running = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const year = parseDate(entry.date).getFullYear();
    const totalPeriods = daysInYear(year);
    const returnPerPeriod = Math.pow(1 + annualRate, 1 / totalPeriods) - 1;

    // On i=0, Python's entries[i-1] wraps to last element, making days negative → 0 periods
    const numPeriods = i === 0 ? 0 : daysBetween(entries[i - 1].date, entry.date);

    running = running * Math.pow(1 + returnPerPeriod, numPeriods);
    running += entry.investment;
    series.push(running);
  }

  return series;
}

// Finds the annual return rate at which the expected series would end at the
// same value as the actual account balance. Uses binary search because
// createExpectedSeries is monotonically increasing with respect to rate —
// a higher rate always produces a higher ending value — so the search is
// guaranteed to converge on the unique solution.
export function solveRealRate(entries: SourceEntry[]): number {
  if (entries.length < 2) return 0;

  // Target is the actual final balance we want the expected series to match.
  const target = createBalanceSeries(entries).at(-1)!;

  // Search bounds: -99% is the practical floor (total loss), 1000% is a
  // ceiling that will never be reached in practice. The search converges in
  // the same number of iterations regardless of how wide the bounds are.
  let low = -0.99, high = 10.0;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const result = createExpectedSeries(entries, mid).at(-1)!;

    // Narrow the search window toward the rate that produces `target`.
    if (result < target) low = mid;
    else high = mid;

    // Stop once the window is smaller than 1 basis point (0.000001%).
    if (high - low < 1e-8) break;
  }

  return (low + high) / 2;
}

export function buildReturnsChartData(
  entries: SourceEntry[],
  annualRate: number
): { chartData: ReturnsChartData[]; realRate: number } {
  const realRate = solveRealRate(entries);
  const principle = createPrincipleSeries(entries);
  const balance = createBalanceSeries(entries);
  const expected = createExpectedSeries(entries, annualRate);
  const realExpected = createExpectedSeries(entries, realRate);

  const chartData = entries.map((e, i) => ({
    date: e.date,
    principle: principle[i],
    balance: balance[i],
    expected: expected[i],
    realExpected: realExpected[i],
  }));

  return { chartData, realRate: solveRealRate(entries) };
}
