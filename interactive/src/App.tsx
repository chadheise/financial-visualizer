import { useState } from 'react';
import { ReturnsControls } from './components/ReturnsPlot/ReturnsControls';
import { ReturnsPlot } from './components/ReturnsPlot/ReturnsPlot';
import { StackedControls } from './components/StackedPlot/StackedControls';
import { StackedPlot } from './components/StackedPlot/StackedPlot';
import { useReturnsData } from './hooks/useReturnsData';
import { useStackedData } from './hooks/useStackedData';

type Tab = 'returns' | 'stacked';

export default function App() {
  const [tab, setTab] = useState<Tab>('returns');
  const [returnsRate, setReturnsRate] = useState(0.08);
  const [showBenchmark, setShowBenchmark] = useState(false);

  const returns = useReturnsData();
  const stacked = useStackedData();

  return (
    <div style={{ fontFamily: 'sans-serif', width: '100%', maxWidth: 1200, margin: '0 auto', boxSizing: 'border-box' }}>
      <h1 style={{ marginBottom: 16, paddingInline: 24 }}>Financial Visualizer</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #ccc', paddingInline: 24 }}>
        <button
          onClick={() => setTab('returns')}
          style={{
            padding: '8px 20px',
            cursor: 'pointer',
            border: 'none',
            borderBottom: tab === 'returns' ? '3px solid #4267B2' : '3px solid transparent',
            background: 'none',
            fontWeight: tab === 'returns' ? 'bold' : 'normal',
            fontSize: 15,
          }}
        >
          Returns Plot
        </button>
        <button
          onClick={() => setTab('stacked')}
          style={{
            padding: '8px 20px',
            cursor: 'pointer',
            border: 'none',
            borderBottom: tab === 'stacked' ? '3px solid #4267B2' : '3px solid transparent',
            background: 'none',
            fontWeight: tab === 'stacked' ? 'bold' : 'normal',
            fontSize: 15,
          }}
        >
          Stacked Plot
        </button>
      </div>

      {tab === 'returns' && (
        <div>
          <div style={{ paddingInline: 24 }}>
            <ReturnsControls
              loading={returns.loading}
              showBenchmark={showBenchmark}
              onShowBenchmarkChange={setShowBenchmark}
              onLoad={(file, rate, comparisonPath, indexPath, startDate) => { setReturnsRate(rate); returns.load(file, rate, comparisonPath, indexPath, startDate); }}
            />
            {returns.error && <p style={{ color: 'red' }}>{returns.error}</p>}
          </div>
          <div style={{ marginTop: 24 }}>
            <ReturnsPlot data={returns.chartData} annualRate={returnsRate} realRate={returns.realRate} showBenchmark={showBenchmark} comparisonName={returns.comparisonName} comparisonRealRate={returns.comparisonRealRate} indexName={returns.indexName} indexRealRate={returns.indexRealRate} />
          </div>
        </div>
      )}

      {tab === 'stacked' && (
        <div>
          <div style={{ paddingInline: 24 }}>
            <StackedControls
              loading={stacked.loading}
              onLoad={(sources, startDate) => stacked.load(sources, startDate)}
            />
            {stacked.error && <p style={{ color: 'red' }}>{stacked.error}</p>}
          </div>
          <div style={{ marginTop: 24 }}>
            <StackedPlot
              data={stacked.chartData}
              seriesKeys={stacked.seriesKeys}
              seriesColors={stacked.seriesColors}
            />
          </div>
        </div>
      )}
    </div>
  );
}
