import { useGame } from '@/hooks/useGame';
import { ItemCard } from '@/components/ui/ItemCard';
import type { Item } from '@/types/items';

export function ItemScreen() {
  const { state, send } = useGame();

  // Filter choices to Item[] — items have `id`, `name`, `desc`, `icon`, `isUsable`
  const choices = (state.context.choices as unknown[]).filter(
    (c): c is Item =>
      c !== null &&
      typeof c === 'object' &&
      'isUsable' in (c as object) &&
      !('speciesId' in (c as object)),
  );

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-[#121827] border-b-2 border-white px-4 py-3 flex-shrink-0">
        <h1 className="font-pixel text-[12px] text-white text-center leading-[1.8]">
          Choose an item!
        </h1>
      </div>

      {/* Cards */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="flex flex-row gap-6 flex-wrap justify-center">
          {choices.map((item, i) => (
            <ItemCard
              key={`${item.id}-${i}`}
              item={item}
              onClick={() => send({ type: 'MAKE_CHOICE', item })}
            />
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="bg-[#121827] border-t-2 border-white px-4 py-3 flex-shrink-0 text-center">
        <span className="font-terminal text-[18px] text-[#94a3b8]">
          You must pick one — no skipping!
        </span>
      </div>
    </div>
  );
}
