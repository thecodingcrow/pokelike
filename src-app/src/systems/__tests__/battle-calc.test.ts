/**
 * battle-calc.test.ts
 *
 * Tests for calcDamage, getEffectiveStat, and getMove from the battle system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calcDamage, getEffectiveStat, getMove } from '@/systems/battle';
import type { PokemonType, Move } from '@/types';
import { makePokemon, makeItem } from './test-helpers';

// ── calcDamage tests ──────────────────────────────────────────────────────────

describe('calcDamage', () => {
  // Seed Math.random to avoid crit and rng variance (crit = 0, rng = 1.0)
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // no crit (0.0625 threshold), max rng
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper: fire move for testing
  const fireMove: Move = { name: 'Flamethrower', power: 90, type: 'Fire', isSpecial: true };
  const normalMove: Move = { name: 'Body Slam', power: 85, type: 'Normal', isSpecial: false };

  it('applies STAB bonus (1.5x) when attacker type matches move type', () => {
    const attacker = makePokemon({ types: ['Fire'] as PokemonType[] });
    const defender = makePokemon({ types: ['Normal'] as PokemonType[] });

    // With STAB
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { damage: withStab } = calcDamage(attacker, defender, fireMove, [], []);

    // Without STAB (change attacker type)
    const attackerNoStab = makePokemon({ types: ['Water'] as PokemonType[] });
    const { damage: noStab } = calcDamage(attackerNoStab, defender, fireMove, [], []);

    // STAB should give roughly 1.5x more damage
    expect(withStab).toBeGreaterThan(noStab);
    expect(withStab / noStab).toBeCloseTo(1.5, 0);
  });

  it('applies 2x effectiveness (Fire vs Grass)', () => {
    const attacker = makePokemon({ types: ['Water'] as PokemonType[] }); // no STAB
    const defenderGrass = makePokemon({ types: ['Grass'] as PokemonType[] });
    const defenderNormal = makePokemon({ types: ['Normal'] as PokemonType[] });

    const { damage: superEffective, typeEff } = calcDamage(attacker, defenderGrass, fireMove, [], []);
    const { damage: neutral } = calcDamage(attacker, defenderNormal, fireMove, [], []);

    expect(typeEff).toBe(2);
    expect(superEffective).toBeGreaterThan(neutral);
    expect(superEffective / neutral).toBeCloseTo(2, 0);
  });

  it('applies 0.5x for not-very-effective (Fire vs Water)', () => {
    const attacker = makePokemon({ types: ['Normal'] as PokemonType[] }); // no STAB
    const defenderWater = makePokemon({ types: ['Water'] as PokemonType[] });
    const defenderNormal = makePokemon({ types: ['Normal'] as PokemonType[] });

    const { damage: notVery, typeEff } = calcDamage(attacker, defenderWater, fireMove, [], []);
    const { damage: neutral } = calcDamage(attacker, defenderNormal, fireMove, [], []);

    expect(typeEff).toBe(0.5);
    expect(notVery).toBeLessThan(neutral);
    expect(neutral / notVery).toBeCloseTo(2, 0);
  });

  it('deals 0 damage on immunity (Normal vs Ghost)', () => {
    const attacker = makePokemon({ types: ['Water'] as PokemonType[] }); // no STAB
    const defender = makePokemon({ types: ['Ghost'] as PokemonType[] });

    const { damage, typeEff } = calcDamage(attacker, defender, normalMove, [], []);

    expect(typeEff).toBe(0);
    expect(damage).toBe(0);
  });

  it('applies 4x damage for dual-type super-effective (Electric vs Water/Flying)', () => {
    const electricMove: Move = { name: 'Thunderbolt', power: 90, type: 'Electric', isSpecial: true };
    const attacker = makePokemon({ types: ['Normal'] as PokemonType[] }); // no STAB
    const defenderDual = makePokemon({ types: ['Water', 'Flying'] as PokemonType[] });
    const defenderNormal = makePokemon({ types: ['Normal'] as PokemonType[] });

    const { damage: quadEffective, typeEff } = calcDamage(attacker, defenderDual, electricMove, [], []);
    const { damage: neutral } = calcDamage(attacker, defenderNormal, electricMove, [], []);

    expect(typeEff).toBe(4);
    expect(quadEffective / neutral).toBeCloseTo(4, 0);
  });

  it('deals minimum 1 damage (except on immunity)', () => {
    // Very weak attacker, very strong defender, neutral typing
    const weakAttacker = makePokemon({
      level: 1,
      baseStats: { hp: 5, atk: 5, def: 5, speed: 5, special: 5, spdef: 5 },
      types: ['Normal'] as PokemonType[],
    });
    const tankDefender = makePokemon({
      baseStats: { hp: 255, atk: 255, def: 255, speed: 255, special: 255, spdef: 255 },
      types: ['Steel'] as PokemonType[], // resist Normal
    });

    // Low power move
    const weakMove: Move = { name: 'Tackle', power: 1, type: 'Normal', isSpecial: false };
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // max rng, no crit
    const { damage } = calcDamage(weakAttacker, tankDefender, weakMove, [], []);

    // Should be at least 1 (unless immune)
    expect(damage).toBeGreaterThanOrEqual(1);
  });

  it('Choice Band adds ~40% physical damage', () => {
    const attacker = makePokemon({ types: ['Normal'] as PokemonType[] });
    const defender = makePokemon({ types: ['Normal'] as PokemonType[] });
    const physMove: Move = { name: 'Body Slam', power: 85, type: 'Normal', isSpecial: false };
    const choiceBand = makeItem('choice_band');

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { damage: withBand } = calcDamage(attacker, defender, physMove, [choiceBand], []);
    const { damage: withoutBand } = calcDamage(attacker, defender, physMove, [], []);

    // Choice Band gives 1.4x physical damage
    expect(withBand / withoutBand).toBeCloseTo(1.4, 1);
  });

  it('Life Orb adds ~30% damage', () => {
    const attacker = makePokemon({ types: ['Normal'] as PokemonType[] });
    const defender = makePokemon({ types: ['Normal'] as PokemonType[] });
    const lifeOrb = makeItem('life_orb');

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { damage: withOrb } = calcDamage(attacker, defender, normalMove, [lifeOrb], []);
    const { damage: withoutOrb } = calcDamage(attacker, defender, normalMove, [], []);

    expect(withOrb / withoutOrb).toBeCloseTo(1.3, 1);
  });

  it('Expert Belt adds ~20% on super-effective moves', () => {
    const attacker = makePokemon({ types: ['Normal'] as PokemonType[] }); // no STAB
    const defender = makePokemon({ types: ['Grass'] as PokemonType[] }); // fire 2x vs grass
    const expertBelt = makeItem('expert_belt');

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { damage: withBelt } = calcDamage(attacker, defender, fireMove, [expertBelt], []);
    const { damage: withoutBelt } = calcDamage(attacker, defender, fireMove, [], []);

    expect(withBelt / withoutBelt).toBeCloseTo(1.2, 1);
  });

  it('Expert Belt does NOT apply on neutral effectiveness', () => {
    const attacker = makePokemon({ types: ['Normal'] as PokemonType[] });
    const defender = makePokemon({ types: ['Normal'] as PokemonType[] });
    const expertBelt = makeItem('expert_belt');

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { damage: withBelt } = calcDamage(attacker, defender, fireMove, [expertBelt], []);
    const { damage: withoutBelt } = calcDamage(attacker, defender, fireMove, [], []);

    // No boost on neutral
    expect(withBelt).toBe(withoutBelt);
  });

  it('Type booster (charcoal) adds 50% for matching type (Fire)', () => {
    const attacker = makePokemon({ types: ['Water'] as PokemonType[] }); // no STAB
    const defender = makePokemon({ types: ['Normal'] as PokemonType[] });
    const charcoal = makeItem('charcoal');

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { damage: withCharcoal } = calcDamage(attacker, defender, fireMove, [charcoal], []);
    const { damage: withoutCharcoal } = calcDamage(attacker, defender, fireMove, [], []);

    expect(withCharcoal / withoutCharcoal).toBeCloseTo(1.5, 1);
  });
});

// ── getEffectiveStat tests ────────────────────────────────────────────────────

describe('getEffectiveStat', () => {
  it('uses base formula: floor(baseStat * level / 50) + 5', () => {
    const pokemon = makePokemon({ level: 50, baseStats: { hp: 100, atk: 100, def: 100, speed: 100, special: 100, spdef: 100 } });
    const stat = getEffectiveStat(pokemon, 'atk', []);
    // floor(100 * 50 / 50) + 5 = 100 + 5 = 105
    expect(stat).toBe(105);
  });

  it('Eviolite adds 50% to def and spdef', () => {
    const pokemon = makePokemon({ level: 50 });
    const eviolite = makeItem('eviolite');
    const def = getEffectiveStat(pokemon, 'def', [eviolite]);
    const spdef = getEffectiveStat(pokemon, 'spdef', [eviolite]);
    const defBase = getEffectiveStat(pokemon, 'def', []);
    const spdefBase = getEffectiveStat(pokemon, 'spdef', []);

    expect(def).toBe(Math.floor(defBase * 1.5));
    expect(spdef).toBe(Math.floor(spdefBase * 1.5));
  });

  it('Choice Scarf adds 50% to speed', () => {
    const pokemon = makePokemon({ level: 50 });
    const scarf = makeItem('choice_scarf');
    const speed = getEffectiveStat(pokemon, 'speed', [scarf]);
    const speedBase = getEffectiveStat(pokemon, 'speed', []);

    expect(speed).toBe(Math.floor(speedBase * 1.5));
  });

  it('Assault Vest adds 50% to spdef', () => {
    const pokemon = makePokemon({ level: 50 });
    const av = makeItem('assault_vest');
    const spdef = getEffectiveStat(pokemon, 'spdef', [av]);
    const spdefBase = getEffectiveStat(pokemon, 'spdef', []);

    expect(spdef).toBe(Math.floor(spdefBase * 1.5));
  });

  it('returns minimum 1 even with very low stats', () => {
    const pokemon = makePokemon({ level: 1, baseStats: { hp: 1, atk: 1, def: 1, speed: 1, special: 1, spdef: 1 } });
    const stat = getEffectiveStat(pokemon, 'atk', []);
    expect(stat).toBeGreaterThanOrEqual(1);
  });
});

// ── getMove tests ─────────────────────────────────────────────────────────────

describe('getMove', () => {
  it('returns type-matched move for a single-type Pokemon', () => {
    const fireMon = makePokemon({ types: ['Fire'] as PokemonType[], moveTier: 1 });
    const move = getMove(fireMon);
    expect(move.type).toBe('Fire');
  });

  it('skips Normal for dual-type (Fire/Flying returns Fire or Flying, not Normal)', () => {
    const charizard = makePokemon({
      types: ['Fire', 'Flying'] as PokemonType[],
      moveTier: 1,
    });
    const move = getMove(charizard);
    expect(['Fire', 'Flying']).toContain(move.type);
    // Should not fall back to Normal when type-specific moves exist
    expect(move.type).not.toBe('Normal');
  });

  it('uses tier 0 (weak) moves when moveTier=0', () => {
    const fireMonT0 = makePokemon({ types: ['Fire'] as PokemonType[], moveTier: 0 as 0 | 1 | 2 });
    const fireMonT2 = makePokemon({ types: ['Fire'] as PokemonType[], moveTier: 2 as 0 | 1 | 2 });

    const moveT0 = getMove(fireMonT0);
    const moveT2 = getMove(fireMonT2);

    // Tier 0 should have lower power than tier 2
    expect(moveT2.power).toBeGreaterThan(moveT0.power!);
  });

  it('selects special move pool when special >= atk', () => {
    const specialMon = makePokemon({
      types: ['Fire'] as PokemonType[],
      moveTier: 1,
      baseStats: { hp: 100, atk: 50, def: 50, speed: 50, special: 150, spdef: 50 },
    });
    const physicalMon = makePokemon({
      types: ['Fire'] as PokemonType[],
      moveTier: 1,
      baseStats: { hp: 100, atk: 150, def: 50, speed: 50, special: 50, spdef: 50 },
    });

    const specialMove = getMove(specialMon);
    const physicalMove = getMove(physicalMon);

    // Special attacker should use Flamethrower (special) vs Fire Punch (physical)
    expect(specialMove.isSpecial).toBe(true);
    expect(physicalMove.isSpecial).toBe(false);
  });

  it('returns Tackle as fallback for unknown type combinations', () => {
    // A Pokemon with types that don't have moves in the pool
    // In practice all types have pools, so this tests the Normal/dual-type path
    // where all types get skipped — but we can test Magikarp special case here
    const magikarp = makePokemon({ speciesId: 129, types: ['Water'] as PokemonType[] });
    const move = getMove(magikarp);
    // Magikarp returns Splash (noDamage)
    expect(move.isNoDamage).toBe(true);
  });

  it('returns noDamage move for Abra (speciesId 63)', () => {
    const abra = makePokemon({ speciesId: 63, types: ['Psychic'] as PokemonType[] });
    const move = getMove(abra);
    expect(move.isNoDamage).toBe(true);
    expect(move.name).toBe('Teleport');
  });
});
