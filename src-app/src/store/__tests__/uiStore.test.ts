import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/store/uiStore';

beforeEach(() => {
  useUIStore.getState().closeModal();
});

describe('uiStore', () => {
  describe('openModal / closeModal', () => {
    it('opens a modal with id', () => {
      useUIStore.getState().openModal('pokedex');
      expect(useUIStore.getState().modal).toBe('pokedex');
    });

    it('passes props', () => {
      useUIStore.getState().openModal('item-equip', { pokemonIdx: 0 });
      expect(useUIStore.getState().modalProps).toEqual({ pokemonIdx: 0 });
    });

    it('closes modal', () => {
      useUIStore.getState().openModal('pokedex');
      useUIStore.getState().closeModal();
      expect(useUIStore.getState().modal).toBeNull();
      expect(useUIStore.getState().modalProps).toEqual({});
    });
  });

  describe('showNotification', () => {
    it('sets notification text', () => {
      useUIStore.getState().showNotification('Team healed!');
      expect(useUIStore.getState().notification!.text).toBe('Team healed!');
    });

    it('increments key for unique animations', () => {
      useUIStore.getState().showNotification('First');
      const key1 = useUIStore.getState().notification!.key;
      useUIStore.getState().showNotification('Second');
      const key2 = useUIStore.getState().notification!.key;
      expect(key2).toBeGreaterThan(key1);
    });
  });
});
