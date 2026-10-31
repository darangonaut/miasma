import type { GameEvent } from '@/game/game';
import type { World } from '@/game/level';
import { Music } from './music';

/** Syntetizované zvuky a pomalá hudba (Web Audio, bez súborov). */
export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private echo: DelayNode | null = null;
  private muted = false;
  private music: Music | null = null;
  private world: World = 'quarter';
  private rainGain: GainNode | null = null;
  private chime = 0;
  private chimeTime = 0;
  private padNodes: AudioNode[] = [];

  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(ctx.destination);
    // Ozvena pre hudbu a zvonenie.
    this.echo = ctx.createDelay(1);
    this.echo.delayTime.value = 0.38;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;
    const wet = ctx.createGain();
    wet.gain.value = 0.4;
    this.echo.connect(feedback).connect(this.echo);
    this.echo.connect(wet).connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.5;
    this.musicBus.connect(this.master);
    this.musicBus.connect(this.echo);
    this.startPad();
    this.music = new Music(ctx, this.musicBus, this.echo);
    this.music.setWorld(this.world);
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(muted ? 0 : 0.6, this.ctx.currentTime, 0.05);
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Vietor v pozadí. */
  private startPad(): void {
    const ctx = this.ctx!;
    // Vietor: filtrovaný šum s pomalým kolísaním.
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(2);
    noise.loop = true;
    const wind = ctx.createBiquadFilter();
    wind.type = 'bandpass';
    wind.frequency.value = 500;
    wind.Q.value = 0.6;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.025;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(wind.frequency);
    noise.connect(wind).connect(windGain).connect(this.master!);
    this.windFilter = wind;
    this.windGain = windGain;
    // Dážď: vysoký šum, zapína sa podľa sveta.
    const rain = ctx.createBufferSource();
    rain.buffer = this.noiseBuffer(3);
    rain.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 2500;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    rain.connect(rainFilter).connect(this.rainGain).connect(this.master!);
    noise.start();
    lfo.start();
    rain.start();
    this.padNodes.push(noise, lfo, rain);
    this.applyRain();
  }

  private applyRain(): void {
    if (!this.ctx || !this.rainGain) return;
    const on = this.world === 'quarter' || this.world === 'pits';
    this.rainGain.gain.setTargetAtTime(on ? 0.03 : 0, this.ctx.currentTime, 0.5);
  }

  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  /** Sila vetra v pozadí (0 = tichý vánok, 1 = víchrica). */
  setWind(strength: number): void {
    if (!this.ctx || !this.windGain || !this.windFilter) return;
    const t = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(0.025 + strength * 0.13, t, 0.15);
    this.windFilter.frequency.setTargetAtTime(500 + strength * 500, t, 0.2);
  }

  /** Hudba podľa sveta (tónina, tempo). */
  setWorld(world: World): void {
    this.world = world;
    this.music?.setWorld(world);
    this.applyRain();
  }

  /** Volať každý snímok: hudba a napätie (0 = pokoj, 1 = nebezpečenstvo). */
  update(dt: number, tension: number): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.chimeTime -= dt;
    if (this.chimeTime <= 0) this.chime = 0;
    this.music?.update(tension);
  }

  /** Tón pentatoniky v tónine sveta. */
  private note(i: number): number {
    return this.music?.chimeNote(i) ?? 293.66 * 2 ** (i / 5);
  }

  play(events: GameEvent[]): void {
    if (!this.ctx) return;
    for (const e of events) {
      switch (e.type) {
        case 'jump':
          // Šuchot plášťa.
          this.noise(0.14, 1400, 0.05, 'bandpass');
          break;
        case 'land':
          this.noise(0.08, 260, 0.1);
          break;
        case 'firefly': {
          // Stúpajúce zvonenie pri zbieraní za sebou.
          const note = this.note(Math.min(9, this.chime));
          this.chime++;
          this.chimeTime = 1.2;
          this.tone(note * 2, 'sine', 0.12, 0.6, this.echo ?? this.master!);
          this.tone(note * 2, 'sine', 0.1, 0.4);
          break;
        }
        case 'crystal':
          [0, 2, 4, 7].forEach((n, i) =>
            this.tone(this.note(n) * 2, 'triangle', 0.1, 0.8, this.master!, i * 0.08),
          );
          break;
        case 'lantern':
          this.noise(0.5, 1200, 0.12, 'bandpass');
          [0, 2, 4].forEach((n, i) =>
            this.tone(this.note(n), 'triangle', 0.09, 1.5, this.master!, 0.1 + i * 0.1),
          );
          break;
        case 'flare':
          this.noise(0.45, 900, 0.18, 'bandpass');
          this.sweep(90, 180, 'sawtooth', 0.06, 0.4);
          break;
        case 'windup':
          // Syčanie prízraku pred výpadom.
          this.noise(0.45, 1800, 0.07, 'bandpass');
          this.sweep(120, 240, 'sawtooth', 0.03, 0.45);
          break;
        case 'lunge':
          this.noise(0.35, 2500, 0.07, 'highpass');
          break;
        case 'ghoulNotice':
          // Chrčanie nakazeného, keď zbadá fakľu.
          this.groan();
          break;
        case 'ignite':
          this.noise(0.6, 1500, 0.1, 'bandpass');
          this.noise(0.3, 400, 0.08);
          break;
        case 'burnt':
          this.noise(0.35, 300, 0.1);
          break;
        case 'key':
          [7, 9, 11].forEach((n, i) =>
            this.tone(this.note(n) * 2, 'triangle', 0.05, 0.4, this.master!, i * 0.05),
          );
          break;
        case 'coin':
          this.tone(this.note(9) * 4, 'square', 0.025, 0.12);
          this.tone(this.note(11) * 4, 'square', 0.02, 0.15, this.master!, 0.05);
          break;
        case 'doorOpen':
          this.sweep(90, 160, 'sawtooth', 0.06, 0.6);
          this.noise(0.3, 600, 0.08);
          break;
        case 'saved':
          [0, 2, 4, 7, 9].forEach((n, i) =>
            this.tone(this.note(n), 'sine', 0.06, 1.6, this.echo ?? this.master!, i * 0.12),
          );
          break;
        case 'cartTwitch':
          // Vŕzganie voza: krátke trhané škrípanie dreva.
          this.sweep(320, 260, 'sawtooth', 0.025, 0.25);
          this.noiseAt(0.3, 0.12, 900, 0.03);
          break;
        case 'cartRise':
          this.noise(0.4, 700, 0.1);
          if (e.survivor) {
            // Preživší zalapá po dychu a rozkašle sa.
            this.noise(0.5, 1400, 0.06, 'bandpass');
            [0.5, 0.75, 1].forEach((d) => this.noiseAt(d, 0.15, 650, 0.07));
          } else {
            this.groan();
            this.sweep(70, 140, 'sawtooth', 0.06, 0.9);
          }
          break;
        case 'turned':
          this.groan();
          this.sweep(200, 60, 'sawtooth', 0.07, 1);
          break;
        case 'cure':
          this.tone(this.note(4) * 2, 'sine', 0.06, 0.9, this.echo ?? this.master!);
          this.noise(0.3, 2000, 0.04, 'highpass');
          break;
        case 'herb':
          [0, 4, 7].forEach((n, i) =>
            this.tone(this.note(n) * 2, 'sine', 0.07, 0.7, this.echo ?? this.master!, i * 0.06),
          );
          break;
        case 'shield':
          // Fakľa pod plášťom: tlmený šuchot; vytiahnutie zasyčí.
          this.noise(0.2, e.on ? 500 : 1800, 0.06, e.on ? 'lowpass' : 'bandpass');
          break;
        case 'fogBurn':
          this.noise(0.25, 2400, 0.04, 'highpass');
          break;
        case 'ghoulDie':
          this.noise(0.35, 500, 0.14);
          this.sweep(160, 50, 'sawtooth', 0.08, 0.5);
          break;
        case 'hurt':
          this.sweep(300, 90, 'sawtooth', 0.12, 0.3);
          break;
        case 'shadeDie':
          this.sweep(700, 120, 'triangle', 0.1, 0.5);
          this.noise(0.4, 3000, 0.06, 'highpass');
          break;
        case 'throw':
          this.sweep(500, 1400, 'triangle', 0.06, 0.15);
          this.noise(0.15, 3000, 0.05, 'highpass');
          break;
        case 'swing':
          this.noise(0.16, 900, 0.07, 'bandpass');
          break;
        case 'caneHit':
          this.sweep(150, 55, 'square', 0.12, 0.12);
          this.noise(0.1, 1400, 0.1);
          break;
        case 'ratDie':
          this.sweep(2400, 900, 'square', 0.04, 0.15);
          break;
        case 'squeak':
          this.sweep(2600, 3400, 'square', 0.025, 0.07);
          this.sweep(3000, 2200, 'square', 0.02, 0.06);
          break;
        case 'fizzle':
          this.noise(0.12, 4000, 0.04, 'highpass');
          break;
        case 'crumble':
          this.noise(0.4, 300, 0.12);
          break;
        case 'bounce':
          this.sweep(160, 640, 'sine', 0.12, 0.25);
          break;
        case 'icicle':
          this.noise(0.25, 5000, 0.05, 'highpass');
          break;
        case 'shatter':
          this.noise(0.3, 6000, 0.08, 'highpass');
          [7, 9, 8].forEach((n, i) =>
            this.tone(this.note(n) * 2, 'triangle', 0.04, 0.3, this.master!, i * 0.04),
          );
          break;
        case 'shadeHit':
          this.sweep(220, 80, 'square', 0.1, 0.2);
          this.noise(0.25, 2000, 0.06, 'highpass');
          break;
        case 'died':
          if (e.cause === 'miasma')
            [0, 0.25, 0.45].forEach((d) => this.noiseAt(d, 0.18, 700, 0.12));
          if (e.cause === 'water') this.noise(0.6, 600, 0.15, 'bandpass');
          else this.noise(0.25, 400, 0.14);
          this.sweep(220, 40, 'sawtooth', 0.08, 1.2);
          break;
        case 'gust':
          this.noise(1.2, 700, 0.08, 'bandpass');
          break;
        case 'nestIgnite':
          this.noise(0.6, 900, 0.12);
          this.sweep(120, 260, 'sawtooth', 0.05, 0.5);
          break;
        case 'nestBurnt':
          this.noise(0.5, 300, 0.1);
          break;
        case 'gateLocked':
          this.sweep(110, 70, 'square', 0.08, 0.3);
          break;
        case 'bellWarn':
          this.bell(0.025, 0);
          break;
        case 'bell':
          [0, 1.7, 3.4].forEach((d) => this.bell(0.11, d));
          break;
        case 'strayBell':
          // Puknutý zvon: nižší, rozladený úder a po ňom ticho.
          this.bell(0.14, 0, 61.7);
          this.bell(0.05, 0.02, 64.3);
          break;
        case 'lightning':
          this.noise(0.25, 3000, 0.12, 'highpass');
          this.thunder(0.35 + Math.random() * 0.6);
          break;
        case 'respawn':
          this.tone(this.note(0), 'sine', 0.08, 0.6);
          break;
        case 'exit':
          [0, 2, 4, 5, 7, 9].forEach((n, i) =>
            this.tone(this.note(n), 'triangle', 0.1, 1.4, this.master!, i * 0.12),
          );
          this.noise(1.2, 800, 0.1, 'bandpass');
          break;
      }
    }
  }

  /** Hlboké chrčanie: píla s kolísajúcou výškou cez tlmiaci filter. */
  private groan(): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(95, t);
    o.frequency.linearRampToValueAtTime(70, t + 0.7);
    const wobble = ctx.createOscillator();
    wobble.frequency.value = 9;
    const depth = ctx.createGain();
    depth.gain.value = 8;
    wobble.connect(depth).connect(o.frequency);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(f).connect(g).connect(this.master!);
    o.start(t);
    wobble.start(t);
    o.stop(t + 0.85);
    wobble.stop(t + 0.85);
  }

  /** Veľký zvon: neharmonické alikvoty, dlhé doznievanie. */
  private bell(volume: number, delay: number, base = 73.42): void {
    for (const [mult, v, decay] of [
      [0.5, 0.7, 7],
      [1, 1, 5],
      [1.2, 0.5, 4],
      [1.5, 0.35, 3],
      [2, 0.45, 2.6],
      [2.74, 0.2, 1.6],
      [3.76, 0.1, 1],
    ] as const)
      this.tone(base * mult, 'sine', volume * v, decay, this.echo ?? this.master!, delay);
    this.tone(base * 2, 'sine', volume * 0.4, 4, this.master!, delay);
  }

  private tone(
    freq: number,
    type: OscillatorType,
    volume: number,
    length: number,
    out: AudioNode = this.master!,
    delay = 0,
  ): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + length + 0.05);
  }

  private sweep(
    from: number,
    to: number,
    type: OscillatorType,
    volume: number,
    length: number,
  ): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + length);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + length + 0.05);
  }

  private noise(
    length: number,
    freq: number,
    volume: number,
    type: BiquadFilterType = 'lowpass',
  ): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(length);
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
  }

  /** Krátky šum s oneskorením (kašeľ pri nákaze). */
  private noiseAt(delay: number, length: number, freq: number, volume: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(length);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
  }

  /** Hrom: hlboké dunenie s oneskorením po blesku. */
  private thunder(delay: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(3);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 160;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
  }

  private noiseCache = new Map<number, AudioBuffer>();

  private noiseBuffer(length: number): AudioBuffer {
    const cached = this.noiseCache.get(length);
    if (cached) return cached;
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseCache.set(length, buffer);
    return buffer;
  }
}
