# Battle Animations Spec

> Port the original Pokelike canvas-based battle animation system to React.

## Architecture

### Canvas Overlay
- Single `<canvas>` element overlaying the BattleField component
- `position: absolute; inset: 0; pointer-events: none; z-index: 40`
- Sized to match the battle area via `ResizeObserver`
- Hidden when no animation is playing

### Animation Engine (`src/systems/battle-anim.ts`)
Core render loop matching the original:
- `runCanvas(ctx, duration, drawFn)` — rAF loop, calls `drawFn(ctx, t)` where `t = elapsed / scaledDuration`
- `runParticleCanvas(ctx, particles, duration)` — rAF loop for particle arrays
- All durations scaled by `speedMultiplier` (1× normal, 2× skip, 1000× instant)

### Animation Dispatch
`playAttackAnimation(ctx, moveType, from, to, isSpecial, moveName, speed)`:
1. Check named move animations first (exact `moveName` match)
2. If no named match and `isSpecial`: use `buildParticles(type)` + `runParticleCanvas`
3. If no named match and physical: generic type-colored streak + impact rings

### Coordinate System
`from` and `to` are pixel coordinates of attacker/target sprite centers within the canvas. Computed from sprite element `getBoundingClientRect()` relative to canvas position.

---

## Type Particle Systems (17 types)

Each type has a distinct particle system used as the special-move fallback. Summary of visual identity per type:

| Type | Visual | Colors | Duration |
|---|---|---|---|
| Fire | Streaming flame particles with upward drift + heat glow line | White-yellow → orange → red | 580ms |
| Water | Sinusoidal wavy beam (3 passes) + foam bubbles + splash rings | Blue glow → bright blue → white core | 680ms |
| Electric | 3 zigzag bolt paths that jitter/redraw every 80ms | Yellow-white with glow | 500ms |
| Grass | 2 bezier vine curves with leaf decorations + whip-tip flash | Dark green → bright green | 580ms |
| Ice | Straight beam (outer glow + core) with rotating snowflake crystals | Light cyan → white | 600ms |
| Fighting | 6 impact stars bursting radially + shockwave ring | Red | 380ms |
| Poison | 18 bubble spray with radial gradient + white highlight dots | Purple gradient | 540ms |
| Ground | 15 rotating diamond rocks + 3 expanding quake ellipses | Brown-golden | 600ms |
| Flying | 4 lens-shaped wind blades with sine-wave alpha | Light blue | 720ms |
| Psychic | 3 concentric expanding rings + 5 orbiting sparks | Pink-magenta | 700ms |
| Bug | 25 spore particles with sinusoidal wobble | Yellow-green | 500ms |
| Rock | 10 irregular rotating polygons spraying toward target | Grey-brown | 500ms |
| Ghost | Swirling gradient orb with trailing wisps | Dark purple | 600ms |
| Dragon | 6-color parallel rainbow beam | Red→purple spectrum | 700ms |
| Dark | 5 slash streaks with purple glow | Dark purple + pink | 650ms |
| Steel | 20 spark streaks bursting from impact point | Silver-white | 400ms |
| Normal | Single gradient orb traveling linearly | White | 450ms |

---

## Named Move Animations (30 total)

### Physical (15 named + 1 generic fallback)
- Body Slam, Fire Punch, Waterfall, Thunder Punch, Razor Leaf, Ice Punch, Close Combat, Poison Jab, Earthquake, Aerial Ace, Zen Headbutt, X-Scissor, Rock Slide, Shadow Claw, Dragon Claw
- Generic physical fallback: type-colored streak + 3 impact rings (350ms)

### Special (10 named + type particle fallback)
- Hyper Voice, Aura Sphere, Sludge Bomb, Earth Power, Air Slash, Bug Buzz, Power Gem, Shadow Ball, Dragon Pulse, Solar Beam (reuses Razor Leaf)
- Fallback: `buildParticles(type)` particle system

### Utility (2)
- Splash: water droplets arc up and fall with ripple
- Teleport: expanding purple rings from attacker

---

## HP Bar Animated Drain

- Duration: 250ms (scaled by speed multiplier)
- Easing: Linear
- Color transitions during drain: green (>50%) → amber (>25%) → red (≤25%)
- Counter updates every frame: "currentHp / maxHp"
- Implementation: `requestAnimationFrame` loop updating a ref, or CSS transition with `transition: width 250ms linear`

---

## Additional Battle Polish

### Wire existing CSS classes:
- `hit-flash`: Apply to target sprite after attack animation completes (150ms, steps)
- `crit-flash`: Apply on critical hits (200ms brightness flash)
- `sprite-enter-left` / `sprite-enter-right`: Apply on `send_out` events

### Critical hit popup:
- "Critical!" text div overlaid on the battle arena
- 800ms lifetime, NOT scaled by speed multiplier
- Gold text with pixel shadow

---

## Integration with useBattlePlayback

The playback hook drives the event loop. For each `attack` event:
1. Compute `from`/`to` coordinates from sprite refs
2. Call `playAttackAnimation(...)` — returns a Promise
3. After animation resolves: apply `hit-flash` class
4. If crit: show "Critical!" popup
5. Animate HP bar drain
6. Continue to next event

The canvas animation is async (Promise-based). The playback loop `await`s it before proceeding, respecting the speed multiplier throughout.

---

## File Structure

```
src/systems/battle-anim.ts          — Core engine: runCanvas, runParticleCanvas, Particle class
src/systems/battle-anim-types.ts    — buildParticles() with all 17 type configs
src/systems/battle-anim-moves.ts    — Named move animations (animBodySlam, etc.)
src/components/battle/BattleCanvas.tsx — React canvas overlay component
```

---

## Out of Scope

- Sound effects
- Background/environment animations
- Weather effects
- Status condition visual effects (burn, poison tick, etc.)
