import { useState, useEffect } from 'react';
import { getDisplayName, getFolderDisplayName, groupByFolder } from '../../lib/fileUtils';

interface Props {
  onLoad: (sourcesPath: string, startDate: string) => void;
  loading: boolean;
}

export function StackedControls({ onLoad, loading }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    fetch('/api/list-files')
      .then(r => r.json())
      .then((all: string[]) => {
        const sourcesFiles = all.filter(f => f.toLowerCase().includes('sources'));
        setFiles(sourcesFiles);
        if (sourcesFiles.length > 0) setSelectedFile(sourcesFiles[0]);
      });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    // Convert YYYY-MM-DD (date input) → MM/DD/YYYY (expected by API)
    const formatted = startDate
      ? startDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1')
      : '';
    onLoad(selectedFile, formatted);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <label>
        Sources file:
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
      <label>
        Start date:
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={{ marginLeft: 8 }}
        />
      </label>
      <button type="submit" disabled={loading || !selectedFile}>
        {loading ? 'Loading...' : 'Plot'}
      </button>
    </form>
  );
}
