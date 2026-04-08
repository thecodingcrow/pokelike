# Phase 1 Revised: Fix Bugs, Modularize, Test, Battle Playback

> **For agentic workers:** Use local agents (Agent tool), phases-and-batches model. Sonnet for coding, opus for review. TDD for all engine/battle/evolution code.

**Goal:** Fix all game-breaking bugs found by 3 opus reviewers, modularize oversized files, achieve comprehensive test coverage for core systems, and build the battle animation playback MVP.

**Architecture:** Fix-first (bugs block everything), then modularize, then TDD the systems, then build battle playback. XState machine gets a clean rewrite with dead code deleted. Battle system gets split + bug fixes. Stores get missing logic.

**Tech Stack:** Vite, React 19, TypeScript 6, XState 5.30, Zustand 5, Vitest, Tailwind 4, shadcn/ui

---

## Phase 1: Critical Bug Fixes + Infrastructure
**Quality gate:** `pnpm exec tsc -b` = 0 errors, `pnpm test` passes, `pnpm build` succeeds

### Batch 1A — Vitest + Store Fixes (1 sonnet coder + 1 opus reviewer)

**Sonnet coder tasks:**

1. Install vitest: `pnpm add -D vitest`, create `vitest.config.ts` with `@` alias, add `test`/`test:watch` scripts
2. Fix `gameStore.ts`:
   - `startMap(mapIndex)` must call `generateMap(mapIndex)` and set `map` state
   - `advanceNode(nodeId)` must call `advanceFromNode(map, nodeId)` and update `map` state
   - Remove unused `_get` param — just use `create<GameStore>((set) => ({...}))`
3. Fix `persistenceStore.ts`: use `createJSONStorage(() => legacyStorage)` with `StateStorage` interface. Parse each localStorage key independently for corrupt-data resilience.
4. Move `tailwindcss`, `@tailwindcss/vite`, `shadcn`, `tw-animate-css` to devDependencies

**Opus reviewer checks:** Store methods actually call map generation, DAG advancement works, persistence doesn't crash on corrupt data, build still passes.

---

### Batch 1B — Battle System Bug Fixes with TDD (1 sonnet coder + 1 opus reviewer)

**Sonnet coder tasks (TDD — write failing test first, then fix):**

1. **Test + fix: `calcDamage` uses `move.isSpecial`** — Write test that creates a physical Pokemon using a special move, assert correct stat is used. Fix `battle.ts` to use `move.isSpecial` instead of re-deriving from base stats.

2. **Test + fix: Air Balloon checks defender** — Write test: defender has Air Balloon, attacker uses Ground move, assert damage = 0. Fix: check `defItems` not `attackerItems`.

3. **Test + fix: Ditto deep copy + moveTier** — Write test: Ditto transforms, original team's baseStats unchanged. Write test: transformed Ditto uses target's moveTier. Fix: deep-copy `baseStats`/`types`, copy `moveTier`.

4. **Test + fix: Struggle fallback** — Write test: Magikarp (noDamage only) vs Abra (noDamage only), assert battle doesn't infinite loop, both use Struggle.

5. **Test + fix: MAX_ROUNDS message** — Write test: 300-round stalemate produces "Stalemate" not "Defeat".

All tests go in `src/systems/__tests__/battle-bugs.test.ts`.

**Opus reviewer checks:** Each bug has a failing test before the fix, all tests green after, no regressions, damage formula matches game-design.md spec.

---

**Phase 1 Quality Gate:**
```bash
pnpm exec tsc -b        # 0 errors
pnpm test               # all green
pnpm build              # success
```

---

## Phase 2: Machine Rewrite + Battle Split
**Quality gate:** Same as Phase 1 + no file over 350 LOC (except static data)

### Batch 2A — Split battle.ts + Machine Cleanup (1 sonnet coder + 1 opus reviewer)

**Sonnet coder tasks:**

1. **Split `battle.ts` (540 LOC) into 3 files:**
   - `battle-calc.ts` (~150 LOC): `calcDamage`, `getEffectiveStat`, `getMove`, `calcHp`, helpers
   - `battle-engine.ts` (~280 LOC): `runBattle` only, imports from battle-calc
   - `battle-levels.ts` (~80 LOC): `applyLevelGain`
   - Keep `battle.ts` as a barrel re-exporting everything for backward compat

2. **Delete dead files:** `src/machines/guards.ts`, `src/machines/actions.ts` (both are dead code per architect review)

3. **Rewrite `src/machines/gameMachine.ts`** (~300 LOC target):
   - All guards inline in `setup()` with explicit `{ context }: { context: MachineContext }` types
   - All store interactions via top-level ES imports (NO `require()`)
   - Use `fromPromise()` for all actors
   - Actors return data only — side effects in `onDone` actions
   - `teamFull` read from store at guard time, not cached in context
   - Use `usePersistenceStore.getState().hasHardModeWin()` not raw localStorage
   - Fix Elite Four flow: add `isEliteFourNotComplete` guard → `transition` state
   - Add `fetchError` state for PokeAPI failures with retry
   - Tag `choices` as `{ kind: 'pokemon' | 'item'; list: ... }`

4. **Update `src/machines/index.ts`** — just re-export machine + types

**Opus reviewer checks:** No dead code files remain, machine < 350 LOC, Elite Four flow is correct (trace: boss win → transition → next E4 battle → ... → win), no `require()`, no direct localStorage reads, actors are pure.

---

### Batch 2B — Comprehensive System Tests (1 sonnet coder + 1 opus reviewer)

**Sonnet coder tasks (all TDD):**

1. **`battle-calc.test.ts`** — damage formula, STAB, type effectiveness (2x, 0.5x, 0x, 4x dual), crits, item multipliers (Choice Band, Life Orb, Expert Belt, type boosters, Eviolite, Assault Vest)

2. **`battle-engine.test.ts`** — full auto-battle: 1v1, 3v3, speed ordering, Ditto, Leftovers healing, Life Orb recoil, Rocky Helmet, Shell Bell, Focus Band survival, item interactions

3. **`map.test.ts`** — DAG structure (23 nodes, 9 layers), node types, advancement (locks siblings, unlocks children), reachability guarantee (player can never get stuck), question mark resolution

4. **`evolution.test.ts`** — level thresholds, HP ratio preservation, held item preservation, shiny preservation, Eevee skip, multi-stage chains (mock PokeAPI)

5. **`battle-levels.test.ts`** — XP distribution, Lucky Egg bonus, level 100 cap, HP scaling, hard mode reduction

**Opus reviewer checks:** Tests cover all HIGH/CRITICAL bugs found in reviews, edge cases for Struggle fallback, Air Balloon, Ditto, Elite Four sequencing are present, no test depends on global state.

---

**Phase 2 Quality Gate:**
```bash
pnpm exec tsc -b                    # 0 errors
pnpm test                           # all green
pnpm build                          # success
find src -name "*.ts" -not -path "*/data/*" | xargs wc -l | awk '$1 > 350'  # no output
grep -r "require(" src/             # no output
```

---

## Phase 3: Battle Playback MVP
**Quality gate:** Battle screen renders, animations play, Skip works

### Batch 3A — Battle Playback Hook + Components (1 sonnet coder + 1 opus reviewer)

**Sonnet coder tasks:**

1. **`src/hooks/useBattlePlayback.ts`** — Steps through `detailedLog` entries sequentially:
   - `attack` events: trigger HP drain animation + damage shake CSS class + type flash
   - `send_out` events: add `active-pokemon` class
   - `faint` events: add `fainted` class + fade
   - `effect` events: HP change animation (Leftovers heal, Life Orb recoil)
   - `result` events: show win/loss
   - `speedMultiplier` state (1x normal, 3x skip)
   - `sleep(ms)` utility that respects speed multiplier
   - Returns `{ currentEvent, playerTeam, enemyTeam, isPlaying, skip, isComplete }`

2. **`src/components/battle/HpBar.tsx`** — HP bar with `steps(8)` animation:
   - Props: `current`, `max`, `animated`
   - Color: green > 50%, orange > 20%, red <= 20%
   - Blink animation at <= 20%
   - Uses design system `hp-bar-container` / `hp-bar-fill` classes

3. **`src/components/battle/BattleField.tsx`** — Layout for battle view:
   - Enemy sprite area (top-left) + enemy info panel (top-right)
   - Player sprite area (bottom-right) + player info panel (bottom-left)
   - Dialogue box (bottom 25%)
   - Skip / Continue buttons

4. **`src/components/battle/BattleLog.tsx`** — Typewriter text display:
   - `aria-live="polite"` for screen readers
   - 40ms/char typewriter reveal
   - Blinking `▼` advance cursor

5. **Integrate with XState:** Wire `battle.animating` state to `useBattlePlayback`. When playback completes, send `BATTLE_COMPLETE` event to machine.

**Opus reviewer checks:** HP drain uses `steps(8)` not smooth easing, speed multiplier works, aria-live region present, playback completes and transitions machine correctly, no canvas needed for MVP (CSS-only animations).

---

**Phase 3 Quality Gate:**
```bash
pnpm exec tsc -b        # 0 errors
pnpm test               # all green
pnpm build              # success
# Manual: `pnpm dev` → start game → reach battle → animations play → skip works
```

---

## Summary

| Phase | Batches | Agents | Focus |
|-------|---------|--------|-------|
| 1 | 2 | 2 sonnet + 2 opus | Bug fixes + infrastructure |
| 2 | 2 | 2 sonnet + 2 opus | Modularize + comprehensive tests |
| 3 | 1 | 1 sonnet + 1 opus | Battle playback MVP |
| **Total** | **5** | **5 sonnet + 5 opus** | |

### Review findings addressed:
- C1 Elite Four flow → Phase 2 Batch 2A
- C2 Dead code → Phase 2 Batch 2A
- C3 No battle playback → Phase 3
- H1-H2 Map generation/advancement → Phase 1 Batch 1A
- H3-H5 Battle calc bugs → Phase 1 Batch 1B
- H6-H8 Machine issues → Phase 2 Batch 2A
- H9 Shallow copy → Phase 1 Batch 1B
- M1-M6 Various → Addressed across phases
