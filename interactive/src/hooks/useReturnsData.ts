import { useState } from 'react';
import type { ReturnsChartData } from '../types';
import { parseSourceCsv } from '../lib/csvParser';
import { buildReturnsChartData } from '../lib/returnsCalc';

export function useReturnsData() {
  const [chartData, setChartData] = useState<ReturnsChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(filePath: string, annualRate: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/load-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { content } = await res.json();
      const entries = parseSourceCsv(content);
      setChartData(buildReturnsChartData(entries, annualRate));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return { chartData, loading, error, load };
}
