import type { World } from '@/game/level';

/**
 * Gregoriánsky chorál: mužský zbor spieva jednohlasnú melódiu v cirkevnom modu nad
 * držaným základným tónom (ison). Hlas je pílový signál cez tri formantové filtre
 * (samohlásky a, o, u, e); traja speváci sú mierne rozladení a každý má iné vibrato.
 * Frázy sa skladajú ako v žalmovej psalmódii: intonácia k recitačnému tónu, recitácia,
 * kadencia späť na finálu, nádych. Medzi frázami občas udrie umieračik.
 */

/** Cirkevné mody (poltóny od finály). */
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10];
/** Pentatonika pre zvonenie uhlíkov. */
const PENTA = [0, 3, 5, 7, 10];

interface Mode {
  /** Finála (Hz), mužský hlas. */
  finalis: number;
  scale: number[];
  /** Recitačný tón (tenor) ako stupeň modu. */
  tenor: number;
  /** Trvanie jednej slabiky (s). */
  beat: number;
  /** Paralelná kvinta pod melódiou (organum) — v katedrále. */
  organum: boolean;
}

const MODES: Record<World, Mode> = {
  quarter: { finalis: 146.83, scale: DORIAN, tenor: 4, beat: 0.62, organum: false },
  catacombs: { finalis: 164.81, scale: PHRYGIAN, tenor: 5, beat: 0.75, organum: false },
  pits: { finalis: 110, scale: DORIAN, tenor: 2, beat: 0.7, organum: false },
  cathedral: { finalis: 130.81, scale: MIXOLYDIAN, tenor: 4, beat: 0.6, organum: true },
};

/** Formanty mužských samohlások: [frekvencia, zosilnenie]. */
const VOWELS: Record<string, [number, number][]> = {
  a: [
    [730, 1],
    [1090, 0.5],
    [2440, 0.18],
  ],
  o: [
    [570, 1],
    [840, 0.45],
    [2410, 0.12],
  ],
  u: [
    [300, 1],
    [870, 0.3],
    [2240, 0.08],
  ],
  e: [
    [530, 1],
    [1840, 0.35],
    [2480, 0.15],
  ],
};
const VOWEL_KEYS = ['a', 'o', 'u', 'e', 'a', 'o'];

/** Slabika: stupeň modu, dĺžka v dobách, samohláska. */
type Syllable = [number, number, string];

export class Music {
  private mode: Mode = MODES.quarter;
  private nextMode: Mode | null = null;
  private nextPhraseAt = 0;
  private phrase = 0;
  private seed = 1;
  private drone: GainNode;
  private droneLevel = 0;
  /** Ison: držaný základ zboru (mení sa s modom). */
  private ison: { oscs: OscillatorNode[]; gain: GainNode } | null = null;

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
    this.nextPhraseAt = ctx.currentTime + 0.5;
    this.startIson();
  }

  /** Mod sveta sa zmení na začiatku ďalšej frázy. */
  setWorld(world: World): void {
    const mode = MODES[world];
    if (mode === this.mode && !this.nextMode) return;
    this.nextMode = mode;
  }

  /** Tóny pentatoniky aktuálneho modu (pre zvonenie uhlíkov). */
  chimeNote(i: number): number {
    const root = this.mode.finalis * 2;
    return root * 2 ** ((Math.floor(i / 5) * 12 + PENTA[i % 5]!) / 12);
  }

  /** Volať každý snímok: naplánuje frázy s predstihom. */
  update(tension: number): void {
    const target = tension >= 1 ? 0.05 : tension > 0 ? 0.022 : 0;
    if (target !== this.droneLevel) {
      this.droneLevel = target;
      this.drone.gain.setTargetAtTime(target, this.ctx.currentTime, 1.2);
    }
    while (this.nextPhraseAt < this.ctx.currentTime + 0.8) this.schedulePhrase(this.nextPhraseAt);
  }

  private random(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  private freq(degree: number, base = this.mode.finalis): number {
    const scale = this.mode.scale;
    const octave = Math.floor(degree / 7);
    return base * 2 ** ((octave * 12 + scale[((degree % 7) + 7) % 7]!) / 12);
  }

  /** Psalmódia: intonácia → recitácia na tenore → kadencia na finálu (alebo na medianu). */
  private compose(final: boolean): Syllable[] {
    const tenor = this.mode.tenor;
    const vowel = () => VOWEL_KEYS[Math.floor(this.random() * VOWEL_KEYS.length)]!;
    const out: Syllable[] = [];
    // Intonácia: z finály po stupňoch nahor (občas so skokom).
    out.push([0, 1, vowel()]);
    for (let d = tenor > 3 ? 2 : 1; d < tenor; d += this.random() < 0.4 ? 2 : 1)
      out.push([d, 1, vowel()]);
    // Recitácia s horným susedom.
    const n = 3 + Math.floor(this.random() * 4);
    for (let i = 0; i < n; i++) {
      const up = i === n - 2 && this.random() < 0.6;
      out.push([up ? tenor + 1 : tenor, i === n - 1 ? 2 : 1, vowel()]);
    }
    // Kadencia: dolu po stupňoch, posledná slabika dlhá (neuma).
    const goal = final ? 0 : Math.max(1, tenor - 2);
    for (let d = tenor - 1; d > goal; d--) out.push([d, 1, vowel()]);
    if (final) out.push([1, 1, 'o'], [0, 3, 'u']);
    else out.push([goal, 3, 'a']);
    return out;
  }

  private schedulePhrase(t: number): void {
    if (this.nextMode) {
      this.mode = this.nextMode;
      this.nextMode = null;
      this.phrase = 0;
      this.retuneIson(t);
    }
    const mode = this.mode;
    // Každá štvrtá fráza je ticho (len ison a zvon) — chorál dýcha.
    const silent = this.phrase % 4 === 3;
    const final = this.phrase % 2 === 1;
    let length = 6 * mode.beat;
    if (!silent) {
      const notes = this.compose(final);
      length = this.choir(notes, t, mode.finalis);
      if (mode.organum) this.choir(notes, t, mode.finalis / 1.5, 0.45);
    }
    if (this.phrase % 4 === 0) this.knell(mode.finalis / 2, t + length * 0.5);
    this.phrase++;
    // Nádych medzi frázami.
    this.nextPhraseAt = t + length + mode.beat * (1.5 + this.random());
  }

  /** Zbor troch hlasov spieva frázu legato; vráti jej dĺžku. */
  private choir(notes: Syllable[], t: number, base: number, level = 1): number {
    const ctx = this.ctx;
    const beat = this.mode.beat;
    const total = notes.reduce((s, [, b]) => s + b * beat, 0);
    const end = t + total;
    const voice = ctx.createGain();
    voice.gain.value = 0;
    // Formantové filtre (spoloční pre všetkých spevákov).
    const formants = VOWELS.a!.map(([f, g]) => {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = 9;
      const amp = ctx.createGain();
      amp.gain.value = g * 2.2;
      voice.connect(bp).connect(amp);
      amp.connect(this.out);
      amp.connect(this.echo);
      return { bp, amp };
    });
    // Envelopa celej frázy a jemné nasadenie každej slabiky.
    const peak = 0.09 * level;
    voice.gain.setValueAtTime(0, t);
    voice.gain.linearRampToValueAtTime(peak, t + 0.25);
    const oscs: OscillatorNode[] = [];
    for (const [i, detune] of [-7, 0, 6].entries()) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = detune;
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.6 + i * 0.5;
      const depth = ctx.createGain();
      depth.gain.value = 5 + i;
      vib.connect(depth).connect(o.detune);
      o.connect(voice);
      vib.start(t);
      vib.stop(end + 1);
      oscs.push(o);
    }
    let at = t;
    for (const [k, [degree, beats, vowel]] of notes.entries()) {
      const f = this.freq(degree, base);
      for (const o of oscs) {
        if (k === 0) o.frequency.setValueAtTime(f, at);
        // Krátke portamento do ďalšieho tónu (spevácky prechod).
        else o.frequency.setTargetAtTime(f, at, 0.03);
      }
      VOWELS[vowel]!.forEach(([fr, g], j) => {
        formants[j]!.bp.frequency.setTargetAtTime(fr, at, 0.05);
        formants[j]!.amp.gain.setTargetAtTime(g * 2.2, at, 0.05);
      });
      if (k > 0) {
        // Nasadenie slabiky: krátky pokles hlasitosti (spoluhláska).
        voice.gain.setTargetAtTime(peak * 0.55, at - 0.04, 0.015);
        voice.gain.setTargetAtTime(peak, at + 0.03, 0.04);
      }
      at += beats * beat;
    }
    voice.gain.setTargetAtTime(0, end - 0.3, 0.25);
    for (const o of oscs) {
      o.start(t);
      o.stop(end + 1);
    }
    return total;
  }

  /** Ison: tichý držaný tón zboru na „o“ (finála o oktávu nižšie a kvinta). */
  private startIson(): void {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.03, ctx.currentTime, 2);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 570;
    bp.Q.value = 3;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 900;
    gain.connect(bp).connect(this.out);
    gain.connect(low).connect(this.out);
    const oscs = [0.5, 0.75, 0.5].map((mult, i) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = this.mode.finalis * mult;
      o.detune.value = [-5, 0, 5][i]!;
      o.connect(gain);
      o.start();
      return o;
    });
    this.ison = { oscs, gain };
  }

  private retuneIson(t: number): void {
    if (!this.ison) return;
    [0.5, 0.75, 0.5].forEach((mult, i) =>
      this.ison!.oscs[i]!.frequency.setTargetAtTime(this.mode.finalis * mult, t, 0.6),
    );
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
