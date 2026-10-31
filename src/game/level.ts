/**
 * Level z ASCII mapy. Každý znak je jedno políčko 16×16 px:
 *
 *   #  kameň / murivo       -  trám (stúpiš naň zdola)
 *   =  svetelná plošina (pevná len vo svetle; Miasma ju zatiaľ nepoužíva)
 *   ^  železné hroty        P  štart
 *   f  uhlík (smola do fakle) *  relikvia (tajomstvo)
 *   L  kaplnka (checkpoint) E  hranica na konci
 *   s  morový prízrak       r  kŕdeľ potkanov (boja sa svetla; v tme zabijú)
 *   w  žumpa (smrteľná)     c  zhnité dosky (prelomia sa)
 *   i  slizký kameň (šmykľavý) b  napnutá plachta (vymrští)
 *   v  uvoľnený kus muriva (spadne)  S  veľký prízrak (3 zásahy)
 *   g  nakazený (chodí po zemi, zabije dotykom)
 *   x  horľavá barikáda (pevná, kým ju nepodpáliš)
 *   ~  oblak miazmy (nakazí; rozžiarená fakľa ho spáli)
 *   h  liečivé byliny (vyliečia nákazu)
 *   n  morové hniezdo (treba spáliť, inak sa hranica nezapáli)
 *   u  preživší (prosí o bylinu; bez nej sa pri zvone premení)
 *   k  kľúč                 D  zamknuté dvere (otvorí ich kľúč)
 *   $  groš (na lekáreň)
 *   C  voz s mŕtvolami (jedna sa posadí: nakazený, alebo preživší)
 *   H  visiaca plošina ↔    V  visiaca plošina ↕ (2 políčka široká, 4 políčka dráha)
 *   1–9  odkaz na stene s radou
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
  Barricade,
  Door,
}

export type World = 'quarter' | 'catacombs' | 'pits' | 'cathedral';

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

/** Voz s mŕtvolami; `survivor` = posadí sa živý človek (inak nakazený). */
export interface Cart extends Point {
  survivor: boolean;
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
  rats: Point[];
  ghouls: Point[];
  herbs: Point[];
  nests: Point[];
  survivors: Point[];
  keys: Point[];
  coins: Point[];
  carts: Cart[];
  /** Políčka s miazmou (stĺpec, riadok). */
  fog: { col: number; row: number }[];
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
  x: Tile.Barricade,
  D: Tile.Door,
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
    rats: [],
    ghouls: [],
    herbs: [],
    nests: [],
    survivors: [],
    keys: [],
    coins: [],
    carts: [],
    fog: [],
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
      else if (ch === 'r') level.rats.push(c);
      else if (ch === 'g') level.ghouls.push(c);
      else if (ch === 'h') level.herbs.push(c);
      else if (ch === 'n') level.nests.push(c);
      else if (ch === 'u') level.survivors.push(c);
      else if (ch === 'k') level.keys.push(c);
      else if (ch === '$') level.coins.push(c);
      else if (ch === 'C')
        level.carts.push({ ...c, survivor: cartHoldsSurvivor(def.id, level.carts.length) });
      else if (ch === '~') level.fog.push({ col: x, row: y });
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
  if (!hasExit) throw new Error(`Level ${def.id}: chýba hranica E`);
  return level;
}

export function tileAt(level: Level, col: number, row: number): Tile {
  if (col < 0 || col >= level.width) return Tile.Ground; // okraje sveta sú stena
  if (row < 0 || row >= level.height) return Tile.Empty; // hore aj dole voľno (dole sa padá)
  return level.tiles[row * level.width + col]!;
}

/**
 * Kto sa na voze posadí, je pevne dané levelom (hráč to nevie dopredu, ale počet
 * zachrániteľných preživších sa nemení): zhruba polovica vozov skrýva živého človeka.
 */
export function cartHoldsSurvivor(id: string, index: number): boolean {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (index + 7), 2246822519);
  return ((h >>> 13) & 1) === 1;
}

/** Všetci preživší levelu vrátane tých, čo sa posadia na voze. */
export function survivorTotal(level: Level): number {
  return level.survivors.length + level.carts.filter((c) => c.survivor).length;
}
