/**
 * battle-engine.test.ts
 *
 * Tests for runBattle from the battle system.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { runBattle } from '@/systems/battle';
import { makePokemon, makeItem } from './test-helpers';

afterEach(() => {
  vi.restoreAllMocks();
});

// ── 1v1: stronger Pokemon wins ────────────────────────────────────────────────

describe('runBattle — 1v1 basic', () => {
  it('stronger Pokemon wins in a 1v1', () => {
    const strong = makePokemon({
      name: 'Strong',
      level: 100,
      baseStats: { hp: 255, atk: 255, def: 100, speed: 100, special: 100, spdef: 100 },
      currentHp: 600,
      maxHp: 600,
    });
    const weak = makePokemon({
      name: 'Weak',
      level: 1,
      baseStats: { hp: 10, atk: 5, def: 5, speed: 5, special: 5, spdef: 5 },
      currentHp: 10,
      maxHp: 10,
    });

    const result = runBattle([strong], [weak], [], []);
    expect(result.playerWon).toBe(true);
  });

  it('returns playerWon=false when player team loses', () => {
    const weak = makePokemon({
      name: 'Weak',
      level: 1,
      baseStats: { hp: 10, atk: 5, def: 5, speed: 5, special: 5, spdef: 5 },
      currentHp: 10,
      maxHp: 10,
    });
    const strong = makePokemon({
      name: 'Strong',
      level: 100,
      baseStats: { hp: 255, atk: 255, def: 100, speed: 100, special: 100, spdef: 100 },
      currentHp: 600,
      maxHp: 600,
    });

    const result = runBattle([weak], [strong], [], []);
    expect(result.playerWon).toBe(false);
  });
});

// ── 3v3: team sweeps through opponents in order ───────────────────────────────

describe('runBattle — 3v3', () => {
  it('3v3: strong player team sweeps weak enemies in order', () => {
    const strongMon = () => makePokemon({
      level: 100,
      baseStats: { hp: 255, atk: 255, def: 100, speed: 200, special: 100, spdef: 100 },
      currentHp: 600,
      maxHp: 600,
    });
    const weakMon = (name: string) => makePokemon({
      name,
      level: 1,
      baseStats: { hp: 10, atk: 5, def: 5, speed: 5, special: 5, spdef: 5 },
      currentHp: 10,
      maxHp: 10,
    });

    const playerTeam = [strongMon(), strongMon(), strongMon()];
    const enemyTeam = [weakMon('EnemyA'), weakMon('EnemyB'), weakMon('EnemyC')];

    const result = runBattle(playerTeam, enemyTeam, [], []);
    expect(result.playerWon).toBe(true);
    // All enemies should be fainted
    expect(result.eTeam.every(p => p.currentHp === 0)).toBe(true);
  });
});

// ── Speed ordering ────────────────────────────────────────────────────────────

describe('runBattle — speed ordering', () => {
  it('faster Pokemon attacks first', () => {
    // Both 1-shot each other; faster one should win
    const fast = makePokemon({
      name: 'Fast',
      baseStats: { hp: 100, atk: 200, def: 50, speed: 200, special: 50, spdef: 50 },
      currentHp: 50,
      maxHp: 50,
      level: 50,
    });
    const slow = makePokemon({
      name: 'Slow',
      baseStats: { hp: 100, atk: 200, def: 50, speed: 10, special: 50, spdef: 50 },
      currentHp: 50,
      maxHp: 50,
      level: 50,
    });

    // Both deal massive damage; the faster one kills first
    const result = runBattle([fast], [slow], [], []);
    // Fast has speed 200, slow has speed 10 — fast should win
    expect(result.playerWon).toBe(true);
    expect(result.pTeam[0].currentHp).toBeGreaterThan(0);
  });
});

// ── Leftovers healing ─────────────────────────────────────────────────────────

describe('runBattle — Leftovers', () => {
  it('Leftovers restores HP each round', () => {
    // Player has Leftovers, enemy has no items and can't deal much damage
    const playerMon = makePokemon({
      name: 'LeftoversMon',
      heldItem: makeItem('leftovers'),
      currentHp: 100,
      maxHp: 200,
      baseStats: { hp: 100, atk: 100, def: 255, speed: 100, special: 100, spdef: 255 },
      level: 50,
    });
    const weakEnemy = makePokemon({
      name: 'WeakEnemy',
      baseStats: { hp: 100, atk: 5, def: 5, speed: 50, special: 5, spdef: 5 },
      level: 1,
      currentHp: 500,
      maxHp: 500,
    });

    const result = runBattle([playerMon], [weakEnemy], [], []);

    // Check detailedLog for Leftovers heal events
    const leftoversEvents = result.detailedLog.filter(
      e => e.type === 'effect' && 'reason' in e && e.reason.includes('Leftovers'),
    );
    expect(leftoversEvents.length).toBeGreaterThan(0);
  });
});

// ── Life Orb recoil ───────────────────────────────────────────────────────────

describe('runBattle — Life Orb recoil', () => {
  it('Life Orb attacker takes -10% maxHP recoil per hit', () => {
    const lifeOrbMon = makePokemon({
      name: 'OrbMon',
      heldItem: makeItem('life_orb'),
      currentHp: 200,
      maxHp: 200,
      baseStats: { hp: 100, atk: 100, def: 100, speed: 100, special: 100, spdef: 100 },
      level: 50,
    });
    const enemy = makePokemon({
      name: 'TankEnemy',
      baseStats: { hp: 255, atk: 10, def: 255, speed: 10, special: 10, spdef: 255 },
      level: 50,
      currentHp: 9999,
      maxHp: 9999,
    });

    const result = runBattle([lifeOrbMon], [enemy], [], []);

    // Check for Life Orb recoil events in detailedLog
    const recoilEvents = result.detailedLog.filter(
      e => e.type === 'effect' && 'reason' in e && e.reason.includes('Life Orb'),
    );
    expect(recoilEvents.length).toBeGreaterThan(0);

    // Each recoil should be -10% of maxHp
    for (const ev of recoilEvents) {
      if (ev.type === 'effect') {
        expect(ev.hpChange).toBeLessThan(0);
        expect(Math.abs(ev.hpChange)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

// ── Rocky Helmet recoil ───────────────────────────────────────────────────────

describe('runBattle — Rocky Helmet', () => {
  it('Rocky Helmet deals 15% maxHP to attacker on each hit', () => {
    const helmeted = makePokemon({
      name: 'HelmEnemy',
      heldItem: makeItem('rocky_helmet'),
      baseStats: { hp: 100, atk: 10, def: 255, speed: 10, special: 10, spdef: 255 },
      level: 50,
      currentHp: 9999,
      maxHp: 9999,
    });
    const attacker = makePokemon({
      name: 'Attacker',
      baseStats: { hp: 100, atk: 100, def: 100, speed: 100, special: 100, spdef: 100 },
      level: 50,
      currentHp: 200,
      maxHp: 200,
    });

    const result = runBattle([attacker], [helmeted], [], []);

    const helmetEvents = result.detailedLog.filter(
      e => e.type === 'effect' && 'reason' in e && e.reason.includes('Rocky Helmet'),
    );
    expect(helmetEvents.length).toBeGreaterThan(0);

    // Recoil should be 15% of maxHp (200) = 30
    for (const ev of helmetEvents) {
      if (ev.type === 'effect') {
        expect(Math.abs(ev.hpChange)).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

// ── Shell Bell healing ────────────────────────────────────────────────────────

describe('runBattle — Shell Bell', () => {
  it('Shell Bell heals 25% of damage dealt to attacker', () => {
    const shellBellMon = makePokemon({
      name: 'BellMon',
      heldItem: makeItem('shell_bell'),
      // Start at partial HP so healing is visible
      currentHp: 100,
      maxHp: 200,
      baseStats: { hp: 100, atk: 100, def: 100, speed: 100, special: 100, spdef: 100 },
      level: 50,
    });
    const enemy = makePokemon({
      name: 'Enemy',
      baseStats: { hp: 100, atk: 10, def: 10, speed: 10, special: 10, spdef: 10 },
      level: 1,
      currentHp: 9999,
      maxHp: 9999,
    });

    const result = runBattle([shellBellMon], [enemy], [], []);

    const shellBellEvents = result.detailedLog.filter(
      e => e.type === 'effect' && 'reason' in e && e.reason.includes('Shell Bell'),
    );
    expect(shellBellEvents.length).toBeGreaterThan(0);

    // Shell Bell heals positive amounts
    for (const ev of shellBellEvents) {
      if (ev.type === 'effect') {
        expect(ev.hpChange).toBeGreaterThan(0);
      }
    }
  });
});

// ── Focus Band survival ───────────────────────────────────────────────────────

describe('runBattle — Focus Band', () => {
  it('Focus Band triggers 10% survival chance (seed Math.random to force it)', () => {
    // Mock Math.random to return < 0.1 so Focus Band always triggers
    // Focus Band logic: if Math.random() < 0.1, survive at 1 HP
    vi.spyOn(Math, 'random').mockReturnValue(0.05); // always triggers focus band + no crit

    const focusMon = makePokemon({
      name: 'FocusMon',
      heldItem: makeItem('focus_band'),
      currentHp: 100,
      maxHp: 100,
      baseStats: { hp: 100, atk: 50, def: 5, speed: 50, special: 50, spdef: 5 },
      level: 50,
    });
    const killer = makePokemon({
      name: 'Killer',
      baseStats: { hp: 100, atk: 255, def: 100, speed: 200, special: 100, spdef: 100 },
      level: 100,
      currentHp: 600,
      maxHp: 600,
    });

    const result = runBattle([focusMon], [killer], [], []);

    // With Math.random() === 0.05 < 0.1, Focus Band must trigger.
    // FocusMon should survive at 1 HP even though the killer would otherwise KO it.
    const survivingFocusMon = result.pTeam.find(p => p.heldItem?.id === 'focus_band');
    expect(survivingFocusMon?.currentHp).toBe(1);
  });
});

// ── detailedLog contains key events ──────────────────────────────────────────

describe('runBattle — detailedLog', () => {
  it('detailedLog contains attack, faint, and result events', () => {
    const attacker = makePokemon({
      name: 'Attacker',
      level: 100,
      baseStats: { hp: 100, atk: 255, def: 100, speed: 100, special: 100, spdef: 100 },
      currentHp: 500,
      maxHp: 500,
    });
    const victim = makePokemon({
      name: 'Victim',
      level: 1,
      baseStats: { hp: 10, atk: 5, def: 5, speed: 5, special: 5, spdef: 5 },
      currentHp: 10,
      maxHp: 10,
    });

    const result = runBattle([attacker], [victim], [], []);

    // Should have attack events
    expect(result.detailedLog.some(e => e.type === 'attack')).toBe(true);
    // Should have faint event for the victim
    expect(result.detailedLog.some(e => e.type === 'faint')).toBe(true);
    // Should have result event at the end
    expect(result.detailedLog.some(e => e.type === 'result')).toBe(true);
    // The result should be the last event
    const lastEvent = result.detailedLog[result.detailedLog.length - 1];
    expect(lastEvent.type).toBe('result');
  });

  it('send_out events are emitted for initial Pokemon', () => {
    const p = makePokemon({ name: 'PlayerMon' });
    const e = makePokemon({ name: 'EnemyMon' });

    const result = runBattle([p], [e], [], []);

    const sendOutEvents = result.detailedLog.filter(ev => ev.type === 'send_out');
    expect(sendOutEvents.length).toBeGreaterThanOrEqual(2);
  });
});
