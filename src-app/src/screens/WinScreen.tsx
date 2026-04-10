import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { TrainerSprite } from '@/components/ui/TrainerSprite';
import { PokemonCard } from '@/components/ui/PokemonCard';
import { PixelButton } from '@/components/ui/PixelButton';

export function WinScreen() {
  const { send } = useGame();
  const team = useGameStore((s) => s.team);
  const trainer = useGameStore((s) => s.trainer);
  const hardMode = useGameStore((s) => s.hardMode);
  const openModal = useUIStore((s) => s.openModal);

  return (
    <div className="screen-default flex flex-col items-center justify-center h-full px-4 gap-6 py-8 overflow-y-auto">

      {/* Title */}
      <h1
        className="font-pixel text-[20px] leading-[1.8] text-neon-green text-center"
        style={{ textShadow: '0 0 8px #22c55e, 0 0 20px #22c55e80' }}
      >
        CHAMPION!
      </h1>

      {/* Trainer sprite */}
      <TrainerSprite name={trainer} size={128} />

      {/* Hall of Fame subtitle */}
      <div className="flex flex-col items-center gap-1">
        <p className="font-pixel text-[10px] text-[#c8a96e] text-center">
          HALL OF FAME
        </p>
        <p className="font-terminal text-[20px] text-[#22c55e] text-center">
          Registered in Hall of Fame!
        </p>
      </div>

      {/* Stats */}
      <div className="bg-game-panel border-2 border-[#c8a96e] shadow-[4px_4px_0px_#050805] px-6 py-3 flex flex-col gap-1 w-full max-w-[320px]">
        <p className="font-pixel text-[10px] text-[#c8a96e]">
          TEAM SIZE: <span className="text-[#f0ead6]">{team.length}</span>
        </p>
        <p className="font-pixel text-[10px] text-[#c8a96e]">
          HARD MODE: <span className="text-[#f0ead6]">{hardMode ? 'YES' : 'NO'}</span>
        </p>
      </div>

      {/* Final team grid — 2 columns */}
      {team.length > 0 && (
        <div className="w-full max-w-[360px]">
          <p className="font-pixel text-[10px] text-[#c8a96e] mb-3 text-center">
            FINAL TEAM
          </p>
          <div className="grid grid-cols-2 gap-2">
            {team.map((pokemon, i) => (
              <PokemonCard key={i} pokemon={pokemon} compact />
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-[260px]">
        <PixelButton
          variant="ghost"
          className="w-full justify-center"
          onClick={() => openModal('hall-of-fame')}
        >
          VIEW HALL OF FAME
        </PixelButton>

        <PixelButton
          variant="primary"
          className="w-full justify-center"
          onClick={() => send({ type: 'RESTART' })}
        >
          PLAY AGAIN
        </PixelButton>
      </div>
    </div>
  );
}
