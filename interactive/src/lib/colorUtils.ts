function clamp(val: number, minimum = 0, maximum = 255): number {
  if (val < minimum) return minimum;
  if (val > maximum) return maximum;
  return val;
}

export function colorScale(hexstr: string, scalefactor: number): string {
  const stripped = hexstr.replace('#', '');
  if (scalefactor < 0 || stripped.length !== 6) return hexstr;

  const r = parseInt(stripped.slice(0, 2), 16);
  const g = parseInt(stripped.slice(2, 4), 16);
  const b = parseInt(stripped.slice(4, 6), 16);

  const nr = Math.floor(clamp(r * scalefactor));
  const ng = Math.floor(clamp(g * scalefactor));
  const nb = Math.floor(clamp(b * scalefactor));

  return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
}
