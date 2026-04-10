import { useState, useRef } from 'react';
import type { PokemonInstance } from '@/types/pokemon';
import { TeamHoverCard } from './TeamHoverCard';

interface TeamBarProps {
  team: PokemonInstance[];
  readonly?: boolean;
  onReorder?: (from: number, to: number) => void;
  layout?: 'strip' | 'grid';
  onPokemonTap?: (pokemonIdx: number) => void;
}

function hpDotColor(current: number, max: number): string {
  if (max === 0) return '#dc2626';
  const pct = current / max;
  if (pct > 0.5) return '#22c55e';
  if (pct > 0.2) return '#f59e0b';
  return '#dc2626';
}

export function TeamBar({ team, readonly: isReadonly = false, onReorder, layout = 'strip', onPokemonTap }: TeamBarProps) {
  const [hovered, setHovered]       = useState<{ pokemon: PokemonInstance; pokemonIdx: number; anchor: { x: number; y: number } } | null>(null);
  const [dragFrom, setDragFrom]     = useState<number | null>(null);
  const containerRef                 = useRef<HTMLDivElement>(null);

  const slots = Array.from({ length: 6 }, (_, i) => team[i] ?? null);

  function handleMouseEnter(pokemon: PokemonInstance, pokemonIdx: number, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHovered({ pokemon, pokemonIdx, anchor: { x: rect.left + rect.width / 2, y: rect.top } });
  }

  function handleDragStart(idx: number) {
    if (isReadonly) return;
    setDragFrom(idx);
  }

  function handleDrop(idx: number) {
    if (isReadonly || dragFrom === null || dragFrom === idx) return;
    onReorder?.(dragFrom, idx);
    setDragFrom(null);
  }

  return (
    <>
      <div
        ref={containerRef}
        className={layout === 'grid' ? 'grid grid-cols-3 gap-1' : 'flex flex-row gap-1'}
        onMouseLeave={() => setHovered(null)}
      >
        {slots.map((pokemon, i) => (
          <div
            key={i}
            className={[
              'flex flex-col items-center gap-0.5 p-1 border-2 relative',
              pokemon
                ? pokemon.isShiny
                  ? 'border-[#f8d030]'
                  : 'border-[#c8a96e]'
                : 'border-[#5a6a4a]/30 bg-[#161d14]',
              !isReadonly && pokemon ? 'cursor-grab' : '',
            ].join(' ')}
            style={{ width: 44, minHeight: 44 }}
            draggable={!isReadonly && !!pokemon}
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            onMouseEnter={pokemon ? (e) => handleMouseEnter(pokemon, i, e) : undefined}
            onClick={pokemon && onPokemonTap ? () => onPokemonTap(i) : undefined}
          >
            {pokemon ? (
              <>
                <img
                  src={pokemon.spriteUrl}
                  alt={pokemon.nickname ?? pokemon.name}
                  width={32}
                  height={32}
                  style={{
                    imageRendering: 'pixelated',
                    filter: pokemon.currentHp <= 0 ? 'grayscale(1)' : 'none',
                  }}
                />
                {/* Shiny star indicator */}
                {pokemon.isShiny && (
                  <span
                    className="absolute top-0 right-0 leading-none pointer-events-none"
                    style={{ color: '#f8d030', fontSize: 10 }}
                    aria-label="Shiny"
                  >
                    ✦
                  </span>
                )}
                {/* HP indicator dot */}
                <div
                  className="w-2 h-2 border border-[#050805]"
                  style={{
                    backgroundColor: pokemon.currentHp <= 0 ? '#555' : hpDotColor(pokemon.currentHp, pokemon.maxHp),
                  }}
                />
              </>
            ) : (
              <div className="w-8 h-8 opacity-20 border border-[#5a6a4a]/20" />
            )}
          </div>
        ))}
      </div>

      <TeamHoverCard
        pokemon={hovered?.pokemon ?? null}
        pokemonIdx={hovered?.pokemonIdx ?? 0}
        anchor={hovered?.anchor ?? null}
      />
    </>
  );
}
