# Animation & Interaction Design Proposal
**Pokelike — Revised Animation Philosophy**
Date: 2026-04-08

---

## The Problem with "steps() Only"

The current rule — `steps()` everywhere, `transition-none` on buttons — is half right and half wrong. It confuses *aesthetic medium* with *interaction quality*.

**steps() communicates:** "this is pixel art, this is retro, this is a game machine."
**Smooth easing communicates:** "I responded to you, something happened, this is alive."

Balatro is not pixel art — but it shares DNA with this project: a card game with satisfying tactile feel, running on modern hardware. Balatro's cards use butter-smooth hover and click physics *because the game feel depends on it*. The pixel aesthetic does not require that hover feedback feel like a switch flip. A pixel game can have responsive, physical interactions. The Game Boy Advance hardware was limited — the web is not.

The current design system correctly uses `steps()` for:
- Typewriter text (character-by-character appearance is the whole point)
- HP drain (pixel blocks ticking down is thematically correct)
- Screen wipes (the hard edge is the effect)
- Damage shake (choppiness = impact)
- Sprite entrance (pixel slide-in is the aesthetic)

It incorrectly mandates `steps()` for:
- Button hover (a `steps(1)` snap makes buttons feel broken, not retro)
- Card hover (no feedback = dead UI, not retro UI)
- Map node interaction (no glow on hover = missed opportunity)
- Screen transitions between game states (the transition *between* wipes can be smooth)

The fix is a **two-tier rule**, not a blanket override.

---

## Revised Animation Philosophy

### Tier 1 — steps() / snap: Thematic Pixel Animations

Use stepped or instant timing **when the stepped nature is the effect itself** — when removing the steps would destroy the meaning.

| Context | Rule | Rationale |
|---------|------|-----------|
| Typewriter dialogue | `steps(1)` per character, 40ms interval | Character-by-character IS the animation |
| HP bar drain | `steps(8–12)`, 600ms | Pixel blocks draining = health depleting |
| Screen wipe transition | `steps(6)`, 300ms | The hard curtain IS the transition style |
| Damage shake | `steps(6)`, 300ms | Choppy = physical impact |
| Sprite slide-in | `steps(4)`, 200ms | Pixel slide = GBA aesthetic |
| Low HP blink | `steps(1, end)`, 600ms cycle | On/off blink = urgency signal |
| Dialogue advance cursor `▼` | `steps(1, end)`, 800ms cycle | Classic GBA cursor |
| Menu selection cursor jump | instant | Menus snap, that's correct |
| Type effectiveness flash | `steps(2)`, 150–200ms | Hard flash = hit confirmation |

### Tier 2 — smooth easing: Interaction Feedback

Use smooth easing **when the animation communicates responsiveness and physicality** — when the user triggered it and needs to feel the system respond.

| Context | Duration | Easing | Rationale |
|---------|----------|--------|-----------|
| Button hover lift | 120ms | `ease-out` | Instant-snapping hover feels broken |
| Button press (active state) | 80ms | `ease-in` | Fast in = physical press |
| Button release | 100ms | `ease-out` | Slightly slower out = spring release |
| Card hover lift + shadow | 150ms | `ease-out` | Tactile, Balatro-style response |
| Card select (scale up) | 180ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Subtle overshoot = satisfying pop |
| Map node hover glow | 200ms | `ease-out` | Glow fades in, not snaps on |
| Map node click ripple | 300ms | `ease-out` then fade | Confirms click, dissipates |
| Screen crossfade (content swap) | 200ms | `ease-in-out` | Smooth scene change feels intentional |
| Modal open (scale + fade) | 200ms | `ease-out` | Appears from center, not snaps in |
| Modal close | 130ms | `ease-in` | Exit faster than enter |
| Tooltip appear | 100ms | `ease-out` | Quick but not instant |
| Pokemon card select highlight | 150ms | `ease-out` | Border glow fades in |

### Tier 3 — none: No Animation Needed

Skip animation entirely where it adds nothing or actively hurts.

- Stat number changes (show new value immediately — stepped counting is annoying for simple displays)
- Already-static elements gaining no interactive state
- Any animation in `prefers-reduced-motion` context (collapse all to instant or remove)
- Skeleton loaders on game screens (use `"Loading..."` typewriter text per current design)

---

## Hover Effects

### Card Hover (Pokemon Cards, Move Cards)

The current design has no hover feedback. This is a significant miss — cards are the primary interactive surface.

**Design principle:** 2px lift + shadow increase + subtle border brightening. Stays within the pixel aesthetic (the shadow is still a hard pixel shadow). The lift is smooth because the user's cursor is gliding, not stepping.

```css
/* Pokemon/Move Card — hover state */
.card-interactive {
  transform: translate(0, 0);
  box-shadow: var(--shadow-pixel);        /* 4px 4px 0px #000 */
  border: 2px solid rgba(255,255,255,0.6);
  transition:
    transform     120ms ease-out,
    box-shadow    120ms ease-out,
    border-color  120ms ease-out;
  cursor: pointer;
}

.card-interactive:hover {
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-pixel-lg);    /* 6px 6px 0px #000 */
  border-color: rgba(255,255,255,1);
}

.card-interactive:active {
  transform: translate(1px, 1px);
  box-shadow: var(--shadow-pixel-sm);    /* 2px 2px 0px #000 */
  transition-duration: 60ms;
}
```

**Selected state** (when a move or Pokemon is chosen):

```css
.card-interactive.selected {
  border-color: var(--color-pokemon-yellow);
  box-shadow: 4px 4px 0px #000, 0 0 0 2px var(--color-pokemon-yellow);
  transform: translate(-3px, -3px);
}
```

### Button Hover

Replace `transition-none` with a 120ms ease-out. The pixel shadow jump is still present — it just doesn't snap, it glides 120ms.

```css
.btn-pixel {
  transform: translate(0, 0);
  box-shadow: var(--shadow-pixel);
  transition:
    transform  120ms ease-out,
    box-shadow 120ms ease-out;
}

.btn-pixel:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-pixel-lg);
}

.btn-pixel:active {
  transform: translate(2px, 2px);
  box-shadow: none;
  transition-duration: 60ms;
}
```

**What this preserves:** The pixel shadow aesthetic, the directional lift illusion, the sunken-press metaphor.
**What this adds:** The response feels physical, not broken.

### Map Node Hover

Map nodes are clickable points on the roguelike path. Currently no feedback.

```css
.map-node {
  transition:
    filter     200ms ease-out,
    transform  200ms ease-out,
    box-shadow 200ms ease-out;
}

.map-node:hover {
  filter: brightness(1.3);
  transform: scale(1.08);
  box-shadow: 0 0 12px var(--color-pokemon-yellow),
              0 0 24px rgba(248, 208, 48, 0.4);
}

.map-node:active {
  transform: scale(0.96);
  transition-duration: 80ms;
}

/* Node type-specific glow colors */
.map-node--battle:hover  { box-shadow: 0 0 12px var(--color-pokemon-red),    0 0 24px rgba(220, 38, 38, 0.4); }
.map-node--shop:hover    { box-shadow: 0 0 12px var(--color-pokemon-yellow),  0 0 24px rgba(248, 208, 48, 0.4); }
.map-node--elite:hover   { box-shadow: 0 0 12px var(--color-pokemon-purple),  0 0 24px rgba(124, 58, 237, 0.4); }
.map-node--heal:hover    { box-shadow: 0 0 12px var(--color-pokemon-green),   0 0 24px rgba(34, 197, 94, 0.4); }
```

---

## Screen Transition Approach

### Problem with current screen-wipe

A `steps(6)` wipe works as an entrance animation, but using it for *every* screen change makes navigation feel like rebooting the game. We need a hierarchy of transition types.

### Transition Hierarchy

**Level 1 — Wipe (battle entry / game start / boss encounter)**
Reserve the hard `steps(6)` wipe for dramatic moments that deserve punctuation.

```css
@keyframes screen-wipe-in {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
@keyframes screen-wipe-out {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}

.screen-enter-wipe {
  animation: screen-wipe-in 300ms steps(6, end) forwards;
}
.screen-exit-wipe {
  animation: screen-wipe-out 300ms steps(6, end) forwards;
}
```

Use for: entering battle, game over, title screen, evolving a Pokemon.

**Level 2 — Fade-black (menu navigation)**
A smooth fade to black then fade in. Intentional, cinematic, quick.

```css
@keyframes fade-to-black {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fade-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  pointer-events: none;
  z-index: 9998;
  animation: fade-to-black 200ms ease-out forwards;
}
```

Orchestration (JS): fade overlay in (200ms) → swap content → fade overlay out (200ms). Total: 400ms, feels intentional.

Use for: Bag → Map, Map → Settings, any top-level navigation.

**Level 3 — Crossfade (panel/tab switching)**
Content within the same screen swaps via opacity crossfade. No black, no wipe.

```css
@keyframes content-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.content-fade-in {
  animation: content-fade-in 180ms ease-out forwards;
}
```

Use for: switching between move-select and item-select in battle, tab switching in menus.

**Level 4 — Modal slide-up**
Modals and sheets animate from their trigger source. Scale + fade.

```css
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes modal-exit {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.97) translateY(4px);
  }
}

.modal-enter { animation: modal-enter 200ms ease-out forwards; }
.modal-exit  { animation: modal-exit  130ms ease-in  forwards; }
```

---

## Battle Animation Feel

### Keep stepped / snap

- **HP drain**: `steps(8–12)`, 600ms — pixel blocks depleting. Correct. Keep.
- **Damage shake**: `steps(6)`, 300ms — choppy shake = physical hit. Keep.
- **Type flash** (super effective, not very effective): `steps(2)`, 150ms — hard flash. Keep.
- **Sprite entrance**: `steps(4)`, 200ms — pixel slide. Keep.
- **Dialogue typewriter**: character-by-character at 40ms. Keep.

### Upgrade: crit flash

Current crit flash uses `steps(2)`. This is fine but a double-flash (two brightness pulses) reads stronger.

```css
@keyframes crit-flash {
  0%   { filter: brightness(1); }
  20%  { filter: brightness(3); }
  40%  { filter: brightness(1.2); }
  70%  { filter: brightness(2.5); }
  100% { filter: brightness(1); }
}
.crit-flash {
  animation: crit-flash 350ms steps(5, end);
}
```

### New: screen shake on crit

Critical hits and super-effective moves deserve screen-level shake, not just sprite shake.

```css
@keyframes screen-shake {
  0%   { transform: translate(0,    0);   }
  15%  { transform: translate(-6px, 3px); }
  30%  { transform: translate(5px, -4px); }
  45%  { transform: translate(-4px, 6px); }
  60%  { transform: translate(6px, -2px); }
  75%  { transform: translate(-3px, 4px); }
  90%  { transform: translate(3px, -3px); }
  100% { transform: translate(0,    0);   }
}
.screen-shake {
  animation: screen-shake 400ms steps(7, end);
}
```

Apply `.screen-shake` to the root game container div, triggered by JS on crit or super-effective.

### New: damage number pop

Floating damage numbers are not in the current system but are essential game feel.

```css
@keyframes damage-number-rise {
  0%   { opacity: 1; transform: translateY(0)    scale(1.2); }
  60%  { opacity: 1; transform: translateY(-24px) scale(1); }
  100% { opacity: 0; transform: translateY(-32px) scale(0.9); }
}
.damage-number {
  position: absolute;
  font-family: var(--font-pixel);
  font-size: 12px;
  color: white;
  text-shadow: 2px 2px 0px #000;
  pointer-events: none;
  animation: damage-number-rise 700ms ease-out forwards;
}
.damage-number--crit {
  color: var(--color-pokemon-yellow);
  font-size: 14px;
}
.damage-number--super-effective {
  color: var(--color-type-fire);
}
```

### Low HP — better than blinking

The current "blink the HP bar red" is correct but cheap-looking. Keep the blink but add the HP bar pulsing green glow when the user's Pokemon is at low HP (danger + urgency).

```css
@keyframes hp-low-pulse {
  0%, 100% {
    box-shadow: var(--shadow-pixel-sm), 0 0 0 rgba(220, 38, 38, 0);
  }
  50% {
    box-shadow: var(--shadow-pixel-sm), 0 0 8px rgba(220, 38, 38, 0.7);
  }
}
.hp-bar-container--critical {
  animation: hp-low-pulse 0.6s ease-in-out infinite;
}
```

This is smooth easing — justified because the pulsing is meant to feel organic and anxious, not mechanical.

---

## Card / Pokemon Card Interaction

Pokemon selection cards (roster screen, party view, trade) need a layered interaction model:

### Resting state

```css
.pokemon-card {
  border: 2px solid rgba(255,255,255,0.5);
  box-shadow: var(--shadow-pixel);
  transition:
    transform    150ms ease-out,
    box-shadow   150ms ease-out,
    border-color 150ms ease-out,
    filter       150ms ease-out;
  cursor: pointer;
}
```

### Hover state (lift + type-color border glow)

```css
.pokemon-card:hover {
  transform: translate(-3px, -4px);
  box-shadow: var(--shadow-pixel-lg);
  border-color: rgba(255,255,255,0.9);
}
```

### Press (active state)

```css
.pokemon-card:active {
  transform: translate(1px, 1px);
  box-shadow: var(--shadow-pixel-sm);
  transition-duration: 60ms;
}
```

### Selected state (with overshoot bounce)

When a card is selected (confirmed chosen), it bounces into selection — this uses `cubic-bezier` with overshoot to feel like a satisfying "snap into place":

```css
@keyframes card-select-bounce {
  0%   { transform: translate(-3px, -4px) scale(1); }
  40%  { transform: translate(-5px, -6px) scale(1.05); }
  70%  { transform: translate(-3px, -4px) scale(0.98); }
  100% { transform: translate(-3px, -4px) scale(1); }
}
.pokemon-card.selected {
  border-color: var(--color-pokemon-yellow);
  box-shadow: var(--shadow-pixel-lg),
              0 0 0 2px var(--color-pokemon-yellow),
              0 0 16px rgba(248, 208, 48, 0.4);
  animation: card-select-bounce 250ms ease-out forwards;
}
```

### Fainted / disabled Pokemon card

```css
.pokemon-card--fainted {
  filter: grayscale(0.8) brightness(0.6);
  cursor: not-allowed;
  opacity: 0.6;
}
.pokemon-card--fainted:hover {
  transform: none;
  box-shadow: var(--shadow-pixel);
  border-color: rgba(255,255,255,0.5);
}
```

---

## Map Node Interaction

### Hover glow

See full CSS in "Hover Effects" section above. Key additions:

- The glow color matches the node type (battle = red, heal = green, elite = purple, shop = yellow)
- Scale to 1.08 — slightly larger, feels like reaching toward it
- 200ms ease-out — not instant, the glow "blooms"

### Click ripple (visual confirmation)

After clicking a node, a pixel-art ripple expands and fades. Uses `steps()` because it's a quick confirmation, not a hover state.

```css
@keyframes node-ripple {
  0%   { transform: scale(1);   opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

.map-node-ripple {
  position: absolute;
  inset: -4px;
  border: 2px solid currentColor;
  pointer-events: none;
  animation: node-ripple 400ms ease-out forwards;
}
```

Add `.map-node-ripple` as a child element via JS `onClick`, remove after animation ends (`animationend` event).

### Path line reveal (when new nodes unlock)

```css
@keyframes path-draw {
  from { stroke-dashoffset: 100%; }
  to   { stroke-dashoffset: 0%; }
}

.map-path-line {
  stroke-dasharray: 100%;
  stroke-dashoffset: 100%;
  animation: path-draw 400ms ease-out forwards;
}
```

---

## Sound-like Visual Feedback

These are purely visual effects that substitute for sound (since the game may not always have sound on). They communicate the same information that a sound effect would.

### Screen shake on crit

Already defined above. Triggered by JS on critical hit. Apply to `#game-root`. Duration: 400ms, steps(7).

### White flash on super effective

A full-screen white overlay that appears and fades. The "screen goes white" effect is a classic JRPG hit confirmation.

```css
@keyframes super-effective-flash {
  0%   { opacity: 0.7; }
  100% { opacity: 0; }
}

.super-effective-overlay {
  position: fixed;
  inset: 0;
  background: white;
  pointer-events: none;
  z-index: 9997;
  animation: super-effective-flash 300ms ease-out forwards;
}
```

Stronger than hit-flash (which only flashes the sprite). The screen white-out reads as "significant damage."

### Red vignette on low HP

When the player's Pokemon is critical, a slow pulsing red vignette frames the screen. This is the "danger room" effect from horror games — the player feels urgency.

```css
@keyframes vignette-pulse {
  0%, 100% { opacity: 0.0; }
  50%       { opacity: 0.5; }
}

.danger-vignette {
  position: fixed;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(220, 38, 38, 0.6) 100%
  );
  pointer-events: none;
  z-index: 9996;
  animation: vignette-pulse 1.2s ease-in-out infinite;
}
```

Add `.danger-vignette` to the DOM when player HP drops below 20%, remove when healed.

### Yellow flash on EXP gain / level up

```css
@keyframes exp-flash {
  0%   { opacity: 0.5; }
  100% { opacity: 0; }
}

.exp-flash-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-pokemon-yellow);
  pointer-events: none;
  z-index: 9997;
  animation: exp-flash 400ms ease-out forwards;
}
```

### Heal shimmer on Pokemon heal

```css
@keyframes heal-shimmer {
  0%   { opacity: 0;   transform: translateY(0); }
  30%  { opacity: 0.6; }
  100% { opacity: 0;   transform: translateY(-20px); }
}

.heal-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(34, 197, 94, 0.4),
    transparent
  );
  pointer-events: none;
  animation: heal-shimmer 600ms ease-out forwards;
}
```

---

## Summary: CSS Custom Properties for Animation Tokens

Add these to the `@theme inline` block in `index.css` alongside existing tokens. This keeps durations and easings globally consistent.

```css
/* ── Animation timing tokens ────────────────────────────────────────────── */

/* Smooth interaction (tier 2) */
--duration-hover:      120ms;
--duration-press:       60ms;
--duration-card-hover: 150ms;
--duration-card-select:250ms;
--duration-modal-in:   200ms;
--duration-modal-out:  130ms;
--duration-glow:       200ms;
--duration-ripple:     400ms;
--duration-crossfade:  180ms;
--duration-fade-black: 200ms;

/* Thematic stepped (tier 1) */
--duration-hp-drain:   600ms;
--duration-sprite-in:  200ms;
--duration-screen-wipe:300ms;
--duration-shake:      300ms;
--duration-crit-shake: 400ms;
--duration-flash:      150ms;
--duration-typewriter:  40ms; /* per character */

/* Easing presets */
--ease-out-standard: cubic-bezier(0.0, 0.0, 0.2, 1);  /* Material ease-out */
--ease-in-standard:  cubic-bezier(0.4, 0.0, 1,   1);  /* Material ease-in */
--ease-bounce:       cubic-bezier(0.34, 1.56, 0.64, 1); /* slight overshoot */
```

---

## What to Change in the Current design-system.md

The existing Section 5 "Animation Guidelines" should be updated as follows:

**Keep the wording:** "Pixel games do not ease" — but scope it correctly. Add: "Pixel games do not ease *thematic animations*. Interaction feedback (hover, press, select) uses smooth easing because responsive feel is not an aesthetic choice — it is a usability requirement."

**Remove from the timing table:** `Button press | immediate | steps(1)` — replace with `Button press | 60ms | ease-in`.

**Remove from anti-patterns:** "No `transition: all 300ms ease`" is still correct (use specific properties, not `all`). But "No smooth HP bar animation" is correct. "No framer-motion spring animations" is still correct for this stack (we're using CSS, not framer).

**Add to anti-patterns:**
- No `transition-none` on hover states of interactive elements — dead hover = broken UI, not retro UI
- No blinking as the *only* low-HP signal — combine with vignette and HP bar glow
- No screen-wipe for every navigation event — reserve wipes for dramatic scene changes

---

## Reduced Motion Compliance

All smooth animations collapse gracefully. The stepped animations (HP drain, typewriter, wipes) are preserved at reduced durations because they convey game-state information the player needs.

```css
@media (prefers-reduced-motion: reduce) {
  /* Collapse smooth interaction feedback to instant */
  .card-interactive,
  .btn-pixel,
  .map-node,
  .pokemon-card {
    transition: none !important;
  }

  /* Remove cosmetic flashes and shakes */
  .super-effective-overlay,
  .exp-flash-overlay,
  .heal-shimmer,
  .danger-vignette {
    display: none !important;
  }

  /* Collapse screen shake */
  .screen-shake {
    animation: none !important;
  }

  /* Preserve essential state feedback at reduced duration */
  .damage-shake {
    animation-duration: 100ms !important;
  }
  .crit-flash {
    animation-duration: 80ms !important;
  }

  /* Keep typewriter and HP drain — they convey state */
  /* (these already use steps, which is low-motion by nature) */
}
```
