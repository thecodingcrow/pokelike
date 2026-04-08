import type { MapNode, Item } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { BadgeBar } from '@/components/hud/BadgeBar';
import { TeamBar } from '@/components/hud/TeamBar';
import { ItemBar } from '@/components/hud/ItemBar';
import { MapCanvas } from '@/components/map/MapCanvas';
import { GYM_LEADERS } from '@/data/gymLeaders';
import { useGame } from '@/hooks/useGame';

function SettingsIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PokedexIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="16" height="20" rx="0" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="12" y2="15" />
    </svg>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="
        w-9 h-9 flex items-center justify-center
        border-2 border-white bg-game-panel text-white
        shadow-pixel
        hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pixel-lg
        active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
        transition-none cursor-pointer
      "
    >
      {children}
    </button>
  );
}

export function MapScreen() {
  const { send } = useGame();

  const map = useGameStore((s) => s.map);
  const team = useGameStore((s) => s.team);
  const items = useGameStore((s) => s.items);
  const badges = useGameStore((s) => s.badges);
  const currentMap = useGameStore((s) => s.currentMap);
  const openModal = useUIStore((s) => s.openModal);

  // Reorder support — swap team slots directly via store
  const swapTeamMember = useGameStore((s) => s.swapTeamMember);
  function handleReorder(from: number, to: number) {
    const a = team[from];
    const b = team[to];
    if (!a || !b) return;
    swapTeamMember(from, b);
    swapTeamMember(to, a);
  }

  function handleItemClick(item: Item) {
    openModal('item-equip', { item });
  }

  function handleNodeClick(node: MapNode) {
    send({ type: 'CLICK_NODE', node });
  }

  const gymLeader = GYM_LEADERS[currentMap];
  const mapLabel = gymLeader
    ? `Gym ${currentMap + 1} — vs ${gymLeader.name}`
    : currentMap === 8
    ? 'Elite Four'
    : `Map ${currentMap + 1}`;

  return (
    <div className="flex flex-col min-h-dvh bg-game-bg overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-3 py-2 border-b-2 border-white/20 bg-game-panel shrink-0">
        <BadgeBar badges={badges} />

        <div className="flex items-center gap-2">
          <span className="font-terminal text-[16px] text-[#94a3b8] hidden sm:block">
            {mapLabel}
          </span>
          <IconButton label="Open Pokedex" onClick={() => openModal('pokedex')}>
            <PokedexIcon />
          </IconButton>
          <IconButton label="Open Settings" onClick={() => openModal('settings')}>
            <SettingsIcon />
          </IconButton>
        </div>
      </header>

      {/* ── Map area ───────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-2">
        {map ? (
          <MapCanvas map={map} onNodeClick={handleNodeClick} />
        ) : (
          <div className="font-terminal text-[24px] text-[#94a3b8] flex items-center gap-1">
            Generating map
            <span className="animate-blink">_</span>
          </div>
        )}
      </main>

      {/* ── Footer HUD ─────────────────────────────────────────────────────── */}
      <footer className="shrink-0 border-t-2 border-white/20 bg-game-panel px-3 py-2 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-pixel text-[8px] text-[#94a3b8] uppercase tracking-wide">
            Team
          </span>
          <TeamBar team={team} onReorder={handleReorder} />
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-pixel text-[8px] text-[#94a3b8] uppercase tracking-wide">
              Items
            </span>
            <ItemBar items={items} onItemClick={handleItemClick} />
          </div>
        )}
      </footer>
    </div>
  );
}
