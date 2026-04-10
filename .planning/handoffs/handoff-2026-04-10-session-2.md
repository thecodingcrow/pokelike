# Handoff — 2026-04-10 Session 2

## What Was Done This Session (on top of session 1)

### Team Management Phase 1 — COMPLETE
- `gameStore.ts`: `unequipItem(pokemonIdx)` — returns held item to bag
- `gameStore.ts`: `equipItem` — displaced items returned to bag (not silently dropped)
- `MapScreen.tsx`: Usable items (`isUsable`) now route to `'usable-item'` modal
- `TeamHoverCard.tsx`: Full rewrite — shows base stats grid, move info (name/power/category), held item + unequip button, 220px popover
- `TeamBar.tsx`: Passes `pokemonIdx` to hover card

### Battle Animation Engine Phase 1 — COMPLETE
- `systems/battle-anim.ts`: Core engine created — `runCanvas`, `Particle` class, `runParticleCanvas`, helpers (lerp, angleBetween, etc.), `TYPE_COLORS` map
- `components/battle/BattleCanvas.tsx`: React canvas overlay with ResizeObserver, forwardRef, placeholder `playAnimation`

### Skip Button Fix — COMPLETE
- `BattleScreen.tsx`: Skip now calls `playback.skipAll()` + `send({ type: 'SKIP' })` — drives machine state correctly, outcome unchanged

### All commits pushed, 169 tests passing

---

## What Needs To Be Done Next

### Team Management Phase 2 — NOT STARTED
**Plan:** `.planning/plans/2026-04-10-team-management.md` → Phase 2

- **PokemonDrawer** (`components/ui/PokemonDrawer.tsx`): New mobile bottom-up drawer component
  - Slide-up with 250ms ease-out, scrim behind, swipe to dismiss
  - Shows: 64px sprite, name, level, types, HP, stats grid, move, held item + unequip, Move Up/Move Down buttons
  - `createPortal` to body, max-height 70vh, z-index 90
- **TeamBar mobile tap**: `onClick` on slot opens PokemonDrawer (mobile only, <640px)
- **MapScreen**: Hold `drawerPokemonIdx` state, render PokemonDrawer
- **Move Up/Down**: Call `swapTeamMember` to reorder from drawer

### Battle Animations Phase 2 — NOT STARTED
**Plan:** `.planning/plans/2026-04-10-battle-animations.md` → Phase 2

- **17 type particle systems** (`systems/battle-anim-types.ts`): `buildParticles(type, from, to)` 
- Full catalog in `.planning/specs/2026-04-10-battle-animations.md`
- Each type has distinct visual: fire=flame stream, water=wavy beam, electric=zigzag bolts, etc.
- Detailed per-type specs (colors, count, shape, movement, duration) are in the spec

### Battle Animations Phase 3 — NOT STARTED
- **30 named move animations** (`systems/battle-anim-moves.ts`)
- **HP bar animated drain** (250ms linear transition)
- **Wire hit-flash, crit-flash, sprite-enter CSS classes**
- **Critical hit popup** (800ms, not speed-scaled)

### Battle Animations Phase 4 — NOT STARTED
- **Integration with useBattlePlayback**: Wire canvas into battle event loop
- Compute from/to coordinates via sprite refs
- Speed multiplier flows through

### Deploy Note
- Must deploy from `src-app/` directory: `cd src-app && vercel --prod --yes`
- Root directory deploys fail (no vite in root package.json)
- Delete `.vercel` in root if it gets created: `rm -rf /path/to/repo/.vercel`

### Vercel Dashboard Tasks (still manual)
- Enable Web Analytics (Analytics tab)
- Connect GitHub for auto-deploys (root dir: `src-app`)
