import { CanvasSource, Container, Graphics, Texture } from 'pixi.js';
import { TILE, Tile, tileAt, type Level, type World } from '@/game/level';
import type { Art, WorldInfo } from './art';
import { drawDoctor, type DoctorPose } from './doctor';
import { decorOf, noise as pixelNoise, type PlayerFrame } from './common';

/**
 * Siluetový štýl (v duchu hier Limbo a Inside): popredie je čierne, pozadie tlmene žiari
 * a farbu má len to, čo svieti — fakľa, uhlíky, sviečky, oči prízrakov a nakazených.
 */
const INK = 0x05060b;
const INK_CSS = '#05060b';
const GLOW = '#fff0c0';
const GOLD = '#ffc24a';
const EMBER = '#ff7a2a';

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

// --- Morový lekár ---
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

/** Ako viaje plášť pri jednotlivých pohyboch. */
const CLOAK: Record<PlayerFrame, number> = {
  idle: 0,
  run0: 0.8,
  run1: 0.6,
  run2: 0.9,
  run3: 0.6,
  jump: -0.6,
  fall: 1,
};

function player(frame: PlayerFrame | 'breathe'): Texture {
  const pose = doctorPose(frame);
  return paint(14, 17, (ctx) => drawDoctor(ctx, pose));
}

function doctorPose(frame: PlayerFrame | 'breathe'): DoctorPose {
  const f = frame === 'breathe' ? 'idle' : frame;
  return {
    legs: LEGS[f]!,
    legEnd: f === 'jump' ? 14.6 : 15.4,
    dy: frame === 'breathe' ? 0.35 : 0,
    wave: CLOAK[f]!,
  };
}

/** Palica morového lekára: tenká, s hlavicou; úchop je hore (y = 1.5). */
function cane(): Texture {
  return paint(3, 15, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.strokeStyle = INK_CSS;
    line(ctx, 1.5, 1.2, 1.5, 14.5, 0.55);
    circle(ctx, 1.5, 1, 0.85);
  });
}

// --- Prízraky, nakazení a potkany ---
/** Prízrak: kapucňa a potrhaný rubáš, ktorý sa stráca v cárach. */
function shadeBody(ctx: Ctx, frame: number): void {
  ctx.beginPath();
  ctx.moveTo(9, 0.6);
  ctx.quadraticCurveTo(13.8, 2.6, 14, 8.2);
  ctx.quadraticCurveTo(14.2, 10.5, 15.2, 12);
  ctx.lineTo(2.8, 12);
  ctx.quadraticCurveTo(3.8, 10.5, 4, 8.2);
  ctx.quadraticCurveTo(4.2, 2.6, 9, 0.6);
  ctx.fill();
  for (let i = -2; i <= 2; i++) {
    const x = 9 + i * 2.4;
    const tipX = x + i * 0.7 + Math.sin(frame * 2.1 + i * 1.7) * 1.4;
    const tipY = 16.6 + Math.cos(frame * 1.7 + i) * 0.9 - Math.abs(i) * 0.9;
    ctx.beginPath();
    ctx.moveTo(x - 1.5, 11);
    ctx.quadraticCurveTo(x - 0.8, 14, tipX, tipY);
    ctx.quadraticCurveTo(x + 1, 14, x + 1.5, 11);
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
    ctx.fillStyle = burning ? '#2a1410' : INK_CSS;
    shadeBody(ctx, frame);
    // Tvár v kapucni je ešte čiernejšia diera.
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(9.2, 7, 3.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function eyes(): Texture {
  return paint(18, 18, (ctx) => {
    ctx.shadowColor = '#d8e4ff';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#eef2ff';
    for (const x of [7.6, 10.9]) {
      ctx.beginPath();
      ctx.ellipse(x, 6.9, 0.85, 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Nakazený: zhrbená postava s rukami ovisnutými dopredu, v handrách; 4 snímky chôdze. */
function ghoul(frame: number, burning: boolean): Texture {
  return paint(14, 17, (ctx) => {
    if (burning) {
      ctx.shadowColor = EMBER;
      ctx.shadowBlur = 20;
    }
    ctx.fillStyle = burning ? '#2a1410' : INK_CSS;
    ctx.strokeStyle = ctx.fillStyle;
    const bob = frame % 2 === 0 ? 0 : 0.35;
    const swing = [-1.4, 0, 1.4, 0][frame % 4]!;
    // Nohy: jedna sa vlečie.
    line(ctx, 6, 11.4, 6 + swing, 15.2, 1.05);
    line(ctx, 7.6, 11.4, 7.6 - swing * 0.6, 15.2, 1.05);
    // Telo predklonené, potrhaný odev.
    ctx.beginPath();
    ctx.moveTo(5, 5.4 + bob);
    ctx.quadraticCurveTo(8.6, 4.6 + bob, 9.4, 6.6 + bob);
    ctx.lineTo(9.2, 11.6);
    ctx.lineTo(8.4, 12.4);
    ctx.lineTo(7.6, 11.7);
    ctx.lineTo(6.6, 12.5);
    ctx.lineTo(5.6, 11.6);
    ctx.lineTo(4.6, 12.2);
    ctx.quadraticCurveTo(3.8, 8.4, 5, 5.4 + bob);
    ctx.fill();
    // Hlava nízko pred telom.
    circle(ctx, 9.6, 5.2 + bob, 1.75);
    // Ruky ovisnuté dopredu.
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(8.6, 6.8 + bob);
    ctx.quadraticCurveTo(10.6, 8 + bob, 11.4 - swing * 0.2, 10.4 + bob);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7.6, 7 + bob);
    ctx.quadraticCurveTo(9.4, 8.6 + bob, 10.2 + swing * 0.2, 10.9 + bob);
    ctx.stroke();
  });
}

/** Oči nakazených: chorobne žltozelené, svietia aj v tme (aby bolo vidieť, kde sú). */
function ghoulEyes(): Texture {
  return paint(14, 17, (ctx) => {
    ctx.shadowColor = '#d8e070';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#eef0a0';
    circle(ctx, 10.4, 4.9, 0.42);
    circle(ctx, 9.4, 5.1, 0.32);
  });
}

/** Potkan: nízke telo, dlhý chvost a lysé uši; 2 snímky behu. Labky na y = 5. */
function rat(frame: number): Texture {
  return paint(12, 6, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.strokeStyle = INK_CSS;
    const k = frame === 0 ? 1 : -1;
    // Chvost.
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(3.2, 3.6);
    ctx.quadraticCurveTo(1.4, 2.6 + k * 0.5, 0.3, 4.4);
    ctx.stroke();
    // Telo a hlava s ňufákom.
    ctx.beginPath();
    ctx.ellipse(5.6, 3.4, 2.7, 1.35, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7.4, 2.4);
    ctx.quadraticCurveTo(9.2, 2.6, 10.6, 3.6);
    ctx.quadraticCurveTo(9, 4.3, 7.4, 4.3);
    ctx.closePath();
    ctx.fill();
    circle(ctx, 8, 2.2, 0.6);
    // Labky.
    line(ctx, 4.2, 4.2, 4.2 - k * 0.6, 5, 0.45);
    line(ctx, 7, 4.2, 7 + k * 0.6, 5, 0.45);
    // Oko sa leskne vo svetle.
    ctx.fillStyle = '#ff6040';
    circle(ctx, 9.1, 3.1, 0.22);
  });
}

// --- Svetlá a predmety ---
/** Uhlík: žeravý kúsok smoly. */
function firefly(): Texture {
  return paint(
    4,
    4,
    (ctx) => {
      glowDot(ctx, 2, 2, 2, '#fff2c8', '#ff8a2a');
      ctx.fillStyle = '#ffe0a0';
      circle(ctx, 2, 2, 0.45);
    },
    12,
  );
}

function spark(): Texture {
  return paint(5, 5, (ctx) => glowDot(ctx, 2.5, 2.5, 2.5, '#fff6d8', EMBER), 10);
}

/** Relikvia: malý strieborno-zlatý krížik, slabo žiari. */
function crystal(): Texture {
  // Strana denníka: zvinutý list papiera s červenou pečaťou.
  return paint(10, 11, (ctx) => {
    ctx.shadowColor = '#f4e2a8';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#e8dcbc';
    ctx.beginPath();
    ctx.moveTo(1.4, 1);
    ctx.lineTo(8.2, 0.6);
    ctx.quadraticCurveTo(7.4, 5.5, 8.6, 10.2);
    ctx.lineTo(1.8, 10.4);
    ctx.quadraticCurveTo(0.8, 5.6, 1.4, 1);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#4a3a2a';
    for (let y = 2.6; y < 9; y += 1.4) line(ctx, 2.6, y, 6.8, y - 0.1, 0.35);
    ctx.fillStyle = '#a8241a';
    circle(ctx, 6.6, 8.6, 1.3);
  });
}

/** Kaplnka: drevená stieška s výklenkom, v ňom sviečka (zapálená = checkpoint). */
function lantern(lit: boolean): Texture {
  return paint(10, 12, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.beginPath();
    ctx.moveTo(5, 0.6);
    ctx.lineTo(9.6, 3);
    ctx.lineTo(0.4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(1.4, 2.8, 7.2, 6.6);
    ctx.fillRect(4.2, 9, 1.6, 3);
    // Krížik na streche.
    ctx.fillRect(4.6, 0, 0.8, 1.4);
    if (lit) {
      const g = ctx.createRadialGradient(5, 6, 0.2, 5, 6, 3.2);
      g.addColorStop(0, GLOW);
      g.addColorStop(0.6, GOLD);
      g.addColorStop(1, '#a04a10');
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#16131a';
    ctx.beginPath();
    ctx.roundRect(2.6, 4, 4.8, 4.6, [2.4, 2.4, 0.3, 0.3]);
    ctx.fill();
    ctx.fillStyle = lit ? '#f8f0d8' : '#2a2630';
    ctx.fillRect(4.5, 6.4, 1, 2);
    if (lit) {
      ctx.fillStyle = '#fff8e0';
      ctx.beginPath();
      ctx.ellipse(5, 5.8, 0.4, 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
    }
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

/** Hranica: polená na seba krížom a kôl uprostred. */
function campfire(): Texture {
  return paint(24, 14, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.strokeStyle = INK_CSS;
    line(ctx, 10, 13.5, 10, 1, 1.4);
    for (let layer = 0; layer < 4; layer++) {
      const y = 13 - layer * 2.2;
      const half = 9.5 - layer * 1.8;
      line(ctx, 10 - half, y, 10 + half, y - 0.6, 1.9);
      if (layer % 2 === 0)
        for (const dx of [-half + 1, half - 1])
          line(ctx, 10 + dx, y + 0.6, 10 + dx * 0.6, y - 1.6, 1.3);
    }
  });
}

/** Odkaz na stene: doska na kolíku s namaľovaným morovým krížom. */
function sign(): Texture {
  return paint(14, 16, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.fillRect(6.2, 8, 1.6, 8);
    ctx.beginPath();
    ctx.roundRect(1, 1, 12, 7.6, 0.6);
    ctx.fill();
    ctx.strokeStyle = '#c0402a';
    ctx.shadowColor = '#c0402a';
    ctx.shadowBlur = 8;
    line(ctx, 7, 2.2, 7, 7.4, 0.9);
    line(ctx, 4, 4.4, 10, 4.4, 0.9);
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
  });
}

function water(frame: number, world: World): Texture {
  const style = WORLDS[world];
  return paint(TILE, 4, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, 4);
    for (let x = 0; x <= TILE; x += 0.5)
      ctx.lineTo(x, 1.4 + Math.sin(((x + frame * 4) * Math.PI) / 8) * 0.45);
    ctx.lineTo(TILE, 4);
    ctx.closePath();
    ctx.fillStyle = css(style.water);
    ctx.fill();
    ctx.strokeStyle = style.waterLine;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = 0; x <= TILE; x += 0.5) {
      const y = 1.4 + Math.sin(((x + frame * 4) * Math.PI) / 8) * 0.45;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Bubliny hniloby.
    ctx.fillStyle = style.waterLine;
    circle(ctx, 4 + frame * 6, 2.4, 0.35);
  });
}

const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

/** Napnutá plachta (stará markíza): pri odraze sa prehne. */
function bounce(squash: boolean): Texture {
  return paint(TILE, TILE, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.fillRect(1, 6, 1.4, 10);
    ctx.fillRect(13.6, 6, 1.4, 10);
    const sag = squash ? 3 : 1;
    ctx.beginPath();
    ctx.moveTo(0.4, 5.6);
    ctx.quadraticCurveTo(8, 5.6 + sag * 2, 15.6, 5.6);
    ctx.lineTo(15.6, 7.6);
    ctx.quadraticCurveTo(8, 7.6 + sag * 2, 0.4, 7.6);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 16, 0);
    for (let i = 0; i < 6; i++) {
      const color = i % 2 ? '#8a2a24' : '#3a1a1a';
      g.addColorStop(i / 6, color);
      g.addColorStop((i + 0.999) / 6, color);
    }
    ctx.fillStyle = g;
    ctx.fill();
    // Potrhaný lem.
    ctx.fillStyle = '#3a1a1a';
    for (let x = 1.5; x < 15; x += 2.6) {
      const y = 7.4 + Math.sin((x / 16) * Math.PI) * sag * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 1.2, y + 1.4);
      ctx.lineTo(x + 2.2, y);
      ctx.fill();
    }
  });
}

/** Uvoľnený kus muriva: zubatý kameň (pri páde zabije). */
function icicle(): Texture {
  return paint(6, 14, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 6, 0);
    g.addColorStop(0, '#4a4650');
    g.addColorStop(0.5, '#8a8490');
    g.addColorStop(1, '#3a3640');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0.2, 0);
    ctx.lineTo(5.8, 0);
    ctx.lineTo(5.2, 5);
    ctx.lineTo(4.4, 7.6);
    ctx.lineTo(3.4, 13.6);
    ctx.lineTo(2.2, 9);
    ctx.lineTo(0.8, 6.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1a181e';
    line(ctx, 2.4, 1, 3.4, 4.6, 0.4);
    line(ctx, 3.4, 4.6, 2.8, 7.4, 0.4);
  });
}

/** Visiaca plošina: dosky so železnými kovaniami. */
function mover(): Texture {
  return paint(32, 6, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.beginPath();
    ctx.roundRect(0.2, 1.2, 31.6, 4.2, 0.8);
    ctx.fill();
    ctx.strokeStyle = INK_CSS;
    for (const x of [3, 29]) {
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(x, 0.9, 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#9a7a4a';
    ctx.shadowColor = '#9a7a4a';
    ctx.shadowBlur = 6;
    for (const x of [6, 16, 26]) circle(ctx, x, 3.3, 0.6);
  });
}

/** Zhnité dosky s prasklinami. */
function crumble(): Texture {
  return paint(TILE, TILE, (ctx) => {
    ctx.fillStyle = '#100c0a';
    ctx.beginPath();
    ctx.roundRect(0.2, 0.2, 15.6, 15.6, 0.8);
    ctx.fill();
    ctx.strokeStyle = '#3a2a1c';
    for (const y of [5.3, 10.6]) line(ctx, 0.5, y, 15.5, y, 0.5);
    ctx.lineWidth = 0.5;
    for (const crack of [
      [4, 0.5, 5, 2.5, 4.4, 5],
      [11, 5.5, 10.2, 7.8, 11.6, 10.4],
      [7, 11, 7.8, 13.2, 7, 15.5],
      [13, 0.5, 12.6, 3, 13.4, 5],
    ]) {
      ctx.beginPath();
      ctx.moveTo(crack[0]!, crack[1]!);
      for (let i = 2; i < crack.length; i += 2) ctx.lineTo(crack[i]!, crack[i + 1]!);
      ctx.stroke();
    }
  });
}

/** Horľavá barikáda: zbité dosky s namaľovaným morovým krížom. */
function barricade(): Texture {
  return paint(TILE, TILE, (ctx) => {
    ctx.fillStyle = '#1a120c';
    ctx.fillRect(0.4, 0, 15.2, 16);
    ctx.strokeStyle = '#3a2818';
    for (const x of [4, 8, 12]) line(ctx, x, 0, x, 16, 0.5);
    ctx.fillStyle = '#24180e';
    ctx.save();
    ctx.translate(8, 8);
    ctx.rotate(0.5);
    ctx.fillRect(-9, -1.4, 18, 2.8);
    ctx.restore();
    ctx.strokeStyle = 'rgba(170,40,30,0.85)';
    line(ctx, 8, 3.5, 8, 12.5, 1.1);
    line(ctx, 4, 7, 12, 7, 1.1);
    ctx.fillStyle = '#5a4a3a';
    for (const [x, y] of [
      [2, 2],
      [14, 2],
      [2, 14],
      [14, 14],
    ] as const)
      circle(ctx, x, y, 0.5);
  });
}

/** Morové hniezdo: kopa zavinutých tiel na slame, nad ňou kôl s morovou zástavou. */
function nest(ash: boolean): Texture {
  return paint(22, 16, (ctx) => {
    ctx.fillStyle = ash ? '#1c1714' : '#2a2018';
    // Slama.
    ctx.beginPath();
    ctx.moveTo(1, 16);
    ctx.quadraticCurveTo(4, 11.5, 11, 11);
    ctx.quadraticCurveTo(18, 11.5, 21, 16);
    ctx.closePath();
    ctx.fill();
    if (ash) {
      // Spálené: tlejúce zvyšky a kosti.
      ctx.fillStyle = '#3a2a20';
      for (const [x, y, r] of [
        [7, 14, 1.3],
        [12, 13.5, 1.6],
        [16, 14.5, 1.1],
      ] as const)
        circle(ctx, x, y, r);
      ctx.strokeStyle = '#a89878';
      line(ctx, 9, 14.6, 13, 13.4, 0.5);
      return;
    }
    // Zavinuté telá (rubáše).
    ctx.fillStyle = '#c8bca0';
    ctx.strokeStyle = '#3a3026';
    for (const [x, y, w, a] of [
      [7, 11.5, 6.5, -0.15],
      [14, 11.8, 6, 0.2],
      [10.5, 9.2, 6.2, -0.05],
    ] as const) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let k = -1; k <= 1; k++) line(ctx, k * 1.6, -1.4, k * 1.6 + 0.4, 1.4, 0.3);
      ctx.restore();
    }
    // Kôl so zástavou s morovým krížom.
    ctx.strokeStyle = INK_CSS;
    line(ctx, 18.5, 15, 18.5, 1, 0.7);
    ctx.fillStyle = '#d8ccb0';
    ctx.beginPath();
    ctx.moveTo(18.8, 1.4);
    ctx.lineTo(13.2, 2.2);
    ctx.lineTo(14.2, 4.2);
    ctx.lineTo(13, 6.2);
    ctx.lineTo(18.8, 5.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a8241a';
    line(ctx, 16.2, 2.4, 16.2, 5.2, 0.7);
    line(ctx, 14.9, 3.7, 17.5, 3.6, 0.7);
  });
}

/**
 * Voz s mŕtvolami: dvojkolesová kára s rúčkami, na nej kopa zavinutých tiel. Keď sa jedno
 * posadí (`risen`), na vrchu ostane prázdne miesto a zhodená plachta. Kolesá na y = 16.
 */
function cart(risen: boolean): Texture {
  return paint(30, 17, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.strokeStyle = INK_CSS;
    // Rúčky (oje) šikmo k zemi.
    line(ctx, 3, 9.5, -0.5, 15.5, 1);
    line(ctx, 26, 9.5, 30, 15.5, 1);
    // Korba z dosák.
    ctx.fillStyle = '#2a1e14';
    ctx.fillRect(3, 8.5, 23, 4);
    ctx.strokeStyle = '#140e0a';
    for (const x of [8.5, 14.5, 20.5]) line(ctx, x, 8.7, x, 12.3, 0.4);
    line(ctx, 3, 10.5, 26, 10.5, 0.3);
    // Telá v rubášoch.
    ctx.fillStyle = '#c8bca0';
    ctx.strokeStyle = '#3a3026';
    const bodies: [number, number, number, number][] = [
      [8.5, 7.2, 9, -0.08],
      [19, 7.4, 9.5, 0.1],
      [13.5, 5.2, 9, 0.04],
    ];
    if (!risen) bodies.push([16, 3.4, 8, -0.12]);
    for (const [x, y, w, a] of bodies) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Obrys, aby bol rubáš vidno aj vo svetle (v drevoreze je svetlo farbou papiera).
      ctx.lineWidth = 0.45;
      ctx.stroke();
      for (let k = -1; k <= 1; k++) line(ctx, k * 2, -1.5, k * 2 + 0.4, 1.5, 0.3);
      ctx.restore();
    }
    // Visiaca ruka spod rubáša.
    ctx.strokeStyle = '#8a7a64';
    line(ctx, 23.5, 8.2, 24.6, 11.6, 0.7);
    if (risen) {
      // Zhodená plachta cez okraj korby.
      ctx.fillStyle = '#b0a488';
      ctx.beginPath();
      ctx.moveTo(10, 4.6);
      ctx.quadraticCurveTo(5, 5, 2.4, 9.5);
      ctx.lineTo(4.4, 10);
      ctx.quadraticCurveTo(7, 6.6, 12, 5.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3a3026';
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
    // Kolesá s lúčmi.
    ctx.strokeStyle = INK_CSS;
    for (const x of [8, 21]) {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, 13, 3.4, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        line(
          ctx,
          x - Math.cos(a) * 3.2,
          13 - Math.sin(a) * 3.2,
          x + Math.cos(a) * 3.2,
          13 + Math.sin(a) * 3.2,
          0.45,
        );
      }
    }
  });
}

/** Preživší: kľačiaca postava v plachte so zopnutými rukami; chodidlá na y = 14. */
function survivor(): Texture {
  return paint(12, 15, (ctx) => {
    ctx.fillStyle = INK_CSS;
    ctx.strokeStyle = INK_CSS;
    // Kľačiace telo zahalené v plachte.
    ctx.beginPath();
    ctx.moveTo(2, 14);
    ctx.quadraticCurveTo(1.6, 9, 4.4, 6.4);
    ctx.lineTo(7.4, 6.2);
    ctx.quadraticCurveTo(9, 9, 8.6, 11);
    ctx.lineTo(10.6, 14);
    ctx.closePath();
    ctx.fill();
    // Hlava sklonená, kapucňa.
    circle(ctx, 6.4, 4.6, 1.9);
    // Zopnuté ruky zdvihnuté k lekárovi.
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(7, 7.6);
    ctx.quadraticCurveTo(9.4, 7.4, 10, 5.4);
    ctx.stroke();
    // Morové škvrny na plachte (bledé).
    ctx.fillStyle = '#c8bca0';
    for (const [x, y] of [
      [4, 10.5],
      [6.4, 12.4],
      [3.4, 12.8],
    ] as const)
      circle(ctx, x, y, 0.45);
  });
}

/** Dvere domu: dosky s okovaním a morovým krížom; otvorené sú len tmavý otvor. */
function door(open: boolean): Texture {
  return paint(TILE, TILE, (ctx) => {
    if (open) {
      ctx.fillStyle = '#050403';
      ctx.fillRect(2, 0, 12, 16);
      return;
    }
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(1.5, 0, 13, 16);
    ctx.strokeStyle = '#1a120c';
    for (const x of [5, 8, 11]) line(ctx, x, 0.5, x, 15.5, 0.5);
    ctx.fillStyle = '#14100c';
    ctx.fillRect(1.5, 3, 13, 1.4);
    ctx.fillRect(1.5, 11.5, 13, 1.4);
    // Zámka.
    ctx.fillStyle = '#c8b070';
    circle(ctx, 11.6, 8.2, 0.9);
    ctx.strokeStyle = 'rgba(170,40,30,0.9)';
    line(ctx, 7, 5.4, 7, 10.6, 1);
    line(ctx, 4.6, 7.6, 9.4, 7.6, 1);
  });
}

/** Kľúč: veľký kovaný kľúč, leskne sa. */
function key(): Texture {
  return paint(10, 6, (ctx) => {
    ctx.shadowColor = '#f4e2a8';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#e8c860';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(2.6, 3, 1.6, 0, Math.PI * 2);
    ctx.stroke();
    line(ctx, 4.2, 3, 9, 3, 1);
    line(ctx, 7.6, 3, 7.6, 4.8, 0.9);
    line(ctx, 8.8, 3, 8.8, 4.4, 0.9);
  });
}

/** Groš: malá strieborná minca s krížom. */
function coin(): Texture {
  return paint(5, 5, (ctx) => {
    ctx.fillStyle = '#d8d0b8';
    circle(ctx, 2.5, 2.5, 1.9);
    ctx.strokeStyle = '#6a604c';
    line(ctx, 2.5, 1.4, 2.5, 3.6, 0.4);
    line(ctx, 1.4, 2.5, 3.6, 2.5, 0.4);
  });
}

/** Liečivé byliny: zväzok bledozelených lístkov, slabo žiari. */
function herb(): Texture {
  return paint(9, 10, (ctx) => {
    ctx.shadowColor = '#b8e890';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#6a8a4a';
    line(ctx, 4.5, 9.6, 4.5, 3, 0.5);
    ctx.fillStyle = '#c8f0a0';
    for (const [x, y, a] of [
      [3, 3, -0.6],
      [6, 3.4, 0.6],
      [2.6, 5.6, -0.9],
      [6.4, 6, 0.9],
      [4.5, 1.6, 0],
    ] as const) {
      ctx.beginPath();
      ctx.ellipse(x, y, 0.9, 1.9, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#7a4a2a';
    ctx.fillRect(3.6, 7.6, 1.8, 0.9);
  });
}

/** Chumáč miazmy: mäkký chorobne zelený obláčik. */
function fogPuff(): Texture {
  return paint(
    24,
    24,
    (ctx) => {
      for (const [x, y, r] of [
        [12, 12, 10],
        [7, 14, 6],
        [17, 13, 6],
      ] as const) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(170,200,90,0.55)');
        g.addColorStop(1, 'rgba(120,150,60,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 24, 24);
      }
    },
    3,
  );
}

/** Mesiac je biely; farbu (krvavú, chorobne zelenú) mu dáva renderer podľa sveta. */
function moon(): Texture {
  return paint(
    26,
    26,
    (ctx) => {
      glowDot(ctx, 13, 13, 13, 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.16)');
      ctx.fillStyle = '#ffffff';
      circle(ctx, 13, 13, 8.5);
      ctx.fillStyle = '#d8d8d8';
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
  farShape: 'hills' | 'city' | 'ossuary' | 'gothic';
  fog: string;
  near: string;
  nearShape: 'houses' | 'crypt' | 'graves' | 'pillars';
  water: number;
  waterLine: string;
  top: 'cobbles' | 'bones' | 'grass' | 'stone';
  under: 'roots' | 'stalactites' | 'chains';
  info: WorldInfo;
}

const WORLDS: Record<World, WorldStyle> = {
  quarter: {
    sky: ['#060409', '#160d12', '#3a1e1a', '#7a3a22'],
    stars: 'rgba(230,210,200,0.35)',
    far: '#1e1316',
    farShape: 'city',
    fog: 'rgba(140,70,40,0.4)',
    near: '#0e0a0e',
    nearShape: 'houses',
    water: 0x14170a,
    waterLine: '#6a7a34',
    top: 'cobbles',
    under: 'chains',
    info: { darkness: 0.84, moon: true, moonTint: 0xe8a088, ambient: 'rain' },
  },
  catacombs: {
    sky: ['#040303', '#0e0b0a', '#1e1714', '#3a2a1e'],
    stars: 'rgba(200,180,150,0.12)',
    far: '#1c1612',
    farShape: 'ossuary',
    fog: 'rgba(90,70,50,0.35)',
    near: '#0e0b0a',
    nearShape: 'crypt',
    water: 0x1a1808,
    waterLine: '#8a8436',
    top: 'bones',
    under: 'stalactites',
    info: { darkness: 0.88, moon: false, moonTint: 0xffffff, ambient: 'dust' },
  },
  pits: {
    sky: ['#050607', '#10161a', '#22302e', '#4a5a3c'],
    stars: 'rgba(210,225,200,0.4)',
    far: '#18221c',
    farShape: 'hills',
    fog: 'rgba(120,150,100,0.45)',
    near: '#0c110f',
    nearShape: 'graves',
    water: 0x161a0c,
    waterLine: '#8a9a4a',
    top: 'grass',
    under: 'roots',
    info: { darkness: 0.84, moon: true, moonTint: 0xd0e0b0, ambient: 'wisps' },
  },
  cathedral: {
    sky: ['#050407', '#120d16', '#261a2c', '#4a2c3a'],
    stars: 'rgba(220,200,230,0.15)',
    far: '#1a1320',
    farShape: 'gothic',
    fog: 'rgba(120,70,90,0.35)',
    near: '#0e0a10',
    nearShape: 'pillars',
    water: 0x1a0c10,
    waterLine: '#a05a5a',
    top: 'stone',
    under: 'chains',
    info: { darkness: 0.86, moon: false, moonTint: 0xffffff, ambient: 'embers' },
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
      for (let i = 0; i < 60; i++) {
        const x = pixelNoise(i, 1, 201) * 320;
        const y = pixelNoise(i, 2, 201) * 160;
        const r = 0.3 + pixelNoise(i, 3, 201) * 0.5;
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

/** Krivý dom so štítovou strechou a občas komínom. */
function house(ctx: Ctx, x: number, base: number, w: number, h: number, seed: number): void {
  const lean = (pixelNoise(seed, 1, 271) - 0.5) * 2.4;
  const roof = w * (0.45 + pixelNoise(seed, 2, 271) * 0.35);
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x + lean * 0.3, base - h);
  ctx.lineTo(x + w / 2 + lean, base - h - roof);
  ctx.lineTo(x + w + lean * 0.3, base - h);
  ctx.lineTo(x + w, base);
  ctx.closePath();
  ctx.fill();
  if (pixelNoise(seed, 3, 271) < 0.6) {
    const cx = x + w * (0.2 + pixelNoise(seed, 4, 271) * 0.5);
    ctx.fillRect(cx, base - h - roof * 0.8, 2.6, roof * 0.6);
  }
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
      ctx.strokeStyle = style.far;
      if (style.farShape === 'city') {
        // Strechy mesta, veže kostolov a pár oblokov, kde ešte niekto svieti.
        let x = 0;
        let i = 0;
        while (x < W) {
          const w = 16 + pixelNoise(i, 0, 281) * 26;
          const h = H * (0.3 + pixelNoise(i, 1, 281) * 0.3);
          const xi = x;
          const ii = i;
          wrapped(W, (o) => {
            ctx.fillStyle = style.far;
            house(ctx, xi + o, H, w, h, ii);
            if (pixelNoise(ii, 5, 281) < 0.35) {
              ctx.fillStyle = 'rgba(255,160,80,0.4)';
              ctx.fillRect(xi + o + w * 0.4, H - h * 0.7, 2, 3);
            }
          });
          x += w * (0.8 + pixelNoise(i, 2, 281) * 0.3);
          i++;
        }
        for (const cx of [90, 260, 400]) {
          const h = H * (0.75 + pixelNoise(cx, 1, 282) * 0.15);
          wrapped(W, (o) => {
            ctx.fillStyle = style.far;
            ctx.fillRect(cx + o - 7, H - h * 0.6, 14, h * 0.6);
            ctx.beginPath();
            ctx.moveTo(cx + o - 8, H - h * 0.6);
            ctx.lineTo(cx + o, H - h);
            ctx.lineTo(cx + o + 8, H - h * 0.6);
            ctx.fill();
            ctx.fillRect(cx + o - 0.4, H - h - 6, 0.8, 6);
            ctx.fillRect(cx + o - 2, H - h - 4.4, 4, 0.8);
          });
        }
        // Dym z hraníc stúpa nad strechy.
        for (let k = 0; k < 3; k++) {
          const sx = 60 + pixelNoise(k, 1, 283) * (W - 120);
          const g = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.7);
          g.addColorStop(0, 'rgba(60,40,36,0)');
          g.addColorStop(1, 'rgba(60,40,36,0.35)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(sx - 4, H * 0.7);
          ctx.quadraticCurveTo(sx - 10, H * 0.35, sx + 6, H * 0.08);
          ctx.quadraticCurveTo(sx + 14, H * 0.4, sx + 6, H * 0.7);
          ctx.fill();
        }
      } else if (style.farShape === 'ossuary') {
        // Stena kostnice: rady klenutých výklenkov plných lebiek.
        ctx.fillRect(0, H * 0.15, W, H * 0.85);
        for (let row = 0; row < 3; row++) {
          for (let k = 0; k < 16; k++) {
            const nx = k * 30 + (row % 2) * 15 + 6;
            const ny = H * 0.25 + row * 26;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.beginPath();
            ctx.roundRect(nx, ny, 18, 20, [9, 9, 0, 0]);
            ctx.fill();
            ctx.fillStyle = 'rgba(190,175,150,0.16)';
            for (let s = 0; s < 3; s++) {
              circle(ctx, nx + 4 + s * 5, ny + 15, 2.1);
              circle(ctx, nx + 6.5 + s * 5 - (s === 2 ? 5 : 0), ny + 10.5, 2);
            }
          }
        }
      } else if (style.farShape === 'gothic') {
        // Hlavná loď: lomené okná s vitrážami, ktoré len slabo presvitajú.
        ctx.fillRect(0, 0, W, H);
        const glass = ['rgba(150,40,50,0.45)', 'rgba(50,60,140,0.4)', 'rgba(140,110,50,0.4)'];
        for (let k = 0; k < 8; k++) {
          const cx = k * 60 + 30;
          const top = H * 0.08;
          const bottom = H * 0.72;
          const w = 16;
          const g = ctx.createLinearGradient(0, top, 0, bottom);
          g.addColorStop(0, glass[k % 3]!);
          g.addColorStop(1, 'rgba(40,20,30,0.25)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(cx - w / 2, bottom);
          ctx.lineTo(cx - w / 2, top + w);
          ctx.quadraticCurveTo(cx - w / 2, top, cx, top - 4);
          ctx.quadraticCurveTo(cx + w / 2, top, cx + w / 2, top + w);
          ctx.lineTo(cx + w / 2, bottom);
          ctx.closePath();
          ctx.fill();
          // Olovené priečky.
          line(ctx, cx, top, cx, bottom, 1.2);
          for (let y = top + 14; y < bottom; y += 12) line(ctx, cx - w / 2, y, cx + w / 2, y, 0.9);
        }
      } else {
        // Kopce s krížmi na hrebeni.
        const ridge = (x: number) => {
          const a = (x / W) * Math.PI * 2;
          return H * (0.42 + 0.14 * Math.sin(a * 2 + 1) + 0.07 * Math.sin(a * 5 + 2));
        };
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) ctx.lineTo(x, H - ridge(x));
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
        for (let k = 0; k < 26; k++) {
          const x = pixelNoise(k, 1, 291) * W;
          const y = H - ridge(x) + 1;
          const s = 3 + pixelNoise(k, 2, 291) * 3;
          ctx.fillRect(x - 0.4, y - s, 0.8, s);
          ctx.fillRect(x - s * 0.3, y - s * 0.75, s * 0.6, 0.7);
        }
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

function deadTree(ctx: Ctx, x: number, base: number, h: number, seed: number): void {
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x - 3, base - h * 0.5, x + 2, base - h);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  for (let b = 0; b < 4; b++) {
    const by = base - h * (0.45 + b * 0.13);
    const dir = b % 2 === 0 ? 1 : -1;
    const len = 8 + pixelNoise(seed, b + 2, 251) * 10;
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.quadraticCurveTo(x + dir * len * 0.6, by - 4, x + dir * len, by - 9);
    ctx.stroke();
  }
}

/** Šibenica so slučkou. */
function gallows(ctx: Ctx, x: number, base: number, h: number): void {
  ctx.fillRect(x - 1.2, base - h, 2.4, h);
  ctx.fillRect(x - 1.2, base - h, h * 0.5, 2);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 1, base - h * 0.78);
  ctx.lineTo(x + h * 0.2, base - h + 1.5);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  const rx = x + h * 0.42;
  ctx.beginPath();
  ctx.moveTo(rx, base - h + 1.5);
  ctx.lineTo(rx, base - h * 0.62);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(rx, base - h * 0.58, 1.3, 2, 0, 0, Math.PI * 2);
  ctx.stroke();
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
      ctx.strokeStyle = style.near;
      const shape = style.nearShape;
      if (shape === 'houses') {
        // Krivé domy tesne pri sebe, medzi nimi uličky a šibenica.
        let x = 0;
        let i = 0;
        while (x < W - 40) {
          const w = 26 + pixelNoise(i, 0, 301) * 30;
          const h = H * (0.5 + pixelNoise(i, 1, 301) * 0.3);
          const xi = x;
          const ii = i;
          wrapped(W, (o) => {
            house(ctx, xi + o, H, w, h, ii + 50);
            // Vývesný štít na ráme.
            if (pixelNoise(ii, 6, 301) < 0.4) {
              ctx.fillRect(xi + o + w - 2, H - h * 0.55, 8, 1);
              ctx.fillRect(xi + o + w + 2, H - h * 0.55, 4, 4);
            }
          });
          x += w + (pixelNoise(i, 2, 301) < 0.3 ? 30 : 4);
          i++;
        }
        wrapped(W, (o) => gallows(ctx, o + W - 22, H, H * 0.55));
      } else if (shape === 'crypt') {
        // Nízke oblúky krypty, kopy lebiek a pavučiny.
        const n = 7;
        for (let k = 0; k < n; k++) {
          const cx = k * (W / n) + 12;
          wrapped(W, (o) => {
            const x = cx + o;
            ctx.fillRect(x - 6, H * 0.25, 12, H * 0.75);
            ctx.beginPath();
            ctx.moveTo(x + 6, H * 0.25);
            ctx.lineTo(x + W / n - 6, H * 0.25);
            ctx.lineTo(x + W / n - 6, H * 0.25 + 18);
            ctx.quadraticCurveTo(x + W / n / 2, H * 0.25 - 10, x + 6, H * 0.25 + 18);
            ctx.fill();
          });
        }
        ctx.fillRect(0, 0, W, H * 0.26);
        for (let k = 0; k < 9; k++) {
          const cx = pixelNoise(k, 1, 311) * W;
          const r = 10 + pixelNoise(k, 2, 311) * 10;
          wrapped(W, (o) => {
            for (let s = 0; s < 7; s++) {
              const sx = cx + o + (pixelNoise(k, s, 312) - 0.5) * r * 1.6;
              const sy = H - pixelNoise(k, s, 313) * r * 0.8;
              circle(ctx, sx, sy, 2.2);
            }
          });
        }
        ctx.lineWidth = 0.35;
        for (let k = 0; k < 6; k++) {
          const x = pixelNoise(k, 4, 314) * W;
          ctx.beginPath();
          ctx.moveTo(x, H * 0.26);
          ctx.quadraticCurveTo(x + 4, H * 0.36, x + 10, H * 0.3);
          ctx.moveTo(x + 3, H * 0.26);
          ctx.lineTo(x + 5, H * 0.4);
          ctx.stroke();
        }
      } else if (shape === 'graves') {
        // Náhrobky, kríže (niektoré nakrivo), holé stromy a šibenica.
        for (let k = 0; k < 7; k++) {
          const cx = (k + pixelNoise(k, 0, 321) * 0.6) * (W / 7);
          const h = H * (0.5 + pixelNoise(k, 1, 321) * 0.4);
          wrapped(W, (o) => deadTree(ctx, cx + o, H, h, k));
        }
        for (let k = 0; k < 30; k++) {
          const x = pixelNoise(k, 2, 322) * W;
          const kind = pixelNoise(k, 3, 322);
          const s = 6 + pixelNoise(k, 4, 322) * 9;
          const tilt = (pixelNoise(k, 5, 322) - 0.5) * 0.5;
          wrapped(W, (o) => {
            ctx.save();
            ctx.translate(x + o, H - 2);
            ctx.rotate(tilt);
            if (kind < 0.5) {
              ctx.fillRect(-0.8, -s * 1.3, 1.6, s * 1.3);
              ctx.fillRect(-s * 0.4, -s, s * 0.8, 1.5);
            } else {
              ctx.beginPath();
              ctx.roundRect(-s * 0.35, -s, s * 0.7, s + 2, [s * 0.35, s * 0.35, 0, 0]);
              ctx.fill();
            }
            ctx.restore();
          });
        }
        wrapped(W, (o) => gallows(ctx, o + 150, H, H * 0.6));
      } else {
        // Stĺporadie s oblúkmi, niektoré stĺpy zlomené; visiace lustre.
        const n = 8;
        for (let k = 0; k < n; k++) {
          const cx = k * (W / n) + 10;
          const broken = pixelNoise(k, 1, 261) < 0.3;
          const h = broken ? H * (0.35 + pixelNoise(k, 2, 261) * 0.3) : H * 0.92;
          wrapped(W, (o) => {
            const x = cx + o;
            ctx.fillRect(x - 5, H - h, 10, h);
            ctx.fillRect(x - 7, H - h, 14, 3);
            ctx.fillRect(x - 7, H - 6, 14, 6);
            if (!broken) {
              ctx.beginPath();
              ctx.moveTo(x + 5, H - h);
              ctx.lineTo(x + W / n - 5, H - h);
              ctx.lineTo(x + W / n - 5, H - h + 16);
              ctx.quadraticCurveTo(x + W / n / 2, H - h - 10, x + 5, H - h + 16);
              ctx.fill();
            }
          });
        }
        ctx.lineWidth = 0.8;
        for (let k = 0; k < 4; k++) {
          const x = 30 + pixelNoise(k, 4, 262) * (W - 60);
          const len = 24 + pixelNoise(k, 5, 262) * 30;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, len);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(x, len + 1.5, 7, 1.6, 0, 0, Math.PI * 2);
          ctx.fill();
          for (const dx of [-6, -2, 2, 6]) ctx.fillRect(x + dx - 0.4, len - 2.4, 0.8, 2.6);
        }
      }
      ctx.fillStyle = style.near;
      ctx.fillRect(0, H * 0.9, W, H * 0.1);
      seamless(ctx, W, H);
    },
    3,
  );
}

// --- Terén (PixiJS vektory) ---
/** Sliz na šmykľavých kameňoch. */
const SLIME = 0x7a9a48;

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

  // Svetlé vrstvy (sliz) sa kreslia až nakoniec, nad čiernu zem.
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
          underside(g, style, col, row);
      } else if (tile === Tile.Bounce) {
        // Zem pod plachtou (plachta je sprite nad povrchom).
        g.rect(x0 - 0.3, y0 + 4, TILE + 0.6, TILE - 3.7).fill(INK);
      } else if (tile === Tile.Ledge) {
        // Trám so šikmými podperami na koncoch.
        g.rect(x0 - 0.2, y0, TILE + 0.4, 3).fill(INK);
        if (tileAt(level, col - 1, row) !== Tile.Ledge)
          g.poly([x0 + 1, y0 + 2, x0 + 2.4, y0 + 2, x0 + 7, y0 + 7, x0 + 5.6, y0 + 7]).fill(INK);
        if (tileAt(level, col + 1, row) !== Tile.Ledge)
          g.poly([
            x0 + TILE - 1,
            y0 + 2,
            x0 + TILE - 2.4,
            y0 + 2,
            x0 + TILE - 7,
            y0 + 7,
            x0 + TILE - 5.6,
            y0 + 7,
          ]).fill(INK);
      } else if (tile === Tile.Thorns) {
        // Železné hroty (kované, rovné).
        g.rect(x0, y0 + TILE - 2.5, TILE, 2.5).fill(INK);
        for (let i = 0; i < 5; i++) {
          const x = x0 + 1.6 + i * 3.2;
          const peak = 8 + pixelNoise(col * 7 + i, row, 316) * 2;
          g.poly([x - 0.9, y0 + TILE - 2, x, y0 + TILE - peak, x + 0.9, y0 + TILE - 2]).fill(INK);
        }
      } else if (tile === Tile.Water) {
        const top = tileAt(level, col, row - 1) !== Tile.Water;
        g.rect(x0 - 0.2, y0 + (top ? 3 : 0), TILE + 0.4, top ? TILE - 3 : TILE).fill({
          color: style.water,
          alpha: 0.96,
        });
      }
    }
  }

  // Dohárajúce sviečky (farbu majú, lebo svietia).
  for (const d of decorOf(level)) {
    if (d.kind !== 'candle') continue;
    g.rect(d.x - 0.6, d.y - 2.6, 1.2, 2.6).fill(0x2a2420);
    g.ellipse(d.x, d.y - 3.4, 0.5, 0.9).fill(0xffd890);
  }
  const c = new Container();
  c.addChild(g, light);
  return c;
}

/** Vrch zeme podľa sveta: dlažba, kosti, uschnutá tráva alebo dlaždice; sliz sa leskne. */
function surface(
  g: Graphics,
  light: Graphics,
  style: WorldStyle,
  slick: boolean,
  col: number,
  row: number,
): void {
  const x0 = col * TILE;
  const y0 = row * TILE;
  if (slick) {
    light.rect(x0 - 0.3, y0 - 0.2, TILE + 0.6, 1.4).fill({ color: SLIME, alpha: 0.75 });
    light
      .ellipse(x0 + 5 + pixelNoise(col, row, 330) * 6, y0 + 1.2, 2, 0.8)
      .fill({ color: SLIME, alpha: 0.5 });
    return;
  }
  if (style.top === 'stone') {
    if (pixelNoise(col, row, 321) < 0.25) g.rect(x0 + 2, y0 - 2, 5, 2).fill(INK);
    return;
  }
  if (style.top === 'cobbles') {
    for (let i = 0; i < 4; i++)
      g.ellipse(x0 + 2 + i * 4 + pixelNoise(col, i, 331) * 1.5, y0, 1.8, 0.9).fill(INK);
    return;
  }
  if (style.top === 'bones') {
    if (pixelNoise(col, row, 332) < 0.45) {
      const bx = x0 + 3 + pixelNoise(col, row, 333) * 9;
      g.rect(bx - 2.5, y0 - 1, 5, 0.9).fill(INK);
      g.circle(bx - 2.6, y0 - 0.9, 0.8).fill(INK);
      g.circle(bx + 2.6, y0 - 0.9, 0.8).fill(INK);
    }
    if (pixelNoise(col, row, 334) < 0.15) {
      // Lebka.
      const sx = x0 + 4 + pixelNoise(col, row, 335) * 8;
      g.circle(sx, y0 - 2, 2).fill(INK);
      g.rect(sx - 1.2, y0 - 1, 2.4, 1.2).fill(INK);
    }
    return;
  }
  // Uschnutá tráva a sem-tam drevený krížik.
  for (let i = 0; i < 5; i++) {
    const bx = x0 + pixelNoise(col * 7 + i, row, 304) * TILE;
    const n = pixelNoise(col, row * 7 + i, 305);
    const h = 1.2 + n * 3;
    const lean = (pixelNoise(col + i, row, 306) - 0.5) * 3;
    g.poly([bx - 0.5, y0 + 0.5, bx + 0.5, y0 + 0.5, bx + lean, y0 - h]).fill(INK);
  }
  if (pixelNoise(col, row, 336) < 0.08) {
    const cx = x0 + 8;
    g.rect(cx - 0.5, y0 - 7, 1, 7).fill(INK);
    g.rect(cx - 2.2, y0 - 5.6, 4.4, 1).fill(INK);
  }
}

/** Spodok zeme nad prázdnom: korienky, krápniky alebo reťaze s hákmi. */
function underside(g: Graphics, style: WorldStyle, col: number, row: number): void {
  const x0 = col * TILE;
  const y = row * TILE + TILE;
  if (style.under === 'stalactites') {
    if (pixelNoise(col, row, 307) >= 0.5) return;
    const cx = x0 + 3 + pixelNoise(col, row, 308) * 10;
    const len = 3 + pixelNoise(col, row, 309) * 7;
    const w = 1.2 + pixelNoise(col, row, 310) * 1.4;
    g.poly([cx - w, y, cx + w, y, cx, y + len]).fill(INK);
    return;
  }
  if (style.under === 'chains') {
    if (pixelNoise(col, row, 326) >= 0.22) return;
    const cx = x0 + 4 + pixelNoise(col, row, 327) * 8;
    const len = 6 + pixelNoise(col, row, 328) * 14;
    g.moveTo(cx, y)
      .lineTo(cx, y + len)
      .stroke({ width: 0.8, color: INK });
    g.moveTo(cx, y + len)
      .quadraticCurveTo(cx + 2, y + len + 2.5, cx - 0.5, y + len + 3)
      .stroke({ width: 0.7, color: INK });
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
  ghoul,
  ghoulEyes,
  firefly,
  crystal,
  lantern,
  post,
  flame,
  campfire,
  sign,
  lightTile,
  rat,
  door,
  key,
  coin,
  survivor,
  cart,
  nest,
  cane,
  spark,
  water,
  crumble,
  barricade,
  herb,
  fogPuff,
  moon,
  sky,
  far,
  near,
};
