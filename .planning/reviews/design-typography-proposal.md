# Design & Typography Proposal — Pokelike Chrome Overhaul

**Context:** Balatro-warmth direction. Current problems: Press Start 2P is too wide at small sizes, white borders on dark bg feel clinical, chrome reads as dev mockup not a game.

---

## 1. Font Strategy

### The Three-Font System

**Tier 1 — Display/Title: Press Start 2P**
Keep it, but restrict it ruthlessly. It earns its width only at large sizes where the pixel grid reads as intentional.
- Use ONLY for: main title "P O K E L I K E", game-over text, win screen header
- Never below 16px. If it needs to be small, it's not the right font.
- Current 10px usage in `btn-pixel`, `type-badge`, `PokemonInfoPanel` labels — all wrong tier.

**Tier 2 — UI Labels/Headers: VT323**
VT323 is the workhorse. It's pixel-native, extremely readable, and scales beautifully from 14px to 32px. It's the font Balatro would use if it were a text-based RPG.
- Use for: all screen headers, badge names, map labels, button text, HP label, move names, pokemon names in battle panels
- Sweet spot: 18px–28px. At 18px it reads like crisp terminal text. At 28px it's bold and legible.
- Replace all the 10px `font-pixel` instances in buttons and info panels.

**Tier 3 — Body/Dialog: VT323 at larger sizes OR introduce Chakra Petch**
For the battle dialog box, VT323 at 22px is already close to correct — keep it.
For richer prose (Pokedex descriptions, patch notes, achievements) consider adding Chakra Petch 400 at 14px — it has a techy warmth without being heavy.

### Google Fonts Import (revised)

```css
/* Remove JetBrains Mono — unused in game chrome */
/* Keep Press Start 2P and VT323 */
/* Add Chakra Petch for body prose only */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Chakra+Petch:wght@400;500&display=swap');
```

### Font Size Scale

| Role | Font | Size | Where |
|---|---|---|---|
| Game title | Press Start 2P | 20–28px | TitleScreen h1 only |
| Game Over / Win | Press Start 2P | 24px | GameOverScreen, WinScreen |
| Screen headers | VT323 | 26px | Battle header, Map label |
| Pokemon name (battle) | VT323 | 20px | PokemonInfoPanel |
| Button text | VT323 | 22px | All PixelButton variants |
| Type badges | VT323 | 16px | TypeBadge (replaces 8px pixel) |
| Battle dialog | VT323 | 22–24px | BattleField dialog box |
| HP label | VT323 | 16px | HpBar |
| Badge names | VT323 | 12px | BadgeBar tooltip |
| Body prose | Chakra Petch | 14px | Pokedex, modals, patch notes |

**The key swap:** every `font-pixel text-[8px]` or `font-pixel text-[10px]` instance is misusing the font. Replace with `font-terminal text-[18px]` or `font-terminal text-[20px]` and the same information reads clearly without the claustrophobic squint.

---

## 2. Color & Warmth — Amber/Gold Chrome Direction

The current palette is cold blue-grey (`#121827`, `#1e2433`) and the only accent is white borders. The fix is to tint the chrome toward amber-gold and make borders colored rather than white.

### New CSS Design Tokens (add to `@theme inline`)

```css
/* ── Warm chrome tokens ──────────────────────────────────────────────── */
--color-chrome-gold:     #c8961e;   /* Balatro-warm amber, main border color */
--color-chrome-gold-dim: #7a5a0f;   /* Darker gold for inset/shadow border   */
--color-chrome-gold-hi:  #f0c040;   /* Highlight edge, top-left of panels    */
--color-chrome-amber:    #e8a020;   /* Button top face                       */

--color-panel-bg:        #0e1118;   /* Deeper than current #121827           */
--color-panel-raised:    #171f2e;   /* Raised layer, like a card sitting up  */
--color-panel-inset:     #080d14;   /* Recessed area inside panels           */

/* ── Warm shadow variants ────────────────────────────────────────────── */
--shadow-warm-sm:   3px 3px 0px #7a5a0f;
--shadow-warm-md:   4px 4px 0px #7a5a0f;
--shadow-warm-lg:   6px 6px 0px #7a5a0f;
--shadow-warm-inset: inset 2px 2px 0px #7a5a0f, inset -1px -1px 0px #f0c04040;
```

Replace the current white-border pattern (`border-white`) with `border-[#c8961e]` on game chrome. Keep white borders only for UI that intentionally reads as "classic Game Boy" (the battle dialog box top border is one case where white is correct — it mimics the GBC screen border).

---

## 3. Button Styling — Layered Depth

Current: flat color + `4px 4px 0px #000` shadow + border-white. Reads as a CSS demo.

The Balatro button model has three visual layers:
1. **Top face** — the button's color (slightly lighter gradient)
2. **Side/depth face** — darker solid color, offset below/right, creates the illusion of a 3D block
3. **Shadow** — blurs or hard-offset below the depth face

### New `.btn-pixel` CSS

```css
.btn-pixel {
  font-family: var(--font-terminal);
  font-size: 20px;
  line-height: 1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #fff8e8;                          /* warm white, not pure white */
  text-shadow: 0 1px 0 rgba(0,0,0,0.6);

  /* Top-face gradient */
  background: linear-gradient(
    to bottom,
    #e8a020 0%,
    #c8761a 60%,
    #a85c10 100%
  );

  /* The layered border trick: gold highlight top/left, dark bottom/right */
  border: none;
  outline: 2px solid #7a5a0f;
  outline-offset: 0;
  box-shadow:
    inset 0 1px 0 #f0c040,               /* top highlight edge */
    inset 0 -1px 0 #7a3a00,              /* bottom inner shadow */
    4px 4px 0px #3a2000,                 /* depth block (offset face) */
    5px 5px 0px #00000060;               /* soft outer shadow */

  cursor: pointer;
  min-height: 44px;
  padding: 0 1.25rem;
  transition: none;
}

.btn-pixel:hover {
  background: linear-gradient(
    to bottom,
    #f0b828 0%,
    #d08020 60%,
    #b06018 100%
  );
  transform: translate(-1px, -1px);
  box-shadow:
    inset 0 1px 0 #ffd84a,
    inset 0 -1px 0 #7a3a00,
    5px 5px 0px #3a2000,
    6px 6px 0px #00000060;
}

.btn-pixel:active {
  transform: translate(3px, 3px);
  box-shadow:
    inset 0 2px 2px rgba(0,0,0,0.4),    /* press-down inset shadow */
    1px 1px 0px #3a2000;
  background: linear-gradient(
    to bottom,
    #b06018 0%,
    #c87020 100%
  );
}

.btn-pixel:disabled {
  opacity: 0.4;
  transform: none;
  cursor: not-allowed;
  box-shadow: 2px 2px 0px #3a2000;
}
```

### Secondary Button Variant (Blue)

```css
.btn-pixel-secondary {
  /* same structure, different palette */
  background: linear-gradient(to bottom, #3060d0 0%, #2050b0 60%, #1040a0 100%);
  box-shadow:
    inset 0 1px 0 #6090f8,
    inset 0 -1px 0 #001060,
    4px 4px 0px #001040,
    5px 5px 0px #00000060;
  outline: 2px solid #001060;
}
```

### Ghost Button Variant (for footer nav, icon buttons)

```css
.btn-pixel-ghost {
  font-family: var(--font-terminal);
  font-size: 18px;
  text-transform: uppercase;
  color: #c8961e;                          /* gold text */
  text-shadow: none;
  background: transparent;
  border: 2px solid #c8961e40;             /* dim gold border */
  box-shadow: none;
  padding: 0 0.75rem;
  min-height: 36px;
  transition: none;
}
.btn-pixel-ghost:hover {
  background: #c8961e18;
  border-color: #c8961e;
  box-shadow: 2px 2px 0px #7a5a0f;
}
```

### PixelButton.tsx — revised variant map

```tsx
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:     'btn-pixel',
  secondary:   'btn-pixel btn-pixel-secondary',
  ghost:       'btn-pixel-ghost',
  destructive: 'btn-pixel btn-pixel-destructive',
};
```

---

## 4. Panel & Card Chrome — Depth Through Layering

Current `.card-pixel`: flat `#121827` background + `2px solid white` border + `4px 4px 0px #000` shadow.

### Layered Panel System

The Balatro panel has: outer border (gold) → panel bg → inner inset border (darker, creates sunken feel) → content. This three-layer sandwich reads as physical depth.

```css
/* ── Base game panel ─────────────────────────────────────────────────── */
.card-pixel {
  background: var(--color-panel-raised);   /* #171f2e */
  border: 2px solid #c8961e;              /* gold border, not white */
  box-shadow:
    inset 1px 1px 0px #f0c04030,          /* top-left inner highlight */
    inset -1px -1px 0px #00000040,        /* bottom-right inner shadow */
    4px 4px 0px #3a2000,                  /* depth block */
    5px 5px 0px #00000050;               /* outer soft shadow */
  padding: 1rem;
}

/* ── Raised panel (for battle info panels, hovered cards) ────────────── */
.card-pixel-raised {
  background: linear-gradient(160deg, #1c2535 0%, #141c2a 100%);
  border: 2px solid #c8961e;
  box-shadow:
    inset 0 1px 0 #f0c04040,
    inset 0 -1px 0 rgba(0,0,0,0.5),
    3px 3px 0px #3a2000;
  padding: 0.75rem;
}

/* ── Inset/recessed panel (like a score tray or input field) ─────────── */
.card-pixel-inset {
  background: var(--color-panel-inset);    /* #080d14 */
  border: 2px solid #7a5a0f;             /* dimmer gold = recessed */
  box-shadow:
    inset 2px 2px 4px rgba(0,0,0,0.6),
    inset -1px -1px 0px #c8961e20;
  padding: 0.75rem;
}
```

### PokemonInfoPanel in BattleField

The info panels are the most visible "card" in the game. Proposal:

```tsx
// Replace the plain border-white panel with:
<div className="card-pixel-raised min-w-[140px] max-w-[160px]">
  <div className="font-terminal text-[20px] text-[#fff8e8] uppercase truncate leading-tight mb-1">
    {displayName}
  </div>
  <div className="font-terminal text-[16px] text-[#c8961e] mb-1.5">
    Lv {pokemon.level}
  </div>
  <HpBar ... />
  ...
</div>
```

---

## 5. HP Bar — Warmer Treatment

Current: `border-white` + `bg-game-muted`. Fine mechanically, cold visually.

```css
.hp-bar-container {
  border: 2px solid #7a5a0f;             /* gold border instead of white */
  height: 0.75rem;
  background: #080d14;                   /* deep inset bg */
  box-shadow:
    inset 1px 1px 2px rgba(0,0,0,0.8),
    1px 1px 0px #3a2000;
  overflow: hidden;
}

.hp-bar-fill {
  height: 100%;
  transition: width 600ms steps(8, end);
  /* Add a subtle top highlight stripe */
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.25);
}
```

---

## 6. Battle Dialog Box

The dialog box is the most Balatro-like element — it already has the right structure (bordered panel at bottom, text inside). Fix: swap white top-border for gold, add depth layer, use VT323 at 24px.

```css
.dialog-rpg {
  background: linear-gradient(to bottom, #0e1118 0%, #0a0d12 100%);
  border-top: 4px solid #c8961e;         /* gold instead of white */
  box-shadow:
    0 -4px 0 #3a2000,                    /* depth block above the gold border */
    0 -6px 0 rgba(0,0,0,0.4);
  padding: 1.25rem 1.5rem 1.75rem;
  font-family: var(--font-terminal);
  font-size: 24px;
  color: #fff8e8;                        /* warm white */
  line-height: 1.4;
}
```

---

## 7. Header / Footer Treatment for Game Screens

### Problem
Current headers are `bg-[#121827] border-b-2 border-white px-4 py-2` — plain, flat, cold.

### Solution: Layered Bar with Gradient + Gold Border

```css
/* ── Game screen header/footer bar ───────────────────────────────────── */
.game-bar {
  background: linear-gradient(
    to bottom,
    #1c2535 0%,
    #141c2a 100%
  );
  border-color: #c8961e;               /* gold border */
  box-shadow: 0 2px 0 #3a2000;        /* depth edge below header */
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Applied in BattleScreen header: */
<div className="game-bar border-b-2 flex-shrink-0">
  <span className="font-terminal text-[22px] text-[#c8961e] uppercase tracking-wider">{battleTitle}</span>
  <span className="font-terminal text-[18px] text-[#fff8e880]">{battleSubtitle}</span>
</div>

/* Applied in MapScreen footer: */
<footer className="absolute bottom-0 left-0 right-0 z-10 game-bar border-t-2">
  ...
</footer>
```

### MapScreen Header (floating, no bg)
The map header is meant to float — no need for a bar bg. But the elements need warmth:
- `mapLabel`: `font-terminal text-[20px] text-[#c8961e]` (gold, not grey)
- BadgeBar: see below
- IconButtons: swap to `.btn-pixel-ghost`

---

## 8. BadgeBar Redesign

Current: small hexagons with `border-white/40`, `clipPath: polygon(hexagon)`, opacity fade for unearned.

### Proposed: Elevated Medallion Style

The hexagon shape is good. The problems are: (1) too small (w-6 h-6 = 24px), (2) the border is barely visible, (3) unearned state is just opacity — no texture.

```tsx
// BadgeBar.tsx — proposed
<div className="flex flex-row gap-2">
  {BADGE_NAMES.map((name, i) => {
    const earned = i + 1 <= badges;
    return (
      <div key={i} title={`${name} Badge${earned ? ' (earned)' : ''}`}>
        <div
          style={{
            width: 32,
            height: 32,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            backgroundColor: earned ? BADGE_COLORS[i] : '#0e1118',
            boxShadow: earned
              ? `0 0 6px ${BADGE_COLORS[i]}80, inset 0 1px 0 rgba(255,255,255,0.3)`
              : 'none',
            border: `2px solid ${earned ? '#c8961e' : '#3a4560'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'none',
          }}
        >
          {earned ? (
            <span
              className="font-terminal text-[14px] font-bold text-white"
              style={{ textShadow: '0 1px 0 rgba(0,0,0,0.8)' }}
            >
              {i + 1}
            </span>
          ) : (
            // Unearned: show a dim outline hex with a subtle cross-hatch
            <span className="font-terminal text-[12px] text-[#3a4560]">·</span>
          )}
        </div>
      </div>
    );
  })}
</div>
```

Note: `clipPath` and `border` don't compose well in browsers. In practice use an SVG or `outline` on the parent + clip the inner fill, or use a CSS `polygon` background-only approach and handle the border with a slightly larger same-shape parent div behind it. The above is conceptual — a production version should use a `<svg>` hexagon per badge.

**Alternative SVG badge (cleaner)**:

```tsx
function HexBadge({ earned, color, label, n }: {...}) {
  return (
    <svg width="32" height="36" viewBox="0 0 32 36">
      {/* Gold outer ring */}
      <polygon
        points="16,2 30,10 30,26 16,34 2,26 2,10"
        fill={earned ? '#c8961e' : '#3a4560'}
      />
      {/* Colored inner fill */}
      <polygon
        points="16,5 27,12 27,24 16,31 5,24 5,12"
        fill={earned ? color : '#0e1118'}
      />
      {/* Number */}
      {earned && (
        <text x="16" y="22" textAnchor="middle"
          fontFamily="VT323, monospace" fontSize="14"
          fill="white" style={{ textShadow: '0 1px 0 #000' }}>
          {n}
        </text>
      )}
    </svg>
  );
}
```

---

## 9. Type Badge Redesign

Current: `font-pixel text-[8px]` — tiny, hard to read, clinical white border.

```css
.type-badge {
  font-family: var(--font-terminal);
  font-size: 15px;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 1px 6px 2px;
  /* Colored border matching type color, not white */
  border: 1px solid currentColor;
  box-shadow: 1px 1px 0px rgba(0,0,0,0.6);
  color: white;
  display: inline-block;
  text-shadow: 0 1px 0 rgba(0,0,0,0.5);
}
```

In TypeBadge.tsx, pass the type's color as `borderColor` and a slightly dimmed version as the `backgroundColor` with ~80% opacity.

---

## 10. Scrollbar — Warm Gold

```css
::-webkit-scrollbar { width: 8px; background: #080d14; }
::-webkit-scrollbar-thumb {
  background: #c8961e;
  border: 2px solid #080d14;
}
::-webkit-scrollbar-thumb:hover { background: #f0c040; }
```

---

## 11. TeamBar Slot Redesign

Current: plain `border-white/40` squares. Cold.

```tsx
// Each slot:
className={[
  'flex flex-col items-center gap-0.5 p-1',
  pokemon
    ? 'border-2 border-[#c8961e60] bg-[#0e1118] shadow-[2px_2px_0px_#3a2000]'
    : 'border-2 border-[#3a4560] bg-[#080d14]',
].join(' ')}
```

The HP dot: make it 3×3px with a 1px gold border around it.

---

## 12. Implementation Priority Order

1. **CSS tokens** — add warm chrome tokens to `index.css` `@theme inline` block (no component changes yet, establishes the palette)
2. **Font swap in buttons** — change `btn-pixel` to use `font-terminal text-[20px]` (instant readability win everywhere)
3. **Border color** — globally replace `border-white` on game chrome with `border-[#c8961e]` (one grep pass)
4. **Button depth** — rewrite `.btn-pixel` with the layered gradient + box-shadow system
5. **Panel chrome** — update `.card-pixel` and `dialog-rpg` with warm border + layered shadows
6. **BadgeBar** — SVG hex redesign
7. **Type badges** — font-terminal at 15px
8. **Header/footer bars** — apply `.game-bar` class
9. **TeamBar slots** — warm border colors

Changes 1–4 alone will transform the feel from "dev mockup" to "warm retro game."

---

## 13. What NOT to Change

- The pixel shadow `translate(-2px, -2px)` hover interaction — it's correct game feel, keep it
- The `steps()` timing functions on animations — these are what makes things feel Game Boy, keep them
- The `image-rendering: pixelated` global — non-negotiable
- `border-radius: 0 !important` — the sharp pixel aesthetic is correct, Balatro uses rounded corners on actual cards because it's a physical card game; this is an RPG, keep 0
- VT323 at 22–24px for dialog — already close to right, just warm it up
- The CRT overlay — keep, it adds to the retro warmth
- Type colors (`--color-type-*`) — these are canonically correct Pokemon type colors, preserve them
