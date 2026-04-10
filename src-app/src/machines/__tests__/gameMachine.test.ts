import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createActor, fromPromise, waitFor } from 'xstate';
import { gameMachine } from '@/machines/gameMachine';
import { useGameStore } from '@/store/gameStore';
import { useUIStore } from '@/store/uiStore';
import { usePersistenceStore } from '@/store/persistenceStore';
import type { NodeType } from '@/types/map';
import {
  makePokemon,
  makeMapNode,
  makeFullItem,
  resetAllStores,
} from '@/systems/__tests__/test-helpers';

// ── Helper: create a test actor with mocked actors ───────────────────────────

function createTestActor(overrides: Record<string, unknown> = {}) {
  const testMachine = gameMachine.provide({
    actors: {
      fetchStarters: fromPromise(async () => [
        makePokemon({ speciesId: 1, name: 'Bulbasaur', level: 5 }),
        makePokemon({ speciesId: 4, name: 'Charmander', level: 5 }),
        makePokemon({ speciesId: 7, name: 'Squirtle', level: 5 }),
      ]),
      runBattle: fromPromise(async () => ({
        playerWon: true,
        pTeam: useGameStore.getState().team,
        eTeam: [makePokemon({ currentHp: 0 })],
        playerParticipants: new Set([0]),
        detailedLog: [],
        battleTitle: 'Test',
        battleSubtitle: '',
      })),
      playBattleAnimation: fromPromise(async () => {}),
      fetchCatchChoices: fromPromise(async () => [
        makePokemon({ speciesId: 25, name: 'Pikachu' }),
      ]),
      fetchItemChoices: fromPromise(async () => []),
      fetchTradeOffer: fromPromise(async () => makePokemon({ name: 'TradeMon' })),
      fetchShinyPokemon: fromPromise(async () => makePokemon({ name: 'ShinyMon', isShiny: true })),
      ...overrides,
    } as Parameters<typeof gameMachine.provide>[0]['actors'],
  });
  return createActor(testMachine).start();
}

// ── Helper: advance actor to map state with a starter ────────────────────────

async function advanceToMap(actor: ReturnType<typeof createActor>) {
  actor.send({ type: 'START_RUN' });
  actor.send({ type: 'SELECT_TRAINER', trainer: 'boy' });
  const starter = makePokemon({ speciesId: 1, name: 'Bulbasaur', level: 5 });
  actor.send({ type: 'SELECT_STARTER', starter });
  // Wait for map generation (selectStarterAction calls startMap synchronously)
  await new Promise(r => setTimeout(r, 10));
  expect(actor.getSnapshot().value).toBe('map');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('gameMachine', () => {
  beforeEach(() => resetAllStores());

  // ── Test 1: Game start flow ─────────────────────────────────────────────────

  it('progresses through game start flow: title → trainerSelect → starterSelect → map', async () => {
    const actor = createTestActor();
    expect(actor.getSnapshot().value).toBe('title');

    actor.send({ type: 'START_RUN' });
    expect(actor.getSnapshot().value).toBe('trainerSelect');

    actor.send({ type: 'SELECT_TRAINER', trainer: 'boy' });
    expect(actor.getSnapshot().value).toBe('starterSelect');

    const starter = makePokemon({ speciesId: 1, name: 'Bulbasaur', level: 5 });
    actor.send({ type: 'SELECT_STARTER', starter });
    expect(actor.getSnapshot().value).toBe('map');

    const gs = useGameStore.getState();
    expect(gs.team).toHaveLength(1);
    expect(gs.team[0].name).toBe('Bulbasaur');
    expect(gs.map).not.toBeNull();
  });

  // ── Test 2: Catch flow — team not full ──────────────────────────────────────

  it('catch flow — team not full: catches pokemon and advances node', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    expect(useGameStore.getState().team).toHaveLength(1);

    const catchNode = makeMapNode({ id: 'catch-1', type: 'catch' });
    actor.send({ type: 'CLICK_NODE', node: catchNode });

    await waitFor(actor, (s) => s.value === 'catch', { timeout: 1000 });

    const pikachu = makePokemon({ speciesId: 25, name: 'Pikachu' });
    actor.send({ type: 'MAKE_CHOICE', pokemon: pikachu });

    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().team).toHaveLength(2);
    expect(useGameStore.getState().team[1].name).toBe('Pikachu');
  });

  // ── Test 3: Catch flow — team full → swap → map ─────────────────────────────

  it('catch flow — team full: goes to swap, then map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    // Fill team to 6 BEFORE clicking node (resolveNodeType checks team size)
    for (let i = 0; i < 5; i++) {
      useGameStore.getState().addToTeam(makePokemon({ name: `Mon${i}` }));
    }
    expect(useGameStore.getState().team).toHaveLength(6);

    const catchNode = makeMapNode({ id: 'catch-2', type: 'catch' });
    actor.send({ type: 'CLICK_NODE', node: catchNode });
    await waitFor(actor, (s) => s.value === 'catch', { timeout: 1000 });

    const newMon = makePokemon({ speciesId: 25, name: 'Pikachu' });
    actor.send({ type: 'MAKE_CHOICE', pokemon: newMon });

    expect(actor.getSnapshot().value).toBe('swap');
    expect(useGameStore.getState().team).toHaveLength(7); // temporarily 7

    actor.send({ type: 'MAKE_CHOICE' });
    expect(actor.getSnapshot().value).toBe('map');
  });

  // ── Test 4: Catch skip ──────────────────────────────────────────────────────

  it('catch skip — no pokemon added, returns to map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    const catchNode = makeMapNode({ type: 'catch' });
    actor.send({ type: 'CLICK_NODE', node: catchNode });
    await waitFor(actor, (s) => s.value === 'catch', { timeout: 1000 });

    actor.send({ type: 'SKIP' });
    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().team).toHaveLength(1); // only starter
  });

  // ── Test 5: Battle win → map ────────────────────────────────────────────────

  it('battle win — goes through computing → animating → result, then CONTINUE → map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    const battleNode = makeMapNode({ type: 'battle' });
    actor.send({ type: 'CLICK_NODE', node: battleNode });

    // Wait for result sub-state (runBattle + playBattleAnimation both resolve async)
    await waitFor(
      actor,
      (s) => {
        const v = s.value;
        return typeof v === 'object' && 'battle' in v && (v as Record<string, unknown>).battle === 'result';
      },
      { timeout: 2000 },
    );

    actor.send({ type: 'CONTINUE' });
    expect(actor.getSnapshot().value).toBe('map');
  });

  // ── Test 6: Battle lose → gameOver ─────────────────────────────────────────

  it('battle lose — goes to gameOver', async () => {
    const actor = createTestActor({
      runBattle: fromPromise(async () => ({
        playerWon: false,
        pTeam: [makePokemon({ currentHp: 0 })],
        eTeam: [makePokemon()],
        playerParticipants: new Set([0]),
        detailedLog: [],
        battleTitle: 'Test',
        battleSubtitle: '',
      })),
    });
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'battle' }) });

    await waitFor(actor, (s) => s.value === 'gameOver', { timeout: 2000 });
  });

  // ── Test 7: Boss battle → badge → next map ──────────────────────────────────

  it('boss battle win — earns badge, advances to next map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    const bossNode = makeMapNode({ type: 'boss' });
    actor.send({ type: 'CLICK_NODE', node: bossNode });

    await waitFor(actor, (s) => s.value === 'badge', { timeout: 2000 });

    expect(useGameStore.getState().badges).toBe(1);

    actor.send({ type: 'CONTINUE' });
    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().currentMap).toBe(1);
  });

  // ── Test 8: Pokecenter → heal → map (instant) ───────────────────────────────

  it('pokecenter — heals team and returns to map instantly', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    // Damage the starter
    const team = useGameStore.getState().team;
    useGameStore.getState().setTeam([{ ...team[0], currentHp: 50 }]);
    expect(useGameStore.getState().team[0].currentHp).toBe(50);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'pokecenter' }) });

    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().team[0].currentHp).toBe(
      useGameStore.getState().team[0].maxHp,
    );
  });

  // ── Test 9: Item pick → map ─────────────────────────────────────────────────

  it('item pick — adds item and returns to map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'item' }) });
    await waitFor(actor, (s) => s.value === 'item', { timeout: 1000 });

    const item = makeFullItem('lucky_egg', 'Lucky Egg');
    actor.send({ type: 'MAKE_CHOICE', item });

    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().items).toHaveLength(1);
    expect(useGameStore.getState().items[0].id).toBe('lucky_egg');
  });

  // ── Test 10: Item skip → map ────────────────────────────────────────────────

  it('item skip — no item added, returns to map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'item' }) });
    await waitFor(actor, (s) => s.value === 'item', { timeout: 1000 });

    actor.send({ type: 'SKIP' });
    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().items).toHaveLength(0);
  });

  // ── Test 11: Trade → accept → shiny ────────────────────────────────────────

  it('trade accept — goes to shiny screen', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'trade' }) });
    await waitFor(actor, (s) => s.value === 'trade', { timeout: 1000 });

    actor.send({ type: 'MAKE_CHOICE' });
    await waitFor(actor, (s) => s.value === 'shiny', { timeout: 1000 });
  });

  // ── Test 12: Shiny catch with full team → swap → map ───────────────────────

  it('shiny catch with full team — goes to swap, then map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    // Fill team to 6 BEFORE clicking node
    for (let i = 0; i < 5; i++) {
      useGameStore.getState().addToTeam(makePokemon());
    }
    expect(useGameStore.getState().team).toHaveLength(6);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'shiny' as NodeType }) });
    await waitFor(actor, (s) => s.value === 'shiny', { timeout: 1000 });

    actor.send({
      type: 'MAKE_CHOICE',
      pokemon: makePokemon({ name: 'ShinyMon', isShiny: true }),
    });
    expect(actor.getSnapshot().value).toBe('swap');

    actor.send({ type: 'MAKE_CHOICE' });
    expect(actor.getSnapshot().value).toBe('map');
  });

  // ── Test 13: Move tutor → map + modal opened ────────────────────────────────

  it('move tutor — advances node and opens modal', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'move_tutor' }) });
    expect(actor.getSnapshot().value).toBe('map');
    expect(useUIStore.getState().modal).toBe('move-tutor');
  });

  // ── Test 14: GameOver → restart → title ────────────────────────────────────

  it('gameOver restart — returns to title', async () => {
    const actor = createTestActor({
      runBattle: fromPromise(async () => ({
        playerWon: false,
        pTeam: [makePokemon({ currentHp: 0 })],
        eTeam: [makePokemon()],
        playerParticipants: new Set([0]),
        detailedLog: [],
        battleTitle: '',
        battleSubtitle: '',
      })),
    });
    await advanceToMap(actor);
    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'battle' }) });
    await waitFor(actor, (s) => s.value === 'gameOver', { timeout: 2000 });

    actor.send({ type: 'RESTART' });
    expect(actor.getSnapshot().value).toBe('title');
  });

  // ── Test 15: Global modal events ────────────────────────────────────────────

  it('OPEN_MODAL and CLOSE_MODAL work in any state', () => {
    const actor = createTestActor();
    actor.send({ type: 'OPEN_MODAL', modal: 'pokedex' });
    expect(useUIStore.getState().modal).toBe('pokedex');
    actor.send({ type: 'CLOSE_MODAL' });
    expect(useUIStore.getState().modal).toBeNull();
  });

  // ── Test 16: Elite Four — final victory leads to win screen ────────────────

  it('elite four — final victory leads to win screen', async () => {
    const actor = createTestActor({
      runBattle: fromPromise(async () => ({
        playerWon: true,
        pTeam: useGameStore.getState().team,
        eTeam: [makePokemon({ currentHp: 0 })],
        playerParticipants: new Set([0]),
        detailedLog: [],
        eliteComplete: true,
        battleTitle: 'Champion Battle',
        battleSubtitle: 'Final!',
      })),
    });
    await advanceToMap(actor);

    useGameStore.getState().startMap(8);
    useGameStore.getState().setEliteIndex(0);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'boss', id: 'elite-boss' }) });

    await waitFor(actor, (s) => s.value === 'win', { timeout: 3000 });

    expect(usePersistenceStore.getState().hallOfFame).toHaveLength(1);
    expect(usePersistenceStore.getState().achievements).toContain('elite_four');
  });

  // ── Test 17: Elite Four — loss leads to gameOver ────────────────────────────

  it('elite four — loss leads to gameOver', async () => {
    const actor = createTestActor({
      runBattle: fromPromise(async () => ({
        playerWon: false,
        pTeam: [makePokemon({ currentHp: 0 })],
        eTeam: [makePokemon()],
        playerParticipants: new Set([0]),
        detailedLog: [],
        battleTitle: 'E4',
        battleSubtitle: '',
      })),
    });
    await advanceToMap(actor);
    useGameStore.getState().startMap(8);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'boss' }) });
    await waitFor(actor, (s) => s.value === 'gameOver', { timeout: 3000 });
  });

  // ── Test 18: Win screen — restart returns to title ──────────────────────────

  it('win screen — restart returns to title', async () => {
    const actor = createTestActor({
      runBattle: fromPromise(async () => ({
        playerWon: true,
        pTeam: useGameStore.getState().team,
        eTeam: [makePokemon({ currentHp: 0 })],
        playerParticipants: new Set([0]),
        detailedLog: [],
        eliteComplete: true,
        battleTitle: '',
        battleSubtitle: '',
      })),
    });
    await advanceToMap(actor);
    useGameStore.getState().startMap(8);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'boss' }) });
    await waitFor(actor, (s) => s.value === 'win', { timeout: 3000 });

    actor.send({ type: 'RESTART' });
    expect(actor.getSnapshot().value).toBe('title');
  });

  // ── Test 19: Trade skip — returns to map ────────────────────────────────────

  it('trade skip — returns to map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'trade' }) });
    await waitFor(actor, (s) => s.value === 'trade', { timeout: 1000 });

    actor.send({ type: 'SKIP' });
    expect(actor.getSnapshot().value).toBe('map');
  });

  // ── Test 20: Legendary node — routes to catch screen ───────────────────────

  it('legendary node — routes to catch screen', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'legendary' }) });
    await waitFor(actor, (s) => s.value === 'catch', { timeout: 1000 });

    actor.send({ type: 'MAKE_CHOICE', pokemon: makePokemon({ name: 'Mewtwo', speciesId: 150 }) });
    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().team).toHaveLength(2);
  });

  // ── Test 21: Trainer node — routes to battle ───────────────────────────────

  it('trainer node — routes to battle', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'trainer' }) });
    await waitFor(actor, (s) => {
      const v = s.value;
      return typeof v === 'object' && 'battle' in v;
    }, { timeout: 2000 });
  });

  // ── Test 22: Shiny node (team not full) — catch → map ──────────────────────

  it('shiny catch — team not full, goes to map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'shiny' as NodeType }) });
    await waitFor(actor, (s) => s.value === 'shiny', { timeout: 1000 });

    actor.send({ type: 'MAKE_CHOICE', pokemon: makePokemon({ name: 'Shiny', isShiny: true }) });
    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().team).toHaveLength(2);
  });

  // ── Test 23: Shiny skip — returns to map ───────────────────────────────────

  it('shiny skip — returns to map', async () => {
    const actor = createTestActor();
    await advanceToMap(actor);

    actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'shiny' as NodeType }) });
    await waitFor(actor, (s) => s.value === 'shiny', { timeout: 1000 });

    actor.send({ type: 'SKIP' });
    expect(actor.getSnapshot().value).toBe('map');
    expect(useGameStore.getState().team).toHaveLength(1);
  });

  // ── Test 24: Elite Four intermediate victory — goes to transition ───────────

  it('elite four — intermediate victory goes to transition then battle', async () => {
    const actor = createTestActor({
      runBattle: fromPromise(async () => ({
        playerWon: true,
        pTeam: useGameStore.getState().team,
        eTeam: [makePokemon({ currentHp: 0 })],
        playerParticipants: new Set([0]),
        detailedLog: [],
        eliteComplete: false,
        battleTitle: 'E4',
        battleSubtitle: '',
      })),
    });
    await advanceToMap(actor);
    useGameStore.getState().startMap(8);
    useGameStore.getState().setEliteIndex(0);

    vi.useFakeTimers();
    try {
      actor.send({ type: 'CLICK_NODE', node: makeMapNode({ type: 'boss' }) });

      await waitFor(actor, (s) => s.value === 'transition', { timeout: 3000 });

      expect(useGameStore.getState().eliteIndex).toBe(1);

      vi.advanceTimersByTime(2100);

      await waitFor(actor, (s) => {
        const v = s.value;
        return typeof v === 'object' && 'battle' in v;
      }, { timeout: 1000 });
    } finally {
      vi.useRealTimers();
    }
  });
});
