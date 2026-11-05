/* Deterministic pseudo-random series + smooth SVG path helpers (shared by charts) */

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function genWalk(key: string, len: number, base: number, vol: number, min: number, max: number): number[] {
  const rnd = mulberry32(hashSeed(key));
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v += (rnd() - 0.48) * vol;
    v = Math.min(max, Math.max(min, v));
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

export type Pt = { x: number; y: number };

export function toPoints(data: number[], w: number, h: number, pad = 6): Pt[] {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  return data.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / span) * (h - pad * 2),
  }));
}

export function smoothPath(p: Pt[]): string {
  if (p.length < 2) return "";
  let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function areaPath(p: Pt[], h: number): string {
  if (p.length < 2) return "";
  return `${smoothPath(p)} L ${p[p.length - 1].x.toFixed(2)} ${h} L ${p[0].x.toFixed(2)} ${h} Z`;
}
