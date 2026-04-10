import { useGame } from '@/hooks/useGame';
import { useGameStore } from '@/store/gameStore';
import { BadgeBar } from '@/components/hud/BadgeBar';
import { HpBar } from '@/components/battle/HpBar';
import { PixelButton } from '@/components/ui/PixelButton';

export function GameOverScreen() {
  const { send } = useGame();
  const badges = useGameStore((s) => s.badges);
  const currentMap = useGameStore((s) => s.currentMap);
  const team = useGameStore((s) => s.team);

  return (
    <div className="screen-default flex flex-col items-center justify-center h-full px-4 gap-8 overflow-y-auto">
      {/* Title */}
      <h1
        className="font-pixel text-[20px] leading-[1.8] text-neon-red text-center"
        style={{ textShadow: '0 0 8px #dc2626, 0 0 20px #dc262680' }}
      >
        GAME OVER
      </h1>

      {/* Stats panel */}
      <div className="bg-game-panel border-2 border-[#c8a96e] shadow-[4px_4px_0px_#050805] p-6 flex flex-col gap-4 w-full max-w-[320px]">

        {/* Badges */}
        <div className="flex flex-col gap-2">
          <p className="font-pixel text-[10px] text-[#c8a96e]">BADGES: {badges}/8</p>
          <BadgeBar badges={badges} />
        </div>

        {/* Maps cleared */}
        <div className="border-t border-[#c8a96e]/10 pt-3">
          <p className="font-pixel text-[10px] text-[#c8a96e]">
            MAPS CLEARED:{' '}
            <span className="text-[#f0ead6]">{currentMap}</span>
          </p>
        </div>
      </div>

      {/* Final team — shown in full color as a memorial */}
      {team.length > 0 && (
        <div className="flex flex-col items-center gap-4 w-full max-w-[360px]">
          <p className="font-pixel text-[10px] text-[#c8a96e]">FINAL TEAM:</p>
          <div className="grid grid-cols-3 gap-3 w-full">
            {team.map((pokemon, i) => {
              const displayName = pokemon.nickname ?? pokemon.name;
              const spriteUrl = pokemon.isShiny
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`
                : (pokemon.spriteUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`);
              return (
                <div
                  key={i}
                  className="flex flex-col items-center bg-[#161d14] border-2 border-[#c8a96e] shadow-[2px_2px_0px_#050805] p-2 gap-1"
                >
                  {/* Sprite — full color, no grayscale */}
                  <div className="relative">
                    <img
                      src={spriteUrl}
                      alt={displayName}
                      width={64}
                      height={64}
                      className="w-16 h-16"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    {pokemon.isShiny && (
                      <span
                        className="absolute top-0 right-0 leading-none"
                        style={{ color: '#f8d030', fontSize: 10 }}
                        aria-label="Shiny"
                      >
                        ✦
                      </span>
                    )}
                  </div>
                  {/* Name */}
                  <div
                    className="font-pixel text-center leading-tight truncate w-full"
                    style={{ fontSize: 16, color: '#f0ead6' }}
                  >
                    {displayName.toUpperCase()}
                  </div>
                  {/* Level */}
                  <div className="font-mono" style={{ fontSize: 11, color: '#c8a96e' }}>
                    Lv.{pokemon.level}
                  </div>
                  {/* HP bar */}
                  <div className="w-full mt-0.5">
                    <HpBar current={pokemon.currentHp} max={pokemon.maxHp} showNumbers />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
