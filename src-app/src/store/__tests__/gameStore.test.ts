import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import {
  makePokemon,
  makeFullItem,
  resetAllStores,
} from '@/systems/__tests__/test-helpers';

describe('gameStore', () => {
  beforeEach(() => resetAllStores());

  // ── resetRun ──────────────────────────────────────────────────────────────

  describe('resetRun', () => {
    it('resets all run state', () => {
      const store = useGameStore.getState();
      store.addToTeam(makePokemon());
      store.incrementBadges();
      store.resetRun(false);
      expect(useGameStore.getState().team).toEqual([]);
      expect(useGameStore.getState().badges).toBe(0);
      expect(useGameStore.getState().hardMode).toBe(false);
    });

    it('sets hardMode flag', () => {
      useGameStore.getState().resetRun(true);
      expect(useGameStore.getState().hardMode).toBe(true);
    });
  });

  // ── startMap ──────────────────────────────────────────────────────────────

  describe('startMap', () => {
    it('generates a map and sets currentMap', () => {
      useGameStore.getState().startMap(0);
      const s = useGameStore.getState();
      expect(s.currentMap).toBe(0);
      expect(s.map).not.toBeNull();
      expect(s.currentNode).toBeNull();
      expect(Object.keys(s.map!.nodes).length).toBeGreaterThan(0);
      expect(s.map!.layers.length).toBeGreaterThan(0);
    });

    it('sets the requested map index', () => {
      useGameStore.getState().startMap(3);
      expect(useGameStore.getState().currentMap).toBe(3);
    });
  });

  // ── advanceNode ───────────────────────────────────────────────────────────

  describe('advanceNode', () => {
    it('marks node as visited and sets currentNode', () => {
      useGameStore.getState().startMap(0);
      const map = useGameStore.getState().map!;
      const accessibleNode = Object.values(map.nodes).find(n => n.accessible);
      expect(accessibleNode).toBeDefined();

      useGameStore.getState().advanceNode(accessibleNode!.id);
      const updated = useGameStore.getState();
      expect(updated.map!.nodes[accessibleNode!.id].visited).toBe(true);
      expect(updated.currentNode).toBeTruthy();
      expect(updated.currentNode!.id).toBe(accessibleNode!.id);
    });

    it('does nothing if map is null', () => {
      // map starts null after reset
      useGameStore.getState().advanceNode('fake-id');
      expect(useGameStore.getState().currentNode).toBeNull();
    });
  });

  // ── team management ───────────────────────────────────────────────────────

  describe('team management', () => {
    it('addToTeam appends a pokemon', () => {
      const mon = makePokemon({ name: 'Bulbasaur' });
      useGameStore.getState().addToTeam(mon);
      expect(useGameStore.getState().team).toHaveLength(1);
      expect(useGameStore.getState().team[0].name).toBe('Bulbasaur');
    });

    it('addToTeam allows multiple members', () => {
      useGameStore.getState().addToTeam(makePokemon({ name: 'A' }));
      useGameStore.getState().addToTeam(makePokemon({ name: 'B' }));
      expect(useGameStore.getState().team).toHaveLength(2);
    });

    it('swapTeamMember replaces at index', () => {
      useGameStore.getState().addToTeam(makePokemon({ name: 'Old' }));
      const newMon = makePokemon({ name: 'New' });
      useGameStore.getState().swapTeamMember(0, newMon);
      expect(useGameStore.getState().team[0].name).toBe('New');
    });

    it('setTeam replaces entire team', () => {
      useGameStore.getState().addToTeam(makePokemon({ name: 'A' }));
      useGameStore.getState().setTeam([makePokemon({ name: 'B' }), makePokemon({ name: 'C' })]);
      const team = useGameStore.getState().team;
      expect(team).toHaveLength(2);
      expect(team[0].name).toBe('B');
      expect(team[1].name).toBe('C');
    });
  });

  // ── healTeam ──────────────────────────────────────────────────────────────

  describe('healTeam', () => {
    it('restores all HP to max', () => {
      const hurt = makePokemon({ currentHp: 50, maxHp: 200 });
      useGameStore.getState().addToTeam(hurt);
      useGameStore.getState().healTeam();
      expect(useGameStore.getState().team[0].currentHp).toBe(200);
    });

    it('heals every member in the team', () => {
      useGameStore.getState().addToTeam(makePokemon({ currentHp: 1, maxHp: 100 }));
      useGameStore.getState().addToTeam(makePokemon({ currentHp: 30, maxHp: 150 }));
      useGameStore.getState().healTeam();
      const team = useGameStore.getState().team;
      expect(team[0].currentHp).toBe(100);
      expect(team[1].currentHp).toBe(150);
    });
  });

  // ── items ─────────────────────────────────────────────────────────────────

  describe('items', () => {
    it('addItem adds to bag', () => {
      const item = makeFullItem('life_orb', 'Life Orb');
      useGameStore.getState().addItem(item);
      expect(useGameStore.getState().items).toHaveLength(1);
      expect(useGameStore.getState().items[0].name).toBe('Life Orb');
    });

    it('setItems replaces the entire bag', () => {
      useGameStore.getState().addItem(makeFullItem('life_orb'));
      useGameStore.getState().setItems([makeFullItem('leftovers'), makeFullItem('scope_lens')]);
      const items = useGameStore.getState().items;
      expect(items).toHaveLength(2);
      expect(items[0].id).toBe('leftovers');
    });

    it('removeItem removes by index', () => {
      useGameStore.getState().setItems([makeFullItem('life_orb'), makeFullItem('leftovers')]);
      useGameStore.getState().removeItem(0);
      const items = useGameStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('leftovers');
    });

    it('equipItem removes from bag and sets heldItem on pokemon', () => {
      const item = makeFullItem('scope_lens', 'Scope Lens');
      const mon = makePokemon({ name: 'Squirtle' });
      useGameStore.getState().addToTeam(mon);
      useGameStore.getState().addItem(item);
      useGameStore.getState().equipItem(item, 0);

      const s = useGameStore.getState();
      expect(s.items).toHaveLength(0);
      expect(s.team[0].heldItem).not.toBeNull();
      expect(s.team[0].heldItem!.id).toBe('scope_lens');
      expect(s.team[0].heldItem!.name).toBe('Scope Lens');
    });

    it('equipItem does nothing if item is not in bag', () => {
      const mon = makePokemon({ name: 'Charmander' });
      useGameStore.getState().addToTeam(mon);
      // bag is empty — item reference not present
      const ghost = makeFullItem('life_orb', 'Life Orb');
      useGameStore.getState().equipItem(ghost, 0);

      const s = useGameStore.getState();
      expect(s.team[0].heldItem).toBeNull();
      expect(s.items).toHaveLength(0);
    });

    it('equipItem does nothing if pokemon index is invalid', () => {
      const item = makeFullItem('life_orb');
      useGameStore.getState().addItem(item);
      useGameStore.getState().equipItem(item, 99);
      // item stays in bag — target pokemon does not exist
      expect(useGameStore.getState().items).toHaveLength(1);
    });
  });

  // ── maxTeamSize tracking ──────────────────────────────────────────────────

  describe('maxTeamSize tracking', () => {
    it('addToTeam updates maxTeamSize', () => {
      useGameStore.getState().addToTeam(makePokemon());
      expect(useGameStore.getState().maxTeamSize).toBe(1);
      useGameStore.getState().addToTeam(makePokemon());
      expect(useGameStore.getState().maxTeamSize).toBe(2);
    });

    it('maxTeamSize does not decrease when pokemon removed via setTeam', () => {
      useGameStore.getState().addToTeam(makePokemon());
      useGameStore.getState().addToTeam(makePokemon());
      expect(useGameStore.getState().maxTeamSize).toBe(2);
      useGameStore.getState().setTeam([makePokemon()]); // trim to 1
      expect(useGameStore.getState().maxTeamSize).toBe(2); // stays at peak
    });

    it('resetRun resets maxTeamSize to 1', () => {
      useGameStore.getState().addToTeam(makePokemon());
      useGameStore.getState().addToTeam(makePokemon());
      expect(useGameStore.getState().maxTeamSize).toBe(2);
      useGameStore.getState().resetRun(false);
      expect(useGameStore.getState().maxTeamSize).toBe(1);
    });

    it('setTeam with larger team increases maxTeamSize', () => {
      const bigTeam = [makePokemon(), makePokemon(), makePokemon()];
      useGameStore.getState().setTeam(bigTeam);
      expect(useGameStore.getState().maxTeamSize).toBe(3);
    });
  });

  // ── incrementBadges ───────────────────────────────────────────────────────

  describe('incrementBadges', () => {
    it('increments by 1 each call', () => {
      useGameStore.getState().incrementBadges();
      expect(useGameStore.getState().badges).toBe(1);
      useGameStore.getState().incrementBadges();
      expect(useGameStore.getState().badges).toBe(2);
    });

    it('starts at 0 after resetRun', () => {
      useGameStore.getState().incrementBadges();
      useGameStore.getState().incrementBadges();
      useGameStore.getState().resetRun(false);
      expect(useGameStore.getState().badges).toBe(0);
    });
  });

  // ── setEliteIndex / setStarterSpeciesId ───────────────────────────────────

  describe('setEliteIndex', () => {
    it('sets the eliteIndex', () => {
      useGameStore.getState().setEliteIndex(3);
      expect(useGameStore.getState().eliteIndex).toBe(3);
    });
  });

  describe('setStarterSpeciesId', () => {
    it('sets the starter species id', () => {
      useGameStore.getState().setStarterSpeciesId(4);
      expect(useGameStore.getState().starterSpeciesId).toBe(4);
    });
  });
});
