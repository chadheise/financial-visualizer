import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// Project root is one level up from the interactive/ directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function safePath(relativePath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, relativePath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error('Path traversal not allowed');
  }
  return resolved;
}

// List all CSV files in sampleData/ and myData/
app.get('/api/list-files', (_req, res) => {
  const dirs = ['sampleData', 'myData'];
  const files: string[] = [];
  for (const dir of dirs) {
    const dirPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        if (entry.endsWith('.csv')) {
          files.push(`${dir}/${entry}`);
        }
      }
    }
  }
  res.json(files);
});

// Return raw CSV text for a single source file
app.post('/api/load-file', (req, res) => {
  const { path: filePath } = req.body as { path: string };
  if (!filePath) {
    res.status(400).json({ error: 'path required' });
    return;
  }
  try {
    const fullPath = safePath(filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

// Return sources manifest + all referenced data files
app.post('/api/load-sources', (req, res) => {
  const { path: filePath } = req.body as { path: string };
  if (!filePath) {
    res.status(400).json({ error: 'path required' });
    return;
  }
  try {
    const sourcesFullPath = safePath(filePath);
    const sourcesContent = fs.readFileSync(sourcesFullPath, 'utf-8');

    // Parse sources CSV to find referenced data files
    const lines = sourcesContent.trim().split('\n').slice(1); // skip header
    const fileContents: Record<string, string> = {};
    for (const line of lines) {
      const cols = line.split(',');
      const dataFile = cols[0]?.trim();
      if (dataFile) {
        try {
          const dataFullPath = safePath(dataFile);
          fileContents[dataFile] = fs.readFileSync(dataFullPath, 'utf-8');
        } catch {
          // skip unreadable files
        }
      }
    }

    res.json({ sourcesContent, fileContents });
  } catch (err) {
    res.status(404).json({ error: String(err) });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
