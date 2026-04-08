import type { PokemonInstance, PokemonType, HeldItem } from '@/types';

export function makePokemon(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    speciesId: 1, name: 'TestMon', nickname: null, level: 50,
    currentHp: 200, maxHp: 200, isShiny: false,
    types: ['Normal'] as PokemonType[],
    baseStats: { hp: 100, atk: 100, def: 100, speed: 100, special: 100, spdef: 100 },
    spriteUrl: '', megaStone: null, heldItem: null, moveTier: 1 as 0 | 1 | 2,
    ...overrides,
  };
}

export function makeItem(id: string, name?: string): HeldItem {
  return { id, name: name ?? id, icon: '' } as HeldItem;
}
