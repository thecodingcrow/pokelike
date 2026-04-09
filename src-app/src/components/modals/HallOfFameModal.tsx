import { useUIStore } from '@/store/uiStore';
import { usePersistenceStore } from '@/store/persistenceStore';
import { PixelButton } from '@/components/ui/PixelButton';

export function HallOfFameModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  const hallOfFame = usePersistenceStore((s) => s.hallOfFame);

  const entries = [...hallOfFame].reverse();

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={closeModal} />

      <div className="w-full max-w-[480px] bg-[#0a0a0f] border-t-4 border-white shadow-[0_-4px_0_#000] p-6 pb-8 max-h-[80vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="font-pixel text-[12px] text-white">HALL OF FAME</div>
          <div className="font-mono text-[12px] text-[#94a3b8]">
            {hallOfFame.length} {hallOfFame.length === 1 ? 'victory' : 'victories'}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="font-terminal text-[20px] text-[#94a3b8] text-center py-8 border-2 border-white/10 mb-6">
            No victories yet.<br />
            Defeat the Elite Four!
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-6">
            {entries.map((entry, i) => (
              <div
                key={`${entry.runNumber}-${i}`}
                className="border-2 border-white bg-[#121827] shadow-[2px_2px_0_#000] p-4"
              >
                {/* Run header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-[10px] text-[#f8d030]">
                      #{entry.runNumber}
                    </span>
                    {entry.hardMode && (
                      <span className="font-pixel text-[7px] text-white bg-[#dc2626] border border-white px-2 py-0.5 shadow-[1px_1px_0_#000]">
                        HARD
                      </span>
                    )}
                  </div>
                  {entry.date && (
                    <span className="font-terminal text-[16px] text-[#94a3b8]">
                      {entry.date}
                    </span>
                  )}
                </div>

                {/* Team sprites */}
                <div className="flex gap-1 flex-wrap">
                  {entry.team.map((pokemon, j) => (
                    <div
                      key={`${pokemon.speciesId}-${j}`}
                      className="relative group"
                      title={pokemon.nickname ?? pokemon.name}
                    >
                      <div className="w-10 h-10 border border-white/20 bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
                        <img
                          src={
                            pokemon.isShiny
                              ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.speciesId}.png`
                              : (pokemon.spriteUrl ||
                                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`)
                          }
                          alt={pokemon.nickname ?? pokemon.name}
                          width={32}
                          height={32}
                          className="w-8 h-8"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        {pokemon.isShiny && (
                          <span className="absolute top-0 right-0 text-[8px] leading-none">✦</span>
                        )}
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 bg-[#0a0a0f] border border-white px-2 py-1 whitespace-nowrap shadow-[2px_2px_0_#000] hidden group-hover:block pointer-events-none">
                        <div className="font-pixel text-[7px] text-white uppercase">
                          {pokemon.nickname ? `${pokemon.nickname}` : pokemon.name}
                        </div>
                        <div className="font-terminal text-[14px] text-[#94a3b8]">
                          Lv.{pokemon.level}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Fill empty slots */}
                  {Array.from({ length: Math.max(0, 6 - entry.team.length) }).map((_, j) => (
                    <div
                      key={`empty-${j}`}
                      className="w-10 h-10 border border-white/10 bg-[#0a0a0f]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <PixelButton variant="secondary" onClick={closeModal} className="w-full">
          CLOSE
        </PixelButton>
      </div>
    </div>
  );
}
