/**
 * battle-levels.test.ts
 *
 * Tests for applyLevelGain from the battle system.
 */

import { describe, it, expect } from 'vitest';
import { applyLevelGain } from '@/systems/battle';
import { makePokemon, makeItem } from './test-helpers';

// Helper: calcHp formula (mirrors battle.ts/battle-calc.ts)
function calcHp(baseHp: number, level: number): number {
  return Math.floor(baseHp * level / 50) + level + 10;
}

describe('applyLevelGain', () => {
  it('adds baseGain levels to all alive team members', () => {
    const team = [
      makePokemon({ name: 'A', level: 50, currentHp: 100, maxHp: 100 }),
      makePokemon({ name: 'B', level: 50, currentHp: 100, maxHp: 100 }),
    ];
    const participants = new Set<number>([0, 1]);

    applyLevelGain(team, 2, participants, [], false, false);

    expect(team[0].level).toBe(52);
    expect(team[1].level).toBe(52);
  });

  it('caps level at 100', () => {
    const team = [
      makePokemon({ name: 'NearMax', level: 99, currentHp: 100, maxHp: 100 }),
    ];
    const participants = new Set<number>([0]);

    applyLevelGain(team, 5, participants, [], false, false);

    expect(team[0].level).toBe(100);
  });

  it('Lucky Egg gives +1 level for wild battles only', () => {
    const luckyEgg = makeItem('lucky_egg');
    const teamWild = [
      makePokemon({ name: 'LuckyMon', level: 50, currentHp: 100, maxHp: 100, heldItem: luckyEgg }),
    ];
    const teamTrainer = [
      makePokemon({ name: 'LuckyMon', level: 50, currentHp: 100, maxHp: 100, heldItem: luckyEgg }),
    ];
    const participants = new Set<number>([0]);

    applyLevelGain(teamWild, 2, participants, [], true, false);
    applyLevelGain(teamTrainer, 2, participants, [], false, false); // not wild

    // Wild: 2 base + 1 lucky = 3 total
    expect(teamWild[0].level).toBe(53);
    // Not wild: 2 base only
    expect(teamTrainer[0].level).toBe(52);
  });

  it('HP scales proportionally on level-up', () => {
    const baseHp = 100;
    const pokemon = makePokemon({
      name: 'HPTest',
      level: 50,
      baseStats: { hp: baseHp, atk: 100, def: 100, speed: 100, special: 100, spdef: 100 },
      currentHp: 100,
      maxHp: calcHp(baseHp, 50),
    });
    const team = [pokemon];
    const participants = new Set<number>([0]);

    const oldMaxHp = pokemon.maxHp;
    applyLevelGain(team, 1, participants, [], false, false);

    const newMaxHp = calcHp(baseHp, 51);
    expect(team[0].maxHp).toBe(newMaxHp);
    // HP should have increased proportionally
    expect(team[0].maxHp).toBeGreaterThan(oldMaxHp);
  });

  it('returns LevelUpEvent for each leveled Pokemon', () => {
    const team = [
      makePokemon({ name: 'A', level: 50, currentHp: 100, maxHp: 100 }),
      makePokemon({ name: 'B', level: 50, currentHp: 100, maxHp: 100 }),
    ];
    const participants = new Set<number>([0, 1]);

    const events = applyLevelGain(team, 1, participants, [], false, false);

    expect(events).toHaveLength(2);
    expect(events[0].oldLevel).toBe(50);
    expect(events[0].newLevel).toBe(51);
    expect(events[1].oldLevel).toBe(50);
    expect(events[1].newLevel).toBe(51);
  });

  it('LevelUpEvent contains idx, pokemon, oldLevel, newLevel, preHp', () => {
    const team = [
      makePokemon({ name: 'Test', level: 40, currentHp: 75, maxHp: 100 }),
    ];
    const participants = new Set<number>([0]);

    const events = applyLevelGain(team, 3, participants, [], false, false);

    expect(events).toHaveLength(1);
    expect(events[0].idx).toBe(0);
    expect(events[0].pokemon).toBe(team[0]);
    expect(events[0].oldLevel).toBe(40);
    expect(events[0].newLevel).toBe(43);
    expect(events[0].preHp).toBe(75);
  });

  it('hard mode forces baseGain to 1 (ignores higher baseGain)', () => {
    const team = [
      makePokemon({ name: 'HardMon', level: 50, currentHp: 100, maxHp: 100 }),
    ];
    const participants = new Set<number>([0]);

    applyLevelGain(team, 5, participants, [], false, true); // hardMode=true

    // Hard mode: effectiveBase = 1, so gain only 1 level
    expect(team[0].level).toBe(51);
  });

  it('does not level up Pokemon that did not participate and are fainted', () => {
    const team = [
      makePokemon({ name: 'Active', level: 50, currentHp: 100, maxHp: 100 }),
      makePokemon({ name: 'Fainted', level: 50, currentHp: 0, maxHp: 100 }),
    ];
    // Only index 0 participated
    const participants = new Set<number>([0]);

    const events = applyLevelGain(team, 1, participants, [], false, false);

    // Only Active should level up; Fainted did not participate and has 0 HP
    expect(events).toHaveLength(1);
    expect(team[0].level).toBe(51);
    expect(team[1].level).toBe(50);
  });

  it('levels up fainted Pokemon that participated in the battle', () => {
    const team = [
      makePokemon({ name: 'FaintedParticipant', level: 50, currentHp: 0, maxHp: 100 }),
    ];
    // The fainted Pokemon DID participate
    const participants = new Set<number>([0]);

    const events = applyLevelGain(team, 1, participants, [], false, false);

    expect(events).toHaveLength(1);
    expect(team[0].level).toBe(51);
  });

  it('returns empty array when already at level 100', () => {
    const team = [
      makePokemon({ name: 'Max', level: 100, currentHp: 100, maxHp: 100 }),
    ];
    const participants = new Set<number>([0]);

    const events = applyLevelGain(team, 5, participants, [], false, false);
    expect(events).toHaveLength(0);
    expect(team[0].level).toBe(100);
  });
});
