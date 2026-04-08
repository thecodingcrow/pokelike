import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { BadgeBar } from '@/components/hud/BadgeBar';
import { TeamBar } from '@/components/hud/TeamBar';
import { PixelButton } from '@/components/ui/PixelButton';

export function GameOverScreen() {
  const { send } = useGame();
  const badges = useGameStore((s) => s.badges);
  const currentMap = useGameStore((s) => s.currentMap);
  const team = useGameStore((s) => s.team);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh bg-game-bg px-4 gap-8"
      style={{ filter: 'saturate(0.6) brightness(0.85)' }}
    >
      {/* Title */}
      <h1
        className="font-pixel text-[20px] leading-[1.8] text-neon-red text-center"
        style={{ textShadow: '0 0 8px #dc2626, 0 0 20px #dc262680' }}
      >
        GAME OVER
      </h1>

      {/* Stats panel */}
      <div className="bg-game-panel border-2 border-white shadow-[4px_4px_0px_#000] p-6 flex flex-col gap-4 w-full max-w-[320px]">

        {/* Badges */}
        <div className="flex flex-col gap-2">
          <p className="font-pixel text-[10px] text-[#94a3b8]">BADGES: {badges}/8</p>
          <BadgeBar badges={badges} />
        </div>

        {/* Maps cleared */}
        <div className="border-t border-white/10 pt-3">
          <p className="font-pixel text-[10px] text-[#94a3b8]">
            MAPS CLEARED:{' '}
            <span className="text-white">{currentMap}</span>
          </p>
        </div>
      </div>

      {/* Final team */}
      <div className="flex flex-col items-center gap-3">
        <p className="font-pixel text-[10px] text-[#94a3b8]">FINAL TEAM:</p>
        <TeamBar team={team} readonly />
      </div>

      {/* Try Again */}
      <PixelButton
        variant="primary"
        onClick={() => send({ type: 'RESTART' })}
      >
        TRY AGAIN
      </PixelButton>
    </div>
  );
}
