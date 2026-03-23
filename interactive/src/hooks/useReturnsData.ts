import { useState } from 'react';
import type { ReturnsChartData } from '../types';
import { parseSourceCsv, parseIndexCsv } from '../lib/csvParser';
import { buildReturnsChartData } from '../lib/returnsCalc';
import { getDisplayName } from '../lib/fileUtils';

export function useReturnsData() {
  const [chartData, setChartData] = useState<ReturnsChartData[]>([]);
  const [realRate, setRealRate] = useState<number | null>(null);
  const [comparisonName, setComparisonName] = useState<string | null>(null);
  const [comparisonRealRate, setComparisonRealRate] = useState<number | null>(null);
  const [indexName, setIndexName] = useState<string | null>(null);
  const [indexRealRate, setIndexRealRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(path: string) {
    const res = await fetch('/api/load-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) throw new Error(await res.text());
    const { content } = await res.json();
    return parseSourceCsv(content);
  }

  async function loadIndexFile(path: string) {
    const res = await fetch('/api/load-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) throw new Error(await res.text());
    const { content } = await res.json();
    return parseIndexCsv(content);
  }

  async function load(filePath: string, annualRate: number, comparisonPath?: string, indexPath?: string, startDate?: string) {
    setLoading(true);
    setError(null);
    try {
      const allEntries = await loadFile(filePath);
      const startTs = startDate ? new Date(startDate).getTime() : null;
      const entries = startTs
        ? allEntries.filter(e => {
            const [m, d, y] = e.date.split('/').map(Number);
            return new Date(y, m - 1, d).getTime() >= startTs;
          })
        : allEntries;
      const comparisonEntries = comparisonPath ? await loadFile(comparisonPath) : undefined;
      const indexEntries = indexPath ? await loadIndexFile(indexPath) : undefined;
      const { chartData, realRate, comparisonRealRate, indexRealRate } = buildReturnsChartData(entries, annualRate, comparisonEntries, indexEntries);
      setChartData(chartData);
      setRealRate(realRate);
      setComparisonRealRate(comparisonRealRate);
      setComparisonName(comparisonPath ? getDisplayName(comparisonPath) : null);
      setIndexName(indexPath ? getDisplayName(indexPath) : null);
      setIndexRealRate(indexRealRate);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return { chartData, realRate, comparisonName, comparisonRealRate, indexName, indexRealRate, loading, error, load };
}
