const KEY = "oasis.skyknight.raven.v1";
const SAVE_VERSION = 1;

export type SaveData = {
  version: number;
  assumed: string[];
  muted: boolean;
  x: number;
  z: number;
  yaw: number;
  assembled: boolean;
};

const DEFAULT_SAVE: SaveData = {
  version: SAVE_VERSION,
  assumed: [],
  muted: false,
  x: 0,
  z: 8.6,
  yaw: 0,
  assembled: false,
};

function migrate(raw: SaveData): SaveData {
  const next = { ...DEFAULT_SAVE, ...raw, version: SAVE_VERSION };
  next.assumed = Array.isArray(raw.assumed) ? raw.assumed.filter((id) => typeof id === "string") : [];
  next.muted = Boolean(raw.muted);
  next.x = Number.isFinite(raw.x) ? raw.x : DEFAULT_SAVE.x;
  next.z = Number.isFinite(raw.z) ? raw.z : DEFAULT_SAVE.z;
  next.yaw = Number.isFinite(raw.yaw) ? raw.yaw : 0;
  next.assembled = Boolean(raw.assembled) || next.assumed.length >= 5;
  return next;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE, assumed: [] };
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
  } catch {
    return { ...DEFAULT_SAVE, assumed: [] };
  }
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...save, version: SAVE_VERSION }));
  } catch {
    /* private mode / quota */
  }
}

export function hasProgress(save: SaveData): boolean {
  return save.assumed.length > 0 || Math.hypot(save.x, save.z - 8.6) > 2.5;
}
