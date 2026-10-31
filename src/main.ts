import '@fontsource/unifrakturmaguntia/400.css';
import '@fontsource/grenze-gotisch/500.css';
import '@fontsource/grenze-gotisch/700.css';
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/eb-garamond/600.css';
import './styles.css';
import { Sound } from './audio/audio';
import {
  BELL_FRENZY,
  BELL_PERIOD,
  BELL_WARN,
  DREAD_LIMIT,
  Game,
  HERB_MAX,
  OIL_MAX,
  type GameEvent,
} from './game/game';
import { parseLevel, survivorTotal } from './game/level';
import { ending, secretUnlocked } from './game/story';
import { LEVELS } from './game/levels';
import {
  SHOP,
  buy,
  levelCoins,
  owned,
  parseSave,
  recordLevel,
  type SaveData,
  type ShopItem,
} from './game/save';
import { Controls } from './input/input';
import { Renderer } from './render/renderer';
import { getLanguage, hasKey, setLanguage, t, type Key, type Language } from './ui/i18n';
import { TitleScene } from './ui/title';

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const host = $('#game');
const hud = $('#hud');
const start = $('#start');
const pausedScreen = $('#paused');
const done = $('#done');
const victory = $('#victory');
const hint = $('#hint');
const banner = $('#banner');
const toast = $('#toast');
const hurt = $('#hurt');
const dread = $('#dread');
const sick = $('#sick');
const touch = $('#touch');
const diary = $('#diary');

// --- Uložený postup ---
const SAVE_KEY = 'miasma.save';
function readSave(): SaveData {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return parseSave(null);
  }
}
function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // úložisko nedostupné — hra pokračuje bez uloženia
  }
}

const sound = new Sound();
const controls = new Controls(touch);
controls.onTouch = () => {
  touch.hidden = !game;
  refreshTexts();
};
const renderer = new Renderer();
const rendererReady = renderer.init(host);
let game: Game | null = null;
let levelIndex = 0;
let paused = false;
let doneTimer = -1;
let oilWarned = false;
/** Otvorená strana denníka: hra stojí, kým ju hráč nezavrie. */
let diaryOpen = false;
let diaryShownAt = 0;

function openDiary(title: string, text: string): void {
  $('.diary-title').textContent = title;
  $('.diary-text').textContent = text;
  $('.diary-close').textContent = t('diaryClose');
  diary.hidden = false;
  diaryOpen = true;
  diaryShownAt = performance.now();
  controls.reset();
}

function closeDiary(): void {
  // Krátka pauza, aby stlačenie, ktorým hráč stranu zdvihol, ju hneď nezavrelo.
  if (!diaryOpen || performance.now() - diaryShownAt < 600) return;
  diary.hidden = true;
  diaryOpen = false;
  controls.reset();
}
diary.addEventListener('pointerdown', closeDiary);
/** Súčty za celý svet (pre záverečnú obrazovku). */
const title = new TitleScene($<HTMLCanvasElement>('.title-bg'));

function levelName(index: number): string {
  const name = LEVELS[index]!.name;
  return hasKey(name) ? t(name) : name;
}

const WORLD_NAMES: Record<string, Key> = {
  quarter: 'world1',
  catacombs: 'world2',
  pits: 'world3',
  cathedral: 'world4',
};

/** „Katakomby 2/4“ — poradie levelu v rámci jeho sveta. */
function levelLabel(index: number): string {
  const world = LEVELS[index]!.world;
  const inWorld = LEVELS.filter((l) => l.world === world);
  return t('levelLabel', {
    world: t(WORLD_NAMES[world]!),
    n: inWorld.indexOf(LEVELS[index]!) + 1,
    total: inWorld.length,
  });
}

function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // úložisko nedostupné
  }
}

function hintText(key: string): string {
  const touchKey = `${key}Touch`;
  if (controls.touchMode && hasKey(touchKey)) return t(touchKey);
  return hasKey(key) ? t(key as Key) : key;
}

function refreshTexts(): void {
  $('.tagline').textContent = t('tagline');
  const save = readSave();
  // S uloženým postupom: veľké „Pokračovať“ a menšie „Nová hra“ (s potvrdením).
  const play = $<HTMLButtonElement>('.play');
  const newGame = $<HTMLButtonElement>('.new-game');
  play.hidden = save.unlocked > 0;
  play.textContent = t('play');
  newGame.hidden = save.unlocked === 0;
  newGame.textContent = t('newGame');
  newGame.dataset.confirm = '';
  const cont = $<HTMLButtonElement>('.continue');
  const resumeAt = Math.min(save.unlocked, LEVELS.length - 1);
  cont.hidden = save.unlocked === 0;
  cont.textContent = t('continue', { level: levelName(resumeAt) });
  $('.controls').textContent = controls.touchMode ? t('controlsTouch') : t('controlsDesktop');
  for (const b of document.querySelectorAll<HTMLButtonElement>('.langs button'))
    b.classList.toggle('active', b.dataset.lang === getLanguage());
  $('.paused-title').textContent = t('paused');
  $('.resume').textContent = t('resume');
  $('.restart').textContent = t('restart');
  $('.sound-toggle').textContent = sound.isMuted ? t('soundOff') : t('soundOn');
  $('.to-menu').textContent = t('toMenu');
  $('.paused-hint').textContent = t('pausedHint');
  $('.done-title').textContent = t('levelDone');
  $('.next').textContent = t('next');
  $('.replay').textContent = t('replay');
  $('.victory-menu').textContent = t('toMenu');
  $('.rotate-text').textContent = t('rotate');
}

for (const b of document.querySelectorAll<HTMLButtonElement>('.langs button')) {
  b.addEventListener('click', () => {
    setLanguage(b.dataset.lang as Language);
    refreshTexts();
  });
}

// --- Obrazovky ---
/** Kedy sa ukázala obrazovka po leveli (medzerník ju nepreskočí hneď, keď ešte skáčeš). */
let doneShownAt = 0;

function show(screen: HTMLElement | null): void {
  if (screen === done && done.hidden) doneShownAt = performance.now();
  for (const s of [start, pausedScreen, done, victory]) s.hidden = s !== screen;
  if (screen === start) title.run();
  else title.stop();
}

let bannerTimer = 0;
function showBanner(text: string, sub = ''): void {
  banner.innerHTML = '';
  banner.append(text);
  if (sub) {
    const small = document.createElement('small');
    small.textContent = sub;
    banner.append(small);
  }
  banner.classList.add('show');
  window.clearTimeout(bannerTimer);
  bannerTimer = window.setTimeout(() => banner.classList.remove('show'), 2600);
}

let toastTimer = 0;
function showToast(text: string): void {
  toast.textContent = text;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

async function startLevel(index: number): Promise<void> {
  await rendererReady;
  sound.start();
  levelIndex = index;
  const save = readSave();
  game = new Game(parseLevel(LEVELS[index]!), save.perks, save.herbs);
  sound.setWorld(LEVELS[index]!.world);
  renderer.setGame(game);
  paused = false;
  doneTimer = -1;
  oilWarned = false;
  controls.reset();
  show(null);
  hud.hidden = false;
  touch.hidden = !controls.touchMode;
  document.body.classList.add('playing');
  $('.level-label').textContent = levelLabel(index);
  diary.hidden = true;
  diaryOpen = false;
  // Nová hra začína prológom.
  if (index === 0 && save.unlocked === 0) openDiary(t('diaryTitle'), t('prologue'));
  showBanner(levelName(index), levelLabel(index));
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug'))
    (window as unknown as { __miasma: unknown }).__miasma = { game, renderer };
}

function toMenu(): void {
  game = null;
  sound.setWind(0);
  paused = false;
  hud.hidden = true;
  touch.hidden = true;
  hint.hidden = true;
  document.body.classList.remove('playing');
  refreshTexts();
  show(start);
}

function setPaused(value: boolean): void {
  if (!game || game.state === 'done') return;
  paused = value;
  controls.reset();
  if (paused) {
    refreshTexts();
    show(pausedScreen);
    sound.suspend();
  } else {
    show(null);
    sound.resume();
  }
}

$('.play').addEventListener('click', () => void startLevel(0));
$('.new-game').addEventListener('click', (e) => {
  const button = e.currentTarget as HTMLButtonElement;
  if (!button.dataset.confirm) {
    button.dataset.confirm = '1';
    button.textContent = t('newGameConfirm');
    return;
  }
  clearSave();
  refreshTexts();
  void startLevel(0);
});
$('.continue').addEventListener(
  'click',
  () => void startLevel(Math.min(readSave().unlocked, LEVELS.length - 1)),
);
$('.resume').addEventListener('click', () => setPaused(false));
$('.restart').addEventListener('click', () => void startLevel(levelIndex));
$('.to-menu').addEventListener('click', () => toMenu());
$('.sound-toggle').addEventListener('click', () => {
  sound.setMuted(!sound.isMuted);
  refreshTexts();
});
$('.pause-btn').addEventListener('click', () => setPaused(true));
$('.next').addEventListener('click', () => {
  if (levelIndex + 1 < LEVELS.length) void startLevel(levelIndex + 1);
  else showVictory();
});
$('.replay').addEventListener('click', () => void startLevel(levelIndex));
$('.victory-menu').addEventListener('click', () => toMenu());
window.addEventListener('keydown', (e) => {
  if (diaryOpen) {
    if (!e.repeat) closeDiary();
    return;
  }
  if (e.code === 'Escape' || e.code === 'KeyP') setPaused(!paused);
  else if ((e.code === 'Enter' || e.code === 'Space') && !done.hidden) {
    // Medzerník je aj skok: len nové stlačenie a až chvíľu po zobrazení obrazovky.
    e.preventDefault();
    if (e.code === 'Space' && (e.repeat || performance.now() - doneShownAt < 500)) return;
    $<HTMLButtonElement>('.next').click();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game && !paused && game.state !== 'done') setPaused(true);
});

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const DEATHS: Record<string, Key> = {
  thorns: 'diedThorns',
  fall: 'diedFall',
  dark: 'diedDark',
  water: 'diedWater',
  icicle: 'diedIcicle',
  shade: 'diedShade',
  ghoul: 'diedGhoul',
  miasma: 'diedMiasma',
  rats: 'diedRats',
};

function finishLevel(g: Game): void {
  const def = LEVELS[levelIndex]!;
  const result = {
    fireflies: g.fireflyCount,
    crystals: g.crystalCount,
    survivors: g.savedCount,
    nests: g.nests.length,
    herbs: g.herbsCarried,
    coins: g.coinCount,
  };
  const before = readSave();
  const earned = levelCoins(before, def.id, result);
  writeSave(recordLevel(before, levelIndex, def.id, result));
  $('.shop-earned').textContent = earned > 0 ? t('coinsEarned', { n: earned }) : '';
  renderShop();
  $('.done-level').textContent = levelName(levelIndex);
  $('.done-stats').textContent = t('stats', {
    f: g.fireflyCount,
    ft: g.fireflies.length,
    c: g.crystalCount,
    ct: g.crystals.length,
    time: formatTime(g.time),
    d: g.deaths,
  });
  // Posledný level sveta (nie celej hry): ohlási ďalší svet.
  const doneWorld = $('.done-world');
  const next = LEVELS[levelIndex + 1];
  doneWorld.hidden = !next || next.world === def.world;
  if (next)
    doneWorld.textContent = t('worldDone', {
      world: t(WORLD_NAMES[def.world]!),
      next: t(WORLD_NAMES[next.world]!),
    });
  hint.hidden = true;
  touch.hidden = true;
  show(done);
}

const SHOP_ITEMS: ShopItem[] = ['herb', 'flask', 'mask', 'cane'];
const SHOP_KEYS: Record<ShopItem, [Key, Key]> = {
  herb: ['shopHerb', 'shopHerbDesc'],
  flask: ['shopFlask', 'shopFlaskDesc'],
  mask: ['shopMask', 'shopMaskDesc'],
  cane: ['shopCane', 'shopCaneDesc'],
};

/** Lekáreň na obrazovke po leveli: groše a tovar s cenou a úrovňou. */
function renderShop(): void {
  const save = readSave();
  $('.shop-title').textContent = t('shopTitle');
  $('.shop-coins').textContent = t('coins', { n: save.coins });
  const list = $('.shop-items');
  list.innerHTML = '';
  for (const item of SHOP_ITEMS) {
    const { price, max } = SHOP[item];
    const have = owned(save, item);
    const [name, desc] = SHOP_KEYS[item];
    const b = document.createElement('button');
    b.className = 'shop-item';
    b.disabled = have >= max || save.coins < price;
    const title = document.createElement('strong');
    title.textContent = t(name);
    const info = document.createElement('small');
    info.textContent = t(desc);
    const meta = document.createElement('span');
    meta.textContent = have >= max ? t('soldOut') : `${price} ₰ · ${have}/${max}`;
    b.append(title, info, meta);
    b.addEventListener('click', () => {
      const next = buy(readSave(), item);
      if (!next) return;
      writeSave(next);
      sound.play([{ type: 'herb', x: 0, y: 0 }]);
      renderShop();
    });
    list.append(b);
  }
}

/** Záver hry po poslednom leveli. */
function showVictory(): void {
  const save = readSave();
  let f = 0;
  let ft = 0;
  let c = 0;
  let ct = 0;
  let s = 0;
  let st = 0;
  for (const def of LEVELS) {
    const level = parseLevel(def);
    ft += level.fireflies.length;
    ct += level.crystals.length;
    st += survivorTotal(level);
    f += save.best[def.id]?.fireflies ?? 0;
    c += save.best[def.id]?.crystals ?? 0;
    s += save.best[def.id]?.survivors ?? 0;
  }
  $('.victory-stats').textContent = t('victoryStats', {
    f,
    ft,
    c,
    ct,
    s,
    st,
    d: game?.deaths ?? 0,
  });
  // Koniec podľa zachránených; so všetkými stranami denníka aj tajomstvo.
  const end = ending(s, st);
  const ENDINGS = {
    good: ['endGoodTitle', 'endGood'],
    mid: ['endMidTitle', 'endMid'],
    bad: ['endBadTitle', 'endBad'],
  } as const;
  $('.victory-title').textContent = t(ENDINGS[end][0]);
  $('.victory-story').textContent = t(ENDINGS[end][1]);
  const secret = $('.victory-secret');
  secret.hidden = !secretUnlocked(c, ct);
  secret.textContent = t('endSecret');
  $('.coming-soon').textContent = t('comingSoon');
  sound.setWind(0);
  game = null;
  hud.hidden = true;
  document.body.classList.remove('playing');
  show(victory);
}

function onEvents(events: GameEvent[]): void {
  for (const e of events) {
    if (e.type === 'hurt') {
      hurt.style.opacity = '1';
      window.setTimeout(() => (hurt.style.opacity = '0'), 160);
    } else if (e.type === 'died') {
      showToast(t(DEATHS[e.cause]!));
    } else if (e.type === 'crystal') {
      openDiary(t('diaryTitle'), t(`page${levelIndex + 1}` as Key));
    } else if (e.type === 'key') {
      showToast(t('keyToast'));
    } else if (e.type === 'saved') {
      showToast(t('savedToast'));
    } else if (e.type === 'turned') {
      showToast(t('turnedToast'));
    } else if (e.type === 'cartRise') {
      showToast(t(e.survivor ? 'cartSurvivor' : 'cartGhoul'));
    } else if (e.type === 'gateLocked') {
      showToast(t('gateLocked', { n: e.left }));
    } else if (e.type === 'nestBurnt') {
      if (game && game.nestsBurnt === game.nests.length) showToast(t('nestsDone'));
    } else if (e.type === 'bell') {
      showToast(hintText('bellToll'));
    } else if (e.type === 'exit') {
      doneTimer = 1.8;
    } else if (e.type === 'firefly' || e.type === 'lantern') {
      if (game && game.oil > OIL_MAX * 0.3) oilWarned = false;
    }
  }
}

function updateHud(g: Game): void {
  const fill = $('.oil-fill');
  fill.style.width = `${(g.oil / OIL_MAX) * 100}%`;
  const low = g.oil < OIL_MAX * 0.25;
  $('.oil').classList.toggle('low', low);
  if (low && !oilWarned && g.state === 'play') {
    oilWarned = true;
    showToast(t('oilLow'));
  }
  $('.nests').textContent = g.nests.length ? `♨ ${g.nestsBurnt}/${g.nests.length}` : '';
  $('.fireflies').textContent = `✶ ${g.fireflyCount}/${g.fireflies.length}`;
  $('.herbs').textContent = `❦ ${g.herbsCarried}/${HERB_MAX}`;
  $('.coins-found').textContent = g.coins.length ? `₰ ${g.coinCount}` : '';
  $('.key-icon').textContent = g.keysCarried ? `⚷ ${g.keysCarried}` : '';
  $('.herb-btn').classList.toggle('empty', g.herbsCarried === 0);
  $('.crystals').textContent = g.crystals.length ? `❧ ${g.crystalCount}/${g.crystals.length}` : '';
  // Morový zvon: pásik sa plní do ďalšieho úderu, pri besnení sa vyprázdňuje.
  const bell = $('.bell');
  const left = g.nextBell - g.time;
  bell.classList.toggle('soon', left < BELL_WARN && g.frenzy <= 0);
  bell.classList.toggle('ringing', g.frenzy > 0);
  $('.bell-fill').style.width = `${
    g.frenzy > 0 ? (g.frenzy / BELL_FRENZY) * 100 : Math.max(0, 1 - left / BELL_PERIOD) * 100
  }%`;
  dread.style.opacity = String(Math.min(1, g.dread / DREAD_LIMIT) * 0.9);
  const infection = $('.infection');
  infection.hidden = g.infection <= 0.001;
  $('.infection-fill').style.width = `${Math.min(1, g.infection) * 100}%`;
  sick.style.opacity = String(Math.min(1, g.infection) * 0.85);
  if (g.sign && g.state === 'play') {
    const text = hintText(g.sign.hint);
    if (hint.textContent !== text) hint.textContent = text;
    hint.hidden = false;
  } else hint.hidden = true;
}

// --- Herná slučka (pevný krok 1/60 s) ---
const STEP = 1 / 60;
let last = performance.now();
let acc = 0;
function frame(now: number): void {
  // Ďalší snímok sa naplánuje hneď, aby chyba v jednom snímku nezastavila hru.
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (game && !paused) {
    // Pri otvorenej strane denníka hra stojí, obraz sa však kreslí ďalej.
    acc = diaryOpen ? 0 : acc + dt;
    while (acc >= STEP) {
      acc -= STEP;
      const events = game.step(STEP, controls.read());
      if (events.length) {
        renderer.handle(events);
        sound.play(events);
        onEvents(events);
      }
    }
    if (doneTimer > 0) {
      doneTimer -= dt;
      if (doneTimer <= 0) finishLevel(game);
    }
    renderer.render(dt);
    updateHud(game);
    sound.update(
      dt,
      game.oil <= 0
        ? 1
        : game.shades.some((s) => s.alive && s.active) ||
            game.ghouls.some((g) => g.alive && g.chasing)
          ? 0.6
          : 0,
    );
    sound.setWind(Math.abs(game.wind));
  }
}
requestAnimationFrame(frame);

setLanguage(getLanguage());
refreshTexts();
show(start);

// Ladenie: ?debug&level=N spustí rovno level N (od 1).
const params = new URLSearchParams(location.search);
const debugLevel = Number(params.get('level'));
if (params.has('debug') && debugLevel >= 1 && debugLevel <= LEVELS.length)
  void startLevel(debugLevel - 1);
