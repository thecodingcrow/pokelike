/**
 * PokeAPI cache layer — ported from data.js.
 *
 * All network responses are cached in localStorage using the same key format as
 * the original vanilla JS game (`pkrl_*`) to maintain save-compatibility.
 */

import type { PokemonSpecies, PokemonInstance, PokemonType } from '@/types/pokemon';
import { calcHp } from '@/systems/battle-calc';

// ── Cache key constants ───────────────────────────────────────────────────────

/** Prefix for per-species cache entries. Full key: `pkrl_poke_{id}`. */
const CACHE_KEY_POKEMON_PREFIX = 'pkrl_poke_';

// ── Raw localStorage helpers ──────────────────────────────────────────────────

function getCached<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function setCached(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full or unavailable */ }
}

// ── Single Pokemon species ────────────────────────────────────────────────────

/** Raw PokeAPI stat entry. */
interface RawStat {
  base_stat: number;
  stat: { name: string };
}

/** Raw PokeAPI type entry. */
interface RawType {
  type: { name: string };
}

/** Raw subset of PokeAPI /pokemon/{id} response we care about. */
interface RawPokemonResponse {
  id: number;
  name: string;
  stats: RawStat[];
  types: RawType[];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Fetch a single Pokemon species by numeric ID.
 * Cached in localStorage under `pkrl_poke_{id}`.
 *
 * Returns null when the network is unavailable and no cache exists.
 */
export async function fetchPokemonById(id: number): Promise<PokemonSpecies | null> {
  const key = `${CACHE_KEY_POKEMON_PREFIX}${id}`;
  const cached = getCached<PokemonSpecies>(key);
  // Accept cached entries only when both split-special fields are present
  if (
    cached &&
    cached.baseStats.spdef !== undefined &&
    (cached.baseStats as unknown as Record<string, unknown>)['special'] !== undefined
  ) {
    return cached;
  }

  try {
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const d = (await r.json()) as RawPokemonResponse;

    const findStat = (name: string): number =>
      d.stats.find((s) => s.stat.name === name)?.base_stat ?? 50;

    const baseStats = {
      hp:      d.stats.find((s) => s.stat.name === 'hp')?.base_stat ?? 45,
      atk:     findStat('attack'),
      def:     findStat('defense'),
      speed:   findStat('speed'),
      special: findStat('special-attack'),
      spdef:   findStat('special-defense'),
    };

    const bst = Object.values(baseStats).reduce((a, b) => a + b, 0);
    const types = d.types.map(
      (t) => capitalize(t.type.name) as PokemonType
    );

    const poke: PokemonSpecies = {
      id: d.id,
      name: capitalize(d.name),
      types,
      baseStats,
      bst,
      spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${d.id}.png`,
      shinySpriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${d.id}.png`,
    };

    setCached(key, poke);
    return poke;
  } catch (e) {
    console.warn(`Failed to fetch pokemon ${id}`, e);
    return null;
  }
}

// ── Instance factory ──────────────────────────────────────────────────────────

/**
 * Create a battle-ready PokemonInstance from a species, level, and optional
 * shiny flag. `moveTier` controls which tier of move is selected in battle
 * (0 = weak, 1 = standard, 2 = powerful).
 *
 * Equivalent to `createInstance()` in data.js.
 */
export function createInstance(
  species: PokemonSpecies,
  level: number,
  isShiny = false,
  moveTier: 0 | 1 | 2 = 1
): PokemonInstance {
  const lvl = level || 5;
  const maxHp = calcHp(species.baseStats.hp, lvl);
  const id = species.id;

  const spriteUrl = isShiny
    ? (species.shinySpriteUrl ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`)
    : (species.spriteUrl ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`);

  return {
    speciesId: id,
    name: species.name,
    nickname: null,
    level: lvl,
    currentHp: maxHp,
    maxHp,
    isShiny,
    types: species.types,
    baseStats: species.baseStats,
    spriteUrl,
    megaStone: null,
    heldItem: null,
    moveTier: Math.max(0, Math.min(2, moveTier ?? 1)) as 0 | 1 | 2,
  };
}

/**
 * Convenience wrapper that fetches species data and then calls `createInstance`.
 * Returns null if the species fetch fails.
 */
export async function createInstanceById(
  speciesId: number,
  level: number,
  isShiny = false,
  moveTier: 0 | 1 | 2 = 1
): Promise<PokemonInstance | null> {
  const species = await fetchPokemonById(speciesId);
  if (!species) return null;
  return createInstance(species, level, isShiny, moveTier);
}
