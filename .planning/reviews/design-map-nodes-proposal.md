# Map Node Visual Design Proposal
**Project:** Pokelike Roguelike  
**File under review:** `src-app/src/components/map/MapCanvas.tsx`  
**Date:** 2026-04-08  
**Research basis:** UI/UX Pro Max style + UX domain searches; Balatro / Slay the Spire / FTL reference aesthetics

---

## 1. Shape Language — "Stamped Chips"

Abandon plain circles. The target metaphor is a **stamped arcade token / collectible chip** — something that looks pressed, has physical weight, and rewards interaction. This reads as tactile without requiring 3D transforms.

Each node is an SVG `<g>` containing:

1. **Drop shadow layer** — a slightly offset duplicate shape with blur, creating the illusion that the chip is raised off the "table."
2. **Inset bevel** — two concentric shapes: outer dark stroke, inner lighter stroke 2px inside, creating a pressed-lip rim exactly like Balatro's cards.
3. **Colored fill** — the existing `getNodeColor()` palette works well; richer saturation and a `radialGradient` from 30% lighter at top-left to base color at bottom-right.
4. **Sprite image** — unchanged, centred, `imageRendering: pixelated`.
5. **Type icon / corner pip** — a small 8×8 px shape in the bottom-right corner indicating node type category (hostile/friendly/special), using the existing TypeBadge palette. Not text — a geometric pip.

No border-radius tricks inside SVG — we compose purely with SVG primitives (circle, radialGradient, filter, feMerge).

---

## 2. Node States

### 2a. Accessible (next selectable)
- Full opacity (1.0).
- Radial gradient fill — base color + 25% lighter at top pole.
- **Rim glow:** a `<circle>` just outside the radius with `stroke` in a warm gold/amber (`#f8d030`), 2px wide, `filter="url(#rim-glow)"` — a soft bloom, NOT a blinking ring.
- **Idle breathing:** `@keyframes breathe` — scale oscillates between 1.0 and 1.04 with `animation-timing-function: ease-in-out` over 2.4 s. No hard step jumps. Replaces the current `animate-blink` on/off flash.
- `cursor: pointer`.
- `filter="url(#chip-shadow)"` — elevated drop shadow.

### 2b. Unvisited / Locked (reachable but not yet accessible)
- Opacity 0.55.
- Flat fill — no gradient, no glow.
- Dim stroke `rgba(255,255,255,0.2)`.
- No animation.
- `cursor: default`.
- Slightly reduced radius (-2px): feels "further away" on the z-axis.

### 2c. Visited (completed)
- Opacity 1.0 — do NOT fade to 0.35. The player earned this node; it should feel acknowledged.
- Fill: the existing dark muted color (`#333`) replaced with a **desaturated version of the original type color** — achieved by mixing the type color 20% into `#1a1a2a`. Each visited node retains its identity.
- A small **checkmark stamp** rendered as an SVG path overlaying the sprite, using a white semi-opaque thin path (`strokeWidth=1.5`, `opacity=0.5`). Think a subtle wax-seal impression.
- A **cracked/worn rim** — dashed `strokeDasharray="3 3"` on the outer ring in a low-opacity white. Signals it is "used up."
- No glow, no animation.

### 2d. Boss Node
- 20% larger radius (24px vs 20px).
- Distinct shape: use a **rounded hexagon** (6-point polygon via `<polygon>`) instead of a circle. This is the only shape break in the set — makes it unmistakably different.
- Glow in boss-color purple (`#8a2a8a`) with higher blur spread.
- Pulse animation runs continuously regardless of accessibility state.

---

## 3. Hover Effect

The UX research confirms: hover must provide clear visual feedback (medium severity) and use click/tap as primary interaction (high severity — hover-only fails touch). The hover layer is pure enhancement.

On `mouseenter` (SVG `<g>` receives pointer events):

1. **Scale up:** `transform: scale(1.08)` with `transform-origin: center`. Applied via a CSS class toggled by React `useState(hovered)`. Use `transition: transform 80ms ease-out` — fast enough to feel snappy, not jarring.
2. **Rim brightens:** stroke color shifts from `#f8d030` to `#ffffff` using an inline style or className swap.
3. **Shadow deepens:** `filter="url(#chip-shadow-hover)"` — same shadow but `stdDeviation` increases from 3 to 5, dy shifts from 2 to 4. Feels like lifting the chip off the table.
4. **Tooltip appears** (see Section 4).

On `mouseleave`: reverse all of the above.

For accessible nodes only — locked/visited nodes get a cursor change only, no scale effect.

---

## 4. Tooltip Design — HTML Overlay, Not SVG `<title>`

SVG `<title>` is browser-native and uncontrollable (delay, style, position). Replace it entirely with a **React portal tooltip** rendered as a `<div>` positioned via `getBoundingClientRect()`.

### Architecture
- The SVG `<g>` node fires `onMouseEnter` with the node object.
- `MapCanvas` lifts `hoveredNode: MapNode | null` state up, plus `tooltipPos: { x, y }`.
- A `MapTooltip` component is rendered via `ReactDOM.createPortal` into `document.body` — this escapes SVG coordinate space entirely.
- Position: offset 12px right and -8px up from cursor, clamped to viewport edges.

### Visual Design of Tooltip
Matches the existing pixel RPG aesthetic — think a Game Boy dialog box, not a SaaS tooltip:

```
┌──────────────────────────┐
│ [sprite 20×20]  WILD BATTLE │ ← 12px Press Start 2P
│                              │
│ A wild Pokémon lurks here.   │ ← 10px VT323 flavor text
└──────────────────────────┘
```

- Background: `#0a0a0f` (game-bg token).
- Border: `2px solid white` + `box-shadow: 3px 3px 0 #000` (shadow-pixel, matches existing `IconButton`).
- Font: `font-pixel` (Press Start 2P) for the title, `font-terminal` (VT323) for the subtitle.
- No border-radius — pixel aesthetic forbids it.
- Width: `max-content`, max 160px.
- Appear/disappear: `opacity` transition 100ms — fast enough it doesn't lag behind cursor.

### Flavor text per NodeType

| NodeType     | Title              | Flavor                          |
|--------------|--------------------|---------------------------------|
| battle       | WILD BATTLE        | A Pokémon leaps from the grass  |
| catch        | CATCH ZONE         | Rare Pokémon spotted nearby     |
| trainer      | TRAINER            | Wants to battle                 |
| item         | ITEM               | Something glints on the ground  |
| pokecenter   | POKÉMON CENTER     | Rest and recover your team      |
| move_tutor   | MOVE TUTOR         | Teach a new technique           |
| trade        | TRADE              | Swap for one 3 levels higher    |
| legendary    | LEGENDARY          | An ancient presence stirs...    |
| question     | ???                | The unknown awaits              |
| boss         | GYM LEADER         | Your greatest challenge yet     |
| visited      | (no tooltip)       | —                               |

---

## 5. Edge / Connection Line Styling

Currently: plain `<line>` elements, either dim white or faint yellow.

### Proposal: Layered Path Lines

Replace `<line>` with `<path>` using a gentle cubic bezier for organic feel. The control points push slightly outward from center — enough to feel alive, not so much it becomes spaghetti.

```
M x1 y1 C cx1 cy1 cx2 cy2 x2 y2
```
Where `cx1 = x1, cy1 = (y1+y2)/2` and `cx2 = x2, cy2 = (y1+y2)/2` — simple vertical-midpoint curves.

Three visual tiers:

| Edge state                   | Stroke                           | Width | Dash |
|------------------------------|----------------------------------|-------|------|
| Visited → Accessible (active)| `rgba(248,208,48,0.55)`          | 1.5px | none |
| Visited → Visited (complete) | `rgba(255,255,255,0.25)`         | 1px   | none |
| Unvisited (locked)           | `rgba(255,255,255,0.08)`         | 1px   | `4 4`|

The dashed locked edges visually recede — they suggest a possibility that isn't yet real.

No animated dashes — that's movement cost for very little payoff.

---

## 6. SVG Effects — Filters and Gradients

All defined in `<defs>` inside the single `<svg>` element.

### 6a. Chip Drop Shadow
```svg
<filter id="chip-shadow" x="-40%" y="-40%" width="180%" height="180%">
  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.7" />
</filter>

<filter id="chip-shadow-hover" x="-40%" y="-40%" width="180%" height="180%">
  <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.8" />
</filter>
```

### 6b. Rim Glow (accessible nodes)
```svg
<filter id="rim-glow" x="-60%" y="-60%" width="220%" height="220%">
  <feGaussianBlur stdDeviation="4" result="blur" />
  <feMerge>
    <feMergeNode in="blur" />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

### 6c. Radial Gradient Fill (per node — generated dynamically)

Because each node has a different `getNodeColor()` value, generate one `radialGradient` per node ID at render time using `useMemo`. The gradient ID is `grad-${node.id}`.

```svg
<radialGradient id="grad-n2_1" cx="35%" cy="30%" r="65%">
  <stop offset="0%" stop-color="#8a3a3a" />   <!-- 30% lighter than base -->
  <stop offset="100%" stop-color="#6a2a2a" /> <!-- base color -->
</radialGradient>
```

Computing the lighter stop: take the hex color from `getNodeColor()`, parse R/G/B, multiply each channel by 1.3 (clamp 255). This is a small pure utility function.

### 6d. Visited Node Desaturated Fill

Same approach: take base color, convert to HSL, drop saturation to 20%, lightness to 20%. Renders as a "ghost" of the original type color — the player can still read what they visited.

---

## 7. CSS Animations

These go in `index.css` under the `@layer components` or a dedicated `@layer map-nodes` block.

### 7a. Breathing pulse (replaces animate-blink)
```css
@keyframes breathe {
  0%, 100% { transform: scale(1.0); opacity: 0.85; }
  50%       { transform: scale(1.04); opacity: 1.0; }
}

.node-breathe {
  animation: breathe 2.4s ease-in-out infinite;
  transform-origin: center;
  transform-box: fill-box; /* SVG-aware transform origin */
}
```

`transform-box: fill-box` is essential — without it, SVG transforms use the viewport origin (top-left of the SVG), not the element's own center.

### 7b. Hover lift (CSS, not React state for performance)
```css
.node-chip {
  transition: filter 80ms ease-out;
  transform-origin: center;
  transform-box: fill-box;
}

.node-chip:hover {
  filter: url(#chip-shadow-hover) brightness(1.15);
}
```

Note: SVG `filter` and CSS `filter` can conflict. Prefer keeping hover state as a React `useState` toggle that swaps the `filter` attribute directly on the SVG element. This avoids the browser compositor confusion between SVG `filter=` attribute and CSS `filter:` property.

### 7c. Tooltip fade
```css
.map-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 9998; /* below CRT overlay z-index 9999 */
  opacity: 0;
  transition: opacity 100ms ease;
}

.map-tooltip.visible {
  opacity: 1;
}
```

---

## 8. Implementation Priority Order

1. **Replace SVG `<title>` with HTML portal tooltip** — highest UX payoff, zero visual risk.
2. **Add radial gradient fills + chip-shadow filter** — depth without touching interactivity.
3. **Swap `animate-blink` for `node-breathe`** — better feel, same signal, one CSS change.
4. **Visited node treatment** — desaturated fill + dashed rim + checkmark stamp.
5. **Bezier edge lines** — replace `<line>` with `<path>`, add tier styling.
6. **Hover scale effect** — last, because it requires React hover state lift.
7. **Boss hex shape** — optional polish pass.

---

## 9. What NOT to Do

- Do not add CSS `border-radius` to SVG `<circle>` — it has no effect.
- Do not use `<foreignObject>` for the tooltip inside the SVG — it breaks pointer events and z-indexing in most browsers.
- Do not animate edges (dashes moving, etc.) — the CRT scanlines already provide motion; adding more motion competes with it and tanks GPU compositing on mobile.
- Do not add `drop-shadow` CSS filter AND an SVG `filter=` attribute to the same element simultaneously — pick one per element.
- Do not remove the `transform-box: fill-box` from any animated SVG `<g>` — everything will scale from wrong origin.
- Do not make the tooltip appear on touch `onMouseEnter` alone (UX research severity: High) — the click handler already reveals the node type via the game flow; the tooltip is desktop-only enhancement.

---

## 10. Design Token Additions (index.css)

```css
@theme inline {
  /* Map nodes */
  --node-radius-default:   20px;
  --node-radius-boss:      24px;
  --node-accessible-glow:  #f8d030;
  --node-visited-opacity:  1.0;   /* was 0.35 — reverting the fade */
  --node-locked-opacity:   0.55;
  --node-breathe-duration: 2.4s;
  --edge-active-color:     rgba(248,208,48,0.55);
  --edge-visited-color:    rgba(255,255,255,0.25);
  --edge-locked-color:     rgba(255,255,255,0.08);
}
```

---

## Summary

The core shift is from **flat circles with blinking rings** to **stamped chips with breathing glows**. The tooltip moves from native SVG (uncontrollable, ugly) to a React portal that matches the pixel RPG aesthetic. Visited nodes go from faded-out to desaturated-but-present — the player's history becomes readable on the map rather than erased. Edge lines gain a tier system that visually communicates traversal history at a glance. All depth is achieved through SVG filters and gradients — no 3D transforms, no external libraries.
