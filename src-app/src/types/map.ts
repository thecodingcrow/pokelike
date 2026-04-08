/**
 * All possible node type strings as defined in NODE_TYPES in map.js.
 */
export type NodeType =
  | 'start'
  | 'battle'
  | 'catch'
  | 'item'
  | 'question'
  | 'boss'
  | 'pokecenter'
  | 'trainer'
  | 'legendary'
  | 'move_tutor'
  | 'trade';

/**
 * A single node on the generated map.
 *
 * `id`            — deterministic string like "n3_2" (layer_col).
 * `type`          — the node's assigned type from NODE_TYPES.
 * `resolvedType`  — set at runtime when a 'question' node is resolved to
 *                   its actual type (e.g. 'battle', 'item').
 * `layer`         — zero-based layer index (0 = start, last = boss).
 * `col`           — zero-based column index within the layer.
 * `visited`       — true once the player has completed this node.
 * `accessible`    — true if the player can currently choose this node.
 * `revealed`      — always true in this game (all nodes are visible).
 * `trainerSprite` — key into the trainer sprite map; only set on 'trainer' nodes.
 * `mapIndex`      — set on 'boss' nodes to identify which gym leader to use.
 */
export interface MapNode {
  id: string;
  type: NodeType;
  resolvedType?: NodeType;
  layer: number;
  col: number;
  visited: boolean;
  accessible: boolean;
  revealed: boolean;
  trainerSprite?: string;
  mapIndex?: number;
}

/**
 * A directed edge connecting two nodes.
 */
export interface MapEdge {
  from: string;
  to: string;
}

/**
 * The complete generated map for a single arena.
 *
 * `nodes`    — flat dictionary keyed by node id.
 * `edges`    — all directed connections between layers.
 * `layers`   — the nodes grouped by layer (for rendering and edge generation).
 * `mapIndex` — which arena (0–8) this map belongs to.
 */
export interface GeneratedMap {
  nodes: Record<string, MapNode>;
  edges: MapEdge[];
  layers: MapNode[][];
  mapIndex: number;
}

/**
 * A single row from the NODE_WEIGHTS table.
 * Maps each NodeType to its relative weight for random selection.
 */
export type NodeWeightRow = Partial<Record<NodeType, number>>;
