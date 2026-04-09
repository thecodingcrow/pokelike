# Desktop Layout Proposal — Pokelike

**Author:** Layout/Composition Designer  
**Date:** 2026-04-08  
**Status:** Proposal — not yet approved

---

## The Core Problem

The game is a 1200px-capped centered column on a 1440–1920px screen. Two effects compound: (1) ~30–35% of horizontal pixels are dead `#0a0a0f` gutters, and (2) every screen stacks vertically — header → content → footer — so the map DAG gets squeezed into a narrow tall strip with minimal breathing room. This is the mobile-column antipattern on a desktop.

The Balatro reference is instructive. Balatro uses a **fixed-ratio game canvas** (roughly 16:10) that fills most of the viewport, with the sidebar/HUD information spread **horizontally alongside** the action, not stacked above and below it. The game feels like a desktop artifact, not a web page.

---

## Overall Container Strategy

### Recommendation: Fixed-Ratio Game Canvas, Edge-to-Edge Background

Do **not** use `max-w-[1200px] mx-auto`. Instead, use a fixed aspect-ratio container that fills the viewport height and is centered horizontally. The game window aspect ratio should be **16:10** (1.6:1). This is Balatro's approximate ratio and fits the split-panel structure described below.

```
viewport
└── .game-root          // full screen, #0a0a0f bg
    └── .game-canvas    // fixed aspect-ratio, centered, clips children
        └── <screen>
```

**Canvas sizing:**

| Viewport width | Canvas behavior |
|---|---|
| < 900px | Full-width, height auto (mobile fallback — see below) |
| 900–1200px | Canvas = 90vw, height = 90vw / 1.6 |
| 1200–1600px | Canvas = min(95vw, calc(100dvh * 1.6)), height = canvas-width / 1.6 |
| 1600px+ | Canvas = min(92vw, calc(100dvh * 1.6)), height anchored to 100dvh minus safe margins |

**Why 16:10 not 16:9?** The game has persistent HUD panels that need vertical real estate. 16:10 gives ~6% more vertical room vs 16:9 — enough for the sidebar panels to not feel cramped without losing widescreen feel.

**Implementation token:**

```css
:root {
  --game-aspect: 16 / 10;
  --game-max-w: min(95vw, calc(100dvh * 1.6));
  --sidebar-w: 260px;
  --sidebar-w-wide: 300px;   /* 1600px+ */
}

.game-root {
  width: 100dvw;
  height: 100dvh;
  background: #0a0a0f;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.game-canvas {
  width: var(--game-max-w);
  aspect-ratio: var(--game-aspect);
  position: relative;
  overflow: hidden;
  background: #0a0a0f;
  border: 2px solid rgba(255,255,255,0.08); /* subtle chrome frame */
}
```

### What happens in the gutters?

The background is already `#0a0a0f` — the gutters match the game background so they disappear visually. At 1920px the canvas will be roughly 1536px × 960px, leaving ~192px of gutter each side. These gutters are not dead space — they are the **visual frame** that reinforces the "game running in a viewport" feel (like SNES games on a black TV bezel). Do not fill them with UI. This is intentional.

---

## Map Screen Layout

### Current state

```
[header: badges ─────────────────── map label | icons]
[                  map DAG SVG                        ]
[footer: team bar ── item bar                         ]
```

The DAG is squeezed between header and footer in a tall narrow box. The SVG's `preserveAspectRatio="xMidYMid meet"` means it letterboxes itself — the actual interactive area is much smaller than the available space.

### Proposed layout: Left sidebar + full-height map

```
┌────────────────────────────────────────────────────┐
│ sidebar (260px)  │  map DAG (fluid)                │
│                  │                                 │
│ [POKELIKE]       │                                 │
│ Gym 3 — Surge    │      ·──·                       │
│ ─────────────── │     /    \                      │
│ [badge row]      │  ·──·    ·                      │
│                  │   \   /                         │
│ ─────────────── │    ·──·                         │
│ Team             │      |                          │
│ [slot][slot]...  │      ● (boss)                   │
│                  │                                 │
│ ─────────────── │                                 │
│ Items            │                                 │
│ [item][item]...  │                                 │
│                  │                                 │
│ ─────────────── │                                 │
│ [Pokédex] [⚙]   │                                 │
└────────────────────────────────────────────────────┘
```

**Sidebar contents (top to bottom):**
1. Game title / run label (small, pixel font) — anchors identity
2. Current map name & gym leader name
3. Horizontal divider
4. Badge row (8 hexagons — they fit in 260px at 26px each with 6px gap)
5. Divider
6. "TEAM" label + 6 team slots (2×3 grid, not a horizontal strip)
7. Divider
8. "ITEMS" label + item slots (wrap grid)
9. Divider (pushed to bottom with `margin-top: auto`)
10. Icon buttons: Pokédex, Settings

**Map area:**
- Gets the remaining width (~fluid, all space after sidebar)
- MapCanvas SVG uses `preserveAspectRatio="xMidYMid meet"` with full `w-full h-full` — now it has a **wide landscape** viewport to fill rather than a portrait strip, so the DAG spreads naturally
- The DAG's `H_SPACING` could be increased (100–120px) and `V_SPACING` reduced (44px) since it now has horizontal room
- No top/bottom chrome — the map fills the entire right panel edge-to-edge

**CSS structure:**

```css
/* Map screen — horizontal split */
.map-screen {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  height: 100%;
  overflow: hidden;
}

.map-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  background: var(--color-game-panel);        /* #121827 */
  border-right: 2px solid rgba(255,255,255,0.12);
  overflow-y: auto;
  padding: 16px 12px;
}

.map-sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.map-sidebar__footer {
  margin-top: auto;
  display: flex;
  gap: 8px;
  padding-top: 12px;
}

.map-main {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
```

**Team slots in sidebar — 2-column grid:**

```css
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  gap: 4px;
}
```

This converts the horizontal `TeamBar` into a 3×2 grid — 3 columns of 44px slots = 144px, comfortably inside a 236px inner width sidebar. The `TeamBar` component would need a `layout="grid"` prop or a new `TeamGrid` variant.

---

## Battle Screen Layout

### Current state

```
[header bar: battle title | subtitle]
[                                   ]
[  enemy sprite (TL)  info (TR)     ]  ~70% height
[  info (BL)  player sprite (BR)    ]
[                                   ]
[──────────────────────────────────]
[  log text                   SKIP ]  ~30% height
```

This works acceptably but the wide canvas creates a problem: the sprites are in the corners at 96×96px, and the center of the arena is completely empty at large widths. The dialogue box is also shallow.

### Proposed layout: Arena + right panel

```
┌──────────────────────────────────┬────────────────┐
│  BATTLE ARENA                    │  SIDE PANEL    │
│                                  │                │
│   [enemy sprite 128px]           │  Enemy info    │
│   (top-center, slightly left)    │  Lv XX         │
│                                  │  HP ████░░     │
│                                  │  [type][type]  │
│                                  │  ─────────     │
│   [player sprite 128px]          │  Player info   │
│   (bottom-center, slightly right)│  Lv XX         │
│                                  │  HP ████████   │
│                                  │  [type][type]  │
│                                  │  ─────────     │
│                                  │  [team dots]   │
│                                  │                │
├──────────────────────────────────┤                │
│  log text...  ▼            SKIP  │                │
└──────────────────────────────────┴────────────────┘
```

**Right panel width:** same `--sidebar-w` (260px) — consistent with map screen, reinforces that the sidebar is a persistent chrome element.

**Arena area:** gets the remaining width. Sprites are centered in it — enemy at top-center, player at bottom-center — not corner-positioned. This uses `position: absolute` in the arena with `left: 50%` anchoring rather than `justify-between`. Sprites scale to 128×128px (up from 96px) since the arena is wider.

**Right panel contents (top to bottom):**
1. Enemy Pokémon name + level
2. Enemy HP bar (with type badges below)
3. Horizontal divider with "VS" label
4. Player Pokémon name + level
5. Player HP bar + exact HP numbers (only player shows numerics)
6. Player type badges
7. Divider
8. Team status dots (6 dots showing fainted/healthy state)

**Dialogue box:** stays at the bottom of the arena, full arena-width. Height increases from `min-h-[120px]` to `min-h-[140px]`. No change needed.

**CSS structure:**

```css
/* Battle screen */
.battle-screen {
  display: grid;
  grid-template-columns: 1fr var(--sidebar-w);
  grid-template-rows: auto 1fr;
  height: 100%;
}

.battle-header {
  grid-column: 1 / -1;     /* spans both columns */
  /* existing header styles */
}

.battle-arena-col {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.battle-arena {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.battle-log {
  flex-shrink: 0;
  border-top: 4px solid white;
  min-height: 140px;
  max-height: 30%;
  padding: 16px 24px 20px;
  position: relative;
}

.battle-side-panel {
  background: var(--color-game-panel);
  border-left: 2px solid rgba(255,255,255,0.12);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  gap: 12px;
  overflow-y: auto;
}
```

**Sprite positioning in arena (centered, not corner-based):**

```css
.battle-arena__enemy {
  position: absolute;
  top: 10%;
  left: 30%;                /* left of center */
  transform: translateX(-50%);
}

.battle-arena__player {
  position: absolute;
  bottom: 10%;
  left: 65%;                /* right of center */
  transform: translateX(-50%);
}
```

This diagonal positioning (enemy top-left-of-center, player bottom-right-of-center) mimics the original GB battle layout geometry but in a wider frame. The `PokemonInfoPanel` components move to the sidebar, removing the clutter from the arena corners.

---

## Title Screen Layout

### Current state

Centered column, `flex-col items-center justify-center`, works fine but is vanilla. On a 16:10 canvas it will be perfectly centered — no changes structurally needed. However, the canvas aspect ratio change means the title has more horizontal room and less vertical compression.

### Proposed changes (minimal)

**Two-column layout:** split the title into a left decorative panel and a right action panel.

```
┌─────────────────────────┬──────────────────────┐
│                         │                      │
│   P O K E L I K E      │   NEW RUN            │
│   A Pokemon Roguelike   │   HARD MODE          │
│                         │                      │
│   [decorative Pokeball  │   ─────────          │
│    or static art or     │   POKEDEX            │
│    animated logo]       │   ACHIEVEMENTS       │
│                         │   HALL OF FAME       │
│                         │   SETTINGS           │
│                         │                      │
└─────────────────────────┴──────────────────────┘
```

**Left panel:** 55% width — title heading, subtitle, decorative separator, some static pixel art or ASCII decoration. Dark, atmospheric.

**Right panel:** 45% width, right-aligned — primary action buttons stacked vertically, secondary nav buttons below. Has a left border matching the sidebar divider style.

**CSS:**

```css
.title-screen {
  display: grid;
  grid-template-columns: 55fr 45fr;
  height: 100%;
}

.title-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 48px;
  gap: 24px;
}

.title-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 48px;
  gap: 16px;
  border-left: 2px solid rgba(255,255,255,0.12);
  background: var(--color-game-panel);
}
```

This is a low-risk change — the existing components are placed into the grid cells with only structural wrapper changes.

---

## Responsive Approach

### Philosophy: Desktop-native, graceful degradation

This is a **desktop roguelike**. Mobile is a fallback tier, not a primary target. The breakpoint strategy reflects this: the 16:10 canvas is the "true" layout, and narrow viewports get a simplified stacked fallback.

| Breakpoint | Behavior |
|---|---|
| `< 640px` | Full-width single-column layout (current mobile layout, no sidebar). Game canvas fills viewport. |
| `640–900px` | Canvas fills width, sidebar collapses to a thin icon-only strip (36px) — tap to expand as a drawer |
| `900–1200px` | Full sidebar layout, `--sidebar-w: 220px`. Canvas aspect ratio still enforced. |
| `1200–1600px` | Full sidebar layout, `--sidebar-w: 260px`. Canvas = `min(95vw, calc(100dvh * 1.6))`. |
| `1600px+` | `--sidebar-w: 300px`. Sprites and fonts scale up slightly. |

### Narrow screen (< 900px) sidebar collapse

The sidebar does not disappear — it becomes an icon strip. Each section is represented by a single icon (badges icon, team icon, items icon, settings icon). Tapping an icon opens a bottom-sheet drawer with that section's content. This keeps HUD info accessible without taking horizontal space.

```css
@media (max-width: 900px) {
  .map-screen,
  .battle-screen {
    grid-template-columns: 48px 1fr;
  }
  
  .map-sidebar__label,
  .map-sidebar__text,
  .team-grid,
  .badge-bar,
  .item-bar {
    display: none;
  }
  
  .map-sidebar__icon-only {
    display: flex;
  }
}
```

### The `< 640px` exception

Below 640px, abandon the sidebar grid entirely. Revert to the current top-header / bottom-footer / center-map layout. The game is unplayable at this size anyway (pointer targets too small for map nodes, battle text too compressed). This is the "it technically works" tier — not optimized for.

```css
@media (max-width: 640px) {
  .game-canvas {
    width: 100dvw;
    height: 100dvh;
    aspect-ratio: unset;
    border: none;
  }
  
  .map-screen,
  .battle-screen {
    grid-template-columns: 1fr;  /* collapse sidebar */
    grid-template-rows: auto 1fr auto;
  }
  
  /* Restore header/footer HUD */
  .map-sidebar { display: none; }
  .map-header  { display: flex; }
  .map-footer  { display: flex; }
}
```

---

## Grid/Flex Structure Summary

| Screen | Outer structure | Left col | Right col |
|---|---|---|---|
| Title | `grid 55fr / 45fr` | Hero/branding | Action buttons |
| Map | `grid 260px / 1fr` | Sidebar HUD | MapCanvas SVG |
| Battle | `grid 1fr / 260px` | Arena + log | Pokémon info panels |
| Game Over / Win | `flex-col center` | — | Full width |
| Starter Select | `flex-col center` | — | Full width, card row |

The sidebar is always **260px** (left on map, right on battle). Flipping the side keeps the information display on the "reading side" — battle info is on the right because the player processes it while watching the arena. Map info is on the left because DAGs are read left-to-right (start → boss) and the sidebar anchors the left edge.

---

## Specific Layout CSS

### Map Screen

```tsx
// MapScreen.tsx — restructured shell
<div className="map-screen h-full overflow-hidden" style={{
  display: 'grid',
  gridTemplateColumns: 'var(--sidebar-w, 260px) 1fr',
}}>
  {/* LEFT: Sidebar */}
  <aside style={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#121827',
    borderRight: '2px solid rgba(255,255,255,0.1)',
    padding: '16px 12px',
    overflowY: 'auto',
    gap: 0,
  }}>
    {/* Run info */}
    <div style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
      <div className="font-pixel text-[8px] text-white/40 uppercase tracking-widest mb-1">Pokelike</div>
      <div className="font-terminal text-[18px] text-[#94a3b8]">{mapLabel}</div>
    </div>

    {/* Badges */}
    <div style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
      <div className="font-pixel text-[7px] text-white/40 uppercase mb-2">Badges</div>
      <BadgeBar badges={badges} />
    </div>

    {/* Team — 3-column grid */}
    <div style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
      <div className="font-pixel text-[7px] text-white/40 uppercase mb-2">Team</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: 4 }}>
        <TeamBar team={team} onReorder={handleReorder} layout="grid" />
      </div>
    </div>

    {/* Items */}
    {items.length > 0 && (
      <div style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
        <div className="font-pixel text-[7px] text-white/40 uppercase mb-2">Items</div>
        <ItemBar items={items} onItemClick={handleItemClick} />
      </div>
    )}

    {/* Footer actions — pushed to bottom */}
    <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 12 }}>
      <IconButton label="Open Pokedex" onClick={() => openModal('pokedex')}>
        <PokedexIcon />
      </IconButton>
      <IconButton label="Open Settings" onClick={() => openModal('settings')}>
        <SettingsIcon />
      </IconButton>
    </div>
  </aside>

  {/* RIGHT: Map canvas — full height, no chrome */}
  <main style={{
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
  }}>
    {map
      ? <MapCanvas map={map} onNodeClick={handleNodeClick} />
      : <div className="font-terminal text-[24px] text-[#94a3b8] flex items-center gap-1">
          Generating map<span className="animate-blink">_</span>
        </div>
    }
  </main>
</div>
```

**MapCanvas constants update (to exploit the wider viewport):**
```ts
const H_SPACING = 110;   // up from 90 — DAG spreads horizontally
const V_SPACING = 48;    // down from 52 — less vertical compression
const PADDING   = 48;    // up from 40
```

---

### Battle Screen

```tsx
// BattleScreen.tsx — restructured shell
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr var(--sidebar-w, 260px)',
  gridTemplateRows: 'auto 1fr',
  height: '100%',
}}>
  {/* Header — spans full width */}
  {(battleTitle || battleSubtitle) && (
    <div style={{ gridColumn: '1 / -1' }}
      className="bg-[#121827] border-b-2 border-white px-4 py-2 flex items-center justify-between flex-shrink-0"
    >
      <span className="font-pixel text-[10px] text-white truncate">{battleTitle}</span>
      <span className="font-terminal text-[18px] text-[#94a3b8]">{battleSubtitle}</span>
    </div>
  )}

  {/* Left: Arena column (arena + log stacked) */}
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
    {/* Arena — sprites centered, no info panels here */}
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
      {/* Enemy sprite — top, left-of-center */}
      <div style={{ position: 'absolute', top: '10%', left: '30%', transform: 'translateX(-50%)' }}>
        <PokemonSprite pokemon={enemyActive} isDamaged={enemyDamaged} isFainted={enemyFainted} size={128} />
      </div>
      {/* Player sprite — bottom, right-of-center */}
      <div style={{ position: 'absolute', bottom: '10%', left: '65%', transform: 'translateX(-50%)' }}>
        <PokemonSprite pokemon={playerActive} isDamaged={playerDamaged} isFainted={playerFainted} size={128} />
      </div>
      {/* Effectiveness flash */}
      {effectivenessText && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-20">
          <div className="font-pixel text-[10px] px-3 py-1 border-2 border-white shadow-pixel bg-pokemon-red text-white">
            {effectivenessText}
          </div>
        </div>
      )}
    </div>

    {/* Log box — fixed height strip at bottom of arena col */}
    <div style={{
      flexShrink: 0,
      borderTop: '4px solid white',
      background: '#0a0a0f',
      minHeight: 140,
      padding: '16px 24px 20px',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
        {isComplete
          ? <button className="btn-pixel bg-pokemon-green text-white" onClick={onContinue}>Continue</button>
          : <button className="btn-pixel bg-game-panel text-white/70" onClick={onSkip}>Skip</button>
        }
      </div>
      {logMessages.length > 1 && (
        <div className="font-terminal text-[18px] text-white/40 leading-tight mb-1 truncate">
          {logMessages[logMessages.length - 2]?.text}
        </div>
      )}
      <div className="font-terminal text-[22px] text-white leading-snug" aria-live="polite">
        {currentMessage}
        {currentMessage && <span className="animate-blink ml-1">▼</span>}
      </div>
    </div>
  </div>

  {/* Right: Info panel */}
  <div style={{
    background: '#121827',
    borderLeft: '2px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    gap: 16,
    overflowY: 'auto',
  }}>
    {/* Enemy info */}
    <div>
      <div className="font-pixel text-[7px] text-white/40 uppercase mb-2">Enemy</div>
      <PokemonInfoPanel pokemon={enemyActive} side="enemy" />
    </div>

    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />

    {/* Player info */}
    <div>
      <div className="font-pixel text-[7px] text-white/40 uppercase mb-2">Your Team</div>
      <PokemonInfoPanel pokemon={playerActive} side="player" />
      {/* Team status dots */}
      <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
        {playerTeam.map((p, i) => (
          <div key={i} style={{
            width: 10, height: 10,
            background: p.currentHp <= 0 ? '#555' : p.currentHp / p.maxHp > 0.5 ? '#22c55e' : p.currentHp / p.maxHp > 0.2 ? '#f59e0b' : '#dc2626',
            border: '1px solid rgba(255,255,255,0.3)',
            outline: i === playerActiveIdx ? '1px solid white' : 'none',
            outlineOffset: 1,
          }} />
        ))}
      </div>
    </div>
  </div>
</div>
```

---

## Implementation Notes

1. **CSS variable for sidebar width.** Define `--sidebar-w` in `:root` and override in media queries. Both map and battle screens consume it — changing one value resizes both.

2. **`TeamBar` layout prop.** The current `TeamBar` renders a horizontal `flex-row`. Add a `layout?: 'row' | 'grid'` prop — when `'grid'`, it wraps into a 3-column grid. The slot rendering logic is identical; only the container changes.

3. **`PokemonInfoPanel` extraction.** Currently embedded in `BattleField.tsx`. Extract to `src/components/battle/PokemonInfoPanel.tsx` so `BattleScreen` can render it in the side panel independently.

4. **`PokemonSprite` size prop.** Currently hardcoded `w-24 h-24` (96px). Accept an optional `size?: number` prop, defaulting to `96`, to allow the battle arena to render at `128px`.

5. **`App.tsx` wrapper change.** Replace `max-w-[1200px] mx-auto` with the `.game-root` / `.game-canvas` pattern. This is a one-line class change on the outer div plus a new inner wrapper.

6. **No change to `MapCanvas` SVG logic.** The SVG already uses `viewBox` + `preserveAspectRatio="xMidYMid meet"` — it will naturally fill the wider right panel without code changes. Only the spacing constants need tuning.

7. **`min-h-dvh` removal.** Screen components currently use `min-h-dvh`. Once the game canvas is `height: 100%` from the parent, screens should use `height: 100%` instead. Using `dvh` inside a fixed-size container creates layout bugs.

---

## What This Does Not Change

- Visual style, colors, fonts, pixel aesthetic — unchanged
- XState machine, game logic, data stores — unchanged  
- Modal system — modals overlay the game canvas as before
- All existing component APIs except the two additions (TeamBar `layout` prop, PokemonSprite `size` prop)
- The `CRT overlay` pseudo-element — it is `position: fixed; inset: 0` and covers everything regardless of canvas size
