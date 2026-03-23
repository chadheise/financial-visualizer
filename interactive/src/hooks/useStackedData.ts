import { useState } from 'react';
import type { StackedChartData } from '../types';
import { parseSourceCsv } from '../lib/csvParser';
import { parseSourcesCsv } from '../lib/sourcesParser';
import { buildStackedChartData } from '../lib/stackedCalc';

export function useStackedData() {
  const [chartData, setChartData] = useState<StackedChartData[]>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [seriesColors, setSeriesColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(sourcesPath: string, startDate?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/load-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: sourcesPath }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { sourcesContent, fileContents } = await res.json();

      const configs = parseSourcesCsv(sourcesContent);
      const data: Record<string, ReturnType<typeof parseSourceCsv>> = {};
      for (const config of configs) {
        const csv = fileContents[config.file];
        if (csv) data[config.series] = parseSourceCsv(csv);
      }

      const result = buildStackedChartData(configs, data, startDate || undefined);
      setChartData(result.chartData);
      setSeriesKeys(result.seriesKeys);
      setSeriesColors(result.seriesColors);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return { chartData, seriesKeys, seriesColors, loading, error, load };
}
