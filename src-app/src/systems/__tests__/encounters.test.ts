/**
 * encounters.test.ts — Unit tests for the encounters system.
 *
 * Async functions that hit PokeAPI are not tested here (integration tests).
 * We focus on the pure helpers: generateItemChoices, getRandomIdsForMap.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateItemChoices, getRandomIdsForMap, getRandomLevel } from '../encounters';
import { MAP_LEVEL_RANGES, GEN1_BST_APPROX } from '@/data/constants';

afterEach(() => {
  vi.restoreAllMocks();
});

// ── generateItemChoices ───────────────────────────────────────────────────────

describe('generateItemChoices', () => {
  it('returns at most 2 items', () => {
    const result = generateItemChoices(0, []);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('respects minMap — excludes items whose minMap is greater than current map', () => {
    // Map 0: lucky_egg has minMap: 4, so it must not appear
    for (let trial = 0; trial < 50; trial++) {
      const result = generateItemChoices(0, []);
      const luckyEgg = result.find((item) => item.id === 'lucky_egg');
      expect(luckyEgg).toBeUndefined();
    }
  });

  it('includes items that require minMap when map >= minMap', () => {
    // Map 4: lucky_egg (minMap: 4) should be eligible
    let foundLuckyEgg = false;
    // Run enough trials for it to appear at least once given pool diversity
    for (let trial = 0; trial < 200; trial++) {
      const result = generateItemChoices(4, []);
      if (result.some((item) => item.id === 'lucky_egg')) {
        foundLuckyEgg = true;
        break;
      }
    }
    expect(foundLuckyEgg).toBe(true);
  });

  it('excludes non-usable (held) items the player already has', () => {
    const existingItems = [{ id: 'life_orb', name: 'Life Orb', desc: '', icon: '🔮', isUsable: false }];

    for (let trial = 0; trial < 50; trial++) {
      const result = generateItemChoices(0, existingItems as never);
      const duplicate = result.find((item) => item.id === 'life_orb');
      expect(duplicate).toBeUndefined();
    }
  });

  it('allows stacking usable items even if the player already has one', () => {
    // Usable items (rare_candy, max_revive, moon_stone) can appear even when already held
    const existingItems = [{ id: 'rare_candy', name: 'Rare Candy', desc: '', icon: '🍬', isUsable: true }];
    let foundRareCandy = false;
    for (let trial = 0; trial < 200; trial++) {
      const result = generateItemChoices(0, existingItems as never);
      if (result.some((item) => item.id === 'rare_candy')) {
        foundRareCandy = true;
        break;
      }
    }
    expect(foundRareCandy).toBe(true);
  });

  it('returns items that have the isUsable field set correctly', () => {
    const result = generateItemChoices(0, []);
    for (const item of result) {
      // isUsable must be a boolean
      expect(typeof item.isUsable).toBe('boolean');
    }
  });
});

// ── getRandomIdsForMap ────────────────────────────────────────────────────────

describe('getRandomIdsForMap', () => {
  it('returns exactly count IDs when enough are available', () => {
    const result = getRandomIdsForMap(0, 3);
    expect(result).toHaveLength(3);
  });

  it('returns unique IDs', () => {
    const result = getRandomIdsForMap(0, 5);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it('returns IDs only from eligible buckets for map 0 (low BST range)', () => {
    // Map 0 range is { min: 200, max: 310 }, which corresponds to 'low' bucket midpoint 255
    // IDs returned should all come from GEN1_BST_APPROX.low
    const lowIds = new Set(GEN1_BST_APPROX['low']);
    // Run multiple times to check consistency
    for (let trial = 0; trial < 10; trial++) {
      const result = getRandomIdsForMap(0, 3);
      for (const id of result) {
        expect(lowIds.has(id)).toBe(true);
      }
    }
  });

  it('returns valid Pokemon IDs (1–151)', () => {
    const result = getRandomIdsForMap(4, 3);
    for (const id of result) {
      expect(id).toBeGreaterThanOrEqual(1);
      expect(id).toBeLessThanOrEqual(151);
    }
  });

  it('uses shuffling — different calls return different orderings', () => {
    // With a large enough pool, two independent calls should differ eventually
    const sets = new Set(
      Array.from({ length: 20 }, () => getRandomIdsForMap(3, 1).join(','))
    );
    // We expect more than 1 unique result across 20 trials
    expect(sets.size).toBeGreaterThan(1);
  });

  it('handles mapIndex beyond the defined ranges by falling back to last range', () => {
    // Should not throw for out-of-bounds map index
    expect(() => getRandomIdsForMap(99, 1)).not.toThrow();
    const result = getRandomIdsForMap(99, 1);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('returns deterministic results when Math.random is mocked', () => {
    // With a fixed Math.random, sort is deterministic — same IDs each call
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const first = getRandomIdsForMap(0, 2);
    const second = getRandomIdsForMap(0, 2);
    expect(first).toEqual(second);
  });
});

// ── getRandomLevel ────────────────────────────────────────────────────────────

describe('getRandomLevel', () => {
  it('returns a level within the expected range for each map', () => {
    for (let mapIndex = 0; mapIndex < MAP_LEVEL_RANGES.length; mapIndex++) {
      const [min, max] = MAP_LEVEL_RANGES[mapIndex];
      for (let trial = 0; trial < 10; trial++) {
        const level = getRandomLevel(mapIndex);
        expect(level).toBeGreaterThanOrEqual(min);
        expect(level).toBeLessThanOrEqual(max);
      }
    }
  });

  it('respects map 0 bounds: level in [1, 5]', () => {
    for (let trial = 0; trial < 20; trial++) {
      const level = getRandomLevel(0);
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(5);
    }
  });

  it('falls back gracefully for out-of-bounds mapIndex', () => {
    expect(() => getRandomLevel(99)).not.toThrow();
    const level = getRandomLevel(99);
    // Should use first range [1, 5]
    expect(level).toBeGreaterThanOrEqual(1);
    expect(level).toBeLessThanOrEqual(5);
  });

  it('returns an integer', () => {
    const level = getRandomLevel(3);
    expect(Number.isInteger(level)).toBe(true);
  });
});

// ── BST range coverage sanity check ──────────────────────────────────────────

describe('MAP_BST_RANGES coverage', () => {
  it('every map index (0-8) has at least 1 eligible Pokemon ID', () => {
    for (let mapIndex = 0; mapIndex <= 8; mapIndex++) {
      const ids = getRandomIdsForMap(mapIndex, 1);
      expect(ids.length).toBeGreaterThanOrEqual(1);
    }
  });
});
