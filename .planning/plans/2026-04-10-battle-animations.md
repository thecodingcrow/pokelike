# Battle Animations — Implementation Plan

> **Spec:** `.planning/specs/2026-04-10-battle-animations.md`
> **Source reference:** `/original/js/ui.js` (2623 lines, 31 animation functions)

---

## Phase 1: Animation engine + canvas overlay

### Batch 1: 1 sonnet coder + 1 opus reviewer

**Task 1: Core animation engine**
- New file: `systems/battle-anim.ts`
- `runCanvas(ctx, duration, drawFn, speed)` — rAF loop with t=elapsed/scaledDuration
- `Particle` class with tick/draw/isAlive
- `runParticleCanvas(ctx, particles, duration, speed)` — particle rAF loop
- Helper functions: `lightenColor`, `darkenColor`, coordinate math

**Task 2: BattleCanvas React component**
- New file: `components/battle/BattleCanvas.tsx`
- Absolute canvas overlay on BattleField
- ResizeObserver for sizing
- Exposes `playAnimation(type, from, to, isSpecial, moveName, speed): Promise<void>`
- Uses `useImperativeHandle` + `forwardRef` for parent control

**Quality gate:** `tsc -b && pnpm build`

---

## Phase 2: Type particle systems (17 types)

### Batch 2: 1 sonnet coder + 1 opus reviewer

**Task 3: All 17 type particle systems**
- New file: `systems/battle-anim-types.ts`
- `buildParticles(type, from, to)` returning Particle arrays
- Each type's visual identity from the spec catalog
- Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Normal

**Quality gate:** `tsc -b`

---

## Phase 3: Named move animations + HP drain

### Batch 3: 1 sonnet coder + 1 opus reviewer

**Task 4: Named move animations (30 total)**
- New file: `systems/battle-anim-moves.ts`
- 15 physical named + generic physical fallback
- 10 special named + particle fallback dispatch
- 2 utility (Splash, Teleport)
- `playAttackAnimation()` dispatch function

**Task 5: HP bar animated drain + battle polish**
- `HpBar.tsx`: Animated width transition (250ms linear), color transitions during drain
- `BattleField.tsx`: Wire `hit-flash`, `crit-flash` CSS classes on attack events
- `BattleField.tsx`: Wire `sprite-enter-left/right` on send_out events
- Critical hit popup overlay (800ms, not speed-scaled)

**Quality gate:** `tsc -b && pnpm test && pnpm build`

---

## Phase 4: Integration with playback hook

### Batch 4: 1 sonnet coder + 1 opus reviewer

**Task 6: Wire canvas into battle flow**
- `BattleScreen.tsx`: Add BattleCanvas ref, pass to BattleField
- `useBattlePlayback.ts`: On attack events, call canvas animation before proceeding
- Compute from/to coordinates via sprite refs + getBoundingClientRect
- Speed multiplier flows through to all animation durations

**Quality gate:** `tsc -b && pnpm test && pnpm build` + manual visual check

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 1-2 | Engine + canvas overlay |
| 2 | 3 | 17 type particle systems |
| 3 | 4-5 | 30 named moves + HP drain + polish |
| 4 | 6 | Integration with playback |
