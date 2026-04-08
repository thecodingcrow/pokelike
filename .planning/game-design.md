# Pokelike — Game Design Document

> Reverse-engineered from the original vanilla JS source at `/original/`.
> Target: React + TypeScript rebuild. Version documented: v1.2.

---

## 1. Game Loop Overview

### Full Flow

```
Title Screen
  → [New Run] → Trainer Select → Starter Select → Map 1
  → [Hard Mode] → Trainer Select → Starter Select → Map 1 (hard rules)

Map (maps 0–7, each = one gym route)
  → Navigate nodes bottom-to-top
  → Reach Boss node → Gym Battle
  → Win → Badge Screen → "Next Map" → Map N+1

Map 8 (Elite Four route)
  → Boss node triggers sequential Elite Four + Champion gauntlet (5 battles)
  → Win → Win Screen (Hall of Fame saved)
  → Lose at any point → Game Over
```

### Screen Inventory (all defined in `index.html`)

| Screen ID | Purpose |
|---|---|
| `title-screen` | Main menu — New Run, Hard Mode (locked), Pokédex, Achievements, Hall of Fame |
| `trainer-screen` | Choose gender: BOY or GIRL (cosmetic only, affects trainer sprite) |
| `starter-screen` | Pick one of 3 Gen 1 starters (Bulbasaur, Charmander, Squirtle) |
| `map-screen` | SVG node graph, team bar, item bar, badge strip |
| `battle-screen` | Auto-battle viewer with Skip button and Continue |
| `catch-screen` | Choose 1 of 3 wild Pokemon to add to team |
| `item-screen` | Choose 1 of 2 items to keep (held or usable) |
| `swap-screen` | If team is full (6), swap incoming Pokemon with an existing member |
| `trade-screen` | NPC offers a trade — give away one Pokemon, get a stronger one |
| `shiny-screen` | Shiny Pokemon appeared — accept or swap |
| `badge-screen` | Victory badge ceremony with "Next Map" button |
| `transition-screen` | 2-second pause between Elite Four members |
| `gameover-screen` | Run ended — badge count, final team, "Try Again" |
| `win-screen` | Champion! Final team display, Hall of Fame link |
| `evo-overlay` | Full-screen evolution animation (fixed z-index: 200) |
| `eevee-choice-overlay` | Branching Eevee evolution chooser (Flareon/Vaporeon/Jolteon) |

### Screen Transitions (what triggers each)

- **Title → Trainer Select**: click "New Run" or "Hard Mode"
- **Trainer Select → Starter Select**: click BOY or GIRL card
- **Starter Select → Map**: select any starter Pokemon card
- **Map → Battle**: click a `battle` or `trainer` node
- **Map → Catch**: click a `catch` or `legendary` node
- **Map → Item**: click an `item` node (or `mega` node, which resolves to item)
- **Map → Trade**: click a `trade` node
- **Map → Pokecenter**: click `pokecenter` (heals team, instantly returns to map)
- **Map → Move Tutor**: click `move_tutor` node (modal overlay, not a screen swap)
- **Map → Boss**: click `boss` node (gym leader or Elite Four entry point)
- **Battle → Map**: battle concludes + player presses Continue → `advanceFromNode` + `showMapScreen`
- **Battle → Game Over**: all player Pokemon faint
- **Boss Win → Badge Screen**: `state.badges++`, show badge ceremony
- **Badge Screen → Next Map**: `startMap(currentMap + 1)`
- **Map 8 Boss Win → Win Screen**: after all 5 Elite Four wins
- **Question Mark node**: resolves randomly to `battle` (22%), `trainer` (20%), `catch` (10%), `item` (13%), `shiny` (23–35%), or `mega/item` (12–15%)

### Win/Loss Conditions

- **Win**: Defeat all 5 Elite Four members + Champion (Gary) on Map 8
- **Loss (permadeath-lite)**: All Pokemon on the team faint during any battle — triggers `showGameOver()` which calls `initGame()`, resetting state completely
- **No persistent run state**: `state` is an in-memory JS object; losing the tab loses the run. localStorage only stores cross-run data (Pokédex, achievements, Hall of Fame, settings)

---

## 2. Pokemon System

### Data Structure

Every Pokemon instance contains:

```typescript
interface PokemonInstance {
  speciesId: number;         // PokeAPI national dex number (1–151, plus Steelix 208, Scizor 212)
  name: string;              // Display name (capitalized)
  nickname: string | null;   // Player-set nickname (not yet implemented in UI, field exists)
  level: number;             // Current level (1–100)
  currentHp: number;
  maxHp: number;             // calcHp(baseStats.hp, level)
  isShiny: boolean;
  types: string[];           // e.g. ['Fire', 'Flying']
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    speed: number;
    special: number;         // Sp. Atk (Gen 1 unified special)
    spdef: number;           // Sp. Def (fetched from PokeAPI modern value)
  };
  spriteUrl: string;         // PokeAPI sprite CDN URL
  megaStone: null;           // Unused; field reserved
  heldItem: Item | null;     // One held item per Pokemon
  moveTier: 0 | 1 | 2;      // Determines which move from MOVE_POOL the Pokemon uses
}
```

### HP Formula

```
maxHp = floor(baseHp * level / 50) + level + 10
```

### Effective Stat Scaling (during battle)

```
effectiveStat = floor(baseStat * level / 50) + 5
```

Items then multiply this value.

### Species Pool

- **Source**: PokeAPI (fetched live, cached in `localStorage`)
- **All 151 Gen 1 Pokemon are in the game**, categorized into BST buckets
- **5 Legendaries excluded from normal pools**: #144 Articuno, #145 Zapdos, #146 Moltres, #150 Mewtwo, #151 Mew — appear only at `legendary` nodes
- **Starters**: only Bulbasaur (#1), Charmander (#4), Squirtle (#7)
- **Special behaviors**: Magikarp (#129) always uses Splash (noDamage), Abra (#63) always uses Teleport (noDamage)

### BST Buckets by Map

| Map | BST Range | Bucket |
|---|---|---|
| 1 | 200–310 | low |
| 2 | 280–360 | midLow |
| 3–4 | 340–420 | mid |
| 5–6 | 400–480 | midHigh |
| 7–8 | 460–530 | high |
| Final (Elite) | 530+ | veryHigh |

### Level Ranges by Map

| Map | Min Level | Max Level |
|---|---|---|
| 1 (Brock) | 1 | 5 |
| 2 (Misty) | 8 | 15 |
| 3 (Lt. Surge) | 15 | 22 |
| 4 (Erika) | 22 | 30 |
| 5 (Koga) | 30 | 38 |
| 6 (Sabrina) | 38 | 44 |
| 7 (Blaine) | 44 | 48 |
| 8 (Giovanni) | 48 | 53 |
| Final (Elite Four) | 54 | 65 |

### Leveling Mechanics

- **After trainer/boss battles**: all surviving Pokemon (and those who participated) gain **+2 levels** (normal) or **+1 level** (Hard Mode)
- **After wild battles**: all participants gain **+1 level** (base) + Lucky Egg bonus (+1 if holder)
- **After legendary battles**: 0 bonus levels
- Level gain is capped at 100
- HP scales up proportionally on level-up: `currentHp += newMaxHp - oldMaxHp`
- Evolution check runs automatically after every level-up sequence (`checkAndEvolveTeam`)

### Evolution System

All Gen 1 evolutions are defined in `GEN1_EVOLUTIONS` — a flat lookup keyed by species ID.

- Stone evolutions and trade evolutions are converted to equivalent level thresholds
- Evolution triggers when `pokemon.level >= evo.level` after any level-up
- Animation plays (`evo-overlay`), then species data updates: types, baseStats, sprite, maxHp
- HP ratio is preserved across evolution (current/max ratio stays constant)
- Steelix (#208) and Scizor (#212) — both Gen 2 — are in the game as Onix and Scyther's evolution targets

**Eevee Special Case**: At level 36, Eevee shows the `eevee-choice-overlay` letting the player choose Flareon, Vaporeon, or Jolteon.

**Moon Stone usable item**: forces evolution on any eligible Pokemon regardless of current level.

**Key evolution chain highlights**:

| Chain | Levels |
|---|---|
| Caterpie → Metapod → Butterfree | 7 → 10 |
| Weedle → Kakuna → Beedrill | 7 → 10 |
| Bulbasaur → Ivysaur → Venusaur | 16 → 32 |
| Charmander → Charmeleon → Charizard | 16 → 36 |
| Squirtle → Wartortle → Blastoise | 16 → 36 |
| Dratini → Dragonair → Dragonite | — → 30 → 55 |
| Magikarp → Gyarados | 20 |

### Shiny System

- **Starters**: 1% chance (1/100) on starter selection
- **Question Mark nodes**: 12% base chance (if no hard mode win), doubles to 23% after a Hard Mode win
- **Shiny nodes**: guaranteed shiny — choose from random species pool for that map
- **Shiny sprite**: loaded from PokeAPI shiny CDN: `sprites/pokemon/shiny/{id}.png`
- **Shiny Pokédex**: tracked separately in `localStorage` under `poke_shiny_dex`
- **Completing the Shiny Dex** unlocks the "Shiny Hunter" achievement

### Move System (Move Pool)

Each type has 3 tiers of physical and special moves. A Pokemon uses exactly one move — its "best" move based on moveTier and whether it is a physical or special attacker.

**Physical vs Special determination**: if `baseStats.special >= baseStats.atk`, the Pokemon is a special attacker.

**moveTier progression**:
- Tier 0: weak moves (40–60 power) — assigned on maps 1–2 (`getMoveТierForMap` returns 0 for mapIndex <= 2)
- Tier 1: standard moves (65–110 power) — maps 3+ default
- Tier 2: powerful moves (100–150 power) — elite-tier; granted by Move Tutor nodes

**Move Tutor**: upgrades one Pokemon's moveTier by +1 (capped at 2). The player chooses which team member benefits.

**Multi-type Pokemon**: skips Normal type if the Pokemon also has another type; uses the more specific type's move pool.

**Struggle fallback**: if both sides can only use noDamage moves, or if a move has zero type effectiveness, Struggle is used (Power 50, typeless, always deals at least 1 damage).

---

## 3. Battle System

### Overview

Battles are **fully automated** (auto-battle). The player watches the animation and can press **Skip** to fast-forward (3x speed). There is no manual move selection.

The entire battle outcome is computed synchronously before any animation plays (`runBattle()` returns a complete `detailedLog`). The UI then plays back the log frame-by-frame.

### Battle Flow

1. Both teams are deep-copied (mutations don't affect `state.team` until battle resolves)
2. `runBattle()` computes the entire fight deterministically
3. If `autoSkipAllBattles` or `autoSkipBattles` (non-boss) is set, animation runs at 3x speed automatically
4. Player team HP is synced back from battle result
5. Level gains are applied
6. Evolution check runs
7. `onWin` or `onLose` callback fires

### Speed Determination

Each round, the **faster Pokemon attacks first** (ties go to player). Speed is an effective stat scaled by level and item bonuses.

### Damage Calculation Formula

```
base = floor((2 * level / 5 + 2) * power * atk / def / 50 + 2)
typed = floor(base * typeEffectiveness)   // 0, 0.5, 1, 2, or 4 for dual types
stab  = floor(typed * 1.5)               // if attacker shares move type
rng   = 0.85–1.0 (uniform)
final = max(1, floor(stab * rng))        // unless typeEff === 0 → always 0
```

Item multipliers are applied after STAB and before RNG (see Item System).

### Critical Hits

- **Base crit chance**: 6.25%
- **With Scope Lens or Razor Claw**: 20%
- **Crit damage multiplier**: 1.5x (applied before RNG)

### Type Effectiveness Chart

Full Gen 6+ chart (18 types including Dark, Steel, Fairy-adjacent). See `TYPE_CHART` constant in `data.js`. Key values: 0 (immune), 0.5 (not very effective), 1 (neutral), 2 (super effective). Dual-type defenders multiply both values (e.g. Water/Flying vs Electric = 2 × 1 = 2×).

### Air Balloon Exception

If the defender holds an Air Balloon and the move type is Ground, damage is forced to 0 (ignoring immunity calculation).

### Wild vs Trainer Battles

| Aspect | Wild Battle | Trainer Battle |
|---|---|---|
| Level gain | +1 base | +2 base (Normal) / +1 (Hard Mode) |
| Enemy team size | 1 Pokemon | 1 (map 1), 2 (maps 2–3), 3 (maps 4+) |
| Enemy items | None | None (NPC trainers have no held items) |
| Enemy portrait shown | No | Yes |
| Early map filter | Yes (avoids super-effective on layer 1) | No |
| Loss → game over | Yes | Yes |
| Level gain source | `baseGainOverride = 1` | `getLevelGain()` = 2 |

### Gym/Elite Boss Battles

- Enemy teams have held items (hardcoded in `GYM_LEADERS` and `ELITE_4`)
- Level gain = standard (+2 normal, +1 hard) — same callback as trainer battles
- Winning a gym battle awards a badge (`state.badges++`)
- Elite Four is sequential — losing mid-gauntlet sends to Game Over (no checkpoint save)

### Per-Pokemon Items in Battle

Player active Pokemon uses its own `heldItem` (not the bag). Enemy gym/elite Pokemon also have `heldItem`. The bag's `state.items` is only read for Lucky Egg XP bonus checks.

### End-of-Round Effects

After each exchange of attacks:
- **Leftovers**: active player Pokemon with Leftovers heals `floor(maxHp / 16)` HP

### Triggered Effects (mid-attack)

- **Life Orb recoil**: attacker loses `floor(maxHp * 0.1)` after dealing damage
- **Rocky Helmet**: attacker takes `floor(maxHp * 0.15)` when hitting a Rocky Helmet holder
- **Shell Bell**: attacker heals `floor(damage * 0.25)` on a hit
- **Focus Band**: 10% chance the defender survives a KO with 1 HP

### Ditto (Species #132)

Transforms into the active enemy Pokemon at the start of its first turn — copies types, baseStats, and sprite. The transformation is permanent for that battle.

### Max Rounds Safety

300-round cap to prevent infinite loops.

---

## 4. Map / Route System

### Structure

Each map is a **directed acyclic graph** (DAG) rendered as an SVG top-to-bottom node graph. Layers flow from top (start) to bottom (boss).

```
Layer 0: [START]               — always visited, player begins here
Layer 1: [CATCH] [BATTLE]      — forced first choice: catch or fight
Layers 2–7: random content     — sizes [3, 4, 3, 4, 3, 2]
Layer 8: [BOSS]                — gym leader or Elite Four entry
```

Total nodes per map: 1 + 2 + 3 + 4 + 3 + 4 + 3 + 2 + 1 = **23 nodes**

### Node Types

| Type | Icon Sprite | Description |
|---|---|---|
| `start` | — | Starting node, pre-visited |
| `battle` | `sprites/grass.png` | 1v1 wild Pokemon fight |
| `catch` | `sprites/catchPokemon.png` | Choose 1 of 3 wild Pokemon to add to team |
| `item` | `sprites/itemIcon.png` | Choose 1 of 2 items |
| `trainer` | Archetype sprite | NPC trainer battle (team of 1–3) |
| `boss` | Gym leader sprite | Gym leader or Elite Four entry |
| `pokecenter` | `sprites/Poke Center.png` | Full heal, instant map return |
| `legendary` | `sprites/legendaryEncounter.png` | Battle a random legendary; win to recruit it |
| `move_tutor` | `sprites/moveTutor.png` | Upgrade one Pokemon's moveTier by +1 |
| `trade` | `sprites/tradeIcon.png` | Trade a Pokemon for a random one 3 levels higher |
| `question` | `sprites/questionMark.png` | Resolves randomly (see below) |

### Question Mark Resolution

```
0–22%: battle
22–42%: trainer
42–52%: catch
52–65%: item
65–88% (or 65–70% with hard mode win): shiny
88–100% (or 70–100% with hard mode win): mega/item
```

### Edge Logic

Each node connects downward to 1–2 nodes in the next layer. When a node is visited, **all sibling nodes in the same layer become inaccessible** — the path not taken is locked. This creates meaningful branching.

The player can only click nodes marked `accessible && !visited`.

### Node Weight Tables (probability of each type appearing per content layer)

| Content Layer | battle | catch | item | trainer | question | pokecenter | move_tutor | trade | legendary |
|---|---|---|---|---|---|---|---|---|---|
| L1 | 25 | 30 | 15 | 30 | 0 | 0 | 0 | 0 | 0 |
| L2 | 20 | 20 | 15 | 30 | 10 | 0 | 0 | 5 | 0 |
| L3 | 16 | 14 | 12 | 27 | 13 | 0 | 9 | 9 | 0 |
| L4 | 13 | 12 | 10 | 27 | 13 | 9 | 8 | 8 | 0 |
| L5 | 13 | 10 | 8 | 27 | 18 | 9 | 8 | 7 | 0 |
| L6 | 20 | 9 | 14 | 18 | 9 | 30 | 0 | 0 | 0 |

On maps 5+, content layers 2+ also get `legendary: 6` weight added.

### Guaranteed Rules

- Layer 1 is always CATCH (left) + BATTLE (right)
- The final content layer (L6) always contains at least one Pokecenter
- Map 1, layer 1 catch node guarantees at least one Grass AND one Water Pokemon choice
- Full heal between maps (starting map 2+): `p.currentHp = p.maxHp` for all team members

### Trainer Archetypes (for Trainer nodes)

| Key | Name | Team Pool (Gen 1 IDs) |
|---|---|---|
| bugCatcher | Bug Catcher | Caterpie, Metapod, Butterfree, Weedle, Kakuna, Beedrill, Paras, Parasect, Venonat, Venomoth, Scyther, Pinsir |
| hiker | Hiker | Sandslash, Dugtrio, Machoke, Machamp, Graveler, Golem, Onix, Rhyhorn, Rhydon |
| fisher | Fisherman | Psyduck, Poliwag, Poliwhirl, Tentacool, Tentacruel, Seel, Dewgong, Shellder, Cloyster, Krabby, Kingler, Horsea, Seadra, Goldeen, Seaking, Magikarp, Gyarados |
| Scientist | Scientist | Magnemite, Magneton, Grimer, Muk, Gastly, Haunter, Gengar, Voltorb, Electrode, Porygon |
| teamRocket | Rocket Grunt | Rattata, Raticate, Ekans, Arbok, Zubat, Golbat, Meowth, Persian, Grimer, Muk, Koffing, Weezing |
| policeman | Officer | Growlithe, Arcanine |
| fireSpitter | Fire Trainer | Charmander, Charmeleon, Charizard, Vulpix, Ninetales, Growlithe, Arcanine, Ponyta, Rapidash, Electabuzz, Flareon |
| aceTrainer | Ace Trainer | Map BST pool |
| oldGuy | Old Man | Map BST pool |

---

## 5. Item System

### Item Categories

**Held Items** (assigned to a specific Pokemon, affect their battle stats):

| ID | Name | Effect |
|---|---|---|
| `life_orb` | Life Orb | +30% damage; holder loses 10% maxHP per hit |
| `choice_band` | Choice Band | +40% physical damage, -20% DEF |
| `choice_specs` | Choice Specs | +40% special damage, -20% Sp.Def |
| `choice_scarf` | Choice Scarf | +50% Speed |
| `muscle_band` | Muscle Band | +50% ATK & DEF if whole team is physical attackers |
| `wise_glasses` | Wise Glasses | +50% Sp.Atk & Sp.Def if whole team is special attackers |
| `metronome` | Metronome | +50% damage if every team member shares a type |
| `scope_lens` | Scope Lens | 20% crit chance |
| `razor_claw` | Razor Claw | 20% crit chance |
| `rocky_helmet` | Rocky Helmet | Attacker takes 15% maxHP on each hit |
| `shell_bell` | Shell Bell | Heal 25% of damage dealt |
| `eviolite` | Eviolite | +50% DEF & Sp.Def if not fully evolved |
| `assault_vest` | Assault Vest | +50% Sp.Def |
| `leftovers` | Leftovers | Restore 6% maxHP per round (end-of-round) |
| `expert_belt` | Expert Belt | +20% damage on super-effective hits |
| `focus_band` | Focus Band | 10% chance to survive a KO with 1 HP |
| `air_balloon` | Air Balloon | Immune to Ground moves |
| `lucky_egg` | Lucky Egg | +1 level after wild battles (stackable with base gain) |

**Type-boosting items** (+50% damage for their type):
`sharp_beak` (Flying), `charcoal` (Fire), `mystic_water` (Water), `magnet` (Electric), `miracle_seed` (Grass), `twisted_spoon` (Psychic), `black_belt` (Fighting), `soft_sand` (Ground), `silver_powder` (Bug), `hard_stone` (Rock), `dragon_fang` (Dragon), `poison_barb` (Poison), `spell_tag` (Ghost), `silk_scarf` (Normal)

**Usable Items** (kept in bag, consumed on use — can stack):

| ID | Name | Effect |
|---|---|---|
| `max_revive` | Max Revive | Fully revives a fainted Pokemon |
| `rare_candy` | Rare Candy | Gives a Pokemon +3 levels |
| `moon_stone` | Moon Stone | Forces evolution on any eligible Pokemon |

### Item Acquisition

- **Item nodes**: player chooses 1 of 2 randomly drawn items. Items already held (by bag or any Pokemon) are excluded from the pool (usable items can stack). Some items have `minMap` restrictions.
- **After swapping out a Pokemon**: its held item is returned to the bag
- **After a trade**: the released Pokemon's held item goes to the bag

### Item Equipping

- Non-usable items: player opens an equip modal, assigns item to a Pokemon or keeps in bag
- Swapping: if a Pokemon already holds an item, the displaced item goes to the bag
- Usable items: consumed from bag; player selects target Pokemon in a modal

### `minMap` Item Restrictions

Some items only appear in item pools starting from a specific map:

| Item | minMap |
|---|---|
| `lucky_egg` | 4 |
| `magnet` | 4 |
| `twisted_spoon` | 4 |
| `soft_sand` | 4 |
| `hard_stone` | 4 |
| `poison_barb` | 4 |
| `spell_tag` | 4 |
| `dragon_fang` | 6 |

---

## 6. Trainer / Gym System

### Gym Leaders (Maps 0–7)

| Map | Leader | Badge | Type | Team Size | Levels |
|---|---|---|---|---|---|
| 0 | Brock | Boulder Badge | Rock | 2 | 12, 14 |
| 1 | Misty | Cascade Badge | Water | 2 | 18, 21 |
| 2 | Lt. Surge | Thunder Badge | Electric | 3 | 18, 21, 24 |
| 3 | Erika | Rainbow Badge | Grass | 3 | 24, 29, 29 |
| 4 | Koga | Soul Badge | Poison | 4 | 37, 37, 39, 43 |
| 5 | Sabrina | Marsh Badge | Psychic | 4 | 37, 38, 38, 43 |
| 6 | Blaine | Volcano Badge | Fire | 4 | 40, 42, 42, 47 |
| 7 | Giovanni | Earth Badge | Ground | 5 | 42, 44, 45, 45, 50 |

Gym leader teams all have **held items** (specific, hardcoded).

### Elite Four (Map 8)

| # | Name | Type | Team Size | Levels |
|---|---|---|---|---|
| 1 | Lorelei | Ice | 5 | 53–56 |
| 2 | Bruno | Fighting | 5 | 53–58 |
| 3 | Agatha | Ghost | 5 | 54–58 |
| 4 | Lance | Dragon | 5 | 56–62 |
| 5 | Gary | Mixed (Champion) | 5 | 59–65 |

Elite Four battles use **moveTier 2** (strongest moves) for all enemy Pokemon. All Elite Four Pokemon have held items.

### Badge System

- `state.badges` increments on each gym win (0–8)
- Displayed as a strip of 8 badge icons on the map header (from PokeAPI badge sprites)
- 8 badges then triggers map 8 (Elite Four route) on "Next Map"
- No badge effects (Gen 1 obedience mechanics not implemented)

### How Gym Battles Differ

- Enemy teams have held items (wild/NPC trainers do not)
- `isBoss = true` flag → cannot be auto-skipped with the "skip non-boss" setting
- Trainer icon (gym leader) shown in battle header
- Win → Badge Screen instead of immediate map return
- Loss → Game Over (same as all other battles)

---

## 7. Trading System

### Mechanic

The trade system is single-player: an NPC offers a random Pokemon in exchange for one of the player's Pokemon.

- **Trigger**: player clicks a `trade` node on the map
- **Offer**: a random species from the map's BST catch pool, 3 levels higher than the traded Pokemon
- **Player action**: click any team member row to initiate the trade
- **Released Pokemon's held item**: automatically transferred to the player's bag
- **Result**: shown on the `shiny-screen` (repurposed as a "you received" reveal screen)
- **Optional**: player can Decline — clicking "Decline" advances past the node without a trade

### Trade as a Roguelike Mechanic

Trading is a risk/reward decision: the offered Pokemon is always 3 levels higher but is random (unknown type). The player gives up their chosen Pokemon permanently. This is the only way to get "free" level advantages mid-run without grinding.

---

## 8. Catch System

### Mechanic

Pokelike's catch system is not a "throw ball" mechanic — it is a **direct selection** of a wild Pokemon to recruit.

- **Trigger**: player clicks a `catch` node, or wins a `legendary` node
- **Choices**: 3 random Pokemon from the map's BST bucket, at the node's level
- **Player action**: click a Pokemon card to add it to the team
- **Team not full (< 6)**: Pokemon is added directly, node advances
- **Team full (= 6)**: `swap-screen` appears; player chooses which team member to release
- **Released Pokemon's held item**: returned to bag on swap
- **Skip option**: "Skip (flee)" on catch screen advances the node without catching anything

### Pokedex Integration

- Every caught Pokemon is recorded in `poke_dex` in localStorage
- A pokeball badge appears on Pokemon cards in the catch screen if already in the dex
- Catching all 151 unlocks the "Gotta Catch 'Em All" achievement and enables Hard Mode

### Catch Rate

There are no catch rate calculations. All presented Pokemon are guaranteed recruitable — the player simply chooses one.

### First Map Balancing

- **Battle node, layer 1, map 1**: enemies that are super-effective against the starter's type are filtered out. Fallback: Eevee (Normal type)
- **Catch node, layer 1, map 1**: at least one Grass and one Water Pokemon is guaranteed in the catch pool

### Legendary Catch

At a `legendary` node, the player **battles** the legendary Pokemon first. If they win, the legendary is added to the team (or triggers the swap screen). Legendaries appear only on maps 5+ and use moveTier 2 moves. No level gain is awarded from legendary battles.

---

## 9. Progression Model

### Run Structure

A single run consists of:
- 8 maps (vs 8 gym leaders) + 1 final map (vs Elite Four + Champion)
- The team is not reset between maps
- HP is fully restored at the start of each new map (starting from map 2)

### Roguelike Elements

- **Permadeath**: losing any battle ends the entire run
- **Branching path choice**: picking a node locks out its siblings — decisions are permanent
- **Node composition variety**: random weighted selection each map
- **BST-scaled encounters**: progressively stronger Pokemon pools per map
- **Items as runs-long upgrades**: items found persist for the whole run
- **No save mid-run**: `state` is memory-only; closing the browser loses the run

### Difficulty Scaling

Difficulty scales through:
1. **Level ranges**: enemies reach level 65 at the Champion
2. **Team sizes**: wild = 1, NPC trainers = 1–3, gym leaders = 2–5, Elite = 5
3. **BST buckets**: later maps guarantee higher-stat species
4. **Enemy held items**: gym leaders and Elite Four carry powerful items
5. **moveTier 2**: Elite Four Pokemon use the strongest move tier
6. **Fewer pokecenter nodes**: they only appear in content layers 4–6 with meaningful weight

### Hard Mode

Unlocked by completing the full Gen 1 Pokédex.

Changes:
- Level gain from trainer/boss battles: **+1** (instead of +2)
- Question Mark nodes: **shiny chance doubles** in all future runs after a Hard Mode win (persistent cross-run bonus)
- Winning Hard Mode unlocks the "True Master" achievement

### Cross-Run Persistence (localStorage)

| Key | Contents |
|---|---|
| `poke_dex` | Pokédex entries (caught status, sprite, types) |
| `poke_shiny_dex` | Shiny Pokédex entries |
| `poke_achievements` | Set of unlocked achievement IDs |
| `poke_elite_wins` | Integer count of championship wins |
| `poke_hall_of_fame` | Array of past winning team snapshots |
| `poke_settings` | `{ autoSkipLevelUp, autoSkipBattles, autoSkipAllBattles }` |
| `pkrl_poke_{id}` | Cached PokeAPI species data per ID |
| `pkrl_species_list` | Cached PokeAPI species name/ID list |

---

## 10. React Component Mapping

### Component Tree Overview

```
<App>
  <TitleScreen />
  <TrainerSelectScreen />
  <StarterSelectScreen />
  <MapScreen>
    <MapHeader />          — badge strip, wins counter, icons
    <HudBars>
      <TeamBar />          — hover to inspect, click to reorder, click held item to equip
      <ItemBar />          — click to equip or use
    </HudBars>
    <MapGraph />           — SVG DAG, node click handlers
    <MapNodeTooltip />     — hover tooltip
  </MapScreen>
  <BattleScreen>
    <BattleHeader />       — title, subtitle
    <BattleControls />     — Skip button, Continue button
    <BattleField>
      <BattleSide side="player" />
      <BattleSide side="enemy" />
    </BattleField>
    <BattleAnimCanvas />   — fixed-position canvas overlay
  </BattleScreen>
  <CatchScreen />
  <ItemScreen />
  <SwapScreen />
  <TradeScreen />
  <ShinyScreen />
  <BadgeScreen />
  <TransitionScreen />
  <GameOverScreen />
  <WinScreen />
  <EvoOverlay />           — fixed, z-index 200
  <EeveeChoiceOverlay />   — fixed, z-index 201
  <TeamHoverCard />        — fixed popup
  <Modals>
    <ItemEquipModal />
    <UsableItemModal />
    <MoveTutorModal />
    <PokedexModal />
    <AchievementsModal />
    <HallOfFameModal />
    <SettingsModal />
    <PatchNotesModal />
  </Modals>
</App>
```

### State Management

**Global game state** — lives in a single context or Zustand store:

```typescript
interface GameState {
  phase: 'title' | 'trainer' | 'starter' | 'map' | 'battle' | 'catch' | 
         'item' | 'swap' | 'trade' | 'shiny' | 'badge' | 'gameover' | 'win' | 'transition';
  currentMap: number;           // 0–8
  currentNode: MapNode | null;
  team: PokemonInstance[];      // max 6
  items: Item[];                // bag items
  badges: number;               // 0–8
  map: MapData | null;
  eliteIndex: number;           // which Elite Four member we're on
  trainer: 'boy' | 'girl';
  starterSpeciesId: number | null;
  maxTeamSize: number;          // tracking for solo-run achievement
  hardMode: boolean;
}
```

**Battle state** — local to BattleScreen, cleared after each battle:

```typescript
interface BattleState {
  playerTeam: PokemonInstance[];
  enemyTeam: PokemonInstance[];
  detailedLog: BattleLogEntry[];
  animationFrame: number;
  speedMultiplier: number;
  phase: 'animating' | 'levelup' | 'waiting' | 'done';
  playerWon: boolean;
}
```

**Persistent data** — separate hooks that read/write localStorage:
- `usePokedex()` — caught status, shiny dex
- `useAchievements()` — unlocked set
- `useSettings()` — speed/skip preferences
- `useHallOfFame()` — past winning runs

### Per-System Component Recommendations

| System | Components | Hooks |
|---|---|---|
| Navigation | `<ScreenRouter>` wrapping all screens, reads `phase` | `useGameState()` |
| Map graph | `<MapGraph>` (SVG renderer), `<MapNode>` | `useMap()`, `useMapNavigation()` |
| Battle engine | Pure function `runBattle()` in `/lib/battle.ts` | `useBattle()` — manages animation playback |
| Battle animation | `<BattleAnimCanvas>` using `requestAnimationFrame` | Internal canvas ref, `useBattleAnim()` |
| Pokemon data | `<PokemonCard>`, `<HpBar>`, `<TypeBadge>` | `usePokemonData(id)` — wraps PokeAPI fetch + localStorage cache |
| Team management | `<TeamBar>`, `<TeamSlot>` | `useTeam()` |
| Item system | `<ItemBar>`, `<ItemCard>`, `<ItemEquipModal>` | `useItems()` |
| Evolution | `<EvoOverlay>`, `<EeveeChoiceOverlay>` | `useEvolution()` — async, promise-based |
| Pokédex | `<PokedexModal>`, `<PokedexEntry>` | `usePokedex()` |
| Achievements | `<AchievementsModal>`, `<AchievementToast>` | `useAchievements()` |
| Type chart | Pure utility `getTypeEffectiveness()` in `/lib/types.ts` | None needed |
| Move selection | Pure utility `getBestMove()` in `/lib/moves.ts` | None needed |

### Real-time vs Static Rendering

| System | Update Pattern |
|---|---|
| Battle animation | `requestAnimationFrame` loop — real-time |
| HP bar animation | `requestAnimationFrame` per-bar tween |
| Level-up sequence | Async animation chain — sequential promises |
| Map SVG | Static re-render on node click |
| Team bar | Re-render on any team mutation |
| Item bar | Re-render on item pickup/equip |
| Pokédex modal | Static render (only opens between actions) |
| Toast notifications | CSS transition, timeout-based — no store |

### Key Architectural Decisions for React

1. **`runBattle()` must stay a pure function** — no side effects, takes teams and returns log. React renders the log.
2. **PokeAPI fetches need caching**: use `localStorage` (same as original) or React Query with localStorage persistence. The original busts stale cache entries missing the `special` stat — preserve this in the cache layer.
3. **Screen routing**: use a `phase` enum in global state, not React Router (the game has no URLs).
4. **Animation**: `useRef` on canvas element, `requestAnimationFrame` in `useEffect`. Clean up on unmount.
5. **Modal overlays**: render into a portal (`ReactDOM.createPortal`) — same visual layer model as the original's `document.body.appendChild`.
6. **Map generation**: `generateMap()` is a pure function — call once on map start, store result in game state.

---

## 11. Future Roadmap Ideas

### Short-Term Improvements

- **Sound effects**: attack sounds keyed by move type; level-up jingle; evolution fanfare; gym victory music. Use Web Audio API or Howler.js.
- **Better animations**: Pokemon sprite shake on hit; flash effect; smoother HP bar tweens with easing curves; evolution particle burst.
- **Mobile responsiveness**: the current SVG map layout is fixed-width. Needs touch-friendly node sizes, swipe-to-inspect on team bar, and a bottom-sheet pattern for item/catch choices on small screens.
- **Save system improvements**: save run state to localStorage between sessions (the current in-memory state is lost on refresh). Requires serializing the full `state` object. Guard against stale/corrupt saves.
- **Nickname system**: the `nickname` field exists on every Pokemon instance but the UI never sets it. Add a rename button on team members.
- **Battle log viewer**: a collapsible text log of the last battle for players who want to review what happened.
- **Accessible type badges**: add ARIA labels and color-blind-friendly icons to type badges (current implementation is color-only).
- **Settings expansion**: animate/no-animate toggle for low-performance devices; font size scaling; high-contrast mode.
- **Run statistics screen**: display team stats, total battles won, Pokemon caught, items used per run on the win/game-over screen.

### Long-Term Features

- **Multiplayer trading**: real-time Pokemon trades between players via WebSocket. Could use the existing trade node as an entry point — instead of NPC, connect to another live player's run.
- **Leaderboards**: track fastest Elite Four wins (fewest nodes visited), highest badge count, most challenging runs (fewest team members). Requires a backend or service like Firebase.
- **Daily challenges**: a seeded daily run where all players get the same map layout and encounter sequence. Leaderboard for daily run completion time/score.
- **More Pokemon generations**: Gen 2 and Gen 3 Pokemon pools. Would require BST-calibrating the new catch buckets, adding new evolution chains, and extending the type chart (Fairy type for Gen 6 changes already partially handled).
- **Abilities**: a simplified ability system — 1 passive ability per Pokemon (e.g. Intimidate lowers enemy ATK, Blaze boosts Fire damage below 1/3 HP). Would require extending `PokemonInstance` and `runBattle()`.
- **Held item for enemies**: NPC trainer battle Pokemon could have random held items (currently only gym/elite leaders have them).
- **Double battles**: 2v2 format for select nodes (requires significant battle engine rework — target selection, multi-hit moves, spread moves).
- **Online features**: async challenge mode — send your current team composition as a "challenge code" for another player to try to beat.
- **Additional starter options**: per-generation starter unlocks (Gen 2: Chikorita/Cyndaquil/Totodile) as a meta-progression reward after completing the Pokédex.
- **Gym rematches**: after the first Elite Four win, rematched gym leaders use higher-level, item-laden teams.
- **Held item crafting / fusion**: combine two type-boost items into a Mega Stone equivalent for a Gen 1 Pokemon.
- **Regional forms**: Alolan variants of Gen 1 Pokemon (already on PokeAPI) as rare catch alternatives with different typings.
