import { useMemo, useState } from 'react';
import type { GeneratedMap, MapNode } from '@/types';
import { getNodeSprite, getNodeColor, getNodeLabel } from '@/systems/map';

// Layout constants
const NODE_RADIUS = 22;
const H_SPACING = 72;   // horizontal space between node centres
const V_SPACING = 72;   // vertical space between layers
const PADDING = 48;     // SVG padding top/left/right/bottom

interface MapCanvasProps {
  map: GeneratedMap;
  onNodeClick: (node: MapNode) => void;
}

interface NodeLayout {
  node: MapNode;
  cx: number;
  cy: number;
}

/**
 * Compute pixel positions for every node, treating each layer as a centred
 * horizontal row. The SVG grows to fit content.
 */
function computeLayout(layers: MapNode[][]): {
  positions: Record<string, { cx: number; cy: number }>;
  svgWidth: number;
  svgHeight: number;
} {
  const maxPerRow = Math.max(...layers.map((l) => l.length));
  const svgWidth = PADDING * 2 + (maxPerRow - 1) * H_SPACING;
  const svgHeight = PADDING * 2 + (layers.length - 1) * V_SPACING;

  const positions: Record<string, { cx: number; cy: number }> = {};

  layers.forEach((layer, li) => {
    const rowWidth = (layer.length - 1) * H_SPACING;
    const startX = (svgWidth - rowWidth) / 2;
    const cy = PADDING + li * V_SPACING;

    layer.forEach((node, ci) => {
      positions[node.id] = { cx: startX + ci * H_SPACING, cy };
    });
  });

  return { positions, svgWidth, svgHeight };
}

/** Single node circle + sprite/label */
function MapNodeCircle({
  layout,
  onNodeClick,
}: {
  layout: NodeLayout;
  onNodeClick: (node: MapNode) => void;
}) {
  const { node, cx, cy } = layout;
  const [imgError, setImgError] = useState(false);

  const sprite = getNodeSprite(node);
  const color = getNodeColor(node);
  const label = getNodeLabel(node);

  const isAccessible = node.accessible && !node.visited;
  const isVisited = node.visited;

  const opacity = isVisited ? 0.35 : isAccessible ? 1 : 0.55;
  const cursor = isAccessible ? 'cursor-pointer' : 'cursor-default';

  const strokeColor = isAccessible ? '#f8d030' : 'rgba(255,255,255,0.4)';
  const strokeWidth = isAccessible ? 2.5 : 1.5;

  const pulseClass = isAccessible ? 'animate-blink' : '';

  return (
    <g
      className={cursor}
      onClick={() => isAccessible && onNodeClick(node)}
      role={isAccessible ? 'button' : undefined}
      aria-label={label}
      tabIndex={isAccessible ? 0 : undefined}
      onKeyDown={
        isAccessible
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onNodeClick(node);
            }
          : undefined
      }
    >
      {/* Accessible pulse ring */}
      {isAccessible && (
        <circle
          cx={cx}
          cy={cy}
          r={NODE_RADIUS + 4}
          fill="none"
          stroke="#f8d030"
          strokeWidth={1}
          opacity={0.5}
          className={pulseClass}
        />
      )}

      {/* Background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={NODE_RADIUS}
        fill={color}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />

      {/* Sprite or fallback */}
      {sprite && !imgError ? (
        <image
          href={sprite}
          x={cx - NODE_RADIUS + 4}
          y={cy - NODE_RADIUS + 4}
          width={(NODE_RADIUS - 4) * 2}
          height={(NODE_RADIUS - 4) * 2}
          preserveAspectRatio="xMidYMid meet"
          opacity={opacity}
          style={{ imageRendering: 'pixelated' }}
          onError={() => setImgError(true)}
        />
      ) : null}

      {/* Node label below the circle */}
      <text
        x={cx}
        y={cy + NODE_RADIUS + 12}
        textAnchor="middle"
        fill={isVisited ? '#555' : isAccessible ? '#f8d030' : '#94a3b8'}
        fontSize={8}
        fontFamily='"Press Start 2P", cursive'
        opacity={opacity}
      >
        {label.length > 12 ? label.slice(0, 12) + '…' : label}
      </text>
    </g>
  );
}

export function MapCanvas({ map, onNodeClick }: MapCanvasProps) {
  const { positions, svgWidth, svgHeight } = useMemo(
    () => computeLayout(map.layers),
    [map.layers],
  );

  const nodeLayouts: NodeLayout[] = useMemo(
    () =>
      Object.values(map.nodes).map((node) => ({
        node,
        cx: positions[node.id]?.cx ?? 0,
        cy: positions[node.id]?.cy ?? 0,
      })),
    [map.nodes, positions],
  );

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      height="100%"
      style={{ maxHeight: '100%', display: 'block' }}
      aria-label="Game map"
    >
      {/* Edges */}
      <g>
        {map.edges.map((edge) => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          if (!from || !to) return null;

          const fromNode = map.nodes[edge.from];
          const toNode = map.nodes[edge.to];
          const isActive =
            fromNode?.visited && toNode && !toNode.visited;

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.cx}
              y1={from.cy}
              x2={to.cx}
              y2={to.cy}
              stroke={isActive ? 'rgba(248,208,48,0.4)' : 'rgba(255,255,255,0.15)'}
              strokeWidth={isActive ? 1.5 : 1}
            />
          );
        })}
      </g>

      {/* Nodes (rendered after edges so they sit on top) */}
      <g>
        {nodeLayouts.map((layout) => (
          <MapNodeCircle
            key={layout.node.id}
            layout={layout}
            onNodeClick={onNodeClick}
          />
        ))}
      </g>
    </svg>
  );
}
