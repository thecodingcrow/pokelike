import { useUIStore } from '@/store/uiStore';
import { usePersistenceStore } from '@/store/persistenceStore';
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
  const closeModal     = useUIStore((s) => s.closeModal);
  const settings       = usePersistenceStore((s) => s.settings);
  const updateSettings = usePersistenceStore((s) => s.updateSettings);

  function toggle(key: keyof GameSettings) {
    updateSettings({ [key]: !settings[key] });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="w-full max-w-[480px] bg-[#0d110e] border-t-4 border-[#c8a96e] shadow-[0_-4px_0_#050805] p-6 pb-8 max-h-[80vh] overflow-y-auto">
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

        {/* Close */}
        <PixelButton variant="secondary" onClick={closeModal} className="w-full">
          CLOSE
        </PixelButton>
      </div>
    </div>
  );
}
