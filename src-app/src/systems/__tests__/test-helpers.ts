import type { PokemonInstance, PokemonType, HeldItem, MapNode, GeneratedMap, MapEdge } from '@/types';
import type { Item } from '@/types/items';
import { useGameStore } from '@/store/gameStore';
import { usePersistenceStore } from '@/store/persistenceStore';
import { useUIStore } from '@/store/uiStore';

export function makePokemon(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    speciesId: 1, name: 'TestMon', nickname: null, level: 50,
    currentHp: 200, maxHp: 200, isShiny: false,
    types: ['Normal'] as PokemonType[],
    baseStats: { hp: 100, atk: 100, def: 100, speed: 100, special: 100, spdef: 100 },
    spriteUrl: '', megaStone: null, heldItem: null, moveTier: 1 as 0 | 1 | 2,
    ...overrides,
  };
}

export function makeItem(id: string, name?: string): HeldItem {
  return { id, name: name ?? id, icon: '' } as HeldItem;
}

export function makeMapNode(overrides: Partial<MapNode> = {}): MapNode {
  return {
    id: 'n0_0',
    type: 'battle',
    layer: 0,
    col: 0,
    visited: false,
    accessible: true,
    revealed: true,
    ...overrides,
  };
}

export function makeMap(nodes: MapNode[], edges: MapEdge[] = []): GeneratedMap {
  const nodesDict: Record<string, MapNode> = {};
  const layerMap = new Map<number, MapNode[]>();

  for (const node of nodes) {
    nodesDict[node.id] = node;
    if (!layerMap.has(node.layer)) layerMap.set(node.layer, []);
    layerMap.get(node.layer)!.push(node);
  }

  const maxLayer = Math.max(...nodes.map(n => n.layer), 0);
  const layers: MapNode[][] = [];
  for (let i = 0; i <= maxLayer; i++) {
    layers.push(layerMap.get(i) ?? []);
  }

  return { nodes: nodesDict, edges, layers, mapIndex: 0 };
}

export function makeFullItem(id: string, name?: string): Item {
  return {
    id: id as Item['id'],
    name: name ?? id,
    desc: 'Test item',
    icon: '',
    isUsable: false,
  };
}

export function resetAllStores() {
  useGameStore.getState().resetRun(false);
  usePersistenceStore.setState({
    pokedex: {},
    shinydex: {},
    achievements: [],
    hallOfFame: [],
    eliteWins: 0,
    settings: { autoSkipLevelUp: false, autoSkipBattles: false, autoSkipAllBattles: false },
  });
  useUIStore.getState().closeModal();
}
