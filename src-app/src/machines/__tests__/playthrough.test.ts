/**
 * playthrough.test.ts — Full game playthrough simulation.
 *
 * Simulates a complete run from title screen to win screen, navigating all
 * 9 maps (0-7 with gym badges, map 8 = Elite Four x5) in sequence.
 *
 * All async actors are mocked. Fake timers handle the 2-second Elite Four
 * transition delays.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createActor, fromPromise, waitFor } from 'xstate';
import { gameMachine } from '@/machines/gameMachine';
import { useGameStore } from '@/store/gameStore';
import { usePersistenceStore } from '@/store/persistenceStore';
import { ELITE_4 } from '@/data/elite4';
import {
  makePokemon,
  resetAllStores,
} from '@/systems/__tests__/test-helpers';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Spin on microtasks until predicate passes (fake-timer safe — uses iteration
 * count instead of Date.now, which would be frozen by vi.useFakeTimers).
 */
function isInBattle(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'battle' in (value as object);
}

function isInBattleResult(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).battle === 'result'
  );
}

/**
 * Handle a single non-boss node interaction (click, resolve the resulting state,
 * and return to map). Returns when actor is back in the 'map' state.
 */
async function handleNonBossNode(
  actor: ReturnType<typeof createActor>,
  node: import('@/types').MapNode,
): Promise<void> {
  actor.send({ type: 'CLICK_NODE', node });
  await vi.advanceTimersByTimeAsync(10);

  const state = actor.getSnapshot().value;

  if (state === 'catch' || state === 'item' || state === 'trade' || state === 'shiny') {
    actor.send({ type: 'SKIP' });
    await vi.advanceTimersByTimeAsync(10);
  } else if (state === 'swap') {
    // Team was full — skip the swap too
    actor.send({ type: 'SKIP' });
    await vi.advanceTimersByTimeAsync(10);
  } else if (isInBattle(state)) {
    // Wait for computing → animating → result
    await waitFor(actor, (s) => isInBattleResult(s.value), { timeout: 5000 });
    actor.send({ type: 'CONTINUE' });
    await vi.advanceTimersByTimeAsync(10);
  }
  // pokecenter and move_tutor return to map instantly — no extra handling needed

  expect(actor.getSnapshot().value).toBe('map');
}

/**
 * Navigate a map layer-by-layer until the boss node is clicked and the badge
 * screen appears. Advances the game to the next map via CONTINUE.
 * Returns when actor is in 'map' state on the next map.
 */
async function navigateMapToBoss(
  actor: ReturnType<typeof createActor>,
): Promise<void> {
  let reachedBoss = false;

  while (!reachedBoss) {
    const accessible = Object.values(useGameStore.getState().map!.nodes).filter(
      (n) => n.accessible && !n.visited,
    );
    expect(accessible.length).toBeGreaterThan(0);

    const node = accessible[0];

    if (node.type === 'boss') {
      actor.send({ type: 'CLICK_NODE', node });

      // Wait for battle to resolve through computing → animating → result → badge
      await waitFor(actor, (s) => s.value === 'badge', { timeout: 5000 });

      reachedBoss = true;
    } else {
      await handleNonBossNode(actor, node);
    }
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('full playthrough', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('completes a full run from title to win screen', async () => {
    vi.useFakeTimers();

    try {
      // ── Create actor with context-aware mocks ───────────────────────────────

      /**
       * runBattle mock reads eliteIndex from the store at call time.
       * This is safe: advanceEliteIndexAction fires on entry to `transition`,
       * not during the battle itself — so the index is stable for the duration
       * of each battle invocation.
       *
       * ELITE_4 has 5 members (indices 0-4). The Champion (Gary) is at index 4.
       * eliteComplete = true only when eliteIndex >= 4 (the last member).
       */
      const actor = createActor(
        gameMachine.provide({
          actors: {
            fetchStarters: fromPromise(async () => [
              makePokemon({ speciesId: 1, name: 'Bulbasaur', level: 5 }),
              makePokemon({ speciesId: 4, name: 'Charmander', level: 5 }),
              makePokemon({ speciesId: 7, name: 'Squirtle', level: 5 }),
            ]),

            runBattle: fromPromise(async () => {
              const gs = useGameStore.getState();
              const isEliteFour = gs.currentMap === 8;
              const eliteComplete = isEliteFour && gs.eliteIndex >= ELITE_4.length - 1;
              return {
                playerWon: true,
                pTeam: gs.team,
                eTeam: [makePokemon({ currentHp: 0 })],
                playerParticipants: new Set([0]),
                detailedLog: [],
                eliteComplete,
                battleTitle: 'Battle',
                battleSubtitle: '',
              };
            }),

            playBattleAnimation: fromPromise(async () => {}),

            fetchCatchChoices: fromPromise(async () => [
              makePokemon({ speciesId: 25, name: 'Pikachu' }),
            ]),

            fetchItemChoices: fromPromise(async () => []),

            fetchTradeOffer: fromPromise(async () =>
              makePokemon({ name: 'TradeMon' }),
            ),

            fetchShinyPokemon: fromPromise(async () =>
              makePokemon({ name: 'ShinyMon', isShiny: true }),
            ),
          } as Parameters<typeof gameMachine.provide>[0]['actors'],
        }),
      ).start();

      // ── Step 1: Game start flow ─────────────────────────────────────────────

      expect(actor.getSnapshot().value).toBe('title');

      actor.send({ type: 'START_RUN' });
      expect(actor.getSnapshot().value).toBe('trainerSelect');

      actor.send({ type: 'SELECT_TRAINER', trainer: 'boy' });
      expect(actor.getSnapshot().value).toBe('starterSelect');

      const starter = makePokemon({ speciesId: 1, name: 'Bulbasaur', level: 5 });
      actor.send({ type: 'SELECT_STARTER', starter });

      // selectStarterAction calls startMap(0) synchronously — map state is immediate
      expect(actor.getSnapshot().value).toBe('map');
      expect(useGameStore.getState().currentMap).toBe(0);

      // ── Step 2: Maps 0-7 — navigate to boss, earn badge, advance ───────────

      for (let mapIdx = 0; mapIdx < 8; mapIdx++) {
        expect(useGameStore.getState().currentMap).toBe(mapIdx);

        await navigateMapToBoss(actor);

        // Badge screen — verify badge count and advance to next map
        expect(useGameStore.getState().badges).toBe(mapIdx + 1);
        actor.send({ type: 'CONTINUE' });
        await vi.advanceTimersByTimeAsync(10);

        expect(actor.getSnapshot().value).toBe('map');
        expect(useGameStore.getState().currentMap).toBe(mapIdx + 1);
      }

      // ── Step 3: Map 8 — Elite Four (5 battles in sequence) ─────────────────

      expect(useGameStore.getState().currentMap).toBe(8);
      expect(useGameStore.getState().eliteIndex).toBe(0);

      // Navigate to the boss (may need to traverse intermediate layers first)
      // reuse the same layer-by-layer logic — but here the boss click starts
      // the E4 chain, not a badge flow. We handle it manually after.
      let eliteBossClicked = false;
      while (!eliteBossClicked) {
        const accessible = Object.values(useGameStore.getState().map!.nodes).filter(
          (n) => n.accessible && !n.visited,
        );
        expect(accessible.length).toBeGreaterThan(0);

        const node = accessible[0];

        if (node.type === 'boss') {
          actor.send({ type: 'CLICK_NODE', node });
          eliteBossClicked = true;
        } else {
          await handleNonBossNode(actor, node);
        }
      }

      // Elite Four battles 1-3: each resolves with eliteComplete=false
      // → goes to transition state → 2s delay → auto-starts next battle.
      //
      // Pattern matches gameMachine.test.ts test 24:
      //   vi.advanceTimersByTime (sync) fires XState's after-timer;
      //   waitFor (xstate) then awaits the resulting state change.
      for (let e4Idx = 0; e4Idx < 3; e4Idx++) {
        // Wait for battle to finish and machine to enter transition
        await waitFor(actor, (s) => s.value === 'transition', { timeout: 5000 });

        // advanceEliteIndexAction incremented eliteIndex on transition entry
        expect(useGameStore.getState().eliteIndex).toBe(e4Idx + 1);

        // Fire the 2-second after-timer synchronously (same pattern as test 24)
        vi.advanceTimersByTime(2100);

        // Wait for the next battle to start
        await waitFor(actor, (s) => isInBattle(s.value), { timeout: 5000 });
      }

      // Battle 4 (eliteIndex=3): resolves with eliteComplete=false → transition (eliteIndex becomes 4)
      await waitFor(actor, (s) => s.value === 'transition', { timeout: 5000 });
      expect(useGameStore.getState().eliteIndex).toBe(4);

      // Fire the timer — battle 5 (Champion, eliteIndex=4) resolves with
      // eliteComplete=true → win (skips the battle.result → win directly)
      vi.advanceTimersByTime(2100);
      await waitFor(actor, (s) => s.value === 'win', { timeout: 5000 });

      // ── Step 4: Verify final state ──────────────────────────────────────────

      expect(useGameStore.getState().badges).toBe(8);
      expect(usePersistenceStore.getState().hallOfFame).toHaveLength(1);
      expect(usePersistenceStore.getState().achievements).toContain('elite_four');

      // ── Step 5: Restart returns to title ───────────────────────────────────

      actor.send({ type: 'RESTART' });
      expect(actor.getSnapshot().value).toBe('title');
    } finally {
      vi.useRealTimers();
    }
  }, 30_000);
});
