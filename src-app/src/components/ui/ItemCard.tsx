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
        'bg-[#121827] border-2 p-3 shadow-[4px_4px_0px_#000]',
        selected ? 'border-yellow-400' : 'border-white',
        onClick ? 'cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000] transition-none' : '',
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
      <div className="font-pixel text-[10px] text-white text-center truncate">
        {item.name.toUpperCase()}
      </div>

      {/* Description */}
      <div className="font-terminal text-[16px] text-[#94a3b8] text-center mt-1 leading-tight">
        {item.desc}
      </div>

      {/* Usable badge */}
      {item.isUsable && (
        <div className="mt-2 flex justify-center">
          <span className="font-pixel text-[8px] text-black bg-[#22c55e] border border-white px-1 py-0.5">
            USABLE
          </span>
        </div>
      )}
    </div>
  );
}
