import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { usePersistenceStore } from '@/store/persistenceStore';
import { useGame } from '@/hooks/useGame';
import type { GameSettings } from '@/types/game';
import { PixelButton } from '@/components/ui/PixelButton';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function PixelToggle({ label, value, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#c8a96e]/10">
      <span className="font-terminal text-[20px] text-[#f0ead6]">{label}</span>
      <button
        onClick={() => onToggle(!value)}
        className={[
          'relative w-12 h-6 border-2 border-[#c8a96e] shadow-[2px_2px_0px_#050805] transition-none cursor-pointer',
          value ? 'bg-[#22c55e]' : 'bg-[#161d14]',
        ].join(' ')}
        role="switch"
        aria-checked={value}
      >
        <span
          className={[
            'absolute top-0.5 w-4 h-4 bg-[#c8a96e] shadow-[1px_1px_0px_#050805] transition-none',
            value ? 'left-6' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

export function SettingsModal() {
  const { send } = useGame();
  const closeModal     = useUIStore((s) => s.closeModal);
  const hasActiveRun   = useGameStore((s) => s.team.length > 0 && s.map !== null);
  const settings       = usePersistenceStore((s) => s.settings);
  const updateSettings = usePersistenceStore((s) => s.updateSettings);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);

  function toggle(key: keyof GameSettings) {
    updateSettings({ [key]: !settings[key] });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="w-full max-w-[480px] bg-[#0d110e] border-t-4 border-[#c8a96e] shadow-[0_-4px_0_#050805] p-6 pb-8 max-h-[80vh] overflow-y-auto relative">
        {/* X close button */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center border-2 border-[#c8a96e] bg-[#161d14] text-[#f0ead6] font-pixel text-[12px] cursor-pointer z-10 shadow-[2px_2px_0px_#050805] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#050805]"
          aria-label="Close"
        >
          ✕
        </button>
        {/* Title */}
        <div className="font-pixel text-[12px] text-[#f0ead6] mb-6">SETTINGS</div>

        {/* Toggles */}
        <div className="flex flex-col mb-6">
          <PixelToggle
            label="Auto-skip level ups"
            value={settings.autoSkipLevelUp}
            onToggle={() => toggle('autoSkipLevelUp')}
          />
          <PixelToggle
            label="Auto-skip battles"
            value={settings.autoSkipBattles}
            onToggle={() => toggle('autoSkipBattles')}
          />
          <PixelToggle
            label="Auto-skip ALL battles"
            value={settings.autoSkipAllBattles}
            onToggle={() => toggle('autoSkipAllBattles')}
          />
        </div>

        {/* Give Up */}
        {hasActiveRun && (
          <div className="mb-4 border-t border-[#c8a96e]/20 pt-4">
            {!confirmGiveUp ? (
              <PixelButton
                variant="ghost"
                onClick={() => setConfirmGiveUp(true)}
                className="w-full"
                style={{ color: '#ef4444', borderColor: '#ef444440' }}
              >
                GIVE UP RUN
              </PixelButton>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="font-terminal text-[18px] text-[#ef4444] text-center">
                  Abandon this run? All progress will be lost.
                </span>
                <div className="flex gap-2">
                  <PixelButton
                    variant="ghost"
                    onClick={() => setConfirmGiveUp(false)}
                    className="flex-1"
                  >
                    CANCEL
                  </PixelButton>
                  <PixelButton
                    variant="primary"
                    onClick={() => {
                      closeModal();
                      send({ type: 'RESTART' });
                    }}
                    className="flex-1"
                    style={{ background: '#7f1d1d', borderColor: '#ef4444' }}
                  >
                    CONFIRM
                  </PixelButton>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close */}
        <PixelButton variant="secondary" onClick={closeModal} className="w-full">
          CLOSE
        </PixelButton>
      </div>
    </div>
  );
}
