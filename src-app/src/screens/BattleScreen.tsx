import { useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import { useBattlePlayback } from '@/hooks/useBattlePlayback';
import { BattleField } from '@/components/battle/BattleField';
import type { DetailedLogEvent } from '@/types/battle';
import type { PokemonInstance } from '@/types/pokemon';

// ── Derive a formatted battle title from the raw context strings ───────────
function formatBattleTitle(title: string): string {
  if (!title) return '';
  const lower = title.toLowerCase();
  if (lower.includes('gym') || lower.includes('leader')) {
    // Already has gym/leader wording — reformat to "VS [LEADER] — GYM LEADER"
    const match = title.match(/vs\s+(.+?)(?:\s*[!—–-].*)?$/i);
    if (match) return `VS ${match[1].toUpperCase()} — GYM LEADER`;
  }
  if (lower.includes('wild')) return 'WILD POKÉMON';
  if (lower.includes('trainer')) {
    const match = title.match(/vs\s+(.+?)(?:\s*[!—–-].*)?$/i);
    if (match) return `VS ${match[1].toUpperCase()}`;
    return 'VS TRAINER';
  }
  // Boss / Elite Four — pass through uppercased
  return title.toUpperCase();
}

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
      <div
        className="screen-battle flex items-center justify-center h-full"
        style={{ background: '#0d110e' }}
      >
        <span
          className="font-terminal text-[22px] animate-blink"
          style={{ color: '#f0ead6' }}
        >
          Loading battle...
        </span>
      </div>
    );
  }

  // Determine which Pokémon are currently active (first with HP > 0)
  const playerActiveIdx = Math.max(
    0,
    playback.playerTeam.findIndex(p => p.currentHp > 0),
  );
  const enemyActiveIdx = Math.max(
    0,
    playback.enemyTeam.findIndex(p => p.currentHp > 0),
  );

  // Battle title header
  const rawTitle    = (state.context.battleTitle    as string) ?? '';
  const battleTitle = formatBattleTitle(rawTitle);

  return (
    <div
      className="screen-battle flex flex-col h-full"
      style={{ background: '#0d110e' }}
    >
      {/* ── Battle title header ──────────────────────────────────────────── */}
      {battleTitle && (
        <div
          className="flex-shrink-0 flex items-center justify-center px-4 py-2"
          style={{
            background: '#161d14',
            borderBottom: '2px solid #c8a96e',
          }}
        >
          <span
            className="font-pixel text-center truncate"
            style={{
              fontSize: 10,
              color: '#c8a96e',
              textShadow: '1px 1px 0 #050805, 0 0 12px #c8a96e44',
              letterSpacing: '0.08em',
            }}
          >
            {battleTitle}
          </span>
        </div>
      )}

      {/* ── BattleField fills remaining space ───────────────────────────── */}
      <div className="flex-1" style={{ minHeight: 0 }}>
        <BattleField
          playerTeam={playback.playerTeam}
          enemyTeam={playback.enemyTeam}
          playerActiveIdx={playerActiveIdx}
          enemyActiveIdx={enemyActiveIdx}
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
