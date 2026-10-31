import { describe, expect, it } from 'vitest';
import { Game } from '@/game/game';
import { parseLevel } from '@/game/level';
import { LEVELS } from '@/game/levels';
import { botRun } from './bot';

describe('prejazdnosť levelov', () => {
  for (const def of LEVELS) {
    it(`${def.id} sa dá prejsť (bot beží doprava a skáče)`, () => {
      const game = new Game(parseLevel(def));
      const result = botRun(game);
      // Krysí príliv sa spustí a dá sa prečkať na streche bez jedinej smrti.
      expect(result, JSON.stringify(result)).toMatchObject({ done: true, rats: 0 });
      for (const t of game.tides) expect(t.state, def.id).toBe('gone');
    });
    // Bot nerozžiaruje ani nehádže iskry, preto mu musí ostať rezerva aj pre hráča.
    it(`${def.id}: smola vystačí (bot bez dopĺňania má rezervu aspoň 20 %)`, () => {
      const result = botRun(new Game(parseLevel(def)), 600, false);
      expect(result, JSON.stringify(result)).toMatchObject({ done: true, dark: 0 });
      expect(result.minOil, JSON.stringify(result)).toBeGreaterThanOrEqual(20);
    });
  }
});
