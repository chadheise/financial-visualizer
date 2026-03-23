function formatLabel(raw: string): string {
  return raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function getFolder(filePath: string): string {
  const idx = filePath.lastIndexOf('/');
  return idx >= 0 ? filePath.slice(0, idx) : '';
}

export function getFolderDisplayName(filePath: string): string {
  return formatLabel(getFolder(filePath));
}

export function getDisplayName(filePath: string): string {
  const filename = filePath.slice(filePath.lastIndexOf('/') + 1);
  const noExt = filename.replace(/\.[^.]+$/, '');
  return formatLabel(noExt);
}

export function groupByFolder(filePaths: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const f of filePaths) {
    const folder = getFolder(f);
    if (!map.has(folder)) map.set(folder, []);
    map.get(folder)!.push(f);
  }
  return map;
}
