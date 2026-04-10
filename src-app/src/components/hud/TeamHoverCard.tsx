import type { PokemonInstance } from '@/types/pokemon';
import { PokemonCard } from '@/components/ui/PokemonCard';

interface TeamHoverCardProps {
  pokemon: PokemonInstance | null;
  anchor: { x: number; y: number } | null;
}

export function TeamHoverCard({ pokemon, anchor }: TeamHoverCardProps) {
  if (!pokemon || !anchor) return null;

  // On mobile (<640px) touch events can fire onMouseEnter-equivalent — suppress
  // the card entirely since it overlaps the map and isn't useful during navigation.
  if (typeof window !== 'undefined' && window.innerWidth < 640) return null;

  // Position above or below based on vertical space
  const spaceAbove = anchor.y;
  const cardHeight = 240;
  const placeAbove = spaceAbove > cardHeight;

  const top = placeAbove ? anchor.y - cardHeight - 8 : anchor.y + 8;

  return (
    <div
      className="fixed z-50 w-48 pointer-events-none"
      style={{ left: anchor.x - 96, top }}
    >
      <PokemonCard pokemon={pokemon} />
    </div>
  );
}
