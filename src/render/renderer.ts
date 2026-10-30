import {
  Application,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
  Texture,
  TilingSprite,
} from 'pixi.js';
import {
  BARRICADE_LIGHT,
  CANE_TIME,
  FLARE_RADIUS,
  GHOUL_H,
  LANTERN_RADIUS,
  SPARK_RADIUS,
  PLAYER_H,
  PLAYER_W,
  type Game,
  type GameEvent,
  type LightSource,
} from '@/game/game';
import { TILE, Tile, isGround, tileAt, type World } from '@/game/level';
import type { WorldInfo } from './art';
import { C, PLAYER_FRAMES, decorOf, lightCanvas, type PlayerFrame } from './common';
import { vectorArt as art } from './vector';
import { Woodcut } from './woodcut';

interface Particle {
  sprite: Sprite;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  age: number;
  fade: boolean;
  /** Počiatočná priehľadnosť (blednutím klesá k nule). */
  alpha: number;
  /** Dážď a prúdy vetra: bez odporu vzduchu, natočené v smere letu. */
  streak?: boolean;
}

const WARM = 0xffa848;
/** Svetelný prechod je mäkký: plné svetlo siaha zhruba po herný polomer. */
const LIGHT_SCALE = 2.7;

/** PixiJS zobrazenie: les, postavy, tma so svetlami, častice. */
export class Renderer {
  readonly app = new Application();
  private bg = new Container();
  private world = new Container();
  private sky!: TilingSprite;
  private moon!: Sprite;
  /** Záblesk blesku na oblohe (kopce a stromy pred ním ostanú siluetou). */
  private skyFlash = new Graphics();
  private hills!: TilingSprite;
  private trees!: TilingSprite;
  private level = new Container();
  private lightTiles: { sprite: Sprite; col: number; row: number }[] = [];
  private actors = new Container();
  private particlesBelow = new Container();
  private darkSprite!: Sprite;
  private dark!: RenderTexture;
  private darkFill = new Graphics();
  private lightRoot = new Container();
  private lightLayer = new Container();
  private lightPool: Sprite[] = [];
  private above = new Container();
  private glow = new Container();
  private glowPool: Sprite[] = [];
  private particlesAbove = new Container();
  private particles: Particle[] = [];
  private zoom = 4;
  private viewW = 0;
  private viewH = 0;
  private cam = { x: 0, y: 0 };
  private shake = 0;
  private time = 0;
  private runPhase = 0;
  private game!: Game;
  /** Drevorez nad celou scénou (?classic ho vypne). */
  private woodcut: Woodcut | null = null;

  private tex = {
    player: new Map<string, Texture>(),
    shade: [] as Texture[],
    shadeBurn: [] as Texture[],
    eyes: Texture.EMPTY,
    ghoul: [] as Texture[],
    ghoulBurn: [] as Texture[],
    ghoulEyes: Texture.EMPTY,
    firefly: Texture.EMPTY,
    crystal: Texture.EMPTY,
    lantern: [Texture.EMPTY, Texture.EMPTY],
    flame: [] as Texture[],
    light: Texture.EMPTY,
    lightTile: Texture.EMPTY,
    spark: Texture.EMPTY,
    wisp: Texture.EMPTY,
    dust: Texture.EMPTY,
    stone: Texture.EMPTY,
    snow: Texture.EMPTY,
    rain: Texture.EMPTY,
    rat: [] as Texture[],
    sparkBall: Texture.EMPTY,
    water: [] as Texture[],
    crumble: Texture.EMPTY,
    barricade: Texture.EMPTY,
    herb: Texture.EMPTY,
    nest: [Texture.EMPTY, Texture.EMPTY],
    fog: Texture.EMPTY,
    bounce: [Texture.EMPTY, Texture.EMPTY],
    icicle: Texture.EMPTY,
    mover: Texture.EMPTY,
    moon: Texture.EMPTY,
  };
  /** Pozadia a voda podľa sveta (vytvárajú sa pri prvom použití). */
  private backs = new Map<World, { sky: Texture; far: Texture; near: Texture; water: Texture[] }>();
  private ambient: WorldInfo['ambient'] = 'motes';
  private darkness = 0.6;
  private ratSprites: Sprite[] = [];
  private sparkSprites: Sprite[] = [];
  private crumbleSprites: { sprite: Sprite; col: number; row: number }[] = [];
  private barricadeSprites: { sprite: Sprite; fire: Sprite }[] = [];
  private herbSprites: Sprite[] = [];
  private survivorSprites: Sprite[] = [];
  private doorSprites: { sprite: Sprite; index: number }[] = [];
  private keySprites: Sprite[] = [];
  private coinSprites: Sprite[] = [];
  private doorTex: Texture[] = [];
  private nestSprites: { sprite: Sprite; fire: Sprite[] }[] = [];
  /** Chumáče miazmy: jeden na políčko, mierne sa vlnia. */
  private fogSprites: { sprite: Sprite; index: number; seed: number }[] = [];
  private waterSprites: { sprite: Sprite; col: number }[] = [];
  private player = new Sprite();
  private shadeSprites: { body: Sprite; eyes: Sprite }[] = [];
  private ghoulSprites: { body: Sprite; eyes: Sprite }[] = [];
  /** Plameň fakle (kreslí sa nad tmou). */
  private torch = new Sprite();
  /** Palica v druhej ruke (pri údere sa zahne nad hlavou dopredu). */
  private cane = new Sprite();
  private fireflySprites: Sprite[] = [];
  private crystalSprites: Sprite[] = [];
  private lanternSprites: Sprite[] = [];
  private flames: Sprite[] = [];
  private mushrooms: { x: number; y: number }[] = [];
  private bounceSprites: { sprite: Sprite; x: number; y: number; squash: number }[] = [];
  private icicleSprites: Sprite[] = [];
  private moverSprites: Sprite[] = [];

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: host,
      background: C.ink,
      antialias: true,
      roundPixels: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    host.appendChild(this.app.canvas);

    const light = Texture.from(lightCanvas(128));
    light.source.scaleMode = 'linear';
    this.tex.light = light;
    this.tex.spark = art.dot('#fff6c8', 1.4);
    this.tex.wisp = art.dot('#0d0f18', 2.4);
    this.tex.dust = art.dot('#3a4458', 1.4);
    this.tex.stone = art.dot('#0d0f18', 2);
    this.tex.snow = art.dot('#ffffff', 1.6);
    this.tex.rain = art.dot('#b8c8e8', 1.2);
    this.buildTextures();

    // Pozadie: nebo, mesiac, kopce a stromy s paralaxou.
    const forest = this.back('quarter');
    this.sky = new TilingSprite({ texture: forest.sky, width: 320, height: 240 });
    this.moon = new Sprite(this.tex.moon);
    this.hills = new TilingSprite({ texture: forest.far, width: 480, height: 110 });
    this.trees = new TilingSprite({ texture: forest.near, width: 400, height: 130 });
    this.bg.addChild(this.sky, this.skyFlash, this.moon, this.hills, this.trees);

    this.lightLayer.blendMode = 'erase';
    this.lightRoot.addChild(this.lightLayer);
    this.glow.blendMode = 'add';
    this.particlesAbove.blendMode = 'add';

    this.app.stage.addChild(this.bg, this.world);
    if (!new URLSearchParams(location.search).has('classic')) {
      this.woodcut = new Woodcut();
      this.app.stage.filters = [this.woodcut.filter];
      this.app.stage.filterArea = this.app.screen;
    }
    this.resize();
    this.app.renderer.on('resize', () => this.resize());
  }

  private buildTextures(): void {
    for (const frame of PLAYER_FRAMES) this.tex.player.set(frame, art.player(frame));
    this.tex.player.set('breathe', art.player('breathe'));
    this.tex.shade = [0, 1, 2].map((f) => art.shade(f, false));
    this.tex.shadeBurn = [0, 1, 2].map((f) => art.shade(f, true));
    this.tex.eyes = art.eyes();
    this.tex.ghoul = [0, 1, 2, 3].map((f) => art.ghoul(f, false));
    this.tex.ghoulBurn = [0, 1, 2, 3].map((f) => art.ghoul(f, true));
    this.tex.ghoulEyes = art.ghoulEyes();
    this.tex.firefly = art.firefly();
    this.tex.crystal = art.crystal();
    this.tex.lantern = [art.lantern(false), art.lantern(true)];
    this.tex.flame = [0, 1, 2].map((v) => art.flame(v));
    this.tex.lightTile = art.lightTile();
    this.tex.rat = [0, 1].map((f) => art.rat(f));
    this.tex.sparkBall = art.spark();
    this.tex.crumble = art.crumble();
    this.tex.barricade = art.barricade();
    this.tex.herb = art.herb();
    this.tex.nest = [art.nest(false), art.nest(true)];
    this.tex.fog = art.fogPuff();
    this.tex.moon = art.moon();
    this.tex.bounce = [art.bounce(false), art.bounce(true)];
    this.tex.icicle = art.icicle();
    this.tex.mover = art.mover();
  }

  private back(world: World): { sky: Texture; far: Texture; near: Texture; water: Texture[] } {
    let back = this.backs.get(world);
    if (!back) {
      back = {
        sky: art.sky(world),
        far: art.far(world),
        near: art.near(world),
        water: [0, 1].map((f) => art.water(f, world)),
      };
      this.backs.set(world, back);
    }
    return back;
  }

  /** Polohy sú plynulé (vektory netreba prichytávať na pixely). */
  private px(v: number): number {
    return v;
  }

  /** Postaví scénu pre nový level. */
  setGame(game: Game): void {
    this.game = game;
    const level = game.level;
    // Vrstva tmy sa používa ďalej, ostatné sa zahodí.
    for (const child of this.world.removeChildren())
      if (child !== this.darkSprite) child.destroy({ children: true });
    this.level = new Container();
    this.actors = new Container();
    this.particlesBelow = new Container();
    this.above = new Container();
    this.glow = new Container();
    this.glow.blendMode = 'add';
    // V drevoreze by teplá žiara rozmazala siluety (čierna musí ostať čiernou).
    if (this.woodcut) this.glow.alpha = 0.3;
    this.particlesAbove = new Container();
    this.particlesAbove.blendMode = 'add';
    this.glowPool = [];
    this.particles = [];

    const back = this.back(level.world);
    const info = art.info(level.world);
    this.sky.texture = back.sky;
    this.hills.texture = back.far;
    this.trees.texture = back.near;
    this.tex.water = back.water;
    this.moon.visible = info.moon;
    this.moon.tint = info.moonTint;
    this.darkness = info.darkness;
    this.ambient = info.ambient;

    this.level.addChild(art.terrain(level));
    this.waterSprites = [];
    for (let row = 0; row < level.height; row++) {
      for (let col = 0; col < level.width; col++) {
        if (tileAt(level, col, row) !== Tile.Water || tileAt(level, col, row - 1) === Tile.Water)
          continue;
        const sprite = new Sprite(this.tex.water[0]);
        sprite.position.set(col * TILE, row * TILE);
        this.level.addChild(sprite);
        this.waterSprites.push({ sprite, col });
      }
    }
    this.crumbleSprites = game.crumbles.map((c) => {
      const sprite = new Sprite(this.tex.crumble);
      sprite.position.set(c.col * TILE, c.row * TILE);
      this.level.addChild(sprite);
      return { sprite, col: c.col, row: c.row };
    });
    this.barricadeSprites = game.barricades.map((b) => {
      const sprite = new Sprite(this.tex.barricade);
      sprite.position.set(b.col * TILE, b.row * TILE);
      this.level.addChild(sprite);
      const fire = new Sprite(this.tex.flame[0]);
      fire.anchor.set(0.5, 1);
      fire.position.set(b.col * TILE + TILE / 2, b.row * TILE + TILE);
      fire.visible = false;
      this.above.addChild(fire);
      return { sprite, fire };
    });
    this.bounceSprites = [];
    for (let row = 0; row < level.height; row++) {
      for (let col = 0; col < level.width; col++) {
        if (tileAt(level, col, row) !== Tile.Bounce) continue;
        const sprite = new Sprite(this.tex.bounce[0]);
        // Klobúk vytŕča nad povrch zeme.
        sprite.position.set(col * TILE, row * TILE - 5);
        this.level.addChild(sprite);
        this.bounceSprites.push({ sprite, x: col * TILE + TILE / 2, y: row * TILE, squash: 0 });
      }
    }
    this.moverSprites = game.movers.map(() => {
      const sprite = new Sprite(this.tex.mover);
      this.level.addChild(sprite);
      return sprite;
    });
    this.lightTiles = [];
    for (let row = 0; row < level.height; row++) {
      for (let col = 0; col < level.width; col++) {
        if (tileAt(level, col, row) !== Tile.Light) continue;
        const sprite = new Sprite(this.tex.lightTile);
        sprite.position.set(col * TILE, row * TILE);
        sprite.alpha = 0;
        this.level.addChild(sprite);
        this.lightTiles.push({ sprite, col, row });
      }
    }
    const signTex = art.sign();
    for (const s of level.signs) {
      const sprite = new Sprite(signTex);
      sprite.anchor.set(0.5, 1);
      sprite.position.set(s.x, s.y + TILE / 2);
      this.level.addChild(sprite);
    }
    // Lampy na stĺpoch až po zem.
    this.lanternSprites = level.lanterns.map((l) => {
      const col = Math.floor(l.x / TILE);
      let row = Math.floor(l.y / TILE) + 1;
      while (row < level.height && !isGround(tileAt(level, col, row))) row++;
      const top = l.y + 4;
      const post = new Sprite(art.post(row * TILE - top));
      post.position.set(l.x - 2, top);
      const lantern = new Sprite(this.tex.lantern[0]);
      lantern.anchor.set(0.5, 0.5);
      lantern.position.set(l.x, l.y - 1);
      this.level.addChild(post, lantern);
      return lantern;
    });
    // Hranica: kôl je v strede cieľa.
    const fire = new Sprite(art.campfire());
    fire.anchor.set(10 / 24, 1);
    fire.position.set(level.exit.x, level.exit.y + TILE / 2);
    this.level.addChild(fire);
    this.mushrooms = decorOf(level)
      .filter((d) => d.kind === 'candle')
      .map((d) => ({ x: d.x, y: d.y - 3.4 }));

    this.fireflySprites = game.fireflies.map((f) => {
      const s = new Sprite(this.tex.firefly);
      s.anchor.set(0.5);
      s.position.set(f.x, f.y);
      this.above.addChild(s);
      return s;
    });
    this.nestSprites = game.nests.map((n) => {
      const sprite = new Sprite(this.tex.nest[0]);
      sprite.anchor.set(0.5, 1);
      sprite.position.set(n.x, n.y + TILE / 2);
      this.level.addChild(sprite);
      const fire = [-5, 0, 5].map((dx) => {
        const f = new Sprite(this.tex.flame[0]);
        f.anchor.set(0.5, 1);
        f.position.set(n.x + dx, n.y + TILE / 2 - 2);
        f.visible = false;
        this.above.addChild(f);
        return f;
      });
      return { sprite, fire };
    });
    if (!this.doorTex.length) this.doorTex = [art.door(false), art.door(true)];
    this.doorSprites = [];
    for (let row = 0; row < level.height; row++)
      for (let col = 0; col < level.width; col++) {
        if (tileAt(level, col, row) !== Tile.Door) continue;
        const sprite = new Sprite(this.doorTex[0]);
        sprite.position.set(col * TILE, row * TILE);
        this.level.addChild(sprite);
        this.doorSprites.push({ sprite, index: row * level.width + col });
      }
    const keyTex = art.key();
    this.keySprites = game.keys.map((k) => {
      const s = new Sprite(keyTex);
      s.anchor.set(0.5);
      s.position.set(k.x, k.y);
      this.above.addChild(s);
      return s;
    });
    const coinTex = art.coin();
    this.coinSprites = game.coins.map((c) => {
      const s = new Sprite(coinTex);
      s.anchor.set(0.5);
      s.position.set(c.x, c.y + 3);
      this.actors.addChild(s);
      return s;
    });
    const survivorTex = art.survivor();
    this.survivorSprites = game.survivors.map((s) => {
      const sprite = new Sprite(survivorTex);
      sprite.anchor.set(0.5, 14 / 15);
      sprite.position.set(s.x, s.y + 0.5);
      this.actors.addChild(sprite);
      return sprite;
    });
    this.herbSprites = game.herbs.map((hb) => {
      const s = new Sprite(this.tex.herb);
      s.anchor.set(0.5);
      s.position.set(hb.x, hb.y);
      this.above.addChild(s);
      return s;
    });
    this.fogSprites = level.fog.map((f, i) => {
      const sprite = new Sprite(this.tex.fog);
      sprite.anchor.set(0.5);
      sprite.position.set(f.col * TILE + TILE / 2, f.row * TILE + TILE / 2);
      // V drevoreze sa miazma tlačí medenkou (sčítané svetlo by vybielilo do papiera).
      sprite.blendMode = this.woodcut ? 'normal' : 'add';
      if (this.woodcut) sprite.tint = 0x3f8a30;
      this.above.addChild(sprite);
      return { sprite, index: f.row * level.width + f.col, seed: (i * 1.37) % 6.28 };
    });
    this.crystalSprites = game.crystals.map((k) => {
      const s = new Sprite(this.tex.crystal);
      s.anchor.set(0.5);
      s.position.set(k.x, k.y);
      this.actors.addChild(s);
      return s;
    });
    this.shadeSprites = game.shades.map(() => {
      const body = new Sprite(this.tex.shade[0]);
      body.anchor.set(0.5, 0.4);
      const eyes = new Sprite(this.tex.eyes);
      eyes.anchor.set(0.5, 0.4);
      this.actors.addChild(body);
      this.above.addChild(eyes);
      return { body, eyes };
    });
    this.ghoulSprites = game.ghouls.map(() => {
      const body = new Sprite(this.tex.ghoul[0]);
      body.anchor.set(0.5, 15.4 / 17);
      const eyes = new Sprite(this.tex.ghoulEyes);
      eyes.anchor.set(0.5, 15.4 / 17);
      this.actors.addChild(body);
      this.above.addChild(eyes);
      return { body, eyes };
    });
    this.icicleSprites = game.icicles.map(() => {
      const sprite = new Sprite(this.tex.icicle);
      sprite.anchor.set(0.5, 0);
      this.actors.addChild(sprite);
      return sprite;
    });
    this.ratSprites = game.rats.map(() => {
      const s = new Sprite(this.tex.rat[0]);
      s.anchor.set(0.5, 5 / 6);
      this.actors.addChild(s);
      return s;
    });
    this.sparkSprites = [];
    this.flames = [0, 1, 2].map((i) => {
      const s = new Sprite(this.tex.flame[i]);
      s.anchor.set(0.5, 1);
      s.position.set(level.exit.x - 5 + i * 5, level.exit.y + TILE / 2 - 2);
      s.scale.set(i === 1 ? 1.5 : 1.1);
      s.visible = false;
      this.above.addChild(s);
      return s;
    });
    this.player = new Sprite(this.tex.player.get('idle'));
    this.player.anchor.set(0.5, 1);
    this.cane = new Sprite(art.cane());
    this.cane.anchor.set(0.5, 1.5 / 15);
    this.actors.addChild(this.cane, this.player);
    this.torch = new Sprite(this.tex.flame[0]);
    this.torch.anchor.set(0.5, 0.97);
    this.above.addChild(this.torch);

    if (!this.darkSprite) this.darkSprite = new Sprite();
    this.world.addChild(
      this.level,
      this.particlesBelow,
      this.actors,
      this.darkSprite,
      this.glow,
      this.above,
      this.particlesAbove,
    );
    this.resize();
    const c = game.center;
    this.cam = { x: c.x, y: c.y };
    this.clampCamera();
  }

  private resize(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    // Celočíselné priblíženie (ostré pixely): ~11 políčok na výšku.
    // Na nízkych obrazovkách (telefón na šírku) radšej neceločíselné, inak je všetko drobné.
    this.zoom = h >= 600 ? Math.round(h / 175) : Math.max(2, h / 150);
    this.world.scale.set(this.zoom);
    this.bg.scale.set(this.zoom);
    this.viewW = Math.ceil(w / this.zoom) + 2;
    this.viewH = Math.ceil(h / this.zoom) + 2;
    this.dark?.destroy(true);
    this.dark = RenderTexture.create({ width: this.viewW, height: this.viewH, resolution: 0.5 });
    this.dark.source.scaleMode = 'linear';
    if (this.darkSprite) this.darkSprite.texture = this.dark;
    this.sky.width = this.viewW;
    this.sky.height = this.viewH;
    // Prechod neba sa natiahne na celú výšku (inak sa opakuje a vznikne šev).
    this.sky.tileScale.y = this.viewH / 240;
    this.hills.width = this.trees.width = this.viewW;
  }

  private clampCamera(): void {
    const level = this.game.level;
    const lw = level.width * TILE;
    const lh = level.height * TILE;
    this.cam.x = lw > this.viewW ? clamp(this.cam.x, this.viewW / 2, lw - this.viewW / 2) : lw / 2;
    this.cam.y =
      lh > this.viewH
        ? clamp(this.cam.y, this.viewH / 2, lh - this.viewH / 2)
        : lh - this.viewH / 2;
  }

  /** Udalosti hry → častice a otrasy. */
  handle(events: GameEvent[]): void {
    const c = this.game.center;
    for (const e of events) {
      switch (e.type) {
        case 'firefly':
          this.burst(e.x, e.y, 10, C.firefly, 50, true);
          break;
        case 'crystal':
          this.burst(e.x, e.y, 18, C.crystal, 70, true);
          break;
        case 'lantern':
          this.burst(e.x, e.y, 24, C.flame, 80, true);
          break;
        case 'flare':
          this.ring(this.game.lamp.x, this.game.lamp.y);
          break;
        case 'hurt':
          this.shake = 5;
          this.burst(c.x, c.y, 10, C.flameRed, 70, true);
          break;
        case 'shadeDie':
          this.burst(e.x, e.y, 16, C.shadeInner, 60, false);
          this.burst(e.x, e.y, 10, 0xffb070, 50, true);
          break;
        case 'caneHit':
          this.shake = 2.5;
          this.burst(e.x, e.y, 8, C.shadeInner, 50, false);
          this.burst(e.x, e.y, 4, 0xfff0d0, 40, true);
          break;
        case 'ratDie':
          this.burst(e.x, e.y, 8, C.shadeInner, 40, false);
          this.burst(e.x, e.y, 6, C.flame, 40, true);
          break;
        case 'fizzle':
          this.burst(e.x, e.y, 6, C.flame, 35, true);
          break;
        case 'bounce': {
          const b = this.bounceSprites.reduce<(typeof this.bounceSprites)[number] | null>(
            (best, cur) =>
              !best ||
              Math.abs(cur.x - e.x) + Math.abs(cur.y - e.y) <
                Math.abs(best.x - e.x) + Math.abs(best.y - e.y)
                ? cur
                : best,
            null,
          );
          if (b) b.squash = 0.18;
          this.burst(e.x, e.y, 10, 0xe070ff, 50, true);
          break;
        }
        case 'icicle':
          this.burst(e.x, e.y, 4, 0xcfeeff, 15, true);
          break;
        case 'shatter':
          this.shake = 1.5;
          this.burst(e.x, e.y, 12, 0xcfeeff, 60, true);
          break;
        case 'ignite':
          this.burst(e.x, e.y, 10, C.flameRed, 50, true);
          break;
        case 'burnt':
          this.burst(e.x, e.y, 10, C.shadeInner, 40, false);
          this.burst(e.x, e.y, 6, C.flame, 40, true);
          break;
        case 'nestIgnite':
          this.shake = 2;
          this.burst(e.x, e.y, 16, C.flameRed, 60, true);
          break;
        case 'nestBurnt':
          this.burst(e.x, e.y, 18, C.shadeInner, 40, false);
          this.burst(e.x, e.y, 10, C.flame, 50, true);
          break;
        case 'key':
          this.burst(e.x, e.y, 14, 0xf0d870, 50, true);
          break;
        case 'coin':
          this.burst(e.x, e.y, 6, 0xe8e0c8, 30, true);
          break;
        case 'doorOpen':
          this.shake = 1.5;
          this.burst(e.x, e.y, 10, C.shadeInner, 30, false);
          break;
        case 'saved':
          this.burst(e.x, e.y, 20, 0xfff0d0, 50, true);
          break;
        case 'turned':
          this.shake = 2;
          this.burst(e.x, e.y, 16, C.plague, 45, true);
          break;
        case 'herb':
          this.burst(e.x, e.y, 14, 0xc8f0a0, 50, true);
          break;
        case 'fogBurn':
          this.burst(e.x, e.y, 4, 0xa8c860, 30, true);
          break;
        case 'ghoulDie':
          this.shake = 2;
          this.burst(e.x, e.y, 16, C.shadeInner, 55, false);
          this.burst(e.x, e.y, 10, C.plague, 45, true);
          break;
        case 'shadeHit':
          this.shake = 3;
          this.burst(e.x, e.y, 14, C.shadeInner, 60, false);
          this.burst(e.x, e.y, 8, 0xffb070, 50, true);
          break;
        case 'crumble':
          for (let i = 0; i < 8; i++)
            this.spawn(
              this.tex.stone,
              e.x + (Math.random() - 0.5) * 14,
              e.y + Math.random() * 8,
              (Math.random() - 0.5) * 30,
              Math.random() * 20,
              500,
              0.8,
              false,
            );
          break;
        case 'land':
          for (const dir of [-1, 1])
            this.spawn(
              this.tex.dust,
              c.x + dir * 3,
              c.y + PLAYER_H / 2,
              dir * 25,
              -10,
              0,
              0.35,
              false,
            );
          break;
        case 'died':
          this.shake = 3;
          this.burst(c.x, c.y, 20, e.cause === 'dark' ? C.shadeInner : C.cloak, 60, false);
          this.burst(c.x, c.y, 8, C.flame, 40, true);
          break;
        case 'exit':
          this.burst(this.game.level.exit.x, this.game.level.exit.y, 30, C.flame, 90, true);
          break;
        default:
          break;
      }
    }
  }

  private spawn(
    tex: Texture,
    x: number,
    y: number,
    vx: number,
    vy: number,
    gravity: number,
    life: number,
    above: boolean,
  ): void {
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    (above ? this.particlesAbove : this.particlesBelow).addChild(sprite);
    this.particles.push({ sprite, vx, vy, gravity, life, age: 0, fade: true, alpha: 1 });
  }

  private burst(
    x: number,
    y: number,
    n: number,
    color: number,
    speed: number,
    light: boolean,
  ): void {
    const tex = light ? this.tex.spark : this.tex.wisp;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.spawn(
        tex,
        x,
        y,
        Math.cos(a) * v,
        Math.sin(a) * v - 20,
        light ? 40 : -20,
        0.5 + Math.random() * 0.5,
        light,
      );
      const p = this.particles[this.particles.length - 1]!;
      p.sprite.tint = color;
    }
  }

  private ring(x: number, y: number): void {
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      this.spawn(this.tex.spark, x, y, Math.cos(a) * 140, Math.sin(a) * 140, 0, 0.4, true);
      this.particles[this.particles.length - 1]!.sprite.tint = C.flame;
    }
  }

  render(dt: number): void {
    const game = this.game;
    this.time += dt;
    const lights = game.lights();
    this.updateCamera(dt);
    this.updateActors(dt, lights);
    this.updateParticles(dt);
    this.updateDarkness();
  }

  private updateCamera(dt: number): void {
    const game = this.game;
    const c = game.center;
    const tx = c.x + game.player.facing * 22;
    const ty = c.y - 12;
    const k = 1 - Math.exp(-dt * 3.5);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * (1 - Math.exp(-dt * 2.5));
    this.clampCamera();
    this.shake = Math.max(0, this.shake - dt * 20);
    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.world.position.set(
      Math.round(w / 2 - (this.cam.x + sx) * this.zoom),
      Math.round(h / 2 - (this.cam.y + sy) * this.zoom),
    );

    // Paralaxa pozadia.
    const lh = game.level.height * TILE;
    const bottom = this.cam.y + this.viewH / 2;
    const lift = (lh - bottom) * 0.25;
    this.sky.tilePosition.set(-this.cam.x * 0.02, 0);
    this.moon.position.set(this.viewW * 0.72, 18 + lift * 0.2);
    this.hills.tilePosition.x = -this.cam.x * 0.12;
    this.hills.y = this.viewH - 110 + lift * 0.6;
    this.trees.tilePosition.x = -this.cam.x * 0.3;
    this.trees.y = this.viewH - 118 + lift;
    this.woodcut?.update(
      this.world.position.x,
      this.world.position.y,
      this.zoom,
      this.app.renderer.resolution,
    );
    this.skyFlash
      .clear()
      .rect(0, 0, this.viewW, this.viewH)
      .fill({ color: 0xc8d4ff, alpha: game.flash * 0.5 });
  }

  private updateActors(dt: number, lights: LightSource[]): void {
    const game = this.game;
    const p = game.player;
    const t = this.time;

    // Hráč.
    let frame: PlayerFrame | 'breathe' = 'idle';
    if (!p.onGround) frame = p.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(p.vx) > 10) {
      this.runPhase += (Math.abs(p.vx) * dt) / 7;
      frame = (['run0', 'run1', 'run2', 'run3'] as const)[Math.floor(this.runPhase) % 4]!;
    } else if (Math.floor(t / 0.7) % 2 === 1) frame = 'breathe';
    this.player.texture = this.tex.player.get(frame)!;
    this.player.scale.x = p.facing;
    this.player.position.set(
      this.px(p.x + PLAYER_W / 2 + p.facing * 1),
      this.px(p.y + PLAYER_H + 1),
    );
    this.player.visible =
      game.state !== 'dead' && !(p.invulnerable > 0 && Math.floor(t * 12) % 2 === 0);
    // Plameň fakle: pri rozžiarení šľahá, pod plášťom a bez smoly zostane len tlejúci uhlík.
    const lamp = game.lamp;
    this.torch.visible = game.state !== 'dead';
    this.torch.texture = this.tex.flame[Math.floor(t * 12) % 3]!;
    const size = game.oil <= 0 || game.shielded ? 0.1 : 0.22 + (game.radius / FLARE_RADIUS) * 0.3;
    this.player.scale.y = game.shielded ? 0.92 : 1;
    this.torch.scale.set(size * (1 + Math.sin(t * 23) * 0.06), size * (1 + Math.sin(t * 17) * 0.1));
    this.torch.position.set(lamp.x, lamp.y + 1.6);
    // Palica: v pokoji opretá špičkou dopredu, pri údere švih zhora pred seba.
    const sw = game.swing;
    let a = 0.32 + Math.sin(this.runPhase * Math.PI * 0.5) * 0.06;
    if (sw >= 0) {
      if (sw < 0.06) a = 0.32 + (3.4 - 0.32) * (sw / 0.06);
      else if (sw < 0.16) a = 3.4 - (3.4 - 0.85) * ((sw - 0.06) / 0.1);
      else a = 0.85 - (0.85 - 0.32) * ((sw - 0.16) / (CANE_TIME - 0.16));
    }
    this.cane.visible = this.player.visible;
    this.cane.rotation = -p.facing * a;
    this.cane.position.set(p.x + PLAYER_W / 2 + p.facing * 0.5, p.y + 7 + (game.shielded ? 1 : 0));

    // Svetelné plošiny sa plynule zjavia a zmiznú.
    for (const lt of this.lightTiles) {
      const lit = game.isTileLit(lt.col, lt.row, lights);
      const target = lit ? 1 : 0.04;
      lt.sprite.alpha += (target - lt.sprite.alpha) * Math.min(1, dt * 12);
    }

    game.fireflies.forEach((f, i) => {
      const s = this.fireflySprites[i]!;
      s.visible = !f.taken;
      s.position.set(f.x + Math.sin(t * 1.7 + i) * 2, f.y + Math.sin(t * 2.3 + i * 1.7) * 2.5);
      s.alpha = 0.7 + Math.sin(t * 6 + i * 2) * 0.3;
    });
    game.crystals.forEach((k, i) => {
      const s = this.crystalSprites[i]!;
      s.visible = !k.taken;
      s.y = k.y + this.px(Math.sin(t * 2 + i) * 1.5);
    });
    game.lanterns.forEach((l, i) => {
      this.lanternSprites[i]!.texture = this.tex.lantern[l.lit ? 1 : 0]!;
    });
    this.flames.forEach((f, i) => {
      f.visible = game.exitLit;
      f.texture = this.tex.flame[(Math.floor(t * 10) + i) % 3]!;
    });

    game.rats.forEach((r, i) => {
      const s = this.ratSprites[i]!;
      s.visible = r.alive;
      if (!r.alive) return;
      s.texture = this.tex.rat[Math.floor(r.step / 3) % 2]!;
      s.position.set(r.x, r.y + 0.5);
      s.scale.x = r.dir;
      s.tint = r.burning ? 0xff9a60 : 0xffffff;
    });
    // Iskry: sprity podľa počtu, s iskričkami za sebou.
    while (this.sparkSprites.length < game.sparks.length) {
      const s = new Sprite(this.tex.sparkBall);
      s.anchor.set(0.5);
      this.above.addChild(s);
      this.sparkSprites.push(s);
    }
    this.sparkSprites.forEach((s, i) => {
      const sp = game.sparks[i];
      s.visible = !!sp;
      if (!sp) return;
      s.position.set(this.px(sp.x), this.px(sp.y));
      if (Math.random() < 0.6) {
        this.spawn(
          this.tex.spark,
          sp.x,
          sp.y,
          -Math.sign(sp.vx) * 20,
          (Math.random() - 0.5) * 20,
          30,
          0.3,
          true,
        );
        this.particles[this.particles.length - 1]!.sprite.tint = C.flame;
      }
    });
    game.barricades.forEach((b, i) => {
      const { sprite, fire } = this.barricadeSprites[i]!;
      sprite.visible = b.state !== 'gone';
      fire.visible = b.state === 'burning';
      if (b.state === 'burning') {
        fire.texture = this.tex.flame[(Math.floor(t * 12) + i) % 3]!;
        const k = 0.8 + Math.min(1, b.timer * 3) * 0.5;
        fire.scale.set(k, k * (1 + Math.sin(t * 20 + i) * 0.1));
        sprite.tint = 0xff9a60;
      }
    });
    game.nests.forEach((n, i) => {
      const { sprite, fire } = this.nestSprites[i]!;
      sprite.texture = this.tex.nest[n.state === 'ash' ? 1 : 0]!;
      fire.forEach((f, k) => {
        f.visible = n.state === 'burning';
        if (!f.visible) return;
        f.texture = this.tex.flame[(Math.floor(t * 12) + k) % 3]!;
        const grow = Math.min(1, n.timer * 2) * (1 - Math.max(0, n.timer - 2) * 1.5);
        const sc = (k === 1 ? 1.5 : 1.1) * Math.max(0.2, grow);
        f.scale.set(sc, sc * (1 + Math.sin(t * 19 + k) * 0.12));
      });
    });
    game.herbs.forEach((hb, i) => {
      const s = this.herbSprites[i]!;
      s.visible = !hb.taken;
      s.y = hb.y + Math.sin(t * 2 + i) * 1;
    });
    for (const f of this.fogSprites) {
      const d = game.fog[f.index]!;
      f.sprite.visible = d > 0.03;
      f.sprite.alpha = d * (0.5 + Math.sin(t * 0.9 + f.seed) * 0.12);
      f.sprite.scale.set(1 + Math.sin(t * 0.6 + f.seed) * 0.12);
      f.sprite.rotation = Math.sin(t * 0.3 + f.seed) * 0.4;
    }
    // Drobiace sa kamene sa trasú, potom zmiznú.
    game.crumbles.forEach((c, i) => {
      const { sprite } = this.crumbleSprites[i]!;
      sprite.visible = c.state !== 'gone';
      const jitter = c.state === 'shaking' ? Math.round(Math.sin(t * 60) * 1) : 0;
      sprite.position.set(c.col * TILE + jitter, c.row * TILE);
    });
    const waveFrame = Math.floor(t * 3);
    for (const w of this.waterSprites) w.sprite.texture = this.tex.water[(waveFrame + w.col) % 2]!;

    for (const b of this.bounceSprites) {
      b.squash = Math.max(0, b.squash - dt);
      b.sprite.texture = this.tex.bounce[b.squash > 0 ? 1 : 0]!;
    }
    game.icicles.forEach((ic, i) => {
      const s = this.icicleSprites[i]!;
      s.visible = ic.state !== 'gone';
      const jitter = ic.state === 'shake' ? Math.sin(t * 70) * 0.8 : 0;
      s.position.set(ic.x + jitter, ic.y);
    });
    game.movers.forEach((m, i) => this.moverSprites[i]!.position.set(m.x, m.y));

    // Premenení preživší pribudnú ako noví nakazení.
    while (this.ghoulSprites.length < game.ghouls.length) {
      const body = new Sprite(this.tex.ghoul[0]);
      body.anchor.set(0.5, 15.4 / 17);
      const eyes = new Sprite(this.tex.ghoulEyes);
      eyes.anchor.set(0.5, 15.4 / 17);
      this.actors.addChild(body);
      this.above.addChild(eyes);
      this.ghoulSprites.push({ body, eyes });
    }
    for (const d of this.doorSprites)
      d.sprite.texture = this.doorTex[game.openDoors.has(d.index) ? 1 : 0]!;
    game.keys.forEach((k, i) => {
      const s = this.keySprites[i]!;
      s.visible = !k.taken;
      s.y = k.y + Math.sin(t * 2.2 + i) * 1.2;
    });
    game.coins.forEach((c, i) => {
      const s = this.coinSprites[i]!;
      s.visible = !c.taken;
      s.scale.x = Math.cos(t * 3 + i);
    });
    game.survivors.forEach((s, i) => {
      const sprite = this.survivorSprites[i]!;
      sprite.visible = s.state !== 'turned' && s.timer < 3;
      // Zachránený vstane a odchádza do tmy; čakajúci sa trasie a kašle.
      if (s.state === 'saved') {
        sprite.scale.set(-1, 1 + Math.min(0.25, s.timer * 0.5));
        sprite.x = s.x - s.timer * 14;
        sprite.alpha = Math.max(0, 1 - s.timer / 3);
      } else {
        sprite.x = s.x + (Math.floor(t * 2 + i) % 5 === 0 ? Math.sin(t * 40) * 0.4 : 0);
      }
    });
    game.ghouls.forEach((g, i) => {
      const { body, eyes } = this.ghoulSprites[i]!;
      body.visible = eyes.visible = g.alive;
      if (!g.alive) return;
      const f = Math.floor(g.step / 5) % 4;
      body.texture = (g.burning ? this.tex.ghoulBurn : this.tex.ghoul)[f]!;
      body.position.set(g.x, g.y + 1);
      body.scale.x = g.dir;
      eyes.position.copyFrom(body.position);
      eyes.scale.x = g.dir;
      eyes.alpha = g.chasing ? 1 : 0.55;
    });

    game.shades.forEach((s, i) => {
      const { body, eyes } = this.shadeSprites[i]!;
      body.visible = eyes.visible = s.alive;
      if (!s.alive) return;
      const f = Math.floor(t * 8 + i) % 3;
      body.texture = (s.burning ? this.tex.shadeBurn : this.tex.shade)[f]!;
      // Pred výpadom sa prízrak zachveje.
      const shiver = s.state === 'windup' ? Math.sin(t * 90) * 0.8 : 0;
      body.position.set(this.px(s.x + shiver), this.px(s.y));
      const size = s.big ? 1.8 : 1;
      body.scale.set((game.center.x < s.x ? -1 : 1) * size, size);
      eyes.position.copyFrom(body.position);
      eyes.scale.copyFrom(body.scale);
      // Oči v tme žmurkajú; pri výpade svietia naplno.
      const blink = Math.floor(t * 1.3 + i * 0.37) % 7 === 0 && (t * 1.3 + i * 0.37) % 1 < 0.15;
      const angry = s.state === 'lunge' || s.state === 'windup';
      eyes.alpha = blink && !angry ? 0 : angry ? 1 : 0.75;
      eyes.tint = angry ? 0xff5040 : 0xffffff;
      body.alpha = s.active ? 1 : 0.8;
    });
  }

  private updateParticles(dt: number): void {
    this.particles = this.particles.filter((p) => {
      p.age += dt;
      if (p.age >= p.life) {
        p.sprite.destroy();
        return false;
      }
      p.vy += p.gravity * dt;
      if (p.streak) p.sprite.rotation = -Math.atan2(p.vx, p.vy);
      else {
        p.vx *= 1 - dt * 2;
        p.vy *= 1 - dt * 1.5;
      }
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      if (p.fade) p.sprite.alpha = p.alpha * (1 - p.age / p.life);
      return true;
    });
    this.spawnAmbient(dt);
  }

  /** Častice vo vzduchu podľa sveta: svetielka, bludičky, sneh, prach alebo žeravé iskry. */
  private spawnAmbient(dt: number): void {
    const kind = this.ambient;
    if (kind === 'rain') {
      this.spawnStorm(dt);
      return;
    }
    const rate = { motes: 3, wisps: 2.5, snow: 28, dust: 2.5, embers: 7 }[kind];
    let n = rate * dt;
    while (n > 0) {
      if (Math.random() >= n) break;
      n -= 1;
      const x = this.cam.x + (Math.random() - 0.5) * this.viewW;
      let y = this.cam.y + (Math.random() - 0.5) * this.viewH;
      let vx = (Math.random() - 0.5) * 8;
      let vy = -4 - Math.random() * 6;
      let gravity = 0;
      let life = 3;
      let tint: number = C.firefly;
      let alpha = 0.5;
      let tex = this.tex.spark;
      if (kind === 'wisps') {
        tint = 0x9ad08a;
        gravity = -4;
        life = 4;
        alpha = 0.6;
      } else if (kind === 'snow') {
        y = this.cam.y - this.viewH / 2 - 4;
        vx = -4 - Math.random() * 6;
        vy = 10 + Math.random() * 8;
        gravity = 20;
        life = 9;
        tint = 0xffffff;
        alpha = 0.75;
        tex = this.tex.snow;
      } else if (kind === 'dust') {
        tint = 0xb0a0c8;
        vy = (Math.random() - 0.5) * 4;
        life = 5;
        alpha = 0.35;
      } else if (kind === 'embers') {
        tint = 0xff7a4a;
        vy = -10 - Math.random() * 10;
        gravity = -15;
        alpha = 0.7;
      }
      this.spawn(tex, x, y, vx, vy, gravity, life, true);
      const p = this.particles[this.particles.length - 1]!;
      p.sprite.tint = tint;
      p.sprite.alpha = p.alpha = alpha;
      p.fade = kind !== 'snow';
    }
  }

  /** Búrka: dážď šikmý podľa vetra a pri nárazoch prúdy vetra cez celú obrazovku. */
  private spawnStorm(dt: number): void {
    const wind = this.game.wind;
    const left = this.cam.x - this.viewW / 2;
    const top = this.cam.y - this.viewH / 2;
    let n = 55 * dt;
    while (n > 0 && Math.random() < n) {
      n -= 1;
      const vy = 230 + Math.random() * 40;
      const vx = wind * 110 - 18;
      const x = left - vx * 0.3 + Math.random() * (this.viewW + Math.abs(vx));
      this.spawn(this.tex.rain, x, top - 6, vx, vy, 0, (this.viewH + 12) / vy, true);
      const p = this.particles[this.particles.length - 1]!;
      p.streak = true;
      p.fade = false;
      p.sprite.alpha = p.alpha = 0.3;
      p.sprite.scale.set(0.6, 5);
    }
    let m = 16 * Math.abs(wind) * dt;
    while (m > 0 && Math.random() < m) {
      m -= 1;
      const dir = Math.sign(wind);
      const x = dir > 0 ? left - 20 : left + this.viewW + 20;
      const y = top + Math.random() * this.viewH;
      const vx = dir * (240 + Math.random() * 80);
      this.spawn(this.tex.rain, x, y, vx, 0, 0, (this.viewW + 40) / Math.abs(vx), true);
      const p = this.particles[this.particles.length - 1]!;
      p.streak = true;
      p.sprite.alpha = p.alpha = 0.18 * Math.abs(wind);
      p.sprite.scale.set(0.5, 14 + Math.random() * 10);
    }
  }

  private updateDarkness(): void {
    const game = this.game;
    const vx = this.cam.x - this.viewW / 2;
    const vy = this.cam.y - this.viewH / 2;
    this.darkSprite.position.set(vx, vy);
    this.darkSprite.width = this.viewW;
    this.darkSprite.height = this.viewH;
    this.darkFill
      .clear()
      .rect(0, 0, this.viewW, this.viewH)
      .fill({ color: 0x04030a, alpha: this.darkness * (1 - game.flash * 0.75) });
    this.app.renderer.render({ container: this.darkFill, target: this.dark, clear: true });

    let used = 0;
    let glowUsed = 0;
    const t = this.time;
    const inView = (x: number, y: number, r: number) =>
      x + r > vx && x - r < vx + this.viewW && y + r > vy && y - r < vy + this.viewH;
    const light = (x: number, y: number, radius: number, alpha = 1) => {
      if (!inView(x, y, radius)) return;
      let s = this.lightPool[used];
      if (!s) {
        s = new Sprite(this.tex.light);
        s.anchor.set(0.5);
        this.lightPool.push(s);
        this.lightLayer.addChild(s);
      }
      s.visible = true;
      s.position.set(x - vx, y - vy);
      s.width = s.height = radius * LIGHT_SCALE;
      s.alpha = alpha;
      used++;
    };
    const glow = (x: number, y: number, radius: number, color: number, alpha: number) => {
      if (!inView(x, y, radius)) return;
      let s = this.glowPool[glowUsed];
      if (!s) {
        s = new Sprite(this.tex.light);
        s.anchor.set(0.5);
        this.glowPool.push(s);
        this.glow.addChild(s);
      }
      s.visible = true;
      s.position.set(x, y);
      s.width = s.height = radius * 2;
      s.tint = color;
      s.alpha = alpha;
      glowUsed++;
    };

    // Fakľa blikotá viac než lampáš.
    const flicker =
      1 + Math.sin(t * 13) * 0.04 + Math.sin(t * 7.3) * 0.03 + Math.sin(t * 29) * 0.015;
    if (game.state !== 'dead') {
      const lamp = game.lamp;
      light(lamp.x, lamp.y, game.radius * flicker);
      const strength = Math.min(1, game.radius / FLARE_RADIUS);
      glow(lamp.x, lamp.y, game.radius * 1.1, WARM, 0.08 + strength * 0.14);
    }
    for (const l of game.lanterns) {
      if (!l.lit) continue;
      light(l.x, l.y, LANTERN_RADIUS * flicker);
      glow(l.x, l.y, LANTERN_RADIUS, WARM, 0.14);
    }
    const exit = game.level.exit;
    if (game.exitLit) {
      light(exit.x, exit.y - 4, LANTERN_RADIUS * 2 * flicker);
      glow(exit.x, exit.y - 4, LANTERN_RADIUS * 1.8, WARM, 0.3);
    } else {
      // Tlejúca smola v hranici ukazuje cieľ z diaľky.
      light(exit.x, exit.y + 4, 16 * flicker, 0.7);
      glow(exit.x, exit.y + 4, 20, C.flameRed, 0.3);
    }
    for (const lt of this.lightTiles) {
      if (lt.sprite.alpha < 0.5) continue;
      light(lt.col * TILE + 8, lt.row * TILE + 3, 14, 0.5);
    }
    game.fireflies.forEach((f, i) => {
      if (f.taken) return;
      const s = this.fireflySprites[i]!;
      light(s.x, s.y, 9, 0.45);
      glow(s.x, s.y, 10, C.firefly, 0.4 * s.alpha);
    });
    game.crystals.forEach((k, i) => {
      if (k.taken) return;
      const s = this.crystalSprites[i]!;
      light(s.x, s.y, 12, 0.6);
      glow(s.x, s.y, 14, C.crystal, 0.3);
    });
    for (const m of this.mushrooms) {
      light(m.x, m.y, 10 * flicker, 0.5);
      glow(m.x, m.y, 9, C.mushroom, 0.3);
    }
    // Oči nakazených trochu presvitajú tmou, aby bolo vidieť, odkiaľ idú.
    for (const g of game.ghouls)
      if (g.alive) glow(g.x + g.dir * 3, g.y - GHOUL_H + 4, 6, C.plague, 0.25);
    for (const n of game.nests) {
      if (n.state !== 'burning') continue;
      light(n.x, n.y, 52 * flicker);
      glow(n.x, n.y, 40, WARM, 0.2);
    }
    for (const b of game.barricades) {
      if (b.state !== 'burning') continue;
      light(b.col * TILE + 8, b.row * TILE + 8, BARRICADE_LIGHT * flicker);
      glow(b.col * TILE + 8, b.row * TILE + 8, BARRICADE_LIGHT * 0.8, WARM, 0.2);
    }
    // Miazma slabo svieti, aby bolo vidieť, kam nevstupovať.
    for (const f of this.fogSprites)
      if (f.sprite.visible && f.index % 2 === 0)
        light(f.sprite.x, f.sprite.y, 14, 0.18 * game.fog[f.index]!);
    game.herbs.forEach((hb, i) => {
      if (hb.taken) return;
      light(hb.x, this.herbSprites[i]!.y, 10, 0.5);
      glow(hb.x, this.herbSprites[i]!.y, 10, 0xc8f0a0, 0.3);
    });
    for (const sp of game.sparks) {
      light(sp.x, sp.y, SPARK_RADIUS);
      glow(sp.x, sp.y, 22, C.flame, 0.35);
    }
    // Mesiac presvitá tmou (terén pred ním ostane siluetou).
    if (this.moon.visible) light(vx + this.moon.x + 13, vy + this.moon.y + 13, 22, 0.9);
    for (let i = used; i < this.lightPool.length; i++) this.lightPool[i]!.visible = false;
    for (let i = glowUsed; i < this.glowPool.length; i++) this.glowPool[i]!.visible = false;
    this.app.renderer.render({ container: this.lightRoot, target: this.dark, clear: false });
  }

  /** Obrazovkové súradnice → svet (pre ladenie). */
  get camera(): { x: number; y: number; zoom: number } {
    return { ...this.cam, zoom: this.zoom };
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
