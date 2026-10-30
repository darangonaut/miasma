export type Language = 'en' | 'sk' | 'cs';

const en = {
  tagline: 'The plague took the city. You carry the last fire.',
  play: 'Play',
  continue: 'Continue: {level}',
  newGame: 'New game',
  newGameConfirm: 'Sure? Progress will be lost',
  controlsDesktop:
    '← → / A D move · Space / ↑ jump · V / E cane · C / F spark · Shift / X flare the torch · ↓ / S hide the torch · Q use a herb · Esc pause',
  controlsTouch: 'Arrows move · ⤒ jump · ⚚ cane · ✸ spark · ✦ flare · ◐ hide the torch · ❦ herb',
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
  hintExit:
    'Burn every plague nest in the quarter (♨) with a spark or a flare. Only then will the pyre at the end light.',
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
    'Green miasma infects you. Get through quickly or burn it away with a flared torch. Carry healing herbs (up to 3) and use one with Q to cure yourself.',
  diedMiasma: 'The miasma choked you…',
  diedRats: 'The rats ate you alive…',
  oilLow: 'The torch is dying!',
  keyToast: 'A key! Somewhere there is a locked door.',
  diaryTitle: 'From the plague doctor’s diary',
  diaryClose: 'Press any key to continue',
  prologue:
    'Anno Domini 1348. The city is quarantined behind its walls and you are the last plague doctor still walking its streets. Burn the plague nests, help those who can still be helped, and light the pyres. Fire purifies.',
  page1:
    'Day one. The council paid me in advance and locked the gates behind me. They gave me a torch, a cane and a list of streets to burn. Nobody asked my name.',
  page2:
    'People hide in attics and under canvas. When I carry light, they flee from me. When I don’t, they come closer — and some of them are no longer people.',
  page3:
    'The priest says the wraiths are the souls of those who died without a candle. I only know they fear fire. And I fear the moment my fire burns out.',
  page4:
    'They hanged the baker in the square for poisoning the well. But the plague did not come from the well. It came from below, from the catacombs — I can smell it through the herbs in my beak.',
  page5:
    'Beneath the city lie the bones of centuries, and the miasma rises from the ground like breath. Today I noticed a fingernail gone black under my glove.',
  page6:
    'Rats. Thousands. They fear the light, but in the dark they are bold as wolves. I understood they do not carry the plague. They are only hungry. We carry it.',
  page7:
    'I pulled a girl out of the sewer and gave her my last herb. As I left, I coughed into my mask and hoped she did not hear.',
  page8:
    'The spring beneath the catacombs is the source. The water is clear but the air above it is green. The council knew. They locked the gates so the plague would not leave — and us with it.',
  page9:
    'The wind on the cemetery nearly kills my torch. The gravediggers no longer dig graves. They dig pits.',
  page10:
    'Among the dead I saw faces I treated yesterday. My herbs did not help. Or helped only for a day.',
  page11:
    'A gravedigger told me the doctor before me never came back either. He wore the same mask, they say. Perhaps it is the same mask.',
  page12:
    'The marks reach my elbow now. Under the cloak no one sees them. As long as the torch burns, I am still a doctor — not one of them.',
  page13:
    'In the cathedral, those who still believe are praying. The bishop blessed me and let me in. He has no idea what I carry under my cloak.',
  page14:
    'The bell tolls for the dead and the infected come to its voice. Who rang it the first time? Who wanted them to come?',
  page15:
    'Under the altar I found the council’s letters. The city was never meant to be cured. It was meant to be burnt — with me in it. That is why they gave me a torch.',
  page16:
    'The great pyre is ready. I will light it — not because they ordered me to, but because someone must. And if I burn in it too, let no one mourn me.',
  endGoodTitle: 'The city lives',
  endGood:
    'The pyre burned for three days. When the smoke cleared, the people you saved came out of cellars and attics. They remembered the man in the beaked mask, though no one knew his name. In the square they raised a stone cross without an inscription.',
  endMidTitle: 'Ash and silence',
  endMid:
    'The pyre burned out and the bells fell silent. A handful survived; they spoke of the doctor quietly, as of someone who came too late. His mask was found on the cathedral steps. Empty.',
  endBadTitle: 'City of the dead',
  endBad:
    'The pyre burned over empty streets. You did not save even those who begged. When the council’s soldiers came, they found only ash — and in it, a doctor’s cane.',
  endSecret:
    'A diary lay by the pyre. Its last line read: “The council sent me to burn the city. I chose to heal it.”',
  shopTitle: 'Apothecary',
  coins: 'Groschen: {n} ₰',
  coinsEarned: 'The council paid you {n} ₰ (survivors, pages, groschen, nests).',
  shopHerb: 'Healing herb',
  shopHerbDesc: 'Into your satchel for the next quarter.',
  shopFlask: 'Larger flask',
  shopFlaskDesc: 'The torch burns pitch more slowly.',
  shopMask: 'Better mask',
  shopMaskDesc: 'Fresh herbs in the beak: miasma infects slower.',
  shopCane: 'Iron-shod cane',
  shopCaneDesc: 'One blow fells an infected.',
  soldOut: 'Sold out',
  hintSurvivor:
    'A survivor begs for help. Give them a herb (Q) — or keep it for yourself. When the bell tolls, the abandoned turn.',
  hintSurvivorTouch:
    'A survivor begs for help. Give them a herb ❦ — or keep it for yourself. When the bell tolls, the abandoned turn.',
  hintSurvivorNoHerb: 'A survivor begs for help. You have no herb to give…',
  savedToast: 'You saved a life.',
  turnedToast: 'No one helped them. They have turned…',
  gateLocked: 'The pyre won’t light — {n} plague nests still smoulder in the quarter (♨).',
  nestsDone: 'All plague nests are burnt. Light the pyre!',
  bellToll: 'The plague bell! The infected pour into the streets — hide the torch (↓).',
  bellTollTouch: 'The plague bell! The infected pour into the streets — hide the torch ◐.',
  diedThorns: 'Impaled…',
  diedFall: 'Fell into the dark…',
  diedDark: 'The darkness took you…',
  diedWater: 'Drowned in the sewage…',
  diedIcicle: 'Crushed by falling stone…',
  diedShade: 'The wraith took your breath…',
  diedGhoul: 'The infected tore you apart…',
  levelDone: 'The pyre burns',
  stats: 'Embers {f}/{ft} · Diary pages {c}/{ct} · Time {time} · Deaths {d}',
  next: 'Next',
  replay: 'Replay',
  victoryStats: 'Saved {s}/{st} · Diary pages {c}/{ct} · Deaths {d}',
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
    '← → / A D chôdza · Medzerník / ↑ skok · V / E palica · C / F iskra · Shift / X rozžiariť fakľu · ↓ / S ukryť fakľu · Q bylina · Esc pauza',
  controlsTouch:
    'Šípky chôdza · ⤒ skok · ⚚ palica · ✸ iskra · ✦ rozžiariť · ◐ ukryť fakľu · ❦ bylina',
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
  hintExit:
    'Spáľ v štvrti všetky morové hniezda (♨) iskrou alebo rozžiarením. Až potom sa hranica na konci zapáli.',
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
    'Zelená miazma ťa nakazí. Prejdi rýchlo alebo ju spáľ rozžiarenou fakľou. Liečivé byliny nosíš so sebou (najviac 3) a klávesom Q sa vyliečiš.',
  diedMiasma: 'Udusila ťa miazma…',
  diedRats: 'Zožrali ťa potkany…',
  oilLow: 'Fakľa dohára!',
  keyToast: 'Kľúč! Niekde sú zamknuté dvere.',
  diaryTitle: 'Z denníka morového lekára',
  diaryClose: 'Pokračuj ľubovoľným klávesom',
  prologue:
    'Rok Pána 1348. Mesto je za hradbami v karanténe a ty si posledný morový lekár, ktorý ešte chodí jeho ulicami. Spáľ morové hniezda, pomôž tým, ktorým sa ešte dá, a zapáľ hranice. Oheň očisťuje.',
  page1:
    'Deň prvý. Rada mi zaplatila vopred a brány za mnou zamkli. Dali mi fakľu, palicu a zoznam ulíc, ktoré treba vypáliť. Na meno sa ma nikto nespýtal.',
  page2:
    'Ľudia sa schovávajú na povalách a pod plachtami. Keď svietim, utekajú predo mnou. Keď nesvietim, prídu bližšie — a niektorí už nie sú ľudia.',
  page3:
    'Kňaz tvrdí, že prízraky sú duše tých, čo zomreli bez sviečky. Viem len, že sa boja ohňa. A ja sa bojím chvíle, keď mi oheň dohorí.',
  page4:
    'Na námestí obesili pekára, vraj otrávil studňu. Mor však neprišiel zo studne. Prišiel zdola, od katakomb — cítim ho aj cez byliny v zobáku.',
  page5:
    'Pod mestom ležia kosti stáročí a miazma tu stúpa zo zeme ako dych. Dnes som si všimol, že mi pod rukavicou sčernel necht.',
  page6:
    'Potkany. Tisíce. Svetla sa boja, no v tme sú odvážne ako vlci. Pochopil som, že mor nenosia ony. Sú len hladné. Mor nosíme my.',
  page7:
    'Zo stoky som vytiahol dievča a dal jej poslednú bylinu. Keď som odchádzal, kašľal som do masky a dúfal, že to nepočula.',
  page8:
    'Prameň pod katakombami je zdroj. Voda je čistá, ale vzduch nad ňou zelený. Rada o ňom vedela. Zamkli brány, aby mor neodišiel — a nás s ním.',
  page9: 'Na cintoríne fúka tak, že fakľa sotva horí. Hrobári už nekopú hroby. Kopú jamy.',
  page10:
    'Medzi mŕtvymi som videl tváre, ktoré som včera liečil. Moje byliny nepomohli. Alebo pomohli len na deň.',
  page11:
    'Hrobár mi povedal, že lekár pred mnou sa tiež nevrátil. Nosil vraj rovnakú masku. Možno je to tá istá maska.',
  page12:
    'Škvrny mi siahajú po lakeť. Pod plášťom ich nik nevidí. Kým horí fakľa, som ešte lekár — nie jeden z nich.',
  page13:
    'V katedrále sa modlia tí, čo ešte veria. Biskup ma požehnal a pustil dnu. Netuší, čo nesiem pod plášťom.',
  page14:
    'Zvon bije pre mŕtvych a nakazení prichádzajú na jeho hlas. Kto ho rozhúpal prvý raz? Kto chcel, aby prišli?',
  page15:
    'Pod oltárom som našiel listy rady. Mesto nemalo byť vyliečené. Malo byť vypálené — aj so mnou. Preto mi dali fakľu.',
  page16:
    'Veľká hranica je pripravená. Zapálim ju — nie preto, že mi to prikázali, ale preto, že niekto musí. A ak v nej zhorím aj ja, nech ma neľutujú.',
  endGoodTitle: 'Mesto prežilo',
  endGood:
    'Hranica horela tri dni. Keď dym opadol, z pivníc a povál vyšli ľudia, ktorých si zachránil. Pamätali si muža v maske so zobákom, hoci jeho meno nepoznal nik. Na námestí mu postavili kamenný kríž bez nápisu.',
  endMidTitle: 'Popol a ticho',
  endMid:
    'Hranica dohorela a zvony stíchli. Prežila hŕstka ľudí; o lekárovi rozprávali potichu, ako o niekom, kto prišiel príliš neskoro. Jeho masku našli na schodoch katedrály. Prázdnu.',
  endBadTitle: 'Mesto mŕtvych',
  endBad:
    'Hranica horela nad prázdnymi ulicami. Nezachránil si ani tých, čo prosili. Keď prišli vojaci rady, našli len popol — a v ňom lekársku palicu.',
  endSecret:
    'Pri hranici ležal denník. Posledná veta znela: „Rada ma poslala mesto vypáliť. Ja som sa rozhodol ho vyliečiť.“',
  shopTitle: 'Lekáreň',
  coins: 'Groše: {n} ₰',
  coinsEarned: 'Rada ti vyplatila {n} ₰ (preživší, strany, groše, hniezda).',
  shopHerb: 'Liečivá bylina',
  shopHerbDesc: 'Do brašne na ďalšiu štvrť.',
  shopFlask: 'Väčšia ampulka',
  shopFlaskDesc: 'Fakľa horí pomalšie.',
  shopMask: 'Lepšia maska',
  shopMaskDesc: 'Čerstvé byliny v zobáku: miazma nakazí pomalšie.',
  shopCane: 'Okutá palica',
  shopCaneDesc: 'Nakazeného zloží jeden úder.',
  soldOut: 'Vypredané',
  hintSurvivor:
    'Preživší prosí o pomoc. Daj mu bylinu (Q) — alebo si ju nechaj. Keď udrie zvon, opustení sa premenia.',
  hintSurvivorTouch:
    'Preživší prosí o pomoc. Daj mu bylinu ❦ — alebo si ju nechaj. Keď udrie zvon, opustení sa premenia.',
  hintSurvivorNoHerb: 'Preživší prosí o pomoc. Nemáš bylinu, ktorú by si mu dal…',
  savedToast: 'Zachránil si život.',
  turnedToast: 'Nikto mu nepomohol. Premenil sa…',
  gateLocked: 'Hranica sa nezapáli — v štvrti ešte tlie morových hniezd: {n} (♨).',
  nestsDone: 'Všetky morové hniezda zhoreli. Zapáľ hranicu!',
  bellToll: 'Morový zvon! Nakazení sa vyrojili do ulíc — ukry fakľu (↓).',
  bellTollTouch: 'Morový zvon! Nakazení sa vyrojili do ulíc — ukry fakľu ◐.',
  diedThorns: 'Nabodnutý…',
  diedFall: 'Pád do tmy…',
  diedDark: 'Pohltila ťa tma…',
  diedWater: 'Utopil si sa v žumpe…',
  diedIcicle: 'Zavalil ťa kameň…',
  diedShade: 'Prízrak ti vzal dych…',
  diedGhoul: 'Nakazení ťa roztrhali…',
  levelDone: 'Hranica horí',
  stats: 'Uhlíky {f}/{ft} · Strany denníka {c}/{ct} · Čas {time} · Smrti {d}',
  next: 'Ďalej',
  replay: 'Znova',
  victoryStats: 'Zachránení {s}/{st} · Strany denníka {c}/{ct} · Smrti {d}',
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
    '← → / A D chůze · Mezerník / ↑ skok · V / E hůl · C / F jiskra · Shift / X rozzářit pochodeň · ↓ / S ukrýt pochodeň · Q bylina · Esc pauza',
  controlsTouch:
    'Šipky chůze · ⤒ skok · ⚚ hůl · ✸ jiskra · ✦ rozzářit · ◐ ukrýt pochodeň · ❦ bylina',
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
  hintExit:
    'Spal ve čtvrti všechna morová hnízda (♨) jiskrou nebo rozzářením. Teprve potom hranice na konci vzplane.',
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
    'Zelená miazma tě nakazí. Projdi rychle nebo ji spal rozzářenou pochodní. Léčivé byliny neseš s sebou (nejvýš 3) a klávesou Q se vyléčíš.',
  diedMiasma: 'Udusila tě miazma…',
  diedRats: 'Sežraly tě krysy…',
  oilLow: 'Pochodeň dohořívá!',
  keyToast: 'Klíč! Někde jsou zamčené dveře.',
  diaryTitle: 'Z deníku morového lékaře',
  diaryClose: 'Pokračuj libovolnou klávesou',
  prologue:
    'Léta Páně 1348. Město je za hradbami v karanténě a ty jsi poslední morový lékař, který ještě chodí jeho ulicemi. Spal morová hnízda, pomoz těm, kterým se ještě dá, a zapal hranice. Oheň očišťuje.',
  page1:
    'Den první. Rada mi zaplatila předem a brány za mnou zamkla. Dali mi pochodeň, hůl a seznam ulic, které je třeba vypálit. Na jméno se mě nikdo nezeptal.',
  page2:
    'Lidé se schovávají na půdách a pod plachtami. Když svítím, utíkají přede mnou. Když nesvítím, přijdou blíž — a někteří už nejsou lidé.',
  page3:
    'Kněz tvrdí, že přízraky jsou duše těch, kdo zemřeli bez svíčky. Vím jen, že se bojí ohně. A já se bojím chvíle, kdy mi oheň dohoří.',
  page4:
    'Na náměstí oběsili pekaře, prý otrávil studnu. Mor ale nepřišel ze studny. Přišel zdola, od katakomb — cítím ho i přes byliny v zobáku.',
  page5:
    'Pod městem leží kosti staletí a miazma tu stoupá ze země jako dech. Dnes jsem si všiml, že mi pod rukavicí zčernal nehet.',
  page6:
    'Krysy. Tisíce. Světla se bojí, ale ve tmě jsou odvážné jako vlci. Pochopil jsem, že mor nenosí ony. Jsou jen hladové. Mor neseme my.',
  page7:
    'Ze stoky jsem vytáhl dívku a dal jí poslední bylinu. Když jsem odcházel, kašlal jsem do masky a doufal, že to neslyšela.',
  page8:
    'Pramen pod katakombami je zdroj. Voda je čistá, ale vzduch nad ní zelený. Rada o něm věděla. Zamkli brány, aby mor neodešel — a nás s ním.',
  page9: 'Na hřbitově fouká tak, že pochodeň sotva hoří. Hrobníci už nekopou hroby. Kopou jámy.',
  page10:
    'Mezi mrtvými jsem viděl tváře, které jsem včera léčil. Moje byliny nepomohly. Nebo pomohly jen na den.',
  page11:
    'Hrobník mi řekl, že lékař přede mnou se také nevrátil. Nosil prý stejnou masku. Možná je to tatáž maska.',
  page12:
    'Skvrny mi sahají po loket. Pod pláštěm je nikdo nevidí. Dokud hoří pochodeň, jsem ještě lékař — ne jeden z nich.',
  page13:
    'V katedrále se modlí ti, kdo ještě věří. Biskup mě požehnal a pustil dovnitř. Netuší, co nesu pod pláštěm.',
  page14:
    'Zvon zvoní za mrtvé a nakažení přicházejí na jeho hlas. Kdo ho rozhoupal poprvé? Kdo chtěl, aby přišli?',
  page15:
    'Pod oltářem jsem našel dopisy rady. Město nemělo být vyléčeno. Mělo být vypáleno — i se mnou. Proto mi dali pochodeň.',
  page16:
    'Velká hranice je připravena. Zapálím ji — ne proto, že mi to přikázali, ale proto, že někdo musí. A jestli v ní shořím i já, ať mě nelitují.',
  endGoodTitle: 'Město přežilo',
  endGood:
    'Hranice hořela tři dny. Když se dým rozptýlil, vyšli ze sklepů a půd lidé, které jsi zachránil. Pamatovali si muže v masce se zobákem, ačkoli jeho jméno nikdo neznal. Na náměstí mu postavili kamenný kříž bez nápisu.',
  endMidTitle: 'Popel a ticho',
  endMid:
    'Hranice dohořela a zvony utichly. Přežila hrstka lidí; o lékaři mluvili potichu, jako o někom, kdo přišel příliš pozdě. Jeho masku našli na schodech katedrály. Prázdnou.',
  endBadTitle: 'Město mrtvých',
  endBad:
    'Hranice hořela nad prázdnými ulicemi. Nezachránil jsi ani ty, kdo prosili. Když přišli vojáci rady, našli jen popel — a v něm lékařskou hůl.',
  endSecret:
    'U hranice ležel deník. Poslední věta zněla: „Rada mě poslala město vypálit. Já jsem se rozhodl ho vyléčit.“',
  shopTitle: 'Lékárna',
  coins: 'Groše: {n} ₰',
  coinsEarned: 'Rada ti vyplatila {n} ₰ (přeživší, strany, groše, hnízda).',
  shopHerb: 'Léčivá bylina',
  shopHerbDesc: 'Do brašny na další čtvrť.',
  shopFlask: 'Větší ampulka',
  shopFlaskDesc: 'Pochodeň hoří pomaleji.',
  shopMask: 'Lepší maska',
  shopMaskDesc: 'Čerstvé byliny v zobáku: miazma nakazí pomaleji.',
  shopCane: 'Okovaná hůl',
  shopCaneDesc: 'Nakaženého složí jedna rána.',
  soldOut: 'Vyprodáno',
  hintSurvivor:
    'Přeživší prosí o pomoc. Dej mu bylinu (Q) — nebo si ji nech. Když udeří zvon, opuštění se promění.',
  hintSurvivorTouch:
    'Přeživší prosí o pomoc. Dej mu bylinu ❦ — nebo si ji nech. Když udeří zvon, opuštění se promění.',
  hintSurvivorNoHerb: 'Přeživší prosí o pomoc. Nemáš bylinu, kterou bys mu dal…',
  savedToast: 'Zachránil jsi život.',
  turnedToast: 'Nikdo mu nepomohl. Proměnil se…',
  gateLocked: 'Hranice nevzplane — ve čtvrti ještě doutná morových hnízd: {n} (♨).',
  nestsDone: 'Všechna morová hnízda shořela. Zapal hranici!',
  bellToll: 'Morový zvon! Nakažení se vyrojili do ulic — schovej pochodeň (↓).',
  bellTollTouch: 'Morový zvon! Nakažení se vyrojili do ulic — schovej pochodeň ◐.',
  diedThorns: 'Nabodnutý…',
  diedFall: 'Pád do tmy…',
  diedDark: 'Pohltila tě tma…',
  diedWater: 'Utopil ses v žumpě…',
  diedIcicle: 'Zavalil tě kámen…',
  diedShade: 'Přízrak ti vzal dech…',
  diedGhoul: 'Nakažení tě roztrhali…',
  levelDone: 'Hranice hoří',
  stats: 'Uhlíky {f}/{ft} · Strany deníku {c}/{ct} · Čas {time} · Smrti {d}',
  next: 'Dál',
  replay: 'Znovu',
  victoryStats: 'Zachránění {s}/{st} · Strany deníku {c}/{ct} · Smrti {d}',
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
