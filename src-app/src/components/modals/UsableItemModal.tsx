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
      <div className="w-full max-w-[480px] bg-[#0a0a0f] border-t-4 border-white shadow-[0_-4px_0_#000] p-6 pb-8 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="font-pixel text-[12px] text-white mb-1">{item.name.toUpperCase()}</div>
        <div className="font-terminal text-[18px] text-[#94a3b8] mb-4">{item.desc}</div>

        {/* Team list */}
        <div className="font-pixel text-[10px] text-[#94a3b8] mb-3">USE ON:</div>
        <div className="flex flex-col gap-3 mb-6">
          {eligible.length === 0 && (
            <div className="font-terminal text-[18px] text-[#94a3b8]">No valid targets.</div>
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
