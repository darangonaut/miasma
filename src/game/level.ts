/**
 * Level z ASCII mapy. Každý znak je jedno políčko 16×16 px:
 *
 *   #  zem / skala          -  drevená lávka (stúpiš na ňu zdola)
 *   =  svetelná plošina (pevná len vo svetle)
 *   ^  tŕne                 P  štart
 *   f  svetluška            *  svetelný kryštál (tajomstvo)
 *   L  lampa (checkpoint)   E  vatra na konci
 *   s  tieň                 m  mora (pije olej)
 *   w  voda (smrteľná)      c  drobiaci sa kameň
 *   i  ľad (šmykľavý)       b  skákacia huba (vymrští)
 *   v  cencúľ (spadne)      S  veľký tieň (3 zásahy)
 *   H  pohyblivá plošina ↔  V  pohyblivá plošina ↕ (2 políčka široká, 4 políčka dráha)
 *   1–9  tabuľa s radou
 */
export const TILE = 16;

export enum Tile {
  Empty,
  Ground,
  Ledge,
  Light,
  Thorns,
  Water,
  Crumble,
  Ice,
  Bounce,
}

export type World = 'forest' | 'caves' | 'swamp' | 'ice' | 'tower' | 'abyss' | 'storm';

/** Pevná zem (aj ľad a huba): na nej sa stojí a cez ňu sa neprejde. */
export function isGround(tile: Tile): boolean {
  return tile === Tile.Ground || tile === Tile.Ice || tile === Tile.Bounce;
}

export interface MoverDef extends Point {
  axis: 'h' | 'v';
}

export interface Point {
  x: number;
  y: number;
}

export interface Sign extends Point {
  hint: string;
}

export interface LevelDef {
  id: string;
  /** Kľúč názvu v i18n. */
  name: string;
  world: World;
  /** Kľúče rád pre tabule 1–9 (index 0 = tabuľa „1“). */
  hints?: string[];
  rows: string[];
}

export interface Level {
  id: string;
  name: string;
  world: World;
  width: number;
  height: number;
  tiles: Tile[];
  start: Point;
  fireflies: Point[];
  crystals: Point[];
  lanterns: Point[];
  shades: Point[];
  bigShades: Point[];
  moths: Point[];
  icicles: Point[];
  movers: MoverDef[];
  signs: Sign[];
  exit: Point;
}

const TILES: Record<string, Tile> = {
  '#': Tile.Ground,
  '-': Tile.Ledge,
  '=': Tile.Light,
  '^': Tile.Thorns,
  w: Tile.Water,
  c: Tile.Crumble,
  i: Tile.Ice,
  b: Tile.Bounce,
};

/** Stred políčka v pixeloch. */
const center = (col: number, row: number): Point => ({
  x: col * TILE + TILE / 2,
  y: row * TILE + TILE / 2,
});

export function parseLevel(def: LevelDef): Level {
  const height = def.rows.length;
  const width = Math.max(...def.rows.map((r) => r.length));
  const level: Level = {
    id: def.id,
    name: def.name,
    world: def.world,
    width,
    height,
    tiles: new Array<Tile>(width * height).fill(Tile.Empty),
    start: { x: 0, y: 0 },
    fireflies: [],
    crystals: [],
    lanterns: [],
    shades: [],
    bigShades: [],
    moths: [],
    icicles: [],
    movers: [],
    signs: [],
    exit: { x: 0, y: 0 },
  };
  let hasStart = false;
  let hasExit = false;
  def.rows.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? ' ';
      const tile = TILES[ch];
      if (tile !== undefined) {
        level.tiles[y * width + x] = tile;
        continue;
      }
      const c = center(x, y);
      if (ch === 'P') {
        level.start = c;
        hasStart = true;
      } else if (ch === 'f') level.fireflies.push(c);
      else if (ch === '*') level.crystals.push(c);
      else if (ch === 'L') level.lanterns.push(c);
      else if (ch === 's') level.shades.push(c);
      else if (ch === 'm') level.moths.push(c);
      else if (ch === 'S') level.bigShades.push(c);
      else if (ch === 'v') level.icicles.push(c);
      else if (ch === 'H' || ch === 'V')
        level.movers.push({ x: x * TILE, y: y * TILE, axis: ch === 'H' ? 'h' : 'v' });
      else if (ch === 'E') {
        level.exit = c;
        hasExit = true;
      } else if (ch >= '1' && ch <= '9') {
        const hint = def.hints?.[Number(ch) - 1];
        if (!hint) throw new Error(`Level ${def.id}: tabuľa ${ch} nemá radu`);
        level.signs.push({ ...c, hint });
      } else if (ch !== ' ') throw new Error(`Level ${def.id}: neznámy znak '${ch}'`);
    }
  });
  if (!hasStart) throw new Error(`Level ${def.id}: chýba štart P`);
  if (!hasExit) throw new Error(`Level ${def.id}: chýba vatra E`);
  return level;
}

export function tileAt(level: Level, col: number, row: number): Tile {
  if (col < 0 || col >= level.width) return Tile.Ground; // okraje sveta sú stena
  if (row < 0 || row >= level.height) return Tile.Empty; // hore aj dole voľno (dole sa padá)
  return level.tiles[row * level.width + col]!;
}
