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

export function buildReturnsChartData(
  entries: SourceEntry[],
  annualRate: number
): ReturnsChartData[] {
  const principle = createPrincipleSeries(entries);
  const balance = createBalanceSeries(entries);
  const expected = createExpectedSeries(entries, annualRate);

  return entries.map((e, i) => ({
    date: e.date,
    principle: principle[i],
    balance: balance[i],
    expected: expected[i],
  }));
}
