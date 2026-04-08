import type { PokemonInstance, PokemonType } from './pokemon';

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

/**
 * The top-level runtime game state (mirrors the `state` object in game.js).
 *
 * `currentMap`     — which arena the player is on (0–8).
 * `currentNode`    — id of the node currently being played, or null.
 * `team`           — the player's active team (1–6 Pokemon).
 * `items`          — the player's bag items.
 * `badges`         — number of gym badges earned.
 * `map`            — the currently generated arena map, or null.
 * `eliteIndex`     — which Elite Four opponent is up next (0–4).
 * `trainer`        — the player's chosen gender.
 * `starterSpeciesId` — the species id of the chosen starter.
 * `maxTeamSize`    — current team size cap (unlocked through progression).
 * `hardMode`       — whether Hard Mode is active for this run.
 */
export interface GameState {
  currentMap: number;
  currentNode: string | null;
  team: PokemonInstance[];
  items: import('./items').Item[];
  badges: number;
  map: import('./map').GeneratedMap | null;
  eliteIndex: number;
  trainer: TrainerGender;
  starterSpeciesId: number | null;
  maxTeamSize: number;
  hardMode: boolean;
}
