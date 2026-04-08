import type { PokemonInstance } from './pokemon';

/**
 * All item IDs from ITEM_POOL and USABLE_ITEM_POOL in data.js.
 */
export type ItemId =
  // Bag / held items (ITEM_POOL)
  | 'lucky_egg'
  | 'life_orb'
  | 'choice_band'
  | 'choice_specs'
  | 'muscle_band'
  | 'wise_glasses'
  | 'metronome'
  | 'scope_lens'
  | 'rocky_helmet'
  | 'shell_bell'
  | 'eviolite'
  | 'sharp_beak'
  | 'charcoal'
  | 'mystic_water'
  | 'magnet'
  | 'miracle_seed'
  | 'twisted_spoon'
  | 'black_belt'
  | 'soft_sand'
  | 'silver_powder'
  | 'hard_stone'
  | 'dragon_fang'
  | 'poison_barb'
  | 'spell_tag'
  | 'silk_scarf'
  | 'assault_vest'
  | 'choice_scarf'
  | 'leftovers'
  | 'expert_belt'
  | 'focus_band'
  | 'razor_claw'
  | 'air_balloon'
  // Usable items (USABLE_ITEM_POOL)
  | 'max_revive'
  | 'rare_candy'
  | 'moon_stone';

/**
 * A full item definition as stored in ITEM_POOL or USABLE_ITEM_POOL.
 *
 * `isUsable` — true for consumable items (max_revive, rare_candy, moon_stone).
 * `minMap`   — optional minimum map index at which this item can appear.
 */
export interface Item {
  id: ItemId;
  name: string;
  desc: string;
  icon: string;
  isUsable: boolean;
  minMap?: number;
}

/**
 * Signature for held-item effect functions.
 * These are computed inline inside battle.js (getEffectiveStat, calcDamage)
 * rather than stored as functions on the item objects, but this type is
 * useful when wiring up a future functional item system.
 *
 * @param holder    The Pokemon carrying the item.
 * @param context   An arbitrary payload for the effect (damage, stat value, etc.).
 * @returns         The modified context value.
 */
export type HeldItemEffect = (holder: PokemonInstance, context: number) => number;
