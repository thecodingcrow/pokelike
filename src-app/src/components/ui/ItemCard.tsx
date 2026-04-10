import { useState } from 'react';
import type { Item } from '@/types/items';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  selected?: boolean;
}

export function ItemCard({ item, onClick, selected }: ItemCardProps) {
  const [imgError, setImgError] = useState(false);

  const slug       = item.id.replace(/_/g, '-');
  const spriteUrl  = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

  return (
    <div
      className={[
        'bg-[#161d14] border-2 p-3 shadow-[3px_3px_0px_#050805]',
        selected ? 'border-[#e8c97e] shadow-[0_0_12px_rgba(200,169,110,0.3)]' : 'border-[#c8a96e]',
        onClick ? 'cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-3px] hover:shadow-[5px_5px_0px_#050805] transition-all duration-150 ease-out' : '',
      ].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Item sprite or fallback */}
      <div className="flex justify-center mb-2">
        {!imgError ? (
          <img
            src={spriteUrl}
            alt={item.name}
            className="w-8 h-8"
            style={{ imageRendering: 'pixelated' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl leading-none">{item.icon}</span>
        )}
      </div>

      {/* Name */}
      <div className="font-pixel text-[10px] text-[#f0ead6] text-center truncate">
        {item.name.toUpperCase()}
      </div>

      {/* Description */}
      <div className="font-terminal text-[16px] text-[#c8a96e] text-center mt-1 leading-tight">
        {item.desc}
      </div>

      {/* Usable badge */}
      {item.isUsable && (
        <div className="mt-2 flex justify-center">
          <span className="font-pixel text-[8px] text-[#050805] bg-[#22c55e] border border-[#c8a96e] px-1 py-0.5">
            USABLE
          </span>
        </div>
      )}
    </div>
  );
}
