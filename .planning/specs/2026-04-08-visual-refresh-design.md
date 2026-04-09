# Pokelike Visual Refresh — Design Spec

**Goal:** Transform the current dev-mockup UI into a polished indie roguelike with Balatro-inspired warmth, proper layouts for desktop and mobile, and a type-agnostic color scheme rooted in Pokemon nostalgia.

**Theme:** "Felt Table" — warm green-dark background, amber/gold chrome, casino-chip map nodes, layered depth. Not a Balatro copy — a Pokemon roguelike with soul.

---

## 1. Color Palette

Replace cold blue-black with warm green-dark. Replace all white chrome with amber/gold.

| Token | Hex | Usage |
|-------|-----|-------|
| `--game-bg` | `#0d110e` | Root background (warm green-dark) |
| `--game-panel` | `#161d14` | Cards, panels, sidebar |
| `--game-muted` | `#0f1410` | Recessed/inset areas |
| `--foreground` | `#f0ead6` | Primary text (warm cream) |
| `--foreground-muted` | `#8a7a5a` | Secondary text |
| `--border-warm` | `#c8a96e` | Primary border/chrome (amber gold) |
| `--border-warm-dim` | `#5a6a4a` | Subtle borders, locked states |
| `--border-warm-bright` | `#e8c97e` | Hover/focus highlight |
| `--accent` | `#d97706` | Interactive accent (buttons, focus ring) |
| `--shadow-color` | `#050805` | Pixel depth shadows |
| `--primary` | `#dc2626` | Pokemon Red — danger, enemy, HP critical |
| `--secondary` | `#2563eb` | Pokemon Blue — info, PP bars |
| `--success` | `#22c55e` | HP full, victory, earned badges |
| `--enemy-accent` | `#a05040` | Enemy side border/glow |
| `--player-accent` | `#c8a96e` | Player side border/glow |

**All 17 Pokemon type colors unchanged.** HP bar fills unchanged (green/orange/red).

---

## 2. Typography

| Role | Font | Size Range | Usage |
|------|------|-----------|-------|
| Display | Press Start 2P | 14-20px only | Game title, screen headers, "GAME OVER", "CHAMPION" |
| Body / UI | VT323 | 15-28px | Everything else: buttons, labels, dialog, menus, tooltips |
| Numbers | JetBrains Mono | 11-14px | HP values, levels, stats, damage numbers |

**Rule:** Press Start 2P never below 14px. Current `font-pixel text-[8px]` and `text-[10px]` all become VT323.

---

## 3. Layout — Desktop (900px+)

### Map Screen
```
┌──────────────────────────────────────────────┐
│ ┌─────────┐ ┌──────────────────────────────┐ │
│ │ SIDEBAR │ │                              │ │
│ │ 220px   │ │      SVG MAP DAG             │ │
│ │         │ │      (fills remaining)       │ │
│ │ Gym 1   │ │                              │ │
│ │ Badges  │ │   ○  ○                       │ │
│ │ Team 3x2│ │  ○ ○ ○                       │ │
│ │ Items   │ │ ○ ○ ○ ○                      │ │
│ │ Pokedex │ │  ○ ○ ○                       │ │
│ │ Settings│ │   ○ ○                        │ │
│ │         │ │    ◆ (boss)                  │ │
│ └─────────┘ └──────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

- Fixed 16:10 aspect-ratio game canvas, centered on screen
- Left sidebar: `220px`, `--game-panel` bg, `--border-warm-dim` right border
- Map area: fills remaining width, SVG uses `preserveAspectRatio="xMidYMid meet"`

### Battle Screen
```
┌──────────────────────────────────────────────┐
│ YOUR TEAM (left)         VS   ENEMY TEAM (right) │
│ ┌────┐┌────┐┌────┐┌────┐     ┌────┐┌────┐  │
│ │ 🐸 ││ 🐛 ││ 🐦 ││    │     │ 🪨 ││ 🐍 │  │
│ │act ││    ││    ││    │     │act ││    │  │
│ └────┘└────┘└────┘└────┘     └────┘└────┘  │
│──────────────────────────────────────────────│
│          ┌──────┐  ⚔  ┌──────┐              │
│          │  🐸  │     │  🪨  │              │
│          │ 96px │     │ 96px │              │
│          └──────┘     └──────┘              │
│──────────────────────────────────────────────│
│ Bulbasaur used Vine Whip! ▼        [SKIP]   │
└──────────────────────────────────────────────┘
```

- Top: both full rosters side by side. Active = gold/red border + glow. Fainted = grayscale + strikethrough.
- Middle: active pokemon spotlight (large sprites). Damage animations here.
- Bottom: dialog box with typewriter + skip/continue.
- No sidebar — battle is full-width within the game canvas.

---

## 4. Layout — Mobile (<640px)

### Map Screen
- No sidebar. Floating overlays (approach A from wireframes).
- Badges float top-left, gym label + buttons float top-right.
- Map DAG fills viewport with padding for HUD overlays.
- Team strip floats at bottom-left.

### Battle Screen
Vertical stack:
1. Header bar: "VS BROCK" + skip button
2. Enemy team strip (right-aligned, active = red glow)
3. Arena: two sprites face off (larger for 1v1, smaller for 5v5)
4. Your team strip (left-aligned, active = gold glow)
5. Dialog at bottom edge

---

## 5. Map Node Design

**Shape:** Casino chip — circle with radial gradient fill, inset bevel, drop shadow.

**States:**
- Accessible: full opacity, `--border-warm` border, breathing scale pulse (2.4s, not blink), subtle glow
- Locked: 0.55 opacity, `--border-warm-dim` border, no glow
- Visited: full opacity, desaturated fill (retain type identity), dashed border, checkmark overlay
- Boss: 20% larger, purple glow, always pulsing

**Hover:** `scale(1.08)` + brighter border + deeper shadow (150ms ease-out)

**Tooltip:** HTML portal via React `createPortal`. Positioned from `getBoundingClientRect`. Style: `--game-bg` bg, `--border-warm` border, pixel shadow. Shows node type name + flavor text.

**Edges:** Thin lines. Active path = amber 45% opacity. Visited = white 25%. Locked = white 8% dashed.

---

## 6. Animation Philosophy

**Two-tier model:**

| Tier | When | Easing | Examples |
|------|------|--------|---------|
| Stepped (pixel) | Thematic game animations | `steps(N)` | HP drain, typewriter, damage shake, screen wipe, blink cursor |
| Smooth (interaction) | User interaction feedback | `ease-out` 100-200ms | Hover lift, card select, button press, modal open, node glow |

**Key animations:**
- Card hover: `translate(-2px, -3px)` + shadow increase, 150ms ease-out
- Card select: `cubic-bezier(0.34, 1.56, 0.64, 1)` — slight bounce overshoot
- Map node hover: scale(1.08) + type-colored glow bloom, 200ms
- HP drain: `steps(8)` over 600ms (unchanged)
- Damage shake: `steps(6)` over 300ms (unchanged)
- Screen crit shake: full container shake, `steps(7)` 400ms
- Low HP danger: red vignette pulse at screen edges, smooth 2s cycle

---

## 7. Atmosphere

**Background:** SVG `feTurbulence` noise texture (data URI, no network cost) + radial gradient vignette (lighter center, dark edges).

**CRT scanlines:** Horizontal-only, 12% opacity, with 6s breathe cycle (opacity 1.0 → 0.82). Optional, togglable.

**Per-screen mood:**
- Map: cool blue-green ambient
- Battle: red bleed top (enemy) + teal bottom (player)
- Title: subtle red radial behind logo
- Game Over: `saturate(0.6)` + heavy vignette
- Win: faint gold radial glow

---

## 8. Component Chrome

**Buttons (`.btn-pixel`):**
- Three-layer: amber gradient top face + `--shadow-color` depth block (4px offset) + soft shadow
- Inner highlight top-left, inner shadow bottom-right
- Active: sinks down (translate + inset shadow)
- Font: VT323 16px (not Press Start 2P)

**Panels (`.card-pixel`):**
- `--game-panel` bg, `--border-warm` 2px border
- Top-left inner highlight, depth block shadow
- Raised variant for battle info, inset variant for recessed areas

**Dialog box:**
- Bottom-anchored, `--game-bg` bg, `--border-warm` top border (3px)
- VT323 20px, typewriter reveal, blinking `▼` cursor
- `aria-live="polite"`

**Badge bar:**
- 32px hexagons. Earned = `--border-warm` fill with number. Unearned = `#2a3020` hollow.

---

## 9. Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| < 640px | Mobile: floating HUD, vertical battle stack, no sidebar |
| 640-900px | Tablet: collapsed sidebar (48px icon strip), map takes most width |
| 900px+ | Desktop: full sidebar (220px), horizontal battle layout |

Game canvas: `aspect-ratio: 16/10`, `max-width: min(95vw, calc(100dvh * 1.6))`, centered.

---

## 10. Files to Change

| File | Change |
|------|--------|
| `src/index.css` | Full theme overhaul: new CSS vars, warm palette, animation tokens, atmosphere layers, component classes |
| `src/App.tsx` | Game canvas wrapper with aspect ratio, remove old container |
| `src/screens/MapScreen.tsx` | Sidebar layout (desktop), floating HUD (mobile) |
| `src/components/map/MapCanvas.tsx` | Chip nodes, radial gradients, SVG filters, breathing pulse, hover states |
| `src/components/map/MapTooltip.tsx` | NEW: HTML portal tooltip |
| `src/components/battle/BattleField.tsx` | Full roster layout, spotlight arena, responsive |
| `src/components/ui/PixelButton.tsx` | Three-layer amber button |
| `src/components/ui/PokemonCard.tsx` | Warm panel chrome, hover lift |
| `src/components/ui/ItemCard.tsx` | Warm panel chrome |
| `src/components/hud/TeamBar.tsx` | Compact strip (mobile) vs grid (sidebar) |
| `src/components/hud/BadgeBar.tsx` | SVG hexagons, warm colors |
| All screen files | Per-screen atmosphere class, warm text colors |

---

## 11. What Does NOT Change

- All game logic (battle engine, map generation, evolution, XState machine)
- All data files (types, moves, items, gym leaders, etc.)
- All test files
- Type colors, HP bar fill colors
- `border-radius: 0` everywhere
- `image-rendering: pixelated` on sprites
- `prefers-reduced-motion` support
- Press Start 2P + VT323 + JetBrains Mono font stack (just different size rules)
