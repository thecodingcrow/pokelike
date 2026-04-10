import { useMemo } from 'react';
import type { PokemonInstance } from '@/types/pokemon';
import type { DetailedLogEvent } from '@/types/battle';
import { HpBar } from './HpBar';

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

// ── Roster slot: one Pokémon in the top roster strip ──────────────────────

function RosterSlot({
  pokemon,
  isActive,
  side,
}: {
  pokemon: PokemonInstance | null;
  isActive: boolean;
  side: 'player' | 'enemy';
}) {
  if (!pokemon) {
    return (
      <div
        className="flex flex-col items-center gap-0.5"
        style={{ width: 64 }}
      >
        <div
          className="w-16 h-16 border border-dashed flex items-center justify-center"
          style={{ borderColor: '#5a6a4a', opacity: 0.2 }}
        />
      </div>
    );
  }

  const displayName = pokemon.nickname ?? pokemon.name;
  const isFainted = pokemon.currentHp <= 0;
  const accentColor = side === 'player' ? '#22c55e' : '#ef4444';

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      style={{ width: 64, opacity: isFainted ? 0.3 : 1 }}
    >
      {/* Sprite box */}
      <div
        className="w-16 h-16 flex items-center justify-center relative"
        style={{
          imageRendering: 'pixelated',
          border: isActive ? `2px solid ${accentColor}` : '1px solid #5a6a4a',
          boxShadow: isActive ? `0 0 6px 1px ${accentColor}55` : undefined,
          filter: isFainted ? 'grayscale(0.8)' : undefined,
        }}
      >
        {pokemon.spriteUrl ? (
          <img
            src={pokemon.spriteUrl}
            alt={displayName}
            className="w-14 h-14 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div
            className="w-12 h-12 flex items-center justify-center"
            style={{ background: '#f0ead610', border: '1px solid #f0ead620' }}
          >
            <span
              className="font-pixel text-center leading-tight uppercase break-all px-1"
              style={{ fontSize: 5, color: '#f0ead660' }}
            >
              {displayName.slice(0, 6)}
            </span>
          </div>
        )}
      </div>

      {/* Name */}
      <div
        className="font-pixel truncate w-full text-center uppercase leading-[1.6]"
        style={{
          fontSize: 6,
          color: '#f0ead6',
          textDecoration: isFainted ? 'line-through' : undefined,
          maxWidth: 64,
        }}
      >
        {displayName.slice(0, 8)}
      </div>

      {/* Level */}
      <div
        className="font-mono leading-none"
        style={{ fontSize: 11, color: '#c8a96e' }}
      >
        Lv{pokemon.level}
      </div>

      {/* HP bar */}
      <div style={{ width: 56 }}>
        <HpBar
          current={pokemon.currentHp}
          max={pokemon.maxHp}
          label=""
          showNumbers={false}
        />
      </div>
    </div>
  );
}

// ── Active-spotlight sprite ────────────────────────────────────────────────

function SpotlightSprite({
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
      ]
        .filter(Boolean)
        .join(' ')}
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
        <div
          className="w-16 h-16 flex items-center justify-center"
          style={{ background: '#f0ead610', border: '2px solid #f0ead620' }}
        >
          <span
            className="font-pixel text-center leading-tight uppercase break-all px-1"
            style={{ fontSize: 7, color: '#f0ead640' }}
          >
            {displayName.slice(0, 6)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

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
  const enemyActive = enemyTeam[enemyActiveIdx];

  // Shake logic
  const { playerDamaged, enemyDamaged } = useMemo(() => {
    if (!currentEvent || currentEvent.type !== 'attack') {
      return { playerDamaged: false, enemyDamaged: false };
    }
    return {
      playerDamaged:
        currentEvent.targetSide === 'player' &&
        currentEvent.targetIdx === playerActiveIdx,
      enemyDamaged:
        currentEvent.targetSide === 'enemy' &&
        currentEvent.targetIdx === enemyActiveIdx,
    };
  }, [currentEvent, playerActiveIdx, enemyActiveIdx]);

  const playerFainted = (playerActive?.currentHp ?? 1) <= 0;
  const enemyFainted = (enemyActive?.currentHp ?? 1) <= 0;

  // Effectiveness overlay
  const effectivenessText = useMemo(() => {
    if (!currentEvent || currentEvent.type !== 'attack' || currentEvent.damage === 0)
      return null;
    if (currentEvent.typeEff >= 2) return "It's super effective!";
    if (currentEvent.typeEff < 1 && currentEvent.typeEff > 0)
      return 'Not very effective...';
    return null;
  }, [currentEvent]);

  const currentMessage = logMessages[logMessages.length - 1]?.text ?? '';

  if (!playerActive || !enemyActive) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: '#0d110e' }}
      >
        <span className="font-terminal text-[22px]" style={{ color: '#f0ead6' }}>
          Loading battle...
        </span>
      </div>
    );
  }

  // Pad teams to 6 for display
  const playerSlots: (PokemonInstance | null)[] = [
    ...playerTeam,
    ...Array(Math.max(0, 6 - playerTeam.length)).fill(null),
  ];
  const enemySlots: (PokemonInstance | null)[] = [
    ...enemyTeam,
    ...Array(Math.max(0, 6 - enemyTeam.length)).fill(null),
  ];

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#0d110e', imageRendering: 'pixelated' }}
    >
      {/* ── TOP ZONE: full roster strips ──────────────────────────────────── */}
      {/*
        Desktop: 3-column grid (your team | VS | enemy team)
        Mobile (<640px): stacked strips
      */}
      <div
        className="flex-shrink-0 px-2 py-2"
        style={{ borderBottom: '2px solid #c8a96e', background: '#161d14' }}
      >
        {/* Desktop layout */}
        <div className="hidden sm:grid" style={{ gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
          {/* Your team (left, flex-wrap) */}
          <div className="flex flex-wrap gap-2 justify-start">
            {playerSlots.map((mon, i) => (
              <RosterSlot
                key={i}
                pokemon={mon}
                isActive={i === playerActiveIdx}
                side="player"
              />
            ))}
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center px-3">
            <div
              className="font-pixel leading-none"
              style={{ fontSize: 14, color: '#d97706', textShadow: '0 0 8px #d9770688' }}
            >
              ⚔
            </div>
            <div
              className="font-pixel leading-none mt-1"
              style={{ fontSize: 8, color: '#c8a96e', letterSpacing: '0.1em' }}
            >
              VS
            </div>
          </div>

          {/* Enemy team (right, flex-wrap, justify-end) */}
          <div className="flex flex-wrap gap-2 justify-end">
            {enemySlots.map((mon, i) => (
              <RosterSlot
                key={i}
                pokemon={mon}
                isActive={i === enemyActiveIdx}
                side="enemy"
              />
            ))}
          </div>
        </div>

        {/* Mobile layout: player strip top, enemy strip bottom */}
        <div className="sm:hidden flex flex-col gap-2">
          {/* Player strip */}
          <div className="flex gap-1.5 overflow-x-auto justify-center">
            {playerSlots.map((mon, i) => (
              <RosterSlot
                key={i}
                pokemon={mon}
                isActive={i === playerActiveIdx}
                side="player"
              />
            ))}
          </div>
          {/* Divider */}
          <div className="text-center" style={{ color: '#d97706', fontSize: 10 }}>⚔ VS ⚔</div>
          {/* Enemy strip */}
          <div className="flex gap-1.5 overflow-x-auto justify-center">
            {enemySlots.map((mon, i) => (
              <RosterSlot
                key={i}
                pokemon={mon}
                isActive={i === enemyActiveIdx}
                side="enemy"
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── MIDDLE ZONE: active spotlight ─────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        style={{ background: '#0a0e0b', minHeight: 0 }}
      >
        {/* Active Pokémon sprites face-off */}
        <div className="flex items-center gap-4">
          {/* Player active (left in arena) */}
          <div className="flex flex-col items-center gap-1">
            <SpotlightSprite
              pokemon={playerActive}
              isDamaged={playerDamaged}
              isFainted={playerFainted}
            />
            <div
              className="font-pixel leading-none"
              style={{ fontSize: 7, color: '#22c55e' }}
            >
              {(playerActive.nickname ?? playerActive.name).toUpperCase()}
            </div>
          </div>

          {/* ⚔ center divider */}
          <div
            className="font-pixel select-none"
            style={{ fontSize: 20, color: '#c8a96e', textShadow: '0 0 10px #c8a96e44' }}
          >
            ⚔
          </div>

          {/* Enemy active (right in arena) */}
          <div className="flex flex-col items-center gap-1">
            <SpotlightSprite
              pokemon={enemyActive}
              isDamaged={enemyDamaged}
              isFainted={enemyFainted}
            />
            <div
              className="font-pixel leading-none"
              style={{ fontSize: 7, color: '#ef4444' }}
            >
              {(enemyActive.nickname ?? enemyActive.name).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Effectiveness flash */}
        {effectivenessText && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-20">
            <div
              className="font-pixel px-3 py-1"
              style={{
                fontSize: 10,
                border: '2px solid #c8a96e',
                boxShadow: '2px 2px 0 #050805',
                background:
                  currentEvent &&
                  currentEvent.type === 'attack' &&
                  (currentEvent as { typeEff: number }).typeEff >= 2
                    ? '#7f1d1d'
                    : '#161d14',
                color: '#f0ead6',
              }}
            >
              {effectivenessText}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM ZONE: dialog + controls ────────────────────────────────── */}
      <div
        className="relative flex-shrink-0"
        style={{
          background: '#0d110e',
          borderTop: '4px solid #c8a96e',
        }}
      >
        {/* Skip / Continue button — right-aligned */}
        <div className="absolute bottom-3 right-3 z-10">
          {isComplete ? (
            <button
              className="btn-pixel"
              style={{ background: '#166534', color: '#f0ead6', border: '2px solid #c8a96e' }}
              onClick={onContinue}
            >
              Continue
            </button>
          ) : (
            <button
              className="btn-pixel"
              style={{
                background: '#161d14',
                color: '#f0ead6bb',
                border: '2px solid #5a6a4a',
              }}
              onClick={onSkip}
            >
              Skip
            </button>
          )}
        </div>

        {/* Log text */}
        <div className="p-4 pb-6 pr-28 min-h-[120px]">
          {logMessages.length > 1 && (
            <div
              className="font-terminal leading-tight mb-1 truncate"
              style={{ fontSize: 18, color: '#f0ead640' }}
            >
              {logMessages[logMessages.length - 2]?.text}
            </div>
          )}
          <div
            className="font-terminal leading-snug"
            style={{ fontSize: 22, color: '#f0ead6' }}
            aria-live="polite"
          >
            {currentMessage}
            {currentMessage && <span className="animate-blink ml-1">▼</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
