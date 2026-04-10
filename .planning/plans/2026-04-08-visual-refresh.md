# Visual Refresh Implementation Plan

> **For agentic workers:** Use local agents (Agent tool), phases-and-batches. Sonnet for coding, opus for review. No TDD for CSS/visual work — verify via `tsc -b` + `pnpm build` + visual check in browser.

**Goal:** Transform the dev-mockup UI into a polished "Felt Table" themed indie roguelike with responsive desktop/mobile layouts.

**Architecture:** Theme-first (CSS vars + global styles), then components (buttons, cards, badges), then layouts (map sidebar, battle roster), then atmosphere (texture, vignette, per-screen mood). Each phase produces a working build.

**Tech Stack:** Tailwind 4, React 19, TypeScript, CSS custom properties, SVG filters

---

## Phase A: Theme Foundation (CSS vars + global styles)
**1 sonnet coder + 1 opus reviewer**

### Task 1: Replace color palette in index.css

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace all color tokens in `@theme inline` block**

Replace the cold palette with warm:
```css
--color-game-bg: #0d110e;
--color-game-panel: #161d14;
--color-game-muted: #0f1410;
--color-foreground: #f0ead6;
--color-border: #c8a96e;
--color-primary: #dc2626;
--color-secondary: #2563eb;
--color-accent: #d97706;
--color-ring: #d97706;
```

Replace `:root` CSS variables — background, foreground, card, primary, secondary, muted, accent, border, destructive, ring — all shifted to warm oklch values matching the hex palette from the spec.

- [ ] **Step 2: Update body and scrollbar styles**

```css
body {
  background: #0d110e;
  color: #f0ead6;
  font-family: VT323, monospace;
  image-rendering: pixelated;
}

::-webkit-scrollbar { width: 8px; background: #0d110e; }
::-webkit-scrollbar-thumb { background: #c8a96e; border: 2px solid #0d110e; }
::-webkit-scrollbar-thumb:hover { background: #d97706; }
```

- [ ] **Step 3: Update `.btn-pixel` to amber three-layer button**

```css
.btn-pixel {
  font-family: VT323, monospace;
  font-size: 18px;
  color: #f0ead6;
  border: 2px solid #c8a96e;
  background: linear-gradient(180deg, #5a4a20, #3a2a10);
  box-shadow: 0 3px 0 #2a1a00, inset 0 1px 0 rgba(240,192,64,0.2);
  padding: 4px 16px;
  min-height: 44px;
  cursor: pointer;
  transition: none;
}
.btn-pixel:hover {
  transform: translate(-2px, -2px);
  box-shadow: 0 5px 0 #2a1a00, inset 0 1px 0 rgba(240,192,64,0.3);
  border-color: #e8c97e;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out, border-color 120ms ease-out;
}
.btn-pixel:active {
  transform: translate(1px, 2px);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}
```

- [ ] **Step 4: Update `.card-pixel` and `.hp-bar-container` to warm chrome**

Replace white borders with `#c8a96e`, shadows with `#050805`.

- [ ] **Step 5: Add animation tokens**

```css
:root {
  --duration-hover: 120ms;
  --duration-press: 60ms;
  --duration-card-select: 250ms;
  --duration-hp-drain: 600ms;
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

- [ ] **Step 6: Verify**
```bash
pnpm exec tsc -b && pnpm build
```

- [ ] **Step 7: Commit**
```bash
git commit -m "theme: warm felt-table palette, amber chrome, animation tokens"
```

---

## Phase B: Component Restyling
**1 sonnet coder + 1 opus reviewer**

### Task 2: Restyle PixelButton, PokemonCard, ItemCard

**Files:**
- Modify: `src/components/ui/PixelButton.tsx`
- Modify: `src/components/ui/PokemonCard.tsx`
- Modify: `src/components/ui/ItemCard.tsx`

- [ ] **Step 1: PixelButton** — Use `btn-pixel` class from updated CSS. Change variants to use amber gradients instead of flat red/blue. Add smooth hover transition (120ms ease-out for transform+shadow only).

- [ ] **Step 2: PokemonCard** — Replace `bg-[#121827]` with `bg-[#161d14]`. Replace `border-white` with `border-[#c8a96e]`. Replace `shadow-[4px_4px_0px_#000]` with `shadow-[3px_3px_0px_#050805]`. Add hover: `translate(-2px,-3px)` + shadow increase, 150ms ease-out. Selected state: `border-[#e8c97e]` + `shadow-[0_0_12px_rgba(200,169,110,0.3)]`.

- [ ] **Step 3: ItemCard** — Same warm chrome treatment as PokemonCard.

- [ ] **Step 4: Verify + commit**

### Task 3: Restyle BadgeBar, TeamBar, TypeBadge

**Files:**
- Modify: `src/components/hud/BadgeBar.tsx`
- Modify: `src/components/hud/TeamBar.tsx`
- Modify: `src/components/ui/TypeBadge.tsx`

- [ ] **Step 1: BadgeBar** — Increase hexagons to 28px. Earned: `#c8a96e` fill. Unearned: `#2a3020` fill. Remove grayscale filter, use color distinction only.

- [ ] **Step 2: TeamBar** — Replace border-white with border-[#5a6a4a]. Filled slots: border-[#c8a96e]. HP dot colors unchanged. Add `layout` prop: `"strip"` (default, horizontal) or `"grid"` (3x2 for sidebar).

- [ ] **Step 3: TypeBadge** — Replace white border with `rgba(200,169,110,0.5)`. Shadow: `2px 2px 0 #050805`.

- [ ] **Step 4: Verify + commit**

---

## Phase C: Map Screen Layout + Tooltip
**1 sonnet coder + 1 opus reviewer**

### Task 4: MapCanvas chip nodes + SVG filters

**Files:**
- Modify: `src/components/map/MapCanvas.tsx`

- [ ] **Step 1: Add SVG `<defs>`** — radial gradients per node (computed from `getNodeColor`), drop shadow filter, glow filter.

- [ ] **Step 2: Replace flat circles with chip nodes** — Each node gets: radial gradient fill (lighter at top-left), `--border-warm` stroke, depth shadow via filter.

- [ ] **Step 3: Replace blink with breathing pulse** — Accessible nodes: `animate` on `r` attribute, 2.4s cycle (scale 1.0→1.04). Remove `animate-blink` class.

- [ ] **Step 4: Add hover state** — `onMouseEnter`/`onMouseLeave` with `useState`. Hovered: `transform: scale(1.08)` + brighter stroke. Use `style={{ transition: 'transform 150ms ease-out' }}`.

- [ ] **Step 5: Visited nodes** — Opacity stays 1.0, fill desaturated (reduce saturation in the gradient), dashed border.

- [ ] **Step 6: Widen spacing** — `H_SPACING: 100`, `V_SPACING: 50`. Nodes spread horizontally to use sidebar layout's wider area.

- [ ] **Step 7: Verify + commit**

### Task 5: MapTooltip (HTML portal)

**Files:**
- Create: `src/components/map/MapTooltip.tsx`
- Modify: `src/components/map/MapCanvas.tsx` (wire tooltip state)

- [ ] **Step 1: Create MapTooltip component**

```tsx
interface MapTooltipProps {
  nodeType: string;
  label: string;
  position: { x: number; y: number } | null;
}
```

Uses `createPortal(content, document.body)`. Positioned absolutely from `position` + 12px offset. Clamped to viewport edges. Style: `--game-bg` bg, `--border-warm` 2px border, pixel shadow. Press Start 2P 8px for type name, VT323 16px for flavor text.

Each node type gets flavor text: "Choose 1 of 3 wild Pokemon", "1v1 wild encounter", "Full team heal", etc.

- [ ] **Step 2: Wire into MapCanvas** — On node `onMouseEnter`, compute position via ref + `getBoundingClientRect()`, set tooltip state. On `onMouseLeave`, clear.

- [ ] **Step 3: Remove SVG `<title>` elements** (replaced by HTML tooltip).

- [ ] **Step 4: Verify + commit**

### Task 6: MapScreen sidebar layout

**Files:**
- Modify: `src/screens/MapScreen.tsx`

- [ ] **Step 1: Desktop layout (900px+)** — CSS grid: `grid-template-columns: 220px 1fr`. Left sidebar: gym label, BadgeBar, TeamBar (grid layout), ItemBar, Pokedex/Settings buttons. Right: MapCanvas.

- [ ] **Step 2: Mobile layout (<640px)** — No sidebar. Floating overlays: badges top-left, buttons top-right, team strip bottom-left. Use `@media` or Tailwind responsive prefixes.

- [ ] **Step 3: Tablet (640-900px)** — Collapsed sidebar (48px icon strip) or fall back to mobile floating.

- [ ] **Step 4: Verify at multiple widths + commit**

---

## Phase D: Battle Screen Redesign
**1 sonnet coder + 1 opus reviewer**

### Task 7: BattleField full-roster layout

**Files:**
- Modify: `src/components/battle/BattleField.tsx`

- [ ] **Step 1: Top zone — both full rosters**

Desktop: `grid-template-columns: 1fr auto 1fr`. Your team left (flex-wrap), VS divider, enemy team right (flex-wrap, justify-end).

Each pokemon slot: 64x64 sprite + name (Press Start 2P 6px) + level (JetBrains Mono 11px) + HP bar (56px wide).
- Active: `--player-accent` / `--enemy-accent` border + glow
- Fainted: `opacity: 0.3`, `filter: grayscale(0.8)`, name strikethrough
- Empty: dashed border, 0.2 opacity

- [ ] **Step 2: Middle zone — active spotlight**

Two large sprites (96px) face off with ⚔ divider. Background slightly darker. This is where damage shake/flash plays.

- [ ] **Step 3: Bottom zone — dialog + controls**

Dialog box: `--game-bg` bg, `--border-warm` top border, VT323 20px. Skip/Continue button right-aligned.

- [ ] **Step 4: Mobile responsive** — At `<640px`, switch to vertical stack: enemy strip (top) → arena → your strip → dialog. Sprites scale down to 56px in strips, 72px in arena.

- [ ] **Step 5: Verify with mock battle + commit**

### Task 8: BattleScreen wiring

**Files:**
- Modify: `src/screens/BattleScreen.tsx`

- [ ] **Step 1:** Wire the new BattleField layout to useBattlePlayback. Ensure `playerTeam` and `enemyTeam` show ALL members (not just active). Pass `activeIdx` for each side.

- [ ] **Step 2:** Add battle title header ("VS BROCK — GYM LEADER" or "WILD POKEMON").

- [ ] **Step 3: Verify + commit**

---

## Phase E: App Container + Atmosphere
**1 sonnet coder + 1 opus reviewer**

### Task 9: Game canvas container

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1:** Replace `max-w-[1200px] mx-auto` with a 16:10 aspect-ratio game canvas:

```tsx
<div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#080a08' }}>
  <div
    className="relative overflow-hidden"
    style={{
      width: 'min(95vw, calc(100dvh * 1.6))',
      aspectRatio: '16 / 10',
      backgroundColor: '#0d110e',
    }}
  >
    <ScreenRouter screen={screen} />
    <ModalRouter />
  </div>
</div>
```

- [ ] **Step 2: Verify at different viewport sizes + commit**

### Task 10: Atmosphere layers

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.tsx` (add atmosphere wrapper)

- [ ] **Step 1: Vignette pseudo-element** — Add to game canvas wrapper:
```css
.game-canvas::before {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 120px rgba(0,0,0,0.6);
  pointer-events: none;
  z-index: 50;
}
```

- [ ] **Step 2: SVG noise texture** — Data URI background on game canvas (static, no perf cost).

- [ ] **Step 3: Per-screen atmosphere classes** — `.screen-battle { background: radial-gradient(...) }` etc. Applied via `className` on ScreenRouter wrapper based on current screen.

- [ ] **Step 4: CRT scanlines** — Horizontal-only, 12% opacity, optional.

- [ ] **Step 5: Verify + commit**

### Task 11: Restyle remaining screens

**Files:**
- Modify: all files in `src/screens/` (TitleScreen, TrainerSelectScreen, StarterSelectScreen, CatchScreen, ItemScreen, SwapScreen, TradeScreen, ShinyScreen, BadgeScreen, TransitionScreen, GameOverScreen, WinScreen)

- [ ] **Step 1:** Replace all hardcoded cold colors (`#0a0a0f`, `#121827`, `border-white`, `text-white`) with warm equivalents (`#0d110e`, `#161d14`, `border-[#c8a96e]`, `text-[#f0ead6]`).

- [ ] **Step 2:** Replace all `font-pixel text-[8px]` and `text-[10px]` with VT323 at appropriate sizes.

- [ ] **Step 3:** Add per-screen atmosphere class to each screen's root div.

- [ ] **Step 4: Verify each screen in browser + commit**

---

## Quality Gates (per phase)

```bash
pnpm exec tsc -b        # 0 errors
pnpm test               # 94+ tests pass
pnpm build              # success
# Manual: pnpm dev → visual check at 1920px, 1024px, 375px
```

## Summary

| Phase | Tasks | Focus | Agents |
|-------|-------|-------|--------|
| A | 1 | CSS theme foundation | 1 sonnet + 1 opus |
| B | 2-3 | Component restyling | 1 sonnet + 1 opus |
| C | 4-6 | Map + tooltip + sidebar | 1 sonnet + 1 opus |
| D | 7-8 | Battle full-roster layout | 1 sonnet + 1 opus |
| E | 9-11 | App container + atmosphere + all screens | 1 sonnet + 1 opus |
| **Total** | **11 tasks** | | **5 sonnet + 5 opus** |
