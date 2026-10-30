import { describe, expect, it } from 'vitest';
import { Game } from '@/game/game';
import { parseLevel } from '@/game/level';
import { LEVELS } from '@/game/levels';
import { botRun } from './bot';

describe('prejazdnosť levelov', () => {
  for (const def of LEVELS) {
    it(`${def.id} sa dá prejsť (bot beží doprava a skáče)`, () => {
      const result = botRun(new Game(parseLevel(def)));
      expect(result, JSON.stringify(result)).toMatchObject({ done: true });
    });
  }
});
