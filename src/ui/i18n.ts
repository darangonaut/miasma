export type Language = 'en' | 'sk' | 'cs';

const en = {
  tagline: 'The plague took the city. You carry the last fire.',
  play: 'Play',
  continue: 'Continue: {level}',
  newGame: 'New game',
  newGameConfirm: 'Sure? Progress will be lost',
  controlsDesktop:
    '← → / A D move · Space / ↑ jump · V / E cane · C / F spark · Shift / X flare the torch · ↓ / S hide the torch · Esc pause',
  controlsTouch: 'Arrows move · ⤒ jump · ⚚ cane · ✸ spark · ✦ flare · ◐ hide the torch',
  world1: 'Quarantine Quarter',
  level1: 'Quarantine',
  level2: 'Rooftops',
  level3: 'Plague Wraiths',
  level4: 'Gallows Square',
  world2: 'Catacombs',
  level5: 'Ossuary',
  level6: 'Rat Nests',
  level7: 'The Sewers',
  level8: 'Plague Spring',
  world3: 'Plague Pits',
  level9: 'Cemetery Gate',
  level10: 'Mass Graves',
  level11: 'The Gravediggers',
  level12: 'The Pit',
  world4: 'The Cathedral',
  level13: 'The Nave',
  level14: 'Bell Tower',
  level15: 'Crypt Beneath the Altar',
  level16: 'The Pyre',
  worldDone: '{world} is purified. Next: {next}',
  levelLabel: '{world} {n}/{total}',
  hintMove: 'Arrows or A/D to walk, Space or ↑ to jump.',
  hintMoveTouch: 'Arrows at the bottom left to walk, ⤒ on the right to jump.',
  hintEmbers: 'Your torch burns pitch fast. Embers keep it alive.',
  hintShrine: 'Light the candle in a shrine. It saves your progress and refills the torch.',
  hintSpikes: 'Iron spikes. One mistake is enough.',
  hintGhoul:
    'Your fire gives you away: the bigger the flame, the farther the infected see you. One touch kills. Strike them with your cane (V) — two blows, or one into a pit.',
  hintGhoulTouch:
    'Your fire gives you away: the bigger the flame, the farther the infected see you. One touch kills. Strike them with your cane ⚚ — two blows, or one into a pit.',
  hintExit: 'At the end of every path, light the pyre. Fire purifies.',
  hintAwning: 'Stretched canvas throws you high. Hold jump to float further.',
  hintPlanks: 'Rotten planks give way beneath you. Don’t stop.',
  hintWraith:
    'Plague wraiths circle the edge of your light. Before they strike, they freeze and their eyes turn red — that is your moment.',
  hintFlare:
    'Hold Shift or X: the torch flares up and burns everything close — but every infected far around sees it and comes. A spark that dies out lures them too.',
  hintFlareTouch:
    'Hold ✦: the torch flares up and burns everything close — but every infected far around sees it and comes. A spark that dies out lures them too.',
  hintSewage: 'The sewage is deep and foul. Don’t fall in.',
  hintSlick: 'Slimy stones. You slide and stop only slowly.',
  hintDebris: 'Loose masonry falls when you pass beneath. Keep moving.',
  hintRats:
    'Rats fear the light and keep to its edge. Hide the torch or run out of pitch and they tear you apart. A flared torch burns them.',
  hintWind:
    'The wind blows in gusts and pushes you in mid-air. Jump when it dies down — standing still, it can’t move you.',
  hintShelter:
    'Behind a gravestone or a rock you are sheltered. When the wind starts to howl, a gust is coming.',
  hintBigWraith: 'A great wraith takes three hits.',
  hintMover: 'Hanging platforms swing back and forth. Time your jump.',
  hintBarricade:
    'Plague barricades are too high to climb. Set them on fire with a spark (C) or a flared torch — the fire spreads.',
  hintBarricadeTouch:
    'Plague barricades are too high to climb. Set them on fire with a spark ✸ or a flared torch ✦ — the fire spreads.',
  hintShield:
    'Hold ↓ to hide the torch under your cloak. The infected stop seeing you and wraiths lose your trail — but you move slowly and the darkness creeps in.',
  hintShieldTouch:
    'Hold ◐ to hide the torch under your cloak. The infected stop seeing you and wraiths lose your trail — but you move slowly and the darkness creeps in.',
  hintMiasma:
    'Green miasma infects you. Get through quickly or burn it away with a flared torch. Healing herbs cure the infection.',
  diedMiasma: 'The miasma choked you…',
  diedRats: 'The rats ate you alive…',
  oilLow: 'The torch is dying!',
  diedThorns: 'Impaled…',
  diedFall: 'Fell into the dark…',
  diedDark: 'The darkness took you…',
  diedWater: 'Drowned in the sewage…',
  diedIcicle: 'Crushed by falling stone…',
  diedShade: 'The wraith took your breath…',
  diedGhoul: 'The infected tore you apart…',
  levelDone: 'The pyre burns',
  stats: 'Embers {f}/{ft} · Relics {c}/{ct} · Time {time} · Deaths {d}',
  next: 'Next',
  replay: 'Replay',
  victoryTitle: 'The plague is burnt out',
  victoryStory:
    'The doctor carried his torch through the streets, the catacombs, the plague pits and the cathedral. When the great pyre caught fire, the bells fell silent. By morning the smoke rose over a city that would live. No one remembered his name.',
  victoryStats: 'Embers {f}/{ft} · Relics {c}/{ct} · Deaths {d}',
  comingSoon: 'Thank you for playing Miasma.',
  toMenu: 'Main menu',
  paused: 'Paused',
  resume: 'Resume',
  restart: 'Restart level',
  soundOn: 'Sound: on',
  soundOff: 'Sound: off',
  pausedHint: 'Esc / P resumes',
  rotate: 'Turn your phone sideways',
};

export type Key = keyof typeof en;

const sk: Record<Key, string> = {
  tagline: 'Mor pohltil mesto. Nesieš posledný oheň.',
  play: 'Hrať',
  continue: 'Pokračovať: {level}',
  newGame: 'Nová hra',
  newGameConfirm: 'Naozaj? Postup sa zmaže',
  controlsDesktop:
    '← → / A D chôdza · Medzerník / ↑ skok · V / E palica · C / F iskra · Shift / X rozžiariť fakľu · ↓ / S ukryť fakľu · Esc pauza',
  controlsTouch: 'Šípky chôdza · ⤒ skok · ⚚ palica · ✸ iskra · ✦ rozžiariť · ◐ ukryť fakľu',
  world1: 'Karanténna štvrť',
  level1: 'Karanténa',
  level2: 'Strechy',
  level3: 'Morové prízraky',
  level4: 'Šibeničné námestie',
  world2: 'Katakomby',
  level5: 'Kostnica',
  level6: 'Hniezda potkanov',
  level7: 'Stoky',
  level8: 'Morový prameň',
  world3: 'Morové jamy',
  level9: 'Cintorínska brána',
  level10: 'Masové hroby',
  level11: 'Hrobári',
  level12: 'Jama',
  world4: 'Katedrála',
  level13: 'Hlavná loď',
  level14: 'Zvonica',
  level15: 'Krypta pod oltárom',
  level16: 'Hranica',
  worldDone: '{world} je očistená. Ďalej: {next}',
  levelLabel: '{world} {n}/{total}',
  hintMove: 'Šípky alebo A/D chôdza, medzerník alebo ↑ skok.',
  hintMoveTouch: 'Šípky vľavo dole chôdza, ⤒ vpravo skok.',
  hintEmbers: 'Fakľa rýchlo spaľuje smolu. Uhlíky ju udržia pri živote.',
  hintShrine: 'Zapáľ sviecu v kaplnke. Uloží postup a doplní fakľu.',
  hintSpikes: 'Železné hroty. Stačí jedna chyba.',
  hintGhoul:
    'Oheň ťa prezrádza: čím väčší plameň, tým zďaleka ťa nakazení vidia. Dotyk zabije. Udri ich palicou (V) — dva údery, alebo jeden do priepasti.',
  hintGhoulTouch:
    'Oheň ťa prezrádza: čím väčší plameň, tým zďaleka ťa nakazení vidia. Dotyk zabije. Udri ich palicou ⚚ — dva údery, alebo jeden do priepasti.',
  hintExit: 'Na konci každej cesty zapáľ hranicu. Oheň očisťuje.',
  hintAwning: 'Napnutá plachta ťa vymrští vysoko. Podrž skok a doletíš ďalej.',
  hintPlanks: 'Zhnité dosky sa pod tebou prelomia. Nezastavuj.',
  hintWraith:
    'Morové prízraky krúžia na okraji svetla. Pred útokom strnú a oči im sčervenajú — vtedy konaj.',
  hintFlare:
    'Podrž Shift alebo X: fakľa vzbĺkne a spáli všetko blízko — no uvidí ju každý nakazený široko-ďaleko a príde. Priláka ich aj iskra, ktorá zhasne.',
  hintFlareTouch:
    'Podrž ✦: fakľa vzbĺkne a spáli všetko blízko — no uvidí ju každý nakazený široko-ďaleko a príde. Priláka ich aj iskra, ktorá zhasne.',
  hintSewage: 'Žumpa je hlboká a smrdí smrťou. Nespadni do nej.',
  hintSlick: 'Slizké kamene. Kĺžeš sa a zastavíš len pomaly.',
  hintDebris: 'Uvoľnené murivo spadne, keď prechádzaš pod ním. Nezastavuj.',
  hintRats:
    'Potkany sa boja svetla a držia sa na jeho okraji. Keď fakľu ukryješ alebo ti dôjde smola, roztrhajú ťa. Rozžiarená fakľa ich spáli.',
  hintWind:
    'Vietor fúka v nárazoch a vo vzduchu ťa odfúkne. Skáč, keď utíchne — kým stojíš, nepohne s tebou.',
  hintShelter: 'Za náhrobkom alebo skalou si v závetrí. Keď vietor začne kvíliť, prichádza náraz.',
  hintBigWraith: 'Veľký prízrak vydrží tri zásahy.',
  hintMover: 'Visiace plošiny sa hojdajú sem a tam. Načasuj skok.',
  hintBarricade:
    'Morové barikády sú príliš vysoké. Podpáľ ich iskrou (C) alebo rozžiarenou fakľou — oheň sa rozšíri.',
  hintBarricadeTouch:
    'Morové barikády sú príliš vysoké. Podpáľ ich iskrou ✸ alebo rozžiarenou fakľou ✦ — oheň sa rozšíri.',
  hintShield:
    'Podrž ↓ a ukry fakľu pod plášť. Nakazení ťa prestanú vidieť a prízraky stratia stopu — no ideš pomaly a tma sa ti zakráda.',
  hintShieldTouch:
    'Podrž ◐ a ukry fakľu pod plášť. Nakazení ťa prestanú vidieť a prízraky stratia stopu — no ideš pomaly a tma sa ti zakráda.',
  hintMiasma:
    'Zelená miazma ťa nakazí. Prejdi rýchlo alebo ju spáľ rozžiarenou fakľou. Liečivé byliny nákazu vyliečia.',
  diedMiasma: 'Udusila ťa miazma…',
  diedRats: 'Zožrali ťa potkany…',
  oilLow: 'Fakľa dohára!',
  diedThorns: 'Nabodnutý…',
  diedFall: 'Pád do tmy…',
  diedDark: 'Pohltila ťa tma…',
  diedWater: 'Utopil si sa v žumpe…',
  diedIcicle: 'Zavalil ťa kameň…',
  diedShade: 'Prízrak ti vzal dych…',
  diedGhoul: 'Nakazení ťa roztrhali…',
  levelDone: 'Hranica horí',
  stats: 'Uhlíky {f}/{ft} · Relikvie {c}/{ct} · Čas {time} · Smrti {d}',
  next: 'Ďalej',
  replay: 'Znova',
  victoryTitle: 'Mor vyhorel',
  victoryStory:
    'Lekár niesol fakľu ulicami, katakombami, morovými jamami aj katedrálou. Keď vzbĺkla veľká hranica, zvony stíchli. Ráno stúpal dym nad mestom, ktoré prežije. Jeho meno si nikto nezapamätal.',
  victoryStats: 'Uhlíky {f}/{ft} · Relikvie {c}/{ct} · Smrti {d}',
  comingSoon: 'Ďakujeme, že si hral Miasmu.',
  toMenu: 'Hlavné menu',
  paused: 'Pauza',
  resume: 'Pokračovať',
  restart: 'Začať level znova',
  soundOn: 'Zvuk: zapnutý',
  soundOff: 'Zvuk: vypnutý',
  pausedHint: 'Esc / P pokračuje',
  rotate: 'Otoč telefón na šírku',
};

const cs: Record<Key, string> = {
  tagline: 'Mor pohltil město. Neseš poslední oheň.',
  play: 'Hrát',
  continue: 'Pokračovat: {level}',
  newGame: 'Nová hra',
  newGameConfirm: 'Opravdu? Postup se smaže',
  controlsDesktop:
    '← → / A D chůze · Mezerník / ↑ skok · V / E hůl · C / F jiskra · Shift / X rozzářit pochodeň · ↓ / S ukrýt pochodeň · Esc pauza',
  controlsTouch: 'Šipky chůze · ⤒ skok · ⚚ hůl · ✸ jiskra · ✦ rozzářit · ◐ ukrýt pochodeň',
  world1: 'Karanténní čtvrť',
  level1: 'Karanténa',
  level2: 'Střechy',
  level3: 'Morové přízraky',
  level4: 'Šibeniční náměstí',
  world2: 'Katakomby',
  level5: 'Kostnice',
  level6: 'Krysí hnízda',
  level7: 'Stoky',
  level8: 'Morový pramen',
  world3: 'Morové jámy',
  level9: 'Hřbitovní brána',
  level10: 'Hromadné hroby',
  level11: 'Hrobníci',
  level12: 'Jáma',
  world4: 'Katedrála',
  level13: 'Hlavní loď',
  level14: 'Zvonice',
  level15: 'Krypta pod oltářem',
  level16: 'Hranice',
  worldDone: '{world} je očištěna. Dál: {next}',
  levelLabel: '{world} {n}/{total}',
  hintMove: 'Šipky nebo A/D chůze, mezerník nebo ↑ skok.',
  hintMoveTouch: 'Šipky vlevo dole chůze, ⤒ vpravo skok.',
  hintEmbers: 'Pochodeň rychle spaluje smůlu. Uhlíky ji udrží naživu.',
  hintShrine: 'Zapal svíci v kapličce. Uloží postup a doplní pochodeň.',
  hintSpikes: 'Železné hroty. Stačí jedna chyba.',
  hintGhoul:
    'Oheň tě prozrazuje: čím větší plamen, tím zdálky tě nakažení vidí. Dotek zabíjí. Uhoď je holí (V) — dvě rány, nebo jedna do propasti.',
  hintGhoulTouch:
    'Oheň tě prozrazuje: čím větší plamen, tím zdálky tě nakažení vidí. Dotek zabíjí. Uhoď je holí ⚚ — dvě rány, nebo jedna do propasti.',
  hintExit: 'Na konci každé cesty zapal hranici. Oheň očišťuje.',
  hintAwning: 'Napnutá plachta tě vymrští vysoko. Podrž skok a doletíš dál.',
  hintPlanks: 'Shnilá prkna se pod tebou prolomí. Nezastavuj.',
  hintWraith:
    'Morové přízraky krouží na okraji světla. Před útokem strnou a oči jim zrudnou — tehdy jednej.',
  hintFlare:
    'Podrž Shift nebo X: pochodeň vzplane a spálí vše blízko — ale uvidí ji každý nakažený široko daleko a přijde. Přiláká je i jiskra, která zhasne.',
  hintFlareTouch:
    'Podrž ✦: pochodeň vzplane a spálí vše blízko — ale uvidí ji každý nakažený široko daleko a přijde. Přiláká je i jiskra, která zhasne.',
  hintSewage: 'Žumpa je hluboká a páchne smrtí. Nespadni do ní.',
  hintSlick: 'Slizké kameny. Kloužeš a zastavíš jen pomalu.',
  hintDebris: 'Uvolněné zdivo spadne, když pod ním procházíš. Nezastavuj.',
  hintRats:
    'Krysy se bojí světla a drží se na jeho okraji. Když pochodeň schováš nebo ti dojde smůla, roztrhají tě. Rozzářená pochodeň je spálí.',
  hintWind:
    'Vítr fouká v nárazech a ve vzduchu tě odfoukne. Skákej, když utichne — dokud stojíš, nepohne s tebou.',
  hintShelter: 'Za náhrobkem nebo skálou jsi v závětří. Když vítr začne kvílet, přichází náraz.',
  hintBigWraith: 'Velký přízrak vydrží tři zásahy.',
  hintMover: 'Visící plošiny se houpou sem a tam. Načasuj skok.',
  hintBarricade:
    'Morové barikády jsou příliš vysoké. Zapal je jiskrou (C) nebo rozzářenou pochodní — oheň se rozšíří.',
  hintBarricadeTouch:
    'Morové barikády jsou příliš vysoké. Zapal je jiskrou ✸ nebo rozzářenou pochodní ✦ — oheň se rozšíří.',
  hintShield:
    'Podrž ↓ a ukryj pochodeň pod plášť. Nakažení tě přestanou vidět a přízraky ztratí stopu — ale jdeš pomalu a tma se ti plíží.',
  hintShieldTouch:
    'Podrž ◐ a ukryj pochodeň pod plášť. Nakažení tě přestanou vidět a přízraky ztratí stopu — ale jdeš pomalu a tma se ti plíží.',
  hintMiasma:
    'Zelená miazma tě nakazí. Projdi rychle nebo ji spal rozzářenou pochodní. Léčivé byliny nákazu vyléčí.',
  diedMiasma: 'Udusila tě miazma…',
  diedRats: 'Sežraly tě krysy…',
  oilLow: 'Pochodeň dohořívá!',
  diedThorns: 'Nabodnutý…',
  diedFall: 'Pád do tmy…',
  diedDark: 'Pohltila tě tma…',
  diedWater: 'Utopil ses v žumpě…',
  diedIcicle: 'Zavalil tě kámen…',
  diedShade: 'Přízrak ti vzal dech…',
  diedGhoul: 'Nakažení tě roztrhali…',
  levelDone: 'Hranice hoří',
  stats: 'Uhlíky {f}/{ft} · Relikvie {c}/{ct} · Čas {time} · Smrti {d}',
  next: 'Dál',
  replay: 'Znovu',
  victoryTitle: 'Mor vyhořel',
  victoryStory:
    'Lékař nesl pochodeň ulicemi, katakombami, morovými jámami i katedrálou. Když vzplála velká hranice, zvony utichly. Ráno stoupal dým nad městem, které přežije. Jeho jméno si nikdo nezapamatoval.',
  victoryStats: 'Uhlíky {f}/{ft} · Relikvie {c}/{ct} · Smrti {d}',
  comingSoon: 'Děkujeme, že jsi hrál Miasmu.',
  toMenu: 'Hlavní menu',
  paused: 'Pauza',
  resume: 'Pokračovat',
  restart: 'Začít level znovu',
  soundOn: 'Zvuk: zapnutý',
  soundOff: 'Zvuk: vypnutý',
  pausedHint: 'Esc / P pokračuje',
  rotate: 'Otoč telefon na šířku',
};

const STRINGS: Record<Language, Record<Key, string>> = { en, sk, cs };
const LANG_KEY = 'miasma.lang';

let language: Language = detect();

function detect(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'sk' || saved === 'cs') return saved;
  } catch {
    // úložisko nedostupné
  }
  // Predvolený jazyk je angličtina; iný si hráč vyberie na úvodnej obrazovke.
  return 'en';
}

export function getLanguage(): Language {
  return language;
}

export function setLanguage(lang: Language): void {
  language = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // úložisko nedostupné
  }
}

export function hasKey(key: string): key is Key {
  return key in en;
}

export function t(key: Key, params: Record<string, string | number> = {}): string {
  return STRINGS[language][key].replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? ''),
  );
}
