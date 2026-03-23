import { useState, useEffect } from 'react';
import { getDisplayName, getFolderDisplayName, groupByFolder } from '../../lib/fileUtils';
import { RETURNS_LABELS } from '../../theme';

interface Props {
  onLoad: (filePath: string, annualRate: number, comparisonPath?: string, indexPath?: string) => void;
  loading: boolean;
}

export function ReturnsControls({ onLoad, loading }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [rate, setRate] = useState('8');
  const [comparisonFile, setComparisonFile] = useState('');
  const [indexFiles, setIndexFiles] = useState<string[]>([]);
  const [indexFile, setIndexFile] = useState('');
  const [plottedState, setPlottedState] = useState<{ file: string; rate: string; comparison: string; index: string } | null>(null);

  useEffect(() => {
    fetch('/api/list-files')
      .then(r => r.json())
      .then((all: string[]) => {
        const sourceFiles = all.filter(f => !f.includes('sources'));
        setFiles(sourceFiles);
        if (sourceFiles.length > 0) setSelectedFile(sourceFiles[0]);
      });
    fetch('/api/list-index-files')
      .then(r => r.json())
      .then((all: string[]) => setIndexFiles(all));
  }, []);

  const isPlotted = plottedState !== null &&
    plottedState.file === selectedFile &&
    plottedState.rate === rate &&
    plottedState.comparison === comparisonFile &&
    plottedState.index === indexFile;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setPlottedState({ file: selectedFile, rate, comparison: comparisonFile, index: indexFile });
    onLoad(selectedFile, parseFloat(rate) / 100, comparisonFile || undefined, indexFile || undefined);
  }

  const fileSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ marginLeft: 8 }}>
      {Array.from(groupByFolder(files)).map(([folder, paths]) => (
        <optgroup key={folder} label={getFolderDisplayName(paths[0])}>
          {paths.map(f => (
            <option key={f} value={f}>{getDisplayName(f)}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Data file:
          {fileSelect(selectedFile, setSelectedFile)}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {RETURNS_LABELS.benchmarkControl}:
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={rate}
            onChange={e => setRate(e.target.value)}
            style={{ marginLeft: 8, width: 64 }}
          />
          %
        </label>
        <button
          type="submit"
          disabled={loading || !selectedFile}
          style={{
            marginLeft: 'auto',
            padding: '8px 24px',
            fontSize: 15,
            background: loading ? undefined : isPlotted ? '#4a7c4e' : '#a07c28',
            color: '#fff',
            border: 'none',
          }}
        >
          {loading ? 'Loading...' : 'Plot'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Index comparison:
          <select value={indexFile} onChange={e => setIndexFile(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">None</option>
            {indexFiles.map(f => (
              <option key={f} value={f}>{getDisplayName(f)}</option>
            ))}
          </select>
        </label>
        <label>
          Data comparison:
          <select value={comparisonFile} onChange={e => setComparisonFile(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">None</option>
            {Array.from(groupByFolder(files)).map(([folder, paths]) => (
              <optgroup key={folder} label={getFolderDisplayName(paths[0])}>
                {paths.map(f => (
                  <option key={f} value={f}>{getDisplayName(f)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

    </form>
  );
}
