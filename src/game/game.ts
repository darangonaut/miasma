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

export interface Input {
  left: boolean;
  right: boolean;
  down: boolean;
  jump: boolean;
  flare: boolean;
  /** Hod iskry. */
  spark: boolean;
}

export const NO_INPUT: Input = {
  left: false,
  right: false,
  down: false,
  jump: false,
  flare: false,
  spark: false,
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
export const OIL_DRAIN = 3;
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
const STOMP_BOUNCE = 210;
/** Koľko oleja za sekundu vypije jedna mora prisatá k lampášu. */
export const MOTH_DRAIN = 7;
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
/** Ako ďaleko (px) zbadajú fakľu navyše k jej polomeru. */
const GHOUL_SIGHT = 64;
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
  | { type: 'mothDie'; x: number; y: number }
  | { type: 'stomp'; x: number; y: number }
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
  | { type: 'gust'; dir: number }
  | { type: 'lightning' }
  | { type: 'died'; cause: DeathCause }
  | { type: 'respawn' }
  | { type: 'exit' };

export type DeathCause = 'thorns' | 'fall' | 'dark' | 'water' | 'icicle' | 'shade' | 'ghoul';

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

/** Mora: letí za svetlom a pije olej z lampáša. */
export interface Moth {
  x: number;
  y: number;
  home: Point;
  vx: number;
  vy: number;
  alive: boolean;
  /** Prisatá k lampášu (pije olej). */
  drinking: boolean;
  phase: number;
  hp: number;
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
  readonly moths: Moth[];
  readonly ghouls: Ghoul[];
  readonly sparks: Spark[] = [];
  readonly crumbles: Crumble[] = [];
  private crumbleAt = new Map<number, Crumble>();
  readonly icicles: Icicle[];
  readonly movers: Mover[];
  /** Index plošiny, na ktorej hráč stojí (−1 = žiadna). */
  onMover = -1;
  /** Hráč stojí na ľade. */
  onIce = false;
  private sparkCooldown = 0;
  private sparkHeld = false;
  exitLit = false;
  /** Tabuľa, pri ktorej hráč stojí (rada na obrazovke). */
  sign: Sign | null = null;
  private checkpoint: Point;
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
  private events: GameEvent[] = [];

  constructor(readonly level: Level) {
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
    this.moths = level.moths.map((p) => ({
      x: p.x,
      y: p.y,
      home: { ...p },
      vx: 0,
      vy: 0,
      alive: true,
      drinking: false,
      phase: this.rng.next() * Math.PI * 2,
      hp: 1,
    }));
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
      };
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
      this.updateMoths(dt);
      this.updateGhouls(dt);
      this.updateSparks(dt);
      this.updateCrumbles(dt);
      this.updateMovers();
      this.updateIcicles(dt);
      return this.events;
    }
    this.updateWeather(dt);
    this.updateLight(dt, input);
    this.updateCrumbles(dt);
    this.updateMovers();
    this.updatePlayer(dt, input);
    this.updateIcicles(dt);
    this.throwSpark(dt, input);
    this.updateSparks(dt);
    if (this.state === 'play') this.updateShades(dt);
    if (this.state === 'play') this.updateMoths(dt);
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
    const wantsFlare = input.flare && this.oil > 0;
    if (wantsFlare && !this.flareHeld) this.events.push({ type: 'flare' });
    this.flareHeld = wantsFlare;
    this.flaring = wantsFlare;
    this.oil = Math.max(0, this.oil - (wantsFlare ? FLARE_DRAIN : OIL_DRAIN) * dt);
    const target = this.flaring ? FLARE_RADIUS : baseRadius(this.oil);
    this.radius += (target - this.radius) * Math.min(1, dt * (this.flaring ? 10 : 4));
    if (this.oil <= 0) {
      this.dread += dt;
      if (this.dread >= DREAD_LIMIT) this.die('dark');
    } else {
      this.dread = Math.max(0, this.dread - dt * 3);
    }
  }

  private updatePlayer(dt: number, input: Input): void {
    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const ice = p.onGround && this.onIce;
    if (move !== 0) {
      p.facing = move > 0 ? 1 : -1;
      const accel = ice ? ICE_ACCEL : p.onGround ? GROUND_ACCEL : AIR_ACCEL;
      p.vx = approach(p.vx, move * RUN_SPEED, accel * dt);
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
    this.moveX((p.vx + drift) * dt, lights);
    const wasOnGround = p.onGround;
    this.moveY(p.vy * dt, lights, input.down);
    this.landOnMovers();
    if (p.onGround && !wasOnGround) this.events.push({ type: 'land' });
    this.onIce = p.onGround && this.onMover < 0 && this.groundBelow() === Tile.Ice;
    if (p.onGround && this.onMover < 0 && this.groundBelow() === Tile.Bounce) this.bounce();

    if (this.touchesThorns()) this.die('thorns');
    else if (this.inWater()) this.die('water');
    else if (p.y > this.level.height * TILE + 48) this.die('fall');
  }

  /** Pevné políčko pre pohyb; svetelné plošiny, v ktorých hráč už stojí, ho nezaseknú. */
  private solid(col: number, row: number, lights: LightSource[], overlapping: boolean): boolean {
    const tile = tileAt(this.level, col, row);
    if (isGround(tile)) return true;
    if (tile === Tile.Crumble)
      return this.crumbleAt.get(row * this.level.width + col)?.state !== 'gone';
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
    if (!pressed || this.sparkCooldown > 0 || this.oil <= SPARK_OIL || this.state !== 'play')
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
      const blocked =
        isGround(tile) ||
        tile === Tile.Water ||
        (tile === Tile.Crumble &&
          this.crumbleAt.get(row * this.level.width + col)?.state !== 'gone');
      let hit = false;
      for (const s of this.shades) {
        if (!s.alive || Math.hypot(s.x - sp.x, s.y - sp.y) > (s.big ? 18 : 11)) continue;
        this.hitShade(s);
        hit = true;
      }
      for (const m of this.moths) {
        if (!m.alive || Math.hypot(m.x - sp.x, m.y - sp.y) > 9) continue;
        this.killMoth(m);
        hit = true;
      }
      for (const g of this.ghouls) {
        if (!g.alive || Math.abs(g.x - sp.x) > 6 || sp.y < g.y - GHOUL_H - 2 || sp.y > g.y + 2)
          continue;
        this.killGhoul(g);
        hit = true;
      }
      if (blocked || hit || sp.life <= 0) {
        this.sparks.splice(i, 1);
        if (!hit) this.events.push({ type: 'fizzle', x: sp.x, y: sp.y });
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

  private killMoth(m: Moth): void {
    m.alive = false;
    m.drinking = false;
    this.events.push({ type: 'mothDie', x: m.x, y: m.y });
  }

  /** Skok na hlavu: padajúci hráč tieň rozplynie a odrazí sa. */
  private tryStomp(s: Shade): boolean {
    const p = this.player;
    if (this.state !== 'play' || p.vy <= 0) return false;
    const feet = p.y + PLAYER_H;
    const size = s.big ? 1.8 : 1;
    if (Math.abs(p.x + PLAYER_W / 2 - s.x) > 10 * size || feet < s.y - 9 * size || feet > s.y + 4)
      return false;
    this.hitShade(s);
    p.vy = -(this.jumpHeld ? JUMP_SPEED : STOMP_BOUNCE);
    p.onGround = false;
    this.events.push({ type: 'stomp', x: s.x, y: s.y });
    return true;
  }

  private updateMoths(dt: number): void {
    const lamp = this.lamp;
    const alive = this.state === 'play';
    for (const m of this.moths) {
      if (!m.alive) continue;
      m.phase += dt * 9;
      const dx = lamp.x - m.x;
      const dy = lamp.y - m.y;
      const dist = Math.hypot(dx, dy) || 1;
      const attracted = alive && dist < this.radius * 1.5 + 30;
      // Rozžiarený lampáš mory spáli.
      if (alive && this.flaring && dist < this.radius * 0.9) {
        m.hp -= dt * 4;
        if (m.hp <= 0) {
          this.killMoth(m);
          continue;
        }
      }
      let tx = m.home.x + Math.sin(m.phase * 0.2) * 10;
      let ty = m.home.y + Math.cos(m.phase * 0.27) * 6;
      if (attracted) {
        // Krúži tesne okolo plameňa.
        tx = lamp.x + Math.cos(m.phase * 0.5) * 7;
        ty = lamp.y + Math.sin(m.phase * 0.7) * 5;
      }
      const speed = attracted ? 60 : 24;
      const ddx = tx - m.x;
      const ddy = ty - m.y;
      const d = Math.hypot(ddx, ddy) || 1;
      m.vx += ((ddx / d) * Math.min(speed, d * 4) - m.vx) * Math.min(1, dt * 5);
      m.vy += ((ddy / d) * Math.min(speed, d * 4) - m.vy) * Math.min(1, dt * 5);
      // Trepotanie krídel.
      m.x += m.vx * dt + Math.sin(m.phase * 1.7) * 0.4;
      m.y += m.vy * dt + Math.cos(m.phase * 2.3) * 0.4;
      m.drinking = alive && dist < 14;
      if (m.drinking) this.oil = Math.max(0, this.oil - MOTH_DRAIN * dt);
    }
  }

  private updateShades(dt: number): void {
    const c = this.center;
    const lights = this.lights();
    const playerLight = this.state === 'dead' ? 0 : this.radius;
    for (const s of this.shades) {
      if (!s.alive || this.tryStomp(s)) continue;
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
        if (s.timer <= 0 && dist < reach + 70 && this.state === 'play') {
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
    for (const g of this.ghouls) {
      if (!g.alive) continue;
      if (alive && this.tryStompGhoul(g)) continue;
      const dx = pcx - g.x;
      const sameFloor = Math.abs(pFeet - g.y) < 26;
      const sees = alive && sameFloor && Math.abs(dx) < this.radius + GHOUL_SIGHT;
      if (sees && !g.chasing) this.events.push({ type: 'ghoulNotice', x: g.x, y: g.y - GHOUL_H });
      g.chasing = sees;

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
      } else g.hp = Math.min(1, g.hp + dt * 0.25);

      const want = g.burning
        ? -Math.sign(dx || 1) * GHOUL_CHASE * 0.6
        : g.chasing
          ? Math.sign(dx) * GHOUL_CHASE
          : g.dir * GHOUL_WALK;
      if (want !== 0 && !g.burning) g.dir = want > 0 ? 1 : -1;
      g.vx = approach(g.vx, want, 260 * dt);
      const nx = g.x + g.vx * dt;
      if (this.ghoulBlocked(nx, g.y, Math.sign(g.vx))) {
        g.vx = 0;
        if (!g.chasing) g.dir = g.dir > 0 ? -1 : 1;
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

  /** Stena, priepasť, hroty alebo žumpa pred nakazeným. */
  private ghoulBlocked(x: number, feet: number, dir: number): boolean {
    if (dir === 0) return false;
    const col = Math.floor((x + dir * (GHOUL_W / 2)) / TILE);
    const row = Math.floor((feet - 1) / TILE);
    const level = this.level;
    const body = [row, Math.floor((feet - GHOUL_H + 1) / TILE)];
    if (body.some((r) => isGround(tileAt(level, col, r)) || tileAt(level, col, r) === Tile.Crumble))
      return true;
    if (
      body.some(
        (r) => tileAt(level, col, r) === Tile.Thorns || tileAt(level, col, r) === Tile.Water,
      )
    )
      return true;
    const below = tileAt(level, col, row + 1);
    return !(isGround(below) || below === Tile.Ledge || below === Tile.Crumble);
  }

  private tryStompGhoul(g: Ghoul): boolean {
    const p = this.player;
    if (p.vy <= 0) return false;
    const feet = p.y + PLAYER_H;
    const top = g.y - GHOUL_H;
    if (Math.abs(p.x + PLAYER_W / 2 - g.x) > 8 || feet < top - 2 || feet > top + 6) return false;
    this.killGhoul(g);
    p.vy = -(this.jumpHeld ? JUMP_SPEED : STOMP_BOUNCE);
    p.onGround = false;
    this.events.push({ type: 'stomp', x: g.x, y: top });
    return true;
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
      this.oil = Math.min(OIL_MAX, this.oil + FIREFLY_OIL);
      this.events.push({ type: 'firefly', x: f.x, y: f.y });
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
      this.oil = OIL_MAX;
      this.events.push({ type: 'lantern', x: l.x, y: l.y });
    }
    const exit = this.level.exit;
    if (Math.abs(exit.x - c.x) < 14 && Math.abs(exit.y - c.y) < 40) {
      this.exitLit = true;
      this.state = 'done';
      this.player.vx = 0;
      this.events.push({ type: 'exit' });
    }
    this.sign = this.level.signs.find((s) => near(s, 28)) ?? null;
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
    this.state = 'play';
    this.placePlayer(this.checkpoint);
    this.oil = OIL_MAX;
    this.radius = LIGHT_RADIUS;
    this.dread = 0;
    this.sparks.length = 0;
    this.onMover = -1;
    for (const ic of this.icicles) {
      ic.x = ic.home.x;
      ic.y = ic.home.y;
      ic.vy = 0;
      ic.state = 'hang';
    }
    for (const m of this.moths) {
      m.x = m.home.x;
      m.y = m.home.y;
      m.vx = m.vy = 0;
      m.drinking = false;
    }
    for (const g of this.ghouls) {
      g.x = g.home.x;
      g.y = g.home.y;
      g.vx = 0;
      g.dir = -1;
      g.chasing = false;
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
