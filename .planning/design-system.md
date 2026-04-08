# Pokelike Design System

**Project:** Pokelike — Gen 1 Pokemon Roguelike Web Game  
**Stack:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui  
**Style Direction:** Pixel Art + Retro-Futurism — "Game Boy Advance SP playing Pokemon FireRed, rendered on the modern web"

---

## 1. Color Palette

### Semantic Color Tokens

The palette is drawn from the **Arcade & Retro Game** profile, augmented with Pokemon-native hues. All colors are defined as CSS custom properties (shadcn-compatible) and Tailwind tokens.

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#0a0a0f` | Game screen base — near-black with a blue cast |
| `--foreground` | `#f0f0f0` | Primary text on dark backgrounds |
| `--card` | `#121827` | Battle/info panels, inventory cards |
| `--card-foreground` | `#f0f0f0` | Text within cards |
| `--primary` | `#dc2626` | Pokemon Red — primary actions, HP bars, danger |
| `--primary-foreground` | `#ffffff` | Text on primary red |
| `--secondary` | `#2563eb` | Pokemon Blue — secondary actions, PP bars, water |
| `--secondary-foreground` | `#ffffff` | Text on secondary blue |
| `--accent` | `#22c55e` | Exp/score green — health full, success states |
| `--accent-foreground` | `#0f172a` | Text on accent green |
| `--muted` | `#1e2433` | Subtle backgrounds, disabled areas |
| `--muted-foreground` | `#94a3b8` | Placeholder text, secondary labels |
| `--border` | `rgba(255,255,255,0.12)` | Subtle pixel-border separators |
| `--ring` | `#dc2626` | Focus ring color |
| `--destructive` | `#dc2626` | Destructive actions |
| `--destructive-foreground` | `#ffffff` | Text on destructive |

### Extended Game-Specific Tokens

```css
/* Pokemon type colors — use for type badges */
--type-fire:    #ff7c5c;
--type-water:   #6ab4f5;
--type-grass:   #78c850;
--type-electric:#f8d030;
--type-psychic: #f85888;
--type-normal:  #a8a878;
--type-ghost:   #705898;
--type-dragon:  #7038f8;

/* Game UI chrome */
--ui-hp-full:   #22c55e;
--ui-hp-mid:    #f59e0b;  /* ~50% HP */
--ui-hp-low:    #dc2626;  /* ~20% HP — flashing */
--ui-xp:        #3b82f6;
--ui-scanline:  rgba(0, 0, 0, 0.15);
--ui-pixel-border: #ffffff;
--ui-shadow:    #000000;
```

### Tailwind Custom Colors (see Section 6 for full config)

```
pokemon-red:   #dc2626
pokemon-blue:  #2563eb
pokemon-green: #22c55e
pokemon-yellow:#f8d030
game-bg:       #0a0a0f
game-panel:    #121827
game-muted:    #1e2433
```

---

## 2. Typography

### Font Stack

| Role | Font | Use |
|------|------|-----|
| **Display / Headings** | Press Start 2P | Game title, screen headers, battle announcements, HP/level labels |
| **Body / Dialogue** | VT323 | In-game dialogue boxes, menu text, flavor text, Pokedex entries |
| **UI Labels** | JetBrains Mono | Stat numbers, coordinates, debug/dev overlays, move PP counts |

### Google Fonts Import

```html
<!-- In index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323:wght@400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
/* CSS alternative */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Font Usage Rules

- **Press Start 2P** renders very wide — use only for short strings (titles, labels max ~20 chars). Line height: `1.8`. Letter spacing: `normal`. Never use below `10px`.
- **VT323** is designed for large sizes (16px–32px range reads as "normal" body). Set base to `20px`/`24px`. Line height: `1.4`.
- **JetBrains Mono** for all numeric readouts — ensures tabular alignment for stats that change (HP `045/120`).
- Body minimum: `16px` equivalent to prevent mobile auto-zoom. At VT323 scale, `20px` = comfortable reading.

### Type Scale

```
--text-xs:  10px  (Press Start 2P labels only)
--text-sm:  12px  (Press Start 2P secondary labels)
--text-base:20px  (VT323 dialogue, menu items)
--text-lg:  24px  (VT323 sub-headings)
--text-xl:  32px  (VT323 panel headers)
--text-2xl: 16px  (Press Start 2P screen titles)
--text-3xl: 20px  (Press Start 2P hero title)
```

---

## 3. Component Style Guide

All shadcn components should be overridden to follow the **pixel art aesthetic**: sharp corners, solid 2px borders, no rounded radii, step-function interactions.

### General Rules

- **No `border-radius`** except `0px` — pixel art is square. Override shadcn's default rounded styles globally.
- **Borders are 2px solid** — the classic Game Boy UI border weight.
- **Box shadows simulate pixel depth**: `4px 4px 0px #000` for raised elements, `2px 2px 0px #000` for inline.
- **No smooth gradients** — use flat fills or `steps()` gradients only.
- **Hover states**: shift `transform: translate(-2px, -2px)` and increase shadow to `6px 6px 0px #000` for a "raised button" press feel.
- **Active/pressed states**: `transform: translate(2px, 2px)` + `box-shadow: 0px 0px 0px #000` (sunken).

---

### Button

```tsx
// Pixel Button — primary variant
className="
  font-pixel text-[10px] text-white
  bg-pokemon-red border-2 border-white
  px-4 py-2
  shadow-[4px_4px_0px_#000]
  hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#000]
  active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
  transition-none  /* no smooth transition — snap states */
  cursor-pointer
"
```

**Variants:**
- `primary` — red background, white text (attack/confirm)
- `secondary` — blue background, white text (item/back)
- `ghost` — transparent background, white border (cancel)
- `destructive` — red with warning icon (run/forfeit)

**Sizing:** All buttons min `44px` tall for touch compliance. Width: auto, min `80px`.

---

### Card / Panel

Pokemon UI panels use the classic "Game Boy dialog box" style: dark background, white pixel border, inner shadow.

```tsx
// Game Panel
className="
  bg-game-panel border-2 border-white
  shadow-[4px_4px_0px_#000,_inset_0_0_0_1px_rgba(255,255,255,0.05)]
  p-4
  font-terminal text-[20px] text-foreground
"
```

**Sub-variants:**
- **Battle Info Panel** (HP/name): Top-right during battle — fixed width 160px, white bg with black text (inverts for readability)
- **Dialogue Box**: Bottom ~25% of screen, black bg, white text, blinking cursor `▼`
- **Menu Card**: Right side of screen during battle, 4-option grid

---

### Dialog (RPG Text Box)

Dialogs become Pokemon-style text boxes — bottom-anchored, full width, typewriter reveal.

```tsx
// Override DialogContent
className="
  fixed bottom-0 left-0 right-0
  bg-game-bg border-t-4 border-white
  shadow-[0_-4px_0_#000]
  p-6 pb-8
  font-terminal text-[22px] text-white leading-relaxed
  max-h-[30vh]
  rounded-none  /* critical — kill shadcn's rounded-lg */
"
```

The blinking advance cursor (`▼`) is a `::after` pseudo-element with `animation: blink 0.8s steps(1) infinite`.

---

### Input / Select

```tsx
className="
  bg-game-muted border-2 border-white
  font-terminal text-[20px] text-white
  px-3 py-2 h-11
  shadow-[inset_2px_2px_0px_#000]
  focus:border-pokemon-yellow focus:outline-none
  placeholder:text-muted-foreground
  rounded-none
"
```

---

### Badge (Type Badge)

```tsx
// Pokemon type pill
className="
  font-pixel text-[8px] uppercase tracking-wide
  px-2 py-1 border border-white
  shadow-[2px_2px_0px_#000]
  /* background set via type token: bg-[var(--type-fire)] etc */
"
```

---

### Progress Bar (HP Bar)

HP bars are the lifeblood of the UI. Not a shadcn component — custom implementation recommended.

```tsx
// HP Bar
<div className="border-2 border-white h-3 bg-game-muted shadow-[2px_2px_0px_#000]">
  <div
    className="h-full transition-none"  /* no smooth — step animation */
    style={{
      width: `${hpPercent}%`,
      background: hpPercent > 50 ? 'var(--ui-hp-full)'
                : hpPercent > 20 ? 'var(--ui-hp-mid)'
                : 'var(--ui-hp-low)'
    }}
  />
</div>
```

At `hpPercent <= 20`, add `animate-[blink_0.6s_steps(1)_infinite]` to signal critical HP.

---

### Toast / Notification

Used for battle results ("It's super effective!", "Gained 120 EXP"). Bottom-anchored, typewriter style.

```tsx
// Override Toaster positioning
className="
  font-terminal text-[20px]
  bg-game-bg border-2 border-white
  shadow-[4px_4px_0px_#000]
  rounded-none px-4 py-3
"
```

---

## 4. Spacing & Layout

### Base Spacing Unit

`4px` base unit (Tailwind's default `p-1 = 4px`). All spacing is multiples of 4.

```
4px  — internal icon padding
8px  — between tightly grouped elements (stat rows)
16px — standard card padding (p-4)
24px — section separation
32px — major layout gap
48px — screen-level breathing room
```

### Game Screen Layouts

The game operates in distinct "screens" — each a full viewport or panel within it.

#### Battle View

```
┌─────────────────────────────────────┐
│  [Enemy Sprite Area]  [Enemy Panel] │  ~60% viewport height
│                       Name: PIDGEY  │
│                       HP: ████░░░░  │
├─────────────────────────────────────┤
│  [Player Panel]  [Player Sprite]    │  ~20% viewport height
│  Name: CHARMANDER                   │
│  HP: ████████  Lv: 12               │
├─────────────────────────────────────┤
│  [Dialogue Box — 30% vh]            │  ~20% viewport height
│  "Wild PIDGEY appeared!"       ▼    │
└─────────────────────────────────────┘
```

- Enemy sprites: top-left, `max-w-[200px]`
- Player sprites: bottom-right (back-facing), `max-w-[160px]`
- Enemy info panel: top-right, fixed `200px` wide
- Player info panel: bottom-left, fixed `200px` wide

#### Move Select (overlays Dialogue Box)

```
┌─────────────────────────────────────┐
│  SCRATCH    │  EMBER               │
│  PP 35/35   │  PP 25/25            │
├─────────────┼───────────────────────┤
│  GROWL      │  ----                 │
│  PP 40/40   │                       │
└─────────────┴───────────────────────┘
```

2x2 grid, `grid-cols-2 gap-0 border-2 border-white`

#### Map / Overworld View

- Fixed viewport, `overflow: hidden`
- Tile-based rendering: tiles are `16px × 16px` or `32px × 32px`
- Player centered, map scrolls beneath
- HUD overlay: top-left for location name, top-right for steps/time

#### Inventory / Bag

- Scrollable list, left panel: item list, right panel: item detail
- Left panel: `w-[200px]` fixed, right panel: `flex-1`
- Item rows: `h-11` (44px touch target), `border-b-2 border-game-muted`

#### Responsive

- **Mobile-first**: full viewport, single-column
- **Tablet (768px+)**: game can center with max-width
- **Desktop (1024px+)**: `max-w-[480px]` game container centered — emulate handheld aspect ratio
- `min-h-dvh` for root to handle iOS viewport bar

---

## 5. Animation Guidelines

### Core Principle

**Pixel games do not ease.** Transitions are instantaneous or stepped. Avoid `ease`, `ease-in-out`, `cubic-bezier` for UI state changes. Use `steps()` or `transition-none`.

### Timing Rules

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button press | immediate | `steps(1)` |
| HP bar decrease | 600ms | `steps(8)` — drain pixel by pixel |
| Screen wipe | 300ms | `steps(6)` |
| Dialogue typewriter | 40ms/char | `steps(1)` per character |
| Sprite entrance | 200ms | `steps(4)` |
| Menu selection cursor | immediate | `steps(1)` |
| Shake (miss/hit) | 300ms | `steps(6)` |
| Blink (low HP, cursor) | 600ms cycle | `steps(1, end)` |

### Step Animations

```css
/* Blink cursor */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.cursor-blink {
  animation: blink 0.8s steps(1, end) infinite;
}

/* Screen wipe in (black curtain) */
@keyframes screen-wipe-in {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
.screen-wipe {
  animation: screen-wipe-in 300ms steps(6, end) forwards;
}

/* HP drain */
@keyframes hp-drain {
  from { width: var(--hp-from); }
  to   { width: var(--hp-to); }
}
.hp-bar-anim {
  animation: hp-drain 600ms steps(8, end) forwards;
}

/* Sprite shake (damage) */
@keyframes damage-shake {
  0%, 100% { transform: translateX(0); }
  25%       { transform: translateX(-4px); }
  75%       { transform: translateX(4px); }
}
.damage-shake {
  animation: damage-shake 300ms steps(6, end);
}

/* Sprite enter (slide in from right) */
@keyframes sprite-enter {
  from { transform: translateX(120%); }
  to   { transform: translateX(0); }
}
.sprite-enter {
  animation: sprite-enter 200ms steps(4, end) forwards;
}
```

### CRT / Scanline Effect (optional)

```css
/* Overlay on root game container */
.crt-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

Apply `.crt-overlay` to the root `<div id="game">` wrapper.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* Keep blink for essential cursor only */
  .cursor-blink {
    animation: none;
    opacity: 1;
  }
}
```

### Anti-Patterns to Avoid

- No `transition: all 300ms ease` — kills the pixel snap feel
- No CSS gradients for color fills (use flat colors)
- No smooth HP bar animation (`ease-in-out`) — use `steps()`
- No `framer-motion` spring animations for game UI elements
- No parallax scrolling on game screens
- No skeleton shimmer on game screens — use "Loading..." typewriter text instead

---

## 6. Tailwind Config Snippet

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pokemon palette
        'pokemon-red':    '#dc2626',
        'pokemon-blue':   '#2563eb',
        'pokemon-green':  '#22c55e',
        'pokemon-yellow': '#f8d030',
        'pokemon-purple': '#7c3aed',

        // Game UI
        'game-bg':     '#0a0a0f',
        'game-panel':  '#121827',
        'game-muted':  '#1e2433',

        // Pokemon types
        'type-fire':     '#ff7c5c',
        'type-water':    '#6ab4f5',
        'type-grass':    '#78c850',
        'type-electric': '#f8d030',
        'type-psychic':  '#f85888',
        'type-normal':   '#a8a878',
        'type-ghost':    '#705898',
        'type-dragon':   '#7038f8',
        'type-ice':      '#98d8d8',
        'type-fighting':  '#c03028',
        'type-poison':   '#a040a0',
        'type-ground':   '#e0c068',
        'type-flying':   '#a890f0',
        'type-bug':      '#a8b820',
        'type-rock':     '#b8a038',

        // HP states
        'hp-full': '#22c55e',
        'hp-mid':  '#f59e0b',
        'hp-low':  '#dc2626',

        // shadcn semantic tokens (wired to CSS vars below)
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border:  'hsl(var(--border))',
        ring:    'hsl(var(--ring))',
      },

      fontFamily: {
        pixel:    ['"Press Start 2P"', 'cursive'],
        terminal: ['VT323', 'monospace'],
        mono:     ['"JetBrains Mono"', 'monospace'],
      },

      fontSize: {
        'game-xs':   ['10px', { lineHeight: '1.8' }],
        'game-sm':   ['12px', { lineHeight: '1.8' }],
        'game-base': ['20px', { lineHeight: '1.4' }],
        'game-lg':   ['24px', { lineHeight: '1.4' }],
        'game-xl':   ['32px', { lineHeight: '1.3' }],
        'game-2xl':  ['16px', { lineHeight: '1.8' }],  // Press Start 2P titles
        'game-3xl':  ['20px', { lineHeight: '1.8' }],  // Press Start 2P hero
      },

      spacing: {
        'tile':    '16px',  // base game tile unit
        'tile-2':  '32px',
        'tile-4':  '64px',
      },

      borderWidth: {
        'pixel': '2px',
        'pixel-thick': '4px',
      },

      boxShadow: {
        'pixel':       '4px 4px 0px #000000',
        'pixel-sm':    '2px 2px 0px #000000',
        'pixel-lg':    '6px 6px 0px #000000',
        'pixel-inset': 'inset 2px 2px 0px #000000',
        'pixel-up':    '-4px -4px 0px #000000',
        'neon-red':    '0 0 8px #dc2626, 0 0 16px #dc262660',
        'neon-blue':   '0 0 8px #2563eb, 0 0 16px #2563eb60',
        'neon-green':  '0 0 8px #22c55e, 0 0 16px #22c55e60',
      },

      borderRadius: {
        // Pixel art = no border radius
        DEFAULT: '0px',
        none:    '0px',
        sm:      '0px',
        md:      '0px',
        lg:      '0px',
        xl:      '0px',
        '2xl':   '0px',
        full:    '0px',
      },

      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'damage-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':      { transform: 'translateX(-4px)' },
          '75%':      { transform: 'translateX(4px)' },
        },
        'screen-wipe': {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'sprite-enter': {
          from: { transform: 'translateX(120%)' },
          to:   { transform: 'translateX(0)' },
        },
        'type-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },

      animation: {
        blink:          'blink 0.8s steps(1, end) infinite',
        'blink-fast':   'blink 0.6s steps(1, end) infinite',
        'damage-shake': 'damage-shake 300ms steps(6, end)',
        'screen-wipe':  'screen-wipe 300ms steps(6, end) forwards',
        'sprite-enter': 'sprite-enter 200ms steps(4, end) forwards',
        'type-cursor':  'type-cursor 0.8s steps(1, end) infinite',
      },

      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1440px',
      },

      zIndex: {
        'game-bg':      '0',
        'game-sprites': '10',
        'game-ui':      '20',
        'game-menu':    '40',
        'game-dialog':  '60',
        'game-overlay': '80',
        'game-modal':   '100',
        'crt':          '9999',
      },
    },
  },
  plugins: [],
} satisfies Config
```

---

## 7. shadcn Theme Overrides

These CSS variables override shadcn/ui's default theme. Place in `src/index.css` (or `globals.css`), replacing the default `:root` and `.dark` blocks.

```css
/* src/index.css */

@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Pokelike — single dark theme (no light mode) */
  :root {
    /* Core backgrounds */
    --background:      220 14% 4%;    /* #0a0a0f */
    --foreground:      220 9% 94%;    /* #f0f0f0 */

    /* Panels */
    --card:            220 20% 10%;   /* #121827 */
    --card-foreground: 220 9% 94%;

    /* Popovers */
    --popover:         220 20% 10%;
    --popover-foreground: 220 9% 94%;

    /* Primary — Pokemon Red */
    --primary:         0 72% 51%;     /* #dc2626 */
    --primary-foreground: 0 0% 100%;

    /* Secondary — Pokemon Blue */
    --secondary:       217 91% 60%;   /* #2563eb */
    --secondary-foreground: 0 0% 100%;

    /* Muted */
    --muted:           220 26% 16%;   /* #1e2433 */
    --muted-foreground: 217 19% 60%;  /* #94a3b8 */

    /* Accent — Exp Green */
    --accent:          142 71% 45%;   /* #22c55e */
    --accent-foreground: 220 14% 10%;

    /* Destructive */
    --destructive:     0 72% 51%;     /* #dc2626 */
    --destructive-foreground: 0 0% 100%;

    /* Borders */
    --border:          220 9% 94% / 0.12;
    --input:           220 20% 10%;
    --ring:            0 72% 51%;     /* red focus ring */

    /* Border radius — kill all rounding */
    --radius: 0rem;
  }

  /* ---- Global resets for pixel aesthetic ---- */
  * {
    border-radius: 0 !important;  /* nuclear option — all square */
  }

  body {
    @apply bg-game-bg text-foreground font-terminal;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  /* Scrollbar — dark pixel style */
  ::-webkit-scrollbar {
    width: 8px;
    background: #0a0a0f;
  }
  ::-webkit-scrollbar-thumb {
    background: #ffffff;
    border: 2px solid #0a0a0f;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #dc2626;
  }
}

@layer components {
  /* ---- shadcn Button overrides ---- */
  .btn-pixel {
    @apply font-pixel text-[10px] border-2 border-white shadow-pixel
           hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pixel-lg
           active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
           transition-none cursor-pointer min-h-[44px] px-4;
  }

  /* ---- shadcn Card overrides ---- */
  .card-pixel {
    @apply bg-game-panel border-2 border-white shadow-pixel p-4;
  }

  /* ---- Dialog / Text box ---- */
  .dialog-rpg {
    @apply fixed bottom-0 left-0 right-0 bg-game-bg
           border-t-4 border-white shadow-[0_-4px_0_#000]
           p-6 pb-8 font-terminal text-[22px] text-white leading-relaxed
           max-h-[30vh] flex flex-col justify-between;
  }

  /* ---- Advance cursor ---- */
  .cursor-advance::after {
    content: '▼';
    @apply animate-blink ml-2 text-white;
  }

  /* ---- CRT overlay (apply to #root or game wrapper) ---- */
  .crt-overlay {
    position: relative;
  }
  .crt-overlay::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.15) 2px,
      rgba(0, 0, 0, 0.15) 4px
    );
    pointer-events: none;
    z-index: 9999;
  }

  /* ---- Neon text effects ---- */
  .text-neon-red {
    color: #dc2626;
    text-shadow: 0 0 8px #dc2626, 0 0 16px #dc262660;
  }
  .text-neon-blue {
    color: #2563eb;
    text-shadow: 0 0 8px #2563eb, 0 0 16px #2563eb60;
  }
  .text-neon-green {
    color: #22c55e;
    text-shadow: 0 0 8px #22c55e, 0 0 16px #22c55e60;
  }

  /* ---- Type badge ---- */
  .type-badge {
    @apply font-pixel text-[8px] uppercase tracking-wide
           px-2 py-1 border border-white shadow-pixel-sm text-white;
  }

  /* ---- HP Bar ---- */
  .hp-bar-container {
    @apply border-2 border-white h-3 bg-game-muted shadow-pixel-sm overflow-hidden;
  }
  .hp-bar-fill {
    @apply h-full;
    transition: width 600ms steps(8, end);
  }
}

/* ---- Reduced Motion ---- */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Implementation Checklist

Before shipping any game screen, verify:

### Visual
- [ ] All borders are `2px solid` — no rounded corners anywhere
- [ ] Box shadows use pixel shadow pattern (`4px 4px 0px #000`)
- [ ] Background is `#0a0a0f` or `#121827` only — no gradients
- [ ] Press Start 2P used only for short strings (titles, labels)
- [ ] VT323 used for all readable body/dialogue text
- [ ] Images use `image-rendering: pixelated`
- [ ] No emoji used as icons — use SVG only (Lucide or custom pixel sprites)

### Interaction
- [ ] Button hover: translate + shadow increase (no smooth transition)
- [ ] Button active: translate down + shadow collapse
- [ ] All touch targets min `44px` height
- [ ] HP bar uses `steps()` animation (not ease)
- [ ] Dialogue advances with `▼` blink cursor

### Animation
- [ ] All keyframes use `steps()` timing function
- [ ] No `ease`, `ease-in-out`, or `cubic-bezier` in game UI
- [ ] `prefers-reduced-motion` media query in CSS
- [ ] Screen transitions use wipe or fade-black (not slide)

### Accessibility
- [ ] Focus rings visible (red, `2px`)
- [ ] Color is not the only HP indicator (also numeric text)
- [ ] Dialogue text readable at `20px+` VT323
- [ ] Alt text on all sprite images
- [ ] Keyboard navigation works for all menus (arrow keys + Enter)

---

## 9. Quick Reference — Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Background | `#0a0a0f` | Deeper than pure black, avoids harsh contrast |
| Primary | `#dc2626` | Pokemon Red — franchise-native |
| Secondary | `#2563eb` | Pokemon Blue — franchise-native |
| Accent | `#22c55e` | Exp/HP green — universally understood |
| Border weight | `2px solid white` | Classic Game Boy UI chrome |
| Border radius | `0px` everywhere | Pixel art is square |
| Shadow | `4px 4px 0px #000` | Simulates pixel depth/raised state |
| Animation timing | `steps()` only | Maintains pixel/retro feel |
| Heading font | Press Start 2P | Industry-standard pixel game font |
| Body font | VT323 | Readable pixel-terminal at larger sizes |
| Stat font | JetBrains Mono | Tabular numbers for HP/PP/stats |
| CRT effect | Optional overlay | Adds atmosphere without breaking UX |
