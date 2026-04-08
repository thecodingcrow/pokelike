# Pokelike — React + TypeScript Migration Architecture Plan

## Codebase Metrics (Original)

| File | Lines | Complexity |
|---|---|---|
| js/data.js | ~700 | Data + PokeAPI fetch + cache |
| js/map.js | 503 | Map gen + SVG render |
| js/battle.js | 348 | Auto-battle engine |
| js/ui.js | ~1,400 | Screen rendering + canvas animations |
| js/game.js | ~1,143 | Game loop + node handlers + state |
| css/style.css | 1,398 | Full dark theme |
| index.html | 229 | 15 screen divs |
| **Total** | **~5,700 code lines** | Complexity: 742 |

---

## 1. Original Codebase Analysis

### 1.1 File Responsibilities

**data.js** — Pure data and API layer. Contains:
- `TYPE_CHART` — 18×18 type effectiveness matrix
- `MOVE_POOL` — tiered moves per type (tier 0/1/2 by map progress)
- `GYM_LEADERS[8]` — hardcoded Gen 1 gym leader teams with held items
- `ELITE_4[5]` — Elite Four + Champion with held items
- `ITEM_POOL` + `USABLE_ITEM_POOL` — 31 held items, 3 usable items
- `GEN1_EVOLUTIONS` — full Gen 1 evolution table (all 151 Pokémon)
- `GEN1_BST_APPROX` — BST-bucket pools for encounter scaling
- `MAP_BST_RANGES`, `MAP_LEVEL_RANGES` — 9 map difficulty tiers
- PokeAPI fetch functions with `localStorage` cache (`pkrl_poke_*`)
- `createInstance()` — creates a battle-ready Pokémon object
- `getSettings()` / `saveSettings()` — persisted user preferences
- `getPokedex()`, `markPokedexCaught()`, achievements, Hall of Fame

**map.js** — Map generation and SVG rendering. Contains:
- `NODE_TYPES` — 11 node type constants
- `NODE_WEIGHTS[6]` — weighted probability tables per map layer
- `generateMap(mapIndex)` — produces `{ nodes, edges, layers }` graph
- `advanceFromNode()` — locks siblings, unlocks children
- `renderMap()` — pure SVG renderer; receives `onNodeClick` callback
- `getNodeSprite()`, `getNodeLabel()`, `getNodeColor()` — presentational helpers
- Tooltip singleton (`_mapTooltip`)

**battle.js** — Stateless auto-battle engine. Contains:
- `runBattle(playerTeam, enemyTeam, bagItems, enemyItems, onLog)` — deterministic simulation; returns `{ playerWon, log, detailedLog, pTeam, eTeam, playerParticipants }`
- `calcDamage()` — full damage formula with type chart, STAB, items, crits
- `getEffectiveStat()` — scales base stats by level + item modifiers
- `applyLevelGain()` — mutates team after battle, returns level-up events
- **Side effect**: reads global `state.team` (for Metronome/Muscle Band checks) — this must be refactored

**ui.js** — All UI rendering and canvas animations. Contains:
- `showScreen(id)` — the single screen-switching function (removes/adds `.active`)
- `renderPokemonCard()` — returns HTML string for a Pokémon card
- `renderTeamBar()` — renders the HUD team strip with hover popup, drag-to-reorder
- `renderBattleField()` — renders both sides of the battle with HP bars
- `animateHpBar()` — `requestAnimationFrame` HP drain animation
- `playAttackAnimation()` — dispatches 30+ named canvas animations per move
- `buildParticles()` — particle system for fire/water/electric/ice/grass beams
- `renderItemBadges()` — bag item HUD with click-to-equip
- `openItemEquipModal()` / `openUsableItemModal()` — dynamically created DOM modals
- `openPokedexModal()`, `openAchievementsModal()`, `openSettingsModal()`, `openHallOfFameModal()`, `openPatchNotesModal()` — full-screen modals (generated DOM)

**game.js** — Central state machine and game loop. Contains:
- `state` — single mutable global: `{ currentMap, currentNode, team, items, badges, map, eliteIndex, trainer, starterSpeciesId, maxTeamSize, hardMode }`
- `initGame()` → `startNewRun()` → `showTrainerSelect()` → `showStarterSelect()` → `selectStarter()` → `startMap()`
- `onNodeClick(node)` — the main dispatch switch; 11 node type handlers
- `runBattleScreen()` — orchestrates animation, syncs HP, applies level-ups, handles skip/continue
- All node handlers: `doBattleNode`, `doCatchNode`, `doItemNode`, `doBossNode`, `doElite4`, `doTrainerNode`, `doLegendaryNode`, `doMoveTutorNode`, `doTradeNode`, `doShinyNode`, `doMegaNode`
- End screens: `showBadgeScreen`, `showGameOver`, `showWinScreen`
- Persistence: Pokédex, achievements, Hall of Fame, elite wins all stored in `localStorage`

### 1.2 Global State

Single mutable global `state` object:

```typescript
interface GameState {
  currentMap: number;       // 0–8 (0–7 = gyms, 8 = Elite Four)
  currentNode: MapNode | null;
  team: PokemonInstance[];  // max 6
  items: Item[];            // bag items (held + usable)
  badges: number;           // 0–8
  map: GeneratedMap | null;
  eliteIndex: number;       // 0–4 (progress through Elite Four)
  trainer: 'boy' | 'girl';
  starterSpeciesId: number | null;
  maxTeamSize: number;      // for solo-run achievement
  hardMode: boolean;
}
```

Persistence (all `localStorage`):
- `pkrl_poke_{id}` — PokeAPI species cache per ID
- `pkrl_species_list` — full species list cache
- `poke_settings` — `{ autoSkipLevelUp, autoSkipBattles, autoSkipAllBattles }`
- `poke_pokedex` — caught Pokémon registry
- `poke_shinydex` — shiny caught registry
- `poke_achievements` — unlocked achievement IDs
- `poke_hall_of_fame` — array of completed runs
- `poke_elite_wins` — win count integer

### 1.3 Screen System

All 15 divs share `.screen` class. One screen at a time has `.active` which sets `display: flex`. Screens:
1. `title-screen` — landing page
2. `trainer-screen` — gender select
3. `starter-screen` — starter pick (async PokeAPI fetch)
4. `map-screen` — main hub (SVG map, team bar, item bar)
5. `battle-screen` — auto-battle with canvas animations
6. `catch-screen` — pick a wild Pokémon
7. `item-screen` — pick from 2 items
8. `swap-screen` — team full, swap a member
9. `trade-screen` — trade offer list
10. `shiny-screen` — shiny/trade reveal
11. `badge-screen` — gym win reward
12. `transition-screen` — Elite Four between-battle interstitial
13. `gameover-screen` — defeat
14. `win-screen` — champion celebration
15. `evo-overlay` / `eevee-choice-overlay` — fixed overlays (not `.screen`)

Additionally: modals for Pokédex, Achievements, Settings, Hall of Fame, Patch Notes, Item Equip, Usable Item — all created via `document.createElement` and `document.body.appendChild`.

### 1.4 Event Flow

```
DOMContentLoaded → initGame()
  → [click: New Run] → startNewRun()
    → [async] showTrainerSelect() — Promise resolves on click
      → [async] showStarterSelect() — fetches 3 Pokémon from PokeAPI
        → [click: starter] → selectStarter() → startMap(0)
          → showMapScreen() → renderMap(map, container, onNodeClick)
            → [click: node] → onNodeClick(node)
              → switch(resolvedType) → do[X]Node(node)
                → [battle] → runBattleScreen() → animateBattleVisually()
                  → [win] → applyLevelGain() → checkAndEvolveTeam()
                    → advanceFromNode() → showMapScreen()
                → [boss win] → showBadgeScreen() → startMap(next)
                → [all badges] → doElite4() → showWinScreen()
```

---

## 2. React Project Structure

```
src/
├── components/
│   ├── ui/                     # shadcn/ui wrappers + game-specific primitives
│   │   ├── HpBar.tsx
│   │   ├── TypeBadge.tsx
│   │   ├── PokemonCard.tsx
│   │   ├── ItemCard.tsx
│   │   ├── TrainerSprite.tsx
│   │   └── PixelButton.tsx
│   ├── hud/
│   │   ├── TeamBar.tsx          # team slot strip with hover card
│   │   ├── ItemBar.tsx          # bag item strip
│   │   ├── BadgeBar.tsx         # badge icons
│   │   └── TeamHoverCard.tsx    # popup card on hover
│   ├── map/
│   │   ├── MapCanvas.tsx        # SVG map renderer (React wrapper)
│   │   ├── MapNode.tsx          # individual SVG node group
│   │   └── MapTooltip.tsx       # node tooltip
│   ├── battle/
│   │   ├── BattleField.tsx      # both sides layout
│   │   ├── BattleSide.tsx       # one team's Pokémon
│   │   ├── BattlePokemon.tsx    # single battle slot
│   │   └── BattleAnimCanvas.tsx # canvas overlay for attack animations
│   └── modals/
│       ├── PokedexModal.tsx
│       ├── AchievementsModal.tsx
│       ├── SettingsModal.tsx
│       ├── HallOfFameModal.tsx
│       ├── PatchNotesModal.tsx
│       ├── ItemEquipModal.tsx
│       ├── UsableItemModal.tsx
│       ├── MoveTutorModal.tsx
│       └── EeveeChoiceModal.tsx
├── screens/
│   ├── TitleScreen.tsx
│   ├── TrainerSelectScreen.tsx
│   ├── StarterSelectScreen.tsx
│   ├── MapScreen.tsx
│   ├── BattleScreen.tsx
│   ├── CatchScreen.tsx
│   ├── ItemScreen.tsx
│   ├── SwapScreen.tsx
│   ├── TradeScreen.tsx
│   ├── ShinyScreen.tsx
│   ├── BadgeScreen.tsx
│   ├── TransitionScreen.tsx
│   ├── GameOverScreen.tsx
│   └── WinScreen.tsx
├── systems/
│   ├── battle.ts               # runBattle(), calcDamage(), applyLevelGain()
│   ├── map.ts                  # generateMap(), advanceFromNode(), getAccessibleNodes()
│   ├── evolution.ts            # checkAndEvolveTeam(), applyEvolution()
│   ├── pokeapi.ts              # fetchPokemonById(), fetchSpeciesList(), cache layer
│   └── achievements.ts         # unlockAchievement(), getAchievements()
├── data/
│   ├── typeChart.ts
│   ├── movePool.ts
│   ├── gymLeaders.ts
│   ├── elite4.ts
│   ├── items.ts
│   ├── evolutions.ts
│   ├── trainerConfig.ts
│   └── constants.ts            # MAP_BST_RANGES, MAP_LEVEL_RANGES, LEGENDARY_IDS, etc.
├── hooks/
│   ├── useGameLoop.ts          # node handler orchestration
│   ├── useBattleAnimation.ts   # animation state machine
│   ├── usePokeAPI.ts           # data-fetching hook with cache
│   ├── usePersistence.ts       # localStorage read/write helpers
│   └── useModal.ts             # modal open/close state
├── store/
│   ├── gameStore.ts            # Zustand: GameState slice
│   ├── uiStore.ts              # Zustand: UI state (current screen, modal, overlays)
│   ├── persistenceStore.ts     # Zustand: Pokédex, achievements, Hall of Fame, settings
│   └── index.ts                # re-exports
├── types/
│   ├── pokemon.ts              # PokemonSpecies, PokemonInstance, BaseStats
│   ├── moves.ts                # Move, MovePool
│   ├── items.ts                # Item, HeldItem, UsableItem
│   ├── map.ts                  # MapNode, MapEdge, GeneratedMap, NodeType
│   ├── battle.ts               # BattleResult, DetailedLogEntry, AttackEvent
│   ├── game.ts                 # GameState, AppScreen
│   └── persistence.ts          # PokedexEntry, Achievement, HallOfFameEntry
├── assets/
│   ├── sprites/                # local trainer/gym sprites (from original)
│   └── fonts/                  # Press Start 2P (or self-hosted)
└── styles/
    ├── globals.css             # CSS variables, resets, pixel font
    └── animations.css          # keyframe animations (evolution flash, toasts)
```

---

## 3. State Management Strategy

### 3.1 Two-Layer Architecture: XState v5 + Zustand

**Behavioral state (game flow):** XState v5 (~16 kB) manages the screen state machine and battle phases. It handles "what mode is the game in?" — transitions between screens, battle sub-phases, event sequencing via `invoke` + async/await.

**Data state (inventory, team, persistence):** Zustand (~1.1 kB) manages mutable game data. It handles "what does the player have?" — team roster, items, badges, pokedex. Zustand's `getState()` / `setState()` outside React works well for async code inside XState `invoke`d services.

**Why both:**
- XState gives hierarchical states (e.g. `battle.animating` vs `battle.resolution`) with guarded transitions — impossible to reach invalid states
- Zustand gives fast, granular React subscriptions for HP bars, team displays, etc. without full-tree re-renders
- XState `invoke` + native async/await replaces all custom event sequencing ("play animation → show text → wait for click → apply damage")
- No extra sequencing or coroutine library needed

### 3.2 State Shape

```typescript
// store/gameStore.ts
interface GameStore {
  // Core run state
  currentMap: number;
  currentNode: MapNode | null;
  team: PokemonInstance[];
  items: Item[];
  badges: number;
  map: GeneratedMap | null;
  eliteIndex: number;
  trainer: 'boy' | 'girl';
  starterSpeciesId: number | null;
  maxTeamSize: number;
  hardMode: boolean;

  // Actions
  setTrainer: (t: 'boy' | 'girl') => void;
  setTeam: (team: PokemonInstance[]) => void;
  addToTeam: (p: PokemonInstance) => void;
  swapTeamMember: (idx: number, p: PokemonInstance) => void;
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => void;
  removeItem: (idx: number) => void;
  equipItem: (item: Item, pokemonIdx: number) => void;
  incrementBadges: () => void;
  startMap: (mapIndex: number) => void;
  advanceNode: (nodeId: string) => void;
  resetRun: (hardMode: boolean) => void;
}

// store/uiStore.ts
type AppScreen =
  | 'title' | 'trainer' | 'starter' | 'map'
  | 'battle' | 'catch' | 'item' | 'swap' | 'trade'
  | 'shiny' | 'badge' | 'transition' | 'gameover' | 'win';

type ModalId =
  | 'pokedex' | 'achievements' | 'settings' | 'hall-of-fame'
  | 'patch-notes' | 'item-equip' | 'usable-item' | 'move-tutor'
  | 'eevee-choice' | null;

interface UIStore {
  screen: AppScreen;
  modal: ModalId;
  modalProps: Record<string, unknown>;
  battleTitle: string;
  battleSubtitle: string;
  transitionMsg: string;
  transitionSub: string;
  notification: { text: string; key: number } | null;

  setScreen: (s: AppScreen) => void;
  openModal: (id: ModalId, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  showNotification: (text: string) => void;
}

// store/persistenceStore.ts
interface PersistenceStore {
  pokedex: Record<number, PokedexEntry>;
  shinydex: Record<number, PokedexEntry>;
  achievements: string[];
  hallOfFame: HallOfFameEntry[];
  eliteWins: number;
  settings: GameSettings;

  // All actions also write to localStorage
  markCaught: (id: number, entry: PokedexEntry) => void;
  markShinyCaught: (id: number, entry: PokedexEntry) => void;
  unlockAchievement: (id: string) => Achievement | null;
  saveHallOfFame: (entry: HallOfFameEntry) => void;
  incrementEliteWins: () => number;
  updateSettings: (s: Partial<GameSettings>) => void;
}
```

### 3.3 XState Game Machine

```typescript
// src/machines/gameMachine.ts
import { setup, assign } from 'xstate';

const gameMachine = setup({
  types: {} as {
    context: { battleResult: BattleResult | null; choices: unknown[] };
    events:
      | { type: 'START_RUN'; hardMode: boolean }
      | { type: 'SELECT_TRAINER'; trainer: 'boy' | 'girl' }
      | { type: 'SELECT_STARTER'; speciesId: number }
      | { type: 'CLICK_NODE'; node: MapNode }
      | { type: 'BATTLE_COMPLETE'; result: BattleResult }
      | { type: 'MAKE_CHOICE'; index: number }
      | { type: 'SKIP' }
      | { type: 'CONTINUE' }
      | { type: 'RESTART' };
  },
}).createMachine({
  id: 'game',
  initial: 'title',
  states: {
    title: { on: { START_RUN: 'trainerSelect' } },
    trainerSelect: { on: { SELECT_TRAINER: 'starterSelect' } },
    starterSelect: {
      invoke: { src: 'fetchStarters', onDone: { actions: 'setChoices' } },
      on: { SELECT_STARTER: 'map' },
    },
    map: { on: { CLICK_NODE: 'nodeDispatch' } },
    nodeDispatch: {
      always: [
        { guard: 'isBattleNode', target: 'battle' },
        { guard: 'isCatchNode', target: 'catch' },
        { guard: 'isItemNode', target: 'item' },
        { guard: 'isTradeNode', target: 'trade' },
        { guard: 'isBossNode', target: 'battle' },
        { guard: 'isPokecenter', target: 'map', actions: 'healTeam' },
        // ... other node types
      ],
    },
    battle: {
      initial: 'computing',
      states: {
        computing: {
          invoke: { src: 'runBattle', onDone: 'animating' },
        },
        animating: {
          invoke: { src: 'playBattleAnimation', onDone: 'result' },
          on: { SKIP: { actions: 'skipAnimation' } },
        },
        result: {
          always: [
            { guard: 'playerLost', target: '#game.gameOver' },
            { guard: 'isBossBattle', target: '#game.badge' },
          ],
          on: { CONTINUE: '#game.map' },
        },
      },
    },
    catch: { on: { MAKE_CHOICE: 'map', SKIP: 'map' } },
    item: { on: { MAKE_CHOICE: 'map' } },
    swap: { on: { MAKE_CHOICE: 'map', SKIP: 'map' } },
    trade: { on: { MAKE_CHOICE: 'map', SKIP: 'map' } },
    shiny: { on: { MAKE_CHOICE: 'map', SKIP: 'map' } },
    badge: { on: { CONTINUE: 'map' } },
    transition: {
      after: { 2000: 'battle' }, // Elite Four interstitial
    },
    gameOver: { on: { RESTART: 'title' } },
    win: { on: { RESTART: 'title' } },
  },
});
```

The XState machine owns screen flow. Battle sub-states (`computing → animating → result`) use `invoke` to run async sequences — the "play animation, wait, show result" chain is just a Promise that resolves when the sequence finishes.

### 3.4 Persistence Strategy

`persistenceStore` uses Zustand's `persist` middleware with `localStorage`. The PokeAPI cache (`pkrl_poke_*`) remains as raw `localStorage` entries managed by `systems/pokeapi.ts`.

`gameStore` (run data) is NOT persisted — each reload starts fresh at the title screen. This matches the original behavior. XState machine state is also ephemeral.

---

## 4. Screen Routing

### 4.1 Strategy: XState-Driven Screen Rendering (no React Router)

The original app is a single-page state machine, not a routed app. URL changes would break the game-save mental model. React Router adds complexity without benefit here.

The XState machine's current state drives rendering. The root `App.tsx` reads the machine state and renders the matching screen:

```tsx
// App.tsx
export function App() {
  const [state, send] = useMachine(gameMachine);
  const screen = getScreenFromState(state); // maps xstate state path to screen key
  const modal = useUIStore(s => s.modal);   // modals still in zustand (overlays, not flow)

  return (
    <GameContext.Provider value={{ state, send }}>
      <div className="app-root">
        <ScreenRouter screen={screen} />
        <ModalRouter modal={modal} />
        <EvoOverlay />
        <BattleAnimCanvas />
        <TeamHoverCard />
      </div>
    </GameContext.Provider>
  );
}
```

```tsx
// ScreenRouter.tsx
const SCREENS: Record<AppScreen, React.ComponentType> = {
  title: TitleScreen,
  trainer: TrainerSelectScreen,
  starter: StarterSelectScreen,
  map: MapScreen,
  battle: BattleScreen,
  catch: CatchScreen,
  item: ItemScreen,
  swap: SwapScreen,
  trade: TradeScreen,
  shiny: ShinyScreen,
  badge: BadgeScreen,
  transition: TransitionScreen,
  gameover: GameOverScreen,
  win: WinScreen,
};

export function ScreenRouter({ screen }: { screen: AppScreen }) {
  const Component = SCREENS[screen];
  return <Component />;
}
```

### 4.2 Screen Transitions

Use Framer Motion's `AnimatePresence` keyed on `screen`:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={screen}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
  >
    <Component />
  </motion.div>
</AnimatePresence>
```

The transition screen (Elite Four interstitial) stays at 2 seconds then auto-advances — implement as a `useEffect` with `setTimeout` inside `TransitionScreen`.

---

## 5. Component Breakdown

### 5.1 Screen Components

**TitleScreen**
- Props: none
- State: reads `persistenceStore.eliteWins` (for hard mode unlock)
- shadcn: `Button` (primary, secondary variants)
- Behavior: `btn-new-run` → `gameLoop.startNewRun(false)`, `btn-hard-run` → `gameLoop.startNewRun(true)` (disabled until Pokédex complete)

**TrainerSelectScreen**
- Props: none
- State: none local; on pick → sets `gameStore.trainer`
- Components: Two `TrainerCard` components (boy/girl) with keyboard support
- Note: The original awaits a Promise resolved by a click. In React, this becomes a screen navigation triggered by a click handler in the gameLoop hook.

**StarterSelectScreen**
- Props: none
- State: `starters: PokemonInstance[]` (local async load), `loading: boolean`
- Hook: `usePokeAPI` fetches IDs [1, 4, 7]
- Components: 3 × `PokemonCard` with click handler → `gameLoop.selectStarter(inst)`

**MapScreen**
- Props: none
- State: reads `gameStore.{ currentMap, map, team, items, badges }`
- Components: `MapCanvas`, `TeamBar`, `ItemBar`, `BadgeBar`
- Header buttons open modals via `uiStore.openModal()`

**BattleScreen**
- Props: none
- State: `battleState` from `uiStore` (title, subtitle), animation state from `useBattleAnimation`
- Components: `BattleField`, `BattleAnimCanvas`, Skip/Continue buttons
- Behavior: entirely driven by `useBattleAnimation` hook

**CatchScreen**
- Props: none
- State: `choices: PokemonInstance[]` (loaded by `useGameLoop`), reads `persistenceStore.pokedex`
- Components: list of `PokemonCard` + `TeamBar` (read-only), Skip button

**ItemScreen**
- Props: none
- State: `picks: Item[]` (2 items selected by `useGameLoop`)
- Components: 2 × `ItemCard`, `TeamBar`, Skip button

**SwapScreen**
- Props: none
- State: `incoming: PokemonInstance`, reads `gameStore.team`
- Components: `PokemonCard` (incoming), list of `PokemonCard` for team, Cancel button

**TradeScreen**
- Props: none
- State: reads `gameStore.team`
- Components: list of trade-member rows, Decline button

**ShinyScreen / BadgeScreen / TransitionScreen / GameOverScreen / WinScreen**
- Props: none; all read from stores
- Simple display screens with one primary action button

### 5.2 HUD Components

**TeamBar** (`components/hud/TeamBar.tsx`)
- Props: `team: PokemonInstance[]`, `readonly?: boolean`, `onReorder?: (from: number, to: number) => void`
- Renders team slots; on slot click in main map → drag-to-reorder via local selection state
- On hover: renders `TeamHoverCard`

**TeamHoverCard** (`components/hud/TeamHoverCard.tsx`)
- Props: `pokemon: PokemonInstance`, `anchor: DOMRect`
- Positioned absolutely; renders full `PokemonCard`

**ItemBar** (`components/hud/ItemBar.tsx`)
- Props: `items: Item[]`
- Click on item → `uiStore.openModal('item-equip', { item, fromBagIdx })`

**BadgeBar** (`components/hud/BadgeBar.tsx`)
- Props: none; reads `gameStore.badges`
- Renders 8 badge slots (earned = PokeAPI badge sprite, empty = grey circle)

### 5.3 Map Components

**MapCanvas** (`components/map/MapCanvas.tsx`)
- Props: `map: GeneratedMap`, `onNodeClick: (node: MapNode) => void`
- Renders SVG via `useRef` + `useEffect` (port of `renderMap` from map.js)
- Alternative: use `react-svg` or raw `<svg>` JSX — prefer JSX for React consistency
- Node pulse animations: CSS animation classes instead of SVG `<animate>` elements

**MapNode** (`components/map/MapNode.tsx`)
- Props: `node: MapNode`, `position: {x: number, y: number}`, `onClick?: () => void`
- Handles sprite vs. circle node, accessible pulse, visited opacity
- Tooltip on mouseenter via `MapTooltip`

### 5.4 Battle Components

**BattleField** (`components/battle/BattleField.tsx`)
- Props: `playerTeam: PokemonInstance[]`, `enemyTeam: PokemonInstance[]`
- Renders two `BattleSide` columns with trainer icons

**BattleSide** (`components/battle/BattleSide.tsx`)
- Props: `team: PokemonInstance[]`, `side: 'player' | 'enemy'`, `activeIdx: number`

**BattlePokemon** (`components/battle/BattlePokemon.tsx`)
- Props: `pokemon: PokemonInstance`, `active: boolean`, `fainted: boolean`
- Includes `HpBar` with animated transition via `useBattleAnimation` signals

**BattleAnimCanvas** (`components/battle/BattleAnimCanvas.tsx`)
- Mounts a `<canvas>` fixed over the viewport
- Exposes `play(attackEvent: AttackAnimEvent)` via `useImperativeHandle` / ref
- The canvas animation functions from `ui.js` are ported 1:1 as standalone functions in `systems/battle-animations.ts`

### 5.5 Modal Components

All modals wrap shadcn's `Dialog` component:

| Modal | shadcn components used |
|---|---|
| PokedexModal | Dialog, Tabs, ScrollArea |
| AchievementsModal | Dialog, ScrollArea |
| SettingsModal | Dialog, Switch, Label |
| HallOfFameModal | Dialog, ScrollArea |
| PatchNotesModal | Dialog, ScrollArea |
| ItemEquipModal | Dialog, RadioGroup |
| UsableItemModal | Dialog |
| MoveTutorModal | Dialog |
| EeveeChoiceModal | Dialog |

### 5.6 Primitive Components

**PokemonCard** (`components/ui/PokemonCard.tsx`)
- Props: `pokemon: PokemonInstance`, `onClick?: () => void`, `selected?: boolean`, `dexCaught?: boolean`
- Renders sprite, name, level, types, stats, HP bar, move badge
- Uses `TypeBadge`, `HpBar`

**TypeBadge** (`components/ui/TypeBadge.tsx`)
- Props: `type: PokemonType`
- 17 type colors via Tailwind config extension (`type-fire`, `type-water`, etc.)

**HpBar** (`components/ui/HpBar.tsx`)
- Props: `current: number`, `max: number`, `animated?: boolean`
- Color: green > 50%, orange > 25%, red ≤ 25%
- Animated variant uses `useSpring` (Framer Motion) or CSS transition on width

**ItemCard** (`components/ui/ItemCard.tsx`)
- Props: `item: Item`, `onClick?: () => void`
- Renders icon (emoji), name, desc, USABLE badge

**PixelButton** (`components/ui/PixelButton.tsx`)
- Props: standard button props + `variant: 'primary' | 'secondary' | 'icon-sm'`
- Wraps shadcn `Button` with pixel-font class

---

## 6. Migration Phases

### Phase 1 — Project Scaffold + Data Layer

**Goal:** Working Vite + React + TS project with all data imported and typed.

Tasks:
1. `pnpm create vite@latest src-app --template react-ts`
2. Install dependencies: `tailwindcss`, `shadcn/ui`, `zustand`, `framer-motion`
3. Configure Tailwind with type-color extensions and CSS variables matching the original dark theme
4. Add `shadcn/ui` init: `pnpm dlx shadcn@latest init`
5. Port all constants from `data.js` → `src/data/*.ts` with full TypeScript types
6. Write `src/types/*.ts` — all type definitions
7. Port `systems/battle.ts` (pure functions, no DOM deps) — fully unit-testable
8. Port `systems/map.ts` (pure functions) — fully unit-testable
9. Port `systems/pokeapi.ts` with the existing localStorage cache strategy
10. Write Zustand stores with `persist` middleware
11. Write unit tests for `battle.ts` and `map.ts`

**Quality gate:** `pnpm test` passes for battle engine and map generation. TypeScript strict mode has zero errors.

### Phase 2 — Core Screens (Title → Trainer → Starter → Map Shell)

**Goal:** User can get from title to the map screen with a starter Pokémon.

Tasks:
1. `App.tsx` with `ScreenRouter` + `ModalRouter`
2. `TitleScreen` — static layout, hard mode unlock logic
3. `TrainerSelectScreen` — gender pick
4. `StarterSelectScreen` — async PokeAPI fetch, `PokemonCard` display
5. `MapScreen` shell — header, HUD bars (empty), map placeholder
6. `TeamBar` + `ItemBar` + `BadgeBar` components
7. `PokemonCard`, `TypeBadge`, `HpBar`, `PixelButton` primitives
8. CSS: port dark theme variables; Press Start 2P font via `@fontsource/press-start-2p`
9. Implement `useGameLoop` hook — `startNewRun`, `selectStarter`, `startMap`

**Quality gate:** Full flow title → trainer → starter → map screen works. No TypeScript errors. No console errors.

### Phase 3 — Map System

**Goal:** Fully interactive SVG map with all 11 node types rendered.

Tasks:
1. Port `renderMap` → `MapCanvas.tsx` using React SVG JSX (not `createElementNS`)
2. `MapNode.tsx` — sprite vs. circle logic, accessible pulse via CSS `@keyframes`
3. `MapTooltip.tsx` — positioned tooltip with Gym Leader team preview
4. `getNodeSprite`, `getNodeColor`, `getNodeLabel` → `src/systems/map.ts`
5. Implement `onNodeClick` → `useGameLoop.handleNodeClick()` dispatching to node handlers
6. `doPokeCenterNode`, `doItemNode` (without equip modal yet)
7. `CatchScreen` — Pokémon choices, skip button
8. `SwapScreen` — team full flow

**Quality gate:** Map renders correctly on mobile and desktop. All 11 node type icons appear. Node click dispatches correctly.

### Phase 4 — Battle System

**Goal:** Full auto-battle with animations, level-ups, and evolutions.

Tasks:
1. `BattleScreen.tsx` — field layout, Skip/Continue buttons
2. `BattleField`, `BattleSide`, `BattlePokemon` components
3. `BattleAnimCanvas.tsx` — canvas overlay, ref-exposed `playAnimation()`
4. Port ALL canvas animation functions from `ui.js` → `src/systems/battle-animations.ts` (30+ functions)
5. `useBattleAnimation` hook — orchestrates the `detailedLog` event queue, calls `playAnimation`, drives HP bar updates
6. HP bar animation — `useSpring` or CSS transition keyed on `currentHp`
7. Level-up animation — flash + number tick on Pokémon card
8. Evolution overlay — port `playEvoAnimation` + `showEeveeChoice`
9. `runBattleScreen` equivalent in `useGameLoop`
10. Wire up all battle node types: `doBattleNode`, `doTrainerNode`, `doBossNode`, `doLegendaryNode`

**Quality gate:** Wild battle, trainer battle, gym battle all animate correctly. Level-ups apply. Evolutions trigger. Skip button works. No visual regressions vs. original.

### Phase 5 — Secondary Screens + Modals

**Goal:** All game nodes complete, all modals functional.

Tasks:
1. `doItemNode` complete — `ItemScreen` with `ItemEquipModal`
2. `doMoveTutorNode` — `MoveTutorModal`
3. `doTradeNode` — `TradeScreen` + trade reveal via `ShinyScreen`
4. `doShinyNode`, `doMegaNode`
5. `doElite4` — sequential boss loop with `TransitionScreen`
6. `BadgeScreen`, `GameOverScreen`, `WinScreen`
7. `PokedexModal` — grid of 151 with caught/shiny badges
8. `AchievementsModal` — list with unlock conditions
9. `SettingsModal` — auto-skip switches
10. `HallOfFameModal` — past runs display
11. `PatchNotesModal` — static content
12. Persistence store fully wired — Pokédex marks, achievements unlock, Hall of Fame saves

**Quality gate:** Full game loop completable from title to win screen. All modals open/close. Persistence survives page reload.

### Phase 6 — Polish and Animations

**Goal:** Match original visual feel; add quality-of-life improvements.

Tasks:
1. Screen transitions with `AnimatePresence`
2. Item-found toast animation (port `showItemFoundToast`)
3. Achievement toast (`showAchievementToast`)
4. Map notification (`showMapNotification`)
5. Pokémon card hover state in TeamBar
6. Mobile responsiveness audit — map SVG scales correctly, cards stack vertically
7. Keyboard navigation — all cards have `role="button"` + `tabIndex` + `onKeyDown`
8. `prefers-reduced-motion` — disable canvas animations, use instant HP updates
9. Google Analytics integration (env-gated)
10. Performance: lazy-load PokeAPI sprites with `loading="lazy"`, memoize `PokemonCard` with `React.memo`
11. Error boundaries on async screens
12. `vite build` with asset optimization; verify bundle size

---

## 7. Technical Decisions

### 7.1 pnpm Workspace Config

```yaml
# pnpm-workspace.yaml (repo root)
packages:
  - 'src-app'
```

```json
// src-app/package.json (key deps)
{
  "name": "pokelike-app",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "framer-motion": "^12.0.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@fontsource/press-start-2p": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0"
  }
}
```

### 7.2 Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@screens': path.resolve(__dirname, './src/screens'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@data': path.resolve(__dirname, './src/data'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'animation': ['framer-motion'],
          'state': ['zustand'],
        },
      },
    },
  },
});
```

### 7.3 TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@systems/*": ["./src/systems/*"],
      "@data/*": ["./src/data/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@store/*": ["./src/store/*"],
      "@types/*": ["./src/types/*"]
    }
  }
}
```

### 7.4 Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const TYPE_COLORS = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0',
  electric: '#f8d030', grass: '#78c850', ice: '#98d8d8',
  fighting: '#c03028', poison: '#a040a0', ground: '#e0c068',
  flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8',
  dark: '#705848', steel: '#b8b8d0',
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a14',
        bg2: '#12121f',
        bg3: '#1a1a2e',
        border: '#2a2a4a',
        accent: '#6c63ff',
        accent2: '#ff6584',
        'text-dim': '#7070a0',
        type: TYPE_COLORS,
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono: ['monospace', '"Courier New"'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 7.5 Testing Strategy

**Unit tests (Vitest):**
- `systems/battle.ts` — `calcDamage`, `runBattle`, `applyLevelGain` with known inputs
- `systems/map.ts` — `generateMap` structure invariants, `advanceFromNode` side effects
- `data/*.ts` — type chart completeness, evolution chain validity

**Integration tests (@testing-library/react):**
- `StarterSelectScreen` — renders 3 cards after mock fetch resolves
- `BattleScreen` — Skip button advances to win state
- `ItemEquipModal` — equip → Pokémon holds item; unequip → item returns to bag

**No E2E tests in Phase 1–5.** Consider Playwright in Phase 6 for the critical path: title → starter → first battle → first catch.

**Mock strategy:** `vi.mock` the `systems/pokeapi.ts` module to return fixture data. This makes all screens testable without network access.

### 7.6 Key Refactors Required

1. **Decouple `battle.ts` from global `state`**: `calcDamage` and `getEffectiveStat` read `state.team` for Metronome/Muscle Band checks. Refactor to accept `team: PokemonInstance[]` as an explicit parameter.

2. **`runBattle` pure function**: Already mostly pure — just needs the `state` coupling removed. Returns `BattleResult` with no side effects.

3. **Async game loop**: The original uses `await new Promise(resolve => ...)` driven by click handlers to sequence screens. In React, this becomes a state machine: `uiStore.screen` changes drive which screen renders, and each screen's action buttons call `useGameLoop` functions that advance the state.

4. **Canvas animation**: The `requestAnimationFrame` loop in `useBattleAnimation` needs to pause/resume correctly when the component unmounts (cleanup in `useEffect`). Use `useRef` for the animation frame ID.

5. **SVG map**: Port `renderMap` from imperative DOM manipulation to React JSX. The `positions` calculation is pure — extract to a `useMapLayout` hook. Use `useCallback` on `onNodeClick` to prevent SVG re-renders.

6. **Modal management**: Replace dynamic `document.createElement` + `document.body.appendChild` with React portals via `ReactDOM.createPortal`. The `uiStore.modal` + `uiStore.modalProps` pattern handles open/close state.

7. **PokeAPI cache keys**: Keep existing `pkrl_poke_*` key format so existing player caches are not invalidated on launch.

---

## Appendix A: Critical Data Structures

```typescript
// types/pokemon.ts

interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  speed: number;
  special: number;  // Sp.Atk (Gen 1 unified)
  spdef: number;    // Sp.Def (derived from PokeAPI)
}

interface PokemonSpecies {
  id: number;
  name: string;
  types: PokemonType[];
  baseStats: BaseStats;
  bst: number;
  spriteUrl: string;
  shinySpriteUrl: string;
}

interface PokemonInstance extends PokemonSpecies {
  speciesId: number;
  nickname: string | null;
  level: number;
  currentHp: number;
  maxHp: number;
  isShiny: boolean;
  heldItem: HeldItem | null;
  moveTier: 0 | 1 | 2;
  megaStone: null;       // reserved
  _transformed?: boolean; // Ditto flag
}

// types/map.ts

type NodeType =
  | 'start' | 'battle' | 'catch' | 'item' | 'question'
  | 'boss' | 'pokecenter' | 'trainer' | 'legendary'
  | 'move_tutor' | 'trade';

interface MapNode {
  id: string;
  type: NodeType;
  layer: number;
  col: number;
  visited: boolean;
  accessible: boolean;
  revealed: boolean;
  trainerSprite?: string;
  mapIndex?: number;      // boss nodes only
}

interface MapEdge {
  from: string;
  to: string;
}

interface GeneratedMap {
  nodes: Record<string, MapNode>;
  edges: MapEdge[];
  layers: MapNode[][];
  mapIndex: number;
}

// types/battle.ts

type DetailedLogEntryType =
  | 'send_out' | 'attack' | 'effect' | 'faint' | 'result' | 'transform';

interface AttackLogEntry {
  type: 'attack';
  side: 'player' | 'enemy';
  attackerIdx: number;
  attackerName: string;
  targetSide: 'player' | 'enemy';
  targetIdx: number;
  targetName: string;
  moveName: string;
  moveType: PokemonType;
  damage: number;
  typeEff: number;
  crit: boolean;
  isSpecial: boolean;
  attackerHpAfter: number;
  targetHpAfter: number;
}

interface BattleResult {
  playerWon: boolean;
  log: Array<{ msg: string; cls: string }>;
  detailedLog: DetailedLogEntry[];
  pTeam: PokemonInstance[];
  eTeam: PokemonInstance[];
  playerParticipants: Set<number>;
}
```

## Appendix B: Node Handler → Screen Mapping

| Node Type | Screens Involved | Modal Involved |
|---|---|---|
| BATTLE | battle | — |
| CATCH | catch → (swap if full) | — |
| ITEM | item | item-equip |
| TRAINER | battle | — |
| BOSS (gym) | battle → badge | — |
| BOSS (elite) | transition + battle × 5 → win | — |
| POKECENTER | map (notification) | — |
| LEGENDARY | battle → (swap if full) | — |
| MOVE_TUTOR | map | move-tutor |
| TRADE | trade → shiny (reveal) | — |
| QUESTION | resolves to one of the above | — |
| shiny (resolved) | shiny → (swap if full) | — |
| mega (resolved) | item | item-equip |

## Appendix C: Shadcn/ui Components Required

Run these after `shadcn init`:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add scroll-area
pnpm dlx shadcn@latest add switch
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add toast
```

The `toast` component replaces the custom `showMapNotification` and `showItemFoundToast` functions. Zustand's `uiStore.showNotification` will dispatch to the shadcn Toaster.
