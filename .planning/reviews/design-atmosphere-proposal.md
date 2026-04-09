# Atmosphere & Visual Effects Design Proposal
_Pokemon Roguelike — Background, CRT, Ambient FX_
_Date: 2026-04-08_

---

## Current State (Problem Baseline)

- Background: flat `#0a0a0f` applied as inline `style` on App root and repeated as `bg-[#0a0a0f]` on individual screens
- CRT effect: `.crt-overlay::after` — static `repeating-linear-gradient` scanlines at 15% opacity, no movement, no vignette
- No texture, grain, glow, or ambient motion whatsoever
- The existing pixel aesthetic (Press Start 2P, pixel shadows, step-animations) is strong; background just hasn't caught up

---

## Design Philosophy

Balatro's background works because it has **three simultaneous layers of life:**
1. Base texture that implies material (felt grain)
2. Slow ambient motion (subtle wobble/breathe)
3. Atmospheric lighting that reacts to game state

We want the same triad, tuned for Pokemon pixel-art rather than card game luxury.
The rule: **background should never demand attention, but should always reward it.**

---

## 1. Background Texture System

### Approach: SVG Noise + Radial Depth Gradient

Pure CSS. No images. No library. ~200 bytes of SVG baked inline as a `data:` URI.

```css
/* ── Atmosphere CSS variables (add to @theme inline) ─────────────────────── */
--atmo-noise-opacity:  0.035;   /* subtle — not film grain, just depth */
--atmo-vignette-color: #000000;
--atmo-glow-color:     #1a1a2e; /* cool indigo — Pokemon night-sky feel */

/* ── Root atmosphere layer ───────────────────────────────────────────────── */
.game-root {
    background-color: #0a0a0f;
    background-image:
        /* Layer 1: subtle radial depth — center is fractionally lighter */
        radial-gradient(
            ellipse 120% 80% at 50% 40%,
            #12121e 0%,
            #0a0a0f 55%,
            #060608 100%
        ),
        /* Layer 2: SVG noise grain for tactile texture */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-blend-mode: normal, overlay;
    background-size: 100% 100%, 200px 200px;
}
```

**Why SVG noise over CSS `noise()` or a PNG:** The SVG `feTurbulence` filter generates true fractalNoise that tiles seamlessly, renders at any DPI, and costs 0 network bytes. `background-blend-mode: overlay` at very low opacity (adjust via the variable) adds texture without lifting the dark floor. Tuning: decrease `baseFrequency` (e.g. `0.5`) for larger-grain film look; increase (e.g. `1.0`) for finer digital static.

### Vignette Overlay

```css
/* Applied as a fixed pseudo-element on .game-root */
.game-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(
        ellipse 100% 100% at 50% 50%,
        transparent 40%,
        rgba(0, 0, 0, 0.55) 100%
    );
    pointer-events: none;
    z-index: 1;
}
```

The vignette pushes the eye toward screen center, exactly where gameplay lives. This is the single highest-ROI addition — it transforms flat black into framed space.

---

## 2. CRT / Scanline Treatment

### Current Problem
The existing `.crt-overlay::after` is static at 15% opacity. It adds a faint grid but nothing more. No horizontal differentiation (scanlines should be horizontal bands, not a grid). No phosphor glow. No flicker.

### Recommended Approach: Refined Scanlines + Subtle Phosphor Flicker

Keep scanlines but make them **intentional and breathe** rather than static. Ditch the grid; real CRT scanlines are horizontal-only.

```css
/* ── Refined CRT scanlines ───────────────────────────────────────────────── */
.crt-overlay::after {
    content: '';
    position: fixed;
    inset: 0;
    /* Horizontal scanlines only — 3px dark band per 4px row */
    background: repeating-linear-gradient(
        180deg,
        transparent 0px,
        transparent 3px,
        rgba(0, 0, 0, 0.12) 3px,
        rgba(0, 0, 0, 0.12) 4px
    );
    pointer-events: none;
    z-index: 9999;
    /* Slow phosphor "breathing" — subtle opacity oscillation */
    animation: crt-breathe 6s ease-in-out infinite;
    will-change: opacity;
}

@keyframes crt-breathe {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.82; }
}
```

**Opacity: 12% dark band (down from 15%)** — less oppressive over pixel art which has its own hard edges.
**Breathing animation at 6s** — imperceptible consciously, felt subconsciously. This is the "alive" quality Balatro has.
**`will-change: opacity`** — GPU composited, essentially free.

### Optional Phosphor Color Tint

For screens that want extra retro warmth (title, game-over), add a second fixed pseudo on a wrapper element:

```css
.crt-phosphor-tint::before {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(
        ellipse 80% 60% at 50% 50%,
        rgba(14, 20, 40, 0.18) 0%,   /* cool indigo center bloom */
        transparent 70%
    );
    pointer-events: none;
    z-index: 9998;
    mix-blend-mode: screen;
}
```

---

## 3. Per-Screen Atmosphere Variations

The core mechanism: **CSS custom properties on each screen's root element**, overriding atmosphere tokens. No JavaScript needed except optionally for transitions.

```css
/* ── Atmosphere token defaults (base/neutral) ────────────────────────────── */
:root {
    --screen-glow-color:    #12121e;  /* indigo-neutral */
    --screen-glow-opacity:  0.0;
    --screen-vignette-tint: transparent;
    --screen-scanline-tint: rgba(0, 0, 0, 0.12);
}
```

### Title Screen — Dramatic / Cinematic
```css
.screen-title {
    --screen-glow-color:    #1a0a1a;  /* deep purple — mystery */
    --screen-glow-opacity:  0.6;
    background-image:
        /* Pulsing hero glow behind title text position */
        radial-gradient(
            ellipse 60% 40% at 50% 35%,
            rgba(220, 38, 38, 0.08) 0%,   /* red — Pokeball energy */
            transparent 70%
        ),
        radial-gradient(ellipse 120% 80% at 50% 40%, #12121e 0%, #0a0a0f 55%, #060608 100%);
    animation: title-ambient-pulse 4s ease-in-out infinite;
}

@keyframes title-ambient-pulse {
    0%, 100% { background-position: 0 0, 0 0; }
    50% {
        /* Gently shift the red glow upward — breathing */
        background-position: 0 -4px, 0 0;
    }
}
```

### Battle Screen — Tense / High Contrast
```css
.screen-battle {
    background-image:
        /* Aggressive split: dark red bleed from top-left (enemy) */
        linear-gradient(
            160deg,
            rgba(60, 10, 10, 0.35) 0%,
            transparent 45%
        ),
        /* Cool teal from bottom-right (player) */
        linear-gradient(
            340deg,
            rgba(10, 30, 50, 0.30) 0%,
            transparent 45%
        ),
        /* Base radial */
        radial-gradient(ellipse 120% 80% at 50% 40%, #0f0f18 0%, #080808 100%);
}
/* Scanlines feel heavier in battle — tension */
.screen-battle .crt-overlay::after {
    background: repeating-linear-gradient(
        180deg,
        transparent 0px,
        transparent 2px,
        rgba(0, 0, 0, 0.18) 2px,
        rgba(0, 0, 0, 0.18) 3px
    );
}
```

### Map Screen — Calm / Exploratory
```css
.screen-map {
    background-image:
        /* Cool blue-green ambient — routes, adventure */
        radial-gradient(
            ellipse 90% 70% at 50% 60%,
            rgba(10, 25, 20, 0.50) 0%,
            transparent 65%
        ),
        radial-gradient(ellipse 120% 80% at 50% 40%, #0d1218 0%, #0a0a0f 60%, #060608 100%);
}
```

### Game Over Screen — Desaturated / Oppressive
```css
.screen-gameover {
    background-image:
        /* Full-field desaturating vignette — hope draining away */
        radial-gradient(
            ellipse 100% 100% at 50% 50%,
            rgba(5, 5, 8, 0.0) 0%,
            rgba(0, 0, 0, 0.75) 100%
        ),
        radial-gradient(ellipse 120% 80% at 50% 40%, #0d0d0d 0%, #060608 100%);
    filter: saturate(0.6);
}
```

### Win / Shiny / Badge Screen — Warm / Triumphant
```css
.screen-win,
.screen-shiny,
.screen-badge {
    background-image:
        radial-gradient(
            ellipse 70% 50% at 50% 45%,
            rgba(248, 208, 48, 0.07) 0%,  /* gold — achievement */
            transparent 70%
        ),
        radial-gradient(ellipse 120% 80% at 50% 40%, #141208 0%, #0a0a0f 55%, #060608 100%);
}
```

**Implementation note:** Add the `.screen-{name}` class to each screen's outermost `<div>`. Remove inline `style={{ backgroundColor: '#0a0a0f' }}` from App.tsx and screens — let CSS handle it. Add `.game-root` to the outer wrapper in App.tsx.

---

## 4. Ambient Effects

### 4a. Particle System (Pure CSS — No JS)

Floating "energy motes" — subtle, slow-moving translucent dots. Works for title and map screens. Uses CSS `@keyframes` with staggered `animation-delay`.

```css
/* ── Ambient particle motes ──────────────────────────────────────────────── */
.ambient-particles {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 2;
}

/* Generate 8 particles via nth-child — or repeat selector blocks */
.ambient-particles span {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    animation: mote-float linear infinite;
    will-change: transform, opacity;
}

/* 8 individually positioned motes */
.ambient-particles span:nth-child(1)  { width:3px;height:3px; left:15%; top:70%; animation-duration:18s; animation-delay:0s;   }
.ambient-particles span:nth-child(2)  { width:2px;height:2px; left:32%; top:85%; animation-duration:24s; animation-delay:-5s;  }
.ambient-particles span:nth-child(3)  { width:4px;height:4px; left:55%; top:80%; animation-duration:20s; animation-delay:-9s;  }
.ambient-particles span:nth-child(4)  { width:2px;height:2px; left:72%; top:75%; animation-duration:16s; animation-delay:-3s;  }
.ambient-particles span:nth-child(5)  { width:3px;height:3px; left:88%; top:90%; animation-duration:22s; animation-delay:-12s; }
.ambient-particles span:nth-child(6)  { width:2px;height:2px; left:8%;  top:60%; animation-duration:19s; animation-delay:-7s;  }
.ambient-particles span:nth-child(7)  { width:3px;height:3px; left:44%; top:92%; animation-duration:26s; animation-delay:-15s; }
.ambient-particles span:nth-child(8)  { width:2px;height:2px; left:65%; top:68%; animation-duration:21s; animation-delay:-2s;  }

@keyframes mote-float {
    0%   { transform: translateY(0)   translateX(0);   opacity: 0; }
    10%  { opacity: 0.6; }
    90%  { opacity: 0.4; }
    100% { transform: translateY(-80vh) translateX(20px); opacity: 0; }
}
```

**Usage:** Only render `<div class="ambient-particles"><span/><span/>...(x8)</span></div>` on TitleScreen and MapScreen. Conditionally exclude from BattleScreen (too distracting).

### 4b. Gentle Color Shift (Title Screen Only)

SVG background hue-rotation on a 30s cycle — too slow to be conscious, just a living quality:

```css
.screen-title {
    animation: title-hue-drift 30s ease-in-out infinite alternate;
}

@keyframes title-hue-drift {
    0%   { filter: hue-rotate(0deg)   brightness(1.0); }
    50%  { filter: hue-rotate(8deg)   brightness(1.03); }
    100% { filter: hue-rotate(-5deg)  brightness(0.97); }
}
```

Keep it ±8° max — beyond that it shifts the neon red title text visibly.

### 4c. Battle Intensity Pulse

On BattleScreen, when HP is low (< 20%), you can add a class to the screen root that triggers a peripheral danger pulse:

```css
.screen-battle.danger-low-hp {
    animation: battle-danger-pulse 1.2s ease-in-out infinite;
}

@keyframes battle-danger-pulse {
    0%, 100% { box-shadow: inset 0 0 0px rgba(220, 38, 38, 0); }
    50%       { box-shadow: inset 0 0 60px rgba(220, 38, 38, 0.12); }
}
```

This is a peripheral red bleed, not a full flash — it's felt in the corners of vision. Extremely effective danger signaling.

---

## 5. Ambient Glow Behind UI Elements

The Balatro "felt center glow" trick — a subtle radial behind the active content area:

```css
/* ── Content area glow (apply to the 1200px max-width wrapper) ───────────── */
.game-content-wrapper {
    position: relative;
}
.game-content-wrapper::after {
    content: '';
    position: absolute;
    inset: -20% -10%;
    background: radial-gradient(
        ellipse 60% 40% at 50% 50%,
        rgba(26, 26, 46, 0.4) 0%,
        transparent 70%
    );
    pointer-events: none;
    z-index: 0;
    /* Slow breathe synced to CRT breathe for coherence */
    animation: crt-breathe 6s ease-in-out infinite;
}
```

---

## 6. Implementation Guide

### Step 1 — App.tsx changes
```tsx
// Before:
<div className="min-h-dvh" style={{ backgroundColor: '#0a0a0f' }}>
  <div className="w-full max-w-[1200px] min-h-dvh mx-auto relative overflow-hidden">

// After:
<div className="game-root crt-overlay min-h-dvh">
  <div className="game-content-wrapper w-full max-w-[1200px] min-h-dvh mx-auto relative overflow-hidden">
```

Move `.crt-overlay` class from individual screen wrappers (if used) to App root only — one overlay covers everything. Remove all inline `style={{ backgroundColor: '#0a0a0f' }}` from every screen.

### Step 2 — Per-screen class
Each screen's outermost div gets its atmosphere class:
```tsx
// TitleScreen.tsx
<div className="screen-title flex flex-col items-center justify-center min-h-dvh px-4">

// BattleScreen.tsx
<div className="screen-battle flex flex-col min-h-dvh">

// MapScreen.tsx
<div className="screen-map ...">

// GameOverScreen.tsx
<div className="screen-gameover ...">
```

### Step 3 — Add particle markup (Title + Map only)
```tsx
<div className="ambient-particles" aria-hidden="true">
  {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
</div>
```

### Step 4 — Danger pulse wiring (BattleScreen)
Read the active Pokemon's HP ratio from existing game state. When `< 0.2`, add `.danger-low-hp` to the screen root. This is already computable from `playback.playerTeam` in BattleScreen.

---

## 7. Performance Considerations

| Effect | GPU Layer | Cost | Risk |
|---|---|---|---|
| SVG noise background | No (static) | ~0 | None — static CSS background |
| Radial gradient layering | No (static) | ~0 | None |
| Vignette pseudo-element | Composited | ~0 | None |
| CRT scanline breathing | Composited (`opacity`) | ~0 | `will-change: opacity` |
| Ambient mote particles | Composited (`transform`) | Low | Cap at 8 motes max |
| Hue drift (title only) | Composited (`filter`) | Low | Only on idle title screen |
| Battle danger pulse | Composited (`box-shadow`) | Medium | Box-shadow forces repaint — use `outline` or `inset` shadow on a pseudo-element instead to isolate |
| Content area glow | Composited | ~0 | Static gradient, animated by opacity |

**Total compositor budget:** all effects combined stay well under 1ms/frame on modern hardware. The SVG noise is the only non-compositor item, and it's static — painted once, never recalculated.

### Reduced Motion
All ambient animations already fall under the existing `prefers-reduced-motion` rule in `index.css`:
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
    }
}
```
No additional work needed. The textures and gradients remain; only motion stops.

---

## 8. Quick-Win Priority Order

If implementing incrementally, do these in order of impact-per-effort:

1. **Vignette pseudo-element** — `.game-root::before` radial gradient. 8 lines of CSS. Instant transformation.
2. **Replace flat background with layered radial + SVG noise** on `.game-root`. Replaces inline style. ~15 lines.
3. **Fix scanline direction** (horizontal-only) + add `crt-breathe` animation. 5-line delta.
4. **Per-screen atmosphere classes** for Battle and Title. 20 lines.
5. **Battle danger pulse** — wires to existing game state. 10 lines CSS + 3 lines TSX.
6. **Ambient mote particles** on Title and Map. 30 lines CSS + minimal JSX.
7. **Title hue drift** — last because it requires testing across light/dark neon states.

---

## 9. Color Token Additions

Add to `@theme inline` in `index.css`:

```css
/* ── Atmosphere tokens ───────────────────────────────────────────────────── */
--color-atmo-void:       #060608;   /* deepest dark — vignette edge */
--color-atmo-deep:       #0a0a0f;   /* base game background (existing) */
--color-atmo-surface:    #0f0f1a;   /* slightly lifted center */
--color-atmo-glow-cool:  #1a1a2e;   /* indigo ambient */
--color-atmo-glow-warm:  #1a1208;   /* amber/gold — win states */
--color-atmo-glow-red:   #1a0808;   /* danger/battle */
--color-atmo-glow-green: #081a0d;   /* route/map calm */
```

---

## Summary

The proposal gives the game three coherent atmosphere layers (texture, CRT, mood) that together replicate the "alive background" quality of Balatro's felt — but tuned to Pokemon's dark pixel aesthetic rather than luxury card game warmth. Every technique is pure CSS/SVG, statically implementable, and composited at the GPU level. The per-screen system makes atmosphere reactive to game state without any runtime JavaScript beyond the existing state machine.
