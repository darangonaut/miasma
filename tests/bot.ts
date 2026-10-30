import {
  Game,
  MOVER_W,
  NO_INPUT,
  PLAYER_H,
  PLAYER_W,
  calmLeft,
  hasWind,
  type Input,
} from '@/game/game';
import { TILE, Tile, isGround, tileAt } from '@/game/level';

/**
 * Jednoduchý bot: beží doprava a skáče pred stenou, priepasťou a tŕňmi; na pohyblivé
 * plošiny počká a nechá sa odviezť. Prízraky, muchy a nakazených vypína. Smolu dopĺňa len
 * s `refuel`; bez neho overí, že uhlíky a kaplnky po ceste stačia (počíta smrti v tme). Vráti, či došiel k vatre, najďalší stĺpec a počet pádov.
 */
export function botRun(
  game: Game,
  seconds = 600,
  refuel = true,
): { done: boolean; col: number; deaths: number; dark: number; minOil: number } {
  const dt = 1 / 60;
  let hold = 0;
  let best = 0;
  let dark = 0;
  let minOil = game.oil;
  const level = game.level;
  const windy = hasWind(level.world);
  const solidish = (c: number, r: number) => {
    const tile = tileAt(level, c, r);
    return (
      isGround(tile) ||
      tile === Tile.Ledge ||
      tile === Tile.Crumble ||
      (tile === Tile.Light && game.isTileLit(c, r))
    );
  };
  /** Dá sa naň postaviť: pevné políčko s voľným miestom nad ním. */
  const landable = (c: number, r: number) =>
    solidish(c, r) && !solidish(c, r - 1) && tileAt(level, c, r - 1) !== Tile.Thorns;

  for (let t = 0; t < seconds && game.state !== 'done'; t += dt) {
    if (refuel) game.oil = 100;
    for (const s of game.shades) s.alive = false;
    for (const m of game.moths) m.alive = false;
    for (const g of game.ghouls) g.alive = false;
    const p = game.player;
    const front = Math.floor((p.x + PLAYER_W + 4) / TILE);
    const ahead = (d: number) => Math.floor((p.x + PLAYER_W + d) / TILE);
    const feet = Math.floor((p.y + PLAYER_H + 2) / TILE);
    const row = Math.floor((p.y + PLAYER_H - 2) / TILE);
    const feetY = p.y + PLAYER_H;

    const step = (input: Partial<Input>) => {
      for (const e of game.step(dt, { ...NO_INPUT, ...input }))
        if (e.type === 'died' && e.cause === 'dark') dark++;
      minOil = Math.min(minOil, game.oil);
      best = Math.max(best, Math.floor(p.x / TILE));
    };

    // Preskočil vatru: vráti sa k nej pešo.
    if (p.x > level.exit.x + 8 && p.onGround) {
      step({ left: true });
      continue;
    }

    // Na pohyblivej plošine: čaká, kým je pred ním pevná zem na dosah, potom zíde/skočí.
    if (game.onMover >= 0) {
      let target: { c: number; r: number } | null = null;
      for (let d = 2; d <= 40 && !target; d += 6)
        for (let r = feet - 3; r <= feet + 1; r++)
          if (landable(ahead(d), r)) {
            target = { c: ahead(d), r };
            break;
          }
      // Inak prejde na pravý okraj a skočí na ďalšiu pohyblivú plošinu, keď je na dosah.
      const cur = game.movers[game.onMover]!;
      const next = game.movers.find(
        (m) => m !== cur && m.x > cur.x && m.x < cur.x + 10 * TILE && Math.abs(m.y - feetY) <= 24,
      );
      const atEdge = p.x + PLAYER_W >= cur.x + MOVER_W - 4;
      const reach = next && next.x <= p.x + PLAYER_W + 36 && Math.abs(next.y - feetY) <= 8;
      // V búrke zo plošiny neskáče, kým fúka.
      if (windy && (game.wind !== 0 || calmLeft(game.time) < 1)) step({});
      else if (target) step({ right: true, jump: target.r < feet });
      else if (next && reach && atEdge) step({ right: true, jump: true });
      else if (next && !atEdge) step({ right: true });
      else step({});
      continue;
    }

    const wall =
      isGround(tileAt(level, front, row)) ||
      tileAt(level, front, row) === Tile.Crumble ||
      (tileAt(level, front, row) === Tile.Light && game.isTileLit(front, row));
    // Priepasť preskočí; keď je pod hranou nižšia plošina, radšej z hrany zíde (ako hráč).
    const below = (test: (c: number, r: number) => boolean) =>
      [2, 10, 18].some((d) => [0, 1, 2, 3].some((r) => test(ahead(d), feet + r)));
    const lower =
      below((c, r) => r > feet && landable(c, r)) &&
      !below((c, r) => tileAt(level, c, r) === Tile.Thorns);
    const gap = !solidish(ahead(2), feet) && !lower;

    // Pred priepasťou s pohyblivou plošinou počká, kým plošina pripláva na dosah.
    if (p.onGround && gap) {
      const near = game.movers.filter((m) => m.x + MOVER_W > p.x && m.x < p.x + 8 * TILE);
      if (near.length) {
        const ready = near.find(
          (m) =>
            m.x <= p.x + PLAYER_W + 6 &&
            m.x + MOVER_W >= p.x + PLAYER_W + 12 &&
            m.y >= feetY - 6 &&
            m.y <= feetY + 20,
        );
        step(ready ? { right: true } : {});
        continue;
      }
    }

    const thorns = [2, 6].some((d) => tileAt(level, ahead(d), row) === Tile.Thorns);
    // Plošina vyššie pred ním, na ktorú sa dá vyskočiť.
    let up = false;
    for (let d = 4; d <= 24 && !up; d += 4)
      for (let r = row - 3; r <= row - 1; r++) if (landable(ahead(d), r)) up = true;
    // Vietor: pred skokom z pevnej zeme počká, kým utíchne a do nárazu je dosť času.
    const bounceAhead = [2, 8].some((d) => tileAt(level, ahead(d), feet) === Tile.Bounce);
    if (windy && p.onGround && game.onMover < 0 && (wall || gap || thorns || up || bounceAhead)) {
      const under = tileAt(level, Math.floor((p.x + PLAYER_W / 2) / TILE), feet);
      if (
        under !== Tile.Crumble &&
        under !== Tile.Ice &&
        (game.wind !== 0 || calmLeft(game.time) < 1.6)
      ) {
        hold = 0;
        step({});
        continue;
      }
    }
    if (p.onGround && (wall || gap || thorns || up)) hold = 0.65;
    const jump = hold > 0;
    hold -= dt;
    // Vo vzduchu nad plošinou pribrzdí opačnou šípkou, aby ju nepreletel (ako hráč).
    const under = Math.floor((p.x + PLAYER_W / 2) / TILE);
    const overMover = game.movers.some(
      (m) => m.x < p.x + PLAYER_W && m.x + MOVER_W > p.x && m.y > feetY && m.y < feetY + 3 * TILE,
    );
    // Ak je hneď pred ním hrana, na ktorú práve vyskakuje, nebrzdí.
    const ledgeAhead = [feet - 1, feet].some((r) => landable(ahead(4), r));
    const brake =
      !p.onGround &&
      !ledgeAhead &&
      p.vy > -40 &&
      ((overMover && p.vy > 40) || [0, 1, 2, 3, 4].some((d) => landable(under, feet + d)));
    step({ right: !brake, left: brake && p.vx > 20, jump });
  }
  return { done: game.state === 'done', col: best, deaths: game.deaths, dark, minOil };
}
