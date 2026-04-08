# Phase 5: Wire Game Flow End-to-End

**Goal:** Make the game playable from title to win/game-over. Fix all data flow gaps so every node type works.

**Gaps to fix (from audit):**
- A. Catch: no Pokemon choices generated
- B. Item: no item choices generated  
- C. Trade: no trade offer generated
- D. Shiny: no shiny Pokemon generated
- E. Move tutor modal: action bug (reads wrong event type)
- F. Evolution: never called post-battle
- G. Pokedex: markCaught never called on catch
- H. Elite Four transition: unreachable state
- I. Trainer enemy count: always 1, should be 1-3
- J. Modals: all placeholders (defer non-critical ones)

---

## Batch 5A: Node handlers + post-battle logic (1 sonnet + 1 opus review)

**Create `src/systems/encounters.ts`** (~120 LOC) — Pure functions for generating encounter data:
- `generateCatchChoices(mapIndex: number): Promise<PokemonInstance[]>` — picks 3 random Pokemon from BST bucket for map, fetches via PokeAPI
- `generateItemChoices(mapIndex: number): Item[]` — picks 2 random items from ITEM_POOL (respecting minMap, excluding dupes)
- `generateTradeOffer(mapIndex: number, givenLevel: number): Promise<PokemonInstance>` — random Pokemon 3 levels higher
- `generateShinyPokemon(mapIndex: number): Promise<PokemonInstance>` — random Pokemon with isShiny=true
- `generateEnemyTeam(mapIndex: number, nodeType: NodeType, trainerKey?: string): Promise<PokemonInstance[]>` — 1 for wild, 1-3 for trainer (scaled by map)

**Update `src/machines/gameMachine.ts`:**
- Add `invoke` actors for catch, item, trade, shiny states using the encounter functions
- Fix move tutor action (call uiStore.openModal directly)
- Fix Elite Four transition routing
- Add evolution check after battle result
- Add markCaught action on MAKE_CHOICE in catch state
- Fix trainer enemy count (use generateEnemyTeam)

**TDD for encounters.ts** — write tests for generateItemChoices (pure, no API), generateCatchChoices (mock PokeAPI)

## Batch 5B: Critical modals (1 sonnet + 1 opus review)

Build the gameplay-essential modals only:
- **ItemEquipModal** — assign held item to a team Pokemon
- **UsableItemModal** — use Max Revive/Rare Candy/Moon Stone on a Pokemon  
- **MoveTutorModal** — pick a team Pokemon to upgrade moveTier
- **EeveeChoiceModal** — choose Flareon/Vaporeon/Jolteon at level 36
- **SettingsModal** — auto-skip toggles

Defer: PokedexModal, AchievementsModal, HallOfFameModal, PatchNotesModal (nice-to-have, not blocking gameplay)
