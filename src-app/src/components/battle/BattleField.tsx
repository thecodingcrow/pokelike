import { useMemo } from 'react';
import type { PokemonInstance } from '@/types/pokemon';
import type { DetailedLogEvent } from '@/types/battle';
import { HpBar } from './HpBar';
import { TypeBadge } from '@/components/ui/TypeBadge';

interface BattleFieldProps {
  playerTeam: PokemonInstance[];
  enemyTeam: PokemonInstance[];
  playerActiveIdx: number;
  enemyActiveIdx: number;
  currentEvent: DetailedLogEvent | null;
  logMessages: { text: string; className: string }[];
  isComplete: boolean;
  onSkip: () => void;
  onContinue: () => void;
}

function PokemonInfoPanel({
  pokemon,
  side,
}: {
  pokemon: PokemonInstance;
  side: 'player' | 'enemy';
}) {
  const displayName = pokemon.nickname ?? pokemon.name;

  return (
    <div
      className="bg-game-panel border-2 border-white shadow-pixel p-2 min-w-[140px] max-w-[160px]"
      style={{ imageRendering: 'pixelated' }}
    >
      <div className="font-pixel text-[8px] text-white uppercase truncate leading-[1.8] mb-1">
        {displayName}
      </div>
      <div className="font-pixel text-[8px] text-white/60 mb-1.5">
        Lv {pokemon.level}
      </div>
      <HpBar
        current={pokemon.currentHp}
        max={pokemon.maxHp}
        label="HP"
        showNumbers={side === 'player'}
      />
      {pokemon.types.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {pokemon.types.map(t => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function PokemonSprite({
  pokemon,
  isDamaged,
  isFainted,
}: {
  pokemon: PokemonInstance;
  isDamaged: boolean;
  isFainted: boolean;
}) {
  const displayName = pokemon.nickname ?? pokemon.name;

  return (
    <div
      className={[
        'w-24 h-24 flex items-center justify-center relative',
        isDamaged ? 'animate-damage-shake' : '',
        isFainted ? 'opacity-30 transition-opacity duration-500' : '',
      ].filter(Boolean).join(' ')}
      style={{ imageRendering: 'pixelated' }}
    >
      {pokemon.spriteUrl ? (
        <img
          src={pokemon.spriteUrl}
          alt={displayName}
          className="w-24 h-24 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        /* Placeholder silhouette when no sprite available */
        <div className="w-16 h-16 bg-white/10 border-2 border-white/20 flex items-center justify-center">
          <span className="font-pixel text-[7px] text-white/40 text-center leading-tight uppercase break-all px-1">
            {displayName.slice(0, 6)}
          </span>
        </div>
      )}
    </div>
  );
}

export function BattleField({
  playerTeam,
  enemyTeam,
  playerActiveIdx,
  enemyActiveIdx,
  currentEvent,
  logMessages,
  isComplete,
  onSkip,
  onContinue,
}: BattleFieldProps) {
  const playerActive = playerTeam[playerActiveIdx];
  const enemyActive  = enemyTeam[enemyActiveIdx];

  // Determine which sprite is being shaken this frame
  const { playerDamaged, enemyDamaged } = useMemo(() => {
    if (!currentEvent || currentEvent.type !== 'attack') {
      return { playerDamaged: false, enemyDamaged: false };
    }
    const isPlayerTarget = currentEvent.targetSide === 'player' && currentEvent.targetIdx === playerActiveIdx;
    const isEnemyTarget  = currentEvent.targetSide === 'enemy'  && currentEvent.targetIdx === enemyActiveIdx;
    return {
      playerDamaged: isPlayerTarget,
      enemyDamaged:  isEnemyTarget,
    };
  }, [currentEvent, playerActiveIdx, enemyActiveIdx]);

  const playerFainted = playerActive?.currentHp <= 0;
  const enemyFainted  = enemyActive?.currentHp  <= 0;

  // Super effective / not very effective flash text
  const effectivenessText = useMemo(() => {
    if (!currentEvent || currentEvent.type !== 'attack' || currentEvent.damage === 0) return null;
    if (currentEvent.typeEff >= 2)     return "It's super effective!";
    if (currentEvent.typeEff < 1 && currentEvent.typeEff > 0) return 'Not very effective...';
    return null;
  }, [currentEvent]);

  const currentMessage = logMessages[logMessages.length - 1]?.text ?? '';

  if (!playerActive || !enemyActive) {
    return (
      <div className="w-full h-full bg-game-bg flex items-center justify-center">
        <span className="font-terminal text-white text-[22px]">Loading battle...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-game-bg flex flex-col" style={{ imageRendering: 'pixelated' }}>
      {/* ── Battle arena (top ~70%) ─────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>

        {/* Enemy row: sprite top-left, info panel top-right */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {/* Enemy sprite (top-left) */}
          <PokemonSprite
            pokemon={enemyActive}
            isDamaged={enemyDamaged}
            isFainted={enemyFainted}
          />
          {/* Enemy info panel (top-right) */}
          <PokemonInfoPanel pokemon={enemyActive} side="enemy" />
        </div>

        {/* Player row: info panel bottom-left, sprite bottom-right */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          {/* Player info panel (bottom-left) */}
          <PokemonInfoPanel pokemon={playerActive} side="player" />
          {/* Player sprite (bottom-right) */}
          <PokemonSprite
            pokemon={playerActive}
            isDamaged={playerDamaged}
            isFainted={playerFainted}
          />
        </div>

        {/* Effectiveness flash (center overlay) */}
        {effectivenessText && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-20">
            <div className={`font-pixel text-[10px] px-3 py-1 border-2 border-white shadow-pixel
              ${currentEvent && 'type' in currentEvent && (currentEvent as {type:string}).type === 'attack' && (currentEvent as {typeEff:number}).typeEff >= 2
                ? 'bg-pokemon-red text-white'
                : 'bg-game-panel text-white/70'}`}>
              {effectivenessText}
            </div>
          </div>
        )}
      </div>

      {/* ── Dialogue / log box (bottom ~30%) ────────────────────────────── */}
      <div className="relative border-t-4 border-white bg-game-bg flex-shrink-0">
        {/* Skip / Continue button */}
        <div className="absolute bottom-3 right-3 z-10">
          {isComplete ? (
            <button
              className="btn-pixel bg-pokemon-green text-white"
              onClick={onContinue}
            >
              Continue
            </button>
          ) : (
            <button
              className="btn-pixel bg-game-panel text-white/70"
              onClick={onSkip}
            >
              Skip
            </button>
          )}
        </div>

        {/* Log text */}
        <div className="p-4 pb-6 pr-28 min-h-[120px]">
          {logMessages.length > 1 && (
            <div className="font-terminal text-[18px] text-white/40 leading-tight mb-1 truncate">
              {logMessages[logMessages.length - 2]?.text}
            </div>
          )}
          <div className="font-terminal text-[22px] text-white leading-snug" aria-live="polite">
            {currentMessage}
            {currentMessage && (
              <span className="animate-blink ml-1">▼</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
