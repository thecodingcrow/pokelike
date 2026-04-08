/**
 * encounters.ts — Pure functions for generating encounter data.
 *
 * All functions are deterministic given a mapIndex, except where
 * Math.random() is used for shuffling — which is expected for gameplay variety.
 */

import { MAP_BST_RANGES, MAP_LEVEL_RANGES, GEN1_BST_APPROX } from '@/data/constants';
import { ITEM_POOL, USABLE_ITEM_POOL } from '@/data/items';
import type { Item as DataItem } from '@/data/items';
import { createInstanceById } from '@/systems/pokeapi';
import type { PokemonInstance, Item, NodeType, ItemId } from '@/types';

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Pick `count` random Pokémon IDs from the BST bucket(s) appropriate for
 * the given mapIndex. Flattens all matching bucket IDs and deduplicates before
 * sampling.
 */
export function getRandomIdsForMap(mapIndex: number, count: number): number[] {
  const range = MAP_BST_RANGES[mapIndex] ?? MAP_BST_RANGES[0];

  // GEN1_BST_APPROX groups IDs into named buckets (low/midLow/mid/…).
  // We collect every ID that falls in any bucket whose position in the sorted
  // bucket list overlaps with the range. Since each bucket is a flat array
  // there is no per-ID BST value here — instead we use the bucket order as a
  // proxy: low ≈ 200-310, midLow ≈ 280-360, mid ≈ 340-420, midHigh ≈ 400-480,
  // high ≈ 460-530, veryHigh ≈ 530+. We select the buckets whose canonical
  // midpoint falls within [range.min, range.max].

  const BUCKET_MIDPOINTS: Record<string, number> = {
    low:      255,
    midLow:   320,
    mid:      380,
    midHigh:  440,
    high:     495,
    veryHigh: 565,
  };

  const eligible = new Set<number>();

  for (const [bucket, ids] of Object.entries(GEN1_BST_APPROX)) {
    const midpoint = BUCKET_MIDPOINTS[bucket] ?? 400;
    if (midpoint >= range.min && midpoint <= range.max) {
      for (const id of ids) eligible.add(id);
    }
  }

  // If nothing matched (edge case for very tight ranges), fall back to 'mid'
  if (eligible.size === 0) {
    for (const id of GEN1_BST_APPROX['mid'] ?? []) eligible.add(id);
  }

  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Return a random level within the level range for a given map.
 */
export function getRandomLevel(mapIndex: number): number {
  const range = MAP_LEVEL_RANGES[mapIndex] ?? MAP_LEVEL_RANGES[0];
  const [min, max] = range;
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate 3 Pokémon choices for a catch node.
 * Returns however many are successfully fetched (may be < 3 if PokeAPI fails).
 */
export async function generateCatchChoices(mapIndex: number): Promise<PokemonInstance[]> {
  const ids = getRandomIdsForMap(mapIndex, 3);
  const level = getRandomLevel(mapIndex);
  const instances = await Promise.all(ids.map((id) => createInstanceById(id, level, false, 0)));
  return instances.filter((p): p is PokemonInstance => p !== null);
}

/**
 * Generate 2 item choices for an item node.
 *
 * Rules:
 *  - `minMap` is respected (items unavailable before that map are excluded).
 *  - Held items (`isUsable === false`) cannot appear if the player already holds one.
 *  - Usable items can stack, so they are always eligible.
 */
/** Map a raw data Item to the canonical @/types Item shape. */
function toTypedItem(dataItem: DataItem, isUsable: boolean): Item {
  return {
    id: dataItem.id as ItemId,
    name: dataItem.name,
    desc: dataItem.desc,
    icon: dataItem.icon,
    isUsable,
    minMap: dataItem.minMap,
  };
}

export function generateItemChoices(mapIndex: number, existingItems: Item[]): Item[] {
  const heldPool = ITEM_POOL.map((item) => toTypedItem(item, false));
  const usablePool = USABLE_ITEM_POOL.map((item) => toTypedItem(item, true));
  const allItems = [...heldPool, ...usablePool];

  const eligible = allItems.filter((item) => {
    // Respect minimum map restriction
    if (item.minMap !== undefined && mapIndex < item.minMap) return false;
    // Held items: exclude if player already has one with this id
    if (!item.isUsable && existingItems.some((e) => e.id === item.id)) return false;
    return true;
  });

  const shuffled = eligible.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

/**
 * Generate a trade offer Pokémon that is slightly stronger than the given level.
 * Returns null if no eligible IDs are available or PokeAPI fetch fails.
 */
export async function generateTradeOffer(
  mapIndex: number,
  givenLevel: number,
): Promise<PokemonInstance | null> {
  const ids = getRandomIdsForMap(mapIndex, 1);
  if (ids.length === 0) return null;
  return createInstanceById(ids[0], givenLevel + 3, false, 1);
}

/**
 * Generate a random shiny Pokémon encounter for the given map.
 * Returns null if no eligible IDs are available or PokeAPI fetch fails.
 */
export async function generateShinyPokemon(mapIndex: number): Promise<PokemonInstance | null> {
  const ids = getRandomIdsForMap(mapIndex, 1);
  if (ids.length === 0) return null;
  const level = getRandomLevel(mapIndex);
  const instance = await createInstanceById(ids[0], level, false, 0);
  if (!instance) return null;
  return {
    ...instance,
    isShiny: true,
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${instance.speciesId}.png`,
  };
}

/**
 * Generate the enemy team for a battle node.
 *
 * Wild:    1 Pokémon at moveTier 0.
 * Trainer: scales by map — 1 for maps 0-1, 2 for 2-3, 3+ for 4+, all at moveTier 1.
 */
export async function generateEnemyTeam(
  mapIndex: number,
  nodeType: NodeType,
  _trainerKey?: string,
): Promise<PokemonInstance[]> {
  let teamSize = 1;
  const moveTier: 0 | 1 = nodeType === 'trainer' ? 1 : 0;

  if (nodeType === 'trainer') {
    if (mapIndex >= 4) teamSize = 3;
    else if (mapIndex >= 2) teamSize = 2;
  }

  const ids = getRandomIdsForMap(mapIndex, teamSize);
  const level = getRandomLevel(mapIndex);
  const instances = await Promise.all(ids.map((id) => createInstanceById(id, level, false, moveTier)));
  return instances.filter((p): p is PokemonInstance => p !== null);
}
