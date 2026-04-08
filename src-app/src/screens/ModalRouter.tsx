import { useUIStore } from '@/store/uiStore';
import type { ModalId } from '@/store/uiStore';
import type { ComponentType } from 'react';

// ── Real modal components ──────────────────────────────────────────────────────
import { ItemEquipModal }   from '@/components/modals/ItemEquipModal';
import { UsableItemModal }  from '@/components/modals/UsableItemModal';
import { MoveTutorModal }   from '@/components/modals/MoveTutorModal';
import { EeveeChoiceModal } from '@/components/modals/EeveeChoiceModal';
import { SettingsModal }    from '@/components/modals/SettingsModal';

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
  'settings':      SettingsModal,
  'hall-of-fame':  ModalPlaceholder('HALL OF FAME'),
  'patch-notes':   ModalPlaceholder('PATCH NOTES'),
  'item-equip':    ItemEquipModal,
  'usable-item':   UsableItemModal,
  'move-tutor':    MoveTutorModal,
  'eevee-choice':  EeveeChoiceModal,
};

export function ModalRouter() {
  const modal      = useUIStore((s) => s.modal);
  const closeModal = useUIStore((s) => s.closeModal);

  if (!modal) return null;

  const ModalContent = MODAL_MAP[modal];

  // Bottom-anchored modals render their own container — wrap with a transparent
  // backdrop that closes on outside click.
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60"
      onClick={closeModal}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {ModalContent ? <ModalContent /> : (
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="bg-[#121827] border-2 border-white p-6 shadow-[4px_4px_0px_#000]">
              <div className="font-pixel text-[10px] text-white">Unknown modal: {modal}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
