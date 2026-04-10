import { createPortal } from 'react-dom';

interface MapTooltipProps {
  nodeType: string;
  label: string;
  position: { x: number; y: number } | null;
}

const FLAVOR: Record<string, string> = {
  wild:     '1v1 wild encounter',
  pick:     'Choose 1 of 3 wild Pokémon',
  heal:     'Full team heal',
  shop:     'Buy items',
  boss:     'Gym Leader battle',
  trainer:  'Trainer battle',
  event:    'Random event',
  start:    'Starting point',
  shiny:    'Shiny encounter',
  battle:   'Wild battle',
  catch:    'Catch a Pokémon',
  item:     'Find an item',
  question: 'Random event',
  pokecenter: 'Full team heal',
  legendary: 'Legendary encounter!',
  move_tutor: 'Learn a new move',
  trade:    'Trade a Pokémon',
};

export function MapTooltip({ nodeType, label, position }: MapTooltipProps) {
  if (!position) return null;

  // Clamp to viewport
  const x = Math.min(position.x + 12, window.innerWidth - 200);
  const y = Math.min(position.y + 12, window.innerHeight - 80);

  return createPortal(
    <div
      className="fixed pointer-events-none z-[100]"
      style={{ left: x, top: y }}
    >
      <div
        style={{
          background: '#0d110e',
          border: '2px solid #c8a96e',
          boxShadow: '3px 3px 0 #050805',
          padding: '6px 10px',
          minWidth: 120,
        }}
      >
        <div
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8,
            color: '#c8a96e',
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: 'VT323, monospace',
            fontSize: 16,
            color: '#f0ead6',
          }}
        >
          {FLAVOR[nodeType] ?? nodeType}
        </div>
      </div>
    </div>,
    document.body,
  );
}
