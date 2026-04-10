import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { PixelButton } from '@/components/ui/PixelButton';
import type { PokemonInstance } from '@/types/pokemon';

export function SwapScreen() {
  const { state, send } = useGame();
  const team = useGameStore(s => s.team);

  // The incoming Pokemon is choices[0]
  const incoming = (state.context.choices as unknown[])[0] as PokemonInstance | undefined;

  function handleSwap(idx: number) {
    if (!incoming) return;
    send({ type: 'MAKE_CHOICE', index: idx, pokemon: incoming });
  }

  return (
    <div className="screen-default flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#161d14] border-b-2 border-[#c8a96e] px-4 py-3 flex-shrink-0">
        <h1 className="font-pixel text-[12px] text-[#f0ead6] text-center leading-[1.8]">
          Team is full! Swap a member?
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-6 overflow-y-auto">
        {/* Incoming Pokemon */}
        {incoming && (
          <div className="flex flex-col items-center gap-2">
            <span className="font-terminal text-[20px] text-[#c8a96e]">New Pokemon</span>
            <PokemonCard pokemon={incoming} />
          </div>
        )}

        {/* VS divider */}
        <div className="font-pixel text-[14px] text-[#f0ead6] border-2 border-[#c8a96e] px-4 py-2 shadow-[4px_4px_0px_#050805]">
          VS
        </div>

        {/* Current team */}
        <div className="flex flex-col items-center gap-2 w-full">
          <span className="font-terminal text-[20px] text-[#c8a96e]">
            Click a team member to replace them
          </span>
          <div className="flex flex-row gap-3 flex-wrap justify-center">
            {team.map((pokemon, idx) => (
              <PokemonCard
                key={`${pokemon.speciesId}-${idx}`}
                pokemon={pokemon}
                onClick={() => handleSwap(idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cancel */}
      <div className="bg-[#161d14] border-t-2 border-[#c8a96e] px-4 py-3 flex justify-end flex-shrink-0">
        <PixelButton variant="ghost" onClick={() => send({ type: 'SKIP' })}>
          Cancel
        </PixelButton>
      </div>
    </div>
  );
}
