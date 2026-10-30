import { TILE, Tile, tileAt, type Level } from '@/game/level';

/** Farby svetiel a efektov. */
export const C = {
  ink: 0x05060b,
  flame: 0xffd35a,
  flameHot: 0xfff6c8,
  flameRed: 0xff8a3a,
  /** Uhlíky (smola do fakle). */
  firefly: 0xff9a3c,
  /** Relikvie. */
  crystal: 0xf4e2a8,
  shadeInner: 0x1a1418,
  cloak: 0x0d0f18,
  /** Sviečky pri cestách. */
  mushroom: 0xffb060,
  /** Oči a vredy nakazených. */
  plague: 0xc8d46a,
};

export const PLAYER_FRAMES = ['idle', 'run0', 'run1', 'run2', 'run3', 'jump', 'fall'] as const;
export type PlayerFrame = (typeof PLAYER_FRAMES)[number];

/** Deterministický šum 0–1 (rozmiestnenie dekorácií, tvary terénu). */
export function noise(x: number, y: number, seed: number): number {
  let h = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 1442695041, 2246822519) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export interface Decor {
  /** Sviečka (malé svetlo) alebo len trs na povrchu. */
  kind: 'candle' | 'tuft';
  x: number;
  y: number;
}

/** Miesta na dohárajúce sviečky (sú aj malé svetlá) a trsy na povrchu. */
export function decorOf(level: Level): Decor[] {
  const out: Decor[] = [];
  for (let row = 1; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      if (tileAt(level, col, row) !== Tile.Ground || tileAt(level, col, row - 1) !== Tile.Empty)
        continue;
      const n = noise(col, row, 41);
      const x = col * TILE + 3 + Math.floor(noise(col, row, 42) * 10);
      const y = row * TILE;
      if (n < (level.world === 'catacombs' ? 0.09 : level.world === 'pits' ? 0 : 0.035))
        out.push({ kind: 'candle', x, y });
      else if (n < 0.4) out.push({ kind: 'tuft', x, y });
    }
  }
  return out;
}

/** Mäkký kruhový prechod pre svetlá (biely, priehľadnosť klesá k okraju). */
export function lightCanvas(size: number, inner = 0.3): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, r * inner, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}
