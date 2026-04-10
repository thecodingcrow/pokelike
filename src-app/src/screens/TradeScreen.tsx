import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { PixelButton } from '@/components/ui/PixelButton';
import type { PokemonInstance } from '@/types/pokemon';

export function TradeScreen() {
  const { state, send } = useGame();
  const team = useGameStore(s => s.team);

  // The offered Pokemon is choices[0]
  const offered = (state.context.choices as unknown[])[0] as PokemonInstance | undefined;

  function handleGive(idx: number) {
    send({ type: 'MAKE_CHOICE', index: idx });
  }

  return (
    <div className="screen-default flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#161d14] border-b-2 border-[#c8a96e] px-4 py-3 flex-shrink-0">
        <h1 className="font-pixel text-[12px] text-[#f0ead6] text-center leading-[1.8]">
          Trade offer!
        </h1>
        <p className="font-terminal text-[20px] text-[#c8a96e] text-center mt-1">
          Give one of your Pokemon and receive a stronger one!
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-6 gap-6 overflow-y-auto">
        {/* Offered Pokemon */}
        {offered && (
          <div className="flex flex-col items-center gap-2">
            <span className="font-terminal text-[20px] text-[#22c55e]">You will receive:</span>
            <PokemonCard pokemon={offered} />
          </div>
        )}

        {/* Divider */}
        <div className="w-full border-t-2 border-[#c8a96e]/20" />

        {/* Give section */}
        <div className="flex flex-col items-center gap-3 w-full">
          <span className="font-terminal text-[20px] text-[#c8a96e]">Give:</span>
          <div className="flex flex-col gap-2 w-full max-w-sm">
            {team.map((pokemon, idx) => {
              const displayName = pokemon.nickname ?? pokemon.name;
              return (
                <button
                  key={`${pokemon.speciesId}-${idx}`}
                  className={[
                    'bg-[#161d14] border-2 border-[#c8a96e] p-2',
                    'flex items-center gap-3',
                    'shadow-[4px_4px_0px_#050805]',
                    'cursor-pointer',
                    'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#050805]',
                    'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
                    'transition-none text-left w-full',
                  ].join(' ')}
                  onClick={() => handleGive(idx)}
                >
                  <img
                    src={pokemon.spriteUrl}
                    alt={displayName}
                    className="w-10 h-10 flex-shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-pixel text-[10px] text-[#f0ead6] truncate">
                      {displayName.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm text-[#c8a96e]">
                      Lv. {pokemon.level}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Decline */}
      <div className="bg-[#161d14] border-t-2 border-[#c8a96e] px-4 py-3 flex justify-end flex-shrink-0">
        <PixelButton variant="ghost" onClick={() => send({ type: 'SKIP' })}>
          Decline
        </PixelButton>
      </div>
    </div>
  );
}
