# Review Synthesis — 3 Opus Reviewers

## Deduplicated Findings by Priority

### CRITICAL (must fix before any execution)

| # | Finding | Sources | Fix |
|---|---------|---------|-----|
| C1 | Elite Four flow broken — `transition` state unreachable | Engine | Add `isEliteFourNotComplete` guard before `isBossBattle` in battle.result |
| C2 | actions.ts + guards.ts are dead code — machine inlines everything | Architect | Delete both files, keep logic inline in machine OR extract properly |
| C3 | No battle animation playback system planned | Designer | Add `useBattlePlayback` hook task — MVP: HP drain, shake, faint, send-out |

### HIGH (must fix in Phase 1)

| # | Finding | Sources | Fix |
|---|---------|---------|-----|
| H1 | `startMap` doesn't call `generateMap` — map stays null | Engine | Import and call `generateMap(mapIndex)` in store |
| H2 | `advanceNode` doesn't update DAG — siblings never lock | Engine | Call `advanceFromNode(map, nodeId)` in store |
| H3 | `calcDamage` uses attacker stats not `move.isSpecial` | Engine | Use `move.isSpecial` field instead of re-deriving |
| H4 | Ditto transform doesn't copy `moveTier` | Engine | Also copy `moveTier` from target |
| H5 | Air Balloon checks attacker's items, not defender's | Engine+Designer | Check `defItems` for `air_balloon` |
| H6 | Machine reads localStorage directly, bypasses Zustand | Architect | Use `usePersistenceStore.getState().hasHardModeWin()` |
| H7 | `teamFull` snapshot goes stale between events | Architect | Read store at guard-evaluation time, not from context |
| H8 | `runBattle` actor mutates Zustand inside fromPromise | Architect | Return data from actor, mutate in `onDone` action |
| H9 | Shallow copy lets Ditto mutate original team | Engine | Deep-copy `baseStats`, `types` arrays |

### MEDIUM (fix in Phase 1, lower priority)

| # | Finding | Sources | Fix |
|---|---------|---------|-----|
| M1 | `choices` union type untagged | Architect | Add discriminated `{ kind, list }` wrapper |
| M2 | No per-key corrupt-data recovery in persistence | Architect | Parse each localStorage key independently |
| M3 | No PokeAPI error handling in machine | Designer | Add `fetchError` state with retry |
| M4 | Build deps in wrong package.json section | Architect | Move tailwind/shadcn to devDeps |
| M5 | MAX_ROUNDS stalemate misleading message | Engine | Log "Stalemate" not "Defeat" |
| M6 | Zero accessibility tasks | Designer | Add a11y pass: aria-labels, keyboard nav, live regions |

### LOW (Phase 2 or later)

| # | Finding | Sources | Fix |
|---|---------|---------|-----|
| L1 | React re-render risk with `useMachine()` at App level | Architect | Use `createActor()` + `useSelector()` |
| L2 | Roguelike identity is thin — no item synergies | Designer | Add synergy tooltips, consider daily seeds |
| L3 | Difficulty spike at Koga (Gym 5) | Designer | Adjust levels or add guaranteed Pokecenter |
| L4 | Sound design missing | Designer | Spec `useSfx` hook, implement Phase 2 |
| L5 | Question mark 23% shiny rate very generous | Engine | Validate against design intent |

## Impact on Plan

The current plan needs these additions:
1. **New Task 0: Fix game-breaking bugs** (C1, H1-H5, H6-H9) — before any testing
2. **Task 4 scope increase:** Machine rewrite must delete dead files, fix Elite Four flow, clean actor pattern
3. **New Task after tests: Battle playback MVP** (C3) — `useBattlePlayback` hook
4. **New Task: Accessibility pass** (M6)
5. **Test additions:** Elite Four sequencing, DAG reachability, Magikarp Struggle, evolution during E4
