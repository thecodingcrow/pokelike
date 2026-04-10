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
        'bg-[#161d14] border-2 p-3 shadow-[3px_3px_0px_#050805]',
        selected ? 'border-[#e8c97e] shadow-[0_0_12px_rgba(200,169,110,0.3)]' : 'border-[#c8a96e]',
        onClick ? 'cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-3px] hover:shadow-[5px_5px_0px_#050805] transition-all duration-150 ease-out' : '',
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
      <div className="font-pixel text-[10px] text-[#f0ead6] text-center truncate">
        {displayName.toUpperCase()}
      </div>

      {/* Level */}
      <div className="font-mono text-sm text-[#c8a96e] text-center">
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
          <span className="font-mono text-[10px] text-[#c8a96e] border border-[#c8a96e]/30 px-1">
            {pokemon.heldItem.icon} {pokemon.heldItem.name}
          </span>
        </div>
      )}
    </div>
  );
}
