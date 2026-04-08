import { useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { TeamBar } from '@/components/hud/TeamBar';
import type { PokemonInstance } from '@/types/pokemon';

export function CatchScreen() {
  const { state, send } = useGame();
  const team = useGameStore(s => s.team);

  const [selected, setSelected] = useState<PokemonInstance | null>(null);

  // Filter choices to PokemonInstance[] — items have an `id` string but no `speciesId`
  const choices = (state.context.choices as unknown[]).filter(
    (c): c is PokemonInstance => c !== null && typeof c === 'object' && 'speciesId' in (c as object),
  );

  function handleCardClick(pokemon: PokemonInstance) {
    if (selected?.speciesId === pokemon.speciesId && selected?.level === pokemon.level) {
      // Second click = confirm
      send({ type: 'MAKE_CHOICE', pokemon });
    } else {
      setSelected(pokemon);
    }
  }

  function handleConfirm() {
    if (selected) send({ type: 'MAKE_CHOICE', pokemon: selected });
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-[#121827] border-b-2 border-white px-4 py-3 flex-shrink-0">
        <h1 className="font-pixel text-[12px] text-white text-center leading-[1.8]">
          Choose a Pokemon to catch!
        </h1>
      </div>

      {/* Cards */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="flex flex-row gap-4 flex-wrap justify-center">
          {choices.map((pokemon, i) => (
            <PokemonCard
              key={`${pokemon.speciesId}-${i}`}
              pokemon={pokemon}
              selected={
                selected !== null &&
                selected.speciesId === pokemon.speciesId &&
                selected.level === pokemon.level
              }
              onClick={() => handleCardClick(pokemon)}
            />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-[#121827] border-t-2 border-white px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
        {/* Team display */}
        <TeamBar team={team} readonly />

        <div className="flex gap-3">
          {selected && (
            <PixelButton variant="primary" onClick={handleConfirm}>
              Catch!
            </PixelButton>
          )}
          <PixelButton variant="ghost" onClick={() => send({ type: 'SKIP' })}>
            Flee
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
