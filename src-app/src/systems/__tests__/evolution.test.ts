/**
 * evolution.test.ts
 *
 * Tests for checkAndEvolveTeam. PokeAPI is mocked to avoid network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetchPokemonById BEFORE importing checkAndEvolveTeam
vi.mock('@/systems/pokeapi', () => ({
  fetchPokemonById: vi.fn().mockResolvedValue({
    id: 5, name: 'Charmeleon', types: ['Fire'],
    baseStats: { hp: 58, atk: 64, def: 58, speed: 80, special: 80, spdef: 65 },
    bst: 405, spriteUrl: 'charmeleon.png', shinySpriteUrl: 'charmeleon-shiny.png',
  }),
}));

import { checkAndEvolveTeam } from '@/systems/evolution';
import type { PokemonType } from '@/types';
import { makePokemon, makeItem } from './test-helpers';

describe('checkAndEvolveTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Charmander (id 4) at level 16 evolves to Charmeleon', async () => {
    const charmander = makePokemon({
      speciesId: 4,
      name: 'Charmander',
      level: 16,
      types: ['Fire'] as PokemonType[],
      currentHp: 100,
      maxHp: 100,
    });

    const results = await checkAndEvolveTeam([charmander]);

    expect(results).toHaveLength(1);
    expect(results[0].from).toBe('Charmander');
    expect(results[0].to).toBe('Charmeleon');
    expect(results[0].evolved.speciesId).toBe(5);
    expect(results[0].teamIndex).toBe(0);
  });

  it('does NOT evolve Charmander below threshold (level 15)', async () => {
    const charmander = makePokemon({
      speciesId: 4,
      name: 'Charmander',
      level: 15,
      types: ['Fire'] as PokemonType[],
      currentHp: 100,
      maxHp: 100,
    });

    const results = await checkAndEvolveTeam([charmander]);
    expect(results).toHaveLength(0);
  });

  it('skips Eevee (id 133) — handled by UI modal', async () => {
    const eevee = makePokemon({
      speciesId: 133,
      name: 'Eevee',
      level: 40, // Above any threshold
      types: ['Normal'] as PokemonType[],
      currentHp: 100,
      maxHp: 100,
    });

    const results = await checkAndEvolveTeam([eevee]);
    expect(results).toHaveLength(0);
  });

  it('preserves HP ratio after evolution (50% HP stays ~50%)', async () => {
    const charmander = makePokemon({
      speciesId: 4,
      name: 'Charmander',
      level: 16,
      types: ['Fire'] as PokemonType[],
      currentHp: 50,
      maxHp: 100,
    });

    const results = await checkAndEvolveTeam([charmander]);
    expect(results).toHaveLength(1);

    const evolved = results[0].evolved;
    const hpRatio = evolved.currentHp / evolved.maxHp;
    // Should be ~50% HP ratio (within rounding)
    expect(hpRatio).toBeCloseTo(0.5, 1);
  });

  it('preserves held item after evolution', async () => {
    const heldItem = makeItem('life_orb', 'Life Orb');
    const charmander = makePokemon({
      speciesId: 4,
      name: 'Charmander',
      level: 16,
      types: ['Fire'] as PokemonType[],
      currentHp: 100,
      maxHp: 100,
      heldItem,
    });

    const results = await checkAndEvolveTeam([charmander]);
    expect(results).toHaveLength(1);
    expect(results[0].evolved.heldItem?.id).toBe('life_orb');
  });

  it('preserves shiny status after evolution', async () => {
    // Mock to return shiny URL for shiny Charmander
    const { fetchPokemonById } = await import('@/systems/pokeapi');
    (fetchPokemonById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 5, name: 'Charmeleon', types: ['Fire'],
      baseStats: { hp: 58, atk: 64, def: 58, speed: 80, special: 80, spdef: 65 },
      bst: 405, spriteUrl: 'charmeleon.png', shinySpriteUrl: 'charmeleon-shiny.png',
    });

    const shinyCharmander = makePokemon({
      speciesId: 4,
      name: 'Charmander',
      level: 16,
      types: ['Fire'] as PokemonType[],
      currentHp: 100,
      maxHp: 100,
      isShiny: true,
    });

    const results = await checkAndEvolveTeam([shinyCharmander]);
    expect(results).toHaveLength(1);
    expect(results[0].evolved.isShiny).toBe(true);
    // Shiny should use shinySpriteUrl
    expect(results[0].evolved.spriteUrl).toBe('charmeleon-shiny.png');
  });

  it('handles a team where only some Pokemon evolve', async () => {
    const charmander = makePokemon({
      speciesId: 4,
      name: 'Charmander',
      level: 16,
      types: ['Fire'] as PokemonType[],
      currentHp: 100,
      maxHp: 100,
    });
    const youngCharmander = makePokemon({
      speciesId: 4,
      name: 'YoungCharmander',
      level: 10,
      types: ['Fire'] as PokemonType[],
      currentHp: 80,
      maxHp: 80,
    });

    const results = await checkAndEvolveTeam([charmander, youngCharmander]);
    // Only the first one should evolve
    expect(results).toHaveLength(1);
    expect(results[0].teamIndex).toBe(0);
  });
});
