import { useGame } from '@/hooks/useGame';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { PixelButton } from '@/components/ui/PixelButton';
import type { PokemonInstance } from '@/types/pokemon';

export function ShinyScreen() {
  const { state, send } = useGame();

  const shinyPokemon = (state.context.choices as unknown[])[0] as PokemonInstance | undefined;

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-[#121827] border-b-2 border-white px-4 py-3 flex-shrink-0">
        <h1 className="font-pixel text-[12px] text-yellow-400 text-center leading-[1.8]">
          A shiny Pokemon!
        </h1>
        <p className="font-terminal text-[20px] text-[#94a3b8] text-center mt-1">
          ✦ Rare encounter! ✦
        </p>
      </div>

      {/* Center — shiny card with sparkle */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        {shinyPokemon ? (
          <div className="shiny-sparkle">
            <PokemonCard pokemon={shinyPokemon} />
          </div>
        ) : (
          <span className="font-terminal text-[22px] text-white animate-blink">
            Loading...
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="bg-[#121827] border-t-2 border-white px-4 py-3 flex justify-center gap-4 flex-shrink-0">
        <PixelButton
          variant="primary"
          disabled={!shinyPokemon}
          onClick={() => {
            if (shinyPokemon) send({ type: 'MAKE_CHOICE', pokemon: shinyPokemon });
          }}
        >
          Accept
        </PixelButton>
        <PixelButton variant="ghost" onClick={() => send({ type: 'SKIP' })}>
          Skip
        </PixelButton>
      </div>
    </div>
  );
}
