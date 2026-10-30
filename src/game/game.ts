import {
  TILE,
  Tile,
  isGround,
  tileAt,
  type Level,
  type Point,
  type Sign,
  type World,
} from './level';
import { Rng } from './rng';
import { NO_PERKS, type Perks } from './save';

export interface Input {
  left: boolean;
  right: boolean;
  down: boolean;
  jump: boolean;
  flare: boolean;
  /** Hod iskry. */
  spark: boolean;
  /** Úder palicou. */
  cane: boolean;
  /** Použiť bylinu (pri preživšom ju dá jemu). */
  herb: boolean;
}

export const NO_INPUT: Input = {
  left: false,
  right: false,
  down: false,
  jump: false,
  flare: false,
  spark: false,
  cane: false,
  herb: false,
};

// --- Pohyb (px, s) ---
// Pokojné tempo kvôli temnej atmosfére; skok je pomalší a plávavejší, s podobným dosahom ako predtým.
export const GRAVITY = 560;
const MAX_FALL = 240;
export const RUN_SPEED = 85;
const GROUND_ACCEL = 650;
const AIR_ACCEL = 450;
const FRICTION = 800;
export const JUMP_SPEED = 262;
const JUMP_CUT = 0.45;
const STEP_UP = 2;
const COYOTE = 0.1;
const JUMP_BUFFER = 0.12;
/** Na vrchole skoku (pomalý zvislý pohyb) gravitácia slabne — postavička sa chvíľu vznáša. */
const APEX_SPEED = 70;
const APEX_GRAVITY = 0.45;
export const PLAYER_W = 8;
export const PLAYER_H = 13;

// --- Fakľa a smola (v kóde „olej“) ---
// Miasma je tvrdšia než Lumen: fakľa horí rýchlejšie, uhlíkov je menej a svetlo je menšie.
export const OIL_MAX = 100;
// --- Ukrytá fakľa (pod plášťom): málo svetla, šetrí smolu, nevidia ťa, ale tma ťa pohlcuje ---
export const SHIELD_RADIUS = 22;
const SHIELD_DRAIN = 0.4;
const SHIELD_SPEED = 0.5;
/** Ako rýchlo ťa pohlcuje tma, keď máš fakľu pod plášťom (násobok oproti úplnej tme). */
const SHIELD_DREAD = 0.55;
// --- Miazma: nákaza rastie v oblaku, mimo neho pomaly klesá ---
const INFECT_RATE = 0.34;
const INFECT_HEAL = 0.1;
const FOG_BURN = 4;
const FOG_REGROW = 0.1;
// --- Horľavé barikády ---
const BARRICADE_BURN = 1.1;
/** Po koľkých sekundách horenia preskočí oheň na susedné dosky. */
const BARRICADE_SPREAD = 0.35;
export const BARRICADE_LIGHT = 46;
// --- Morové hniezda: kopy tiel a slamy, ktoré treba spáliť ---
const NEST_BURN = 2.6;
// --- Byliny a preživší ---
/** Koľko bylín unesie lekár. */
export const HERB_MAX = 3;
/** Ako blízko musí byť preživší, aby mu dal bylinu (a aby sa ukázala prosba). */
const SURVIVOR_REACH = 18;
export const NEST_LIGHT = 52;
export const OIL_DRAIN = 2;
export const FLARE_DRAIN = 20;
export const FIREFLY_OIL = 12;
export const LIGHT_RADIUS = 44;
export const FLARE_RADIUS = 140;
export const EMBER_RADIUS = 18;
export const LANTERN_RADIUS = 64;
export const SPARK_OIL = 6;
const SPARK_SPEED = 190;
const SPARK_LIFE = 0.8;
const SPARK_COOLDOWN = 0.35;
export const SPARK_RADIUS = 34;
// --- Palica morového lekára: úder na blízko, odpáli nakazených (aj do priepasti) ---
/** Trvanie švihu a kedy v ňom palica zasahuje. */
export const CANE_TIME = 0.3;
const CANE_HIT_FROM = 0.06;
const CANE_HIT_TO = 0.18;
const CANE_COOLDOWN = 0.42;
/** Dosah palice od stredu hráča. */
export const CANE_REACH = 22;
const CANE_KNOCK = 150;
/** Zásah palicou ubere nakazenému polovicu síl. */
const CANE_DAMAGE = 0.5;
const KNOCK_TIME = 0.55;
const CRUMBLE_DELAY = 0.6;
/** Skákacia huba vymrští asi o 6 políčok. */
export const BOUNCE_SPEED = 340;
/** Ľad: slabé zrýchlenie a takmer žiadne trenie. */
const ICE_ACCEL = 170;
const ICE_FRICTION = 55;
const ICICLE_DELAY = 0.45;
const ICICLE_GRAVITY = 900;
/** Pohyblivé plošiny: šírka, dráha a čas jednej cesty. */
export const MOVER_W = 32;
export const MOVER_H = 5;
const MOVER_RANGE = 64;
const MOVER_TRIP = 2.2;
/** Počasie podľa sveta: blesky nad mestom a cintorínom, vietor len na otvorenom cintoríne. */
const WEATHER: Record<World, { wind: boolean; lightning: boolean }> = {
  quarter: { wind: false, lightning: true },
  catacombs: { wind: false, lightning: false },
  pits: { wind: true, lightning: true },
  cathedral: { wind: false, lightning: false },
};

export function hasWind(world: World): boolean {
  return WEATHER[world].wind;
}

/**
 * Vietor (Morové jamy): bezvetrie → zosilnenie → náraz → slabnutie, stále dokola.
 * Vo vzduchu hráča odfukuje, pri chôdzi ho brzdí alebo poháňa; kto stojí, toho neodfúkne.
 */
const WIND_CALM = 3.2;
const WIND_RISE = 0.9;
const WIND_GUST = 2.3;
const WIND_FALL = 0.8;
export const WIND_CYCLE = WIND_CALM + WIND_RISE + WIND_GUST + WIND_FALL;
const WIND_AIR = 62;
const WIND_GROUND = 45;
/** Smer nárazov: väčšinou proti hráčovi, každý tretí do chrbta. */
const WIND_PATTERN = [-1, -1, 1] as const;

/** Sila a smer vetra v čase t (−1 až 1); kladný fúka doprava. */
export function windAt(t: number): number {
  const n = Math.floor(t / WIND_CYCLE);
  const dir = WIND_PATTERN[n % WIND_PATTERN.length]!;
  let u = t - n * WIND_CYCLE - WIND_CALM;
  if (u < 0) return 0;
  if (u < WIND_RISE) return dir * smooth(u / WIND_RISE);
  u -= WIND_RISE;
  if (u < WIND_GUST) return dir;
  u -= WIND_GUST;
  return dir * (1 - smooth(Math.min(1, u / WIND_FALL)));
}

/** Koľko sekúnd zostáva do ďalšieho nárazu (0, keď už fúka). */
export function calmLeft(t: number): number {
  const u = t - Math.floor(t / WIND_CYCLE) * WIND_CYCLE;
  if (u < WIND_CALM) return WIND_CALM - u;
  if (u < WIND_CALM + WIND_RISE + WIND_GUST + WIND_FALL * 0.5) return 0;
  return WIND_CYCLE - u + WIND_CALM;
}

function smooth(x: number): number {
  return x * x * (3 - 2 * x);
}

/** Koľko zásahov vydrží veľký tieň. */
export const BIG_SHADE_HITS = 3;
const CRUMBLE_RESPAWN = 3;
/** Koľko sekúnd vydrží hráč v úplnej tme (bez oleja), kým ho tma pohltí. */
export const DREAD_LIMIT = 3;
/** Prízrak sa pred výpadom na chvíľu zastaví a oči mu sčervenajú (férové varovanie). */
export const WINDUP = 0.45;
// --- Nakazení: chodia po zemi, nespadnú z hrany, zabijú dotykom ---
export const GHOUL_W = 8;
export const GHOUL_H = 14;
const GHOUL_WALK = 16;
const GHOUL_CHASE = 46;
/** Svetlo ťa prezrádza: dohľad nakazených rastie s polomerom fakle. */
const GHOUL_SIGHT = 40;
const GHOUL_SIGHT_PER_RADIUS = 1.5;
/** Rozžiarenú fakľu zbadajú nakazení zďaleka (aj z iného poschodia) a prídu sa pozrieť. */
export const FLARE_CALL = 240;
/** Iskra, ktorá zhasne, a horiaca barikáda prilákajú nakazených nablízku. */
export const SPARK_CALL = 120;
const FIRE_CALL = 110;
const GHOUL_LURE = 0.7;
// --- Morový zvon: udrie v pravidelných intervaloch a nakazení sa rozbehnú za hráčom ---
export const BELL_FIRST = 40;
export const BELL_PERIOD = 50;
/** Ako dlho po údere zvonu nakazení bežia za hráčom (s ukrytou fakľou len na miesto, kde stál). */
export const BELL_FRENZY = 6;
/** Odkiaľ zvon nakazených zburcuje. */
const BELL_RANGE = 360;
/** Varovanie pred zvonom (prvý vzdialený úder). */
export const BELL_WARN = 3;
// --- Potkany: boja sa svetla, ale keď fakľa zhasne alebo ju ukryješ, roztrhajú ťa ---
export const RAT_W = 6;
export const RAT_H = 4;
const RAT_RUN = 64;
const RAT_FLEE = 82;
const RAT_WANDER = 18;
const RAT_SIGHT = 150;
/** Potkany sa držia od plameňa ďalej, než je polomer svetla mínus táto rezerva. */
export const RAT_DARE = 16;
const RESPAWN_DELAY = 1.1;

export type GameEvent =
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'firefly'; x: number; y: number }
  | { type: 'crystal'; x: number; y: number }
  | { type: 'lantern'; x: number; y: number }
  | { type: 'flare' }
  | { type: 'hurt' }
  | { type: 'shadeDie'; x: number; y: number }
  | { type: 'ratDie'; x: number; y: number }
  | { type: 'squeak'; x: number; y: number }
  | { type: 'swing' }
  | { type: 'caneHit'; x: number; y: number }
  | { type: 'throw' }
  | { type: 'fizzle'; x: number; y: number }
  | { type: 'crumble'; x: number; y: number }
  | { type: 'bounce'; x: number; y: number }
  | { type: 'icicle'; x: number; y: number }
  | { type: 'shatter'; x: number; y: number }
  | { type: 'shadeHit'; x: number; y: number }
  | { type: 'windup' }
  | { type: 'lunge' }
  | { type: 'ghoulNotice'; x: number; y: number }
  | { type: 'ghoulDie'; x: number; y: number }
  | { type: 'ignite'; x: number; y: number }
  | { type: 'burnt'; x: number; y: number }
  | { type: 'herb'; x: number; y: number }
  | { type: 'cure' }
  | { type: 'key'; x: number; y: number }
  | { type: 'coin'; x: number; y: number }
  | { type: 'doorOpen'; x: number; y: number }
  | { type: 'saved'; x: number; y: number }
  | { type: 'turned'; x: number; y: number }
  | { type: 'shield'; on: boolean }
  | { type: 'fogBurn'; x: number; y: number }
  | { type: 'gust'; dir: number }
  | { type: 'nestIgnite'; x: number; y: number }
  | { type: 'nestBurnt'; x: number; y: number }
  | { type: 'gateLocked'; left: number }
  | { type: 'bellWarn' }
  | { type: 'bell' }
  | { type: 'lightning' }
  | { type: 'died'; cause: DeathCause }
  | { type: 'respawn' }
  | { type: 'exit' };

export type DeathCause =
  'thorns' | 'fall' | 'dark' | 'water' | 'icicle' | 'shade' | 'ghoul' | 'miasma' | 'rats';

export interface Player {
  /** Ľavý horný roh hitboxu. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  invulnerable: number;
}

export interface Shade {
  x: number;
  y: number;
  home: Point;
  vx: number;
  vy: number;
  alive: boolean;
  active: boolean;
  /** 0–1, svetlo ho spaľuje. */
  hp: number;
  state: 'stalk' | 'windup' | 'lunge' | 'recoil';
  timer: number;
  angle: number;
  dirX: number;
  dirY: number;
  /** Práve horí vo svetle (pre efekty). */
  burning: boolean;
  /** Veľký tieň: vydrží viac zásahov. */
  big: boolean;
  hits: number;
}

/** Nakazený: x je stred, y sú chodidlá. */
export interface Ghoul {
  x: number;
  y: number;
  home: Point;
  dir: 1 | -1;
  vx: number;
  alive: boolean;
  /** Zbadal fakľu a ide po hráčovi. */
  chasing: boolean;
  /** 0–1, rozžiarená fakľa ho spaľuje. */
  hp: number;
  burning: boolean;
  /** Fáza chôdze (pre animáciu). */
  step: number;
  /** Kam ho priláka svetlo (x) a ako dlho tam ešte bude hľadať. */
  lure: number;
  lureTime: number;
  /** Odpálený palicou: kĺže dozadu a chvíľu sa spamätáva. */
  knock: number;
}

/** Potkan: x je stred, y sú labky. */
export interface Rat {
  x: number;
  y: number;
  home: Point;
  vx: number;
  dir: 1 | -1;
  alive: boolean;
  hp: number;
  burning: boolean;
  /** Uteká pred svetlom (pre animáciu a pišťanie). */
  fleeing: boolean;
  step: number;
}

export interface Icicle {
  x: number;
  y: number;
  home: Point;
  state: 'hang' | 'shake' | 'fall' | 'gone';
  timer: number;
  vy: number;
}

export interface Mover {
  /** Ľavý horný roh. */
  x: number;
  y: number;
  origin: Point;
  axis: 'h' | 'v';
  dx: number;
  dy: number;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  life: number;
}

export interface Crumble {
  col: number;
  row: number;
  state: 'solid' | 'shaking' | 'gone';
  timer: number;
}

export interface Barricade {
  col: number;
  row: number;
  state: 'solid' | 'burning' | 'gone';
  /** Ako dlho už horí. */
  timer: number;
}

/** Preživší: kľačí a prosí o bylinu; y sú chodidlá. */
export interface Survivor extends Point {
  state: 'waiting' | 'saved' | 'turned';
  /** Čas od záchrany (pre animáciu, keď odchádza). */
  timer: number;
}

export interface Nest extends Point {
  state: 'intact' | 'burning' | 'ash';
  timer: number;
}

export interface Pickup extends Point {
  taken: boolean;
}

export interface Lantern extends Point {
  lit: boolean;
}

export interface LightSource extends Point {
  radius: number;
  /** Dosah, na ktorý zhmotňuje svetelné plošiny (ak sa líši od polomeru). */
  reach?: number;
}

/** Svetelné plošiny lampáš zhmotní o kúsok ďalej, než siaha viditeľné svetlo. */
const LAMP_REACH_BONUS = 28;

export class Game {
  readonly player: Player;
  oil = OIL_MAX;
  /** Aktuálny polomer svetla lampáša (plynule sa mení). */
  radius = LIGHT_RADIUS;
  flaring = false;
  /** Sekundy strávené v úplnej tme. */
  dread = 0;
  time = 0;
  deaths = 0;
  state: 'play' | 'dead' | 'done' = 'play';
  readonly fireflies: Pickup[];
  readonly crystals: Pickup[];
  readonly lanterns: Lantern[];
  readonly shades: Shade[];
  readonly rats: Rat[];
  readonly ghouls: Ghoul[];
  readonly sparks: Spark[] = [];
  /** Miesta, kde zhasli iskry (prilákajú nakazených). */
  private noises: Point[] = [];
  readonly crumbles: Crumble[] = [];
  private crumbleAt = new Map<number, Crumble>();
  readonly barricades: Barricade[] = [];
  private barricadeAt = new Map<number, Barricade>();
  readonly herbs: Pickup[];
  readonly nests: Nest[];
  readonly survivors: Survivor[];
  readonly keys: Pickup[];
  readonly coins: Pickup[];
  /** Kľúče v brašni a otvorené dvere (index políčka). */
  keysCarried = 0;
  readonly openDoors = new Set<number>();
  /** Byliny v brašne. */
  herbsCarried = 0;
  private herbHeld = false;
  /** Hráč stojí pri zatvorenej hranici (aby sa upozornenie neopakovalo). */
  private atGate = false;
  /** Hustota miazmy po políčkach (0–1) a jej pôvodná hodnota (dorastá späť). */
  readonly fog: Float32Array;
  private fogHome: Float32Array;
  private fogCells: number[];
  /** Nákaza hráča (1 = smrť). */
  infection = 0;
  /** Fakľa je ukrytá pod plášťom. */
  shielded = false;
  readonly icicles: Icicle[];
  readonly movers: Mover[];
  /** Index plošiny, na ktorej hráč stojí (−1 = žiadna). */
  onMover = -1;
  /** Hráč stojí na ľade. */
  onIce = false;
  private sparkCooldown = 0;
  private sparkHeld = false;
  /** Čas od začiatku švihu palicou (−1 = nešvihá) a čo už zasiahol. */
  swing = -1;
  private swingCooldown = 0;
  private caneHeld = false;
  private swingHits = new Set<object>();
  exitLit = false;
  /** Tabuľa, pri ktorej hráč stojí (rada na obrazovke). */
  sign: Sign | null = null;
  private checkpoint: Point;
  /** Uhlíky zobraté od poslednej kaplnky: po smrti sa vrátia, aby sa dalo dôjsť ďalej. */
  private embersSinceCheckpoint: Pickup[] = [];
  private coyote = 0;
  private jumpBuffer = 0;
  private jumpHeld = false;
  private flareHeld = false;
  private deadTimer = 0;
  private rng: Rng;
  /** Blesky majú vlastný generátor, aby nemenili správanie tieňov. */
  private skyRng: Rng;
  private nextFlash = 3;
  private strikeAge = 99;
  /** Aktuálny vietor (−1 až 1) a či je hráč v závetrí. */
  wind = 0;
  sheltered = false;
  /** Záblesk blesku (1 = práve udrel, klesá k 0). */
  flash = 0;
  /** Čas ďalšieho úderu zvonu a zostávajúci čas besnenia po ňom. */
  nextBell = BELL_FIRST;
  frenzy = 0;
  private events: GameEvent[] = [];

  /** Smola horí pomalšie s väčšou ampulkou, miazma nakazí pomalšie s lepšou maskou. */
  private drainScale: number;
  private infectScale: number;

  constructor(
    readonly level: Level,
    readonly perks: Perks = NO_PERKS,
    herbs = 0,
  ) {
    this.drainScale = 1 - perks.flask * 0.12;
    this.infectScale = 1 - perks.mask * 0.25;
    this.herbsCarried = herbs;
    this.rng = new Rng(hash(level.id));
    this.skyRng = new Rng(hash(level.id) ^ 0x5bd1e995);
    this.checkpoint = { ...level.start };
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      invulnerable: 0,
    };
    this.placePlayer(level.start);
    this.fireflies = level.fireflies.map((p) => ({ ...p, taken: false }));
    this.crystals = level.crystals.map((p) => ({ ...p, taken: false }));
    this.lanterns = level.lanterns.map((p) => ({ ...p, lit: false }));
    const shade = (p: Point, big: boolean): Shade => ({
      x: p.x,
      y: p.y,
      home: { ...p },
      vx: 0,
      vy: 0,
      alive: true,
      active: false,
      hp: 1,
      state: 'stalk',
      timer: 2 + this.rng.next() * 2,
      angle: this.rng.next() * Math.PI * 2,
      dirX: 0,
      dirY: 0,
      burning: false,
      big,
      hits: big ? BIG_SHADE_HITS : 1,
    });
    this.shades = [
      ...level.shades.map((p) => shade(p, false)),
      ...level.bigShades.map((p) => shade(p, true)),
    ];
    this.icicles = level.icicles.map((p) => ({
      x: p.x,
      y: p.y - TILE / 2,
      home: { x: p.x, y: p.y - TILE / 2 },
      state: 'hang',
      timer: 0,
      vy: 0,
    }));
    this.movers = level.movers.map((m) => ({
      x: m.x,
      y: m.y,
      origin: { x: m.x, y: m.y },
      axis: m.axis,
      dx: 0,
      dy: 0,
    }));
    this.rats = [];
    for (const p of level.rats) {
      const feet = this.floorBelow(p);
      for (const dx of [-5, 0, 5])
        this.rats.push({
          x: p.x + dx,
          y: feet ?? p.y,
          home: { x: p.x + dx, y: feet ?? p.y },
          vx: 0,
          dir: dx < 0 ? -1 : 1,
          alive: feet !== null,
          hp: 1,
          burning: false,
          fleeing: false,
          step: this.rng.next() * 10,
        });
    }
    this.ghouls = level.ghouls.map((p) => {
      const feet = p.y + TILE / 2;
      return {
        x: p.x,
        y: feet,
        home: { x: p.x, y: feet },
        dir: -1,
        vx: 0,
        alive: true,
        chasing: false,
        hp: 1,
        burning: false,
        step: 0,
        lure: p.x,
        lureTime: 0,
        knock: 0,
      };
    });
    this.herbs = level.herbs.map((p) => ({ ...p, taken: false }));
    this.nests = level.nests.map((p) => ({ ...p, state: 'intact', timer: 0 }));
    this.keys = level.keys.map((p) => ({ ...p, taken: false }));
    this.coins = level.coins.map((p) => ({ ...p, taken: false }));
    this.survivors = level.survivors.map((p) => ({
      x: p.x,
      y: p.y + TILE / 2,
      state: 'waiting',
      timer: 0,
    }));
    this.fog = new Float32Array(level.width * level.height);
    for (const f of level.fog) this.fog[f.row * level.width + f.col] = 1;
    this.fogHome = this.fog.slice();
    this.fogCells = level.fog.map((f) => f.row * level.width + f.col);
    level.tiles.forEach((tile, i) => {
      if (tile !== Tile.Barricade) return;
      const b: Barricade = {
        col: i % level.width,
        row: Math.floor(i / level.width),
        state: 'solid',
        timer: 0,
      };
      this.barricades.push(b);
      this.barricadeAt.set(i, b);
    });
    level.tiles.forEach((tile, i) => {
      if (tile !== Tile.Crumble) return;
      const c: Crumble = {
        col: i % level.width,
        row: Math.floor(i / level.width),
        state: 'solid',
        timer: 0,
      };
      this.crumbles.push(c);
      this.crumbleAt.set(i, c);
    });
  }

  /** Stred hráča. */
  get center(): Point {
    return { x: this.player.x + PLAYER_W / 2, y: this.player.y + PLAYER_H / 2 };
  }

  /** Poloha plameňa (fakľa v ruke pred hráčom). */
  get lamp(): Point {
    return { x: this.player.x + PLAYER_W / 2 + this.player.facing * 6, y: this.player.y + 5 };
  }

  get fireflyCount(): number {
    return this.fireflies.filter((f) => f.taken).length;
  }

  get coinCount(): number {
    return this.coins.filter((c) => c.taken).length;
  }

  get savedCount(): number {
    return this.survivors.filter((s) => s.state === 'saved').length;
  }

  get nestsBurnt(): number {
    return this.nests.filter((n) => n.state !== 'intact').length;
  }

  get crystalCount(): number {
    return this.crystals.filter((c) => c.taken).length;
  }

  /** Všetky svetlá, ktoré odháňajú tiene a zhmotňujú svetelné plošiny. */
  lights(): LightSource[] {
    const lights: LightSource[] = [];
    if (this.state !== 'dead')
      lights.push({ ...this.lamp, radius: this.radius, reach: this.radius + LAMP_REACH_BONUS });
    for (const l of this.lanterns)
      if (l.lit) lights.push({ x: l.x, y: l.y, radius: LANTERN_RADIUS });
    if (this.exitLit) lights.push({ ...this.level.exit, radius: LANTERN_RADIUS * 1.5 });
    for (const sp of this.sparks) lights.push({ x: sp.x, y: sp.y, radius: SPARK_RADIUS });
    for (const b of this.barricades)
      if (b.state === 'burning')
        lights.push({
          x: b.col * TILE + TILE / 2,
          y: b.row * TILE + TILE / 2,
          radius: BARRICADE_LIGHT,
        });
    for (const n of this.nests)
      if (n.state === 'burning') lights.push({ x: n.x, y: n.y, radius: NEST_LIGHT });
    return lights;
  }

  /** Je políčko (aspoň jeho časť) vo svetle? */
  isTileLit(col: number, row: number, lights = this.lights()): boolean {
    const x0 = col * TILE;
    const y0 = row * TILE;
    return lights.some((l) => {
      const nx = Math.max(x0, Math.min(l.x, x0 + TILE));
      const ny = Math.max(y0, Math.min(l.y, y0 + TILE));
      return Math.hypot(l.x - nx, l.y - ny) < (l.reach ?? l.radius) * 0.85;
    });
  }

  step(dt: number, input: Input): GameEvent[] {
    this.events = [];
    if (this.state === 'done') return this.events;
    this.time += dt;
    if (this.state === 'dead') {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0) this.respawn();
      this.updateShades(dt);
      this.updateRats(dt);
      this.updateGhouls(dt);
      this.updateSparks(dt);
      this.updateCrumbles(dt);
      this.updateBarricades(dt);
      this.updateMovers();
      this.updateIcicles(dt);
      return this.events;
    }
    this.updateWeather(dt);
    this.updateBell(dt);
    this.updateLight(dt, input);
    this.updateCrumbles(dt);
    this.updateBarricades(dt);
    this.updateFog(dt);
    this.updateMovers();
    this.updatePlayer(dt, input);
    this.updateIcicles(dt);
    this.throwSpark(dt, input);
    this.updateSparks(dt);
    this.swingCane(dt, input);
    this.useHerb(input);
    for (const s of this.survivors) if (s.state === 'saved') s.timer += dt;
    if (this.state === 'play') this.updateShades(dt);
    if (this.state === 'play') this.updateRats(dt);
    if (this.state === 'play') this.updateGhouls(dt);
    if (this.state === 'play') this.collect();
    return this.events;
  }

  /** Vietor a blesky podľa sveta. */
  private updateWeather(dt: number): void {
    const weather = WEATHER[this.level.world];
    if (weather.wind) {
      const before = this.wind;
      this.wind = windAt(this.time);
      if (before === 0 && this.wind !== 0)
        this.events.push({ type: 'gust', dir: Math.sign(this.wind) });
    }
    if (!weather.lightning) return;
    // Blesk: dve bliknutia a pomalé doznievanie.
    this.strikeAge += dt;
    const a = this.strikeAge;
    this.flash =
      a < 0.07 ? 1 : a < 0.15 ? 0.25 : a < 0.24 ? 0.85 : Math.max(0, 0.85 - (a - 0.24) * 1.6);
    if (this.time >= this.nextFlash) {
      this.strikeAge = 0;
      this.flash = 1;
      this.nextFlash = this.time + 4 + this.skyRng.next() * 7;
      this.events.push({ type: 'lightning' });
    }
  }

  /** Preživší, ku ktorému hráč práve stojí (čaká na pomoc). */
  get nearSurvivor(): Survivor | null {
    const c = this.center;
    return (
      this.survivors.find(
        (s) =>
          s.state === 'waiting' &&
          Math.abs(s.x - c.x) < SURVIVOR_REACH &&
          Math.abs(s.y - (this.player.y + PLAYER_H)) < 12,
      ) ?? null
    );
  }

  /** Bylina: pri preživšom ho zachráni, inak vylieči lekára. */
  private useHerb(input: Input): void {
    const pressed = input.herb && !this.herbHeld;
    this.herbHeld = input.herb;
    if (!pressed || this.herbsCarried <= 0 || this.state !== 'play') return;
    const s = this.nearSurvivor;
    if (s) {
      s.state = 'saved';
      s.timer = 0;
      this.herbsCarried--;
      this.events.push({ type: 'saved', x: s.x, y: s.y - 8 });
    } else if (this.infection > 0.02) {
      this.infection = 0;
      this.herbsCarried--;
      this.events.push({ type: 'cure' });
    }
  }

  /** Morový zvon: varovanie, úder a po ňom besnenie nakazených. */
  private updateBell(dt: number): void {
    const before = this.nextBell - (this.time - dt);
    const left = this.nextBell - this.time;
    if (before > BELL_WARN && left <= BELL_WARN) this.events.push({ type: 'bellWarn' });
    this.frenzy = Math.max(0, this.frenzy - dt);
    if (left > 0) return;
    this.nextBell += BELL_PERIOD;
    this.frenzy = BELL_FRENZY;
    this.events.push({ type: 'bell' });
    const c = this.center;
    // Preživší, ktorým nikto nepomohol, sa pri zvone premenia na nakazených.
    for (const s of this.survivors) {
      if (s.state !== 'waiting' || Math.hypot(s.x - c.x, s.y - 8 - c.y) > BELL_RANGE) continue;
      s.state = 'turned';
      this.events.push({ type: 'turned', x: s.x, y: s.y - 8 });
      this.ghouls.push({
        x: s.x,
        y: s.y,
        home: { x: s.x, y: s.y },
        dir: c.x < s.x ? -1 : 1,
        vx: 0,
        alive: true,
        chasing: false,
        hp: 1,
        burning: false,
        step: 0,
        lure: c.x,
        lureTime: BELL_FRENZY,
        // Chvíľu vstáva zo zeme (neútočí), aby premena nezabila hráča, ktorý stojí pri ňom.
        knock: 1,
      });
    }
    for (const g of this.ghouls) {
      if (!g.alive || Math.hypot(g.x - c.x, g.y - 8 - c.y) > BELL_RANGE) continue;
      g.lure = c.x;
      g.lureTime = BELL_FRENZY;
      this.events.push({ type: 'ghoulNotice', x: g.x, y: g.y - GHOUL_H });
    }
  }

  /** Je hráč v závetrí? Stačí skala do dvoch políčok na strane, odkiaľ fúka. */
  private inShelter(dir: number): boolean {
    const p = this.player;
    const top = Math.floor(p.y / TILE);
    const bottom = Math.floor((p.y + PLAYER_H - 1) / TILE);
    for (const d of [4, 20]) {
      const x = dir > 0 ? p.x - d : p.x + PLAYER_W + d;
      const col = Math.floor(x / TILE);
      for (let row = top; row <= bottom; row++)
        if (isGround(tileAt(this.level, col, row))) return true;
    }
    return false;
  }

  private updateLight(dt: number, input: Input): void {
    // Fakľa pod plášťom (↓): nedá sa pri nej rozžiariť ani hádzať iskry.
    const shield = input.down && this.oil > 0;
    if (shield !== this.shielded) this.events.push({ type: 'shield', on: shield });
    this.shielded = shield;
    const wantsFlare = input.flare && this.oil > 0 && !shield;
    if (wantsFlare && !this.flareHeld) this.events.push({ type: 'flare' });
    this.flareHeld = wantsFlare;
    this.flaring = wantsFlare;
    const drain = wantsFlare ? FLARE_DRAIN : shield ? OIL_DRAIN * SHIELD_DRAIN : OIL_DRAIN;
    this.oil = Math.max(0, this.oil - drain * this.drainScale * dt);
    const target = this.flaring ? FLARE_RADIUS : shield ? SHIELD_RADIUS : baseRadius(this.oil);
    this.radius += (target - this.radius) * Math.min(1, dt * (this.flaring || shield ? 10 : 4));
    if (this.oil <= 0 || shield) {
      this.dread += dt * (shield ? SHIELD_DREAD : 1);
      if (this.dread >= DREAD_LIMIT) this.die('dark');
    } else {
      this.dread = Math.max(0, this.dread - dt * 3);
    }
    // Rozžiarená fakľa podpáli barikády a hniezda nablízku.
    if (this.flaring) {
      const lamp = this.lamp;
      for (const n of this.nests)
        if (n.state === 'intact' && Math.hypot(n.x - lamp.x, n.y - lamp.y) < this.radius * 0.5)
          this.igniteNest(n);
      for (const b of this.barricades) {
        if (b.state !== 'solid') continue;
        const bx = b.col * TILE + TILE / 2;
        const by = b.row * TILE + TILE / 2;
        if (Math.hypot(bx - lamp.x, by - lamp.y) < this.radius * 0.45) this.ignite(b);
      }
    }
  }

  private igniteNest(n: Nest): void {
    n.state = 'burning';
    n.timer = 0;
    this.events.push({ type: 'nestIgnite', x: n.x, y: n.y });
  }

  private ignite(b: Barricade): void {
    if (b.state !== 'solid') return;
    b.state = 'burning';
    b.timer = 0;
    this.events.push({ type: 'ignite', x: b.col * TILE + TILE / 2, y: b.row * TILE + TILE / 2 });
  }

  /** Horiace barikády zhoria a oheň sa šíri na susedné; hniezda zhoria na popol. */
  private updateBarricades(dt: number): void {
    for (const n of this.nests) {
      if (n.state !== 'burning') continue;
      n.timer += dt;
      if (n.timer >= NEST_BURN) {
        n.state = 'ash';
        this.events.push({ type: 'nestBurnt', x: n.x, y: n.y });
      }
    }
    const w = this.level.width;
    for (const b of this.barricades) {
      if (b.state !== 'burning') continue;
      const before = b.timer;
      b.timer += dt;
      if (before < BARRICADE_SPREAD && b.timer >= BARRICADE_SPREAD)
        for (const [dc, dr] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const n = this.barricadeAt.get((b.row + dr) * w + b.col + dc);
          if (n) this.ignite(n);
        }
      if (b.timer >= BARRICADE_BURN) {
        b.state = 'gone';
        this.events.push({ type: 'burnt', x: b.col * TILE + TILE / 2, y: b.row * TILE + TILE / 2 });
      }
    }
  }

  /** Miazma: rozžiarená fakľa ju spaľuje, pomaly dorastá; hráča v nej nakazí. */
  private updateFog(dt: number): void {
    const w = this.level.width;
    const lamp = this.lamp;
    for (const i of this.fogCells) {
      const home = this.fogHome[i]!;
      let d = this.fog[i]!;
      if (this.flaring && this.state === 'play') {
        const cx = (i % w) * TILE + TILE / 2;
        const cy = Math.floor(i / w) * TILE + TILE / 2;
        if (Math.hypot(cx - lamp.x, cy - lamp.y) < this.radius * 0.75) {
          if (d > 0.5 && d - dt * FOG_BURN <= 0.5)
            this.events.push({ type: 'fogBurn', x: cx, y: cy });
          d = Math.max(0, d - dt * FOG_BURN);
        }
      }
      this.fog[i] = Math.min(home, d + dt * FOG_REGROW);
    }
    if (this.state !== 'play') return;
    const c = this.center;
    const col = Math.floor(c.x / TILE);
    let density = 0;
    for (const y of [this.player.y + 2, c.y, this.player.y + PLAYER_H - 2])
      density = Math.max(density, this.fog[Math.floor(y / TILE) * w + col] ?? 0);
    if (col < 0 || col >= w) density = 0;
    if (density > 0.05) {
      this.infection += dt * INFECT_RATE * density * this.infectScale;
      if (this.infection >= 1) this.die('miasma');
    } else this.infection = Math.max(0, this.infection - dt * INFECT_HEAL);
  }

  private updatePlayer(dt: number, input: Input): void {
    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const ice = p.onGround && this.onIce;
    if (move !== 0) {
      p.facing = move > 0 ? 1 : -1;
      const accel = ice ? ICE_ACCEL : p.onGround ? GROUND_ACCEL : AIR_ACCEL;
      const speed = this.shielded ? RUN_SPEED * SHIELD_SPEED : RUN_SPEED;
      p.vx = approach(p.vx, move * speed, accel * dt);
    } else if (p.onGround) {
      p.vx = approach(p.vx, 0, (ice ? ICE_FRICTION : FRICTION) * dt);
    } else {
      p.vx = approach(p.vx, 0, AIR_ACCEL * 0.4 * dt);
    }

    // Skok: odpustenie po zídení z hrany (coyote) a stlačenie tesne pred dopadom (buffer).
    this.coyote = p.onGround ? COYOTE : Math.max(0, this.coyote - dt);
    if (input.jump && !this.jumpHeld) this.jumpBuffer = JUMP_BUFFER;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (!input.jump && this.jumpHeld && p.vy < 0) p.vy *= JUMP_CUT;
    this.jumpHeld = input.jump;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      p.vy = -JUMP_SPEED;
      p.onGround = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.events.push({ type: 'jump' });
    }

    const apex = !p.onGround && this.jumpHeld && Math.abs(p.vy) < APEX_SPEED;
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * (apex ? APEX_GRAVITY : 1) * dt);
    const lights = this.lights();
    // Vietor: vo vzduchu odfukuje, pri chôdzi brzdí alebo poháňa; stojaceho neodfúkne.
    this.sheltered = this.wind !== 0 && this.inShelter(Math.sign(this.wind));
    let drift = 0;
    if (this.wind !== 0 && !this.sheltered) {
      if (!p.onGround) drift = this.wind * WIND_AIR;
      else if (move !== 0) drift = this.wind * WIND_GROUND;
    }
    // Plošina, na ktorej hráč stojí, ho vezie so sebou.
    const carrier = this.movers[this.onMover];
    if (carrier) {
      this.moveX(carrier.dx, lights);
      p.y += carrier.dy;
    }
    this.tryDoor(Math.sign(p.vx + drift));
    this.moveX((p.vx + drift) * dt, lights);
    const wasOnGround = p.onGround;
    // Z trámu sa zoskočí šípkou dole (pri ukrývaní fakle na tráme teda spadneš nižšie).
    this.moveY(p.vy * dt, lights, input.down);
    this.landOnMovers();
    if (p.onGround && !wasOnGround) this.events.push({ type: 'land' });
    this.onIce = p.onGround && this.onMover < 0 && this.groundBelow() === Tile.Ice;
    if (p.onGround && this.onMover < 0 && this.groundBelow() === Tile.Bounce) this.bounce();

    if (this.touchesThorns()) this.die('thorns');
    else if (this.inWater()) this.die('water');
    else if (p.y > this.level.height * TILE + 48) this.die('fall');
  }

  /** S kľúčom sa zamknuté dvere pred hráčom otvoria. */
  private tryDoor(dir: number): void {
    if (dir === 0 || this.keysCarried <= 0) return;
    const p = this.player;
    const col = Math.floor((dir > 0 ? p.x + PLAYER_W + 1 : p.x - 1) / TILE);
    const w = this.level.width;
    for (const row of [Math.floor(p.y / TILE), Math.floor((p.y + PLAYER_H - 3) / TILE)]) {
      const i = row * w + col;
      if (tileAt(this.level, col, row) !== Tile.Door || this.openDoors.has(i)) continue;
      // Dvere sú aj dvojité: otvoria sa naraz všetky políčka nad sebou.
      for (let r = row; tileAt(this.level, col, r) === Tile.Door; r--)
        this.openDoors.add(r * w + col);
      for (let r = row + 1; tileAt(this.level, col, r) === Tile.Door; r++)
        this.openDoors.add(r * w + col);
      this.keysCarried--;
      this.events.push({ type: 'doorOpen', x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 });
      return;
    }
  }

  /** Pevné políčko pre pohyb; svetelné plošiny, v ktorých hráč už stojí, ho nezaseknú. */
  private solid(col: number, row: number, lights: LightSource[], overlapping: boolean): boolean {
    const tile = tileAt(this.level, col, row);
    if (isGround(tile)) return true;
    if (tile === Tile.Crumble)
      return this.crumbleAt.get(row * this.level.width + col)?.state !== 'gone';
    if (tile === Tile.Barricade)
      return this.barricadeAt.get(row * this.level.width + col)?.state !== 'gone';
    if (tile === Tile.Door) return !this.openDoors.has(row * this.level.width + col);
    if (tile === Tile.Light) return !overlapping && this.isTileLit(col, row, lights);
    return false;
  }

  private moveX(dx: number, lights: LightSource[]): void {
    const p = this.player;
    if (dx === 0) return;
    p.x += dx;
    const top = Math.floor(p.y / TILE);
    // Tolerancia schodíka: hrana nižšia ako 2 px nezastaví (napr. plošina tesne pod rímsou).
    const bottom = Math.floor((p.y + PLAYER_H - STEP_UP) / TILE);
    const col = dx > 0 ? Math.floor((p.x + PLAYER_W - 0.01) / TILE) : Math.floor(p.x / TILE);
    for (let row = top; row <= bottom; row++) {
      if (this.solid(col, row, lights, this.overlapsTileAt(col, row, p.x - dx, p.y))) {
        p.x = dx > 0 ? col * TILE - PLAYER_W : (col + 1) * TILE;
        p.vx = 0;
        return;
      }
    }
  }

  private overlapsTileAt(col: number, row: number, x: number, y: number): boolean {
    return (
      x < (col + 1) * TILE &&
      x + PLAYER_W > col * TILE &&
      y < (row + 1) * TILE &&
      y + PLAYER_H > row * TILE
    );
  }

  private moveY(dy: number, lights: LightSource[], dropThrough: boolean): void {
    const p = this.player;
    const prevY = p.y;
    p.y += dy;
    p.onGround = false;
    const left = Math.floor(p.x / TILE);
    const right = Math.floor((p.x + PLAYER_W - 0.01) / TILE);
    if (dy > 0) {
      const row = Math.floor((p.y + PLAYER_H - 0.01) / TILE);
      const prevBottom = prevY + PLAYER_H;
      for (let col = left; col <= right; col++) {
        const tile = tileAt(this.level, col, row);
        const prevOverlap = this.overlapsTileAt(col, row, p.x, prevY);
        const ledge = tile === Tile.Ledge && !dropThrough && prevBottom <= row * TILE + 0.5;
        if (ledge || this.solid(col, row, lights, prevOverlap)) {
          p.y = row * TILE - PLAYER_H;
          p.vy = 0;
          p.onGround = true;
          // Drobiace sa kamene pod nohami sa začnú rozpadávať.
          for (let c = left; c <= right; c++) {
            const crumble = this.crumbleAt.get(row * this.level.width + c);
            if (crumble?.state === 'solid') {
              crumble.state = 'shaking';
              crumble.timer = CRUMBLE_DELAY;
            }
          }
          return;
        }
      }
    } else if (dy < 0) {
      const row = Math.floor(p.y / TILE);
      for (let col = left; col <= right; col++) {
        if (this.solid(col, row, lights, this.overlapsTileAt(col, row, p.x, prevY))) {
          p.y = (row + 1) * TILE;
          p.vy = 0;
          return;
        }
      }
    }
  }

  /** Dlaždica pod chodidlami (pod stredom hráča). */
  private groundBelow(): Tile {
    const p = this.player;
    const row = Math.floor((p.y + PLAYER_H + 1) / TILE);
    const center = tileAt(this.level, Math.floor((p.x + PLAYER_W / 2) / TILE), row);
    if (center !== Tile.Empty) return center;
    // Na hrane: stačí, ak je huba či ľad aspoň pod jednou nohou.
    const left = tileAt(this.level, Math.floor(p.x / TILE), row);
    return left !== Tile.Empty
      ? left
      : tileAt(this.level, Math.floor((p.x + PLAYER_W - 0.01) / TILE), row);
  }

  private bounce(): void {
    const p = this.player;
    p.vy = -BOUNCE_SPEED;
    p.onGround = false;
    this.coyote = 0;
    const c = this.center;
    this.events.push({ type: 'bounce', x: c.x, y: p.y + PLAYER_H });
  }

  /** Poloha plošín: plynulo tam a späť (kosínus), zvislé stúpajú nahor. */
  private updateMovers(): void {
    const omega = Math.PI / MOVER_TRIP;
    for (const m of this.movers) {
      // Fáza podľa polohy: plošiny v reťazi (7 políčok od seba) sa hýbu proti sebe,
      // takže sa na chvíľu priblížia na jedno políčko a skok treba načasovať.
      const phase = (m.origin.x / TILE) * (Math.PI / 7);
      const offset = (MOVER_RANGE / 2) * (1 - Math.cos(this.time * omega + phase));
      const x = m.axis === 'h' ? m.origin.x + offset : m.origin.x;
      const y = m.axis === 'v' ? m.origin.y - offset : m.origin.y;
      m.dx = x - m.x;
      m.dy = y - m.y;
      m.x = x;
      m.y = y;
    }
  }

  /** Pristátie na plošine zhora (ako na lávke). */
  private landOnMovers(): void {
    const p = this.player;
    const prev = this.onMover;
    this.onMover = -1;
    if (p.vy < 0) return;
    for (const [i, m] of this.movers.entries()) {
      if (p.x + PLAYER_W <= m.x + 1 || p.x >= m.x + MOVER_W - 1) continue;
      const bottom = p.y + PLAYER_H;
      // Tolerancia: plošina sa medzičasom mohla posunúť proti hráčovi.
      const reach = Math.max(4, p.vy / 60 + 2) + (i === prev ? 3 : 0);
      if (bottom < m.y - 0.5 || bottom > m.y + reach) continue;
      p.y = m.y - PLAYER_H;
      p.vy = 0;
      p.onGround = true;
      this.onMover = i;
      return;
    }
  }

  private updateIcicles(dt: number): void {
    const c = this.center;
    for (const ic of this.icicles) {
      if (ic.state === 'gone') continue;
      if (ic.state === 'hang') {
        // Spadne, keď hráč prechádza pod ním.
        if (
          this.state === 'play' &&
          Math.abs(c.x - ic.x) < 18 &&
          c.y > ic.y &&
          c.y - ic.y < 7 * TILE
        ) {
          ic.state = 'shake';
          ic.timer = ICICLE_DELAY;
          this.events.push({ type: 'icicle', x: ic.x, y: ic.y });
        }
        continue;
      }
      if (ic.state === 'shake') {
        ic.timer -= dt;
        if (ic.timer <= 0) ic.state = 'fall';
        continue;
      }
      ic.vy = Math.min(420, ic.vy + ICICLE_GRAVITY * dt);
      ic.y += ic.vy * dt;
      const tip = ic.y + 12;
      if (
        this.state === 'play' &&
        Math.abs(c.x - ic.x) < 6 &&
        tip > this.player.y &&
        ic.y < this.player.y + PLAYER_H
      ) {
        this.die('icicle');
      }
      const tile = tileAt(this.level, Math.floor(ic.x / TILE), Math.floor(tip / TILE));
      if (isGround(tile) || tile === Tile.Water || tip > this.level.height * TILE) {
        ic.state = 'gone';
        this.events.push({ type: 'shatter', x: ic.x, y: Math.min(tip, this.level.height * TILE) });
      }
    }
  }

  private touchesThorns(): boolean {
    const p = this.player;
    const left = Math.floor((p.x + 1) / TILE);
    const right = Math.floor((p.x + PLAYER_W - 1) / TILE);
    const top = Math.floor(p.y / TILE);
    const bottom = Math.floor((p.y + PLAYER_H - 0.01) / TILE);
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (tileAt(this.level, col, row) !== Tile.Thorns) continue;
        // Tŕne zaberajú spodnú časť políčka.
        if (p.y + PLAYER_H > row * TILE + 8) return true;
      }
    }
    return false;
  }

  private inWater(): boolean {
    const c = this.center;
    const col = Math.floor(c.x / TILE);
    const row = Math.floor((c.y + 2) / TILE);
    return tileAt(this.level, col, row) === Tile.Water;
  }

  private updateCrumbles(dt: number): void {
    for (const c of this.crumbles) {
      if (c.state === 'solid') continue;
      c.timer -= dt;
      if (c.timer > 0) continue;
      if (c.state === 'shaking') {
        c.state = 'gone';
        c.timer = CRUMBLE_RESPAWN;
        this.events.push({ type: 'crumble', x: c.col * TILE + TILE / 2, y: c.row * TILE + 4 });
      } else if (!this.overlapsTileAt(c.col, c.row, this.player.x, this.player.y)) {
        c.state = 'solid';
      }
    }
  }

  private throwSpark(dt: number, input: Input): void {
    this.sparkCooldown = Math.max(0, this.sparkCooldown - dt);
    const pressed = input.spark && !this.sparkHeld;
    this.sparkHeld = input.spark;
    if (
      !pressed ||
      this.shielded ||
      this.sparkCooldown > 0 ||
      this.oil <= SPARK_OIL ||
      this.state !== 'play'
    )
      return;
    this.oil -= SPARK_OIL;
    this.sparkCooldown = SPARK_COOLDOWN;
    const lamp = this.lamp;
    this.sparks.push({
      x: lamp.x,
      y: lamp.y,
      vx: this.player.facing * SPARK_SPEED + this.player.vx * 0.3,
      life: SPARK_LIFE,
    });
    this.events.push({ type: 'throw' });
  }

  private updateSparks(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i]!;
      sp.x += sp.vx * dt;
      sp.life -= dt;
      const col = Math.floor(sp.x / TILE);
      const row = Math.floor(sp.y / TILE);
      const tile = tileAt(this.level, col, row);
      const barricade =
        tile === Tile.Barricade ? this.barricadeAt.get(row * this.level.width + col) : undefined;
      if (barricade?.state === 'solid') this.ignite(barricade);
      const nest = this.nests.find(
        (n) => n.state === 'intact' && Math.abs(n.x - sp.x) < 7 && Math.abs(n.y - sp.y) < 9,
      );
      if (nest) this.igniteNest(nest);
      const blocked =
        isGround(tile) ||
        (tile === Tile.Door && !this.openDoors.has(row * this.level.width + col)) ||
        tile === Tile.Water ||
        (barricade !== undefined && barricade.state !== 'gone') ||
        nest !== undefined ||
        (tile === Tile.Crumble &&
          this.crumbleAt.get(row * this.level.width + col)?.state !== 'gone');
      let hit = false;
      for (const s of this.shades) {
        if (!s.alive || Math.hypot(s.x - sp.x, s.y - sp.y) > (s.big ? 18 : 11)) continue;
        this.hitShade(s);
        hit = true;
      }
      // Nakazeného iskra nezabije, len ho odhodí a prepáli mu handry.
      for (const g of this.ghouls) {
        if (!g.alive || Math.abs(g.x - sp.x) > 6 || sp.y < g.y - GHOUL_H - 2 || sp.y > g.y + 2)
          continue;
        this.knockGhoul(g, Math.sign(sp.vx), 0.25, CANE_KNOCK * 0.6);
        hit = true;
      }
      if (blocked || hit || sp.life <= 0) {
        this.sparks.splice(i, 1);
        if (!hit) {
          this.events.push({ type: 'fizzle', x: sp.x, y: sp.y });
          this.noises.push({ x: sp.x, y: sp.y });
        }
      }
    }
  }

  private killShade(s: Shade): void {
    s.alive = false;
    this.events.push({ type: 'shadeDie', x: s.x, y: s.y });
  }

  /** Zásah (skok na hlavu, iskra): veľký tieň vydrží viac, potom zmizne. */
  private hitShade(s: Shade): void {
    s.hits--;
    if (s.hits <= 0) {
      this.killShade(s);
      return;
    }
    this.events.push({ type: 'shadeHit', x: s.x, y: s.y });
    this.recoil(s);
    s.timer = 1.4;
  }

  /** Potkany: kým svietiš, držia sa na okraji svetla; v tme alebo pri ukrytej fakli zaútočia. */
  private updateRats(dt: number): void {
    const p = this.player;
    const alive = this.state === 'play';
    const pcx = p.x + PLAYER_W / 2;
    const pFeet = p.y + PLAYER_H;
    const lamp = this.lamp;
    const fear = Math.max(0, this.radius - RAT_DARE);
    for (const r of this.rats) {
      if (!r.alive) continue;
      // Rozžiarená fakľa ich spáli.
      r.burning =
        alive && this.flaring && Math.hypot(lamp.x - r.x, lamp.y - (r.y - 2)) < this.radius * 0.9;
      if (r.burning) {
        r.hp -= dt * 4;
        if (r.hp <= 0) {
          this.killRat(r);
          continue;
        }
      } else r.hp = Math.min(1, r.hp + dt * 0.5);
      const engaged = alive && Math.abs(pFeet - r.y) < 20 && Math.abs(pcx - r.x) < RAT_SIGHT;
      const wasFleeing = r.fleeing;
      r.fleeing = false;
      let want: number;
      if (engaged && (this.shielded || this.oil <= 0)) {
        // Fakľa je ukrytá alebo dohorela: potkany sa vrhnú na hráča.
        want = Math.sign(pcx - r.x) * RAT_RUN;
      } else if (engaged) {
        const fromLamp = Math.abs(lamp.x - r.x);
        if (fromLamp < fear) {
          want = Math.sign(r.x - lamp.x || r.dir) * RAT_FLEE;
          r.fleeing = true;
        } else if (fromLamp > fear + 5) want = Math.sign(pcx - r.x) * RAT_RUN;
        else want = Math.sin(this.time * 9 + r.step) * 25;
      } else {
        if (Math.abs(r.x - r.home.x) > 22) r.dir = r.x > r.home.x ? -1 : 1;
        want = r.dir * RAT_WANDER;
      }
      if (r.fleeing && !wasFleeing && this.rng.next() < 0.3)
        this.events.push({ type: 'squeak', x: r.x, y: r.y });
      if (want !== 0) r.dir = want > 0 ? 1 : -1;
      r.vx = approach(r.vx, want, 600 * dt);
      const nx = r.x + r.vx * dt;
      if (this.walkerBlocked(nx, r.y, Math.sign(r.vx), RAT_W, RAT_H)) {
        r.vx = 0;
        if (!engaged) r.dir = r.dir > 0 ? -1 : 1;
      } else r.x = nx;
      r.step += Math.abs(r.vx) * dt;
      // Uhryznutie: len keď stojíš pri nich na zemi (preskočiť sa dajú).
      if (
        alive &&
        Math.abs(r.x - pcx) < (RAT_W + PLAYER_W) / 2 - 1 &&
        pFeet > r.y - RAT_H &&
        pFeet < r.y + 3
      )
        this.die('rats');
    }
  }

  private killRat(r: Rat): void {
    r.alive = false;
    this.events.push({ type: 'ratDie', x: r.x, y: r.y - 2 });
  }

  /** Prvá pevná plocha pod bodom (y chodidiel), alebo null nad priepasťou. */
  private floorBelow(pt: Point): number | null {
    const col = Math.floor(pt.x / TILE);
    for (let row = Math.floor(pt.y / TILE); row < this.level.height; row++) {
      const t = tileAt(this.level, col, row + 1);
      if (isGround(t) || t === Tile.Ledge || t === Tile.Crumble) return (row + 1) * TILE;
      if (t === Tile.Water || t === Tile.Thorns) return null;
    }
    return null;
  }

  private updateShades(dt: number): void {
    const c = this.center;
    const lights = this.lights();
    const playerLight = this.state === 'dead' ? 0 : this.radius;
    for (const s of this.shades) {
      if (!s.alive) continue;
      const dx = c.x - s.x;
      const dy = c.y - s.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (!s.active) {
        s.active = dist < 220 && this.state === 'play';
        s.timer -= dt;
        s.x = s.home.x + Math.sin(this.time * 1.3 + s.angle) * 6;
        s.y = s.home.y + Math.cos(this.time * 0.9 + s.angle) * 4;
        continue;
      }

      // Svetlo: rozžiarený lampáš a lampy tiene spaľujú.
      s.burning = false;
      for (const [i, l] of lights.entries()) {
        const d = Math.hypot(l.x - s.x, l.y - s.y);
        // Prvé svetlo je lampáš hráča: spaľuje len rozžiarený.
        const isPlayer = i === 0 && this.state !== 'dead';
        const burns = isPlayer ? this.flaring && d < l.radius * 0.9 : d < l.radius * 0.8;
        if (!burns) continue;
        s.burning = true;
        s.hp -= dt * (s.big ? 0.9 : 2.6);
        // Ustupuje od svetla.
        const away = Math.hypot(s.x - l.x, s.y - l.y) || 1;
        s.vx += ((s.x - l.x) / away) * 260 * dt;
        s.vy += ((s.y - l.y) / away) * 260 * dt;
      }
      if (s.hp <= 0) {
        this.killShade(s);
        continue;
      }
      if (!s.burning) s.hp = Math.min(1, s.hp + dt * 0.3);

      const reach = Math.max(32, playerLight) + 14;
      s.timer -= dt;
      if (s.state === 'stalk') {
        // Krúži na okraji svetla a čaká na príležitosť.
        const current = Math.atan2(s.y - c.y, s.x - c.x);
        s.angle = current + dt * 0.6;
        const tx = c.x + Math.cos(s.angle) * reach;
        const ty = c.y + Math.sin(s.angle) * reach * 0.8;
        steer(s, tx, ty, 48, dt);
        // Kým je fakľa pod plášťom, prízrak stratí stopu a nezaútočí.
        if (s.timer <= 0 && dist < reach + 70 && this.state === 'play' && !this.shielded) {
          s.state = 'windup';
          s.timer = WINDUP;
          this.events.push({ type: 'windup' });
        }
      } else if (s.state === 'windup') {
        // Zastaví sa a zachveje; smer výpadu si zvolí až na konci.
        s.vx *= Math.exp(-dt * 10);
        s.vy *= Math.exp(-dt * 10);
        if (s.timer <= 0) {
          s.state = 'lunge';
          s.timer = 0.7;
          s.dirX = dx / dist;
          s.dirY = dy / dist;
          this.events.push({ type: 'lunge' });
        }
      } else if (s.state === 'lunge') {
        const speed = s.burning ? 70 : 135;
        s.vx = s.dirX * speed;
        s.vy = s.dirY * speed;
        if (dist < (s.big ? 15 : 9) && this.state === 'play') this.die('shade');
        else if (s.timer <= 0) this.recoil(s);
      } else {
        steer(s, s.x - dx, s.y - dy, 64, dt);
        if (s.timer <= 0) {
          s.state = 'stalk';
          // V úplnej tme sú tiene odvážnejšie.
          s.timer = this.oil > 0 ? 2.4 + this.rng.next() * 2.2 : 0.8 + this.rng.next();
        }
      }
      // Odpor vzduchu.
      const drag = Math.exp(-dt * 3);
      if (s.state === 'stalk' || s.state === 'recoil') {
        s.vx *= drag;
        s.vy *= drag;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
  }

  private recoil(s: Shade): void {
    s.state = 'recoil';
    s.timer = 0.8;
  }

  /** Nakazení: chodia sem a tam, keď zbadajú fakľu, idú po hráčovi; z hrany nespadnú. */
  private updateGhouls(dt: number): void {
    const p = this.player;
    const alive = this.state === 'play';
    const pcx = p.x + PLAYER_W / 2;
    const pFeet = p.y + PLAYER_H;
    // Čo nakazených priláka: rozžiarená fakľa zďaleka, zhasnutá iskra a horiace barikády.
    const calls: { x: number; y: number; r: number; t: number }[] = [];
    if (alive && this.flaring) calls.push({ x: pcx, y: pFeet - 8, r: FLARE_CALL, t: 4 });
    for (const n of this.noises) calls.push({ ...n, r: SPARK_CALL, t: 3 });
    for (const b of this.barricades)
      if (b.state === 'burning')
        calls.push({ x: b.col * TILE + TILE / 2, y: b.row * TILE + 8, r: FIRE_CALL, t: 1.5 });
    for (const n of this.nests)
      if (n.state === 'burning') calls.push({ x: n.x, y: n.y, r: FIRE_CALL, t: 1.5 });
    this.noises = [];
    for (const g of this.ghouls) {
      if (!g.alive) continue;
      const dx = pcx - g.x;
      const sameFloor = Math.abs(pFeet - g.y) < 26;
      // Svetlo ťa prezrádza: čím väčší plameň, tým zďaleka ťa vidia. Fakľu pod plášťom
      // nevidia vôbec; zbadajú hráča, až keď do nich takmer narazí.
      const sight = this.shielded ? 18 : this.radius * GHOUL_SIGHT_PER_RADIUS + GHOUL_SIGHT;
      const sees = alive && sameFloor && Math.abs(dx) < sight;
      if (sees && !g.chasing) this.events.push({ type: 'ghoulNotice', x: g.x, y: g.y - GHOUL_H });
      g.chasing = sees;
      g.lureTime = Math.max(0, g.lureTime - dt);
      // Po údere zvonu idú nakazení za hráčom; ukrytú fakľu nesledujú (idú na staré miesto).
      if (this.frenzy > 0 && g.lureTime > 0 && alive && !this.shielded) g.lure = pcx;
      if (!sees)
        for (const c of calls) {
          if (Math.hypot(c.x - g.x, c.y - (g.y - 8)) > c.r) continue;
          if (g.lureTime <= 0) this.events.push({ type: 'ghoulNotice', x: g.x, y: g.y - GHOUL_H });
          g.lure = c.x;
          g.lureTime = Math.max(g.lureTime, c.t);
        }

      // Rozžiarená fakľa ich páli a zaháňa.
      const lamp = this.lamp;
      g.burning =
        alive && this.flaring && Math.hypot(lamp.x - g.x, lamp.y - (g.y - 7)) < this.radius * 0.9;
      if (g.burning) {
        g.hp -= dt * 1.7;
        if (g.hp <= 0) {
          this.killGhoul(g);
          continue;
        }
      } else g.hp = Math.min(1, g.hp + dt * 0.03);

      const toLure = g.lure - g.x;
      if (g.knock > 0) {
        this.slideGhoul(g, dt);
        continue;
      }
      const want = g.burning
        ? -Math.sign(dx || 1) * GHOUL_CHASE * 0.6
        : g.chasing
          ? Math.sign(dx) * GHOUL_CHASE
          : g.lureTime > 0
            ? Math.abs(toLure) > 3
              ? Math.sign(toLure) * GHOUL_CHASE * (this.frenzy > 0 ? 1 : GHOUL_LURE)
              : 0
            : g.dir * GHOUL_WALK;
      if (want !== 0 && !g.burning) g.dir = want > 0 ? 1 : -1;
      g.vx = approach(g.vx, want, 260 * dt);
      const nx = g.x + g.vx * dt;
      if (this.walkerBlocked(nx, g.y, Math.sign(g.vx), GHOUL_W, GHOUL_H)) {
        g.vx = 0;
        if (!g.chasing && g.lureTime <= 0) g.dir = g.dir > 0 ? -1 : 1;
      } else g.x = nx;
      g.step += Math.abs(g.vx) * dt;

      if (
        alive &&
        Math.abs(g.x - pcx) < (GHOUL_W + PLAYER_W) / 2 - 1 &&
        pFeet > g.y - GHOUL_H + 2 &&
        p.y < g.y
      )
        this.die('ghoul');
    }
  }

  /** Stena, priepasť, hroty alebo žumpa pred nakazeným či potkanom. */
  private walkerBlocked(x: number, feet: number, dir: number, w: number, h: number): boolean {
    if (dir === 0) return false;
    const col = Math.floor((x + dir * (w / 2)) / TILE);
    const row = Math.floor((feet - 1) / TILE);
    const level = this.level;
    const body = [row, Math.floor((feet - h + 1) / TILE)];
    const wall = (r: number) => {
      const t = tileAt(level, col, r);
      if (t === Tile.Barricade)
        return this.barricadeAt.get(r * level.width + col)?.state !== 'gone';
      if (t === Tile.Door) return !this.openDoors.has(r * level.width + col);
      return isGround(t) || t === Tile.Crumble;
    };
    if (body.some(wall)) return true;
    if (
      body.some(
        (r) => tileAt(level, col, r) === Tile.Thorns || tileAt(level, col, r) === Tile.Water,
      )
    )
      return true;
    const below = tileAt(level, col, row + 1);
    return !(isGround(below) || below === Tile.Ledge || below === Tile.Crumble);
  }

  /** Úder palicou (alebo iskra): ubere sily a odhodí nakazeného. */
  private knockGhoul(g: Ghoul, dir: number, damage: number, speed: number): void {
    g.hp -= damage;
    if (g.hp <= 0.1) {
      this.killGhoul(g);
      return;
    }
    g.knock = KNOCK_TIME;
    g.vx = dir * speed;
    g.dir = dir > 0 ? -1 : 1;
  }

  /** Odpálený nakazený kĺže dozadu; nad priepasťou, hrotmi či žumpou spadne a zahynie. */
  private slideGhoul(g: Ghoul, dt: number): void {
    g.knock -= dt;
    g.vx = approach(g.vx, 0, 320 * dt);
    const nx = g.x + g.vx * dt;
    const level = this.level;
    const front = Math.floor((nx + Math.sign(g.vx) * (GHOUL_W / 2)) / TILE);
    const rows = [Math.floor((g.y - 1) / TILE), Math.floor((g.y - GHOUL_H + 1) / TILE)];
    const wall = rows.some((r) => {
      const t = tileAt(level, front, r);
      if (t === Tile.Barricade)
        return this.barricadeAt.get(r * level.width + front)?.state !== 'gone';
      if (t === Tile.Door) return !this.openDoors.has(r * level.width + front);
      return isGround(t) || t === Tile.Crumble;
    });
    if (wall) g.vx = 0;
    else g.x = nx;
    const col = Math.floor(g.x / TILE);
    const row = Math.floor((g.y + 1) / TILE);
    const below = tileAt(level, col, row);
    const inside = tileAt(level, col, row - 1);
    if (inside === Tile.Thorns || inside === Tile.Water || below === Tile.Water) this.killGhoul(g);
    else if (!(isGround(below) || below === Tile.Ledge || below === Tile.Crumble))
      this.killGhoul(g);
  }

  /** Palica: švih pred seba zasiahne nakazených, potkany aj prízraky. */
  private swingCane(dt: number, input: Input): void {
    this.swingCooldown = Math.max(0, this.swingCooldown - dt);
    const pressed = input.cane && !this.caneHeld;
    this.caneHeld = input.cane;
    if (this.swing >= 0) {
      this.swing += dt;
      if (this.swing >= CANE_TIME) this.swing = -1;
    }
    if (pressed && this.swing < 0 && this.swingCooldown <= 0 && this.state === 'play') {
      this.swing = 0;
      this.swingCooldown = CANE_COOLDOWN;
      this.swingHits.clear();
      this.events.push({ type: 'swing' });
    }
    if (this.swing < CANE_HIT_FROM || this.swing > CANE_HIT_TO || this.state !== 'play') return;
    const p = this.player;
    const dir = p.facing;
    const cx = p.x + PLAYER_W / 2;
    const top = p.y - 4;
    const bottom = p.y + PLAYER_H + 2;
    const inReach = (x: number, y0: number, y1: number, w: number) => {
      const rel = (x - cx) * dir;
      return rel > -w / 2 && rel < CANE_REACH + w / 2 && y1 > top && y0 < bottom;
    };
    for (const g of this.ghouls) {
      if (!g.alive || this.swingHits.has(g) || !inReach(g.x, g.y - GHOUL_H, g.y, GHOUL_W)) continue;
      this.swingHits.add(g);
      this.events.push({ type: 'caneHit', x: g.x, y: g.y - GHOUL_H / 2 });
      this.knockGhoul(g, dir, this.perks.cane > 0 ? 1 : CANE_DAMAGE, CANE_KNOCK);
    }
    for (const r of this.rats) {
      if (!r.alive || !inReach(r.x, r.y - RAT_H, r.y, RAT_W)) continue;
      this.events.push({ type: 'caneHit', x: r.x, y: r.y - 2 });
      this.killRat(r);
    }
    for (const s of this.shades) {
      const size = s.big ? 8 : 5;
      if (!s.alive || this.swingHits.has(s) || !inReach(s.x, s.y - size, s.y + size, size * 2))
        continue;
      this.swingHits.add(s);
      this.events.push({ type: 'caneHit', x: s.x, y: s.y });
      this.hitShade(s);
      s.vx += dir * 120;
    }
  }

  private killGhoul(g: Ghoul): void {
    g.alive = false;
    this.events.push({ type: 'ghoulDie', x: g.x, y: g.y - GHOUL_H / 2 });
  }

  private collect(): void {
    const c = this.center;
    const near = (pt: Point, r: number) => Math.hypot(pt.x - c.x, pt.y - c.y) < r;
    for (const f of this.fireflies) {
      if (f.taken || !near(f, 13)) continue;
      f.taken = true;
      this.embersSinceCheckpoint.push(f);
      this.oil = Math.min(OIL_MAX, this.oil + FIREFLY_OIL);
      this.events.push({ type: 'firefly', x: f.x, y: f.y });
    }
    for (const hb of this.herbs) {
      if (hb.taken || !near(hb, 13)) continue;
      // Plnú brašňu nechá ležať.
      if (this.herbsCarried >= HERB_MAX) continue;
      hb.taken = true;
      this.herbsCarried++;
      this.events.push({ type: 'herb', x: hb.x, y: hb.y });
    }
    for (const k of this.keys) {
      if (k.taken || !near(k, 13)) continue;
      k.taken = true;
      this.keysCarried++;
      this.events.push({ type: 'key', x: k.x, y: k.y });
    }
    for (const coin of this.coins) {
      if (coin.taken || !near(coin, 12)) continue;
      coin.taken = true;
      this.events.push({ type: 'coin', x: coin.x, y: coin.y });
    }
    for (const k of this.crystals) {
      if (k.taken || !near(k, 13)) continue;
      k.taken = true;
      this.events.push({ type: 'crystal', x: k.x, y: k.y });
    }
    for (const l of this.lanterns) {
      if (l.lit || Math.abs(l.x - c.x) > 12 || Math.abs(l.y + 10 - c.y) > 22) continue;
      l.lit = true;
      this.checkpoint = { x: l.x, y: l.y };
      this.embersSinceCheckpoint = [];
      this.oil = OIL_MAX;
      this.events.push({ type: 'lantern', x: l.x, y: l.y });
    }
    const exit = this.level.exit;
    const atExit = Math.abs(exit.x - c.x) < 14 && Math.abs(exit.y - c.y) < 40;
    // Hranica sa zapáli, až keď sú všetky morové hniezda v štvrti spálené.
    const left = this.nests.filter((n) => n.state === 'intact').length;
    if (atExit && left > 0) {
      if (!this.atGate) this.events.push({ type: 'gateLocked', left });
      this.atGate = true;
    } else if (!atExit) this.atGate = false;
    if (atExit && left === 0) {
      this.exitLit = true;
      this.state = 'done';
      this.player.vx = 0;
      this.events.push({ type: 'exit' });
    }
    const plea = this.nearSurvivor;
    this.sign = plea
      ? {
          x: plea.x,
          y: plea.y,
          hint: this.herbsCarried > 0 ? 'hintSurvivor' : 'hintSurvivorNoHerb',
        }
      : (this.level.signs.find((s) => near(s, 28)) ?? null);
  }

  private die(cause: DeathCause): void {
    if (this.state !== 'play') return;
    this.state = 'dead';
    this.deaths++;
    this.deadTimer = RESPAWN_DELAY;
    this.flaring = false;
    this.events.push({ type: 'died', cause });
  }

  private respawn(): void {
    for (const f of this.embersSinceCheckpoint) f.taken = false;
    this.embersSinceCheckpoint = [];
    this.state = 'play';
    this.placePlayer(this.checkpoint);
    this.oil = OIL_MAX;
    this.radius = LIGHT_RADIUS;
    this.dread = 0;
    this.infection = 0;
    this.frenzy = 0;
    // Po smrti dostane hráč pokoj: zvon udrie až po celej perióde.
    this.nextBell = Math.max(this.nextBell, this.time + BELL_PERIOD * 0.6);
    this.fog.set(this.fogHome);
    this.sparks.length = 0;
    this.swing = -1;
    this.onMover = -1;
    for (const ic of this.icicles) {
      ic.x = ic.home.x;
      ic.y = ic.home.y;
      ic.vy = 0;
      ic.state = 'hang';
    }
    this.noises = [];
    for (const r of this.rats) {
      r.x = r.home.x;
      r.vx = 0;
      r.hp = 1;
    }
    for (const g of this.ghouls) {
      g.x = g.home.x;
      g.y = g.home.y;
      g.vx = 0;
      g.dir = -1;
      g.chasing = false;
      g.lureTime = 0;
      g.knock = 0;
      g.hp = 1;
    }
    for (const s of this.shades) {
      if (!s.alive) continue;
      s.x = s.home.x;
      s.y = s.home.y;
      s.vx = s.vy = 0;
      s.active = false;
      s.state = 'stalk';
      s.timer = 2 + this.rng.next() * 2;
    }
    this.events.push({ type: 'respawn' });
  }

  private placePlayer(at: Point): void {
    const p = this.player;
    p.x = at.x - PLAYER_W / 2;
    p.y = at.y + TILE / 2 - PLAYER_H;
    p.vx = p.vy = 0;
    p.onGround = false;
    p.invulnerable = 0;
    p.facing = 1;
  }
}

/** Polomer svetla podľa oleja: plný do štvrtiny, potom sa zmenšuje. */
export function baseRadius(oil: number): number {
  if (oil <= 0) return EMBER_RADIUS;
  const f = oil / OIL_MAX;
  if (f >= 0.25) return LIGHT_RADIUS;
  return 34 + (LIGHT_RADIUS - 34) * (f / 0.25);
}

function approach(value: number, target: number, delta: number): number {
  return value < target ? Math.min(target, value + delta) : Math.max(target, value - delta);
}

function steer(s: Shade, tx: number, ty: number, speed: number, dt: number): void {
  const dx = tx - s.x;
  const dy = ty - s.y;
  const d = Math.hypot(dx, dy) || 1;
  const want = Math.min(speed, d * 3);
  s.vx += ((dx / d) * want - s.vx) * Math.min(1, dt * 4);
  s.vy += ((dy / d) * want - s.vy) * Math.min(1, dt * 4);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
