/**
 * Úvodná scéna: morový lekár zblízka, z profilu proti krvavému mesiacu. Fakľa ho osvetľuje
 * zdola, v skle masky sa odráža plameň. V tme žmurkajú oči prízrakov a keď udrie blesk,
 * na ulici za ním na okamih vidno dav nakazených. Celá scéna sa kreslí do skrytého plátna
 * a na obrazovku ide cez drevorezový shader (ako hra), takže vyzerá ako stará tlač.
 */
import { WoodcutCanvas } from '@/render/woodcut';

const INK = '#030304';

function rand(i: number, seed: number): number {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export class TitleScene {
  private ctx: CanvasRenderingContext2D;
  /** Skryté plátno so scénou; bez WebGL2 sa kreslí rovno na obrazovku. */
  private scene: HTMLCanvasElement;
  private woodcut: WoodcutCanvas | null;
  /** Statické pozadie (nebo, mesiac, mesto). */
  private backdrop = document.createElement('canvas');
  /** Silueta lekára (čierna), každý snímok sa na jej kópiu dokreslí svetlo fakle. */
  private figure = document.createElement('canvas');
  private lit = document.createElement('canvas');
  private running = false;
  private start = performance.now();
  private w = 0;
  private h = 0;
  private dpr = 1;
  private rain = Array.from({ length: 160 }, (_, i) => ({
    x: rand(i, 1),
    y: rand(i, 2),
    speed: 0.8 + rand(i, 3) * 0.6,
  }));

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.woodcut = WoodcutCanvas.create(canvas);
    this.scene = this.woodcut ? document.createElement('canvas') : canvas;
    this.ctx = this.scene.getContext('2d')!;
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

  /** Stred hlavy a mierka portrétu (1 jednotka = stotina výšky, na úzkych obrazovkách menej). */
  private head(): { x: number; y: number; s: number } {
    const { w, h } = this;
    const s = Math.min(h / 135, w / 120);
    const x = w > h * 1.2 ? w * 0.72 : w * 0.62;
    return { x, y: h * 0.47, s };
  }

  /** Plameň fakle (v súradniciach obrazovky). */
  private torch(): { x: number; y: number } {
    const { x, y, s } = this.head();
    return { x: x - 33 * s, y: y + 30 * s };
  }

  private layout(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || window.innerHeight;
    for (const c of [this.canvas, this.scene, this.backdrop, this.figure, this.lit]) {
      c.width = Math.round(this.w * this.dpr);
      c.height = Math.round(this.h * this.dpr);
    }
    this.paintBackdrop();
    this.paintFigure();
  }

  private paintBackdrop(): void {
    const ctx = this.backdrop.getContext('2d')!;
    const { w, h } = this;
    const { x: hx, y: hy, s } = this.head();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#020103');
    sky.addColorStop(0.5, '#0c0608');
    sky.addColorStop(0.85, '#22100c');
    sky.addColorStop(1, '#3a1810');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Krvavý mesiac priamo za klobúkom: lekár je proti nemu silueta.
    const mx = hx + 6 * s;
    const my = hy - 30 * s;
    const mr = 27 * s;
    const halo = ctx.createRadialGradient(mx, my, mr * 0.9, mx, my, mr * 3.2);
    halo.addColorStop(0, 'rgba(200,70,50,0.35)');
    halo.addColorStop(1, 'rgba(200,70,50,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
    const moon = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
    moon.addColorStop(0, '#f0603c');
    moon.addColorStop(1, '#a8241a');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(70,20,14,0.35)';
    for (const [dx, dy, r] of [
      [-0.35, -0.2, 0.22],
      [0.3, 0.25, 0.16],
      [0.1, -0.45, 0.1],
      [-0.1, 0.5, 0.12],
    ] as const) {
      ctx.beginPath();
      ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mesto v diaľke: strechy, veže a šibenica.
    const base = h * 0.8;
    ctx.fillStyle = '#0a0507';
    let x = -10;
    let i = 0;
    while (x < w) {
      const hw = w * (0.03 + rand(i, 9) * 0.05);
      const hh = h * (0.04 + rand(i, 10) * 0.09);
      const roof = hw * (0.5 + rand(i, 11) * 0.4);
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, base - hh);
      ctx.lineTo(x + hw / 2, base - hh - roof);
      ctx.lineTo(x + hw, base - hh);
      ctx.lineTo(x + hw, h);
      ctx.fill();
      if (rand(i, 12) < 0.18) {
        ctx.fillStyle = 'rgba(255,120,50,0.35)';
        ctx.fillRect(
          x + hw * 0.45,
          base - hh * 0.6,
          Math.max(1.5, hw * 0.08),
          Math.max(2, hh * 0.1),
        );
        ctx.fillStyle = '#0a0507';
      }
      x += hw * 0.92;
      i++;
    }
    for (const sx of [0.12, 0.4]) {
      const tx = w * sx;
      const th = h * 0.3;
      const tw = Math.max(8, w * 0.018);
      ctx.fillRect(tx - tw / 2, base - th * 0.55, tw, th);
      ctx.beginPath();
      ctx.moveTo(tx - tw * 0.6, base - th * 0.55);
      ctx.lineTo(tx, base - th);
      ctx.lineTo(tx + tw * 0.6, base - th * 0.55);
      ctx.fill();
    }
    const gx = w * 0.27;
    const gh = h * 0.2;
    ctx.fillRect(gx - 1.5, base - gh, 3, gh);
    ctx.fillRect(gx - 1.5, base - gh, gh * 0.4, 3);
    ctx.strokeStyle = '#0a0507';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx + gh * 0.34, base - gh);
    ctx.lineTo(gx + gh * 0.34, base - gh * 0.62);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(gx + gh * 0.34, base - gh * 0.56, gh * 0.03, gh * 0.06, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Dym z hraníc.
    const fog = ctx.createLinearGradient(0, h * 0.55, 0, h);
    fog.addColorStop(0, 'rgba(120,50,30,0)');
    fog.addColorStop(1, 'rgba(110,45,28,0.3)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);
  }

  /** Silueta lekára zblízka: plášť, kapucňa, klobúk, zobák, ruka s fakľou. */
  private paintFigure(): void {
    const ctx = this.figure.getContext('2d')!;
    const { x: hx, y: hy, s } = this.head();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.translate(hx, hy);
    ctx.scale(s, s);
    ctx.fillStyle = INK;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Plášť a plecia (siahajú pod spodný okraj).
    ctx.beginPath();
    ctx.moveTo(-40, 80);
    ctx.quadraticCurveTo(-36, 34, -16, 20);
    ctx.lineTo(-4, 13);
    ctx.lineTo(14, 12);
    ctx.quadraticCurveTo(40, 22, 50, 48);
    ctx.lineTo(58, 80);
    ctx.closePath();
    ctx.fill();
    // Kapucňa okolo hlavy.
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.quadraticCurveTo(-20, 14, -14, 24);
    ctx.lineTo(18, 24);
    ctx.quadraticCurveTo(22, 4, 16, -10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1, 1, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Zobák masky, zahnutý nadol.
    ctx.beginPath();
    ctx.moveTo(-9, -6);
    ctx.quadraticCurveTo(-36, -5, -60, 23);
    ctx.quadraticCurveTo(-36, 11, -9, 11);
    ctx.closePath();
    ctx.fill();
    // Klobúk so širokou strechou.
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.quadraticCurveTo(-13, -26, -10, -39);
    ctx.quadraticCurveTo(2, -42, 14, -40);
    ctx.quadraticCurveTo(16, -26, 16, -12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2, -12, 42, 6.5, -0.07, 0, Math.PI * 2);
    ctx.fill();
    // Ruka v rukavici a fakľa.
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-14, 40);
    ctx.quadraticCurveTo(-22, 48, -27, 52);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-28, 50, 5.5, 4.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-24, 80);
    ctx.lineTo(-32, 33);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-36, 28, 7.5, 7, 1.5);
    ctx.fill();
  }

  private draw(t: number): void {
    const ctx = this.ctx;
    const { w, h } = this;
    const { x: hx, y: hy, s } = this.head();
    const fire = this.torch();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.backdrop, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Blesk: dve bliknutia raz za čas; vtedy vidno dav nakazených na ulici.
    const cycle = t % 13;
    const flash =
      cycle < 0.07
        ? 1
        : cycle < 0.15
          ? 0.15
          : cycle < 0.24
            ? 0.75
            : Math.max(0, 0.75 - (cycle - 0.24) * 1.6);
    if (flash > 0.02) this.drawCrowd(ctx, flash);

    // Tma s mihotaním fakle.
    const flicker =
      1 + Math.sin(t * 11) * 0.05 + Math.sin(t * 6.7) * 0.04 + Math.sin(t * 27) * 0.02;
    const dark = ctx.createRadialGradient(fire.x, fire.y, 0, fire.x, fire.y, Math.max(w, h));
    const k = 1 - flash * 0.7;
    dark.addColorStop(0, 'rgba(2,1,2,0)');
    dark.addColorStop(0.18 * flicker, `rgba(2,1,2,${(0.35 * k).toFixed(2)})`);
    dark.addColorStop(0.7, `rgba(2,1,2,${(0.82 * k).toFixed(2)})`);
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);

    // Oči prízrakov v tme vľavo: zjavujú sa a miznú.
    for (let i = 0; i < 4; i++) {
      const period = 7 + i * 2.3;
      const phase = (t + i * 3.1) % period;
      if (phase > 3) continue;
      const a = Math.min(1, phase * 2, (3 - phase) * 2) * (1 - flash);
      if (phase > 1.4 && phase < 1.55) continue;
      const ex = w * (0.05 + rand(i, 31) * 0.4);
      const ey = h * (0.15 + rand(i, 32) * 0.5);
      const es = Math.max(1.2, s * (0.35 + rand(i, 33) * 0.3));
      ctx.fillStyle = `rgba(235,240,255,${(a * 0.85).toFixed(2)})`;
      ctx.shadowColor = '#d8e4ff';
      ctx.shadowBlur = 8;
      for (const dx of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(ex + dx * es * 2.2, ey, es, es * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Lekár: silueta, na ktorú zdola dopadá svetlo fakle.
    const lit = this.lit.getContext('2d')!;
    lit.setTransform(1, 0, 0, 1, 0, 0);
    lit.globalCompositeOperation = 'source-over';
    lit.clearRect(0, 0, this.lit.width, this.lit.height);
    lit.drawImage(this.figure, 0, 0);
    lit.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    lit.globalCompositeOperation = 'source-atop';
    const r = 60 * s * flicker;
    const warm = lit.createRadialGradient(fire.x, fire.y, 0, fire.x, fire.y, r);
    warm.addColorStop(0, 'rgba(255,160,80,0.7)');
    warm.addColorStop(0.18, 'rgba(190,70,25,0.35)');
    warm.addColorStop(0.45, 'rgba(80,20,8,0.12)');
    warm.addColorStop(1, 'rgba(0,0,0,0)');
    lit.fillStyle = warm;
    lit.fillRect(0, 0, this.w, this.h);
    // Blesk obkreslí okraje bledým svetlom.
    if (flash > 0) {
      lit.fillStyle = `rgba(150,150,190,${(flash * 0.07).toFixed(3)})`;
      lit.fillRect(0, 0, this.w, this.h);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.lit, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.drawDetails(ctx, hx, hy, s, t, flicker);
    this.drawFlame(ctx, fire.x, fire.y, s, t);

    // Žiara plameňa.
    const glow = ctx.createRadialGradient(fire.x, fire.y, 0, fire.x, fire.y, 45 * s * flicker);
    glow.addColorStop(0, 'rgba(255,190,110,0.45)');
    glow.addColorStop(0.35, 'rgba(255,110,40,0.15)');
    glow.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = glow;
    ctx.fillRect(fire.x - 50 * s, fire.y - 50 * s, 100 * s, 100 * s);
    ctx.globalCompositeOperation = 'source-over';

    // Iskry a dym stúpajú z fakle.
    for (let i = 0; i < 14; i++) {
      const life = (t * 0.45 + rand(i, 20)) % 1;
      const ex = fire.x + Math.sin(t * 1.7 + i * 1.9) * s * 3 + (rand(i, 21) - 0.5) * s * 8;
      const ey = fire.y - 8 * s - life * s * 55;
      const g = Math.round(130 + rand(i, 22) * 90);
      ctx.fillStyle = `rgba(255,${g},70,${((1 - life) * 0.85).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(0.7, s * 0.45 * (1 - life * 0.5)), 0, Math.PI * 2);
      ctx.fill();
    }

    // Dážď (pri plameni sa kvapky zalesknú).
    ctx.lineWidth = 1;
    for (const d of this.rain) {
      const ry = ((d.y + t * d.speed) % 1) * (h + 40) - 20;
      const rx = (d.x * (w + 60) - ry * 0.18 + w + 60) % (w + 60);
      const near = Math.hypot(rx - fire.x, ry - fire.y) < 40 * s;
      ctx.strokeStyle = near ? 'rgba(255,180,120,0.45)' : 'rgba(180,170,190,0.14)';
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3.5, ry + 18);
      ctx.stroke();
    }

    if (flash > 0) {
      ctx.fillStyle = `rgba(200,195,230,${(flash * 0.1).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
    // Vineta, ktorá pomaly pulzuje ako tlkot srdca.
    const beat = Math.max(0, Math.sin(t * 2.4)) ** 8 + Math.max(0, Math.sin(t * 2.4 - 0.5)) ** 8;
    const vig = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.35,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.75,
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(40,0,0,${(0.35 + beat * 0.12).toFixed(3)})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    this.woodcut?.render(this.scene, Math.max(4, s * 0.9 * this.dpr), 0.025, 0.2);
  }

  /** Šev na zobáku, okraj klobúka a sklo masky, v ktorom sa odráža plameň. */
  private drawDetails(
    ctx: CanvasRenderingContext2D,
    hx: number,
    hy: number,
    s: number,
    t: number,
    flicker: number,
  ): void {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(s, s);
    // Prešívaný šev pozdĺž zobáka, chytá svetlo zdola.
    ctx.strokeStyle = 'rgba(255,140,70,0.35)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1.6, 1.4]);
    ctx.beginPath();
    ctx.moveTo(-10, 3);
    ctx.quadraticCurveTo(-34, 4, -57, 21.5);
    ctx.stroke();
    ctx.setLineDash([]);
    // Remienok masky okolo hlavy.
    ctx.strokeStyle = 'rgba(255,130,60,0.22)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-8, 9);
    ctx.quadraticCurveTo(4, 12, 13, 4);
    ctx.stroke();
    // Sklo: tmavý rám a v ňom odraz ohňa.
    ctx.fillStyle = '#1a0c08';
    ctx.beginPath();
    ctx.arc(-7, -1, 5.4, 0, Math.PI * 2);
    ctx.fill();
    const glass = ctx.createRadialGradient(-8.2, 0.5, 0.3, -7, -1, 4.3);
    const a = 0.75 + (flicker - 1) * 3;
    glass.addColorStop(0, `rgba(255,230,160,${a.toFixed(2)})`);
    glass.addColorStop(0.5, `rgba(230,110,40,${(a * 0.8).toFixed(2)})`);
    glass.addColorStop(1, 'rgba(90,20,10,0.9)');
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.arc(-7, -1, 4.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ff8a3a';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(255,245,220,0.9)';
    ctx.beginPath();
    ctx.arc(-8.6 + Math.sin(t * 9) * 0.25, 0.8, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Kvapky stekajúce zo strechy klobúka.
    ctx.fillStyle = 'rgba(200,190,210,0.5)';
    for (let i = 0; i < 4; i++) {
      const dx = -36 + i * 9 + rand(i, 40) * 4;
      const fall = ((t * 0.9 + rand(i, 41)) % 1) * 40;
      ctx.beginPath();
      ctx.ellipse(dx, -8 + fall, 0.45, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Nakazení stoja v uliciach; vidno ich len pri blesku. */
  private drawCrowd(ctx: CanvasRenderingContext2D, flash: number): void {
    const { w, h } = this;
    const base = h * 0.86;
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, flash * 1.4).toFixed(2)})`;
    for (let i = 0; i < 14; i++) {
      const x = w * (0.02 + rand(i, 50) * 0.5);
      const sc = h * (0.05 + rand(i, 51) * 0.05);
      ctx.save();
      ctx.translate(x, base + rand(i, 52) * h * 0.06);
      ctx.scale(sc / 17, sc / 17);
      // Zhrbená postava s ovisnutými rukami.
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-2.4, -8);
      ctx.quadraticCurveTo(-2, -14, 2, -13);
      ctx.quadraticCurveTo(4, -11, 3.4, -6);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3.6, -13.2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(3, -10, 1.1, 7);
      ctx.restore();
    }
  }

  /** Veľký plameň fakle: tri vrstvy, ktoré sa vlnia. */
  private drawFlame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    t: number,
  ): void {
    const layers: [number, number, string][] = [
      [4.6, 15, '#ff6a20'],
      [3.2, 11, '#ffb040'],
      [1.8, 6.5, '#fff0c0'],
    ];
    for (const [fw, fh, color] of layers) {
      const tip = Math.sin(t * 8 + fw * 3) * 1.6;
      const top = y - fh * (1 + Math.sin(t * 12 + fw) * 0.1) * s;
      const bottom = y + 1.5 * s;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + tip * s, top);
      ctx.bezierCurveTo(x + fw * s, (top + bottom) / 2, x + fw * 0.95 * s, bottom, x, bottom);
      ctx.bezierCurveTo(
        x - fw * 0.95 * s,
        bottom,
        x - fw * s,
        (top + bottom) / 2,
        x + tip * s,
        top,
      );
      ctx.fill();
    }
  }
}
