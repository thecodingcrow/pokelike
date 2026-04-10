# Game Engine End-to-End Test Suite

> Spec for comprehensive test coverage of the Pokelike game engine: XState state machine, Zustand stores, and full playthrough simulation.

## Goal

Catch bugs like the `advanceCurrentNodeAction` regression (reading stale Zustand state instead of XState context) before they ship. Provide a safety net for refactoring the game engine.

## Test Framework

Vitest (already configured). Node environment. No DOM needed — all game logic is headless.

## Architecture

### Layer 1: Store Unit Tests

Test each Zustand store in isolation. Reset store state between tests.

**`gameStore.test.ts`:**
- `resetRun` — zeroes all state, sets hardMode flag
- `startMap` — sets currentMap, generates map, clears currentNode
- `advanceNode` — deep-clones map, marks node visited, updates accessible flags, sets currentNode
- `healTeam` — all team members currentHp = maxHp
- `addToTeam` — appends pokemon, respects maxTeamSize
- `swapTeamMember` — replaces at index, validates bounds
- `equipItem` — removes from bag, sets heldItem on pokemon
- `incrementBadges` — badges + 1

**`persistenceStore.test.ts`:**
- markSeen/markCaught/markShinyCaught
- unlockAchievement (all 17 achievement IDs)
- saveHallOfFame
- Settings persistence

**`uiStore.test.ts`:**
- openModal/closeModal cycle
- showNotification

### Layer 2: State Machine Integration Tests

Test XState machine with real Zustand stores but mocked async actors.

**Actor mocking strategy:**
Replace `fromPromise` actors with synchronous resolvers returning deterministic data. Each test creates a fresh machine instance via `createTestMachine(overrides)`.

**Test file: `gameMachine.test.ts`**

Transition tests (one per path through the state graph):

1. **Title → TrainerSelect → StarterSelect → Map** (game start flow)
2. **Map → catch → map** (team not full, pokemon caught, node advances)
3. **Map → catch → swap → map** (team full, catch + swap, node advances)
4. **Map → catch (skip) → map** (skip catch, node advances, no pokemon added)
5. **Map → battle → win → map** (normal battle, node advances)
6. **Map → battle → lose → gameOver** (player loses, game over screen)
7. **Map → boss battle → win → badge → next map** (gym leader, badge earned)
8. **Map → pokecenter → map** (instant heal, node advances)
9. **Map → item → pick → map** (item picked, node advances)
10. **Map → item (skip) → map** (skip item, node advances)
11. **Map → trade → accept → shiny → map** (trade flow into shiny)
12. **Map → shiny → catch (full) → swap → map** (shiny with full team)
13. **Map → move_tutor → map** (advances node, opens modal)
14. **Elite Four → win all 4 → win** (full elite four chain)
15. **Elite Four → lose → gameOver** (mid-chain loss)
16. **Question mark node dispatch** (resolves to valid type)
17. **GameOver → restart → title** (restart flow)
18. **Win → restart → title** (restart flow)
19. **Global: OPEN_MODAL / CLOSE_MODAL** in any state

**Each test verifies:**
- Machine reaches expected state
- Zustand store mutations occurred (team size, badges, node visited, etc.)
- Context fields updated correctly

### Layer 3: Full Playthrough Simulation

**Test file: `playthrough.test.ts`**

Single test that simulates a complete run:
- Start game, select trainer, pick starter
- For each of 8 maps + elite four:
  - Generate map
  - Visit accessible nodes (deterministic choices)
  - Complete gym/elite battles
- Assert: 8 badges, elite four complete, hall of fame saved, win state reached

Uses the same mocked actors as Layer 2. Verifies the entire progression chain.

## Test Helpers

**New file: `src/systems/__tests__/test-helpers.ts`** (extend existing)

```ts
// Existing
makePokemon(overrides): PokemonInstance
makeItem(id, name): Item

// New
makeMapNode(overrides): MapNode
makeMap(config): GeneratedMap  // builds nodes + edges + layers with proper accessible flags
createTestMachine(actorOverrides?): Actor  // XState machine with mocked actors
resetAllStores(): void  // reset gameStore + persistenceStore + uiStore between tests
```

## Quality Gates

- All existing 94+ tests continue to pass
- New tests run in < 5 seconds (no network, no DOM)
- Zero flaky tests (all deterministic via mocked actors)

## Out of Scope

- Visual/rendering tests (no jsdom needed)
- PokeAPI integration tests (external dependency)
- Performance benchmarks
