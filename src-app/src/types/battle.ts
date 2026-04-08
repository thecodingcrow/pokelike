import type { PokemonInstance } from './pokemon';

/**
 * The top-level result returned by `runBattle` in battle.js.
 *
 * `playerWon`          — true if at least one player Pokemon survived.
 * `log`                — simple text log entries for display.
 * `detailedLog`        — structured per-event log used by the animation layer.
 * `pTeam`              — player team with mutated HP after the battle.
 * `eTeam`              — enemy team with mutated HP after the battle.
 * `playerParticipants` — set of player team indices that participated.
 */
export interface BattleResult {
  playerWon: boolean;
  log: BattleLogEntry[];
  detailedLog: DetailedLogEvent[];
  pTeam: PokemonInstance[];
  eTeam: PokemonInstance[];
  playerParticipants: Set<number>;
}

/**
 * A single text log entry as pushed into the `log` array by `addLog`.
 */
export interface BattleLogEntry {
  msg: string;
  /** CSS class applied to this entry (e.g. 'log-player', 'log-enemy', 'log-faint'). */
  cls: string;
}

// ---------------------------------------------------------------------------
// Detailed log events — each entry has a discriminated `type` field.
// ---------------------------------------------------------------------------

export interface DetailedLogEventAttack {
  type: 'attack';
  side: 'player' | 'enemy';
  attackerIdx: number;
  attackerName: string;
  targetSide: 'player' | 'enemy';
  targetIdx: number;
  targetName: string;
  moveName: string;
  moveType: string;
  damage: number;
  typeEff: number;
  crit: boolean;
  isSpecial: boolean;
  attackerHpAfter: number;
  targetHpAfter: number;
}

export interface DetailedLogEventEffect {
  type: 'effect';
  side: 'player' | 'enemy';
  idx: number;
  name: string;
  hpChange: number;
  hpAfter: number;
  reason: string;
}

export interface DetailedLogEventFaint {
  type: 'faint';
  side: 'player' | 'enemy';
  idx: number;
  name: string;
}

export interface DetailedLogEventSendOut {
  type: 'send_out';
  side: 'player' | 'enemy';
  idx: number;
  name: string;
}

export interface DetailedLogEventTransform {
  type: 'transform';
  side: 'player' | 'enemy';
  idx: number;
  name: string;
  intoName: string;
  spriteUrl: string;
  types: string[];
}

export interface DetailedLogEventResult {
  type: 'result';
  playerWon: boolean;
}

/**
 * Discriminated union of all possible detailed log event shapes.
 * Consumed by `animateBattleVisually` in ui.js.
 */
export type DetailedLogEvent =
  | DetailedLogEventAttack
  | DetailedLogEventEffect
  | DetailedLogEventFaint
  | DetailedLogEventSendOut
  | DetailedLogEventTransform
  | DetailedLogEventResult;

/**
 * Data payload for a canvas projectile / animation event.
 * Used as the argument to `playAttackAnimation` in ui.js.
 */
export interface AttackAnimEvent {
  moveType: string;
  moveName: string;
  isSpecial: boolean;
  /** DOM element for the attacking Pokemon's battle card. */
  attackerEl: HTMLElement;
  /** DOM element for the defending Pokemon's battle card. */
  targetEl: HTMLElement;
}

/**
 * A level-up event returned by `applyLevelGain` in battle.js.
 */
export interface LevelUpEvent {
  idx: number;
  pokemon: PokemonInstance;
  oldLevel: number;
  newLevel: number;
  /** The Pokemon's current HP at the moment the level-up is processed. */
  preHp: number;
}
