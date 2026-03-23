import type { SourceEntry, SourceConfig, StackedChartData } from '../types';
import { colorScale } from './colorUtils';

function parseDate(dateStr: string): Date {
  const [m, d, y] = dateStr.split('/').map(Number);
  return new Date(y, m - 1, d);
}

function dateSortKey(dateStr: string): number {
  return parseDate(dateStr).getTime();
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

function createSparseData(
  dates: string[],
  dateIndexMap: Map<string, number>,
  configs: SourceConfig[],
  data: Record<string, SourceEntry[]>
): (number | null)[][] {
  const sparseData: (number | null)[][] = [];

  for (const config of configs) {
    const entries = data[config.series];
    const principleValues: (number | null)[] = new Array(dates.length).fill(null);
    const earningsValues: (number | null)[] = new Array(dates.length).fill(null);

    if (!entries || entries.length === 0) {
      sparseData.push(principleValues);
      sparseData.push(earningsValues);
      continue;
    }

    let principleSum = entries[0].balance;
    let earningsSum = 0;

    for (const entry of entries) {
      const index = dateIndexMap.get(entry.date);
      if (index === undefined) continue;
      principleSum += entry.investment;
      principleValues[index] = principleSum;
      earningsSum += entry.earnings;
      earningsValues[index] = earningsSum;
    }

    sparseData.push(principleValues);
    sparseData.push(earningsValues);
  }

  return sparseData;
}

function extrapolateMissingData(dates: string[], sparseData: (number | null)[][]): void {
  for (const series of sparseData) {
    let i = 0;
    // Fill leading nulls with 0
    while (i < series.length && series[i] === null) {
      series[i] = 0;
      i++;
    }

    while (i < series.length) {
      if (series[i] === null) {
        let j = i;
        while (j < series.length && series[j] === null) j++;

        if (j >= series.length) {
          // Fill all trailing nulls with last known value
          for (let k = i; k < series.length; k++) {
            series[k] = series[i - 1] as number;
          }
          break;
        } else {
          const prevDate = dates[i - 1];
          const thisDate = dates[i];
          const nextDate = dates[j];
          const numDaysSincePrev = daysBetween(prevDate, thisDate);
          const daysDiff = daysBetween(prevDate, nextDate);

          const prevValue = series[i - 1] as number;
          const nextValue = series[j] as number;
          const valuePerDay = (nextValue - prevValue) / daysDiff;

          series[i] = prevValue + valuePerDay * numDaysSincePrev;
        }
      }
      i++;
    }
  }
}

function filterByDate(
  dates: string[],
  sparseData: (number | null)[][],
  startDateStr: string
): { dates: string[]; sparseData: (number | null)[][] } {
  const startTs = parseDate(startDateStr).getTime();
  let startIndex = 0;
  while (startIndex < dates.length && parseDate(dates[startIndex]).getTime() < startTs) {
    startIndex++;
  }
  return {
    dates: dates.slice(startIndex),
    sparseData: sparseData.map(s => s.slice(startIndex)),
  };
}

export function buildStackedChartData(
  configs: SourceConfig[],
  data: Record<string, SourceEntry[]>,
  startDate?: string
): { chartData: StackedChartData[]; seriesKeys: string[]; seriesColors: string[] } {
  // Build union of all dates
  const dateSet = new Set<string>();
  for (const config of configs) {
    for (const entry of data[config.series] ?? []) {
      dateSet.add(entry.date);
    }
  }
  let dates = Array.from(dateSet).sort((a, b) => dateSortKey(a) - dateSortKey(b));
  const dateIndexMap = new Map(dates.map((d, i) => [d, i]));

  let sparseData = createSparseData(dates, dateIndexMap, configs, data);
  extrapolateMissingData(dates, sparseData);

  if (startDate) {
    const filtered = filterByDate(dates, sparseData, startDate);
    dates = filtered.dates;
    sparseData = filtered.sparseData;
  }

  // Build series keys and colors (principle, earnings alternating per source)
  const seriesKeys: string[] = [];
  const seriesColors: string[] = [];
  for (const config of configs) {
    seriesKeys.push(config.series + ' Principle');
    seriesColors.push(config.color);
    seriesKeys.push(config.series + ' Earnings');
    seriesColors.push(colorScale(config.color, 1.5));
  }

  // Build chart data rows
  const chartData: StackedChartData[] = dates.map((date, i) => {
    const row: StackedChartData = { date };
    seriesKeys.forEach((key, si) => {
      row[key] = (sparseData[si][i] as number) ?? 0;
    });
    return row;
  });

  return { chartData, seriesKeys, seriesColors };
}
