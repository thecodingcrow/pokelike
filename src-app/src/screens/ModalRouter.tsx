import { useUIStore } from '@/store/uiStore';
import type { ModalId } from '@/store/uiStore';
import type { ComponentType } from 'react';

// ── Real modal components ──────────────────────────────────────────────────────
import { ItemEquipModal }      from '@/components/modals/ItemEquipModal';
import { UsableItemModal }     from '@/components/modals/UsableItemModal';
import { MoveTutorModal }      from '@/components/modals/MoveTutorModal';
import { EeveeChoiceModal }    from '@/components/modals/EeveeChoiceModal';
import { SettingsModal }       from '@/components/modals/SettingsModal';
import { PokedexModal }        from '@/components/modals/PokedexModal';
import { AchievementsModal }   from '@/components/modals/AchievementsModal';
import { HallOfFameModal }     from '@/components/modals/HallOfFameModal';
import { PatchNotesModal }     from '@/components/modals/PatchNotesModal';

// ── Modal map ─────────────────────────────────────────────────────────────────
const MODAL_MAP: Record<Exclude<ModalId, null>, ComponentType> = {
  'pokedex':       PokedexModal,
  'achievements':  AchievementsModal,
  'settings':      SettingsModal,
  'hall-of-fame':  HallOfFameModal,
  'patch-notes':   PatchNotesModal,
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
