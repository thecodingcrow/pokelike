import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { usePersistenceStore } from '@/store/persistenceStore';
import { PixelButton } from '@/components/ui/PixelButton';

const TOTAL = 151;
const ALL_IDS = Array.from({ length: TOTAL }, (_, i) => i + 1);

function spriteUrl(id: number, shiny = false) {
  if (shiny) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function PokedexModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  const pokedex    = usePersistenceStore((s) => s.pokedex);
  const shinydex   = usePersistenceStore((s) => s.shinydex);
  const [tab, setTab]         = useState<'normal' | 'shiny'>('normal');
  const [hovered, setHovered] = useState<number | null>(null);

  const caughtCount = ALL_IDS.filter((id) => pokedex[id]?.caught).length;
  const shinyCaught = ALL_IDS.filter((id) => !!shinydex[id]).length;

  const isNormal = tab === 'normal';
  const count    = isNormal ? caughtCount : shinyCaught;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={closeModal} />

      <div className="w-full max-w-[480px] bg-[#0a0a0f] border-t-4 border-white shadow-[0_-4px_0_#000] p-6 pb-8 max-h-[80vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="font-pixel text-[12px] text-white">POKEDEX</div>
          <div className="font-mono text-[12px] text-[#94a3b8]">
            {count}/{TOTAL}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-4 border-2 border-white shadow-[2px_2px_0_#000]">
          {(['normal', 'shiny'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 font-pixel text-[9px] py-2 cursor-pointer transition-none',
                tab === t
                  ? 'bg-white text-[#0a0a0f]'
                  : 'bg-transparent text-[#94a3b8] hover:text-white',
              ].join(' ')}
            >
              {t === 'normal' ? 'REGULAR' : '✦ SHINY'}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-6 gap-1 mb-6">
          {ALL_IDS.map((id) => {
            const caught  = isNormal ? !!pokedex[id]?.caught : !!shinydex[id];
            const name    = isNormal ? (pokedex[id]?.name ?? '') : (shinydex[id]?.name ?? '');
            const showTip = hovered === id && caught && name;

            return (
              <div
                key={id}
                className="relative flex flex-col items-center border border-white/10 bg-[#121827] p-1 cursor-default"
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
              >
                {caught ? (
                  <img
                    src={spriteUrl(id, !isNormal)}
                    alt={name || `#${id}`}
                    width={32}
                    height={32}
                    className="w-8 h-8"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="font-pixel text-[8px] text-[#1e2433]">?</span>
                  </div>
                )}
                <span
                  className={[
                    'font-pixel text-[6px] mt-0.5',
                    caught ? 'text-[#94a3b8]' : 'text-[#1e2433]',
                  ].join(' ')}
                >
                  {String(id).padStart(3, '0')}
                </span>

                {/* Hover tooltip */}
                {showTip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 bg-[#0a0a0f] border border-white px-2 py-1 whitespace-nowrap shadow-[2px_2px_0_#000]">
                    <span className="font-pixel text-[7px] text-white uppercase">{name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <PixelButton variant="secondary" onClick={closeModal} className="w-full">
          CLOSE
        </PixelButton>
      </div>
    </div>
  );
}
