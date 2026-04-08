interface BadgeBarProps {
  badges: number;
}

const BADGE_COUNT = 8;

export function BadgeBar({ badges }: BadgeBarProps) {
  return (
    <div className="flex flex-row gap-1">
      {Array.from({ length: BADGE_COUNT }, (_, i) => {
        const n       = i + 1;
        const earned  = n <= badges;
        const src     = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${n}.png`;

        return (
          <div
            key={n}
            className={[
              'w-8 h-8 flex items-center justify-center',
              earned ? '' : 'opacity-20 grayscale',
            ].join(' ')}
            title={`Badge ${n}${earned ? ' (earned)' : ''}`}
          >
            <img
              src={src}
              alt={`Badge ${n}`}
              width={32}
              height={32}
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        );
      })}
    </div>
  );
}
