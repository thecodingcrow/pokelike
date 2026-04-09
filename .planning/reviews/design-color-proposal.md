# Pokelike — Color Palette Proposal
**Balatro-inspired warmth × Pokemon Gen 1 identity**
Date: 2026-04-08

---

## Design Intent

The current palette (`#0a0a0f` bg, white borders, blue panels) reads as cyberpunk-clinical. The target feel is:

- **Balatro reference:** Deep green felt, amber chrome, red/blue contrast, dark panels with warm undertones
- **Pokemon Gen 1 reference:** Cartridge-era warmth — the Game Boy Color palette of `#DC2626` red, `#2563EB` blue, `#22C55E` green, `#F8D030` yellow
- **Roguelike indie soul:** Textured, rich, not sterile. Like a worn card table in a dim arcade.

The background shifts from blue-black (`#0a0a0f`) to a **deep warm dark** — a near-black with green/brown undertones, like poker felt in low light. All "white" borders become **warm amber/cream**, not pure white.

---

## Proposed CSS Variables

### Background & Surface

```css
/* Deep warm dark — replaces #0a0a0f (too cold/blue) */
--color-game-bg:       #0d110e;   /* Near-black with green undertone — felt table in shadow */
--color-game-bg-alt:   #111510;   /* Slightly lighter variant for alternating sections */

/* Panel — replaces #121827 (too blue) */
--color-game-panel:    #161d14;   /* Dark forest green-brown panel */
--color-game-panel-raised: #1c2419; /* Raised panel — card surfaces, dialog boxes */

/* Deep inset / trough — replaces #1e2433 */
--color-game-muted:    #0f1410;   /* Recessed areas, HP bar background, disabled zones */
```

**Rationale:** `#0d110e` has a green-brown undertone (hue ~135°) that reads as "dark felt" rather than "dark screen." It pairs with the amber chrome without fighting it.

---

### Chrome / Borders (warm — not white)

```css
/* Primary border — replaces hardcoded `white` borders */
--color-border-warm:       #c8a96e;   /* Warm amber — Game Boy cartridge label gold */
--color-border-warm-dim:   #8a6f44;   /* Dimmed amber for secondary borders */
--color-border-warm-bright:#e8c97e;   /* Bright amber for focus/active states */

/* Dark border for pixel shadow offset */
--color-border-shadow:     #050805;   /* Near-black with warm tinge for pixel drop shadows */
```

**Rationale:** The Card & Board Game palette's `#D97706` accent, shifted slightly cooler and lighter to `#c8a96e`, gives that worn-gold Game Boy cartridge feel. Balatro's UI chrome is brown-gold, not white.

---

### Interactive / Primary Actions

```css
/* Primary CTA — Pokemon Red */
--color-primary:           #dc2626;   /* KEEP — Pokemon Red, cartridge-era */
--color-primary-foreground:#ffffff;

/* Secondary CTA — Pokemon Blue */
--color-secondary:         #2563eb;   /* KEEP — Pokemon Blue, cartridge-era */
--color-secondary-foreground: #ffffff;

/* Accent — warm amber gold (Balatro chip/coin color) */
--color-accent:            #d97706;   /* Amber gold — selection highlights, badges, XP */
--color-accent-foreground: #0d110e;   /* Dark text on amber */

/* Destructive */
--color-destructive:       #dc2626;
--color-destructive-foreground: #ffffff;
```

---

### Text / Foreground

```css
/* Primary text — warm off-white, not pure white */
--color-foreground:        #f0ead6;   /* Warm cream — like aged paper, not clinical white */
--color-foreground-dim:    #b8aa8a;   /* Dimmed cream for secondary labels */
--color-foreground-muted:  #6b5f45;   /* Muted warm tan for disabled/placeholder text */
```

**Rationale:** Pure `#ffffff` on `#0d110e` reads as high-contrast clinical. `#f0ead6` (warm cream) maintains readability (contrast ~14:1) while feeling like an old CRT screen or cartridge manual typography.

---

### Card / Dialog Surfaces

```css
/* Card surface — above panel, below modal */
--color-card:              #1c2419;   /* Warm dark green — felt card surface */
--color-card-foreground:   #f0ead6;   /* Warm cream text */

/* Popover / modal surface */
--color-popover:           #222c1e;   /* Slightly lighter than card */
--color-popover-foreground:#f0ead6;

/* Input fields */
--color-input:             #161d14;   /* Same as panel — recessed feel */
```

---

### HP Bar Colors (keep existing — they are correct)

```css
--color-hp-full:  #22c55e;   /* KEEP — bright green, Gen 1 accuracy */
--color-hp-mid:   #f59e0b;   /* KEEP — amber warning */
--color-hp-low:   #dc2626;   /* KEEP — red critical */
```

HP bar container border changes from `white` to `--color-border-warm`.

---

### Muted / Disabled States

```css
--color-muted:             #161d14;   /* Matches panel — muted backgrounds */
--color-muted-foreground:  #6b5f45;   /* Warm tan — 3.5:1 contrast on panel */
--color-disabled-bg:       #0f1410;   /* Same as game-muted */
--color-disabled-text:     #4a4030;   /* Very muted warm brown — clearly disabled */
```

---

### Focus / Ring

```css
--color-ring:              #d97706;   /* Amber focus ring — warm, visible, on-brand */
```

---

### Pixel Shadow Colors

```css
/* Update pixel shadow from pure black to warm near-black */
--shadow-pixel:       4px 4px 0px #050805;
--shadow-pixel-sm:    2px 2px 0px #050805;
--shadow-pixel-lg:    6px 6px 0px #050805;
--shadow-pixel-inset: inset 2px 2px 0px #050805;
--shadow-pixel-up:    -4px -4px 0px #050805;
```

---

### Scrollbar (update from cold to warm)

```css
/* Scrollbar background: was #0a0a0f */
background: #0d110e;
/* Scrollbar thumb: was #ffffff */
background: #c8a96e;
border: 2px solid #0d110e;
/* Hover: keep red — correct Gen 1 accent */
background: #dc2626;
```

---

### Type Colors (KEEP ALL — Gen 1 accurate, do not change)

```css
--color-type-fire:     #ff7c5c;
--color-type-water:    #6ab4f5;
--color-type-grass:    #78c850;
--color-type-electric: #f8d030;
--color-type-psychic:  #f85888;
--color-type-normal:   #a8a878;
--color-type-ghost:    #705898;
--color-type-dragon:   #7038f8;
--color-type-ice:      #98d8d8;
--color-type-fighting: #c03028;
--color-type-poison:   #a040a0;
--color-type-ground:   #e0c068;
--color-type-flying:   #a890f0;
--color-type-bug:      #a8b820;
--color-type-rock:     #b8a038;
--color-type-dark:     #705848;
--color-type-steel:    #b8b8d0;
```

Type badge border changes from `white` to `--color-border-warm` or to the type's own color at reduced opacity.

---

### Pokemon Brand Colors (keep, used for version theming)

```css
--color-pokemon-red:    #dc2626;   /* KEEP */
--color-pokemon-blue:   #2563eb;   /* KEEP */
--color-pokemon-green:  #22c55e;   /* KEEP */
--color-pokemon-yellow: #f8d030;   /* KEEP */
--color-pokemon-purple: #7c3aed;   /* KEEP */
```

---

## Color Change Summary Table

| Token | Current | Proposed | Reason |
|---|---|---|---|
| `--color-game-bg` | `#0a0a0f` | `#0d110e` | Warm green undertone (felt) vs cold blue-black |
| `--color-game-panel` | `#121827` | `#161d14` | Forest-dark warm panel vs blue-navy |
| `--color-game-muted` | `#1e2433` | `#0f1410` | Deep warm trough vs blue-grey |
| `--color-border-warm` | `white` (hardcoded) | `#c8a96e` | Amber chrome vs clinical white |
| `--color-foreground` | white/oklch | `#f0ead6` | Warm cream vs pure white |
| `--color-accent` | (none / blue) | `#d97706` | Amber gold for highlights/selection |
| `--color-ring` | grey | `#d97706` | Amber focus ring |
| pixel shadow color | `#000000` | `#050805` | Warm near-black |
| HP bar container border | `white` | `#c8a96e` | Matches new warm chrome system |

---

## What Does NOT Change

- All type colors — Gen 1 accurate, leave as-is
- `--color-pokemon-*` brand palette — used for version theming
- HP bar fill colors (`hp-full`, `hp-mid`, `hp-low`) — correct game semantics
- `--color-primary` (red) and `--color-secondary` (blue) — Pokemon Red/Blue identity
- All animation keyframes
- All font families
- Border-radius: `0rem` — pixel aesthetic stays hard-edged

---

## Atmosphere Notes

The combination of `#0d110e` (felt-black) + `#c8a96e` (amber chrome) + `#dc2626`/`#2563eb` (Red/Blue cartridge primary actions) + `#f0ead6` (cream text) produces:

- In a dark room: looks like an old CRT monitor showing a Game Boy game, chromium-lit by warm overhead light
- As a card game: the green-dark background reads as poker felt; amber borders read as worn brass/gold trim
- Pokemon identity: the red and blue remain dominant action colors, exactly as they appear on the original cartridge labels

This avoids both the "cyberpunk neon" trap (current palette leans this way with its cold darks) and the "washed-out beige nostalgia" trap. It is dark, rich, warm, and unmistakably Pokemon.
