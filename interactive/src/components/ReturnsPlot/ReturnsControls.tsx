import { useState, useEffect } from 'react';
import { getDisplayName, getFolderDisplayName, groupByFolder } from '../../lib/fileUtils';

interface Props {
  onLoad: (filePath: string, annualRate: number) => void;
  loading: boolean;
}

export function ReturnsControls({ onLoad, loading }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [rate, setRate] = useState('8');

  useEffect(() => {
    fetch('/api/list-files')
      .then(r => r.json())
      .then((all: string[]) => {
        const sourceFiles = all.filter(f => !f.includes('sources'));
        setFiles(sourceFiles);
        if (sourceFiles.length > 0) setSelectedFile(sourceFiles[0]);
      });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    onLoad(selectedFile, parseFloat(rate) / 100);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <label>
        Data file:
        <select
          value={selectedFile}
          onChange={e => setSelectedFile(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          {Array.from(groupByFolder(files)).map(([folder, paths]) => (
            <optgroup key={folder} label={getFolderDisplayName(paths[0])}>
              {paths.map(f => (
                <option key={f} value={f}>{getDisplayName(f)}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        Expected annual return:
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
      <button type="submit" disabled={loading || !selectedFile}>
        {loading ? 'Loading...' : 'Plot'}
      </button>
    </form>
  );
}
