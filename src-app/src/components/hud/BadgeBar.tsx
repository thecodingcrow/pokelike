interface BadgeBarProps {
  badges: number;
}

const BADGE_NAMES = ['Boulder', 'Cascade', 'Thunder', 'Rainbow', 'Soul', 'Marsh', 'Volcano', 'Earth'];

export function BadgeBar({ badges }: BadgeBarProps) {
  return (
    <div className="flex flex-row gap-1.5">
      {BADGE_NAMES.map((name, i) => {
        const n = i + 1;
        const earned = n <= badges;

        return (
          <div
            key={n}
            className="flex flex-col items-center gap-0.5"
            title={`${name} Badge${earned ? ' (earned)' : ''}`}
          >
            <div
              className="w-7 h-7 flex items-center justify-center border border-[#c8a96e]/40"
              style={{
                backgroundColor: earned ? '#c8a96e' : '#2a3020',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            >
              {earned && (
                <span className="text-[8px] font-bold text-[#050805] drop-shadow-[0_1px_0_#050805]">
                  {n}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
