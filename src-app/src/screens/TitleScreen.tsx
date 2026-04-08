import { PixelButton } from '@/components/ui/PixelButton';
import { usePersistenceStore } from '@/store/persistenceStore';
import { useUIStore } from '@/store/uiStore';
import { useGame } from '@/hooks/useGame';

export function TitleScreen() {
  const { send } = useGame();
  const isPokedexComplete = usePersistenceStore((s) => s.isPokedexComplete());
  const openModal = useUIStore((s) => s.openModal);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-game-bg px-4">
      {/* Title */}
      <div className="mb-2 text-center">
        <h1
          className="font-pixel text-[20px] leading-[1.8] text-neon-red tracking-widest"
          style={{
            textShadow: '0 0 8px #dc2626, 0 0 16px #dc262660',
          }}
        >
          P O K E L I K E
        </h1>
        <p className="font-terminal text-[20px] text-[#94a3b8] mt-1">
          A Pokemon Roguelike
        </p>
      </div>

      {/* Decorative separator */}
      <div className="w-48 h-[2px] bg-white shadow-[0_0_4px_#dc2626] my-8" />

      {/* Main action buttons */}
      <div className="flex flex-col gap-4 w-full max-w-[220px]">
        <PixelButton
          variant="primary"
          className="w-full justify-center"
          onClick={() => send({ type: 'START_RUN', hardMode: false })}
        >
          NEW RUN
        </PixelButton>

        <PixelButton
          variant="secondary"
          className="w-full justify-center"
          disabled={!isPokedexComplete}
          onClick={() => send({ type: 'START_RUN', hardMode: true })}
          title={
            isPokedexComplete
              ? 'Start a Hard Mode run'
              : 'Complete the Pokedex to unlock Hard Mode'
          }
        >
          HARD MODE
        </PixelButton>
      </div>

      {/* Footer nav buttons */}
      <div className="mt-12 flex flex-col items-center gap-2">
        <div className="flex gap-3 flex-wrap justify-center">
          <PixelButton
            variant="ghost"
            className="text-[8px] min-h-[36px] px-3 py-1"
            onClick={() => openModal('pokedex')}
          >
            POKEDEX
          </PixelButton>
          <PixelButton
            variant="ghost"
            className="text-[8px] min-h-[36px] px-3 py-1"
            onClick={() => openModal('achievements')}
          >
            ACHIEVEMENTS
          </PixelButton>
          <PixelButton
            variant="ghost"
            className="text-[8px] min-h-[36px] px-3 py-1"
            onClick={() => openModal('hall-of-fame')}
          >
            HALL OF FAME
          </PixelButton>
        </div>
        <PixelButton
          variant="ghost"
          className="text-[8px] min-h-[36px] px-3 py-1"
          onClick={() => openModal('settings')}
        >
          SETTINGS
        </PixelButton>
      </div>
    </div>
  );
}
