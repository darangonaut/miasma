import { CanvasSource, Container, Graphics, Texture } from 'pixi.js';
import { TILE, Tile, tileAt, type Level, type World } from '@/game/level';
import type { Art, WorldInfo } from './art';
import { drawGirl, type GirlPose } from './girl';
import { decorOf, noise as pixelNoise, type PlayerFrame } from './common';

/**
 * Siluetový štýl (v duchu hier Limbo a Badland): popredie je čierne, pozadie farebne žiari
 * a farbu má len to, čo svieti — lampáš, svetlušky, oči tieňov, vatra.
 */
const INK = 0x05060b;
const INK_CSS = '#05060b';
const GLOW = '#fff6c8';
const GOLD = '#ffd35a';
const EMBER = '#ff8a3a';

type Ctx = CanvasRenderingContext2D;

/** Nakreslí sprite cez Canvas 2D v rozlíšení R× (rozmery w×h sú v jednotkách sveta). */
function paint(w: number, h: number, draw: (ctx: Ctx) => void, resolution = 8): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w * resolution));
  canvas.height = Math.max(1, Math.ceil(h * resolution));
  const ctx = canvas.getContext('2d')!;
  ctx.scale(resolution, resolution);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  draw(ctx);
  const source = new CanvasSource({ resource: canvas, resolution, scaleMode: 'linear' });
  return new Texture({ source });
}

function circle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, width: number): void {
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function glowDot(ctx: Ctx, x: number, y: number, r: number, inner: string, outer: string): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, outer);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// --- Postavička ---
const LEGS: Record<PlayerFrame, [number, number][]> = {
  idle: [
    [5.9, 0],
    [7.4, 0],
  ],
  run0: [
    [5.8, -1.6],
    [7.5, 1.7],
  ],
  run1: [
    [6.4, -0.3],
    [7, 0.4],
  ],
  run2: [
    [5.9, -1],
    [7.3, 1.1],
  ],
  run3: [
    [6.5, 0.3],
    [6.9, -0.4],
  ],
  jump: [
    [6, 0.8],
    [7.4, 1.2],
  ],
  fall: [
    [5.6, -1.8],
    [7.8, 1.8],
  ],
};

/** Ako veje cop pri jednotlivých pohyboch. */
const HAIR: Record<PlayerFrame, number> = {
  idle: 0,
  run0: 0.8,
  run1: 0.6,
  run2: 0.9,
  run3: 0.6,
  jump: -0.6,
  fall: 1,
};

function player(frame: PlayerFrame | 'breathe'): Texture {
  const pose = breathePose(frame);
  return paint(14, 17, (ctx) => drawGirl(ctx, pose));
}

function breathePose(frame: PlayerFrame | 'breathe'): GirlPose {
  const f = frame === 'breathe' ? 'idle' : frame;
  return {
    legs: LEGS[f]!,
    legEnd: f === 'jump' ? 14.6 : 15.4,
    dy: frame === 'breathe' ? 0.4 : 0,
    wave: HAIR[f]!,
  };
}

// --- Tiene a mory ---
function shadeBody(ctx: Ctx, frame: number): void {
  circle(ctx, 9, 7, 5.6);
  for (let i = -1; i <= 1; i++) {
    const x = 9 + i * 3;
    const tipX = x + i * 0.8 + Math.sin(frame * 2.1 + i * 1.7) * 1.6;
    const tipY = 15.5 + Math.cos(frame * 1.7 + i) * 1;
    ctx.beginPath();
    ctx.moveTo(x - 2, 9.5);
    ctx.quadraticCurveTo(x - 1.2, 13, tipX, tipY);
    ctx.quadraticCurveTo(x + 1.4, 13, x + 2, 9.5);
    ctx.closePath();
    ctx.fill();
  }
}

function shade(frame: number, burning: boolean): Texture {
  return paint(18, 18, (ctx) => {
    if (burning) {
      ctx.shadowColor = EMBER;
      ctx.shadowBlur = 24;
    }
    ctx.fillStyle = burning ? '#2a1420' : INK_CSS;
    shadeBody(ctx, frame);
  });
}

function eyes(): Texture {
  return paint(18, 18, (ctx) => {
    ctx.shadowColor = '#cfe8ff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#eef8ff';
    for (const x of [6.9, 11.6]) {
      ctx.beginPath();
      ctx.ellipse(x, 6.8, 1.05, 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function moth(frame: number): Texture {
  return paint(9, 7, (ctx) => {
    ctx.fillStyle = 'rgba(214,204,178,0.85)';
    const up = frame === 0;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        4.5 + side * 2.2,
        up ? 2.6 : 4,
        2.3,
        up ? 1.9 : 1.3,
        side * (up ? 0.5 : 0.15),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = INK_CSS;
    ctx.beginPath();
    ctx.ellipse(4.5, 4.3, 0.9, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// --- Svetlá a predmety ---
function firefly(): Texture {
  return paint(3, 3, (ctx) => glowDot(ctx, 1.5, 1.5, 1.5, '#ffffe8', '#d9f56a'), 12);
}

function spark(): Texture {
  return paint(5, 5, (ctx) => glowDot(ctx, 2.5, 2.5, 2.5, '#fffbe0', GOLD), 10);
}

function crystal(): Texture {
  return paint(9, 11, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 9, 11);
    g.addColorStop(0, '#f0ffff');
    g.addColorStop(0.5, '#8ff0ff');
    g.addColorStop(1, '#2f88b8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(4.5, 0.4);
    ctx.lineTo(8.5, 4.6);
    ctx.lineTo(4.5, 10.6);
    ctx.lineTo(0.5, 4.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    line(ctx, 0.5, 4.6, 8.5, 4.6, 0.4);
    line(ctx, 4.5, 0.4, 3.2, 4.6, 0.4);
    line(ctx, 3.2, 4.6, 4.5, 10.6, 0.4);
  });
}

function lantern(lit: boolean): Texture {
  return paint(10, 12, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.beginPath();
    ctx.moveTo(3.2, 0.4);
    ctx.lineTo(6.8, 0.4);
    ctx.lineTo(8, 2.1);
    ctx.lineTo(2, 2.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(2.3, 2, 5.4, 6.4);
    ctx.fillRect(3, 8.2, 4, 1);
    ctx.fillRect(4.3, 9, 1.4, 3);
    if (lit) {
      const g = ctx.createLinearGradient(0, 3, 0, 7.4);
      g.addColorStop(0, GLOW);
      g.addColorStop(1, GOLD);
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#1c2232';
    ctx.fillRect(3.3, 3.1, 3.4, 4.3);
  });
}

function post(height: number): Texture {
  return paint(
    4,
    Math.max(1, height),
    (ctx) => {
      ctx.fillStyle = INK_CSS;
      ctx.fillRect(1.2, 0, 1.6, height);
      ctx.fillRect(0.4, height - 1.4, 3.2, 1.4);
    },
    4,
  );
}

function flame(variant: number): Texture {
  return paint(14, 18, (ctx) => {
    const layers: [number, number, string][] = [
      [6.2, 17, EMBER],
      [4.4, 13, GOLD],
      [2.4, 8.5, GLOW],
    ];
    for (const [w, h, color] of layers) {
      const tip = 7 + Math.sin(variant * 2.1 + w) * 1.6;
      const bottom = 17.6;
      const top = bottom - h;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(tip, top);
      ctx.bezierCurveTo(7 + w, top + h * 0.45, 7 + w * 0.95, bottom, 7, bottom);
      ctx.bezierCurveTo(7 - w * 0.95, bottom, 7 - w, top + h * 0.45, tip, top);
      ctx.fill();
    }
  });
}

function campfire(): Texture {
  return paint(24, 10, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.strokeStyle = INK_CSS;
    line(ctx, 4, 9, 15, 4.2, 2.2);
    line(ctx, 16, 9, 6, 4.2, 2.2);
    for (const [x, r] of [
      [1.8, 1.8],
      [5, 1.5],
      [8.5, 1.7],
      [12, 1.4],
      [15.2, 1.8],
      [18.4, 1.5],
    ] as const)
      circle(ctx, x, 10 - r * 0.7, r);
  });
}

function sign(): Texture {
  return paint(14, 16, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.fillRect(6.2, 8, 1.6, 8);
    ctx.beginPath();
    ctx.roundRect(1, 1, 12, 7.6, 1);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(7, 4.8, 1.2, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      line(
        ctx,
        7 + Math.cos(a) * 1.9,
        4.8 + Math.sin(a) * 1.9,
        7 + Math.cos(a) * 2.8,
        4.8 + Math.sin(a) * 2.8,
        0.55,
      );
    }
  });
}

function lightTile(): Texture {
  return paint(TILE, TILE, (ctx) => {
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 20;
    const g = ctx.createLinearGradient(0, 0, 0, 5);
    g.addColorStop(0, GLOW);
    g.addColorStop(1, '#ffcf7a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(0.2, 0.6, 15.6, 4.4, 1.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,214,140,0.7)';
    for (const [x, len] of [
      [3.5, 2.2],
      [8.5, 3.2],
      [12.5, 1.4],
    ] as const) {
      ctx.beginPath();
      ctx.roundRect(x - 0.5, 4.5, 1, len, 0.5);
      ctx.fill();
    }
  });
}

function water(frame: number, world: World): Texture {
  const style = WORLDS[world];
  return paint(TILE, 4, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, 4);
    for (let x = 0; x <= TILE; x += 0.5)
      ctx.lineTo(x, 1.4 + Math.sin(((x + frame * 4) * Math.PI) / 8) * 0.6);
    ctx.lineTo(TILE, 4);
    ctx.closePath();
    ctx.fillStyle = css(style.water);
    ctx.fill();
    ctx.strokeStyle = style.waterLine;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = 0; x <= TILE; x += 0.5) {
      const y = 1.4 + Math.sin(((x + frame * 4) * Math.PI) / 8) * 0.6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

/** Skákacia huba: svietiaci klobúk (pri odraze stlačený). */
function bounce(squash: boolean): Texture {
  return paint(TILE, TILE, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.fillRect(6.2, squash ? 7 : 6, 3.6, 10);
    const capY = squash ? 7.5 : 5.5;
    const g = ctx.createRadialGradient(8, capY - 2, 0.5, 8, capY, 9);
    g.addColorStop(0, '#ffd8ff');
    g.addColorStop(0.5, '#e070ff');
    g.addColorStop(1, '#7a2cc0');
    ctx.shadowColor = '#e070ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(8, capY, 8, squash ? 3.2 : 4.6, 0, Math.PI, 0);
    ctx.lineTo(16, capY + 0.8);
    ctx.lineTo(0, capY + 0.8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,240,255,0.85)';
    for (const [x, y, r] of [
      [4.5, capY - 1.8, 0.9],
      [9, capY - 3, 0.7],
      [12, capY - 1.2, 0.8],
    ] as const)
      circle(ctx, x, y + (squash ? 0.8 : 0), r);
  });
}

/** Cencúľ: priesvitný ľad (zachytáva svetlo), hrot dole. */
function icicle(): Texture {
  return paint(6, 14, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 6, 0);
    g.addColorStop(0, 'rgba(170,215,240,0.85)');
    g.addColorStop(0.5, 'rgba(235,250,255,0.95)');
    g.addColorStop(1, 'rgba(140,190,225,0.85)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0.3, 0);
    ctx.lineTo(5.7, 0);
    ctx.lineTo(3.2, 13.8);
    ctx.closePath();
    ctx.fill();
  });
}

/** Pohyblivá plošina: čierna doska so žiariacimi runami. */
function mover(): Texture {
  return paint(32, 6, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.beginPath();
    ctx.roundRect(0.2, 0.2, 31.6, 5, 1.6);
    ctx.fill();
    ctx.fillStyle = '#8ff0ff';
    ctx.shadowColor = '#8ff0ff';
    ctx.shadowBlur = 10;
    for (const x of [6, 16, 26]) circle(ctx, x, 2.7, 0.8);
  });
}

function crumble(): Texture {
  return paint(TILE, TILE, (ctx) => {
    ctx.fillStyle = '#0e1019';
    ctx.beginPath();
    ctx.roundRect(0.2, 0.2, 15.6, 15.6, 1.2);
    ctx.fill();
    ctx.strokeStyle = '#3c4660';
    ctx.lineWidth = 0.55;
    for (const crack of [
      [4, 0.5, 5, 3.5, 6.2, 6, 5.2, 8.5],
      [11, 0.5, 10.2, 3.8, 11.8, 6.5, 12.6, 9],
      [8, 8.5, 8.8, 11.5, 7.6, 15.5],
      [2, 10, 4, 12.5, 3.5, 15.5],
    ]) {
      ctx.beginPath();
      ctx.moveTo(crack[0]!, crack[1]!);
      for (let i = 2; i < crack.length; i += 2) ctx.lineTo(crack[i]!, crack[i + 1]!);
      ctx.stroke();
    }
  });
}

function moon(): Texture {
  return paint(
    26,
    26,
    (ctx) => {
      glowDot(ctx, 13, 13, 13, 'rgba(230,236,255,0.5)', 'rgba(200,215,255,0.18)');
      ctx.fillStyle = '#e6ecff';
      circle(ctx, 13, 13, 8.5);
      ctx.fillStyle = '#cdd6f2';
      circle(ctx, 10.5, 11, 1.8);
      circle(ctx, 15.5, 15, 1.2);
      circle(ctx, 14.5, 9.5, 0.9);
    },
    6,
  );
}

// --- Svety ---
interface WorldStyle {
  sky: string[];
  stars: string;
  far: string;
  farShape: 'hills' | 'jagged' | 'peaks' | 'ruins';
  fog: string;
  near: string;
  nearShape: 'trees' | 'stalagmites' | 'deadtrees' | 'pines' | 'pillars' | 'spires';
  water: number;
  waterLine: string;
  top: 'grass' | 'moss' | 'reeds' | 'snow' | 'stone' | 'spikes';
  under: 'roots' | 'stalactites' | 'icicles' | 'chains';
  info: WorldInfo;
}

const WORLDS: Record<World, WorldStyle> = {
  forest: {
    sky: ['#120c2a', '#2a2350', '#3d5a7c', '#86b0aa'],
    stars: 'rgba(235,235,255,0.75)',
    far: '#1a2b44',
    farShape: 'hills',
    fog: 'rgba(110,150,170,0.45)',
    near: '#0b1322',
    nearShape: 'trees',
    water: 0x0b2a38,
    waterLine: '#7fd0e0',
    top: 'grass',
    under: 'roots',
    info: { darkness: 0.8, moon: true, ambient: 'motes' },
  },
  caves: {
    sky: ['#04070f', '#081628', '#0f3346', '#1d5a68'],
    stars: 'rgba(120,220,230,0.6)',
    far: '#0c1b2b',
    farShape: 'jagged',
    fog: 'rgba(40,110,130,0.45)',
    near: '#060d17',
    nearShape: 'stalagmites',
    water: 0x0b2a38,
    waterLine: '#7fd0e0',
    top: 'moss',
    under: 'stalactites',
    info: { darkness: 0.88, moon: false, ambient: 'motes' },
  },
  swamp: {
    sky: ['#081210', '#142a24', '#2a4c40', '#7a9c6c'],
    stars: 'rgba(200,255,190,0.55)',
    far: '#13261d',
    farShape: 'hills',
    fog: 'rgba(130,180,120,0.5)',
    near: '#07110c',
    nearShape: 'deadtrees',
    water: 0x0e2616,
    waterLine: '#9ad08a',
    top: 'reeds',
    under: 'roots',
    info: { darkness: 0.84, moon: true, ambient: 'wisps' },
  },
  ice: {
    sky: ['#0b1530', '#1d3864', '#5682ac', '#c4dcee'],
    stars: 'rgba(240,250,255,0.8)',
    far: '#284262',
    farShape: 'peaks',
    fog: 'rgba(200,225,245,0.45)',
    near: '#0e192b',
    nearShape: 'pines',
    water: 0x12304a,
    waterLine: '#cfeeff',
    top: 'snow',
    under: 'icicles',
    info: { darkness: 0.74, moon: true, ambient: 'snow' },
  },
  tower: {
    sky: ['#09070f', '#1a162c', '#372d4c', '#66566c'],
    stars: 'rgba(230,220,255,0.6)',
    far: '#151128',
    farShape: 'ruins',
    fog: 'rgba(140,120,160,0.4)',
    near: '#09070f',
    nearShape: 'pillars',
    water: 0x16122a,
    waterLine: '#b0a0d0',
    top: 'stone',
    under: 'chains',
    info: { darkness: 0.85, moon: true, ambient: 'dust' },
  },
  abyss: {
    sky: ['#040106', '#170610', '#3a0d1a', '#762824'],
    stars: 'rgba(255,140,110,0.6)',
    far: '#18050e',
    farShape: 'jagged',
    fog: 'rgba(160,50,40,0.4)',
    near: '#090205',
    nearShape: 'spires',
    water: 0x2a0812,
    waterLine: '#ff7a5a',
    top: 'spikes',
    under: 'stalactites',
    info: { darkness: 0.92, moon: false, ambient: 'embers' },
  },
  storm: {
    sky: ['#040509', '#10141f', '#222a3a', '#46506a'],
    stars: 'rgba(200,210,235,0.25)',
    far: '#141a28',
    farShape: 'jagged',
    fog: 'rgba(120,135,165,0.35)',
    near: '#070a12',
    nearShape: 'deadtrees',
    water: 0x0c1622,
    waterLine: '#a8c0e0',
    top: 'grass',
    under: 'roots',
    info: { darkness: 0.9, moon: false, ambient: 'rain' },
  },
};

// --- Pozadie ---
function sky(world: World): Texture {
  const style = WORLDS[world];
  return paint(
    320,
    240,
    (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 240);
      style.sky.forEach((c, i) => g.addColorStop(i / (style.sky.length - 1), c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 320, 240);
      // Hviezdy (v jaskyni kryštáliky, v priepasti iskry).
      for (let i = 0; i < 70; i++) {
        const x = pixelNoise(i, 1, 201) * 320;
        const y = pixelNoise(i, 2, 201) * 170;
        const r = 0.3 + pixelNoise(i, 3, 201) * 0.6;
        ctx.fillStyle = style.stars;
        circle(ctx, x, y, r);
      }
    },
    3,
  );
}

/**
 * Spodný okraj vrstvy nechá priehľadný: textúra sa opakuje aj zvisle a vyhladzovanie by inak
 * prenieslo plný spodok na horný okraj (tenká čiara cez oblohu). Spodok je mimo obrazovky.
 */
function seamless(ctx: Ctx, w: number, h: number): void {
  ctx.clearRect(0, h - 1.5, w, 1.5);
}

/** Opakovateľný obrys: tvar sa nakreslí aj posunutý o šírku, aby sa okraje napojili. */
function wrapped(width: number, draw: (offset: number) => void): void {
  for (const offset of [-width, 0, width]) draw(offset);
}

function far(world: World): Texture {
  const W = 480;
  const H = 110;
  const style = WORLDS[world];
  return paint(
    W,
    H,
    (ctx) => {
      ctx.fillStyle = style.far;
      if (style.farShape === 'peaks') {
        // Štíty so snehovými čiapkami.
        const peaks = 7;
        for (let i = 0; i < peaks; i++) {
          const cx = (i + pixelNoise(i, 0, 231) * 0.5) * (W / peaks);
          const h = H * (0.55 + pixelNoise(i, 1, 231) * 0.4);
          const w = 45 + pixelNoise(i, 2, 231) * 30;
          wrapped(W, (o) => {
            ctx.fillStyle = style.far;
            ctx.beginPath();
            ctx.moveTo(cx + o - w, H);
            ctx.lineTo(cx + o, H - h);
            ctx.lineTo(cx + o + w, H);
            ctx.fill();
            ctx.fillStyle = 'rgba(220,236,250,0.75)';
            ctx.beginPath();
            ctx.moveTo(cx + o, H - h);
            ctx.lineTo(cx + o + w * 0.22, H - h * 0.78);
            ctx.lineTo(cx + o + w * 0.08, H - h * 0.8);
            ctx.lineTo(cx + o - w * 0.05, H - h * 0.74);
            ctx.lineTo(cx + o - w * 0.2, H - h * 0.8);
            ctx.closePath();
            ctx.fill();
          });
        }
      } else if (style.farShape === 'ruins') {
        // Panoráma rozpadnutých veží a cimburia s občasným svietiacim oknom.
        for (let i = 0; i < 12; i++) {
          const cx = (i + pixelNoise(i, 0, 241) * 0.6) * (W / 12);
          const h = H * (0.35 + pixelNoise(i, 1, 241) * 0.55);
          const w = 14 + pixelNoise(i, 2, 241) * 18;
          wrapped(W, (o) => {
            const x = cx + o;
            ctx.fillStyle = style.far;
            ctx.fillRect(x - w / 2, H - h, w, h);
            for (let k = 0; k < 4; k++)
              if (k % 2 === 0) ctx.fillRect(x - w / 2 + (k * w) / 4, H - h - 4, w / 4, 4);
            if (pixelNoise(i, 3, 241) < 0.6) {
              ctx.fillStyle = 'rgba(255,200,120,0.45)';
              ctx.beginPath();
              ctx.roundRect(x - 1.5, H - h + 8, 3, 6, [1.5, 1.5, 0, 0]);
              ctx.fill();
            }
          });
        }
        ctx.fillStyle = style.far;
        ctx.fillRect(0, H * 0.75, W, H * 0.25);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) {
          const a = (x / W) * Math.PI * 2;
          const h =
            style.farShape === 'jagged'
              ? H * (0.5 + 0.18 * Math.sin(a * 3 + 1) + 0.12 * Math.abs(Math.sin(a * 11 + 2)))
              : H * (0.45 + 0.15 * Math.sin(a * 2 + 1) + 0.08 * Math.sin(a * 5 + 2));
          ctx.lineTo(x, H - h);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
      }
      // Hmla pri zemi.
      ctx.globalCompositeOperation = 'source-atop';
      const fog = ctx.createLinearGradient(0, H * 0.4, 0, H);
      fog.addColorStop(0, 'rgba(0,0,0,0)');
      fog.addColorStop(1, style.fog);
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);
      seamless(ctx, W, H);
    },
    3,
  );
}

function spruce(ctx: Ctx, x: number, base: number, h: number, snow: boolean): void {
  ctx.fillRect(x - 1.2, base - h * 0.55, 2.4, h * 0.55);
  for (let layer = 0; layer < 4; layer++) {
    const top = base - h + layer * h * 0.17;
    const lw = 4 + layer * 3.4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.quadraticCurveTo(x + lw * 0.5, top + h * 0.12, x + lw, top + h * 0.24);
    ctx.lineTo(x - lw, top + h * 0.24);
    ctx.quadraticCurveTo(x - lw * 0.5, top + h * 0.12, x, top);
    ctx.fill();
    if (snow) {
      const fill = ctx.fillStyle;
      ctx.fillStyle = 'rgba(225,240,252,0.8)';
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.quadraticCurveTo(x + lw * 0.3, top + h * 0.06, x + lw * 0.55, top + h * 0.11);
      ctx.lineTo(x - lw * 0.55, top + h * 0.11);
      ctx.quadraticCurveTo(x - lw * 0.3, top + h * 0.06, x, top);
      ctx.fill();
      ctx.fillStyle = fill;
    }
  }
}

function near(world: World): Texture {
  const W = 400;
  const H = 130;
  const style = WORLDS[world];
  return paint(
    W,
    H,
    (ctx) => {
      ctx.fillStyle = style.near;
      const shape = style.nearShape;
      if (shape === 'stalagmites' || shape === 'spires') {
        // Stalagmity (v priepasti ostré veže).
        const n = shape === 'spires' ? 16 : 22;
        for (let i = 0; i < n; i++) {
          const cx = (i + pixelNoise(i, 0, 211) * 0.7) * (W / n);
          const h = H * (0.3 + pixelNoise(i, 1, 211) * 0.65);
          const w = (shape === 'spires' ? 3 : 4) + pixelNoise(i, 2, 211) * 8;
          wrapped(W, (o) => {
            ctx.beginPath();
            ctx.moveTo(cx + o - w, H);
            if (shape === 'spires') {
              ctx.lineTo(cx + o - w * 0.2, H - h * 0.6);
              ctx.lineTo(cx + o, H - h);
              ctx.lineTo(cx + o + w * 0.25, H - h * 0.55);
            } else {
              ctx.quadraticCurveTo(cx + o - w * 0.3, H - h * 0.5, cx + o, H - h);
              ctx.quadraticCurveTo(cx + o + w * 0.3, H - h * 0.5, cx + o + w, H);
            }
            ctx.lineTo(cx + o + w, H);
            ctx.fill();
          });
        }
        if (shape === 'spires') {
          // Vznášajúce sa balvany.
          for (let i = 0; i < 5; i++) {
            const cx = pixelNoise(i, 5, 213) * W;
            const cy = H * (0.15 + pixelNoise(i, 6, 213) * 0.35);
            const r = 4 + pixelNoise(i, 7, 213) * 6;
            wrapped(W, (o) => {
              ctx.beginPath();
              ctx.moveTo(cx + o - r, cy);
              ctx.lineTo(cx + o + r, cy - r * 0.3);
              ctx.lineTo(cx + o + r * 0.4, cy + r * 1.2);
              ctx.closePath();
              ctx.fill();
            });
          }
        }
      } else if (shape === 'deadtrees') {
        // Holé stromy s visiacim machom a pálky v trstine.
        for (let i = 0; i < 12; i++) {
          const cx = (i + pixelNoise(i, 0, 251) * 0.6) * (W / 12);
          const h = H * (0.5 + pixelNoise(i, 1, 251) * 0.45);
          wrapped(W, (o) => {
            const x = cx + o;
            ctx.strokeStyle = style.near;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, H);
            ctx.quadraticCurveTo(x - 3, H - h * 0.5, x + 2, H - h);
            ctx.stroke();
            ctx.lineWidth = 1.4;
            for (let b = 0; b < 4; b++) {
              const by = H - h * (0.45 + b * 0.13);
              const dir = b % 2 === 0 ? 1 : -1;
              const len = 8 + pixelNoise(i, b + 2, 251) * 10;
              ctx.beginPath();
              ctx.moveTo(x, by);
              ctx.quadraticCurveTo(x + dir * len * 0.6, by - 4, x + dir * len, by - 9);
              ctx.stroke();
              // Mach.
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(x + dir * len * 0.6, by - 3);
              ctx.lineTo(x + dir * len * 0.6, by + 6 + pixelNoise(i, b, 252) * 8);
              ctx.stroke();
              ctx.lineWidth = 1.4;
            }
          });
        }
        for (let i = 0; i < 40; i++) {
          const x = pixelNoise(i, 8, 253) * W;
          const h = 10 + pixelNoise(i, 9, 253) * 18;
          wrapped(W, (o) => {
            ctx.fillRect(x + o - 0.4, H - h, 0.8, h);
            if (pixelNoise(i, 10, 253) < 0.5) {
              ctx.beginPath();
              ctx.ellipse(x + o, H - h + 2, 1.1, 2.6, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }
      } else if (shape === 'pillars') {
        // Stĺporadie s oblúkmi, niektoré stĺpy zlomené.
        const n = 8;
        for (let i = 0; i < n; i++) {
          const cx = i * (W / n) + 10;
          const broken = pixelNoise(i, 1, 261) < 0.35;
          const h = broken ? H * (0.35 + pixelNoise(i, 2, 261) * 0.3) : H * 0.92;
          wrapped(W, (o) => {
            const x = cx + o;
            ctx.fillRect(x - 5, H - h, 10, h);
            ctx.fillRect(x - 7, H - h, 14, 3);
            ctx.fillRect(x - 7, H - 6, 14, 6);
            if (!broken) {
              // Oblúk k ďalšiemu stĺpu.
              ctx.beginPath();
              ctx.moveTo(x + 5, H - h);
              ctx.lineTo(x + W / n - 5, H - h);
              ctx.lineTo(x + W / n - 5, H - h + 14);
              ctx.quadraticCurveTo(x + W / n / 2, H - h - 6, x + 5, H - h + 14);
              ctx.fill();
            }
          });
        }
        // Visiace reťaze.
        ctx.strokeStyle = style.near;
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 6; i++) {
          const x = pixelNoise(i, 4, 262) * W;
          const len = 20 + pixelNoise(i, 5, 262) * 40;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, len);
          ctx.stroke();
        }
      } else {
        // Smreky a okrúhle koruny listnáčov (v snehu zasnežené smreky).
        const snow = shape === 'pines';
        for (let i = 0; i < 18; i++) {
          const cx = (i + pixelNoise(i, 0, 221) * 0.6) * (W / 18);
          const h = H * (0.55 + pixelNoise(i, 1, 221) * 0.4);
          const round = !snow && pixelNoise(i, 3, 221) < 0.3;
          wrapped(W, (o) => {
            const x = cx + o;
            if (round) {
              ctx.fillRect(x - 1.2, H - h * 0.55, 2.4, h * 0.55);
              circle(ctx, x, H - h * 0.75, h * 0.2);
              circle(ctx, x - h * 0.12, H - h * 0.62, h * 0.15);
              circle(ctx, x + h * 0.13, H - h * 0.64, h * 0.16);
              return;
            }
            spruce(ctx, x, H, h, snow);
          });
        }
      }
      ctx.fillStyle = style.near;
      ctx.fillRect(0, H * 0.9, W, H * 0.1);
      if (shape === 'pines') {
        ctx.fillStyle = 'rgba(225,240,252,0.7)';
        ctx.fillRect(0, H * 0.9, W, 1.5);
      }
      seamless(ctx, W, H);
    },
    3,
  );
}

// --- Terén (PixiJS vektory) ---
const SNOW = 0xe2effa;
const ICE = 0xcfeeff;

function terrain(level: Level): Container {
  const g = new Graphics();
  const style = WORLDS[level.world];
  const solid = (c: number, r: number) => {
    const t = tileAt(level, c, r);
    return t === Tile.Ground || t === Tile.Ice;
  };

  // Zem po vodorovných úsekoch (s presahom, aby medzi políčkami neboli švy).
  for (let row = 0; row < level.height; row++) {
    let start = -1;
    for (let col = 0; col <= level.width; col++) {
      const is = col < level.width && solid(col, row);
      if (is && start < 0) start = col;
      if (!is && start >= 0) {
        g.rect(start * TILE - 0.3, row * TILE - 0.3, (col - start) * TILE + 0.6, TILE + 0.6).fill(
          INK,
        );
        start = -1;
      }
    }
  }

  // Svetlé vrstvy (sneh, ľad) sa kreslia až nakoniec, nad čiernu zem.
  const light = new Graphics();
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      const x0 = col * TILE;
      const y0 = row * TILE;
      const tile = tileAt(level, col, row);
      if (tile === Tile.Ground || tile === Tile.Ice) {
        if (!solid(col, row - 1) && row > 0 && tileAt(level, col, row - 1) !== Tile.Bounce)
          surface(g, light, style, tile === Tile.Ice, col, row);
        if (
          row + 1 < level.height &&
          !solid(col, row + 1) &&
          tileAt(level, col, row + 1) !== Tile.Water
        )
          underside(g, light, style, col, row);
        if (style.top !== 'stone')
          for (const side of [-1, 1]) {
            if (solid(col + side, row) || pixelNoise(col, row + side, 313) > 0.4) continue;
            // Výčnelok na boku.
            const sx = side < 0 ? x0 : x0 + TILE;
            g.ellipse(
              sx,
              y0 + 4 + pixelNoise(col, row, 314) * 8,
              1.2,
              2 + pixelNoise(row, col, 315) * 2,
            ).fill(INK);
          }
      } else if (tile === Tile.Bounce) {
        // Zem pod hubou (klobúk je sprite nad povrchom).
        g.rect(x0 - 0.3, y0 + 4, TILE + 0.6, TILE - 3.7).fill(INK);
      } else if (tile === Tile.Ledge) {
        g.roundRect(x0 - 0.2, y0, TILE + 0.4, 3, 0.8).fill(INK);
        if (tileAt(level, col - 1, row) !== Tile.Ledge) g.rect(x0 + 1, y0 + 2, 1, 4).fill(INK);
        if (tileAt(level, col + 1, row) !== Tile.Ledge)
          g.rect(x0 + TILE - 2, y0 + 2, 1, 4).fill(INK);
        if (style.top === 'snow') light.roundRect(x0, y0 - 1, TILE, 1.6, 0.8).fill(SNOW);
      } else if (tile === Tile.Thorns) {
        const points: number[] = [x0, y0 + TILE];
        for (let i = 0; i <= 6; i++) {
          const x = x0 + (i / 6) * TILE;
          const peak = 6 + pixelNoise(col * 7 + i, row, 316) * 4;
          points.push(x - 1.3, y0 + TILE - 3, x, y0 + TILE - peak, x + 1.3, y0 + TILE - 3);
        }
        points.push(x0 + TILE, y0 + TILE);
        g.poly(points).fill(INK);
      } else if (tile === Tile.Water) {
        const top = tileAt(level, col, row - 1) !== Tile.Water;
        g.rect(x0 - 0.2, y0 + (top ? 3 : 0), TILE + 0.4, top ? TILE - 3 : TILE).fill({
          color: style.water,
          alpha: 0.95,
        });
      }
    }
  }

  // Svietiace hríbiky (farbu majú, lebo svietia).
  for (const d of decorOf(level)) {
    if (d.kind !== 'mushroom' || style.top === 'snow' || style.top === 'stone') continue;
    g.rect(d.x - 0.3, d.y - 2.4, 0.8, 2.4).fill(INK);
    g.ellipse(d.x + 0.1, d.y - 2.6, 1.8, 1).fill(level.world === 'abyss' ? 0xff7a5a : 0x6cf0e0);
  }
  const c = new Container();
  c.addChild(g, light);
  return c;
}

/** Vrch zeme podľa sveta: tráva, mach, trstina, sneh, kameň alebo ostne; ľad sa leskne. */
function surface(
  g: Graphics,
  light: Graphics,
  style: WorldStyle,
  ice: boolean,
  col: number,
  row: number,
): void {
  const x0 = col * TILE;
  const y0 = row * TILE;
  if (ice) {
    light.rect(x0 - 0.3, y0 - 0.2, TILE + 0.6, 1.8).fill({ color: ICE, alpha: 0.95 });
    light.rect(x0 + 3, y0 + 2.4, 5, 0.5).fill({ color: ICE, alpha: 0.5 });
    return;
  }
  if (style.top === 'stone') {
    // Kamenné dlaždice: rovný vrch s občasnou zubatou rímsou.
    if (pixelNoise(col, row, 321) < 0.25) g.rect(x0 + 2, y0 - 2, 5, 2).fill(INK);
    return;
  }
  for (let i = 0; i < 3; i++) {
    const bx = x0 + 2 + pixelNoise(col * 3 + i, row, 301) * 12;
    g.ellipse(
      bx,
      y0,
      2 + pixelNoise(col, row * 3 + i, 302) * 3,
      0.8 + pixelNoise(col, i, 303) * 1.2,
    ).fill(INK);
  }
  if (style.top === 'snow') {
    light.roundRect(x0 - 0.4, y0 - 1.6, TILE + 0.8, 3, 1.4).fill(SNOW);
    if (pixelNoise(col, row, 322) < 0.5)
      light.ellipse(x0 + 4 + pixelNoise(col, row, 323) * 8, y0 - 1.4, 3, 1.4).fill(SNOW);
    return;
  }
  if (style.top === 'spikes') {
    for (let i = 0; i < 3; i++) {
      const bx = x0 + 2 + pixelNoise(col * 5 + i, row, 324) * 12;
      const h = 2 + pixelNoise(col, row * 5 + i, 325) * 4;
      g.poly([bx - 1.2, y0 + 0.5, bx + 1.2, y0 + 0.5, bx + 0.3, y0 - h]).fill(INK);
    }
    return;
  }
  const reeds = style.top === 'reeds';
  const blades = style.top === 'moss' ? 2 : reeds ? 5 : 6;
  for (let i = 0; i < blades; i++) {
    const bx = x0 + pixelNoise(col * 7 + i, row, 304) * TILE;
    const n = pixelNoise(col, row * 7 + i, 305);
    const h = style.top === 'moss' ? 1 + n * 1.5 : reeds ? 3 + n * 6 : 1.5 + n * 3.5;
    const lean = (pixelNoise(col + i, row, 306) - 0.5) * 2;
    g.poly([bx - 0.6, y0 + 0.5, bx + 0.6, y0 + 0.5, bx + lean, y0 - h]).fill(INK);
    if (reeds && n > 0.6) g.ellipse(bx + lean * 0.8, y0 - h + 1.5, 0.9, 2).fill(INK);
  }
}

/** Spodok zeme nad prázdnom: korienky, krápniky, cencúliky alebo reťaze. */
function underside(
  g: Graphics,
  light: Graphics,
  style: WorldStyle,
  col: number,
  row: number,
): void {
  const x0 = col * TILE;
  const y = row * TILE + TILE;
  if (style.under === 'stalactites' || style.under === 'icicles') {
    if (pixelNoise(col, row, 307) >= 0.6) return;
    const cx = x0 + 3 + pixelNoise(col, row, 308) * 10;
    const len = 4 + pixelNoise(col, row, 309) * 10;
    const w = 1.5 + pixelNoise(col, row, 310) * 1.5;
    // V ľadovom svete len drobná námraza, aby sa nepliesla s padajúcimi cencúľmi.
    if (style.under === 'icicles')
      light
        .poly([cx - w * 0.5, y, cx + w * 0.5, y, cx, y + 1.5 + len * 0.15])
        .fill({ color: ICE, alpha: 0.45 });
    else g.poly([cx - w, y, cx + w, y, cx, y + len]).fill(INK);
    return;
  }
  if (style.under === 'chains') {
    if (pixelNoise(col, row, 326) >= 0.25) return;
    const cx = x0 + 4 + pixelNoise(col, row, 327) * 8;
    const len = 6 + pixelNoise(col, row, 328) * 14;
    g.moveTo(cx, y)
      .lineTo(cx, y + len)
      .stroke({ width: 0.8, color: INK });
    g.circle(cx, y + len + 1, 1.3).stroke({ width: 0.6, color: INK });
    return;
  }
  for (let i = 0; i < 2; i++) {
    const rx = x0 + 3 + pixelNoise(col * 2 + i, row, 311) * 10;
    const len = 2 + pixelNoise(col, row * 2 + i, 312) * 5;
    g.moveTo(rx, y)
      .quadraticCurveTo(rx + 1.5, y + len * 0.6, rx - 0.5, y + len)
      .stroke({ width: 0.7, color: INK });
  }
}

function dot(color: string, size: number): Texture {
  return paint(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = color;
      circle(ctx, size / 2, size / 2, size / 2);
    },
    8,
  );
}

export const vectorArt: Art = {
  dot,
  info: (world) => WORLDS[world].info,
  bounce,
  icicle,
  mover,
  terrain,
  player,
  shade,
  eyes,
  firefly,
  crystal,
  lantern,
  post,
  flame,
  campfire,
  sign,
  lightTile,
  moth,
  spark,
  water,
  crumble,
  moon,
  sky,
  far,
  near,
};
