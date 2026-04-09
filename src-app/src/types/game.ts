import type { PokemonType } from './pokemon';

/**
 * The player's chosen trainer gender — maps to Red (boy) or Dawn (girl) sprites.
 */
export type TrainerGender = 'boy' | 'girl';

/**
 * Persistent per-run settings as stored in localStorage under 'poke_settings'.
 */
export interface GameSettings {
  /** Skip the level-up animation screen automatically. */
  autoSkipLevelUp: boolean;
  /** Skip the battle animation and jump straight to the result. */
  autoSkipBattles: boolean;
  /** Skip both animations and result screens entirely. */
  autoSkipAllBattles: boolean;
}

/**
 * A single Pokedex entry as stored in localStorage under 'poke_dex'.
 * `caught` is false if the species has only been seen (not caught).
 */
export interface PokedexEntry {
  id: number;
  name: string;
  types: PokemonType[];
  spriteUrl: string;
  caught: boolean;
}

/**
 * A single Shiny Dex entry as stored in localStorage under 'poke_shiny_dex'.
 */
export interface ShinyDexEntry {
  id: number;
  name: string;
  types: PokemonType[];
  shinySpriteUrl: string;
}

/**
 * A snapshot of a team member as persisted in the Hall of Fame entry.
 */
export interface HallOfFamePokemon {
  speciesId: number;
  name: string;
  nickname: string | null;
  level: number;
  types: PokemonType[];
  spriteUrl: string;
  isShiny: boolean;
}

/**
 * A Hall of Fame run record as stored in localStorage under 'poke_hall_of_fame'.
 *
 * `runNumber` — the player's cumulative Elite Four win count at time of entry.
 * `hardMode`  — whether the run was completed on Hard Mode.
 * `date`      — locale date string (e.g. "4/8/2026").
 * `team`      — snapshot of the winning team.
 */
export interface HallOfFameEntry {
  runNumber: number;
  hardMode: boolean;
  date: string;
  team: HallOfFamePokemon[];
}

/**
 * An achievement definition from the ACHIEVEMENTS constant in data.js.
 * `unlocked` is computed at runtime against localStorage, not stored on the object.
 */
export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked?: boolean;
}

