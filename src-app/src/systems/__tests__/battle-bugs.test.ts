/**
 * battle-bugs.test.ts
 *
 * TDD regression tests for the five bugs identified in the battle engine.
 * Each test group follows the red-green cycle: tests were written BEFORE fixes.
 */

import { describe, it, expect } from 'vitest';
import { calcDamage, runBattle } from '@/systems/battle';
import type { PokemonInstance, PokemonType, HeldItem } from '@/types';

// ── Helper factory ────────────────────────────────────────────────────────────

function makePokemon(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    speciesId: 1,
    name: 'TestMon',
    nickname: null,
    level: 50,
    currentHp: 200,
    maxHp: 200,
    isShiny: false,
    types: ['Normal'] as PokemonType[],
    baseStats: { hp: 100, atk: 100, def: 100, speed: 100, special: 100, spdef: 100 },
    spriteUrl: '',
    megaStone: null,
    heldItem: null,
    moveTier: 1 as 0 | 1 | 2,
    ...overrides,
  };
}

function makeHeldItem(id: string): HeldItem {
  return { id, name: id, icon: '' };
}

// ── Bug 1: calcDamage must use move.isSpecial, not re-derive from base stats ──

describe('Bug 1 — calcDamage uses move.isSpecial', () => {
  it('should use Special stat (low=10) when move.isSpecial=true, even though ATK is much higher (200)', () => {
    // Attacker: ATK=200, Special=10. Bug would use ATK=200 for special move.
    // Fixed: use Special=10. The damage difference must be drastic.
    const attacker = makePokemon({
      // Special >= ATK check: 10 >= 200 = false → bug uses ATK=200 for special move
      // Fix: use move.isSpecial=true → use Special=10
      baseStats: { hp: 100, atk: 200, def: 50, speed: 100, special: 10, spdef: 50 },
      types: ['Normal'] as PokemonType[],
    });

    const defender = makePokemon({
      types: ['Normal'] as PokemonType[],
      baseStats: { hp: 100, atk: 50, def: 50, speed: 50, special: 50, spdef: 50 },
    });

    // Same power (90), same type (Normal), no STAB differences possible.
    // Both moves are Normal type vs Normal defender → 1x effectiveness.
    // Attacker is Normal type → STAB applies to BOTH moves equally.
    // Only difference: which stat is used. ATK=200 vs Special=10.
    const physicalMove = { name: 'Body Slam', power: 90, type: 'Normal' as PokemonType, isSpecial: false };
    const specialMove  = { name: 'Hyper Voice', power: 90, type: 'Normal' as PokemonType, isSpecial: true };

    const { damage: physicalDmg } = calcDamage(attacker, defender, physicalMove, [], []);
    const { damage: specialDmg }  = calcDamage(attacker, defender, specialMove, [], []);

    // With fix: physical uses ATK=200, special uses Special=10.
    // physicalDmg should be ~20x larger than specialDmg.
    // With bug: both use ATK=200 → similar damage → test would FAIL.
    expect(physicalDmg).toBeGreaterThan(specialDmg * 5);
  });

  it('should use ATK stat (low=10) when move.isSpecial=false, even though Special is much higher (200)', () => {
    // Attacker: ATK=10, Special=200. Bug would use Special=200 for physical move.
    // Fixed: use ATK=10. The damage difference must be drastic.
    const attacker = makePokemon({
      // Special >= ATK check: 200 >= 10 = true → bug uses Special=200 for physical move too
      // Fix: use move.isSpecial=false → use ATK=10
      baseStats: { hp: 100, atk: 10, def: 50, speed: 100, special: 200, spdef: 50 },
      types: ['Normal'] as PokemonType[],
    });

    const defender = makePokemon({
      types: ['Normal'] as PokemonType[],
      baseStats: { hp: 100, atk: 50, def: 50, speed: 50, special: 50, spdef: 50 },
    });

    const physicalMove = { name: 'Body Slam', power: 90, type: 'Normal' as PokemonType, isSpecial: false };
    const specialMove  = { name: 'Hyper Voice', power: 90, type: 'Normal' as PokemonType, isSpecial: true };

    const { damage: physicalDmg } = calcDamage(attacker, defender, physicalMove, [], []);
    const { damage: specialDmg }  = calcDamage(attacker, defender, specialMove, [], []);

    // With fix: special uses Special=200, physical uses ATK=10.
    // specialDmg should be ~20x larger than physicalDmg.
    // With bug: both use Special=200 → similar damage → test would FAIL.
    expect(specialDmg).toBeGreaterThan(physicalDmg * 5);
  });
});

// ── Bug 2: Air Balloon should check defender's items, not attacker's ──────────

describe('Bug 2 — Air Balloon checks defender items', () => {
  it('should deal 0 damage when DEFENDER holds Air Balloon and attacker uses Ground move', () => {
    const attacker = makePokemon({ types: ['Ground'] as PokemonType[] });
    const defender = makePokemon({
      types: ['Normal'] as PokemonType[],
      heldItem: makeHeldItem('air_balloon'),
    });

    const groundMove = {
      name: 'Earthquake',
      power: 100,
      type: 'Ground' as PokemonType,
      isSpecial: false,
    };

    const defItems: HeldItem[] = [makeHeldItem('air_balloon')];
    const { damage } = calcDamage(attacker, defender, groundMove, [], defItems);

    expect(damage).toBe(0);
  });

  it('should deal normal damage when ATTACKER holds Air Balloon and defender has none', () => {
    const attacker = makePokemon({
      types: ['Ground'] as PokemonType[],
      heldItem: makeHeldItem('air_balloon'),
    });
    const defender = makePokemon({ types: ['Normal'] as PokemonType[] });

    const groundMove = {
      name: 'Earthquake',
      power: 100,
      type: 'Ground' as PokemonType,
      isSpecial: false,
    };

    const atkItems: HeldItem[] = [makeHeldItem('air_balloon')];
    const { damage } = calcDamage(attacker, defender, groundMove, atkItems, []);

    // Attacker holds the balloon — defender does NOT — so damage should be > 0
    expect(damage).toBeGreaterThan(0);
  });
});

// ── Bug 3: Ditto transform must deep-copy and copy moveTier ───────────────────

describe('Bug 3 — Ditto transform deep-copy and moveTier', () => {
  it('should not mutate original team baseStats reference after Ditto transforms', () => {
    const originalBaseStats = { hp: 80, atk: 80, def: 80, speed: 80, special: 80, spdef: 80 };

    const ditto = makePokemon({
      speciesId: 132,
      name: 'Ditto',
      // Give Ditto low stats so it needs to transform
      baseStats: { hp: 48, atk: 48, def: 48, speed: 48, special: 48, spdef: 48 },
      types: ['Normal'] as PokemonType[],
      currentHp: 100,
      maxHp: 100,
    });

    const enemy = makePokemon({
      name: 'Dragonite',
      types: ['Dragon', 'Flying'] as PokemonType[],
      baseStats: { ...originalBaseStats },
      level: 50,
      currentHp: 180,
      maxHp: 180,
    });

    // Keep a reference to the original baseStats object from the player team
    const playerTeam = [{ ...ditto }];
    const originalStatRef = playerTeam[0].baseStats;

    runBattle(playerTeam, [enemy], [], []);

    // The internal pTeam copy should have mutated Ditto's baseStats,
    // but the originalStatRef from playerTeam[0] should be untouched
    // (only possible if the shallow copy was deep enough for baseStats)
    // Since runBattle does map(p => ({...p})), the baseStats object reference
    // on pTeam[0] is the SAME as playerTeam[0].baseStats.
    // After fix: Ditto's transform should NOT modify the original baseStats object.

    // The original player team baseStats object should remain Ditto's original stats
    expect(originalStatRef.atk).toBe(48); // Ditto's original ATK, not enemy's
    expect(originalStatRef.hp).toBe(48);  // Ditto's original HP, not enemy's
  });

  it('should copy moveTier from transformed target during Ditto transform', () => {
    const ditto = makePokemon({
      speciesId: 132,
      name: 'Ditto',
      baseStats: { hp: 48, atk: 48, def: 48, speed: 48, special: 48, spdef: 48 },
      types: ['Normal'] as PokemonType[],
      moveTier: 0 as 0 | 1 | 2,  // Ditto has tier 0
      currentHp: 100,
      maxHp: 100,
      level: 50,
    });

    // Enemy with tier 2 — uses powerful moves
    const enemy = makePokemon({
      name: 'Dragonite',
      types: ['Dragon'] as PokemonType[],
      baseStats: { hp: 91, atk: 134, def: 95, speed: 80, special: 100, spdef: 100 },
      moveTier: 2 as 0 | 1 | 2,  // tier 2 = Outrage (power 120)
      level: 50,
      currentHp: 200,
      maxHp: 200,
    });

    const result = runBattle([ditto], [enemy], [], []);

    // Find a transform event in the detailed log
    const transformEvent = result.detailedLog.find(e => e.type === 'transform');
    expect(transformEvent).toBeDefined();

    // After transform, Ditto should use tier-2 Dragon moves (Outrage, power 120)
    // Find any attack event from the player side after the transform
    const attacksAfterTransform = result.detailedLog
      .slice(result.detailedLog.indexOf(transformEvent!))
      .filter(e => e.type === 'attack' && e.side === 'player' && (e as any).damage > 0);

    // At least one attack should use a tier-2 Dragon move (Outrage)
    const usedOutrage = attacksAfterTransform.some(
      e => (e as any).moveName === 'Outrage',
    );
    expect(usedOutrage).toBe(true);
  });
});

// ── Bug 4: Struggle fallback when both sides only have noDamage moves ─────────

describe('Bug 4 — Struggle fallback for noDamage-only Pokemon', () => {
  it('should complete without hanging when both sides have only noDamage moves', () => {
    // Magikarp (speciesId 129) always uses Splash (noDamage)
    const magikarp = makePokemon({
      speciesId: 129,
      name: 'Magikarp',
      types: ['Water'] as PokemonType[],
      baseStats: { hp: 20, atk: 10, def: 55, speed: 80, special: 15, spdef: 20 },
      currentHp: 50,
      maxHp: 50,
      level: 20,
    });

    // Abra (speciesId 63) always uses Teleport (noDamage)
    const abra = makePokemon({
      speciesId: 63,
      name: 'Abra',
      types: ['Psychic'] as PokemonType[],
      baseStats: { hp: 25, atk: 20, def: 15, speed: 90, special: 105, spdef: 55 },
      currentHp: 50,
      maxHp: 50,
      level: 20,
    });

    // This should complete (not infinite-loop) and return a valid result
    const result = runBattle([magikarp], [abra], [], []);

    expect(result).toBeDefined();
    expect(result.log.length).toBeGreaterThan(0);

    // Battle must have ended — either one side won or stalemate
    const hasResult = result.detailedLog.some(e => e.type === 'result');
    expect(hasResult).toBe(true);

    // Both sides must have used Struggle (power 50) — check the text log
    const logText = result.log.map(e => e.msg).join('\n');
    expect(logText).toContain('Struggle');
  });

  it('should use Struggle with power 50 (deals actual damage) for noDamage-only battles', () => {
    const magikarp = makePokemon({
      speciesId: 129,
      name: 'Magikarp',
      types: ['Water'] as PokemonType[],
      baseStats: { hp: 20, atk: 10, def: 55, speed: 80, special: 15, spdef: 20 },
      currentHp: 50,
      maxHp: 50,
      level: 20,
    });

    const anotherMagikarp = makePokemon({
      speciesId: 129,
      name: 'Magikarp2',
      types: ['Water'] as PokemonType[],
      baseStats: { hp: 20, atk: 10, def: 55, speed: 80, special: 15, spdef: 20 },
      currentHp: 50,
      maxHp: 50,
      level: 20,
    });

    const result = runBattle([magikarp], [anotherMagikarp], [], []);

    // Someone must have won (Struggle does damage, so battle ends eventually)
    const resultEvent = result.detailedLog.find(e => e.type === 'result');
    expect(resultEvent).toBeDefined();

    // The battle log must contain Struggle attacks (with damage > 0)
    const struggleAttacks = result.detailedLog.filter(
      e => e.type === 'attack' && (e as any).moveName === 'Struggle' && (e as any).damage > 0,
    );
    expect(struggleAttacks.length).toBeGreaterThan(0);
  });
});

// ── Bug 5: MAX_ROUNDS stalemate log message ───────────────────────────────────

describe('Bug 5 — MAX_ROUNDS stalemate message', () => {
  it('should log Stalemate message (not Defeat) when battle times out', () => {
    // Two extremely tanky Pokemon with maxed defense that deal 0 effective damage
    // We use Ghost-type Normal move (Ghost is immune to Normal)
    // to guarantee 0 damage per hit, forcing a stalemate

    // Pokemon A: Ghost type, uses Normal moves → 0 effectiveness vs Ghost
    // Pokemon B: Ghost type → Normal has 0 effectiveness on it
    // This forces the game into Struggle fallback, but we need them to survive 300 rounds.
    // Instead, give them massive HP and low ATK so they can't kill each other.

    const tankA = makePokemon({
      name: 'TankA',
      types: ['Normal'] as PokemonType[],
      // Normal moves do 0 damage to Ghost, so if both are Ghost this could deadlock.
      // Use high HP and very low damage output to force MAX_ROUNDS
      baseStats: { hp: 255, atk: 5, def: 255, speed: 50, special: 5, spdef: 255 },
      currentHp: 9999,
      maxHp: 9999,
      level: 100,
    });

    const tankB = makePokemon({
      name: 'TankB',
      types: ['Normal'] as PokemonType[],
      baseStats: { hp: 255, atk: 5, def: 255, speed: 50, special: 5, spdef: 255 },
      currentHp: 9999,
      maxHp: 9999,
      level: 100,
    });

    const result = runBattle([tankA], [tankB], [], []);

    // Must NOT say "Defeat" when it's a stalemate (timed out)
    // Must say "Stalemate"
    const lastLogMsg = result.log[result.log.length - 1].msg;
    expect(lastLogMsg).toContain('Stalemate');
    expect(lastLogMsg).not.toContain('Defeat');
  });
});
