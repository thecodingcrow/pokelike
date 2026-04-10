/**
 * map.ts — Pure map generation logic (no DOM / SVG).
 *
 * Layer layout: [1, 2, 3, 4, 3, 4, 3, 2, 1] = 23 nodes across 9 layers.
 *   Layer 0 — Start (1 node)
 *   Layer 1 — Forced: Catch (left) + Battle (right) (2 nodes)
 *   Layers 2–7 — Weighted-random content nodes
 *   Layer 8 — Boss (1 node)
 */

import type { GeneratedMap, MapEdge, MapNode, NodeType, NodeWeightRow } from '@/types';
import {
  GYM_LEADER_SPRITES,
  NODE_WEIGHTS,
  TRAINER_SPRITE_KEYS,
  TRAINER_SPRITE_NAMES,
  type TrainerSpriteKey,
} from '@/data';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Deterministic hash for stable per-node decisions (same as original). */
function hashId(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}

/**
 * Weighted random selection over a NodeWeightRow (or a partial copy of one).
 * Returns the key with the winning weight.
 */
function weightedRandom(weights: Partial<NodeWeightRow>): string {
  const entries = Object.entries(weights) as [string, number][];
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  let r = Math.random() * total;
  for (const [k, v] of entries) {
    r -= v;
    if (r <= 0) return k;
  }
  return entries[0][0];
}

/** Assign a deterministic trainer sprite key to a node id. */
function resolveTrainerSpriteKey(nodeId: string, mapIndex: number): TrainerSpriteKey {
  const available = TRAINER_SPRITE_KEYS.filter((k) => {
    if (k === 'aceTrainer' && mapIndex >= 6) return false;
    if (k === 'policeman'  && mapIndex >= 4) return false;
    return true;
  });
  const idx = Math.abs(hashId(nodeId)) % available.length;
  return available[idx];
}

/** Build edges between two adjacent layers using the positional nearest-2 rule. */
function makeLayerEdges(fromLayer: MapNode[], toLayer: MapNode[]): MapEdge[] {
  const N = fromLayer.length;
  const M = toLayer.length;

  if (N === 1) {
    // Single source fans out to every node in the next layer
    return toLayer.map((t) => ({ from: fromLayer[0].id, to: t.id }));
  }

  const edges: MapEdge[] = [];

  for (let i = 0; i < N; i++) {
    let left: number;
    let right: number;

    if (M === 1) {
      left = right = 0;
    } else if (M < N && i === 0) {
      // Leftmost node on a shrinking layer → only the leftmost node below
      left = right = 0;
    } else if (M < N && i === N - 1) {
      // Rightmost node on a shrinking layer → only the rightmost node below
      left = right = M - 1;
    } else {
      const pos = (i * (M - 1)) / (N - 1);
      left = Math.floor(pos);
      right = left + 1;
      if (right >= M) {
        right = M - 1;
        left = M - 2;
      }
    }

    edges.push({ from: fromLayer[i].id, to: toLayer[left].id });
    if (left !== right) {
      edges.push({ from: fromLayer[i].id, to: toLayer[right].id });
    }
  }

  return edges;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Select a weighted-random NodeType for a content layer.
 *
 * @param contentLayerIndex  0-based index into NODE_WEIGHTS (0 = layer 2, 5 = layer 7)
 * @param mapIndex           Which map run we're on (affects legendary unlock)
 * @param weights            Override the default weight table row (optional)
 */
export function getNodeType(
  contentLayerIndex: number,
  mapIndex: number,
  weights?: Partial<NodeWeightRow>,
): NodeType {
  const base: NodeWeightRow = {
    ...NODE_WEIGHTS[Math.min(contentLayerIndex, NODE_WEIGHTS.length - 1)],
  };
  // Unlock legendary encounters from map 5 onwards, content layers 2+
  if (mapIndex >= 5 && contentLayerIndex >= 2) {
    base.legendary = 6;
  }
  const row = weights ? { ...base, ...weights } : base;
  return weightedRandom(row) as NodeType;
}

/**
 * Resolve a '?' (question) node to a concrete type at the moment it is visited.
 * Uses the same weight table as mid-game content layers.
 */
export function resolveQuestionNode(): NodeType {
  // Use a mid-range weight row (ci=3) as baseline; exclude start/boss/question itself
  const w: Partial<NodeWeightRow> = {
    battle:     13,
    catch:      12,
    item:       10,
    trainer:    27,
    pokecenter:  9,
    move_tutor:  8,
    trade:       8,
    legendary:   0,
  };
  return weightedRandom(w) as NodeType;
}

/**
 * Generate the full map DAG for the given run.
 *
 * Layer sizes: [1, 2, 3, 4, 3, 4, 3, 2, 1]
 */
export function generateMap(mapIndex: number): GeneratedMap {
  const CONTENT_SIZES = [3, 4, 3, 4, 3, 2]; // content layers 2–7
  const bossLayerIdx = 2 + CONTENT_SIZES.length; // = 8
  const bossId = `n${bossLayerIdx}_0`;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const makeNode = (
    id: string,
    type: NodeType,
    layer: number,
    col: number,
    extra: Partial<MapNode> = {},
  ): MapNode => {
    const node: MapNode = {
      id,
      type,
      layer,
      col,
      visited: false,
      accessible: false,
      revealed: true,
      ...extra,
    };
    if (type === 'trainer') {
      node.trainerSprite = resolveTrainerSpriteKey(id, mapIndex);
    }
    return node;
  };

  // ── Build layers ─────────────────────────────────────────────────────────────

  const layers: MapNode[][] = [];

  // Layer 0: Start
  layers.push([makeNode('n0_0', 'start', 0, 0)]);

  // Layer 1: forced Catch (left) + Battle (right)
  layers.push([
    makeNode('n1_0', 'catch',  1, 0),
    makeNode('n1_1', 'battle', 1, 1),
  ]);

  // Layers 2–7: weighted-random content
  for (let ci = 0; ci < CONTENT_SIZES.length; ci++) {
    const l = ci + 2;
    const size = CONTENT_SIZES[ci];
    const layer: MapNode[] = Array.from({ length: size }, (_, c) =>
      makeNode(`n${l}_${c}`, getNodeType(ci, mapIndex), l, c),
    );

    // Guarantee a pokecenter in the final content layer (ci === 5, layer 7)
    if (ci === CONTENT_SIZES.length - 1 && !layer.some((n) => n.type === 'pokecenter')) {
      const idx = Math.floor(Math.random() * size);
      layer[idx].type = 'pokecenter';
    }

    layers.push(layer);
  }

  // Layer 8: Boss
  layers.push([makeNode(bossId, 'boss', bossLayerIdx, 0, { mapIndex })]);

  // ── Build edges ──────────────────────────────────────────────────────────────

  const edges: MapEdge[] = [];
  for (let l = 0; l < layers.length - 1; l++) {
    edges.push(...makeLayerEdges(layers[l], layers[l + 1]));
  }

  // ── Flatten & initialise reachability ────────────────────────────────────────

  const nodes: Record<string, MapNode> = {};
  for (const layer of layers) {
    for (const n of layer) {
      nodes[n.id] = n;
    }
  }

  // Start node is already "visited"; its children are immediately accessible
  nodes['n0_0'].visited = true;
  for (const edge of edges) {
    if (edge.from === 'n0_0') nodes[edge.to].accessible = true;
  }

  return { nodes, edges, layers, mapIndex };
}

/**
 * Mark `nodeId` as visited, lock its siblings, and unlock its children.
 * Returns the mutated map (same reference — callers should clone if needed).
 */
export function advanceFromNode(map: GeneratedMap, nodeId: string): GeneratedMap {
  const node = map.nodes[nodeId];
  if (!node) return map;

  node.visited = true;
  node.accessible = false;

  // Lock sibling nodes in the same layer that were still accessible
  for (const n of Object.values(map.nodes)) {
    if (n.layer === node.layer && n.id !== nodeId && n.accessible) {
      n.accessible = false;
    }
  }

  // Unlock children
  for (const edge of map.edges) {
    if (edge.from === nodeId) {
      const target = map.nodes[edge.to];
      if (target) {
        target.revealed = true;
        target.accessible = true;
      }
    }
  }

  return map;
}

/**
 * Return all nodes that are currently clickable (accessible and not yet visited).
 */
export function getAccessibleNodes(map: GeneratedMap): MapNode[] {
  return Object.values(map.nodes).filter((n) => n.accessible && !n.visited);
}

// ── Display helpers ───────────────────────────────────────────────────────────

/**
 * Return the sprite path for a node.
 * Trainer nodes require `node.trainerSprite` to be set (done by `generateMap`).
 */
export function getNodeSprite(node: MapNode): string | null {
  const ICON_SPRITES: Partial<Record<NodeType, string>> = {
    battle:    '/sprites/grass.png',
    catch:     '/sprites/catchPokemon.png',
    item:      '/sprites/itemIcon.png',
    trade:     '/sprites/tradeIcon.png',
    legendary: '/sprites/legendaryEncounter.png',
    question:  '/sprites/questionMark.png',
    pokecenter:'/sprites/Poke Center.png',
    move_tutor:'/sprites/moveTutor.png',
  };

  if (ICON_SPRITES[node.type]) return ICON_SPRITES[node.type]!;

  if (node.type === 'trainer') {
    const key =
      (node.trainerSprite as TrainerSpriteKey | undefined) ??
      TRAINER_SPRITE_KEYS[Math.abs(hashId(node.id)) % TRAINER_SPRITE_KEYS.length];
    return `/sprites/${key}.png`;
  }

  if (node.type === 'boss') {
    const mi = node.mapIndex ?? -1;
    if (mi >= 0 && mi < GYM_LEADER_SPRITES.length) return GYM_LEADER_SPRITES[mi];
    return '/sprites/champ.png';
  }

  return null;
}

/**
 * Return a human-readable label for a node (used for tooltips / UI text).
 * Does NOT produce HTML — rendering layer decides formatting.
 */
export function getNodeLabel(node: MapNode): string {
  if (node.visited) return 'Visited';

  if (node.type === 'boss') {
    return 'Gym Leader';
  }

  if (node.type === 'trainer') {
    const spriteName =
      node.trainerSprite && TRAINER_SPRITE_NAMES[node.trainerSprite as TrainerSpriteKey]
        ? ` — ${TRAINER_SPRITE_NAMES[node.trainerSprite as TrainerSpriteKey]}`
        : '';
    return `Trainer Battle${spriteName}`;
  }

  const labels: Partial<Record<NodeType, string>> = {
    start:      'Start',
    battle:     'Wild Battle',
    catch:      'Catch Pokemon',
    item:       'Item',
    question:   'Random Event',
    pokecenter: 'Pokemon Center',
    legendary:  'Legendary Pokemon',
    move_tutor: 'Move Tutor',
    trade:      'Trade — swap a Pokémon for one 3 levels higher',
  };

  return labels[node.type] ?? node.type;
}

/**
 * Return a hex colour associated with the node's type.
 * Used by the rendering layer for circle-based fallback nodes.
 */
export function getNodeColor(node: MapNode): string {
  if (node.visited) return '#333';

  const colors: Partial<Record<NodeType, string>> = {
    start:      '#4a4a6a',
    battle:     '#6a2a2a',
    catch:      '#2a6a2a',
    item:       '#2a4a6a',
    question:   '#6a4a2a',
    boss:       '#8a2a8a',
    pokecenter: '#006666',
    trainer:    '#6a3a1a',
    legendary:  '#7a6a00',
    move_tutor: '#3a4a6a',
    trade:      '#1a5a5a',
  };

  return colors[node.type] ?? '#444';
}
