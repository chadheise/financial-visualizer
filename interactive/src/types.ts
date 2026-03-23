export interface SourceEntry {
  date: string; // MM/DD/YYYY
  balance: number;
  investment: number;
  earnings: number;
}

export interface SourceConfig {
  file: string;
  series: string;
  color: string;
}

export interface ReturnsChartData {
  date: string;
  principle: number;
  balance: number;
  expected: number;
  realExpected: number;
}

export interface StackedChartData {
  date: string;
  [seriesName: string]: number | string;
}

export interface SourcesPayload {
  configs: SourceConfig[];
  data: Record<string, SourceEntry[]>;
}
