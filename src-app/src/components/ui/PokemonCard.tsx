import type { PokemonInstance } from '@/types/pokemon';
import { TypeBadge } from './TypeBadge';
import { HpBar } from '@/components/battle/HpBar';

interface PokemonCardProps {
  pokemon: PokemonInstance;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export function PokemonCard({ pokemon, onClick, selected, compact }: PokemonCardProps) {
  const displayName = pokemon.nickname ?? pokemon.name;
  const spriteSize  = compact ? 'w-12 h-12' : 'w-24 h-24';

  return (
    <div
      className={[
        'bg-[#121827] border-2 p-3 shadow-[4px_4px_0px_#000]',
        selected ? 'border-yellow-400' : 'border-white',
        onClick ? 'cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] transition-none' : '',
      ].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Sprite */}
      <div className="flex justify-center mb-1">
        <img
          src={pokemon.spriteUrl}
          alt={displayName}
          className={`${spriteSize} mx-auto`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Name */}
      <div className="font-pixel text-[10px] text-white text-center truncate">
        {displayName.toUpperCase()}
      </div>

      {/* Level */}
      <div className="font-mono text-sm text-[#94a3b8] text-center">
        Lv. {pokemon.level}
      </div>

      {/* Types */}
      {!compact && (
        <div className="flex gap-1 justify-center mt-1 flex-wrap">
          {pokemon.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      )}

      {/* HP Bar */}
      {pokemon.currentHp !== undefined && !compact && (
        <div className="mt-2">
          <HpBar current={pokemon.currentHp} max={pokemon.maxHp} showNumbers />
        </div>
      )}

      {/* Held item */}
      {pokemon.heldItem && !compact && (
        <div className="mt-1 text-center">
          <span className="font-mono text-[10px] text-[#94a3b8] border border-white/30 px-1">
            {pokemon.heldItem.icon} {pokemon.heldItem.name}
          </span>
        </div>
      )}
    </div>
  );
}
