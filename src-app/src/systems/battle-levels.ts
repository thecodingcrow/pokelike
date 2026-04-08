/**
 * battle-levels.ts — Level-gain logic after battle.
 *
 * Extracted from battle.ts. Depends on calcHp from battle-calc.
 */

import type { PokemonInstance, HeldItem, LevelUpEvent } from '@/types';
import { calcHp } from './battle-calc';

/**
 * Applies level gains to all eligible team members and returns level-up events.
 *
 * Eligibility: a Pokemon must be alive (currentHp > 0) OR have participated
 * in the battle (index in `participantIdxs`).
 *
 * @param team            - The player's team (mutated in-place).
 * @param baseGain        - Base levels to gain per Pokemon.
 * @param participantIdxs - Set of team indices that participated in battle.
 * @param bagItems        - Bag items (checked for Lucky Egg when `isWild` = true).
 * @param isWild          - True for wild battles (Lucky Egg gives +1 extra level).
 * @param hardMode        - True for hard-mode battles (base gain forced to 1).
 */
export function applyLevelGain(
  team: PokemonInstance[],
  baseGain: number,
  participantIdxs: Set<number>,
  bagItems: HeldItem[],
  isWild = false,
  hardMode = false,
): LevelUpEvent[] {
  // bagItems is available for future bag-wide Lucky Egg checks; currently
  // Lucky Egg is only checked as a held item (isWild path).
  void bagItems;

  const effectiveBase = hardMode ? 1 : baseGain;
  const levelUps: LevelUpEvent[] = [];

  for (let i = 0; i < team.length; i++) {
    const p = team[i];
    const getsXp = p.currentHp > 0 || participantIdxs.has(i);
    if (!getsXp) continue;

    const luckyBonus = isWild && p.heldItem?.id === 'lucky_egg' ? 1 : 0;
    const gain       = effectiveBase + luckyBonus;
    const oldLevel   = p.level;
    const newLevel   = Math.min(100, oldLevel + gain);
    if (newLevel === oldLevel) continue; // already at level cap

    const preHp   = p.currentHp;
    p.level       = newLevel;
    const newMaxHp = calcHp(p.baseStats.hp, newLevel);
    if (p.currentHp > 0) {
      p.currentHp = Math.min(p.currentHp + (newMaxHp - p.maxHp), newMaxHp);
    }
    p.maxHp = newMaxHp;

    levelUps.push({ idx: i, pokemon: p, oldLevel, newLevel, preHp });
  }

  return levelUps;
}
