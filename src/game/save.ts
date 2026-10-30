/** Uložený postup: odomknuté levely a najlepšie výsledky. */
export interface SaveData {
  /** Index najvyššieho odomknutého levelu. */
  unlocked: number;
  /** Najviac nazbieraných svetlušiek a kryštálov podľa id levelu. */
  best: Record<string, { fireflies: number; crystals: number }>;
}

export const EMPTY_SAVE: SaveData = { unlocked: 0, best: {} };

export function parseSave(text: string | null): SaveData {
  if (!text) return { ...EMPTY_SAVE, best: {} };
  try {
    const raw = JSON.parse(text) as Partial<SaveData>;
    const unlocked = Number.isInteger(raw.unlocked) && raw.unlocked! >= 0 ? raw.unlocked! : 0;
    const best: SaveData['best'] = {};
    if (raw.best && typeof raw.best === 'object') {
      for (const [id, v] of Object.entries(raw.best)) {
        if (v && typeof v.fireflies === 'number' && typeof v.crystals === 'number')
          best[id] = { ...v };
      }
    }
    return { unlocked, best };
  } catch {
    return { ...EMPTY_SAVE, best: {} };
  }
}

/** Zapíše výsledok levelu: odomkne ďalší a ponechá lepšie skóre. */
export function recordLevel(
  save: SaveData,
  index: number,
  id: string,
  fireflies: number,
  crystals: number,
): SaveData {
  const prev = save.best[id];
  return {
    unlocked: Math.max(save.unlocked, index + 1),
    best: {
      ...save.best,
      [id]: {
        fireflies: Math.max(prev?.fireflies ?? 0, fireflies),
        crystals: Math.max(prev?.crystals ?? 0, crystals),
      },
    },
  };
}
