import { useUIStore } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import type { Item } from '@/types/items';
import type { PokemonInstance } from '@/types/pokemon';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { PixelButton } from '@/components/ui/PixelButton';
import { GEN1_EVOLUTIONS } from '@/data/evolutions';
import { applyEvolution } from '@/systems/evolution';
import { calcHp } from '@/systems/battle-calc';

export function UsableItemModal() {
  const modalProps  = useUIStore((s) => s.modalProps);
  const closeModal  = useUIStore((s) => s.closeModal);
  const team        = useGameStore((s) => s.team);
  const setTeam     = useGameStore((s) => s.setTeam);
  const removeItem  = useGameStore((s) => s.removeItem);

  const item    = modalProps.item as Item | undefined;
  const bagIdx  = modalProps.bagIdx as number | undefined;

  if (!item || bagIdx === undefined) return null;

  /** Which Pokemon are eligible targets for this item? */
  function getEligible(): PokemonInstance[] {
    if (item!.id === 'max_revive')  return team.filter((p) => p.currentHp <= 0);
    if (item!.id === 'rare_candy')  return team;
    if (item!.id === 'moon_stone')  return team.filter((p) => GEN1_EVOLUTIONS[p.speciesId] !== undefined);
    return team;
  }

  const eligible = getEligible();

  async function handleUse(pokemon: PokemonInstance) {
    const idx = team.indexOf(pokemon);
    if (idx === -1) return;

    let newTeam = [...team];

    if (item!.id === 'max_revive') {
      newTeam[idx] = { ...pokemon, currentHp: pokemon.maxHp };
    } else if (item!.id === 'rare_candy') {
      const newLevel = pokemon.level + 3;
      const newMaxHp = calcHp(pokemon.baseStats.hp, newLevel);
      newTeam[idx] = { ...pokemon, level: newLevel, maxHp: newMaxHp };
    } else if (item!.id === 'moon_stone') {
      const evo = GEN1_EVOLUTIONS[pokemon.speciesId];
      if (evo) {
        const evolved = await applyEvolution(pokemon, evo);
        if (evolved) newTeam[idx] = evolved;
      }
    }

    setTeam(newTeam);
    removeItem(bagIdx!);
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
        <div className="font-pixel text-[12px] text-[#f0ead6] mb-1">{item.name.toUpperCase()}</div>
        <div className="font-terminal text-[18px] text-[#c8a96e] mb-4">{item.desc}</div>

        {/* Team list */}
        <div className="font-pixel text-[10px] text-[#c8a96e] mb-3">USE ON:</div>
        <div className="flex flex-col gap-3 mb-6">
          {eligible.length === 0 && (
            <div className="font-terminal text-[18px] text-[#c8a96e]">No valid targets.</div>
          )}
          {eligible.map((pokemon, i) => (
            <PokemonCard
              key={i}
              pokemon={pokemon}
              compact
              onClick={() => { void handleUse(pokemon); }}
            />
          ))}
        </div>

        {/* Cancel */}
        <PixelButton variant="ghost" onClick={closeModal} className="w-full">
          CANCEL
        </PixelButton>
      </div>
    </div>
  );
}
