/**
 * gameMachine.ts — XState v5 game flow state machine.
 *
 * Manages SCREEN TRANSITIONS only. All data mutations happen in Zustand stores
 * (gameStore, persistenceStore). The machine reads Zustand via getState() in
 * guards and actions; it never duplicates data that Zustand owns.
 *
 * Machine context holds only the small pieces of ephemeral UI state that are
 * needed to route correctly between states.
 */

import { setup, assign, fromPromise } from 'xstate';

import type { NodeType, MapNode, PokemonInstance, PokemonType, Item } from '@/types';
import type { ModalId } from '@/store/uiStore';

// ── Store imports ─────────────────────────────────────────────────────────────

import { useGameStore } from '@/store/gameStore';
import { usePersistenceStore } from '@/store/persistenceStore';
import { useUIStore } from '@/store/uiStore';

// ── Data imports ──────────────────────────────────────────────────────────────

import { ELITE_4 } from '@/data/elite4';
import { GYM_LEADERS } from '@/data/gymLeaders';

// ── System imports ────────────────────────────────────────────────────────────

import { runBattle, applyLevelGain, calcHp } from '@/systems/battle';
import { fetchPokemonById, createInstance } from '@/systems/pokeapi';
import { checkAndEvolveTeam } from '@/systems/evolution';
import {
  generateCatchChoices,
  generateItemChoices,
  generateTradeOffer,
  generateShinyPokemon,
  generateEnemyTeam,
} from '@/systems/encounters';

// ── Context ───────────────────────────────────────────────────────────────────

/** BattleResult as stored in machine context after a battle resolves. */
export interface MachineBattleResult {
  playerWon: boolean;
  pTeam: PokemonInstance[];
  eTeam: PokemonInstance[];
  playerParticipants: Set<number>;
  detailedLog: unknown[];
  /** True when all Elite Four members have been defeated */
  eliteComplete?: boolean;
}

export interface MachineContext {
  battleResult: MachineBattleResult | null;
  /** Pokémon choices for catch/swap/shiny screens, or Item choices for item screen. */
  choices: PokemonInstance[] | Item[];
  /** The resolved node type (QUESTION mark is resolved before entering nodeDispatch). */
  currentNodeType: NodeType | 'shiny' | 'mega' | null;
  /** The raw MapNode from the last CLICK_NODE event. */
  currentNode: MapNode | null;
  /** True when the active/last battle was a boss fight. */
  isBoss: boolean;
  /** True when the active/last battle is part of the Elite Four sequence. */
  isEliteFour: boolean;
  /** Snapshot: was the team full when we entered catch/shiny/legendary? */
  teamFull: boolean;
  /** Text displayed in the battle screen header. */
  battleTitle: string;
  battleSubtitle: string;
  /** Text displayed in the Elite Four transition screen. */
  transitionMsg: string;
  transitionSub: string;
}

// ── Events ────────────────────────────────────────────────────────────────────

export type MachineEvents =
  | { type: 'START_RUN'; hardMode?: boolean }
  | { type: 'RESUME_RUN' }
  | { type: 'SELECT_TRAINER'; trainer: 'boy' | 'girl' }
  | { type: 'SELECT_STARTER'; starter: PokemonInstance }
  | { type: 'CLICK_NODE'; node: MapNode }
  | { type: 'BATTLE_COMPLETE'; result: MachineBattleResult }
  | { type: 'MAKE_CHOICE'; index?: number; pokemon?: PokemonInstance; item?: Item }
  | { type: 'SKIP' }
  | { type: 'CONTINUE' }
  | { type: 'RESTART' }
  | { type: 'OPEN_MODAL'; modal: ModalId; props?: Record<string, unknown> }
  | { type: 'CLOSE_MODAL' };

// ── Actor input/output types ──────────────────────────────────────────────────

export type FetchStartersInput = Record<string, never>;
export type FetchStartersOutput = PokemonInstance[];

export type RunBattleInput = {
  isBoss: boolean;
  isEliteFour: boolean;
  currentMap: number;
  currentNode: MapNode | null;
  eliteIndex: number;
};

export type RunBattleOutput = MachineBattleResult & {
  battleTitle: string;
  battleSubtitle: string;
};

export type PlayBattleAnimationInput = { result: MachineBattleResult };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal fallback PokemonInstance when PokeAPI is unavailable. */
function buildFallbackPokemon(
  speciesId: number,
  name: string,
  level: number,
  types: PokemonType[],
  baseStats: { hp: number; atk: number; def: number; speed: number; special: number },
  moveTier: 0 | 1 | 2,
  heldItem: PokemonInstance['heldItem'],
): PokemonInstance {
  const hp = calcHp(baseStats.hp, level);
  return {
    speciesId,
    name,
    nickname: null,
    level,
    types,
    baseStats: { ...baseStats, spdef: baseStats.special },
    currentHp: hp,
    maxHp: hp,
    isShiny: false,
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`,
    megaStone: null,
    heldItem,
    moveTier,
  };
}

/** Map a starter species ID (including evolutions) to its achievement ID. */
function getStarterAchievement(speciesId: number | null): string | null {
  if (!speciesId) return null;
  if (speciesId <= 3) return 'starter_1';
  if (speciesId <= 6) return 'starter_4';
  if (speciesId <= 9) return 'starter_7';
  return null;
}

/** Resolve a QUESTION mark node to a concrete type. */
function resolveQuestionMark(hardModeWin: boolean): MachineContext['currentNodeType'] {
  const r = Math.random();
  if (r < 0.22) return 'battle';
  if (r < 0.42) return 'trainer';
  if (r < 0.52) return 'catch';
  if (r < 0.65) return 'item';
  const shinyThreshold = hardModeWin ? 0.70 : 0.88;
  if (r < shinyThreshold) return 'shiny';
  return 'mega';
}

// ── Machine ───────────────────────────────────────────────────────────────────

export const gameMachine = setup({
  types: {} as {
    context: MachineContext;
    events: MachineEvents;
  },

  // ── Guards ────────────────────────────────────────────────────────────────

  guards: {
    isBattleNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'battle',

    isTrainerNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'trainer',

    isCatchNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'catch',

    isLegendaryNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'legendary',

    isItemNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'item' || context.currentNodeType === 'mega',

    isTradeNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'trade',

    isShinyNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'shiny',

    isPokecenter: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'pokecenter',

    isMoveTutorNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'move_tutor',

    isBossNode: ({ context }: { context: MachineContext }) =>
      context.currentNodeType === 'boss',

    isFallbackBattle: ({ context }: { context: MachineContext }) =>
      context.currentNodeType !== null &&
      !['catch', 'item', 'mega', 'trade', 'shiny', 'pokecenter', 'move_tutor', 'legendary'].includes(
        context.currentNodeType,
      ),

    playerLost: ({ context }: { context: MachineContext }) =>
      context.battleResult !== null && !context.battleResult.playerWon,

    isBossBattle: ({ context }: { context: MachineContext }) =>
      context.isBoss,

    isEliteFourComplete: ({ context }: { context: MachineContext }) =>
      !!(context.battleResult?.eliteComplete),

    /** True when we beat an Elite Four member but have not beaten all of them yet. */
    isEliteFourNotComplete: ({ context }: { context: MachineContext }) =>
      !!(context.isBoss && context.isEliteFour && context.battleResult?.playerWon && !context.battleResult?.eliteComplete),

    teamIsFull: ({ context }: { context: MachineContext }) =>
      context.teamFull,
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  actions: {
    resolveNodeType: assign({
      currentNode: ({ event }: { event: MachineEvents }) => {
        if (event.type !== 'CLICK_NODE') return null;
        return event.node;
      },
      currentNodeType: ({ event }: { event: MachineEvents }) => {
        if (event.type !== 'CLICK_NODE') return null;
        const node = event.node;
        if (node.type !== 'question') return node.type as MachineContext['currentNodeType'];
        const hardModeWin = (() => {
          try {
            const wins = Number(localStorage.getItem('poke_hard_mode_wins') ?? '0');
            return wins > 0;
          } catch {
            return false;
          }
        })();
        return resolveQuestionMark(hardModeWin);
      },
      teamFull: () => useGameStore.getState().team.length >= 6,
    }),

    markBossFlags: assign({
      isBoss: ({ context }: { context: MachineContext }) =>
        context.currentNodeType === 'boss',
      isEliteFour: ({ context }: { context: MachineContext }) =>
        context.currentNodeType === 'boss' && useGameStore.getState().currentMap === 8,
    }),

    setBattleTitlesFromOutput: assign({
      battleTitle: ({ event }: { event: MachineEvents }) =>
        ((event as { output?: { battleTitle?: string } }).output?.battleTitle) ?? '',
      battleSubtitle: ({ event }: { event: MachineEvents }) =>
        ((event as { output?: { battleSubtitle?: string } }).output?.battleSubtitle) ?? '',
      battleResult: ({ event }: { event: MachineEvents }) =>
        ((event as { output?: MachineBattleResult | null }).output) ?? null,
    }),

    storeBattleResult: assign({
      battleResult: ({ event }: { event: MachineEvents }) => {
        if (event.type !== 'BATTLE_COMPLETE') return null;
        return event.result;
      },
    }),

    setChoices: assign({
      choices: ({ event }: { event: MachineEvents }) =>
        ((event as { output?: PokemonInstance[] }).output) ?? [],
    }),

    setTransitionMessages: assign({
      transitionMsg: () => {
        const { eliteIndex } = useGameStore.getState();
        const defeated = ELITE_4[eliteIndex];
        return defeated ? `${defeated.name} defeated!` : 'Defeated!';
      },
      transitionSub: () => {
        const { eliteIndex } = useGameStore.getState();
        const nextIndex = eliteIndex + 1;
        if (nextIndex >= ELITE_4.length) return 'The Champion awaits!';
        return `Next: ${ELITE_4[nextIndex].name}...`;
      },
    }),

    resetRunAction: ({ event }: { event: MachineEvents }) => {
      if (event.type !== 'START_RUN') return;
      useGameStore.getState().resetRun(event.hardMode ?? false);
    },

    setTrainerAction: ({ event }: { event: MachineEvents }) => {
      if (event.type !== 'SELECT_TRAINER') return;
      useGameStore.getState().setTrainer(event.trainer);
    },

    selectStarterAction: ({ event }: { event: MachineEvents }) => {
      if (event.type !== 'SELECT_STARTER') return;
      const { starter } = event;
      const gameStore = useGameStore.getState();
      const persist = usePersistenceStore.getState();

      gameStore.setTeam([starter]);
      gameStore.setStarterSpeciesId(starter.speciesId);
      gameStore.startMap(0);

      const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${starter.speciesId}.png`;
      persist.markCaught(starter.speciesId, starter.name, starter.types, normalUrl);
      if (starter.isShiny) {
        persist.markShinyCaught(starter.speciesId, starter.name, starter.types, starter.spriteUrl);
      }

      // Check dex completion achievements (unlikely on starter, but correct)
      if (persist.isPokedexComplete()) {
        persist.unlockAchievement('pokedex_complete');
      }
    },

    healTeamAction: ({ context }: { context: MachineContext }) => {
      useGameStore.getState().healTeam();
      const node = context.currentNode;
      if (node) useGameStore.getState().advanceNode(node.id);
      useUIStore.getState().showNotification('Your team was fully healed!');
    },

    advanceCurrentNodeAction: ({ context }: { context: MachineContext }) => {
      const node = context.currentNode;
      if (node) useGameStore.getState().advanceNode(node.id);
    },

    addBadgeAction: ({ context }: { context: MachineContext }) => {
      const gameStore = useGameStore.getState();
      gameStore.incrementBadges();
      const node = context.currentNode;
      if (node) gameStore.advanceNode(node.id);
      usePersistenceStore.getState().unlockAchievement(`gym_${gameStore.currentMap}`);
    },

    advanceToNextMapAction: () => {
      const gameStore = useGameStore.getState();
      const nextMap = gameStore.currentMap >= 7 ? 8 : gameStore.currentMap + 1;
      if (nextMap === 8) gameStore.setEliteIndex(0);
      gameStore.startMap(nextMap);
    },

    advanceEliteIndexAction: () => {
      const gameStore = useGameStore.getState();
      gameStore.setEliteIndex(gameStore.eliteIndex + 1);
    },

    saveHallOfFameAction: () => {
      const gameStore = useGameStore.getState();
      const persist = usePersistenceStore.getState();
      const wins = persist.incrementEliteWins();
      persist.saveHallOfFame(gameStore.team, wins, gameStore.hardMode);
      persist.unlockAchievement('elite_four');
      if (wins === 10) persist.unlockAchievement('elite_10');
      if (wins === 100) persist.unlockAchievement('elite_100');
      const starterAchId = getStarterAchievement(gameStore.starterSpeciesId);
      if (starterAchId) persist.unlockAchievement(starterAchId);
      if (gameStore.maxTeamSize === 1) persist.unlockAchievement('solo_run');
      if (gameStore.hardMode) persist.unlockAchievement('hard_mode_win');
    },

    openModalAction: ({ event }: { event: MachineEvents }) => {
      if (event.type !== 'OPEN_MODAL') return;
      useUIStore.getState().openModal(event.modal, event.props);
    },

    openMoveTutorAction: () => {
      useUIStore.getState().openModal('move-tutor');
    },

    closeModalAction: () => {
      useUIStore.getState().closeModal();
    },

    /**
     * Handle catching a Pokémon from a catch/shiny/legendary node.
     * Reads the chosen Pokémon from event.pokemon and adds it to the team.
     * Also marks the species as caught in the Pokédex.
     */
    catchPokemonAction: ({ event }: { event: MachineEvents }) => {
      if (event.type !== 'MAKE_CHOICE') return;
      const pokemon = event.pokemon;
      if (!pokemon) return;

      const gameStore = useGameStore.getState();
      const persist = usePersistenceStore.getState();

      gameStore.addToTeam(pokemon);

      const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.speciesId}.png`;
      persist.markCaught(pokemon.speciesId, pokemon.name, pokemon.types, normalUrl);

      if (pokemon.isShiny) {
        persist.markShinyCaught(pokemon.speciesId, pokemon.name, pokemon.types, pokemon.spriteUrl);
      }

      // Check dex completion achievements
      if (persist.isPokedexComplete()) {
        persist.unlockAchievement('pokedex_complete');
      }
      if (pokemon.isShiny && persist.isShinyDexComplete()) {
        persist.unlockAchievement('shinydex_complete');
      }
    },

    /**
     * Add a chosen item to the player's bag.
     */
    pickItemAction: ({ event }: { event: MachineEvents }) => {
      if (event.type !== 'MAKE_CHOICE') return;
      const item = event.item;
      if (!item) return;
      useGameStore.getState().addItem(item);
    },

    /**
     * Swap the team member at the chosen index with the just-caught pokemon
     * (which is currently sitting at the end of the team as team[6]), then
     * trim the team back to 6.
     */
    swapTeamAction: ({ event }: { event: MachineEvents }) => {
      if (event.type !== 'MAKE_CHOICE') return;
      const idx = event.index;
      if (idx === undefined) return;
      const store = useGameStore.getState();
      const { team } = store;
      if (team.length <= 6) return;
      const newPokemon = team[team.length - 1];
      store.swapTeamMember(idx, newPokemon);
      const updatedTeam = useGameStore.getState().team;
      store.setTeam(updatedTeam.slice(0, 6));
    },

    /**
     * Cancel a swap — discard the just-caught pokemon by trimming the team
     * back to 6 (the newly caught pokemon was appended at the end).
     */
    cancelSwapAction: () => {
      const store = useGameStore.getState();
      if (store.team.length > 6) {
        store.setTeam(store.team.slice(0, 6));
      }
    },
  },

  // ── Actors ────────────────────────────────────────────────────────────────

  actors: {
    /**
     * Fetch three starter Pokémon instances (Bulbasaur, Charmander, Squirtle).
     */
    fetchStarters: fromPromise<PokemonInstance[], FetchStartersInput>(async () => {
      const [bulbasaur, charmander, squirtle] = await Promise.all([
        fetchPokemonById(1),
        fetchPokemonById(4),
        fetchPokemonById(7),
      ]);
      const instances: PokemonInstance[] = [];
      if (bulbasaur) instances.push(createInstance(bulbasaur, 5, false, 1));
      if (charmander) instances.push(createInstance(charmander, 5, false, 1));
      if (squirtle) instances.push(createInstance(squirtle, 5, false, 1));
      return instances;
    }),

    /**
     * Run the battle simulation and compute titles.
     */
    runBattle: fromPromise<RunBattleOutput, RunBattleInput>(async ({ input }) => {
      const gameStore = useGameStore.getState();
      const { team, items, hardMode } = gameStore;
      const { isBoss, isEliteFour, currentMap, currentNode, eliteIndex } = input;

      let enemyTeam: PokemonInstance[];
      let battleTitle: string;
      let battleSubtitle: string;
      let eliteComplete = false;

      if (isEliteFour) {
        const boss = ELITE_4[eliteIndex];
        enemyTeam = await Promise.all(
          boss.team.map(async (p) => {
            const species = await fetchPokemonById(p.speciesId);
            if (!species) {
              // Fallback: build a minimal instance from the data object
              return buildFallbackPokemon(p.speciesId, p.name, p.level, p.types, p.baseStats, 2, p.heldItem ?? null);
            }
            const inst = createInstance(species, p.level, false, 2);
            return { ...inst, heldItem: p.heldItem ?? null };
          }),
        );
        battleTitle = `${boss.title}: ${boss.name}!`;
        battleSubtitle = eliteIndex === 4 ? 'Final Battle!' : `Elite Four — Battle ${eliteIndex + 1}/4`;
        eliteComplete = eliteIndex >= ELITE_4.length - 1;
      } else if (isBoss) {
        const leader = GYM_LEADERS[currentMap];
        enemyTeam = await Promise.all(
          leader.team.map(async (p) => {
            const species = await fetchPokemonById(p.speciesId);
            if (!species) {
              return buildFallbackPokemon(p.speciesId, p.name, p.level, p.types, p.baseStats, 1, p.heldItem ?? null);
            }
            const inst = createInstance(species, p.level, false, 1);
            return { ...inst, heldItem: p.heldItem ?? null };
          }),
        );
        battleTitle = `Gym Battle vs ${leader.name}!`;
        battleSubtitle = `${leader.badge} is on the line!`;
      } else {
        // Wild / trainer battle — generate a scaled enemy team using encounters system
        const nodeType = (currentNode?.type ?? 'battle') as NodeType;
        enemyTeam = await generateEnemyTeam(currentMap, nodeType);

        // Ultra-fallback if PokeAPI is unavailable
        if (enemyTeam.length === 0) {
          const enemyLevel = 5 + currentMap * 5 + Math.floor(Math.random() * 5);
          enemyTeam = [buildFallbackPokemon(
            19, 'Rattata', enemyLevel, ['Normal'],
            { hp: 30, atk: 56, def: 35, speed: 72, special: 25 },
            0, null,
          )];
        }

        battleTitle = currentNode?.type === 'trainer' ? 'Trainer Battle!' : 'Wild Encounter!';
        battleSubtitle = `Map ${currentMap + 1}`;
      }

      const result = runBattle(team, enemyTeam, items, []);

      // Mark all enemy pokemon as seen in the pokédex
      for (const enemy of enemyTeam) {
        const normalUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${enemy.speciesId}.png`;
        usePersistenceStore.getState().markSeen(enemy.speciesId, enemy.name, enemy.types, normalUrl);
      }

      if (result.playerWon) {
        // Match original getLevelGain logic exactly:
        // - Boss/trainer/elite battles: base gain = 2 (or 1 in hard mode)
        // - Wild encounters (battle/catch nodes): base gain = 1, Lucky Egg applies
        const isWild = !isBoss && !isEliteFour && currentNode?.type !== 'trainer';
        const baseGain = isWild ? 1 : (hardMode ? 1 : 2);
        applyLevelGain(result.pTeam, baseGain, result.playerParticipants, items, isWild, hardMode);

        // Check for and silently apply evolutions (Eevee excluded, handled via modal)
        const evoResults = await checkAndEvolveTeam(result.pTeam);
        if (evoResults.length > 0) {
          for (const evo of evoResults) {
            result.pTeam[evo.teamIndex] = evo.evolved;
          }
        }

        gameStore.setTeam(result.pTeam);
      } else {
        gameStore.setTeam(result.pTeam);
      }

      return {
        playerWon: result.playerWon,
        pTeam: result.pTeam,
        eTeam: result.eTeam,
        playerParticipants: result.playerParticipants,
        detailedLog: result.detailedLog,
        eliteComplete: eliteComplete && result.playerWon,
        battleTitle,
        battleSubtitle,
      };
    }),

    /**
     * Animation shim — resolves immediately.
     * BattleScreen drives its own animation and sends BATTLE_COMPLETE when done.
     */
    playBattleAnimation: fromPromise<void, PlayBattleAnimationInput>(async ({ input: _input }) => {
      return;
    }),

    /** Fetch 3 Pokémon choices for the catch screen. */
    fetchCatchChoices: fromPromise<PokemonInstance[], Record<string, never>>(async () => {
      const { currentMap } = useGameStore.getState();
      return generateCatchChoices(currentMap);
    }),

    /** Fetch 2 item choices for the item screen. */
    fetchItemChoices: fromPromise<Item[], Record<string, never>>(async () => {
      const { currentMap, items } = useGameStore.getState();
      return generateItemChoices(currentMap, items);
    }),

    /** Fetch a trade offer Pokémon. */
    fetchTradeOffer: fromPromise<PokemonInstance | null, Record<string, never>>(async () => {
      const { currentMap, team } = useGameStore.getState();
      const givenLevel = team[0]?.level ?? 5;
      return generateTradeOffer(currentMap, givenLevel);
    }),

    /** Fetch a shiny Pokémon for the shiny encounter screen. */
    fetchShinyPokemon: fromPromise<PokemonInstance | null, Record<string, never>>(async () => {
      const { currentMap } = useGameStore.getState();
      return generateShinyPokemon(currentMap);
    }),
  },
}).createMachine({
  id: 'game',
  initial: 'title',

  context: {
    battleResult: null,
    choices: [],
    currentNodeType: null,
    currentNode: null,
    isBoss: false,
    isEliteFour: false,
    teamFull: false,
    battleTitle: '',
    battleSubtitle: '',
    transitionMsg: '',
    transitionSub: '',
  },

  on: {
    OPEN_MODAL:  { actions: 'openModalAction' },
    CLOSE_MODAL: { actions: 'closeModalAction' },
  },

  states: {

    // ── Title screen ──────────────────────────────────────────────────────────
    title: {
      on: {
        START_RUN: {
          target: 'trainerSelect',
          actions: 'resetRunAction',
        },
        RESUME_RUN: {
          target: 'map',
        },
      },
    },

    // ── Trainer gender select ─────────────────────────────────────────────────
    trainerSelect: {
      on: {
        SELECT_TRAINER: {
          target: 'starterSelect',
          actions: 'setTrainerAction',
        },
      },
    },

    // ── Starter select ────────────────────────────────────────────────────────
    starterSelect: {
      invoke: {
        src: 'fetchStarters',
        input: {} as FetchStartersInput,
        onDone: {
          actions: 'setChoices',
        },
        onError: {
          actions: [],
        },
      },
      on: {
        SELECT_STARTER: {
          target: 'map',
          actions: 'selectStarterAction',
        },
      },
    },

    // ── Map — main hub ────────────────────────────────────────────────────────
    map: {
      on: {
        CLICK_NODE: {
          target: 'nodeDispatch',
          actions: 'resolveNodeType',
        },
      },
    },

    // ── Node dispatch — transient routing based on resolved node type ─────────
    nodeDispatch: {
      entry: 'markBossFlags',
      always: [
        {
          guard: 'isPokecenter',
          target: 'map',
          actions: 'healTeamAction',
        },
        {
          guard: 'isMoveTutorNode',
          target: 'map',
          actions: ['advanceCurrentNodeAction', 'openMoveTutorAction'],
        },
        { guard: 'isBossNode',      target: 'battle' },
        { guard: 'isBattleNode',    target: 'battle' },
        { guard: 'isTrainerNode',   target: 'battle' },
        { guard: 'isCatchNode',     target: 'catch' },
        { guard: 'isLegendaryNode', target: 'catch' },
        { guard: 'isItemNode',      target: 'item' },
        { guard: 'isTradeNode',     target: 'trade' },
        { guard: 'isShinyNode',     target: 'shiny' },
        { guard: 'isFallbackBattle', target: 'battle' },
        { target: 'map' },
      ],
    },

    // ── Battle — compound state ───────────────────────────────────────────────
    battle: {
      initial: 'computing',
      states: {

        computing: {
          invoke: {
            src: 'runBattle',
            input: ({ context }: { context: MachineContext }): RunBattleInput => ({
              isBoss: context.isBoss,
              isEliteFour: context.isEliteFour,
              currentMap: useGameStore.getState().currentMap,
              currentNode: context.currentNode,
              eliteIndex: useGameStore.getState().eliteIndex,
            }),
            onDone: {
              target: 'animating',
              actions: 'setBattleTitlesFromOutput',
            },
            onError: {
              target: '#game.map',
            },
          },
        },

        animating: {
          invoke: {
            src: 'playBattleAnimation',
            input: ({ context }: { context: MachineContext }): PlayBattleAnimationInput => ({
              result: context.battleResult!,
            }),
            onDone: {
              target: 'result',
            },
          },
          on: {
            SKIP: { target: 'result' },
            BATTLE_COMPLETE: {
              target: 'result',
              actions: 'storeBattleResult',
            },
          },
        },

        result: {
          always: [
            {
              guard: 'playerLost',
              target: '#game.gameOver',
            },
            {
              guard: 'isEliteFourComplete',
              target: '#game.win',
              actions: 'saveHallOfFameAction',
            },
            {
              guard: 'isEliteFourNotComplete',
              target: '#game.transition',
              actions: 'setTransitionMessages',
            },
            {
              guard: 'isBossBattle',
              target: '#game.badge',
              actions: 'addBadgeAction',
            },
          ],
          on: {
            CONTINUE: {
              target: '#game.map',
              actions: 'advanceCurrentNodeAction',
            },
          },
        },
      },
    },

    // ── Catch screen ──────────────────────────────────────────────────────────
    catch: {
      invoke: {
        src: 'fetchCatchChoices',
        input: {} as Record<string, never>,
        onDone: {
          actions: assign({ choices: ({ event }) => (event as { output: PokemonInstance[] }).output }),
        },
        onError: {
          actions: [],
        },
      },
      on: {
        MAKE_CHOICE: [
          {
            guard: 'teamIsFull',
            target: 'swap',
            actions: 'catchPokemonAction',
          },
          {
            target: 'map',
            actions: ['catchPokemonAction', 'advanceCurrentNodeAction'],
          },
        ],
        SKIP: {
          target: 'map',
          actions: 'advanceCurrentNodeAction',
        },
      },
    },

    // ── Item screen ───────────────────────────────────────────────────────────
    item: {
      invoke: {
        src: 'fetchItemChoices',
        input: {} as Record<string, never>,
        onDone: {
          actions: assign({ choices: ({ event }) => (event as { output: Item[] }).output }),
        },
        onError: {
          actions: [],
        },
      },
      on: {
        MAKE_CHOICE: {
          target: 'map',
          actions: ['pickItemAction', 'advanceCurrentNodeAction'],
        },
        SKIP: {
          target: 'map',
          actions: 'advanceCurrentNodeAction',
        },
      },
    },

    // ── Swap screen ───────────────────────────────────────────────────────────
    swap: {
      on: {
        MAKE_CHOICE: {
          target: 'map',
          actions: ['swapTeamAction', 'advanceCurrentNodeAction'],
        },
        SKIP: {
          target: 'map',
          actions: ['cancelSwapAction', 'advanceCurrentNodeAction'],
        },
      },
    },

    // ── Trade screen ──────────────────────────────────────────────────────────
    trade: {
      invoke: {
        src: 'fetchTradeOffer',
        input: {} as Record<string, never>,
        onDone: {
          actions: assign({
            choices: ({ event }) => {
              const pokemon = (event as { output: PokemonInstance | null }).output;
              return pokemon ? [pokemon] : [];
            },
          }),
        },
        onError: {
          actions: [],
        },
      },
      on: {
        MAKE_CHOICE: {
          target: 'shiny',
          actions: 'advanceCurrentNodeAction',
        },
        SKIP: {
          target: 'map',
          actions: 'advanceCurrentNodeAction',
        },
      },
    },

    // ── Shiny / trade reveal screen ───────────────────────────────────────────
    shiny: {
      invoke: {
        src: 'fetchShinyPokemon',
        input: {} as Record<string, never>,
        onDone: {
          actions: assign({
            choices: ({ event }) => {
              const pokemon = (event as { output: PokemonInstance | null }).output;
              return pokemon ? [pokemon] : [];
            },
          }),
        },
        onError: {
          actions: [],
        },
      },
      on: {
        MAKE_CHOICE: [
          {
            guard: 'teamIsFull',
            target: 'swap',
            actions: 'catchPokemonAction',
          },
          {
            target: 'map',
            actions: ['catchPokemonAction', 'advanceCurrentNodeAction'],
          },
        ],
        CONTINUE: {
          target: 'map',
        },
        SKIP: {
          target: 'map',
          actions: 'advanceCurrentNodeAction',
        },
      },
    },

    // ── Badge screen ──────────────────────────────────────────────────────────
    badge: {
      on: {
        CONTINUE: {
          target: 'map',
          actions: 'advanceToNextMapAction',
        },
      },
    },

    // ── Elite Four transition interstitial ────────────────────────────────────
    // setTransitionMessages is called from battle.result (before entering this state).
    // advanceEliteIndexAction increments eliteIndex so the next battle uses the next Elite member.
    transition: {
      entry: [
        'advanceEliteIndexAction',
      ],
      after: {
        2000: {
          target: 'battle',
        },
      },
    },

    // ── Game over ─────────────────────────────────────────────────────────────
    gameOver: {
      on: {
        RESTART: {
          target: 'title',
          actions: 'resetRunAction',
        },
      },
    },

    // ── Win screen ────────────────────────────────────────────────────────────
    win: {
      on: {
        RESTART: {
          target: 'title',
          actions: 'resetRunAction',
        },
      },
    },
  },
});

export type GameMachine = typeof gameMachine;
