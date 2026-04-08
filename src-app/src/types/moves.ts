import type { PokemonType } from './pokemon';

/**
 * A single move entry as used by the battle engine.
 *
 * `isSpecial`  — derived at runtime from the attacker's baseStats
 *                (special >= atk → isSpecial).
 * `isNoDamage` — true for moves like Splash and Teleport that deal 0 damage
 *                and have no effect (stored as `noDamage` in the JS source).
 * `typeless`   — true for Struggle, which ignores type effectiveness.
 * `desc`       — flavour text from MOVE_POOL; omitted on runtime-computed moves.
 */
export interface Move {
  name: string;
  type: PokemonType;
  power: number;
  isSpecial: boolean;
  isNoDamage?: boolean;
  typeless?: boolean;
  desc?: string;
}

/**
 * One tier slot inside a type's move pool.
 * Index 0 = tier 0 (weak), 1 = tier 1 (standard), 2 = tier 2 (powerful).
 */
export interface MoveTierEntry {
  name: string;
  power: number;
  desc: string;
}

/**
 * The physical/special split for a single type's move pool.
 * Each array has exactly 3 entries (tier 0, 1, 2).
 */
export interface TypeMovePool {
  physical: [MoveTierEntry, MoveTierEntry, MoveTierEntry];
  special: [MoveTierEntry, MoveTierEntry, MoveTierEntry];
}

/**
 * The full MOVE_POOL constant — keyed by PokemonType.
 * Every type present in the TYPE_CHART has an entry here.
 */
export type MovePool = Record<PokemonType, TypeMovePool>;
