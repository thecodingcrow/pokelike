import { useState } from 'react';
import type { Item } from '@/types/items';

interface ItemBarProps {
  items: Item[];
  onItemClick: (item: Item, idx: number) => void;
}

export function ItemBar({ items, onItemClick }: ItemBarProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  function handleMouseEnter(item: Item, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ text: item.name, x: rect.left + rect.width / 2, y: rect.top });
  }

  return (
    <>
      <div className="flex flex-row gap-1">
        {items.map((item, i) => {
          const slug = item.id.replace(/_/g, '-');
          const src  = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

          return (
            <button
              key={`${item.id}-${i}`}
              className="w-8 h-8 flex items-center justify-center border border-white/40 bg-[#1e2433] hover:border-white transition-none cursor-pointer"
              onClick={() => onItemClick(item, i)}
              onMouseEnter={(e) => handleMouseEnter(item, e)}
              onMouseLeave={() => setTooltip(null)}
              title={item.name}
            >
              <img
                src={src}
                alt={item.name}
                width={24}
                height={24}
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const span = e.currentTarget.nextSibling as HTMLElement | null;
                  if (span) span.style.display = 'block';
                }}
              />
              <span className="text-sm hidden">{item.icon}</span>
            </button>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none font-pixel text-[8px] text-white bg-[#121827] border border-white px-2 py-1 shadow-[2px_2px_0px_#000] -translate-x-1/2"
          style={{ left: tooltip.x, top: tooltip.y - 28 }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
}
