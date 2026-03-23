import type { SourceEntry, IndexEntry, ReturnsChartData } from '../types';

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

// Finds the annual rate at which createExpectedSeries would end at `target`.
// Uses binary search because createExpectedSeries is monotonically increasing
// with respect to rate — a higher rate always produces a higher ending value —
// so the search is guaranteed to converge on the unique solution.
function solveRateForTarget(entries: SourceEntry[], target: number): number {
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

export function solveRealRate(entries: SourceEntry[]): number {
  if (entries.length < 2) return 0;
  // Target is the actual final balance we want the expected series to match.
  return solveRateForTarget(entries, createBalanceSeries(entries).at(-1)!);
}

// Interpolates a pre-computed series (paired with its source dates) onto a
// set of target dates using linear interpolation. Returns null for target
// dates that fall before the source series begins.
function interpolateSeriesToDates(
  sourceDates: string[],
  sourceValues: number[],
  targetDates: string[]
): (number | null)[] {
  if (sourceDates.length === 0) return targetDates.map(() => null);

  const sourceTs = sourceDates.map(d => parseDate(d).getTime());

  return targetDates.map(date => {
    const ts = parseDate(date).getTime();
    if (ts < sourceTs[0]) return null;
    if (ts >= sourceTs[sourceTs.length - 1]) return sourceValues[sourceValues.length - 1];

    for (let i = 1; i < sourceTs.length; i++) {
      if (ts <= sourceTs[i]) {
        const t = (ts - sourceTs[i - 1]) / (sourceTs[i] - sourceTs[i - 1]);
        return sourceValues[i - 1] + t * (sourceValues[i] - sourceValues[i - 1]);
      }
    }
    return sourceValues[sourceValues.length - 1];
  });
}

// For each account period [i-1, i], looks up the index open at the start date
// and the index close at the end date, then applies that period's return rate
// to the running expected balance. Falls back to floor lookup (nearest trading
// day on or before the requested date) so non-trading-day account entries still
// find a valid index price.
export function createIndexExpectedSeries(entries: SourceEntry[], indexEntries: IndexEntry[]): number[] {
  // Sort index entries once and pre-compute timestamps for binary search
  const sorted = [...indexEntries].sort(
    (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
  );
  const sortedTs = sorted.map(e => parseDate(e.date).getTime());

  // Returns the latest index entry whose date is on or before dateStr
  function floorEntry(dateStr: string): IndexEntry | null {
    const ts = parseDate(dateStr).getTime();
    let lo = 0, hi = sorted.length - 1, idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (sortedTs[mid] <= ts) { idx = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return idx >= 0 ? sorted[idx] : null;
  }

  const series: number[] = [];
  let running = 0;

  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      // No prior period to compound — just seed with the first investment
      running += entries[0].investment;
    } else {
      const prev = floorEntry(entries[i - 1].date);
      const curr = floorEntry(entries[i].date);
      if (prev && curr && prev.open !== 0) {
        // Return rate for the period: from the open of the previous date to
        // the close of the current date, matching the user's description
        const returnRate = (curr.close - prev.open) / prev.open;
        running = running * (1 + returnRate) + entries[i].investment;
      } else {
        // No index data for this period — just add the investment unchanged
        running += entries[i].investment;
      }
    }
    series.push(running);
  }

  return series;
}

export function buildReturnsChartData(
  entries: SourceEntry[],
  annualRate: number,
  comparisonEntries?: SourceEntry[],
  indexEntries?: IndexEntry[]
): { chartData: ReturnsChartData[]; realRate: number; comparisonRealRate: number | null; indexRealRate: number | null } {
  const realRate = solveRealRate(entries);
  const principle = createPrincipleSeries(entries);
  const balance = createBalanceSeries(entries);
  const expected = createExpectedSeries(entries, annualRate);
  const realExpected = createExpectedSeries(entries, realRate);

  const primaryDates = entries.map(e => e.date);
  let comparisonBalances: (number | null)[] | null = null;
  let comparisonRealExpecteds: (number | null)[] | null = null;
  let comparisonRealRate: number | null = null;

  if (comparisonEntries) {
    const compDates = comparisonEntries.map(e => e.date);
    comparisonRealRate = solveRealRate(comparisonEntries);
    comparisonBalances = interpolateSeriesToDates(compDates, createBalanceSeries(comparisonEntries), primaryDates);
    comparisonRealExpecteds = interpolateSeriesToDates(compDates, createExpectedSeries(comparisonEntries, comparisonRealRate), primaryDates);
  }

  const indexExpected = indexEntries ? createIndexExpectedSeries(entries, indexEntries) : null;
  const indexRealRate = indexExpected ? solveRateForTarget(entries, indexExpected.at(-1)!) : null;

  const chartData = entries.map((e, i) => ({
    date: e.date,
    principle: principle[i],
    balance: balance[i],
    expected: expected[i],
    realExpected: realExpected[i],
    ...(comparisonBalances?.[i] !== null && comparisonBalances?.[i] !== undefined
      ? { comparisonBalance: comparisonBalances[i] as number }
      : {}),
    ...(comparisonRealExpecteds?.[i] !== null && comparisonRealExpecteds?.[i] !== undefined
      ? { comparisonRealExpected: comparisonRealExpecteds[i] as number }
      : {}),
    ...(indexExpected ? { indexExpected: indexExpected[i] } : {}),
  }));

  return { chartData, realRate, comparisonRealRate, indexRealRate };
}
