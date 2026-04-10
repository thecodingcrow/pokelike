# Game Engine Test Suite — Implementation Plan

> **Spec:** `.planning/specs/2026-04-10-game-engine-tests.md`
> **Execution model:** Phases and batches. Sonnet for coding, opus for review.

---

## Phase 1: Test Helpers + Store Tests (foundation)

### Batch 1a: Test helpers + gameStore tests
**1 sonnet coder + 1 opus reviewer**

**Task 1: Extend test helpers**
- File: `src-app/src/systems/__tests__/test-helpers.ts`
- Add `makeMapNode(overrides)` factory
- Add `makeMap(config)` factory — builds GeneratedMap with nodes dict, edges, layers, accessible flags
- Add `resetAllStores()` — resets gameStore, persistenceStore, uiStore to initial state

**Task 2: gameStore unit tests**
- Create: `src-app/src/store/__tests__/gameStore.test.ts`
- Tests for: resetRun, startMap, advanceNode, healTeam, addToTeam, swapTeamMember, equipItem, incrementBadges
- Use `resetAllStores()` in beforeEach

### Batch 1b: persistenceStore + uiStore tests
**1 sonnet coder + 1 opus reviewer**

**Task 3: persistenceStore tests**
- Create: `src-app/src/store/__tests__/persistenceStore.test.ts`
- Tests for: markSeen, markCaught, markShinyCaught, unlockAchievement, saveHallOfFame

**Task 4: uiStore tests**
- Create: `src-app/src/store/__tests__/uiStore.test.ts`
- Tests for: openModal/closeModal, showNotification

**Quality gate:** `pnpm test` — all old + new tests pass

---

## Phase 2: State Machine Integration Tests

### Batch 2a: Machine test infrastructure + core flows
**1 sonnet coder + 1 opus reviewer**

**Task 5: createTestMachine helper + game start flow tests**
- Add `createTestMachine(actorOverrides?)` to test-helpers — creates XState machine with mocked fromPromise actors returning deterministic data
- Create: `src-app/src/machines/__tests__/gameMachine.test.ts`
- Tests 1-4: title→trainer→starter→map, catch(not full)→map, catch(full)→swap→map, catch(skip)→map

**Task 6: Battle + boss + heal + item flows**
- Same test file, add tests 5-10: battle→win→map, battle→lose→gameOver, boss→badge→nextMap, pokecenter→map, item(pick)→map, item(skip)→map

### Batch 2b: Remaining flows
**1 sonnet coder + 1 opus reviewer**

**Task 7: Trade, shiny, move_tutor, elite four, restarts**
- Tests 11-19: trade→shiny, shiny(full)→swap, move_tutor, elite four win, elite four lose, question mark dispatch, gameOver→restart, win→restart, global modals

**Quality gate:** `pnpm test` — all tests pass

---

## Phase 3: Full Playthrough Simulation

### Single batch
**1 sonnet coder + 1 opus reviewer**

**Task 8: Playthrough test**
- Create: `src-app/src/machines/__tests__/playthrough.test.ts`
- Simulates complete run: title → trainer → starter → 8 maps (visit nodes, beat gym) → elite four → win
- Asserts: 8 badges, hall of fame saved, win state reached
- Uses same mocked actors

**Quality gate:** `pnpm test` — all tests pass, total runtime < 5s

---

## Summary

| Phase | Tasks | Agents |
|-------|-------|--------|
| 1 | 1-4 (helpers + stores) | 2 sonnet + 2 opus |
| 2 | 5-7 (state machine) | 2 sonnet + 2 opus |
| 3 | 8 (playthrough) | 1 sonnet + 1 opus |
| **Total** | **8 tasks** | **5 sonnet + 5 opus** |
