import { useState } from 'react';
import type { PokemonInstance } from '@/types';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { useGame } from '@/hooks/useGame';

export function StarterSelectScreen() {
  const { state, send } = useGame();
  const choices = (state.context.choices as PokemonInstance[]).filter(
    (c): c is PokemonInstance => 'speciesId' in c,
  );
  const [selected, setSelected] = useState<PokemonInstance | null>(null);

  const isLoading = choices.length === 0;

  function handleSelect(pokemon: PokemonInstance) {
    if (selected?.speciesId === pokemon.speciesId) {
      // Second click on already-selected card confirms the choice
      send({ type: 'SELECT_STARTER', starter: pokemon });
    } else {
      setSelected(pokemon);
    }
  }

  return (
    <div className="screen-default flex flex-col items-center justify-center h-full px-4 gap-8 overflow-y-auto">
      <h2 className="font-pixel text-[12px] text-[#f0ead6] leading-[1.8] text-center">
        Choose your starter!
      </h2>

      {isLoading ? (
        <div className="flex items-center gap-1 font-terminal text-[24px] text-[#c8a96e]">
          Loading
          <span className="animate-blink ml-0.5">_</span>
        </div>
      ) : (
        <>
          <div className="flex gap-4 justify-center flex-wrap">
            {choices.map((pokemon) => (
              <div key={pokemon.speciesId} className="relative">
                <PokemonCard
                  pokemon={pokemon}
                  onClick={() => handleSelect(pokemon)}
                  selected={selected?.speciesId === pokemon.speciesId}
                />
                {pokemon.isShiny && (
                  <div className="absolute top-1 right-1 font-pixel text-[8px] text-[#f8d030] bg-black/70 px-1 py-0.5 border border-[#f8d030]">
                    SHINY
                  </div>
                )}
              </div>
            ))}
          </div>

          {selected && (
            <p className="font-terminal text-[20px] text-[#c8a96e] text-center">
              Click{' '}
              <span className="text-[#f0ead6] font-terminal text-[20px]">
                {selected.nickname ?? selected.name}
              </span>{' '}
              again to confirm, or choose another.
            </p>
          )}
        </>
      )}
    </div>
  );
}
