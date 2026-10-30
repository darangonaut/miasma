import { TILE, Tile, tileAt, type Level } from '@/game/level';

/** Farby svetiel a efektov. */
export const C = {
  ink: 0x05060b,
  flame: 0xffd35a,
  flameHot: 0xfff6c8,
  flameRed: 0xff8a3a,
  firefly: 0xd9f56a,
  crystal: 0x8ff0ff,
  shadeInner: 0x1a1428,
  cloak: 0x0d0f18,
  mushroom: 0x6cf0e0,
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
  kind: 'mushroom' | 'tuft';
  x: number;
  y: number;
}

/** Miesta na svietiace hríbiky (sú aj malé svetlá) a trsy trávy. */
export function decorOf(level: Level): Decor[] {
  const out: Decor[] = [];
  for (let row = 1; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      if (tileAt(level, col, row) !== Tile.Ground || tileAt(level, col, row - 1) !== Tile.Empty)
        continue;
      const n = noise(col, row, 41);
      const x = col * TILE + 3 + Math.floor(noise(col, row, 42) * 10);
      const y = row * TILE;
      if (n < (level.world === 'caves' ? 0.16 : 0.07)) out.push({ kind: 'mushroom', x, y });
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
