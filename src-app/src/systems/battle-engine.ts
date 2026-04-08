/**
 * battle-engine.ts — Pure auto-battle loop (no DOM, no global state).
 *
 * Ported from original/js/battle.js.
 *
 * The only global-state dependency in the original (`state.team`) has been
 * refactored: functions that need the player team accept it as an explicit
 * `attackerTeam` parameter.
 */

import type {
  PokemonInstance,
  HeldItem,
  BattleResult,
  BattleLogEntry,
  DetailedLogEvent,
  Move,
} from '@/types';
import { calcHp, getEffectiveStat, calcDamage, getMove, getTypeEffectiveness } from './battle-calc';

/**
 * Runs a full auto-battle between `playerTeam` and `enemyTeam`.
 *
 * Both teams fight through their rosters in order (first alive = active).
 * Returns a `BattleResult` with the mutated teams, full logs, and the set of
 * player-team indices that participated (for XP distribution).
 *
 * @param playerTeam  - Player's team (copied internally; originals not mutated).
 * @param enemyTeam   - Enemy team (HP initialised here if not already set).
 * @param bagItems    - Player's bag items (used only for Lucky Egg in level gain).
 * @param enemyItems  - Enemy bag items (currently unused in battle; reserved).
 * @param onLog       - Optional callback fired for each log line (e.g. for live UI).
 */
export function runBattle(
  playerTeam: PokemonInstance[],
  enemyTeam: PokemonInstance[],
  _bagItems: HeldItem[],
  _enemyItems: HeldItem[],
  onLog?: (msg: string, cls: string) => void,
): BattleResult {
  // Shallow-copy teams so we don't mutate the caller's state
  const pTeam: PokemonInstance[] = playerTeam.map(p => ({ ...p }));
  const eTeam: PokemonInstance[] = enemyTeam.map(p => ({
    ...p,
    currentHp: p.currentHp !== undefined ? p.currentHp : calcHp(p.baseStats.hp, p.level),
    maxHp:     p.maxHp     !== undefined ? p.maxHp     : calcHp(p.baseStats.hp, p.level),
  }));

  const log: BattleLogEntry[] = [];
  const detailedLog: DetailedLogEvent[] = [];

  const addLog = (msg: string, cls = ''): void => {
    log.push({ msg, cls });
    onLog?.(msg, cls);
  };

  const playerParticipants = new Set<number>();

  // Announce initial send-outs
  const firstP = pTeam[0];
  const firstE = eTeam[0];
  if (firstP.currentHp > 0) playerParticipants.add(0);
  detailedLog.push({ type: 'send_out', side: 'player', idx: 0, name: firstP.nickname ?? firstP.name });
  detailedLog.push({ type: 'send_out', side: 'enemy',  idx: 0, name: firstE.name });

  let rounds = 0;
  const MAX_ROUNDS = 300;

  while (
    pTeam.some(p => p.currentHp > 0) &&
    eTeam.some(p => p.currentHp > 0) &&
    rounds < MAX_ROUNDS
  ) {
    rounds++;

    // Active = first alive on each side
    const pEntry = pTeam.map((p, idx) => ({ p, idx })).find(x => x.p.currentHp > 0);
    const eEntry = eTeam.map((p, idx) => ({ p, idx })).find(x => x.p.currentHp > 0);
    if (!pEntry || !eEntry) break;

    const { p: pActive, idx: pIdx } = pEntry;
    const { p: eActive, idx: eIdx } = eEntry;

    // Ditto: Transform into the active enemy Pokemon (once per send-out)
    if (pActive.speciesId === 132 && !pActive._transformed) {
      pActive._transformed = true;
      pActive.types     = [...(eActive.types ?? ['Normal'])];
      pActive.baseStats = { ...eActive.baseStats };
      pActive.moveTier  = eActive.moveTier;
      pActive.spriteUrl = eActive.spriteUrl ?? '';
      const dName = pActive.nickname ?? pActive.name;
      addLog(`${dName} transformed into ${eActive.name}!`, 'log-player');
      detailedLog.push({
        type: 'transform', side: 'player', idx: pIdx,
        name: dName, intoName: eActive.name, spriteUrl: pActive.spriteUrl,
        types: pActive.types,
      });
    }

    // Per-Pokemon held item arrays for this round
    const pActiveItems: HeldItem[] = pActive.heldItem ? [pActive.heldItem] : [];
    const eActiveItems: HeldItem[] = eActive.heldItem ? [eActive.heldItem] : [];

    // Speed determines turn order
    const pSpeed = getEffectiveStat(pActive, 'speed', pActiveItems, pTeam);
    const eSpeed = getEffectiveStat(eActive, 'speed', eActiveItems);

    // Detect stalemate: both sides stuck on noDamage moves → force Struggle
    const pMoveProbe = getMove(pActive);
    const eMoveProbe = getMove(eActive);
    const bothUseless = !!(pMoveProbe.isNoDamage && eMoveProbe.isNoDamage);

    type TurnDesc = {
      attacker: PokemonInstance;
      aIdx: number;
      side: 'player' | 'enemy';
      target: PokemonInstance;
      tIdx: number;
      tSide: 'player' | 'enemy';
    };

    const turns: TurnDesc[] = pSpeed >= eSpeed
      ? [
          { attacker: pActive, aIdx: pIdx, side: 'player', target: eActive, tIdx: eIdx, tSide: 'enemy' },
          { attacker: eActive, aIdx: eIdx, side: 'enemy',  target: pActive, tIdx: pIdx, tSide: 'player' },
        ]
      : [
          { attacker: eActive, aIdx: eIdx, side: 'enemy',  target: pActive, tIdx: pIdx, tSide: 'player' },
          { attacker: pActive, aIdx: pIdx, side: 'player', target: eActive, tIdx: eIdx, tSide: 'enemy' },
        ];

    const STRUGGLE: Move = { name: 'Struggle', power: 50, type: 'Normal', isSpecial: false, typeless: true };

    for (const { attacker, aIdx, side, target, tIdx, tSide } of turns) {
      if (attacker.currentHp <= 0 || target.currentHp <= 0) continue;

      let move = getMove(attacker);

      // Both sides stuck → force Struggle
      if (bothUseless) move = STRUGGLE;

      // If best move has zero effectiveness → use Struggle (typeless)
      if (!move.isNoDamage && getTypeEffectiveness(move.type, target.types ?? ['Normal']) === 0) {
        move = STRUGGLE;
      }

      const attackerItems = side === 'player' ? pActiveItems : eActiveItems;
      const defenderItems = side === 'player' ? eActiveItems : pActiveItems;
      const atkTeam       = side === 'player' ? pTeam : [];

      if (move.isNoDamage) {
        const aName = attacker.nickname ?? attacker.name;
        addLog(
          `${side === 'player' ? '' : '(enemy) '}${aName} used ${move.name}! But nothing happened!`,
          side === 'player' ? 'log-player' : 'log-enemy',
        );
        detailedLog.push({
          type: 'attack', side, attackerIdx: aIdx, attackerName: aName,
          targetSide: tSide, targetIdx: tIdx, targetName: target.nickname ?? target.name,
          moveName: move.name, moveType: move.type, damage: 0, typeEff: 1, crit: false, isSpecial: false,
          attackerHpAfter: attacker.currentHp, targetHpAfter: target.currentHp,
        });
        continue;
      }

      const { damage, typeEff, moveType, crit } = calcDamage(
        attacker, target, move, attackerItems, defenderItems, atkTeam,
      );

      const targetPreHp = target.currentHp;
      target.currentHp = Math.max(0, target.currentHp - damage);

      // Focus Band: 10% chance to survive a KO at 1 HP (player only)
      if (
        target.currentHp === 0 &&
        targetPreHp > 0 &&
        tSide === 'player' &&
        target.heldItem?.id === 'focus_band' &&
        Math.random() < 0.1
      ) {
        target.currentHp = 1;
      }

      const aName = attacker.nickname ?? attacker.name;
      const tName = target.nickname   ?? target.name;

      let effText = '';
      if (typeEff >= 2)      effText = ' Super effective!';
      else if (typeEff === 0) effText = ' No effect!';
      else if (typeEff < 1)  effText = ' Not very effective...';

      addLog(
        `${side === 'player' ? '' : '(enemy) '}${aName} used ${move.name} → ${tName} took ${damage} dmg.${effText}`,
        side === 'player' ? 'log-player' : 'log-enemy',
      );

      detailedLog.push({
        type: 'attack', side, attackerIdx: aIdx, attackerName: aName,
        targetSide: tSide, targetIdx: tIdx, targetName: tName,
        moveName: move.name, moveType, damage, typeEff, crit, isSpecial: move.isSpecial,
        attackerHpAfter: attacker.currentHp, targetHpAfter: target.currentHp,
      });

      // Life Orb recoil (player attacker only)
      if (side === 'player' && attacker.heldItem?.id === 'life_orb') {
        const recoil = Math.max(1, Math.floor(attacker.maxHp * 0.1));
        attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
        addLog(`${aName} lost ${recoil} HP from Life Orb!`, 'log-item');
        detailedLog.push({
          type: 'effect', side: 'player', idx: aIdx, name: aName,
          hpChange: -recoil, hpAfter: attacker.currentHp,
          reason: `${aName} lost ${recoil} HP from Life Orb!`,
        });
      }

      // Rocky Helmet: attacker takes 15% of their max HP
      if (target.heldItem?.id === 'rocky_helmet') {
        const helmet = Math.max(1, Math.floor(attacker.maxHp * 0.15));
        attacker.currentHp = Math.max(0, attacker.currentHp - helmet);
        addLog(`Rocky Helmet hurt ${aName} for ${helmet} HP!`, 'log-item');
        detailedLog.push({
          type: 'effect', side, idx: aIdx, name: aName,
          hpChange: -helmet, hpAfter: attacker.currentHp,
          reason: `Rocky Helmet hurt ${aName} for ${helmet} HP!`,
        });
      }

      // Shell Bell: heal 25% of damage dealt (player attacker only)
      if (side === 'player' && attacker.heldItem?.id === 'shell_bell') {
        const heal   = Math.max(1, Math.floor(damage * 0.25));
        const actual = Math.min(heal, attacker.maxHp - attacker.currentHp);
        if (actual > 0) {
          attacker.currentHp += actual;
          addLog(`Shell Bell restored ${actual} HP to ${aName}!`, 'log-item');
          detailedLog.push({
            type: 'effect', side: 'player', idx: aIdx, name: aName,
            hpChange: actual, hpAfter: attacker.currentHp,
            reason: `Shell Bell restored ${actual} HP to ${aName}!`,
          });
        }
      }

      // ── Faint checks ──────────────────────────────────────────────────────

      if (target.currentHp <= 0) {
        addLog(`${tName} fainted!`, 'log-faint');
        detailedLog.push({ type: 'faint', side: tSide, idx: tIdx, name: tName });
        const nextTeam = tSide === 'player' ? pTeam : eTeam;
        const next = nextTeam.map((p, i) => ({ p, i })).find(x => x.p.currentHp > 0);
        if (next) {
          if (tSide === 'player') playerParticipants.add(next.i);
          const nName = next.p.nickname ?? next.p.name;
          addLog(`${nName} was sent out!`, tSide === 'player' ? 'log-player' : 'log-enemy');
          detailedLog.push({ type: 'send_out', side: tSide, idx: next.i, name: nName });
        }
      }

      if (attacker.currentHp <= 0) {
        addLog(`${aName} fainted!`, 'log-faint');
        detailedLog.push({ type: 'faint', side, idx: aIdx, name: aName });
        const nextTeam = side === 'player' ? pTeam : eTeam;
        const next = nextTeam.map((p, i) => ({ p, i })).find(x => x.p.currentHp > 0);
        if (next) {
          if (side === 'player') playerParticipants.add(next.i);
          const nName = next.p.nickname ?? next.p.name;
          addLog(`${nName} was sent out!`, side === 'player' ? 'log-player' : 'log-enemy');
          detailedLog.push({ type: 'send_out', side, idx: next.i, name: nName });
        }
      }
    }

    // Leftovers: restore 1/16 max HP to the active player Pokemon each round
    const active = pTeam.map((p, i) => ({ p, i })).find(x => x.p.currentHp > 0);
    if (active?.p.heldItem?.id === 'leftovers') {
      const heal   = Math.max(1, Math.floor(active.p.maxHp / 16));
      const actual = Math.min(heal, active.p.maxHp - active.p.currentHp);
      if (actual > 0) {
        active.p.currentHp += actual;
        const n = active.p.nickname ?? active.p.name;
        addLog(`Leftovers restored ${actual} HP to ${n}!`, 'log-item');
        detailedLog.push({
          type: 'effect', side: 'player', idx: active.i, name: n,
          hpChange: actual, hpAfter: active.p.currentHp,
          reason: `Leftovers restored ${actual} HP to ${n}!`,
        });
      }
    }
  }

  const playerWon = pTeam.some(p => p.currentHp > 0) && !eTeam.some(p => p.currentHp > 0);
  const stalemate = rounds >= MAX_ROUNDS && !playerWon && pTeam.some(p => p.currentHp > 0);
  const endMsg = playerWon ? '--- Victory! ---' : stalemate ? '--- Stalemate — battle timed out! ---' : '--- Defeat! ---';
  const endCls = playerWon ? 'log-win' : stalemate ? 'log-stalemate' : 'log-lose';
  addLog(endMsg, endCls);
  detailedLog.push({ type: 'result', playerWon });

  return { playerWon, log, detailedLog, pTeam, eTeam, playerParticipants };
}

