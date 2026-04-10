import { useUIStore } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import type { PokemonInstance } from '@/types/pokemon';
import { EEVEE_EVOLUTIONS } from '@/data/evolutions';
import type { BranchEvolutionEntry } from '@/data/evolutions';
import { applyEvolution } from '@/systems/evolution';
import { PixelButton } from '@/components/ui/PixelButton';

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export function EeveeChoiceModal() {
  const modalProps = useUIStore((s) => s.modalProps);
  const closeModal = useUIStore((s) => s.closeModal);
  const team       = useGameStore((s) => s.team);
  const setTeam    = useGameStore((s) => s.setTeam);

  // The Eevee instance is passed as a prop or we find it from team
  const eevee = (modalProps.pokemon as PokemonInstance | undefined)
    ?? team.find((p) => p.speciesId === 133);

  if (!eevee) return null;

  async function handleChoose(evo: BranchEvolutionEntry) {
    if (!eevee) return;
    const evolved = await applyEvolution(eevee, evo);
    if (!evolved) return;

    const idx = team.findIndex((p) => p.speciesId === 133);
    if (idx === -1) return;

    const newTeam = [...team];
    newTeam[idx] = evolved;
    setTeam(newTeam);
    closeModal();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="w-full max-w-[480px] bg-[#0d110e] border-t-4 border-[#c8a96e] shadow-[0_-4px_0_#050805] p-6 pb-8 max-h-[80vh] overflow-y-auto relative">
        {/* X close button */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center border-2 border-[#c8a96e] bg-[#161d14] text-[#f0ead6] font-pixel text-[12px] cursor-pointer z-10 shadow-[2px_2px_0px_#050805] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#050805]"
          aria-label="Close"
        >
          ✕
        </button>
        {/* Header */}
        <div className="font-pixel text-[12px] text-[#f0ead6] mb-1">EEVEE IS EVOLVING!</div>
        <div className="font-terminal text-[18px] text-[#c8a96e] mb-6">Choose a form:</div>

        {/* Evolution choices */}
        <div className="flex gap-3 justify-center mb-6">
          {EEVEE_EVOLUTIONS.map((evo) => (
            <button
              key={evo.into}
              onClick={() => { void handleChoose(evo); }}
              className="flex flex-col items-center bg-[#161d14] border-2 border-[#c8a96e] p-4 cursor-pointer shadow-[4px_4px_0px_#050805] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#050805] transition-none flex-1"
            >
              <img
                src={`${SPRITE_BASE}/${evo.into}.png`}
                alt={evo.name}
                className="w-16 h-16"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="font-pixel text-[9px] text-[#f0ead6] mt-2">
                {evo.name.toUpperCase()}
              </div>
              <div className="font-terminal text-[16px] text-[#c8a96e] mt-1">
                {evo.types.join('/')}
              </div>
            </button>
          ))}
        </div>

        {/* No cancel — choice is forced when Eevee evolves */}
        <PixelButton variant="ghost" onClick={closeModal} className="w-full">
          DECIDE LATER
        </PixelButton>
      </div>
    </div>
  );
}
