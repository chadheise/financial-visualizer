import Papa from 'papaparse';
import type { SourceEntry } from '../types';

const HEADER_MAP: Record<string, keyof SourceEntry> = {
  'date': 'date',
  'starting balance': 'balance',
  'beginning value': 'balance',
  'beginning balance': 'balance',
  'investment': 'investment',
  'net additions & withdrawls': 'investment',
  'net additions & withdrawals': 'investment',
  'net additions and withdrawals': 'investment',
  'earnings': 'earnings',
  'change in value': 'earnings',
  'change in investment value': 'earnings',
  'interest': 'earnings',
};

function normalizeHeader(raw: string): keyof SourceEntry | null {
  return HEADER_MAP[raw.trim().toLowerCase()] ?? null;
}

function parseDate(d: string): number {
  const [m, day, y] = d.split('/').map(Number);
  return new Date(y, m - 1, day).getTime();
}

export function parseSourceCsv(csvText: string): SourceEntry[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields ?? [];
  const keyMap: Record<string, keyof SourceEntry> = {};
  for (const h of headers) {
    const mapped = normalizeHeader(h);
    if (mapped) keyMap[h] = mapped;
  }

  const entries: SourceEntry[] = result.data.map(row => {
    const entry: Partial<SourceEntry> = {};
    for (const [rawKey, mappedKey] of Object.entries(keyMap)) {
      const val = row[rawKey]?.trim() ?? '';
      if (mappedKey === 'date') {
        entry.date = val;
      } else {
        (entry as Record<string, number>)[mappedKey] = parseFloat(val) || 0;
      }
    }
    return entry as SourceEntry;
  });

  return entries.sort((a, b) => parseDate(a.date) - parseDate(b.date));
}
