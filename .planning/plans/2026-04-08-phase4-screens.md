# Phase 4: Game Screens & Components

> **For agentic workers:** Local agents, phases-and-batches. Sonnet coders, opus reviewers. No TDD for frontend components — TDD only for logic hooks.

**Goal:** Build all 14 game screens, shared components, routing infrastructure, and wire everything to the XState machine. Playable game from title to win/game-over.

**Architecture:** Bottom-up — shared primitives first (PokemonCard, PixelButton, etc.), then HUD components (TeamBar, ItemBar, BadgeBar), then screens in game-flow order, then routing + App wiring.

---

## Phase 4A: Shared Primitives + Routing Shell
**1 sonnet coder + 1 opus reviewer**

### Sonnet coder builds:

**`src/components/ui/PixelButton.tsx`** (~40 LOC)
- Wraps shadcn Button with pixel theme classes from design system
- Variants: primary (red), secondary (blue), ghost (transparent), destructive
- All use `btn-pixel` class, min-h-[44px], shadow-pixel
- Props: standard button + `variant` + `size`

**`src/components/ui/PokemonCard.tsx`** (~80 LOC)
- Reusable Pokemon display card used by 6+ screens
- Shows: sprite (pixelated), name (Press Start 2P 10px), level, types (TypeBadge), HpBar, held item badge
- Props: `pokemon: PokemonInstance`, `onClick?`, `selected?`, `compact?`
- `bg-game-panel border-2 border-white shadow-pixel`

**`src/components/ui/ItemCard.tsx`** (~50 LOC)
- Item display card for item/equip screens
- Shows: PokeAPI item sprite (with emoji fallback), name, description, USABLE badge
- Props: `item: Item`, `onClick?`, `selected?`

**`src/components/ui/TrainerSprite.tsx`** (~30 LOC)
- Displays trainer sprite from Showdown CDN or local sprite
- Props: `name: string`, `size?: number`, `local?: boolean`
- `image-rendering: pixelated`

**`src/components/hud/TeamBar.tsx`** (~100 LOC)
- Horizontal strip of 6 team slots showing mini sprites + HP indicators
- Props: `team: PokemonInstance[]`, `readonly?`, `onReorder?`
- Click/drag to reorder (local state, call `onReorder` callback)
- On hover: show TeamHoverCard

**`src/components/hud/TeamHoverCard.tsx`** (~50 LOC)
- Positioned popup showing full PokemonCard on hover
- Props: `pokemon: PokemonInstance`, `anchor: { x, y }`

**`src/components/hud/ItemBar.tsx`** (~60 LOC)
- Horizontal strip of bag items
- Props: `items: Item[]`, `onItemClick: (item, idx) => void`

**`src/components/hud/BadgeBar.tsx`** (~40 LOC)
- 8 badge slots using PokeAPI badge sprites
- Props: `badges: number` (0-8)
- Earned = colored, unearned = grayscale/dim

**`src/screens/ScreenRouter.tsx`** (~50 LOC)
- Maps XState machine state to screen components
- Uses `getScreenFromState(state)` helper
- Renders the active screen component

**`src/screens/ModalRouter.tsx`** (~40 LOC)
- Renders modals from `uiStore.modal`
- Overlay with backdrop

**`src/App.tsx`** — rewire (~60 LOC)
- `useMachine(gameMachine)` → provide via GameContext
- Render ScreenRouter + ModalRouter
- Game container: `max-w-[480px] min-h-dvh mx-auto`

---

## Phase 4B: Flow Screens (Title → Starter → Map Shell)
**1 sonnet coder + 1 opus reviewer**

### Sonnet coder builds:

**`src/screens/TitleScreen.tsx`** (~80 LOC)
- Game title "POKELIKE" in Press Start 2P, neon-red glow
- "New Run" button (primary), "Hard Mode" button (locked until pokedex complete)
- Footer buttons: Pokedex, Achievements, Hall of Fame, Settings (open modals)
- `send({ type: 'START_RUN', hardMode: false })`

**`src/screens/TrainerSelectScreen.tsx`** (~60 LOC)
- "Choose your trainer" header
- Two TrainerSprite cards: Boy (red) / Girl (dawn)
- Click → `send({ type: 'SELECT_TRAINER', trainer })`

**`src/screens/StarterSelectScreen.tsx`** (~80 LOC)
- "Choose your starter!" header
- Loading state while PokeAPI fetches
- 3 PokemonCard components (Bulbasaur, Charmander, Squirtle)
- Click → `send({ type: 'SELECT_STARTER', starter })`

**`src/screens/MapScreen.tsx`** (~120 LOC)
- Header: BadgeBar, Pokedex/Settings buttons
- Main: SVG map placeholder (MapCanvas component — build simple version)
- Footer: TeamBar, ItemBar
- Node click → `send({ type: 'CLICK_NODE', node })`

**`src/components/map/MapCanvas.tsx`** (~150 LOC)
- Renders the DAG as SVG
- Nodes as circles/sprite images, edges as lines
- Accessible nodes pulse, visited nodes dim
- Click handler on accessible nodes
- Uses `getNodeSprite`, `getNodeColor`, `getNodeLabel` from systems/map

---

## Phase 4C: Choice Screens (Catch, Item, Swap, Trade, Shiny)
**1 sonnet coder + 1 opus reviewer**

### Sonnet coder builds:

**`src/screens/BattleScreen.tsx`** (~60 LOC)
- Wraps existing BattleField + useBattlePlayback
- Reads battle data from machine context
- Sends BATTLE_COMPLETE when playback finishes
- Sends SKIP on skip button

**`src/screens/CatchScreen.tsx`** (~80 LOC)
- "Choose a Pokemon!" header
- 3 PokemonCard choices from machine context
- TeamBar (readonly) at bottom
- Skip (flee) button
- Click → `send({ type: 'MAKE_CHOICE', pokemon })`

**`src/screens/ItemScreen.tsx`** (~60 LOC)
- "Choose an item!" header
- 2 ItemCard choices
- Click → `send({ type: 'MAKE_CHOICE', item })`

**`src/screens/SwapScreen.tsx`** (~80 LOC)
- "Team is full! Swap a member?" header
- Incoming PokemonCard + 6 team PokemonCards
- Click team member → swap
- Cancel button (skip)

**`src/screens/TradeScreen.tsx`** (~80 LOC)
- "Trade offer!" header
- NPC offers a Pokemon; player picks team member to give
- Decline button

**`src/screens/ShinyScreen.tsx`** (~60 LOC)
- Sparkle effect on shiny Pokemon reveal
- Accept or skip

---

## Phase 4D: Result Screens + Wiring
**1 sonnet coder + 1 opus reviewer**

### Sonnet coder builds:

**`src/screens/BadgeScreen.tsx`** (~60 LOC)
- Badge earned ceremony
- Gym leader name + badge sprite
- "Next Map" button → `send({ type: 'CONTINUE' })`

**`src/screens/TransitionScreen.tsx`** (~40 LOC)
- Elite Four interstitial: "Lorelei defeated! Next: Bruno..."
- Auto-advances via XState `after: { 2000 }`

**`src/screens/GameOverScreen.tsx`** (~60 LOC)
- "Game Over" title
- Final badge count, team display
- "Try Again" button → `send({ type: 'RESTART' })`

**`src/screens/WinScreen.tsx`** (~80 LOC)
- "Champion!" celebration
- Final team display with TeamBar
- Hall of Fame link
- "Play Again" button

**Wire everything:** Ensure ScreenRouter maps ALL machine states to screens. Test full game flow: title → trainer → starter → map → battle → catch → map → boss → badge → ... → win.

---

## Quality Gates (per batch)

```bash
pnpm exec tsc -b        # 0 errors
pnpm test               # all green (76+ tests)
pnpm build              # success
pnpm dev                # manual: navigate through game flow
```
