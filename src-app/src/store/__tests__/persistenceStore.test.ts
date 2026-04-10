import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { usePersistenceStore } from '@/store/persistenceStore';
import { makePokemon } from '@/systems/__tests__/test-helpers';

// Zustand's persist middleware calls localStorage; provide a no-op stub in Node.
beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    } as unknown as Storage;
  }
});

beforeEach(() => {
  usePersistenceStore.setState({
    pokedex: {},
    shinydex: {},
    achievements: [],
    hallOfFame: [],
    eliteWins: 0,
    settings: { autoSkipLevelUp: false, autoSkipBattles: false, autoSkipAllBattles: false },
  });
});

describe('persistenceStore', () => {
  describe('markSeen', () => {
    it('adds unseen pokemon to pokedex', () => {
      usePersistenceStore.getState().markSeen(1, 'Bulbasaur', ['Grass'], 'sprite.png');
      const entry = usePersistenceStore.getState().pokedex[1];
      expect(entry).toBeDefined();
      expect(entry.caught).toBe(false);
    });

    it('does not overwrite existing entry', () => {
      const store = usePersistenceStore.getState();
      store.markCaught(1, 'Bulbasaur', ['Grass'], 'sprite.png');
      store.markSeen(1, 'Bulbasaur', ['Grass'], 'sprite.png');
      expect(usePersistenceStore.getState().pokedex[1].caught).toBe(true);
    });
  });

  describe('markCaught', () => {
    it('marks pokemon as caught', () => {
      usePersistenceStore.getState().markCaught(25, 'Pikachu', ['Electric'], 'pika.png');
      expect(usePersistenceStore.getState().pokedex[25].caught).toBe(true);
    });
  });

  describe('markShinyCaught', () => {
    it('adds to shinydex', () => {
      usePersistenceStore.getState().markShinyCaught(25, 'Pikachu', ['Electric'], 'shiny.png');
      expect(usePersistenceStore.getState().shinydex[25]).toBeDefined();
    });
  });

  describe('unlockAchievement', () => {
    it('returns achievement on first unlock', () => {
      const result = usePersistenceStore.getState().unlockAchievement('gym_0');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('gym_0');
    });

    it('returns null on duplicate unlock', () => {
      usePersistenceStore.getState().unlockAchievement('gym_0');
      const result = usePersistenceStore.getState().unlockAchievement('gym_0');
      expect(result).toBeNull();
    });

    it('adds to achievements array', () => {
      usePersistenceStore.getState().unlockAchievement('gym_0');
      expect(usePersistenceStore.getState().achievements).toContain('gym_0');
    });
  });

  describe('saveHallOfFame', () => {
    it('appends entry with team snapshot', () => {
      const team = [makePokemon({ name: 'Charizard', level: 50 })];
      usePersistenceStore.getState().saveHallOfFame(team, 1, false);
      const hof = usePersistenceStore.getState().hallOfFame;
      expect(hof).toHaveLength(1);
      expect(hof[0].runNumber).toBe(1);
      expect(hof[0].team[0].name).toBe('Charizard');
    });
  });

  describe('incrementEliteWins', () => {
    it('increments and returns new count', () => {
      expect(usePersistenceStore.getState().incrementEliteWins()).toBe(1);
      expect(usePersistenceStore.getState().incrementEliteWins()).toBe(2);
    });
  });

  describe('updateSettings', () => {
    it('merges partial settings', () => {
      usePersistenceStore.getState().updateSettings({ autoSkipBattles: true });
      const s = usePersistenceStore.getState().settings;
      expect(s.autoSkipBattles).toBe(true);
      expect(s.autoSkipLevelUp).toBe(false); // unchanged
    });
  });

  describe('isPokedexComplete', () => {
    it('returns false when incomplete', () => {
      expect(usePersistenceStore.getState().isPokedexComplete()).toBe(false);
    });
  });
});
