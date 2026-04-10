import { useUIStore } from '@/store/uiStore';
import { usePersistenceStore, ACHIEVEMENTS } from '@/store/persistenceStore';
import { PixelButton } from '@/components/ui/PixelButton';

export function AchievementsModal() {
  const closeModal   = useUIStore((s) => s.closeModal);
  const unlocked     = usePersistenceStore((s) => s.achievements);

  const unlockedSet  = new Set(unlocked);
  const unlockedCount = unlocked.length;
  const total         = ACHIEVEMENTS.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={closeModal} />

      <div className="w-full max-w-[480px] bg-[#0d110e] border-t-4 border-[#c8a96e] shadow-[0_-4px_0_#050805] p-6 pb-8 max-h-[80vh] overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="font-pixel text-[12px] text-[#f0ead6]">ACHIEVEMENTS</div>
          <div className="font-mono text-[12px] text-[#c8a96e]">
            {unlockedCount}/{total}
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-2 mb-6">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={[
                  'flex items-start gap-3 border-2 p-3 shadow-[2px_2px_0_#050805]',
                  isUnlocked
                    ? 'border-[#c8a96e] bg-[#161d14]'
                    : 'border-[#c8a96e]/20 bg-[#0d110e]',
                ].join(' ')}
              >
                {/* Icon column */}
                <div className="w-8 h-8 flex items-center justify-center text-[20px] flex-shrink-0">
                  {isUnlocked ? (
                    <span aria-label="unlocked">{ach.icon}</span>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-label="locked"
                      className="opacity-30"
                    >
                      <rect x="3" y="9" width="14" height="10" fill="#f0ead6" />
                      <rect x="6" y="5" width="8" height="6" stroke="#c8a96e" strokeWidth="2" fill="none" />
                      <rect x="8" y="12" width="4" height="3" fill="#0d110e" />
                    </svg>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div
                    className={[
                      'font-pixel text-[9px] leading-relaxed',
                      isUnlocked ? 'text-[#f0ead6]' : 'text-[#c8a96e]/40',
                    ].join(' ')}
                  >
                    {ach.name}
                  </div>
                  {isUnlocked ? (
                    <div className="font-terminal text-[16px] text-[#c8a96e] mt-1 leading-tight">
                      {ach.desc}
                    </div>
                  ) : (
                    <div className="font-terminal text-[16px] text-[#c8a96e]/20 mt-1 leading-tight">
                      ???
                    </div>
                  )}
                </div>

                {/* Check mark */}
                {isUnlocked && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-1" aria-label="completed">
                    <polyline points="2,8 6,12 14,4" stroke="#22c55e" strokeWidth="2" strokeLinecap="square" />
                  </svg>
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
