import { useUIStore } from '@/store/uiStore';
import { PixelButton } from '@/components/ui/PixelButton';

const PATCH_NOTES = [
  {
    version: 'v2.0.0',
    title: 'React Rebuild',
    notes: [
      'Complete rewrite in React + TypeScript',
      'New pixel art UI with retro theme',
      'Improved battle animations',
      'All 151 Gen 1 Pokemon',
      '8 Gym Leaders + Elite Four',
      'Items, trading, shiny hunting',
    ],
  },
] as const;

export function PatchNotesModal() {
  const closeModal = useUIStore((s) => s.closeModal);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={closeModal} />

      <div className="w-full max-w-[480px] bg-[#0d110e] border-t-4 border-[#c8a96e] shadow-[0_-4px_0_#050805] p-6 pb-8 max-h-[80vh] overflow-y-auto relative z-10">
        {/* X close button */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center border-2 border-[#c8a96e] bg-[#161d14] text-[#f0ead6] font-pixel text-[12px] cursor-pointer z-10 shadow-[2px_2px_0px_#050805] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#050805]"
          aria-label="Close"
        >
          ✕
        </button>
        {/* Header */}
        <div className="font-pixel text-[12px] text-[#f0ead6] mb-6">PATCH NOTES</div>

        {/* Entries */}
        <div className="flex flex-col gap-6 mb-6">
          {PATCH_NOTES.map((patch) => (
            <div key={patch.version}>
              <div className="flex items-baseline gap-3 mb-2 border-b border-[#c8a96e]/20 pb-2">
                <span className="font-pixel text-[10px] text-[#f8d030]">{patch.version}</span>
                <span className="font-terminal text-[20px] text-[#c8a96e]">— {patch.title}</span>
              </div>
              <ul className="flex flex-col gap-1">
                {patch.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-terminal text-[20px] text-[#2563eb] flex-shrink-0 leading-tight">-</span>
                    <span className="font-terminal text-[20px] text-[#f0ead6] leading-tight">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <PixelButton variant="secondary" onClick={closeModal} className="w-full">
          CLOSE
        </PixelButton>
      </div>
    </div>
  );
}
