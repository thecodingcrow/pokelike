import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PokemonInstance } from '@/types/pokemon';
import type { Item } from '@/types/items';
import type { MapNode, GeneratedMap } from '@/types';
import type { TrainerGender } from '@/types/game';
import { generateMap, advanceFromNode } from '@/systems/map';

export type { TrainerGender };

export interface GameStore {
  // ── Run state ──────────────────────────────────────────────────────────────
  currentMap: number;
  currentNode: MapNode | null;
  team: PokemonInstance[];
  items: Item[];
  badges: number;
  map: GeneratedMap | null;
  eliteIndex: number;
  trainer: TrainerGender;
  starterSpeciesId: number | null;
  maxTeamSize: number;
  hardMode: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setTrainer: (trainer: TrainerGender) => void;
  setTeam: (team: PokemonInstance[]) => void;
  addToTeam: (pokemon: PokemonInstance) => void;
  swapTeamMember: (idx: number, pokemon: PokemonInstance) => void;
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  removeItem: (idx: number) => void;
  /**
   * Equip a bag item to a Pokemon slot.
   * Sets the item's `heldItem` on the Pokemon and removes the item from the bag.
   * If the Pokemon already holds an item, that item is returned to the bag first.
   */
  equipItem: (item: Item, pokemonIdx: number) => void;
  /**
   * Unequip the held item from a Pokemon slot and return it to the bag.
   */
  unequipItem: (pokemonIdx: number) => void;
  incrementBadges: () => void;
  setEliteIndex: (index: number) => void;
  setStarterSpeciesId: (id: number) => void;
  startMap: (mapIndex: number) => void;
  advanceNode: (nodeId: string) => void;
  healTeam: () => void;
  resetRun: (hardMode: boolean) => void;
}

interface GameData {
  currentMap: number;
  currentNode: MapNode | null;
  team: PokemonInstance[];
  items: Item[];
  badges: number;
  map: GeneratedMap | null;
  eliteIndex: number;
  trainer: TrainerGender;
  starterSpeciesId: number | null;
  maxTeamSize: number;
  hardMode: boolean;
}

const INITIAL_STATE: GameData = {
  currentMap: 0,
  currentNode: null,
  team: [],
  items: [],
  badges: 0,
  map: null,
  eliteIndex: 0,
  trainer: 'boy',
  starterSpeciesId: null,
  maxTeamSize: 1,
  hardMode: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
  ...INITIAL_STATE,

  setTrainer: (trainer) => set({ trainer }),

  setTeam: (team) => set((s) => ({
    team,
    maxTeamSize: Math.max(s.maxTeamSize, team.length),
  })),

  addToTeam: (pokemon) =>
    set((s) => {
      const newTeam = [...s.team, pokemon];
      return {
        team: newTeam,
        maxTeamSize: Math.max(s.maxTeamSize, newTeam.length),
      };
    }),

  swapTeamMember: (idx, pokemon) =>
    set((s) => {
      const team = [...s.team];
      team[idx] = pokemon;
      return { team };
    }),

  setItems: (items) => set({ items }),

  addItem: (item) =>
    set((s) => ({ items: [...s.items, item] })),

  removeItem: (idx) =>
    set((s) => ({ items: s.items.filter((_, i) => i !== idx) })),

  equipItem: (item, pokemonIdx) =>
    set((s) => {
      const itemBagIdx = s.items.indexOf(item);
      if (itemBagIdx === -1) return {};

      // Check the target pokemon exists BEFORE removing the item
      const team = [...s.team];
      if (!team[pokemonIdx]) return {};

      let items = s.items.filter((_, i) => i !== itemBagIdx);

      // If the pokemon already has a held item, return it to the bag first
      const oldHeld = team[pokemonIdx].heldItem;
      if (oldHeld) {
        const returnedItem: Item = {
          id: oldHeld.id as Item['id'],
          name: oldHeld.name,
          desc: '',
          icon: oldHeld.icon,
          isUsable: false,
          minMap: 0,
        };
        items = [...items, returnedItem];
      }

      team[pokemonIdx] = {
        ...team[pokemonIdx],
        heldItem: { id: item.id, name: item.name, icon: item.icon },
      };
      return { items, team };
    }),

  unequipItem: (pokemonIdx) =>
    set((s) => {
      const team = [...s.team];
      const pokemon = team[pokemonIdx];
      if (!pokemon || !pokemon.heldItem) return {};

      const { heldItem } = pokemon;
      const returnedItem: Item = {
        id: heldItem.id as Item['id'],
        name: heldItem.name,
        desc: '',
        icon: heldItem.icon,
        isUsable: false,
        minMap: 0,
      };

      team[pokemonIdx] = { ...pokemon, heldItem: null };
      return { team, items: [...s.items, returnedItem] };
    }),

  incrementBadges: () =>
    set((s) => ({ badges: s.badges + 1 })),

  setEliteIndex: (index) => set({ eliteIndex: index }),

  setStarterSpeciesId: (id) => set({ starterSpeciesId: id }),

  startMap: (mapIndex) =>
    set({
      currentMap: mapIndex,
      currentNode: null,
      map: generateMap(mapIndex),
    }),

  advanceNode: (nodeId) =>
    set((state) => {
      if (!state.map) return {};
      // Deep-clone map so Zustand detects the reference change and re-renders
      const mapCopy = {
        ...state.map,
        nodes: Object.fromEntries(
          Object.entries(state.map.nodes).map(([k, v]) => [k, { ...v }])
        ),
        edges: [...state.map.edges],
        layers: state.map.layers.map(layer => layer.map(n => ({ ...n }))),
      };
      advanceFromNode(mapCopy, nodeId);
      const node = mapCopy.nodes[nodeId] ?? null;
      return { map: mapCopy, currentNode: node };
    }),

  healTeam: () =>
    set((s) => ({
      team: s.team.map((p) => ({ ...p, currentHp: p.maxHp })),
    })),

  resetRun: (hardMode) =>
    set({
      currentMap: 0,
      currentNode: null,
      team: [],
      items: [],
      badges: 0,
      map: null,
      eliteIndex: 0,
      trainer: 'boy',
      starterSpeciesId: null,
      maxTeamSize: 1,
      hardMode,
    }),
}),
    {
      name: 'pokelike-run',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentMap: s.currentMap,
        currentNode: s.currentNode,
        team: s.team,
        items: s.items,
        badges: s.badges,
        map: s.map,
        eliteIndex: s.eliteIndex,
        trainer: s.trainer,
        starterSpeciesId: s.starterSpeciesId,
        maxTeamSize: s.maxTeamSize,
        hardMode: s.hardMode,
      }) as unknown as GameStore,
    },
  ),
);
