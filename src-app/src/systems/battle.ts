/**
 * battle.ts — Barrel re-export for the battle subsystem.
 *
 * Import from here for backwards compatibility. Implementation lives in:
 *   - battle-calc.ts    (damage, stat, and move calculations)
 *   - battle-levels.ts  (XP / level-gain logic)
 *   - battle-engine.ts  (main battle loop)
 */

export { calcHp, getEffectiveStat, calcDamage, getMove } from './battle-calc';
export { applyLevelGain } from './battle-levels';
export { runBattle } from './battle-engine';
