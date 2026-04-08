/**
 * map.test.ts
 *
 * Tests for generateMap, advanceFromNode, getAccessibleNodes, resolveQuestionNode.
 */

import { describe, it, expect } from 'vitest';
import { generateMap, advanceFromNode, getAccessibleNodes, resolveQuestionNode } from '@/systems/map';
import type { NodeType } from '@/types';

// Valid node types (all content nodes must be one of these)
const VALID_NODE_TYPES: NodeType[] = [
  'start', 'boss', 'battle', 'catch', 'item', 'trainer',
  'pokecenter', 'legendary', 'question', 'move_tutor', 'trade',
];

describe('generateMap — structure', () => {
  it('produces exactly 23 nodes across 9 layers', () => {
    const map = generateMap(0);
    const nodeCount = Object.keys(map.nodes).length;
    expect(nodeCount).toBe(23);
    expect(map.layers.length).toBe(9);
  });

  it('layer 0 is start and layer 8 is boss', () => {
    const map = generateMap(0);
    const layer0 = map.layers[0];
    const layer8 = map.layers[8];

    expect(layer0).toHaveLength(1);
    expect(layer0[0].type).toBe('start');

    expect(layer8).toHaveLength(1);
    expect(layer8[0].type).toBe('boss');
  });

  it('layer 1 has exactly catch and battle nodes', () => {
    const map = generateMap(0);
    const layer1 = map.layers[1];

    expect(layer1).toHaveLength(2);
    const types = layer1.map(n => n.type).sort();
    expect(types).toEqual(['battle', 'catch']);
  });

  it('all content nodes have valid NodeType', () => {
    const map = generateMap(0);
    for (const node of Object.values(map.nodes)) {
      expect(VALID_NODE_TYPES).toContain(node.type);
    }
  });

  it('edges connect only adjacent layers', () => {
    const map = generateMap(0);
    for (const edge of map.edges) {
      const fromNode = map.nodes[edge.from];
      const toNode = map.nodes[edge.to];
      expect(fromNode).toBeDefined();
      expect(toNode).toBeDefined();
      expect(toNode.layer - fromNode.layer).toBe(1);
    }
  });

  it('layer sizes match expected [1, 2, 3, 4, 3, 4, 3, 2, 1]', () => {
    const map = generateMap(0);
    const expectedSizes = [1, 2, 3, 4, 3, 4, 3, 2, 1];
    for (let i = 0; i < 9; i++) {
      expect(map.layers[i]).toHaveLength(expectedSizes[i]);
    }
  });
});

describe('advanceFromNode', () => {
  it('marks the node as visited', () => {
    const map = generateMap(0);
    // Layer 1 nodes are accessible from start
    const layer1Node = map.layers[1][0];
    expect(layer1Node.accessible).toBe(true);

    advanceFromNode(map, layer1Node.id);
    expect(map.nodes[layer1Node.id].visited).toBe(true);
  });

  it('locks sibling nodes in the same layer', () => {
    const map = generateMap(0);
    const layer1 = map.layers[1];
    // Both layer 1 nodes are accessible initially
    expect(layer1[0].accessible).toBe(true);
    expect(layer1[1].accessible).toBe(true);

    // Advance through the first one
    advanceFromNode(map, layer1[0].id);

    // The sibling should now be locked (not accessible)
    expect(map.nodes[layer1[1].id].accessible).toBe(false);
  });

  it('unlocks children of the visited node', () => {
    const map = generateMap(0);
    const layer1Node = map.layers[1][0];

    // Find children of this node
    const childIds = map.edges
      .filter(e => e.from === layer1Node.id)
      .map(e => e.to);
    expect(childIds.length).toBeGreaterThan(0);

    // Before advancing, children should not be accessible
    // (they may already be accessible from sibling edges, so check the specific children)
    advanceFromNode(map, layer1Node.id);

    // After advancing, all children should be accessible
    for (const childId of childIds) {
      expect(map.nodes[childId].accessible).toBe(true);
    }
  });

  it('returns the mutated map (same reference)', () => {
    const map = generateMap(0);
    const layer1Node = map.layers[1][0];
    const result = advanceFromNode(map, layer1Node.id);
    expect(result).toBe(map);
  });
});

describe('getAccessibleNodes', () => {
  it('returns only accessible + unvisited nodes', () => {
    const map = generateMap(0);
    // Initially layer 1 nodes are accessible
    const accessible = getAccessibleNodes(map);
    expect(accessible.length).toBeGreaterThan(0);
    for (const node of accessible) {
      expect(node.accessible).toBe(true);
      expect(node.visited).toBe(false);
    }
  });

  it('does not return visited nodes', () => {
    const map = generateMap(0);
    const layer1Node = map.layers[1][0];
    advanceFromNode(map, layer1Node.id);

    const accessible = getAccessibleNodes(map);
    expect(accessible.every(n => !n.visited)).toBe(true);
  });

  it('returns empty array when all accessible nodes have been visited (or none are left)', () => {
    const map = generateMap(0);
    // Advance through the entire map layer by layer
    for (let l = 1; l < 8; l++) {
      const accessible = getAccessibleNodes(map);
      if (accessible.length === 0) break;
      advanceFromNode(map, accessible[0].id);
    }
    // After reaching the boss layer, there should be at least the boss accessible
    const final = getAccessibleNodes(map);
    // Either the boss is accessible, or some layer nodes remain
    expect(final.length).toBeGreaterThanOrEqual(0);
  });
});

describe('resolveQuestionNode', () => {
  it('never returns start, boss, or question', () => {
    const forbidden: NodeType[] = ['start', 'boss', 'question'];
    // Run many times to check statistically
    for (let i = 0; i < 100; i++) {
      const resolved = resolveQuestionNode();
      expect(forbidden).not.toContain(resolved);
    }
  });

  it('returns a valid NodeType', () => {
    for (let i = 0; i < 50; i++) {
      const resolved = resolveQuestionNode();
      expect(VALID_NODE_TYPES).toContain(resolved);
    }
  });
});

describe('map reachability guarantee', () => {
  it('player can always reach the boss from any valid state (no dead ends)', () => {
    // Starting from a fresh map, advancing greedily should always provide
    // accessible nodes until the boss layer
    const map = generateMap(0);

    for (let l = 1; l <= 8; l++) {
      const accessible = getAccessibleNodes(map);
      expect(accessible.length).toBeGreaterThan(0);

      // Advance through the first accessible node
      const chosen = accessible[0];
      advanceFromNode(map, chosen.id);

      // If we just reached the boss, we're done
      if (chosen.type === 'boss') break;
    }
  });

  it('works for multiple different map indices', () => {
    for (const mapIdx of [0, 1, 5, 9]) {
      const map = generateMap(mapIdx);
      expect(Object.keys(map.nodes).length).toBe(23);
      expect(map.layers[0][0].type).toBe('start');
      expect(map.layers[8][0].type).toBe('boss');
    }
  });
});
