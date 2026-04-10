import type { PokemonType } from '@/types';

interface TypeBadgeProps {
  type: PokemonType;
}

const TYPE_COLORS: Record<PokemonType, string> = {
  Normal:   '#a8a878',
  Fire:     '#ff7c5c',
  Water:    '#6ab4f5',
  Electric: '#f8d030',
  Grass:    '#78c850',
  Ice:      '#98d8d8',
  Fighting: '#c03028',
  Poison:   '#a040a0',
  Ground:   '#e0c068',
  Flying:   '#a890f0',
  Psychic:  '#f85888',
  Bug:      '#a8b820',
  Rock:     '#b8a038',
  Ghost:    '#705898',
  Dragon:   '#7038f8',
  Dark:     '#705848',
  Steel:    '#b8b8d0',
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const bg = TYPE_COLORS[type] ?? '#a8a878';

  return (
    <span
      className="type-badge"
      style={{ backgroundColor: bg, boxShadow: '2px 2px 0 #050805' }}
    >
      {type}
    </span>
  );
}
