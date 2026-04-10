import { useUIStore } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import type { Item } from '@/types/items';
import { ItemCard } from '@/components/ui/ItemCard';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { PixelButton } from '@/components/ui/PixelButton';

export function ItemEquipModal() {
  const modalProps  = useUIStore((s) => s.modalProps);
  const closeModal  = useUIStore((s) => s.closeModal);
  const team        = useGameStore((s) => s.team);
  const equipItem   = useGameStore((s) => s.equipItem);

  const item = modalProps.item as Item | undefined;
  if (!item) return null;

  function handleEquip(pokemonIdx: number) {
    equipItem(item!, pokemonIdx);
    closeModal();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="w-full max-w-[480px] bg-[#0d110e] border-t-4 border-[#c8a96e] shadow-[0_-4px_0_#050805] p-6 pb-8 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="font-pixel text-[12px] text-[#f0ead6] mb-4">EQUIP ITEM</div>

        {/* Item preview */}
        <div className="mb-4 max-w-[160px]">
          <ItemCard item={item} />
        </div>

        {/* Team list */}
        <div className="font-pixel text-[10px] text-[#c8a96e] mb-3">EQUIP TO:</div>
        <div className="flex flex-col gap-3 mb-6">
          {team.map((pokemon, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1">
                <PokemonCard pokemon={pokemon} compact onClick={() => handleEquip(idx)} />
              </div>
              {pokemon.heldItem && (
                <div className="font-terminal text-[16px] text-[#c8a96e] whitespace-nowrap">
                  swap: {pokemon.heldItem.name}
                </div>
              )}
            </div>
          ))}
          {team.length === 0 && (
            <div className="font-terminal text-[18px] text-[#c8a96e]">No Pokemon in team.</div>
          )}
        </div>

        {/* Keep in bag */}
        <PixelButton variant="ghost" onClick={closeModal} className="w-full">
          KEEP IN BAG
        </PixelButton>
      </div>
    </div>
  );
}
