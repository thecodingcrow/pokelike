import { useState } from 'react';

interface TrainerSpriteProps {
  name: string;
  size?: number;
  local?: boolean;
}

export function TrainerSprite({ name, size = 80, local = false }: TrainerSpriteProps) {
  const [error, setError] = useState(false);

  const src = local
    ? `/sprites/${name}.png`
    : `https://play.pokemonshowdown.com/sprites/trainers/${name}.png`;

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-[#161d14] border-2 border-[#c8a96e] font-pixel text-[#f0ead6]"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Trainer ${name}`}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}
