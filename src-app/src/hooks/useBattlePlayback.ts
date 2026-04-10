import { useState, useRef, useCallback, useEffect } from 'react';
import type { DetailedLogEvent } from '@/types/battle';
import type { PokemonInstance } from '@/types/pokemon';

interface LogMessage {
  text: string;
  className: string;
}

interface BattlePlaybackState {
  currentEventIndex: number;
  currentEvent: DetailedLogEvent | null;
  playerTeam: PokemonInstance[];
  enemyTeam: PokemonInstance[];
  logMessages: LogMessage[];
  isPlaying: boolean;
  isComplete: boolean;
  speedMultiplier: number;
}

const EVENT_DELAYS: Record<DetailedLogEvent['type'], number> = {
  send_out:  400,
  attack:    600,
  effect:    300,
  faint:     500,
  transform: 500,
  result:    0,
};

function buildMessage(event: DetailedLogEvent): LogMessage | null {
  switch (event.type) {
    case 'send_out':
      return {
        text: `Go, ${event.name}!`,
        className: event.side === 'player' ? 'log-player' : 'log-enemy',
      };
    case 'attack': {
      let effText = '';
      if (event.typeEff >= 2)       effText = " It's super effective!";
      else if (event.typeEff === 0)  effText = ' No effect!';
      else if (event.typeEff < 1)    effText = ' Not very effective...';
      const critText = event.crit ? ' Critical hit!' : '';
      const dmgText = event.damage > 0
        ? ` ${event.targetName} took ${event.damage} damage.`
        : ' But nothing happened!';
      return {
        text: `${event.attackerName} used ${event.moveName}!${dmgText}${effText}${critText}`,
        className: event.side === 'player' ? 'log-player' : 'log-enemy',
      };
    }
    case 'effect':
      return {
        text: event.reason,
        className: 'log-effect',
      };
    case 'faint':
      return {
        text: `${event.name} fainted!`,
        className: 'log-faint',
      };
    case 'transform':
      return {
        text: `${event.name} transformed into ${event.intoName}!`,
        className: event.side === 'player' ? 'log-player' : 'log-enemy',
      };
    case 'result':
      return {
        text: event.playerWon ? 'You win!' : 'You lost...',
        className: event.playerWon ? 'log-win' : 'log-lose',
      };
    default:
      return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useBattlePlayback(
  detailedLog: DetailedLogEvent[],
  pTeam: PokemonInstance[],
  eTeam: PokemonInstance[],
) {
  const [state, setState] = useState<BattlePlaybackState>({
    currentEventIndex: -1,
    currentEvent: null,
    playerTeam: pTeam.map(p => ({ ...p })),
    enemyTeam: eTeam.map(p => ({ ...p })),
    logMessages: [],
    isPlaying: false,
    isComplete: false,
    speedMultiplier: 1,
  });

  const cancelRef = useRef(false);
  const speedRef = useRef(1);

  // Keep speedRef in sync with state
  useEffect(() => {
    speedRef.current = state.speedMultiplier;
  }, [state.speedMultiplier]);

  // Cancel playback on unmount to prevent stale state updates
  useEffect(() => {
    return () => { cancelRef.current = true; };
  }, []);

  const start = useCallback(() => {
    cancelRef.current = false;
    // Always reset speed to 1× at the start of a new battle so that
    // skipping a previous battle doesn't carry the fast speed into the next one.
    speedRef.current = 1;

    setState(prev => ({
      ...prev,
      isPlaying: true,
      isComplete: false,
      currentEventIndex: -1,
      currentEvent: null,
      logMessages: [],
      playerTeam: pTeam.map(p => ({ ...p })),
      enemyTeam: eTeam.map(p => ({ ...p })),
      speedMultiplier: 1,
    }));

    const run = async () => {
      // Local mutable HP tracking (parallel to state, avoids stale closure)
      const pHp: number[] = pTeam.map(p => p.currentHp);
      const eHp: number[] = eTeam.map(p => p.currentHp);

      for (let i = 0; i < detailedLog.length; i++) {
        if (cancelRef.current) break;

        const event = detailedLog[i];
        const delay = EVENT_DELAYS[event.type] / speedRef.current;

        // Update HP state from attack events
        if (event.type === 'attack') {
          if (event.side === 'player') {
            pHp[event.attackerIdx] = event.attackerHpAfter;
            eHp[event.targetIdx]   = event.targetHpAfter;
          } else {
            eHp[event.attackerIdx] = event.attackerHpAfter;
            pHp[event.targetIdx]   = event.targetHpAfter;
          }
        } else if (event.type === 'effect') {
          if (event.side === 'player') {
            pHp[event.idx] = event.hpAfter;
          } else {
            eHp[event.idx] = event.hpAfter;
          }
        }

        const msg = buildMessage(event);

        setState(prev => {
          const newPTeam = prev.playerTeam.map((p, idx) =>
            pHp[idx] !== undefined ? { ...p, currentHp: pHp[idx] } : p
          );
          const newETeam = prev.enemyTeam.map((p, idx) =>
            eHp[idx] !== undefined ? { ...p, currentHp: eHp[idx] } : p
          );

          // Handle transform: update sprite/types on player team
          if (event.type === 'transform' && event.side === 'player') {
            newPTeam[event.idx] = {
              ...newPTeam[event.idx],
              spriteUrl: event.spriteUrl,
              types: event.types as PokemonInstance['types'],
            };
          }

          return {
            ...prev,
            currentEventIndex: i,
            currentEvent: event,
            playerTeam: newPTeam,
            enemyTeam: newETeam,
            logMessages: msg ? [...prev.logMessages, msg] : prev.logMessages,
            isComplete: event.type === 'result',
          };
        });

        if (delay > 0) {
          await sleep(delay);
        }
      }

      if (!cancelRef.current) {
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    };

    run();
  }, [detailedLog, pTeam, eTeam]);

  const skip = useCallback(() => {
    // 2× speed — fast enough to feel skipped, slow enough to still read events.
    // (Was 3× which was too aggressive, especially for the question-mark and
    // end-game battles where the tester reported events flashing by.)
    speedRef.current = 2;
    setState(prev => ({ ...prev, speedMultiplier: 2 }));
  }, []);

  const skipAll = useCallback(() => {
    speedRef.current = 1000;
    setState(prev => ({ ...prev, speedMultiplier: 1000 }));
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  return {
    ...state,
    start,
    skip,
    skipAll,
    stop,
  };
}
