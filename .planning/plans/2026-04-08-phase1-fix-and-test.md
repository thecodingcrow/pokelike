# Phase 1: Fix, Modularize, and Test Core Systems

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the existing Phase 1 code to zero TS errors, split oversized files, add vitest with comprehensive tests for battle/map/evolution systems, and establish the XState game machine properly.

**Architecture:** Fix-first, then modularize, then test. The game machine (935 LOC) gets rewritten as a minimal skeleton with `fromPromise()` actors. Battle system (540 LOC) gets split into calc + engine + level-gain. PersistenceStore gets a simplified storage adapter. All pure systems get vitest coverage.

**Tech Stack:** Vite, React 19, TypeScript 6, XState 5.30, Zustand 5, Vitest, Tailwind 4, shadcn/ui

---

## File Structure

### Files to create
```
src/machines/gameMachine.ts       — REWRITE (935→~250 LOC skeleton)
src/machines/services.ts          — NEW (~120 LOC) invoked promise actors
src/machines/guards.ts            — REWRITE (~60 LOC) inline guard fns
src/machines/actions.ts           — REWRITE (~80 LOC) zustand-delegating actions
src/systems/battle-calc.ts        — NEW (~120 LOC) extracted from battle.ts
src/systems/battle-engine.ts      — RENAME battle.ts (~300 LOC) core runBattle
src/systems/battle-levels.ts      — NEW (~80 LOC) extracted applyLevelGain
vitest.config.ts                  — NEW
src/systems/__tests__/battle-calc.test.ts
src/systems/__tests__/battle-engine.test.ts
src/systems/__tests__/battle-levels.test.ts
src/systems/__tests__/map.test.ts
src/systems/__tests__/evolution.test.ts
src/systems/__tests__/pokeapi.test.ts
```

### Files to modify
```
src/store/persistenceStore.ts     — Fix storage adapter types
src/store/gameStore.ts            — Remove unused `get` param
src/types/pokemon.ts              — Already has _transformed (done)
src/types/map.ts                  — Already has NodeWeightRow (done)
src/types/index.ts                — Already re-exports NodeWeightRow (done)
package.json                      — Add vitest
tsconfig.app.json                 — Ensure strict mode
```

### Files to delete
```
src/machines/index.ts             — Will be recreated with new exports
```

---

### Task 1: Install vitest and configure

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install vitest**

```bash
cd /Users/thedoc/DEV/personal/pokelike/src-app
pnpm add -D vitest
```

- [ ] **Step 2: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Add test script to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs (no tests yet)**

```bash
pnpm test
```
Expected: "No test files found" or similar — confirms config works.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml
git commit -m "chore: add vitest test infrastructure"
```

---

### Task 2: Fix persistenceStore storage adapter

**Files:**
- Modify: `src/store/persistenceStore.ts`

- [ ] **Step 1: Read the current file**

Read `src/store/persistenceStore.ts` fully.

- [ ] **Step 2: Fix the storage adapter**

The Zustand v5 `persist` middleware with a custom storage needs `createJSONStorage` with a `StateStorage` adapter, NOT a raw object with `getItem`/`setItem`.

Replace the `storage` and `partialize` config with:

```typescript
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// Custom StateStorage that splits across legacy localStorage keys
const legacyStorage: StateStorage = {
  getItem: (_name: string): string | null => {
    try {
      const state = {
        pokedex: JSON.parse(localStorage.getItem('poke_dex') || '{}'),
        shinydex: JSON.parse(localStorage.getItem('poke_shiny_dex') || '{}'),
        achievements: JSON.parse(localStorage.getItem('poke_achievements') || '[]'),
        hallOfFame: JSON.parse(localStorage.getItem('poke_hall_of_fame') || '[]'),
        eliteWins: parseInt(localStorage.getItem('poke_elite_wins') || '0', 10),
        settings: { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem('poke_settings') || 'null') ?? {}) },
      };
      return JSON.stringify({ state, version: 0 });
    } catch {
      return null;
    }
  },
  setItem: (_name: string, value: string): void => {
    try {
      const { state: s } = JSON.parse(value);
      localStorage.setItem('poke_dex', JSON.stringify(s.pokedex));
      localStorage.setItem('poke_shiny_dex', JSON.stringify(s.shinydex));
      localStorage.setItem('poke_achievements', JSON.stringify(s.achievements));
      localStorage.setItem('poke_hall_of_fame', JSON.stringify(s.hallOfFame));
      localStorage.setItem('poke_elite_wins', String(s.eliteWins));
      localStorage.setItem('poke_settings', JSON.stringify(s.settings));
    } catch { /* storage full or unavailable */ }
  },
  removeItem: (_name: string): void => {
    ['poke_dex', 'poke_shiny_dex', 'poke_achievements',
     'poke_hall_of_fame', 'poke_elite_wins', 'poke_settings'].forEach(k =>
      localStorage.removeItem(k)
    );
  },
};
```

Then use it in the persist call:
```typescript
persist(
  (set, get) => ({ /* ...store... */ }),
  {
    name: 'pokelike-persistence',
    storage: createJSONStorage(() => legacyStorage),
    partialize: (s) => ({
      pokedex: s.pokedex,
      shinydex: s.shinydex,
      achievements: s.achievements,
      hallOfFame: s.hallOfFame,
      eliteWins: s.eliteWins,
      settings: s.settings,
    }) as unknown as PersistenceStore,
  }
)
```

- [ ] **Step 3: Remove any unused imports** (e.g. `PersistStorage`, `StorageValue`, `PersistedState`)

- [ ] **Step 4: Fix gameStore.ts** — remove unused `get` parameter on line 73

- [ ] **Step 5: Verify**

```bash
pnpm exec tsc -b 2>&1 | grep -c "persistenceStore\|gameStore"
```
Expected: 0

- [ ] **Step 6: Commit**

```bash
git add src/store/persistenceStore.ts src/store/gameStore.ts
git commit -m "fix: persistenceStore storage adapter types, remove unused gameStore param"
```

---

### Task 3: Split battle.ts into focused modules

**Files:**
- Create: `src/systems/battle-calc.ts`, `src/systems/battle-levels.ts`
- Modify: `src/systems/battle.ts` (rename to battle-engine.ts conceptually, but keep filename for now and re-export)

- [ ] **Step 1: Read `src/systems/battle.ts` fully**

- [ ] **Step 2: Create `src/systems/battle-calc.ts`**

Extract these pure functions:
- `getEffectiveStat(pokemon, stat, items, attackerTeam)` 
- `calcDamage(attacker, defender, move, attackerItems, defItems, attackerTeam)`
- `getMove(pokemon)` 
- All helper functions they depend on: `hasItem`, `getTypeBoostItem`, `getTypeEffectiveness`, `calcHp`

Add the missing `PokemonType` import. This file should be ~150 LOC.

- [ ] **Step 3: Create `src/systems/battle-levels.ts`**

Extract:
- `applyLevelGain(team, baseGain, participantIdxs, bagItems, isWild, hardMode)`

This file should be ~80 LOC.

- [ ] **Step 4: Slim down `src/systems/battle.ts`**

Keep only `runBattle()`. Import `calcDamage`, `getMove`, `getEffectiveStat`, `calcHp` from `./battle-calc`. Import `applyLevelGain` from `./battle-levels`. Re-export everything for backward compat:

```typescript
export { getEffectiveStat, calcDamage, getMove } from './battle-calc';
export { applyLevelGain } from './battle-levels';
```

Prefix unused `_bagItems` and `_enemyItems` params in `runBattle`.

- [ ] **Step 5: Verify**

```bash
pnpm exec tsc -b 2>&1 | grep -c "battle"
```
Expected: 0

- [ ] **Step 6: Commit**

```bash
git add src/systems/battle-calc.ts src/systems/battle-levels.ts src/systems/battle.ts
git commit -m "refactor: split battle.ts into calc, engine, and level-gain modules"
```

---

### Task 4: Rewrite XState game machine (skeleton)

**Files:**
- Rewrite: `src/machines/gameMachine.ts` (~250 LOC)
- Create: `src/machines/services.ts` (~120 LOC)
- Rewrite: `src/machines/guards.ts` (~60 LOC)
- Rewrite: `src/machines/actions.ts` (~80 LOC)
- Rewrite: `src/machines/index.ts`

- [ ] **Step 1: Read current files to understand intent**

Read all 4 files in `src/machines/`. Understand what the machine is trying to do, then rewrite cleanly.

- [ ] **Step 2: Write `src/machines/guards.ts`**

All guards are simple context checks. No imports from other machine files. No `require()`.

```typescript
import type { MachineContext } from './gameMachine';

type GuardArgs = { context: MachineContext };

export const isBattleNode = ({ context }: GuardArgs) =>
  context.currentNodeType === 'battle' || context.currentNodeType === 'trainer';
export const isCatchNode = ({ context }: GuardArgs) =>
  context.currentNodeType === 'catch' || context.currentNodeType === 'legendary';
export const isItemNode = ({ context }: GuardArgs) =>
  context.currentNodeType === 'item' || context.currentNodeType === 'mega';
export const isTradeNode = ({ context }: GuardArgs) =>
  context.currentNodeType === 'trade';
export const isShinyNode = ({ context }: GuardArgs) =>
  context.currentNodeType === 'shiny';
export const isPokecenter = ({ context }: GuardArgs) =>
  context.currentNodeType === 'pokecenter';
export const isMoveTutor = ({ context }: GuardArgs) =>
  context.currentNodeType === 'move_tutor';
export const isBossNode = ({ context }: GuardArgs) =>
  context.currentNodeType === 'boss';
export const playerLost = ({ context }: GuardArgs) =>
  context.battleResult !== null && !context.battleResult.playerWon;
export const isBossBattle = ({ context }: GuardArgs) =>
  context.isBoss;
export const isEliteFourComplete = ({ context }: GuardArgs) =>
  !!(context.battleResult as any)?.eliteComplete;
export const teamIsFull = ({ context }: GuardArgs) =>
  context.teamFull;
```

- [ ] **Step 3: Write `src/machines/actions.ts`**

All actions use top-level ES imports. No `require()`. Read actual store method names from the audit:
- gameStore: `setTrainer`, `setTeam`, `addToTeam`, `swapTeamMember`, `setItems`, `addItem`, `removeItem`, `equipItem`, `incrementBadges`, `setEliteIndex`, `setStarterSpeciesId`, `startMap`, `advanceNode`, `healTeam`, `resetRun`
- persistenceStore: `markSeen`, `markCaught`, `markShinyCaught`, `unlockAchievement`, `saveHallOfFame`, `incrementEliteWins`, `updateSettings`
- uiStore: `openModal`, `closeModal`, `showNotification`

```typescript
import { useGameStore } from '@/store/gameStore';
import { usePersistenceStore } from '@/store/persistenceStore';
import { useUIStore } from '@/store/uiStore';

export function resetRunAction(hardMode: boolean) {
  useGameStore.getState().resetRun(hardMode);
}

export function setTrainerAction(trainer: 'boy' | 'girl') {
  useGameStore.getState().setTrainer(trainer);
}

export function healTeamAction() {
  useGameStore.getState().healTeam();
}

export function addBadgeAction() {
  useGameStore.getState().incrementBadges();
}

export function advanceNodeAction(nodeId: string) {
  useGameStore.getState().advanceNode(nodeId);
}

// ... etc for each needed action
```

- [ ] **Step 4: Write `src/machines/services.ts`**

Use `fromPromise()` from XState for invoked actors:

```typescript
import { fromPromise } from 'xstate';
import { createInstanceById } from '@/systems/pokeapi';
import type { PokemonInstance } from '@/types';

export const fetchStarters = fromPromise<PokemonInstance[]>(async () => {
  const ids = [1, 4, 7]; // Bulbasaur, Charmander, Squirtle
  const starters = await Promise.all(
    ids.map(id => createInstanceById(id, 5, 0))
  );
  return starters.filter((s): s is PokemonInstance => s !== null);
});
```

- [ ] **Step 5: Write `src/machines/gameMachine.ts` (skeleton)**

Clean rewrite using `setup()` API. ~250 LOC max. All guards inline or referenced from guards.ts. All actors use `fromPromise()`. No `require()`. No implicit `any`.

The machine has these states: `title`, `trainerSelect`, `starterSelect`, `map`, `nodeDispatch` (transient), `battle` (compound: computing/animating/result), `catch`, `item`, `swap`, `trade`, `shiny`, `badge`, `transition`, `gameOver`, `win`.

Context holds only: `battleResult`, `choices`, `currentNodeType`, `currentNode`, `isBoss`, `isEliteFour`, `teamFull`, `battleTitle`, `battleSubtitle`, `transitionMsg`, `transitionSub`.

- [ ] **Step 6: Write `src/machines/index.ts`**

```typescript
export { gameMachine } from './gameMachine';
export type { MachineContext, MachineEvents } from './gameMachine';
```

- [ ] **Step 7: Verify zero TS errors**

```bash
pnpm exec tsc -b 2>&1
```
Expected: clean (exit 0)

- [ ] **Step 8: Commit**

```bash
git add src/machines/
git commit -m "refactor: rewrite XState game machine — modular, no require(), typed"
```

---

### Task 5: Test battle-calc (damage formula, type effectiveness, moves)

**Files:**
- Create: `src/systems/__tests__/battle-calc.test.ts`

- [ ] **Step 1: Write tests for `getTypeEffectiveness`**

```typescript
import { describe, it, expect } from 'vitest';
import { calcDamage, getEffectiveStat, getMove } from '../battle-calc';
// ... test helper to create a mock PokemonInstance

describe('calcDamage', () => {
  it('applies STAB bonus (1.5x) when attacker type matches move type', () => { /* ... */ });
  it('applies super-effective 2x multiplier', () => { /* ... */ });
  it('applies not-very-effective 0.5x multiplier', () => { /* ... */ });
  it('applies immunity (0x) for Normal vs Ghost', () => { /* ... */ });
  it('applies dual-type multiplier (4x for Electric vs Water/Flying)', () => { /* ... */ });
  it('floors damage to minimum 1 (except immunity)', () => { /* ... */ });
  it('applies crit multiplier when crit flag is set', () => { /* ... */ });
});

describe('getEffectiveStat', () => {
  it('scales base stat by level: floor(baseStat * level / 50) + 5', () => { /* ... */ });
  it('applies Choice Band +40% physical damage', () => { /* ... */ });
  it('applies Eviolite +50% def/spdef for unevolved Pokemon', () => { /* ... */ });
});

describe('getMove', () => {
  it('returns type-matched move for single-type Pokemon', () => { /* ... */ });
  it('skips Normal type for dual-type Pokemon', () => { /* ... */ });
  it('returns Tackle as fallback', () => { /* ... */ });
  it('respects moveTier (0=weak, 1=standard, 2=powerful)', () => { /* ... */ });
  it('selects special move when special >= atk', () => { /* ... */ });
});
```

Each test must have complete code — create a `makePokemon()` helper factory at the top of the file.

- [ ] **Step 2: Run tests**

```bash
pnpm test src/systems/__tests__/battle-calc.test.ts
```

- [ ] **Step 3: Fix any failing tests or impl bugs found**

- [ ] **Step 4: Commit**

```bash
git add src/systems/__tests__/battle-calc.test.ts
git commit -m "test: battle calc — damage formula, type effectiveness, move selection"
```

---

### Task 6: Test battle-engine (full auto-battle)

**Files:**
- Create: `src/systems/__tests__/battle-engine.test.ts`

- [ ] **Step 1: Write tests for `runBattle`**

```typescript
describe('runBattle', () => {
  it('returns playerWon=true when player team wins', () => { /* ... */ });
  it('returns playerWon=false when enemy team wins', () => { /* ... */ });
  it('produces detailedLog entries for each attack', () => { /* ... */ });
  it('handles Ditto transformation', () => { /* ... */ });
  it('respects speed ordering (faster attacks first)', () => { /* ... */ });
  it('handles multi-Pokemon teams (3v3)', () => { /* ... */ });
  it('caps at 300 rounds', () => { /* ... */ });
  it('applies Leftovers end-of-round healing', () => { /* ... */ });
  it('applies Life Orb recoil', () => { /* ... */ });
  it('applies Rocky Helmet damage', () => { /* ... */ });
  it('applies Focus Band survival (seeded random)', () => { /* ... */ });
  it('handles Air Balloon Ground immunity', () => { /* ... */ });
});
```

- [ ] **Step 2: Run and verify**

```bash
pnpm test src/systems/__tests__/battle-engine.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/battle-engine.test.ts
git commit -m "test: battle engine — auto-battle, items, Ditto, edge cases"
```

---

### Task 7: Test map generation

**Files:**
- Create: `src/systems/__tests__/map.test.ts`

- [ ] **Step 1: Write tests**

```typescript
describe('generateMap', () => {
  it('produces exactly 23 nodes across 9 layers', () => { /* ... */ });
  it('layer 0 is always start node', () => { /* ... */ });
  it('layer 1 is always catch + battle', () => { /* ... */ });
  it('last layer is always boss', () => { /* ... */ });
  it('generates edges connecting adjacent layers', () => { /* ... */ });
  it('all content nodes have valid NodeType', () => { /* ... */ });
});

describe('advanceFromNode', () => {
  it('marks visited node as visited', () => { /* ... */ });
  it('locks sibling nodes in same layer', () => { /* ... */ });
  it('unlocks children in next layer', () => { /* ... */ });
});

describe('resolveQuestionNode', () => {
  it('returns a valid non-question NodeType', () => { /* ... */ });
  it('never returns start, boss, or question', () => { /* ... */ });
});

describe('getAccessibleNodes', () => {
  it('returns only accessible + unvisited nodes', () => { /* ... */ });
});
```

- [ ] **Step 2: Run and verify**

```bash
pnpm test src/systems/__tests__/map.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/map.test.ts
git commit -m "test: map generation — DAG structure, node types, advancement"
```

---

### Task 8: Test evolution system

**Files:**
- Create: `src/systems/__tests__/evolution.test.ts`

- [ ] **Step 1: Write tests**

```typescript
describe('checkAndEvolveTeam', () => {
  it('evolves Charmander at level 16 to Charmeleon', () => { /* ... */ });
  it('does not evolve below threshold level', () => { /* ... */ });
  it('skips Eevee (id 133) — handled by UI modal', () => { /* ... */ });
  it('handles multi-stage chains (Caterpie→Metapod→Butterfree)', () => { /* ... */ });
  it('preserves HP ratio across evolution', () => { /* ... */ });
  it('preserves held item across evolution', () => { /* ... */ });
  it('preserves shiny status across evolution', () => { /* ... */ });
});
```

Note: `applyEvolution` calls PokeAPI — mock `fetchPokemonById` for these tests.

- [ ] **Step 2: Run and verify**

```bash
pnpm test src/systems/__tests__/evolution.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/evolution.test.ts
git commit -m "test: evolution system — level thresholds, HP preservation, Eevee skip"
```

---

### Task 9: Test level gain system

**Files:**
- Create: `src/systems/__tests__/battle-levels.test.ts`

- [ ] **Step 1: Write tests**

```typescript
describe('applyLevelGain', () => {
  it('adds baseGain levels to participants', () => { /* ... */ });
  it('caps at level 100', () => { /* ... */ });
  it('applies Lucky Egg +1 bonus for wild battles', () => { /* ... */ });
  it('scales HP proportionally on level-up', () => { /* ... */ });
  it('returns LevelUpEvent for each leveled Pokemon', () => { /* ... */ });
  it('hard mode reduces trainer gain to +1', () => { /* ... */ });
});
```

- [ ] **Step 2: Run and verify**

```bash
pnpm test src/systems/__tests__/battle-levels.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/battle-levels.test.ts
git commit -m "test: level gain — XP distribution, Lucky Egg, hard mode"
```

---

### Task 10: Full build verification and cleanup

- [ ] **Step 1: Run full type check**

```bash
pnpm exec tsc -b 2>&1
```
Expected: exit 0, no errors

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```
Expected: all pass

- [ ] **Step 3: Run build**

```bash
pnpm build
```
Expected: successful Vite build

- [ ] **Step 4: Clean up any remaining Vite template files**

Delete: `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`

Update `src/App.tsx` to a minimal shell:
```tsx
export default function App() {
  return <div id="game" className="min-h-dvh bg-game-bg">Pokelike</div>;
}
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: phase 1 complete — zero TS errors, all tests passing, clean build"
```

---

## Quality Gates

After all tasks complete:
- `pnpm exec tsc -b` → 0 errors
- `pnpm test` → all tests green
- `pnpm build` → successful
- No files over 300 LOC (except data files which are static constants)
- No `require()` calls anywhere in `src/`
- No implicit `any` types
