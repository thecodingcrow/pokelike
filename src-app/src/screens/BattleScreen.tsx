import { useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import { useBattlePlayback } from '@/hooks/useBattlePlayback';
import { BattleField } from '@/components/battle/BattleField';
import type { DetailedLogEvent } from '@/types/battle';
import type { PokemonInstance } from '@/types/pokemon';

export function BattleScreen() {
  const { state, send } = useGame();
  const battleResult = state.context.battleResult as {
    detailedLog: DetailedLogEvent[];
    pTeam: PokemonInstance[];
    eTeam: PokemonInstance[];
    playerWon: boolean;
  } | null;

  const detailedLog: DetailedLogEvent[] = battleResult?.detailedLog ?? [];
  const pTeam: PokemonInstance[]        = battleResult?.pTeam ?? [];
  const eTeam: PokemonInstance[]        = battleResult?.eTeam ?? [];

  const playback = useBattlePlayback(detailedLog, pTeam, eTeam);

  // Start playback once we have a log to play
  useEffect(() => {
    if (detailedLog.length > 0) {
      playback.start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailedLog.length]);

  if (!battleResult) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[#0a0a0f]">
        <span className="font-terminal text-[22px] text-white animate-blink">
          Loading battle...
        </span>
      </div>
    );
  }

  // Determine which Pokemon are currently active
  const playerActiveIdx = playback.playerTeam.findIndex(p => p.currentHp > 0);
  const enemyActiveIdx  = playback.enemyTeam.findIndex(p => p.currentHp > 0);

  // Header strip
  const battleTitle    = (state.context.battleTitle as string)    ?? '';
  const battleSubtitle = (state.context.battleSubtitle as string) ?? '';

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0f]">
      {/* Header */}
      {(battleTitle || battleSubtitle) && (
        <div className="bg-[#121827] border-b-2 border-white px-4 py-2 flex items-center justify-between flex-shrink-0">
          <span className="font-pixel text-[10px] text-white truncate">{battleTitle}</span>
          <span className="font-terminal text-[18px] text-[#94a3b8]">{battleSubtitle}</span>
        </div>
      )}

      {/* BattleField fills remaining space */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <BattleField
          playerTeam={playback.playerTeam}
          enemyTeam={playback.enemyTeam}
          playerActiveIdx={Math.max(0, playerActiveIdx)}
          enemyActiveIdx={Math.max(0, enemyActiveIdx)}
          currentEvent={playback.currentEvent}
          logMessages={playback.logMessages}
          isComplete={playback.isComplete}
          onSkip={() => playback.skip()}
          onContinue={() => send({ type: 'CONTINUE' })}
        />
      </div>
    </div>
  );
}
