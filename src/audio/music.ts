import type { World } from '@/game/level';

/**
 * Pomalá temná hudba: chorál z filtrovaných píšťal, hlboký bas, smutná melódia sláčika
 * a na začiatku každého cyklu úder umieračika. Skladba sa skladá z cyklov po štyroch
 * akordoch (každý dva takty); melódia sa opakuje s obmenami a občas stíchne.
 */

/** Prirodzená mollová a frýgická stupnica (poltóny od základu). */
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
/** Mollová pentatonika pre zvonenie svetlušiek a kryštálov. */
const PENTA = [0, 3, 5, 7, 10];

interface Key {
  /** Základný tón melódie (Hz); akordy znejú o oktávu nižšie, bas o dve. */
  root: number;
  scale: number[];
  /** Akordy ako stupne stupnice (0 = i, 5 = VI, 2 = III, 6 = VII, 3 = iv, 4 = v). */
  chords: number[];
  bpm: number;
}

const KEYS: Record<World, Key> = {
  quarter: { root: 196, scale: PHRYGIAN, chords: [0, 5, 1, 0], bpm: 46 },
  catacombs: { root: 146.83, scale: PHRYGIAN, chords: [0, 1, 0, 6], bpm: 40 },
  pits: { root: 164.81, scale: MINOR, chords: [0, 3, 5, 4], bpm: 44 },
  cathedral: { root: 220, scale: MINOR, chords: [0, 5, 3, 4], bpm: 48 },
};

/** Melodické vzorce na jeden akord (8 dôb): [stupeň od základu akordu, dĺžka]; null = pauza. */
type Pattern = [number | null, number][];
const P: Record<string, Pattern> = {
  fall: [
    [4, 2],
    [3, 1],
    [2, 1],
    [0, 3],
    [null, 1],
  ],
  rise: [
    [2, 2],
    [4, 2],
    [2, 3],
    [null, 1],
  ],
  arch: [
    [0, 1],
    [2, 1],
    [4, 2],
    [5, 1],
    [4, 1],
    [2, 2],
  ],
  high: [
    [7, 3],
    [6, 1],
    [4, 4],
  ],
  step: [
    [4, 2],
    [2, 2],
    [1, 2],
    [0, 2],
  ],
  end: [
    [2, 2],
    [1, 2],
    [0, 4],
  ],
  rest: [[null, 8]],
};

/** Poradie cyklov: melódia A, obmena B, znova A, riedka C a nakoniec len akordy. */
const SONG: Pattern[][] = [
  [P.fall!, P.rise!, P.fall!, P.end!],
  [P.high!, P.arch!, P.high!, P.step!],
  [P.fall!, P.rise!, P.fall!, P.end!],
  [P.rest!, P.rise!, P.rest!, P.end!],
  [P.rest!, P.rest!, P.rest!, P.rest!],
];

function degreeToFreq(key: Key, root: number, degree: number): number {
  const octave = Math.floor(degree / 7);
  const step = key.scale[((degree % 7) + 7) % 7]!;
  return root * 2 ** ((octave * 12 + step) / 12);
}

export class Music {
  private key: Key = KEYS.quarter;
  private nextKey: Key | null = null;
  /** Čas (ctx) začiatku ďalšieho akordu a jeho poradie v skladbe. */
  private nextChordAt = 0;
  private chordIndex = 0;
  private cycle = 0;
  private drone: GainNode;
  private droneLevel = 0;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
    private readonly echo: AudioNode,
  ) {
    // Znepokojivé dunenie (malá sekunda nízko), zosilnie pri nebezpečenstve.
    this.drone = ctx.createGain();
    this.drone.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    this.drone.connect(filter).connect(out);
    for (const f of [55, 58.27]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(this.drone);
      o.start();
    }
    this.nextChordAt = ctx.currentTime + 0.3;
  }

  /** Tónina sveta sa zmení na začiatku ďalšieho akordu (prvý raz hneď). */
  setWorld(world: World): void {
    const key = KEYS[world];
    if (key === this.key && !this.nextKey) return;
    this.nextKey = key;
  }

  /** Tóny pentatoniky aktuálnej tóniny (pre zvonenie svetlušiek). */
  chimeNote(i: number): number {
    const root = this.key.root;
    return root * 2 ** ((Math.floor(i / 5) * 12 + PENTA[i % 5]!) / 12);
  }

  /** Volať každý snímok: naplánuje akordy a tóny s predstihom. */
  update(tension: number): void {
    const target = tension >= 1 ? 0.05 : tension > 0 ? 0.022 : 0;
    if (target !== this.droneLevel) {
      this.droneLevel = target;
      this.drone.gain.setTargetAtTime(target, this.ctx.currentTime, 1.2);
    }
    while (this.nextChordAt < this.ctx.currentTime + 0.6) this.scheduleChord(this.nextChordAt);
  }

  private scheduleChord(t: number): void {
    // Pri zmene sveta začne nová tónina hneď od prvého akordu.
    if (this.nextKey) {
      this.key = this.nextKey;
      this.nextKey = null;
      this.chordIndex = 0;
      this.cycle = 0;
    }
    const key = this.key;
    const beat = 60 / key.bpm;
    const length = 8 * beat;
    const chord = key.chords[this.chordIndex]!;
    const low = key.root / 2;

    // Akord: tri tóny s pomalým nádychom a dlhým doznením.
    for (const d of [chord, chord + 2, chord + 4]) this.pad(degreeToFreq(key, low, d), t, length);
    // Bas: základ akordu o oktávu nižšie.
    this.bass(degreeToFreq(key, low / 2, chord), t, length);
    // Umieračik na začiatku každého cyklu.
    if (this.chordIndex === 0) this.knell(key.root / 2, t);

    // Melódia sláčika.
    const pattern = SONG[this.cycle % SONG.length]![this.chordIndex]!;
    let at = t;
    for (const [rel, beats] of pattern) {
      if (rel !== null) {
        let degree = chord + rel;
        if (degree > 9) degree -= 7;
        this.viol(degreeToFreq(key, key.root, degree), at, beats * beat);
      }
      at += beats * beat;
    }

    this.nextChordAt = t + length;
    this.chordIndex = (this.chordIndex + 1) % key.chords.length;
    if (this.chordIndex === 0) this.cycle++;
  }

  /** Chorál: dve rozladené píly cez tlmiaci filter, znie ako vzdialený organ. */
  private pad(freq: number, t: number, length: number): void {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.016, t + 2.6);
    g.gain.setValueAtTime(0.016, t + length - 0.5);
    g.gain.linearRampToValueAtTime(0, t + length + 2.5);
    g.connect(filter).connect(this.out);
    for (const detune of [-8, 8]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = detune;
      o.connect(g);
      o.start(t);
      o.stop(t + length + 2.6);
    }
  }

  private bass(freq: number, t: number, length: number): void {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 1.2);
    g.gain.setValueAtTime(0.07, t + length - 1);
    g.gain.linearRampToValueAtTime(0, t + length + 1);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + length + 1.1);
  }

  /** Sláčik: pomalý nádych, jemné vibrato a dlhé doznenie v ozvene. */
  private viol(freq: number, t: number, length: number): void {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    filter.Q.value = 0.7;
    const end = t + Math.max(0.6, length - 0.1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.034, t + Math.min(0.35, length * 0.4));
    g.gain.setValueAtTime(0.034, end);
    g.gain.linearRampToValueAtTime(0, end + 0.9);
    g.connect(filter);
    filter.connect(this.out);
    filter.connect(this.echo);
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5.2;
    const depth = ctx.createGain();
    depth.gain.value = freq * 0.006;
    vibrato.connect(depth);
    for (const detune of [-4, 4]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = detune;
      depth.connect(o.frequency);
      o.connect(g);
      o.start(t);
      o.stop(end + 1);
    }
    vibrato.start(t);
    vibrato.stop(end + 1);
  }

  /** Umieračik: zvon s neharmonickými alikvotami, dlho doznieva. */
  private knell(freq: number, t: number): void {
    const ctx = this.ctx;
    for (const [mult, vol, decay] of [
      [0.5, 0.05, 6],
      [1, 0.06, 4.5],
      [1.19, 0.03, 3.5],
      [1.56, 0.02, 2.6],
      [2, 0.025, 2.2],
      [2.66, 0.01, 1.4],
    ] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq * mult;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g);
      g.connect(this.out);
      g.connect(this.echo);
      o.start(t);
      o.stop(t + decay + 0.05);
    }
  }
}
