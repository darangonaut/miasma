/**
 * Úvodná scéna v siluetovom štýle: mesto v noci pod krvavým mesiacom, dym z hraníc a dážď.
 * Na hradbe stojí morový lekár s fakľou, v okne domu občas zažiaria oči prízraku.
 */
import { DOCTOR_TORCH, drawDoctor } from '@/render/doctor';

const INK = '#05060b';

function rand(i: number, seed: number): number {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export class TitleScene {
  private ctx: CanvasRenderingContext2D;
  private backdrop = document.createElement('canvas');
  private running = false;
  private start = performance.now();
  private w = 0;
  private h = 0;
  private dpr = 1;
  private rain = Array.from({ length: 140 }, (_, i) => ({
    x: rand(i, 1),
    y: rand(i, 2),
    speed: 0.7 + rand(i, 3) * 0.5,
  }));

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    window.addEventListener('resize', () => {
      if (this.running) this.layout();
    });
  }

  run(): void {
    if (this.running) return;
    this.running = true;
    this.layout();
    const frame = () => {
      if (!this.running) return;
      this.draw((performance.now() - this.start) / 1000);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
  }

  /** Miesto, kde stojí lekár (vrch hradby), a jeho mierka. */
  private hero(): { x: number; y: number; s: number } {
    const s = Math.max(2.5, Math.min(this.h / 110, this.w / 140));
    return { x: this.w * 0.2, y: this.wallY(), s };
  }

  private wallY(): number {
    return this.h * 0.8;
  }

  private layout(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    for (const c of [this.canvas, this.backdrop]) {
      c.width = Math.round(this.w * this.dpr);
      c.height = Math.round(this.h * this.dpr);
    }
    this.paintBackdrop();
  }

  /** Okno domu vpravo, v ktorom sa zjavujú oči. */
  private window(): { x: number; y: number; size: number } {
    const { w, h } = this;
    return { x: w * 0.74, y: h * 0.66, size: Math.max(10, h * 0.03) };
  }

  /** Statické vrstvy: nebo, mesto, dym, domy a hradba v popredí. */
  private paintBackdrop(): void {
    const ctx = this.backdrop.getContext('2d')!;
    const { w, h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#040306');
    sky.addColorStop(0.45, '#120a0e');
    sky.addColorStop(0.75, '#2c1614');
    sky.addColorStop(1, '#5e2a1a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(235,215,210,${(0.08 + rand(i, 5) * 0.25).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(rand(i, 6) * w, rand(i, 7) * h * 0.5, 0.4 + rand(i, 8) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vzdialené mesto: strechy, veže kostolov a pár svietiacich oblokov.
    const base = h * 0.72;
    ctx.fillStyle = '#140c10';
    let x = -10;
    let i = 0;
    while (x < w) {
      const hw = w * (0.03 + rand(i, 9) * 0.04);
      const hh = h * (0.06 + rand(i, 10) * 0.1);
      const roof = hw * (0.5 + rand(i, 11) * 0.4);
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, base - hh);
      ctx.lineTo(x + hw / 2, base - hh - roof);
      ctx.lineTo(x + hw, base - hh);
      ctx.lineTo(x + hw, h);
      ctx.fill();
      if (rand(i, 12) < 0.3) {
        ctx.fillStyle = 'rgba(255,150,70,0.45)';
        ctx.fillRect(
          x + hw * 0.4,
          base - hh * 0.6,
          Math.max(1.5, hw * 0.1),
          Math.max(2, hh * 0.12),
        );
        ctx.fillStyle = '#140c10';
      }
      x += hw * 0.9;
      i++;
    }
    for (const sx of [0.42, 0.63, 0.9]) {
      const tx = w * sx;
      const th = h * (0.28 + rand(sx * 10, 13) * 0.08);
      const tw = Math.max(10, w * 0.022);
      ctx.fillRect(tx - tw / 2, base - th * 0.55, tw, th * 0.55 + h);
      ctx.beginPath();
      ctx.moveTo(tx - tw * 0.6, base - th * 0.55);
      ctx.lineTo(tx, base - th);
      ctx.lineTo(tx + tw * 0.6, base - th * 0.55);
      ctx.fill();
      ctx.fillRect(tx - 0.8, base - th - h * 0.03, 1.6, h * 0.03);
      ctx.fillRect(tx - h * 0.008, base - th - h * 0.022, h * 0.016, 1.6);
    }
    // Dym z hraníc stúpa nad mestom.
    for (let k = 0; k < 3; k++) {
      const sx = w * (0.35 + k * 0.22);
      const g = ctx.createLinearGradient(0, h * 0.1, 0, base);
      g.addColorStop(0, 'rgba(70,40,34,0)');
      g.addColorStop(1, 'rgba(90,50,38,0.4)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx - w * 0.01, base);
      ctx.quadraticCurveTo(sx - w * 0.05, h * 0.4, sx + w * 0.03, h * 0.08);
      ctx.quadraticCurveTo(sx + w * 0.07, h * 0.42, sx + w * 0.02, base);
      ctx.fill();
    }
    // Hmla pri zemi.
    const fog = ctx.createLinearGradient(0, h * 0.6, 0, h);
    fog.addColorStop(0, 'rgba(150,80,50,0)');
    fog.addColorStop(1, 'rgba(120,60,40,0.25)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, h * 0.55, w, h * 0.45);

    // Bližšie domy vpravo so šibenicou.
    ctx.fillStyle = '#08060a';
    const near = h * 0.86;
    let nx = w * 0.38;
    let n = 0;
    while (nx < w) {
      const hw = w * (0.06 + rand(n, 14) * 0.05);
      const hh = h * (0.14 + rand(n, 15) * 0.12);
      const roof = hw * (0.55 + rand(n, 16) * 0.3);
      ctx.beginPath();
      ctx.moveTo(nx, h);
      ctx.lineTo(nx, near - hh);
      ctx.lineTo(nx + hw / 2, near - hh - roof);
      ctx.lineTo(nx + hw, near - hh);
      ctx.lineTo(nx + hw, h);
      ctx.fill();
      ctx.fillRect(nx + hw * 0.7, near - hh - roof * 0.8, Math.max(3, hw * 0.08), roof * 0.5);
      nx += hw + w * 0.01;
      n++;
    }
    const win = this.window();
    ctx.fillStyle = '#000000';
    ctx.fillRect(win.x - win.size, win.y - win.size * 0.7, win.size * 2, win.size * 1.4);
    const gx = w * 0.56;
    const gh = h * 0.24;
    ctx.fillRect(gx - 2, near - gh, 4, gh + h);
    ctx.fillRect(gx - 2, near - gh, gh * 0.45, 3.5);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx + gh * 0.38, near - gh + 3);
    ctx.lineTo(gx + gh * 0.38, near - gh * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(gx + gh * 0.38, near - gh * 0.5, gh * 0.03, gh * 0.05, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Mestská hradba v popredí s cimburím.
    ctx.fillStyle = INK;
    const top = this.wallY();
    ctx.fillRect(0, top, w * 0.4, h - top);
    const merlon = Math.max(10, w * 0.022);
    for (let mx = 0; mx < w * 0.4 - merlon; mx += merlon * 2)
      if (Math.abs(mx + merlon / 2 - w * 0.2) > merlon * 1.6)
        ctx.fillRect(mx, top - merlon * 0.8, merlon, merlon * 0.8 + 1);
    ctx.beginPath();
    ctx.moveTo(w * 0.4, top);
    ctx.lineTo(w * 0.44, h);
    ctx.lineTo(w * 0.4, h);
    ctx.fill();
  }

  private draw(t: number): void {
    const ctx = this.ctx;
    const { w, h } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.backdrop, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const { x, y, s } = this.hero();
    const flicker =
      1 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.1) * 0.04 + Math.sin(t * 29) * 0.02;
    const dy = Math.sin(t * 1.3) * 0.3;
    // Fakľa v ruke (súradnice postavy 0–14 × 0–17, nohy na y = 15.4).
    const fx = x + (DOCTOR_TORCH.x - 7) * s;
    const fy = y + (DOCTOR_TORCH.y - 15.4 + dy) * s;

    // Blesk: raz za čas sa celé nebo rozsvieti.
    const cycle = t % 11;
    const flash =
      cycle < 0.08
        ? 1
        : cycle < 0.16
          ? 0.2
          : cycle < 0.26
            ? 0.8
            : Math.max(0, 0.8 - (cycle - 0.26) * 2);

    // Tma ako v hre: všade okrem kruhu svetla okolo fakle, okraje ešte tmavšie.
    const dark = ctx.createRadialGradient(fx, fy, 0, fx, fy, Math.max(w, h) * 0.9);
    const k = 1 - flash * 0.6;
    dark.addColorStop(0, 'rgba(4,2,4,0)');
    dark.addColorStop(
      Math.min(0.5, (42 * s) / Math.max(w, h)),
      `rgba(4,2,4,${(0.5 * k).toFixed(2)})`,
    );
    dark.addColorStop(1, `rgba(4,2,4,${(0.8 * k).toFixed(2)})`);
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);
    this.drawMoon(ctx);

    // Teplá žiara fakle.
    const r = 42 * s * flicker;
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
    glow.addColorStop(0, 'rgba(255,200,120,0.5)');
    glow.addColorStop(0.3, 'rgba(255,140,60,0.2)');
    glow.addColorStop(1, 'rgba(255,110,40,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = glow;
    ctx.fillRect(fx - r, fy - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over';

    this.drawHero(ctx, x, y, s, t, dy);
    this.drawFlame(ctx, fx, fy, s, t);

    // Iskry stúpajú z fakle.
    for (let i = 0; i < 10; i++) {
      const life = (t * 0.6 + rand(i, 20)) % 1;
      const ex = fx + Math.sin(t * 2 + i * 1.7) * s * 2 + (rand(i, 21) - 0.5) * s * 4;
      const ey = fy - life * s * 26;
      const green = Math.round(150 + rand(i, 22) * 80);
      ctx.fillStyle = `rgba(255,${green},80,${((1 - life) * 0.8).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(0.6, s * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }

    // Oči prízraku v okne občas zažiaria.
    const eyeCycle = t % 9;
    if (eyeCycle > 3 && eyeCycle < 6.5 && !(eyeCycle > 4.6 && eyeCycle < 4.75)) {
      const win = this.window();
      const a = Math.min(1, (eyeCycle - 3) * 2, (6.5 - eyeCycle) * 2);
      ctx.fillStyle = `rgba(238,242,255,${(a * 0.9).toFixed(2)})`;
      ctx.shadowColor = '#d8e4ff';
      ctx.shadowBlur = 8;
      for (const dx of [-0.35, 0.35]) {
        ctx.beginPath();
        ctx.ellipse(
          win.x + dx * win.size,
          win.y,
          win.size * 0.14,
          win.size * 0.08,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Dážď.
    ctx.strokeStyle = 'rgba(190,190,210,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of this.rain) {
      const ry = ((d.y + t * d.speed) % 1) * (h + 40) - 20;
      const rx = (d.x * (w + 60) - ry * 0.15 + w + 60) % (w + 60);
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + 16);
    }
    ctx.stroke();
    if (flash > 0) {
      ctx.fillStyle = `rgba(210,200,230,${(flash * 0.12).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  /** Krvavý mesiac so žiarou (kreslí sa nad tmou, aby ostal jasný). */
  private drawMoon(ctx: CanvasRenderingContext2D): void {
    const { w, h } = this;
    const mx = w * 0.8;
    const my = h * 0.2;
    const mr = Math.min(w, h) * 0.055;
    const halo = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 5);
    halo.addColorStop(0, 'rgba(230,140,110,0.22)');
    halo.addColorStop(1, 'rgba(230,140,110,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
    ctx.fillStyle = '#e8b4a0';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,80,60,0.35)';
    for (const [dx, dy, r] of [
      [-0.3, -0.2, 0.2],
      [0.25, 0.2, 0.14],
      [0.15, -0.35, 0.1],
    ] as const) {
      ctx.beginPath();
      ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Lekár (ten istý tvar ako v hre); s = mierka. */
  private drawHero(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    t: number,
    dy: number,
  ): void {
    ctx.save();
    ctx.translate(x - 7 * s, y - 15.4 * s);
    ctx.scale(s, s);
    drawDoctor(ctx, {
      legs: [
        [5.9, 0],
        [7.4, 0],
      ],
      legEnd: 15.4,
      dy,
      wave: Math.sin(t * 1.7) * 0.6 + 0.3,
    });
    ctx.restore();
  }

  /** Plameň fakle: tri vrstvy, ktoré sa vlnia. */
  private drawFlame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    t: number,
  ): void {
    const layers: [number, number, string][] = [
      [1.5, 4.4, '#ff7a2a'],
      [1.05, 3.3, '#ffc24a'],
      [0.6, 2.1, '#fff0c0'],
    ];
    for (const [w, h, color] of layers) {
      const tip = Math.sin(t * 9 + w * 3) * 0.5;
      const top = y - h * (1 + Math.sin(t * 13 + w) * 0.08) * s;
      const bottom = y + 0.3 * s;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + tip * s, top);
      ctx.bezierCurveTo(x + w * s, (top + bottom) / 2, x + w * 0.95 * s, bottom, x, bottom);
      ctx.bezierCurveTo(x - w * 0.95 * s, bottom, x - w * s, (top + bottom) / 2, x + tip * s, top);
      ctx.fill();
    }
  }
}
