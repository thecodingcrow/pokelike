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
      <div className="w-full max-w-[480px] bg-[#0a0a0f] border-t-4 border-white shadow-[0_-4px_0_#000] p-6 pb-8 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="font-pixel text-[12px] text-white mb-1">EEVEE IS EVOLVING!</div>
        <div className="font-terminal text-[18px] text-[#94a3b8] mb-6">Choose a form:</div>

        {/* Evolution choices */}
        <div className="flex gap-3 justify-center mb-6">
          {EEVEE_EVOLUTIONS.map((evo) => (
            <button
              key={evo.into}
              onClick={() => { void handleChoose(evo); }}
              className="flex flex-col items-center bg-[#121827] border-2 border-white p-4 cursor-pointer shadow-[4px_4px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] transition-none flex-1"
            >
              <img
                src={`${SPRITE_BASE}/${evo.into}.png`}
                alt={evo.name}
                className="w-16 h-16"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="font-pixel text-[9px] text-white mt-2">
                {evo.name.toUpperCase()}
              </div>
              <div className="font-terminal text-[16px] text-[#94a3b8] mt-1">
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
