/**
 * All 18 Pokemon types used in the game.
 * Fairy is absent — this game uses Gen 1 data which has 17 types
 * (Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground,
 *  Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel).
 */
export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Electric'
  | 'Grass'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel';

/**
 * Base stats as fetched from PokeAPI and stored in the species cache.
 * `special` maps to special-attack; `spdef` maps to special-defense.
 * Hardcoded Gen 1 trainer teams may omit `spdef` (falls back to `special`).
 */
export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  speed: number;
  special: number;
  spdef: number;
}

/**
 * Static species data — fetched from PokeAPI and cached in localStorage.
 * Corresponds to the object constructed inside `fetchPokemonById`.
 */
export interface PokemonSpecies {
  id: number;
  name: string;
  types: PokemonType[];
  baseStats: BaseStats;
  bst: number;
  spriteUrl: string;
  shinySpriteUrl: string;
}

/**
 * A live Pokemon instance in the player's or an enemy's team.
 * Created by `createInstance` in data.js.
 *
 * `moveTier` controls which tier of move the Pokemon uses in battle:
 *   0 = weak early moves, 1 = standard moves, 2 = powerful moves.
 *
 * `nickname` is null when the player has not renamed the Pokemon.
 * `megaStone` is always null in the current game (field reserved).
 * `heldItem` is null unless the Pokemon holds an item (trainers/gym leaders).
 */
export interface PokemonInstance {
  speciesId: number;
  name: string;
  nickname: string | null;
  level: number;
  currentHp: number;
  maxHp: number;
  isShiny: boolean;
  types: PokemonType[];
  baseStats: BaseStats;
  spriteUrl: string;
  megaStone: null;
  heldItem: HeldItem | null;
  moveTier: 0 | 1 | 2;
  /** Ditto transform flag — set to true after transforming in battle */
  _transformed?: boolean;
}

/**
 * A held item as it appears on a PokemonInstance.
 * This is a minimal inline object (id + name + icon) rather than a full Item.
 */
export interface HeldItem {
  id: string;
  name: string;
  icon: string;
}

/**
 * A single entry in the GEN1_EVOLUTIONS map.
 * `into` is the target species ID, `level` is the required level.
 */
export interface EvolutionEntry {
  into: number;
  level: number;
  name: string;
}

/**
 * An Eevee branching evolution option (includes target types).
 */
export interface EeveeEvolutionEntry extends EvolutionEntry {
  types: PokemonType[];
}

/**
 * A Pokémon on a trainer's team (gym leader or Elite Four member).
 * Used in gymLeaders.ts and elite4.ts.
 * Note: `baseStats` intentionally omits `spdef` — the fallback builder derives it from `special`.
 */
export interface TrainerPokemon {
  speciesId: number;
  name: string;
  types: PokemonType[];
  baseStats: { hp: number; atk: number; def: number; speed: number; special: number };
  level: number;
  heldItem?: HeldItem;
}
