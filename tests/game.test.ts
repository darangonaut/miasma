import { describe, expect, it } from 'vitest';
import {
  DREAD_LIMIT,
  Game,
  NO_INPUT,
  OIL_MAX,
  PLAYER_H,
  WIND_CYCLE,
  baseRadius,
  calmLeft,
  windAt,
  type Input,
} from '@/game/game';
import { TILE, Tile, isGround, parseLevel, type LevelDef } from '@/game/level';
import { LEVELS } from '@/game/levels';

const DT = 1 / 60;

function make(rows: string[], hints?: string[], world: LevelDef['world'] = 'quarter'): Game {
  const def: LevelDef = { id: 'test', name: 'test', world, rows, hints };
  return new Game(parseLevel(def));
}

function run(game: Game, seconds: number, input: Partial<Input> = {}) {
  const events = [];
  for (let t = 0; t < seconds; t += DT) events.push(...game.step(DT, { ...NO_INPUT, ...input }));
  return events;
}

const FLAT = ['                    ', ' P                 E', '####################'];

describe('levely', () => {
  it('všetky sa dajú načítať a majú štart, vatru a svetlušky', () => {
    for (const def of LEVELS) {
      const level = parseLevel(def);
      expect(level.fireflies.length).toBeGreaterThan(1);
      expect(level.exit.x).toBeGreaterThan(level.start.x);
    }
  });

  it('lampy stoja nad zemou (stĺp má kam dopadnúť)', () => {
    for (const def of LEVELS) {
      const level = parseLevel(def);
      for (const l of level.lanterns) {
        const col = Math.floor(l.x / TILE);
        let row = Math.floor(l.y / TILE) + 1;
        while (row < level.height && !isGround(level.tiles[row * level.width + col]!)) row++;
        expect(row, `${def.id} lampa na stĺpci ${col}`).toBeLessThan(level.height);
      }
    }
  });

  it('na každý trám sa dá vyskočiť (pod ním je zem najviac 3 políčka nižšie)', () => {
    for (const def of LEVELS) {
      const level = parseLevel(def);
      const at = (c: number, r: number) => level.tiles[r * level.width + c];
      const standable = (c: number, r: number) =>
        c >= 0 &&
        c < level.width &&
        r < level.height &&
        at(c, r) !== Tile.Empty &&
        at(c, r) !== Tile.Water &&
        at(c, r) !== Tile.Thorns &&
        (r === 0 || at(c, r - 1) === Tile.Empty);
      for (let r = 0; r < level.height; r++)
        for (let c = 0; c < level.width; c++) {
          if (at(c, r) !== Tile.Ledge || at(c - 1, r) === Tile.Ledge) continue;
          let end = c;
          while (at(end + 1, r) === Tile.Ledge) end++;
          let ok = false;
          for (let cc = c - 4; cc <= end + 4 && !ok; cc++)
            for (let rr = r + 1; rr <= r + 3 && !ok; rr++) ok = standable(cc, rr);
          expect(ok, `${def.id}: trám ${c}–${end} v riadku ${r}`).toBe(true);
        }
    }
  });

  it('neznámy znak je chyba', () => {
    expect(() => make([' P Q E', '######'])).toThrow();
  });
});

describe('pohyb', () => {
  it('hráč dopadne na zem a chodí', () => {
    const game = make(FLAT);
    run(game, 0.5);
    expect(game.player.onGround).toBe(true);
    expect(game.player.y + PLAYER_H).toBeCloseTo(2 * TILE);
    const x = game.player.x;
    run(game, 0.5, { right: true });
    expect(game.player.x).toBeGreaterThan(x + 30);
  });

  it('skok vyskočí aspoň tri políčka', () => {
    const game = make(FLAT);
    run(game, 0.5);
    const ground = game.player.y;
    let top = ground;
    game.step(DT, { ...NO_INPUT, jump: true });
    for (let i = 0; i < 60; i++) {
      game.step(DT, { ...NO_INPUT, jump: true });
      top = Math.min(top, game.player.y);
    }
    expect(ground - top).toBeGreaterThan(3 * TILE);
  });

  it('stena zastaví hráča', () => {
    const game = make(['      ', ' P  # E', '#######']);
    run(game, 2, { right: true });
    expect(game.player.x + 8).toBeLessThanOrEqual(4 * TILE);
  });

  it('pád do priepasti zabije a hráč sa vráti na štart', () => {
    const game = make([' P      E', '##    ###']);
    const events = run(game, 3, { right: true });
    expect(events.some((e) => e.type === 'died')).toBe(true);
    expect(game.deaths).toBeGreaterThan(0);
  });
});

describe('svetlo', () => {
  it('svetelná plošina drží len vo svetle', () => {
    const game = make([' P               E', '##=====###########']);
    run(game, 0.5);
    expect(game.isTileLit(3, 1)).toBe(true);
    expect(game.isTileLit(16, 0)).toBe(false);
    run(game, 1, { right: true });
    expect(game.state).toBe('play');
    expect(game.deaths).toBe(0);
  });

  it('olej sa míňa, svetluška ho dopĺňa a tma nakoniec zabije', () => {
    const game = make([' P f            E', '#################']);
    run(game, 1);
    expect(game.oil).toBeLessThan(OIL_MAX);
    game.oil = 50;
    run(game, 0.6, { right: true });
    expect(game.fireflyCount).toBe(1);
    expect(game.oil).toBeGreaterThan(55);
    game.oil = 0.01;
    const events = run(game, DREAD_LIMIT + 0.5);
    expect(events).toContainEqual({ type: 'died', cause: 'dark' });
  });

  it('svetlo slabne až pri poslednej štvrtine oleja', () => {
    expect(baseRadius(OIL_MAX)).toBe(baseRadius(OIL_MAX * 0.3));
    expect(baseRadius(OIL_MAX * 0.1)).toBeLessThan(baseRadius(OIL_MAX * 0.3));
    expect(baseRadius(0)).toBeLessThan(baseRadius(1));
  });

  it('rozžiarenie míňa olej rýchlejšie', () => {
    const a = make(FLAT);
    const b = make(FLAT);
    run(a, 1);
    run(b, 1, { flare: true });
    expect(b.oil).toBeLessThan(a.oil - 10);
    expect(b.radius).toBeGreaterThan(a.radius);
  });

  it('lampa je checkpoint a doplní olej', () => {
    const game = make([' P  L        E', '##############']);
    game.oil = 30;
    const events = run(game, 1, { right: true });
    expect(events.some((e) => e.type === 'lantern')).toBe(true);
    expect(game.oil).toBeGreaterThan(90);
  });

  it('rozžiarený lampáš spáli tieň', () => {
    const game = make(['      s      ', ' P          E', '#############']);
    run(game, 0.3);
    expect(game.shades[0]!.alive).toBe(true);
    const events = run(game, 3, { flare: true });
    expect(events.some((e) => e.type === 'shadeDie')).toBe(true);
  });

  it('prízrak sa pred výpadom zastaví a varuje, potom zabije na jeden zásah', () => {
    const game = make(['    s       ', ' P         E', '############']);
    const order: string[] = [];
    for (let t = 0; t < 15 && game.state === 'play'; t += DT) {
      game.oil = 60;
      for (const e of game.step(DT, NO_INPUT))
        if (e.type === 'windup' || e.type === 'lunge' || e.type === 'died') order.push(e.type);
    }
    expect(order.slice(0, 2)).toEqual(['windup', 'lunge']);
    expect(order).toContain('died');
    expect(game.deaths).toBe(1);
  });
});

describe('cieľ', () => {
  it('dotyk vatry dokončí level', () => {
    const game = make(FLAT);
    const events = run(game, 5, { right: true });
    expect(events.some((e) => e.type === 'exit')).toBe(true);
    expect(game.state).toBe('done');
  });

  it('tabuľa ukáže radu', () => {
    const game = make([' P1    E', '########'], ['hintMove']);
    run(game, 0.3);
    expect(game.sign?.hint).toBe('hintMove');
  });
});

describe('uloženie', () => {
  it('odomkne ďalší level a drží najlepšie skóre', async () => {
    const { parseSave, recordLevel } = await import('@/game/save');
    let save = parseSave(null);
    save = recordLevel(save, 0, 'a', 5, 1);
    save = recordLevel(save, 0, 'a', 3, 0);
    expect(save.unlocked).toBe(1);
    expect(save.best.a).toEqual({ fireflies: 5, crystals: 1 });
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(parseSave('nezmysel').unlocked).toBe(0);
  });
});

describe('boj a jaskyne', () => {
  it('palica rozplynie tieň pred hráčom', () => {
    const game = make([' P s        E', '#############']);
    const shade = game.shades[0]!;
    shade.active = true;
    game.player.x = shade.x - 16;
    game.player.y = shade.y - 6;
    shade.home = { x: shade.x, y: shade.y };
    const events = [...game.step(DT, { ...NO_INPUT, cane: true }), ...run(game, 0.3)];
    expect(events.some((e) => e.type === 'swing')).toBe(true);
    expect(events.some((e) => e.type === 'caneHit')).toBe(true);
    expect(shade.alive).toBe(false);
  });

  it('iskra stojí olej a spáli tieň', () => {
    const game = make([' P      s      E', '################']);
    run(game, 0.3);
    const oil = game.oil;
    game.shades[0]!.y = game.lamp.y;
    game.shades[0]!.home = { x: game.shades[0]!.x, y: game.lamp.y };
    const events = [...game.step(DT, { ...NO_INPUT, spark: true })];
    expect(game.oil).toBeLessThan(oil - 3);
    events.push(...run(game, 1));
    expect(events.some((e) => e.type === 'shadeDie')).toBe(true);
  });

  it('iskra sa zastaví o stenu a osvetľuje okolie', () => {
    const game = make([' P  #     E', '###########']);
    run(game, 0.3);
    game.step(DT, { ...NO_INPUT, spark: true });
    expect(game.lights().length).toBe(2);
    const events = run(game, 0.5);
    expect(events.some((e) => e.type === 'fizzle')).toBe(true);
    expect(game.sparks.length).toBe(0);
  });

  it('potkany sa držia na okraji svetla, pri ukrytej fakli zaútočia, rozžiarenie ich spáli', () => {
    const rows = [' P        r          E', '######################'];
    const lit = make(rows);
    const events = run(lit, 4);
    expect(events.some((e) => e.type === 'died')).toBe(false);
    expect(lit.rats.length).toBe(3);
    // Prišli až k okraju svetla, ale nie bližšie.
    const nearest = Math.min(...lit.rats.map((r) => Math.abs(r.x - lit.lamp.x)));
    expect(nearest).toBeLessThan(lit.radius);
    expect(nearest).toBeGreaterThan(lit.radius - 24);

    const hidden = make(rows);
    run(hidden, 1.5);
    const bite = run(hidden, 3, { down: true });
    expect(bite).toContainEqual({ type: 'died', cause: 'rats' });

    const burn = make(rows);
    run(burn, 2);
    const fire = run(burn, 1.5, { flare: true });
    expect(fire.some((e) => e.type === 'ratDie')).toBe(true);
  });

  it('potkany nad priepasťou sa nevytvoria a z hrany nespadnú', () => {
    const game = make(['    r        ', ' P          E', '##   ########']);
    expect(game.rats.every((r) => !r.alive)).toBe(true);
    const ledge = make([' P       r      E', '###  ######   ###']);
    run(ledge, 6);
    expect(ledge.rats.every((r) => r.x > 5 * TILE && r.x < 11 * TILE)).toBe(true);
  });

  it('svetlo prezrádza: rozžiarená fakľa a zhasnutá iskra prilákajú nakazených', () => {
    // Nakazený na rímse vyššie hráča nevidí, kým fakľu nerozžiari.
    const rows = [
      '                g          ',
      '            ##########     ',
      ' P                        E',
      '###########################',
    ];
    const calm = make(rows);
    const g0 = calm.ghouls[0]!;
    run(calm, 2);
    expect(g0.lureTime).toBe(0);
    const flare = make(rows);
    flare.player.x = 9 * TILE;
    const g = flare.ghouls[0]!;
    const ev = run(flare, 0.3, { flare: true });
    expect(ev.some((e) => e.type === 'ghoulNotice')).toBe(true);
    expect(g.lureTime).toBeGreaterThan(0);
    run(flare, 2);
    expect(g.x).toBeLessThan(15 * TILE);

    // Iskra, ktorá zhasne o stĺp, priláka nakazeného z rímsy k sebe.
    const decoy = make([
      '             g              ',
      '         ##########         ',
      ' P     #                   E',
      '############################',
    ]);
    const d = decoy.ghouls[0]!;
    decoy.step(1 / 60, { ...NO_INPUT, spark: true });
    const noise = run(decoy, 0.5);
    expect(noise.some((e) => e.type === 'fizzle')).toBe(true);
    expect(d.lureTime).toBeGreaterThan(0);
    run(decoy, 3);
    expect(d.x).toBeLessThan(11 * TILE);
  });

  it('voda topí', () => {
    const game = make([' P          E', '###www#######', '###www#######']);
    const events = run(game, 2, { right: true });
    expect(events).toContainEqual({ type: 'died', cause: 'water' });
  });

  it('drobiaci sa kameň sa po chvíli rozpadne a potom vráti', () => {
    const game = make([' P          E', '  ccc        ', '             ', '#############']);
    game.player.x = 3 * TILE + 4;
    run(game, 0.3);
    expect(game.crumbles.some((c) => c.state !== 'solid')).toBe(true);
    const events = run(game, 1);
    expect(events.some((e) => e.type === 'crumble')).toBe(true);
    game.player.x = 10 * TILE;
    run(game, 4);
    expect(game.crumbles.every((c) => c.state === 'solid')).toBe(true);
  });
});

describe('nové svety', () => {
  it('skákacia huba vymrští vyššie ako skok', () => {
    const game = make([
      '             ',
      '             ',
      '             ',
      '             ',
      '             ',
      '             ',
      '             ',
      ' P          E',
      '###b#########',
    ]);
    let top = Infinity;
    for (let t = 0; t < 2; t += DT) {
      const events = game.step(DT, { ...NO_INPUT, right: t < 0.5 });
      if (events.some((e) => e.type === 'bounce')) top = game.player.y;
      top = Math.min(top, game.player.y);
    }
    expect(7 * TILE - top).toBeGreaterThan(5 * TILE);
  });

  it('na ľade sa postavička kĺže', () => {
    const ice = make([' P                       E', 'iiiiiiiiiiiiiiiiiiiiiiiiii']);
    const rock = make([' P                       E', '##########################']);
    for (const g of [ice, rock]) {
      run(g, 1.2, { right: true });
      run(g, 0.4);
    }
    expect(ice.player.vx).toBeGreaterThan(rock.player.vx + 30);
  });

  it('cencúľ spadne a zabije, keď pod ním hráč stojí', () => {
    const game = make(['#########', '   v     ', '         ', ' P      E', '#########']);
    game.player.x = 3 * TILE + 4;
    const events = run(game, 2);
    expect(events).toContainEqual({ type: 'died', cause: 'icicle' });
  });

  it('pohyblivá plošina vezie hráča', () => {
    const game = make([
      '                ',
      ' P              E',
      '##H         #####',
      '                ',
    ]);
    game.player.x = 2 * TILE + 8;
    game.player.y = 2 * TILE - 13 - 2;
    run(game, 0.2);
    expect(game.onMover).toBe(0);
    const x = game.player.x;
    run(game, 1.5);
    expect(game.player.x).toBeGreaterThan(x + 20);
    expect(game.state).toBe('play');
  });

  it('veľký tieň vydrží tri zásahy iskrou', () => {
    const game = make([' P      S      E', '################']);
    run(game, 0.3);
    const shade = game.shades[0]!;
    expect(shade.big).toBe(true);
    let hits = 0;
    for (let i = 0; i < 6 && shade.alive; i++) {
      shade.x = game.lamp.x + 30;
      shade.y = game.lamp.y;
      shade.home = { x: shade.x, y: shade.y };
      const events = [...game.step(DT, { ...NO_INPUT, spark: true }), ...run(game, 0.5)];
      hits += events.filter((e) => e.type === 'shadeHit' || e.type === 'shadeDie').length;
    }
    expect(shade.alive).toBe(false);
    expect(hits).toBe(3);
  });

  it('vietor fúka v nárazoch: najprv bezvetrie, potom náraz proti hráčovi', () => {
    expect(windAt(0)).toBe(0);
    expect(calmLeft(0)).toBeGreaterThan(3);
    expect(windAt(5)).toBe(-1);
    expect(calmLeft(5)).toBe(0);
    expect(windAt(2 * WIND_CYCLE + 5)).toBe(1);
  });

  it('náraz vetra odfúkne hráča vo vzduchu, stojaceho nie', () => {
    const rows = [
      '                              ',
      '              P              E',
      '##############################',
    ];
    const standing = make(rows, undefined, 'pits');
    run(standing, 5);
    const x = standing.player.x;
    run(standing, 1);
    expect(standing.wind).toBe(-1);
    expect(standing.player.x).toBe(x);

    const jumping = make(rows, undefined, 'pits');
    run(jumping, 5);
    const x0 = jumping.player.x;
    run(jumping, 0.5, { jump: true });
    expect(jumping.player.x).toBeLessThan(x0 - 20);
  });

  it('za skalou je hráč v závetrí', () => {
    const game = make(
      ['                    ', '          P#       E', '####################'],
      undefined,
      'pits',
    );
    run(game, 5);
    expect(game.wind).toBe(-1);
    expect(game.sheltered).toBe(true);
    // Krok od skaly už závetrie nedáva.
    game.player.x -= 2 * TILE;
    run(game, DT);
    expect(game.sheltered).toBe(false);
  });

  it('nakazený chodí, nespadne z hrany a pri dotyku zabije', () => {
    // Nakazený na rímse nad hráčom ho nevidí, len sa prechádza a z hrany nespadne.
    const game = make([
      '              g          ',
      '             #####       ',
      ' P                      E',
      '#########################',
    ]);
    const g = game.ghouls[0]!;
    const y = g.y;
    let minX = g.x;
    let maxX = g.x;
    for (let t = 0; t < 20; t += DT) {
      game.step(DT, NO_INPUT);
      minX = Math.min(minX, g.x);
      maxX = Math.max(maxX, g.x);
    }
    expect(minX).toBeGreaterThanOrEqual(13 * TILE);
    expect(maxX).toBeLessThanOrEqual(18 * TILE);
    expect(maxX - minX).toBeGreaterThan(TILE);
    expect(g.y).toBe(y);
    const fresh = make(['                     ', ' P         g        E', '#####################']);
    const events = run(fresh, 8);
    expect(events.some((e) => e.type === 'ghoulNotice')).toBe(true);
    expect(events.some((e) => e.type === 'died' && e.cause === 'ghoul')).toBe(true);
  });

  it('palica: dva údery zabijú nakazeného, jeden ho zhodí do priepasti', () => {
    const swing = (game: Game) => [
      ...game.step(DT, { ...NO_INPUT, cane: true }),
      ...run(game, 0.5),
    ];
    const flat = make([' P     g               E', '########################']);
    const g = flat.ghouls[0]!;
    flat.player.x = g.x - 18;
    swing(flat);
    expect(g.alive).toBe(true);
    expect(g.x).toBeGreaterThan(7 * TILE + 8 + 10);
    flat.player.x = g.x - 18;
    swing(flat);
    expect(g.alive).toBe(false);

    const pit = make([' P     g  E', '########  #', '########  #']);
    const p = pit.ghouls[0]!;
    pit.player.x = p.x - 18;
    const ev = swing(pit);
    expect(p.alive).toBe(false);
    expect(ev.some((e) => e.type === 'ghoulDie')).toBe(true);

    // Skok na hlavu už nepomôže a iskra nakazeného len odhodí.
    const spark = make([' P      g       E', '#################']);
    const sg = spark.ghouls[0]!;
    spark.step(DT, { ...NO_INPUT, spark: true });
    run(spark, 0.6);
    expect(sg.alive).toBe(true);
    expect(sg.hp).toBeLessThan(1);

    const flare = make([' P   g          E', '#################']);
    expect(run(flare, 1.5, { flare: true }).some((e) => e.type === 'ghoulDie')).toBe(true);
    expect(flare.state).toBe('play');
  });

  it('palica zabije potkany', () => {
    const game = make([' P        r          E', '######################']);
    run(game, 2);
    const near = game.rats.filter((r) => Math.abs(r.x - game.center.x) < 40).length;
    expect(near).toBeGreaterThan(0);
    for (let i = 0; i < 4; i++) {
      game.step(DT, { ...NO_INPUT, cane: true });
      run(game, 0.5, { right: true });
    }
    expect(game.rats.some((r) => !r.alive)).toBe(true);
  });

  it('miazma nakazí a zabije, byliny vyliečia, rozžiarená fakľa ju spáli', () => {
    const rows = [
      '  ~~~~~~~~~~~~~   ',
      '  ~~~~~~~~~~~~~   ',
      ' P~~~~~~~~~~~~~  E',
      '#################',
    ];
    const game = make(rows);
    const events = [...run(game, 0.5, { right: true }), ...run(game, 4)];
    expect(events.some((e) => e.type === 'died' && e.cause === 'miasma')).toBe(true);

    const herb = make([' P  h        E', '#############']);
    herb.infection = 0.8;
    run(herb, 1.5, { right: true });
    expect(herb.infection).toBe(0);

    const burn = make(rows);
    run(burn, 1.5, { flare: true });
    expect(burn.state).toBe('play');
    const col = Math.floor(burn.center.x / TILE);
    expect(burn.fog[2 * burn.level.width + col]).toBeLessThan(0.3);
  });

  it('barikáda drží, kým ju iskra nepodpáli; oheň sa rozšíri a zhorí', () => {
    const game = make(['     x      ', '     x      ', ' P   x     E', '############']);
    run(game, 2, { right: true });
    expect(game.player.x).toBeLessThan(5 * TILE);
    expect(game.barricades.every((b) => b.state === 'solid')).toBe(true);
    const events = [...game.step(DT, { ...NO_INPUT, spark: true }), ...run(game, 3)];
    expect(events.some((e) => e.type === 'ignite')).toBe(true);
    expect(game.barricades.every((b) => b.state === 'gone')).toBe(true);
    run(game, 2, { right: true });
    expect(game.player.x).toBeGreaterThan(6 * TILE);
  });

  it('fakľa pod plášťom: menej svetla, pomalšia chôdza, nakazení nevidia, tma pohlcuje', () => {
    const open = make([' P                  E', '#####################']);
    run(open, 1, { right: true });
    const fast = open.player.x;
    const hidden = make([' P                  E', '#####################']);
    run(hidden, 1, { right: true, down: true });
    expect(hidden.player.x).toBeLessThan(fast - 20);
    expect(hidden.radius).toBeLessThan(30);
    expect(hidden.dread).toBeGreaterThan(0);
    const dark = run(hidden, 8, { down: true });
    expect(dark.some((e) => e.type === 'died' && e.cause === 'dark')).toBe(true);

    const sneak = make(['                     ', ' P      g           E', '#####################']);
    const ev = run(sneak, 1, { down: true });
    expect(ev.some((e) => e.type === 'ghoulNotice')).toBe(false);
  });

  it('mimo cintorína nefúka', () => {
    const game = make(FLAT);
    run(game, 6);
    expect(game.wind).toBe(0);
  });
});
