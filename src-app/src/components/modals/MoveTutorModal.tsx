import { useUIStore } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import { useGame } from '@/hooks/useGame';
import type { PokemonInstance } from '@/types/pokemon';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { PixelButton } from '@/components/ui/PixelButton';

export function MoveTutorModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  const team       = useGameStore((s) => s.team);
  const setTeam    = useGameStore((s) => s.setTeam);
  const { send }   = useGame();

  function handleUpgrade(pokemon: PokemonInstance) {
    if (pokemon.moveTier >= 2) return;
    const idx = team.indexOf(pokemon);
    if (idx === -1) return;

    const upgraded: PokemonInstance = {
      ...pokemon,
      moveTier: Math.min(2, pokemon.moveTier + 1) as 0 | 1 | 2,
    };
    const newTeam = [...team];
    newTeam[idx] = upgraded;
    setTeam(newTeam);
    closeModal();
    send({ type: 'CONTINUE' });
  }

  const TIER_LABEL: Record<0 | 1 | 2, string> = {
    0: 'TIER 1→2',
    1: 'TIER 2→3',
    2: 'MAXED',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="w-full max-w-[480px] bg-[#0d110e] border-t-4 border-[#c8a96e] shadow-[0_-4px_0_#050805] p-6 pb-8 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="font-pixel text-[12px] text-[#f0ead6] mb-1">MOVE TUTOR</div>
        <div className="font-terminal text-[18px] text-[#c8a96e] mb-4">
          Choose a Pokemon to upgrade its move tier.
        </div>

        {/* Team list */}
        <div className="flex flex-col gap-3 mb-6">
          {team.map((pokemon, i) => {
            const maxed = pokemon.moveTier >= 2;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <PokemonCard
                    pokemon={pokemon}
                    compact
                    onClick={maxed ? undefined : () => handleUpgrade(pokemon)}
                  />
                </div>
                <div
                  className={[
                    'font-pixel text-[8px] whitespace-nowrap px-2 py-1 border border-[#c8a96e]',
                    maxed
                      ? 'text-[#c8a96e] bg-[#161d14]'
                      : 'text-[#f0ead6] bg-[#2563eb]',
                  ].join(' ')}
                >
                  {maxed ? 'MAXED!' : TIER_LABEL[pokemon.moveTier]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancel */}
        <PixelButton variant="ghost" onClick={closeModal} className="w-full">
          LEAVE
        </PixelButton>
      </div>
    </div>
  );
}
