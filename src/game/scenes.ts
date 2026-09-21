export type Mood = {
  id: string;
  name: string;
  feeling: string;
  horizon: number;
  zenith: number;
  glow: number;
  fog: number;
};

export const MOODS: Mood[] = [
  { id: "peach", name: "Arrival", feeling: "Comfort", horizon: 0xfab89a, zenith: 0xc4a6d8, glow: 0xffe08c, fog: 0xf3c4a8 },
  { id: "lavender", name: "Trust", feeling: "Calm", horizon: 0xe0c4e8, zenith: 0x8f8ec8, glow: 0xf0d0ff, fog: 0xd4c0e0 },
  { id: "teal", name: "Discovery", feeling: "Flow", horizon: 0x9fd4c8, zenith: 0x5a8ea8, glow: 0xc8ffe8, fog: 0xa8c8c0 },
  { id: "gold", name: "Insight", feeling: "Warmth", horizon: 0xf0c070, zenith: 0xc4784a, glow: 0xffe6a0, fog: 0xe8b878 },
  { id: "purple", name: "Depth", feeling: "Intimacy", horizon: 0xc89ad4, zenith: 0x4a3878, glow: 0xe0b0ff, fog: 0x8a6aa0 },
  { id: "starlight", name: "Starlight", feeling: "Transcendence", horizon: 0x6a7ab8, zenith: 0x1a1840, glow: 0xd0e8ff, fog: 0x3a3868 },
];

export function moodAt(z: number): { mood: Mood; next: Mood; t: number } {
  const p = Math.min(1, Math.max(0, (-z + 6) / 58));
  const scaled = p * (MOODS.length - 1);
  const i = Math.min(MOODS.length - 2, Math.floor(scaled));
  return { mood: MOODS[i], next: MOODS[i + 1], t: scaled - i };
}

export function mixHex(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
