import { useState } from 'react';
import type { MapNode, Item } from '@/types';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { BadgeBar } from '@/components/hud/BadgeBar';
import { TeamBar } from '@/components/hud/TeamBar';
import { ItemBar } from '@/components/hud/ItemBar';
import { MapCanvas } from '@/components/map/MapCanvas';
import { GYM_LEADERS } from '@/data/gymLeaders';
import { useGame } from '@/hooks/useGame';
import { PokemonDrawer } from '@/components/ui/PokemonDrawer';

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
        border-2 border-[#c8a96e] bg-game-panel text-[#f0ead6]
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

  const [drawerPokemonIdx, setDrawerPokemonIdx] = useState<number | null>(null);

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
    const itemIdx = items.indexOf(item);
    if (item.isUsable) {
      openModal('usable-item', { item, itemIdx });
    } else {
      openModal('item-equip', { item });
    }
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
    <div className="screen-map h-full overflow-hidden">
      {/*
        Desktop (≥900px): CSS grid — 220px sidebar + map fills rest.
        Tablet (640–899px) & Mobile (<640px): full-width map with floating overlays.
      */}

      {/*
        We use a single container that switches between layouts via media queries.
        The grid is activated at 900px via an inline style + a wrapper class.
      */}
      <div className="relative h-full map-screen-layout">
        {/* ── Sidebar (desktop only) ───────────────────────────────────────── */}
        <aside className="map-sidebar hidden flex-col gap-4 p-4 border-r-2 border-[#c8a96e]/30 bg-[#161d14] overflow-y-auto">
          {/* Gym label */}
          <div>
            <div className="font-terminal text-[10px] text-[#c8a96e]/60 uppercase tracking-widest mb-1">
              Current Map
            </div>
            <div className="font-terminal text-[14px] text-[#f0ead6]">
              {mapLabel}
            </div>
          </div>

          {/* Badges */}
          <div>
            <div className="font-terminal text-[10px] text-[#c8a96e]/60 uppercase tracking-widest mb-2">
              Badges
            </div>
            <BadgeBar badges={badges} />
          </div>

          {/* Team */}
          <div>
            <div className="font-terminal text-[10px] text-[#c8a96e]/60 uppercase tracking-widest mb-2">
              Team
            </div>
            <TeamBar team={team} onReorder={handleReorder} layout="grid" onPokemonTap={setDrawerPokemonIdx} />
          </div>

          {/* Items (if any) */}
          {items.length > 0 && (
            <div>
              <div className="font-terminal text-[10px] text-[#c8a96e]/60 uppercase tracking-widest mb-2">
                Items
              </div>
              <ItemBar items={items} onItemClick={handleItemClick} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-auto">
            <IconButton label="Open Pokedex" onClick={() => openModal('pokedex')}>
              <PokedexIcon />
            </IconButton>
            <IconButton label="Open Settings" onClick={() => openModal('settings')}>
              <SettingsIcon />
            </IconButton>
          </div>
        </aside>

        {/* ── Map area ────────────────────────────────────────────────────── */}
        <div className="map-canvas-area relative flex items-center justify-center overflow-hidden">
          {map ? (
            <MapCanvas map={map} onNodeClick={handleNodeClick} />
          ) : (
            <div className="font-terminal text-[24px] text-[#c8a96e]/60 flex items-center gap-1">
              Generating map
              <span className="animate-blink">_</span>
            </div>
          )}

          {/* ── Mobile / tablet floating overlays (hidden on desktop) ──────── */}

          {/* Top-left: badges */}
          <div
            className="map-float-badges absolute left-3 z-10"
            style={{ top: 'max(12px, env(safe-area-inset-top, 12px))' }}
          >
            <BadgeBar badges={badges} />
          </div>

          {/* Top-right: icon buttons */}
          <div
            className="map-float-actions absolute right-3 z-10 flex items-center gap-2"
            style={{ top: 'max(12px, env(safe-area-inset-top, 12px))' }}
          >
            <span className="font-terminal text-[11px] text-[#c8a96e]/60 hidden sm:inline">
              {mapLabel}
            </span>
            <IconButton label="Open Pokedex" onClick={() => openModal('pokedex')}>
              <PokedexIcon />
            </IconButton>
            <IconButton label="Open Settings" onClick={() => openModal('settings')}>
              <SettingsIcon />
            </IconButton>
          </div>

          {/* Bottom: team strip + items */}
          <div
            className="map-float-footer absolute left-3 right-3 z-10 flex items-end gap-3"
            style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
          >
            <TeamBar team={team} onReorder={handleReorder} onPokemonTap={setDrawerPokemonIdx} />
            {items.length > 0 && (
              <ItemBar items={items} onItemClick={handleItemClick} />
            )}
          </div>
        </div>
      </div>

      <PokemonDrawer
        pokemon={drawerPokemonIdx !== null ? team[drawerPokemonIdx] ?? null : null}
        teamIndex={drawerPokemonIdx ?? 0}
        teamSize={team.length}
        onClose={() => setDrawerPokemonIdx(null)}
        onMoveUp={() => {
          if (drawerPokemonIdx !== null && drawerPokemonIdx > 0) {
            const a = team[drawerPokemonIdx];
            const b = team[drawerPokemonIdx - 1];
            if (a && b) {
              swapTeamMember(drawerPokemonIdx, b);
              swapTeamMember(drawerPokemonIdx - 1, a);
              setDrawerPokemonIdx(drawerPokemonIdx - 1);
            }
          }
        }}
        onMoveDown={() => {
          if (drawerPokemonIdx !== null && drawerPokemonIdx < team.length - 1) {
            const a = team[drawerPokemonIdx];
            const b = team[drawerPokemonIdx + 1];
            if (a && b) {
              swapTeamMember(drawerPokemonIdx, b);
              swapTeamMember(drawerPokemonIdx + 1, a);
              setDrawerPokemonIdx(drawerPokemonIdx + 1);
            }
          }
        }}
        onUnequip={() => {
          if (drawerPokemonIdx !== null) {
            useGameStore.getState().unequipItem(drawerPokemonIdx);
          }
        }}
      />

      <style>{`
        /* Desktop grid layout at 900px+ */
        @media (min-width: 900px) {
          .map-screen-layout {
            display: grid;
            grid-template-columns: 220px 1fr;
          }
          .map-sidebar {
            display: flex !important;
          }
          /* Hide floating overlays on desktop — sidebar handles those */
          .map-float-badges,
          .map-float-actions,
          .map-float-footer {
            display: none !important;
          }
        }

        /* Mobile (<640px): ensure map fills height, floating overlays visible */
        @media (max-width: 639px) {
          .map-screen-layout {
            display: block;
          }
          .map-canvas-area {
            width: 100%;
            height: 100%;
          }
        }

        /* Tablet (640–899px): same as mobile, floating overlays */
        @media (min-width: 640px) and (max-width: 899px) {
          .map-screen-layout {
            display: block;
          }
          .map-canvas-area {
            width: 100%;
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}
