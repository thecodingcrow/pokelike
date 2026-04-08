import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { BadgeBar } from '@/components/hud/BadgeBar';
import { PixelButton } from '@/components/ui/PixelButton';

const BADGE_NAMES = [
  'Boulder', 'Cascade', 'Thunder', 'Rainbow',
  'Soul', 'Marsh', 'Volcano', 'Earth',
] as const;

export function BadgeScreen() {
  const { send } = useGame();
  const badges = useGameStore((s) => s.badges);

  // badges has already been incremented — show the one just earned
  const badgeIndex = badges - 1; // 0-based index
  const badgeN = badges;         // 1-based sprite index
  const badgeName = BADGE_NAMES[badgeIndex] ?? 'Badge';
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${badgeN}.png`;

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-game-bg px-4 gap-8">
      {/* Header */}
      <h1
        className="font-pixel text-[16px] leading-[1.8] text-neon-green text-center"
        style={{ textShadow: '0 0 8px #22c55e, 0 0 16px #22c55e60' }}
      >
        Badge Earned!
      </h1>

      {/* Badge sprite */}
      <div className="flex flex-col items-center gap-4">
        <div className="border-2 border-white shadow-[4px_4px_0px_#000] bg-game-panel p-6">
          <img
            src={spriteUrl}
            alt={`${badgeName} Badge`}
            width={80}
            height={80}
            style={{ imageRendering: 'pixelated', width: 80, height: 80 }}
          />
        </div>

        {/* Badge name */}
        <p className="font-pixel text-[12px] text-white text-center">
          {badgeName} Badge
        </p>
      </div>

      {/* BadgeBar — all 8 slots, newly earned one lights up */}
      <div className="flex flex-col items-center gap-2">
        <p className="font-terminal text-[20px] text-[#94a3b8]">
          Badges collected: {badges}/8
        </p>
        <BadgeBar badges={badges} />
      </div>

      {/* Continue */}
      <PixelButton
        variant="secondary"
        onClick={() => send({ type: 'CONTINUE' })}
      >
        NEXT MAP
      </PixelButton>
    </div>
  );
}
