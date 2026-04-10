import { useMemo, useState } from 'react';
import type { GeneratedMap, MapNode } from '@/types';
import { getNodeSprite, getNodeColor, getNodeLabel } from '@/systems/map';
import { MapTooltip } from './MapTooltip';

// Layout constants — wider spread, compact vertically (no labels)
const NODE_RADIUS = 20;
const H_SPACING = 100;  // widened for visual breathing room
const V_SPACING = 50;   // slightly wider vertical spread
const PADDING = 40;

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

/**
 * Desaturate a hex colour (make it grey-shifted) for visited nodes.
 * Simple approach: blend toward a grey at same lightness.
 */
function desaturateHex(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const grey = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  // 70% towards grey
  const dr = Math.round(r * 0.3 + grey * 0.7);
  const dg = Math.round(g * 0.3 + grey * 0.7);
  const db = Math.round(b * 0.3 + grey * 0.7);
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

/**
 * Lighten a hex colour for the radial gradient highlight stop.
 */
function lightenHex(hex: string, amount = 0.35): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

/**
 * Darken a hex colour for the radial gradient shadow stop.
 */
function darkenHex(hex: string, amount = 0.35): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.max(0, Math.round(r * (1 - amount)));
  const dg = Math.max(0, Math.round(g * (1 - amount)));
  const db = Math.max(0, Math.round(b * (1 - amount)));
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

/** Single node circle + sprite */
function MapNodeCircle({
  layout,
  isHovered,
  maxVisitedLayer,
  onMouseEnter,
  onMouseLeave,
  onNodeClick,
}: {
  layout: NodeLayout;
  isHovered: boolean;
  maxVisitedLayer: number;
  onMouseEnter: (node: MapNode, e: React.MouseEvent<SVGGElement>) => void;
  onMouseLeave: () => void;
  onNodeClick: (node: MapNode) => void;
}) {
  const { node, cx, cy } = layout;
  const [imgError, setImgError] = useState(false);

  const sprite = getNodeSprite(node);
  const rawColor = getNodeColor(node);
  const label = getNodeLabel(node);

  const isAccessible = node.accessible && !node.visited;
  const isVisited = node.visited;
  const isUnreachable = !node.accessible && !node.visited && node.layer <= maxVisitedLayer;

  const cursor = isAccessible ? 'cursor-pointer' : 'cursor-default';

  // Chip fill: desaturate for visited or unreachable, radial gradient id per node
  const gradientId = `ng-${node.id}`;
  const baseColor = (isVisited || isUnreachable) ? desaturateHex(rawColor) : rawColor;
  const lightStop = lightenHex(baseColor);
  const darkStop  = darkenHex(baseColor);

  // Stroke colours
  const strokeColor = isUnreachable
    ? 'rgba(200,169,110,0.15)'
    : isHovered
    ? '#e8c97e'
    : isAccessible
    ? '#c8a96e'
    : 'rgba(200,169,110,0.4)';
  const strokeWidth = isAccessible || isHovered ? 2.5 : 1.5;
  const strokeDash  = isVisited ? '4 2' : undefined;

  // Hover transform applied on the <g> — suppressed for unreachable
  const transform = isHovered && !isUnreachable
    ? `translate(${cx} ${cy}) scale(1.08) translate(${-cx} ${-cy})`
    : undefined;

  return (
    <g
      className={cursor}
      transform={transform}
      style={{ transition: 'transform 150ms ease-out', opacity: isUnreachable ? 0.25 : 1 }}
      onClick={() => isAccessible && onNodeClick(node)}
      onMouseEnter={(e) => !isUnreachable && onMouseEnter(node, e)}
      onMouseLeave={onMouseLeave}
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
      {/* Accessible pulse ring — breathing animation on r */}
      {isAccessible && (
        <circle
          cx={cx}
          cy={cy}
          r={NODE_RADIUS + 5}
          fill="none"
          stroke="#c8a96e"
          strokeWidth={1.5}
          opacity={0.5}
        >
          <animate
            attributeName="r"
            values={`${NODE_RADIUS + 4};${NODE_RADIUS + 7};${NODE_RADIUS + 4}`}
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.2;0.5"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Glow behind accessible nodes */}
      {isAccessible && (
        <circle
          cx={cx}
          cy={cy}
          r={NODE_RADIUS + 2}
          fill="none"
          stroke="#d97706"
          strokeWidth={0.5}
          opacity={0.3}
          filter="url(#glow)"
        />
      )}

      {/* Chip circle with radial gradient */}
      <circle
        cx={cx}
        cy={cy}
        r={NODE_RADIUS}
        fill={`url(#${gradientId})`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
        filter="url(#dropShadow)"
      />

      {/* Sprite or fallback */}
      {sprite && !imgError ? (
        <image
          href={sprite}
          x={cx - NODE_RADIUS + 3}
          y={cy - NODE_RADIUS + 3}
          width={(NODE_RADIUS - 3) * 2}
          height={(NODE_RADIUS - 3) * 2}
          preserveAspectRatio="xMidYMid meet"
          opacity={isUnreachable ? 0.2 : isVisited ? 0.5 : 1}
          style={{ imageRendering: 'pixelated' }}
          onError={() => setImgError(true)}
        />
      ) : null}

      {/* Per-node radial gradient def — rendered inside each g so it's scoped */}
      <defs>
        <radialGradient
          id={gradientId}
          cx="35%"
          cy="30%"
          r="65%"
          fx="35%"
          fy="30%"
        >
          <stop offset="0%" stopColor={lightStop} />
          <stop offset="100%" stopColor={darkStop} />
        </radialGradient>
      </defs>
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

  const maxVisitedLayer = useMemo(() => {
    let max = -1;
    for (const n of Object.values(map.nodes)) {
      if (n.visited && n.layer > max) max = n.layer;
    }
    return max;
  }, [map.nodes]);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    nodeType: string;
    label: string;
    position: { x: number; y: number };
  } | null>(null);

  function handleMouseEnter(node: MapNode, e: React.MouseEvent<SVGGElement>) {
    setHoveredNodeId(node.id);
    const rect = (e.currentTarget as SVGGElement).getBoundingClientRect();
    setTooltip({
      nodeType: node.type,
      label: getNodeLabel(node),
      position: { x: rect.right, y: rect.top },
    });
  }

  function handleMouseLeave() {
    setHoveredNodeId(null);
    setTooltip(null);
  }

  return (
    <>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Game map"
      >
        {/* Global SVG filters */}
        <defs>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#050805" floodOpacity="0.6" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" />
          </filter>
        </defs>

        {/* Edges */}
        <g>
          {map.edges.map((edge) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (!from || !to) return null;

            const fromNode = map.nodes[edge.from];
            const toNode = map.nodes[edge.to];

            // Visited path: both visited, or visited→accessible (frontier)
            const isVisitedEdge =
              fromNode?.visited && (toNode?.visited || toNode?.accessible);

            // Unreachable: either endpoint is unreachable (passed-by branch)
            const fromUnreachable =
              !fromNode?.accessible && !fromNode?.visited && (fromNode?.layer ?? 0) <= maxVisitedLayer;
            const toUnreachable =
              !toNode?.accessible && !toNode?.visited && (toNode?.layer ?? 0) <= maxVisitedLayer;
            const isUnreachableEdge = fromUnreachable || toUnreachable;

            const stroke = isVisitedEdge
              ? 'rgba(200,169,110,0.6)'
              : isUnreachableEdge
              ? 'rgba(200,169,110,0.06)'
              : 'rgba(200,169,110,0.12)';
            const strokeWidth = isVisitedEdge ? 2 : 1;

            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.cx}
                y1={from.cy}
                x2={to.cx}
                y2={to.cy}
                stroke={stroke}
                strokeWidth={strokeWidth}
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
              isHovered={hoveredNodeId === layout.node.id}
              maxVisitedLayer={maxVisitedLayer}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onNodeClick={onNodeClick}
            />
          ))}
        </g>
      </svg>

      <MapTooltip
        nodeType={tooltip?.nodeType ?? ''}
        label={tooltip?.label ?? ''}
        position={tooltip?.position ?? null}
      />
    </>
  );
}
