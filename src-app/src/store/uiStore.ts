import { create } from 'zustand';

/**
 * All modal identifiers.
 * Screens are managed by XState — only modals live here.
 */
export type ModalId =
  | 'pokedex'
  | 'achievements'
  | 'settings'
  | 'hall-of-fame'
  | 'patch-notes'
  | 'item-equip'
  | 'usable-item'
  | 'move-tutor'
  | 'eevee-choice'
  | null;

export interface UIStore {
  // ── Modal state ────────────────────────────────────────────────────────────
  modal: ModalId;
  /** Arbitrary props forwarded to the open modal component. */
  modalProps: Record<string, unknown>;

  // ── Toast notification ─────────────────────────────────────────────────────
  /** Null when no notification is visible. `key` monotonically increments so
   *  React can re-trigger enter animations even for identical text strings. */
  notification: { text: string; key: number } | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  openModal: (id: ModalId, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  showNotification: (text: string) => void;
}

let _notifKey = 0;

export const useUIStore = create<UIStore>((set) => ({
  modal: null,
  modalProps: {},
  notification: null,

  openModal: (id, props = {}) =>
    set({ modal: id, modalProps: props }),

  closeModal: () =>
    set({ modal: null, modalProps: {} }),

  showNotification: (text) => {
    _notifKey += 1;
    set({ notification: { text, key: _notifKey } });
  },
}));
