/** Uložený postup: odomknuté levely, najlepšie výsledky a výbava z lekárne. */
export interface Perks {
  /** Väčšia ampulka: smola horí pomalšie (0–2). */
  flask: number;
  /** Lepšia maska: miazma nakazí pomalšie (0–2). */
  mask: number;
  /** Ťažká palica: nakazeného zloží jeden úder (0–1). */
  cane: number;
}

export interface SaveData {
  /** Index najvyššieho odomknutého levelu. */
  unlocked: number;
  /** Najviac nazbieraných uhlíkov, relikvií a zachránených preživších podľa id levelu. */
  best: Record<string, { fireflies: number; crystals: number; survivors: number; coins: number }>;
  /** Groše na lekáreň. */
  coins: number;
  perks: Perks;
  /** Byliny v brašni (prenášajú sa do ďalšieho levelu). */
  herbs: number;
}

export const NO_PERKS: Perks = { flask: 0, mask: 0, cane: 0 };

/** Tovar lekárne: cena a najvyššia úroveň. */
export const SHOP = {
  herb: { price: 3, max: 3 },
  flask: { price: 6, max: 2 },
  mask: { price: 5, max: 2 },
  cane: { price: 8, max: 1 },
} as const;
export type ShopItem = keyof typeof SHOP;

export function emptySave(): SaveData {
  return { unlocked: 0, best: {}, coins: 0, perks: { ...NO_PERKS }, herbs: 0 };
}

const count = (v: unknown, max = 99) =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 ? Math.min(max, v) : 0;

export function parseSave(text: string | null): SaveData {
  if (!text) return emptySave();
  try {
    const raw = JSON.parse(text) as Partial<SaveData>;
    const best: SaveData['best'] = {};
    if (raw.best && typeof raw.best === 'object') {
      for (const [id, v] of Object.entries(raw.best)) {
        if (v && typeof v.fireflies === 'number' && typeof v.crystals === 'number')
          best[id] = {
            fireflies: v.fireflies,
            crystals: v.crystals,
            survivors: typeof v.survivors === 'number' ? v.survivors : 0,
            coins: typeof v.coins === 'number' ? v.coins : 0,
          };
      }
    }
    const perks = raw.perks ?? NO_PERKS;
    return {
      unlocked: count(raw.unlocked, 999),
      best,
      coins: count(raw.coins, 9999),
      perks: {
        flask: count(perks.flask, SHOP.flask.max),
        mask: count(perks.mask, SHOP.mask.max),
        cane: count(perks.cane, SHOP.cane.max),
      },
      herbs: count(raw.herbs, SHOP.herb.max),
    };
  } catch {
    return emptySave();
  }
}

export interface LevelResult {
  fireflies: number;
  crystals: number;
  survivors: number;
  nests: number;
  /** Byliny, ktoré lekárovi ostali v brašni. */
  herbs: number;
  /** Nájdené groše (v pivniciach a domoch). */
  coins: number;
}

/**
 * Groše za level: 2 za každého zachráneného a 1 za relikviu (len nad doterajšie maximum,
 * aby sa opakovaním nedalo zbohatnúť) a 1 za hniezdo pri prvom prejdení.
 */
export function levelCoins(save: SaveData, id: string, r: LevelResult): number {
  const prev = save.best[id];
  const first = !prev;
  return (
    Math.max(0, r.survivors - (prev?.survivors ?? 0)) * 2 +
    Math.max(0, r.crystals - (prev?.crystals ?? 0)) +
    Math.max(0, r.coins - (prev?.coins ?? 0)) +
    (first ? r.nests : 0)
  );
}

/** Zapíše výsledok levelu: odomkne ďalší, pripíše groše a ponechá lepšie skóre. */
export function recordLevel(save: SaveData, index: number, id: string, r: LevelResult): SaveData {
  const prev = save.best[id];
  return {
    ...save,
    unlocked: Math.max(save.unlocked, index + 1),
    coins: save.coins + levelCoins(save, id, r),
    herbs: Math.min(SHOP.herb.max, r.herbs),
    best: {
      ...save.best,
      [id]: {
        fireflies: Math.max(prev?.fireflies ?? 0, r.fireflies),
        crystals: Math.max(prev?.crystals ?? 0, r.crystals),
        survivors: Math.max(prev?.survivors ?? 0, r.survivors),
        coins: Math.max(prev?.coins ?? 0, r.coins),
      },
    },
  };
}

/** Úroveň tovaru, ktorú hráč má (byliny sú v brašni). */
export function owned(save: SaveData, item: ShopItem): number {
  return item === 'herb' ? save.herbs : save.perks[item];
}

/** Kúpa v lekárni; vráti nový stav, alebo null, keď to nejde. */
export function buy(save: SaveData, item: ShopItem): SaveData | null {
  const { price, max } = SHOP[item];
  if (save.coins < price || owned(save, item) >= max) return null;
  const next = { ...save, coins: save.coins - price, perks: { ...save.perks } };
  if (item === 'herb') next.herbs++;
  else next.perks[item]++;
  return next;
}
