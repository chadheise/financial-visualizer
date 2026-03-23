import Papa from 'papaparse';
import type { SourceConfig } from '../types';

export function parseSourcesCsv(csvText: string): SourceConfig[] {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = result.data.slice(1); // skip header row
  return rows.map(row => ({
    file: row[0]?.trim() ?? '',
    series: row[1]?.trim() ?? '',
    color: row[2]?.trim() ?? '#000000',
  }));
}
