/**
 * battle-calc.ts — Pure damage and stat calculation functions.
 *
 * Extracted from battle.ts. No side effects, no DOM, no global state.
 */

import type {
  PokemonType,
  PokemonInstance,
  HeldItem,
  Move,
} from '@/types';
import { TYPE_CHART, MOVE_POOL, TYPE_ITEM_MAP } from '@/data';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Returns true if the item list contains an item with the given id. */
function hasItem(items: HeldItem[], id: string): boolean {
  return items.some(it => it.id === id);
}

/** Returns true if the type-boosting item for `moveType` is present. */
function getTypeBoostItem(moveType: string, items: HeldItem[]): boolean {
  const cap = moveType.charAt(0).toUpperCase() + moveType.slice(1).toLowerCase();
  const needed = TYPE_ITEM_MAP[cap];
  if (!needed) return false;
  return items.some(it => it.id === needed);
}

/** Computes the combined type-effectiveness multiplier for a move vs. defender. */
export function getTypeEffectiveness(attackType: string, defenderTypes: string[]): number {
  let mult = 1;
  for (const dt of defenderTypes) {
    const cap  = dt.charAt(0).toUpperCase() + dt.slice(1).toLowerCase();
    const atCap = attackType.charAt(0).toUpperCase() + attackType.slice(1).toLowerCase();
    if (TYPE_CHART[atCap] && TYPE_CHART[atCap][cap] !== undefined) {
      mult *= TYPE_CHART[atCap][cap];
    }
  }
  return mult;
}

// ── Exported functions ────────────────────────────────────────────────────────

/** Computes the standard HP for a given base-HP stat and level. */
export function calcHp(baseHp: number, level: number): number {
  return Math.floor(baseHp * level / 50) + level + 10;
}

/**
 * Scales a base stat by the Pokemon's level and applies held-item modifiers.
 *
 * `attackerTeam` is required to correctly evaluate team-wide items
 * (Muscle Band, Wise Glasses) — pass the full player team when computing
 * player stats, or an empty array for enemy stats.
 */
export function getEffectiveStat(
  pokemon: PokemonInstance,
  statName: 'atk' | 'def' | 'special' | 'spdef' | 'speed',
  items: HeldItem[],
  attackerTeam: PokemonInstance[] = [],
): number {
  // spdef falls back to special for Gen 1 hardcoded teams that don't have it
  const rawStat = statName === 'spdef'
    ? (pokemon.baseStats.spdef ?? pokemon.baseStats.special ?? 50)
    : (pokemon.baseStats[statName] ?? 50);
  let val = rawStat || 50;
  val = Math.floor(val * pokemon.level / 50) + 5;

  const allPhysical = attackerTeam.length > 0 &&
    attackerTeam.every(p => (p.baseStats.atk || 0) > (p.baseStats.special || 0));
  const allSpecial  = attackerTeam.length > 0 &&
    attackerTeam.every(p => (p.baseStats.special || 0) >= (p.baseStats.atk || 0));

  if (statName === 'atk') {
    if (hasItem(items, 'muscle_band') && allPhysical) val = Math.floor(val * 1.5);
  }
  if (statName === 'def') {
    if (hasItem(items, 'eviolite'))                        val = Math.floor(val * 1.5);
    if (hasItem(items, 'muscle_band') && allPhysical)     val = Math.floor(val * 1.5);
    if (hasItem(items, 'choice_band'))                     val = Math.floor(val * 0.8);
  }
  if (statName === 'special') {
    if (hasItem(items, 'wise_glasses') && allSpecial)      val = Math.floor(val * 1.5);
  }
  if (statName === 'spdef') {
    if (hasItem(items, 'eviolite'))                        val = Math.floor(val * 1.5);
    if (hasItem(items, 'assault_vest'))                    val = Math.floor(val * 1.5);
    if (hasItem(items, 'wise_glasses') && allSpecial)      val = Math.floor(val * 1.5);
    if (hasItem(items, 'choice_specs'))                    val = Math.floor(val * 0.8);
  }
  if (statName === 'speed') {
    if (hasItem(items, 'choice_scarf')) val = Math.floor(val * 1.5);
  }

  return Math.max(1, val);
}

/**
 * Calculates damage dealt by `attacker` using `move` against `defender`.
 *
 * Formula: floor((2*level/5+2) * power * atk/def/50 + 2)
 * with STAB, type effectiveness, crit, and item modifiers applied.
 *
 * `attackerTeam` is forwarded to `getEffectiveStat` for Muscle Band /
 * Wise Glasses team-wide checks. Pass the full player team when the attacker
 * is the player; pass [] for enemy attackers.
 */
export function calcDamage(
  attacker: PokemonInstance,
  defender: PokemonInstance,
  move: Move,
  attackerItems: HeldItem[],
  defItems: HeldItem[] = [],
  attackerTeam: PokemonInstance[] = [],
): { damage: number; typeEff: number; moveType: string; crit: boolean } {
  const lvl       = attacker.level;
  const isSpecial = move.isSpecial;
  const atk       = getEffectiveStat(attacker, isSpecial ? 'special' : 'atk', attackerItems, attackerTeam);
  const def       = getEffectiveStat(defender, isSpecial ? 'spdef'   : 'def', defItems);
  const power     = move.power || 40;
  const moveType  = move.type || 'Normal';

  let damage = Math.floor(((2 * lvl / 5 + 2) * power * atk / def / 50 + 2));

  const typeEff = move.typeless ? 1 : getTypeEffectiveness(moveType, defender.types ?? ['Normal']);
  damage = Math.floor(damage * typeEff);

  // STAB
  if (attacker.types?.some(t => t.toLowerCase() === moveType.toLowerCase())) {
    damage = Math.floor(damage * 1.5);
  }

  // Type-boosting held item
  if (getTypeBoostItem(moveType, attackerItems)) damage = Math.floor(damage * 1.5);

  if (hasItem(attackerItems, 'life_orb'))   damage = Math.floor(damage * 1.3);

  if (isSpecial) {
    if (hasItem(attackerItems, 'choice_specs')) damage = Math.floor(damage * 1.4);
  } else {
    if (hasItem(attackerItems, 'choice_band'))  damage = Math.floor(damage * 1.4);
  }

  // Metronome: +50% if every Pokemon on the team shares a type with the attacker
  if (hasItem(attackerItems, 'metronome') && attackerTeam.length > 0) {
    const sharedType = (attacker.types ?? []).find(t =>
      attackerTeam.every(p => (p.types ?? []).some(pt => pt.toLowerCase() === t.toLowerCase()))
    );
    if (sharedType) damage = Math.floor(damage * 1.5);
  }

  if (hasItem(attackerItems, 'expert_belt') && typeEff >= 2) damage = Math.floor(damage * 1.2);

  // Air Balloon: Ground moves have no effect on the holder
  const airBalloonBlocked = hasItem(defItems, 'air_balloon') && moveType.toLowerCase() === 'ground';

  // Crit: 6.25% base, 20% with scope_lens or razor_claw
  let critChance = 0.0625;
  if (hasItem(attackerItems, 'scope_lens')) critChance = 0.20;
  if (hasItem(attackerItems, 'razor_claw')) critChance = 0.20;
  const crit = Math.random() < critChance;
  if (crit) damage = Math.floor(damage * 1.5);

  const rng = 0.85 + Math.random() * 0.15;
  damage = (typeEff === 0 || airBalloonBlocked) ? 0 : Math.max(1, Math.floor(damage * rng));

  return { damage, typeEff, moveType, crit };
}

/**
 * Returns the best move for `pokemon` given its types, baseStats, and moveTier.
 *
 * Special-case species:
 *   - Magikarp (129): always returns Splash (noDamage)
 *   - Abra (63): always returns Teleport (noDamage)
 *
 * For multi-typed Pokemon the Normal type is skipped in favour of any
 * more specific typing (e.g. Normal/Flying → Flying move).
 */
export function getMove(pokemon: PokemonInstance): Move {
  const { speciesId, types, baseStats, moveTier = 1 } = pokemon;

  if (speciesId === 129) {
    return { name: 'Splash',   power: 0, type: 'Normal', isSpecial: false, isNoDamage: true };
  }
  if (speciesId === 63) {
    return { name: 'Teleport', power: 0, type: 'Normal', isSpecial: false, isNoDamage: true };
  }

  const isSpecial = (baseStats.special || 0) >= (baseStats.atk || 0);
  const tier = Math.max(0, Math.min(2, moveTier)) as 0 | 1 | 2;

  for (const t of types) {
    // Skip Normal if the Pokemon also has a more specific type
    if (t.toLowerCase() === 'normal' && types.length > 1) continue;
    const cap = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    const pool = MOVE_POOL[cap as keyof typeof MOVE_POOL];
    if (pool) {
      const entry = isSpecial ? pool.special[tier] : pool.physical[tier];
      return { ...entry, type: cap as PokemonType, isSpecial };
    }
  }

  return { name: 'Tackle', power: 40, type: 'Normal', isSpecial: false };
}
