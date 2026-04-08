import { useUIStore } from '@/store/uiStore';
import type { ModalId } from '@/store/uiStore';
import type { ComponentType } from 'react';

// ── Placeholder factory ────────────────────────────────────────────────────────
function ModalPlaceholder(name: string): ComponentType {
  return function PlaceholderModal() {
    return (
      <div className="bg-[#121827] border-2 border-white shadow-[4px_4px_0px_#000] p-6 min-w-[240px]">
        <div className="font-pixel text-[10px] text-white text-center">{name}</div>
        <div className="font-terminal text-[16px] text-[#94a3b8] text-center mt-2">
          Coming soon
        </div>
      </div>
    );
  };
}

// ── Modal map ─────────────────────────────────────────────────────────────────
const MODAL_MAP: Record<Exclude<ModalId, null>, ComponentType> = {
  'pokedex':       ModalPlaceholder('POKEDEX'),
  'achievements':  ModalPlaceholder('ACHIEVEMENTS'),
  'settings':      ModalPlaceholder('SETTINGS'),
  'hall-of-fame':  ModalPlaceholder('HALL OF FAME'),
  'patch-notes':   ModalPlaceholder('PATCH NOTES'),
  'item-equip':    ModalPlaceholder('EQUIP ITEM'),
  'usable-item':   ModalPlaceholder('USE ITEM'),
  'move-tutor':    ModalPlaceholder('MOVE TUTOR'),
  'eevee-choice':  ModalPlaceholder('EEVEE EVOLUTION'),
};

export function ModalRouter() {
  const modal     = useUIStore((s) => s.modal);
  const closeModal = useUIStore((s) => s.closeModal);

  if (!modal) return null;

  const ModalContent = MODAL_MAP[modal];

  return (
    /* Dark backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={closeModal}
    >
      {/* Modal panel — stop propagation so clicks inside don't close */}
      <div onClick={(e) => e.stopPropagation()}>
        {ModalContent ? <ModalContent /> : (
          <div className="bg-[#121827] border-2 border-white p-6 shadow-[4px_4px_0px_#000]">
            <div className="font-pixel text-[10px] text-white">Unknown modal: {modal}</div>
          </div>
        )}
      </div>
    </div>
  );
}
