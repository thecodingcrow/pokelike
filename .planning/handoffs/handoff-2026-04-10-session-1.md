# Handoff — 2026-04-10 Session 1

## What Was Accomplished

### Visual Refresh (complete)
- Full warm "felt table" theme across all CSS, components, screens, modals
- Map: chip nodes with SVG filters, HTML tooltips, sidebar layout, unreachable node dimming, visited path trace
- Battle: full-roster layout with spotlight arena, player always left / enemy always right
- Fullscreen game canvas with vignette + noise atmosphere
- Mobile: safe-area insets, no empty roster slots, team hover suppressed

### Bug Fixes (complete)
- **Node progression**: `advanceCurrentNodeAction`/`healTeamAction`/`addBadgeAction` read from XState context instead of stale Zustand
- **Swap screen**: Now actually swaps (swapTeamAction + cancelSwapAction)
- **solo_run**: maxTeamSize tracked in addToTeam/setTeam
- **pokedex_complete/shinydex_complete**: Unlock checks added to catchPokemonAction
- **markSeen**: Enemy pokemon marked seen in pokedex after battle
- **equipItem**: No longer removes item on invalid index
- **Skip button**: Now sends SKIP to machine + skipAll() for instant playback — outcome unchanged
- **Battle speed**: Resets to 1× each new battle

### Test Suite (complete)
- 169 tests total (was 94)
- Store unit tests (gameStore, persistenceStore, uiStore)
- State machine integration tests (24 transition tests)
- Full playthrough simulation (title → champion)

### Infrastructure (complete)
- Vercel deployed at https://pokelike-thecodingcrows-projects.vercel.app
- Vercel Analytics wired (`@vercel/analytics` inject() in main.tsx — enable in dashboard)
- Game state persists to localStorage via zustand/persist
- RESUME_RUN event + Continue button on title screen
- Give Up Run in settings modal with confirmation

### UI Polish (complete)
- X close buttons on all 9 modals (44×44px)
- Game Over: full-color team with 64px sprites, names, levels, HP
- Shiny indicator: gold glow + ✦ SHINY label on cards, ✦ star on team bar
- HP bars: inline styles for reliable mobile rendering
- Battle speed: configurable, resets per battle

## What Needs To Be Done Next

### 1. Team Management UX (spec + plan ready)
**Spec:** `.planning/specs/2026-04-10-team-management-ux.md`
**Plan:** `.planning/plans/2026-04-10-team-management.md`

Phase 1: Store fixes (unequipItem, equipItem displaced item return, usable item routing) + enhanced TeamHoverCard with stats/move/unequip
Phase 2: PokemonDrawer mobile bottom sheet + TeamBar mobile tap interaction + Move Up/Down reordering

### 2. Battle Animations (spec + plan ready)
**Spec:** `.planning/specs/2026-04-10-battle-animations.md`
**Plan:** `.planning/plans/2026-04-10-battle-animations.md`
**Original source reference:** `/original/js/ui.js` — 31 animation functions fully cataloged

Phase 1: Core animation engine (runCanvas, Particle class, runParticleCanvas) + BattleCanvas React overlay
Phase 2: 17 type particle systems (buildParticles per type)
Phase 3: 30 named move animations + HP drain + hit-flash/crit-flash/sprite-enter wiring
Phase 4: Integration with useBattlePlayback hook

### 3. Vercel Dashboard Tasks (manual)
- Rename project from `src-app` to `pokelike` (Settings → General)
- Enable Web Analytics (Analytics tab)
- Connect GitHub repo for auto-deploys (Settings → Git → thecodingcrow/pokelike, root dir: `src-app`)
- **Deploy must run from `src-app/` directory** — root deploys fail because vite isn't in root package.json

## Key Decisions Made
- All agents dispatch from `src-app/` not repo root
- Sonnet for coding, opus for review
- No TDD for CSS/visual work — verify via tsc + build + visual check
- Game state persists to localStorage (no backend)
- Battle outcome computed once in runBattle — animations are display-only

## Open Tester Feedback
- One-time tooltip explanations for first-time players (not started)
- Battle type-specific animations (spec ready, not implemented)
- No nuzlocke mode in original source — only Hard Mode (already implemented)
