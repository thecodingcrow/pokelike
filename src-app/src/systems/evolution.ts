/**
 * Evolution system — ported from game.js / data.js.
 *
 * `checkAndEvolveTeam` scans a team for pending evolutions and returns a list
 * of results so the caller can display evolution animations before mutating
 * the store.
 *
 * `applyEvolution` fetches the new species from PokeAPI (or the cache) and
 * builds a fresh PokemonInstance that preserves the Pokemon's HP ratio,
 * held item, nickname, and shiny status.
 */

import type { PokemonInstance, PokemonSpecies } from '@/types/pokemon';
import { GEN1_EVOLUTIONS } from '@/data/evolutions';
import type { EvolutionEntry } from '@/data/evolutions';
import { fetchPokemonById } from './pokeapi';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EvolutionResult {
  /** The new evolved PokemonInstance (ready to replace the old one). */
  evolved: PokemonInstance;
  /** Display name of the pre-evolution (e.g. "Charmander"). */
  from: string;
  /** Display name of the post-evolution (e.g. "Charmeleon"). */
  to: string;
  /** Index of this Pokemon within the original team array. */
  teamIndex: number;
}

// ── HP formula (must match pokeapi.ts) ───────────────────────────────────────

function calcHp(baseHp: number, level: number): number {
  return Math.floor((baseHp * level) / 50) + level + 10;
}

// ── applyEvolution ────────────────────────────────────────────────────────────

/**
 * Fetch the evolved species and build a new PokemonInstance.
 *
 * HP is scaled by the same ratio as before evolution so the Pokemon does not
 * suddenly appear at full health (or at 0 HP) mid-battle.
 *
 * Returns null when the PokeAPI fetch fails.
 */
export async function applyEvolution(
  pokemon: PokemonInstance,
  evoEntry: EvolutionEntry
): Promise<PokemonInstance | null> {
  const newSpecies: PokemonSpecies | null = await fetchPokemonById(evoEntry.into);
  if (!newSpecies) return null;

  const hpRatio =
    pokemon.maxHp > 0 ? pokemon.currentHp / pokemon.maxHp : 1;

  const newMaxHp = calcHp(newSpecies.baseStats.hp, pokemon.level);
  const newCurrentHp = Math.max(1, Math.round(newMaxHp * hpRatio));

  return {
    // Identity fields carried forward
    speciesId: newSpecies.id,
    name: newSpecies.name,
    nickname: pokemon.nickname,
    level: pokemon.level,
    isShiny: pokemon.isShiny,
    // Recalculated stats
    currentHp: newCurrentHp,
    maxHp: newMaxHp,
    types: newSpecies.types,
    baseStats: newSpecies.baseStats,
    // Sprite: keep shiny if applicable
    spriteUrl: pokemon.isShiny
      ? newSpecies.shinySpriteUrl
      : newSpecies.spriteUrl,
    // Preserved equipment / meta
    megaStone: null,
    heldItem: pokemon.heldItem,
    moveTier: pokemon.moveTier,
  };
}

// ── checkAndEvolveTeam ────────────────────────────────────────────────────────

/**
 * Scan `team` for any Pokemon that have reached their evolution level and
 * return a list of EvolutionResults with the evolved instances already fetched.
 *
 * Eevee (speciesId 133) is deliberately excluded here — its branching
 * evolution is handled interactively via the `eevee-choice` modal.
 *
 * The caller is responsible for:
 *   1. Showing evolution animations (one per result).
 *   2. Replacing each team member with `result.evolved`.
 */
export async function checkAndEvolveTeam(
  team: PokemonInstance[]
): Promise<EvolutionResult[]> {
  const results: EvolutionResult[] = [];

  for (let i = 0; i < team.length; i++) {
    const pokemon = team[i];

    // Skip Eevee — handled separately via choice modal
    if (pokemon.speciesId === 133) continue;

    const evoEntry = GEN1_EVOLUTIONS[pokemon.speciesId];
    if (!evoEntry) continue;
    if (pokemon.level < evoEntry.level) continue;

    const evolved = await applyEvolution(pokemon, evoEntry);
    if (!evolved) continue;

    results.push({
      evolved,
      from: pokemon.name,
      to: evolved.name,
      teamIndex: i,
    });
  }

  return results;
}
