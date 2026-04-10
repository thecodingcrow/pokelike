# Team Management UX Spec

> Stats viewing, item management, pokemon reordering — responsive across desktop and mobile.

## Core Principle

- **Desktop (≥640px)**: Hover popovers — rich information on hover, actions on click
- **Mobile (<640px)**: Tap opens bottom-up drawer — full stats + actions in a slide-up panel

---

## 1. Desktop: Enhanced Hover Popover

**Trigger:** `mouseenter` on a TeamBar slot (already exists as `TeamHoverCard`).

**Current state:** Shows PokemonCard with sprite, name, level, types, HP bar, held item name.

**Enhanced popover content (top to bottom):**

```
┌─────────────────────────────┐
│  [sprite 48px]  CHARMANDER  │
│  Lv. 12    FIRE             │
│  ████████████░░░  042/048   │
│                             │
│  ── Stats ──────────────────│
│  HP  48  ATK 52  DEF 43    │
│  SPD 65  SP  60             │
│                             │
│  ── Move ───────────────────│
│  Flamethrower  ⚡ 90  SP    │
│                             │
│  ── Held Item ──────────────│
│  🥚 Lucky Egg    [Unequip] │
└─────────────────────────────┘
```

- **Base stats:** 2-row compact grid — HP/ATK/DEF on row 1, SPD/SP on row 2. VT323 14px, values in `#f0ead6`, labels in `#c8a96e`.
- **Move:** The pokemon's best move (from `getMove()`). Show name, power, category (Physical/Special). Type-colored background pill.
- **Held item:** Name + icon. "Unequip" button (returns item to bag). Only shown if `heldItem !== null`.
- **No action buttons for reorder** — desktop uses drag-and-drop (already works).

**Positioning:** Anchored above the hovered slot. Clamped to viewport edges (existing logic).

**Styling:** `#0d110e` bg, `2px solid #c8a96e` border, `3px 3px 0 #050805` shadow. Max-width 220px.

---

## 2. Mobile: Tap-to-Open Bottom Drawer

**Trigger:** `onTouchEnd` / `onClick` on a TeamBar slot (mobile only, <640px).

**The drawer slides up from the bottom of the screen.**

### Drawer layout:

```
┌──────────────────────────────────────┐  ← drag handle bar
│         ── CHARMANDER ──             │
│  [sprite 64px]     Lv. 12           │
│                    FIRE              │
│  ████████████████░░░░  042/048      │
│                                      │
│  ┌─ Stats ─────────────────────────┐ │
│  │ HP  48 │ ATK 52 │ DEF 43       │ │
│  │ SPD 65 │ SP  60 │              │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Move ──────────────────────────┐ │
│  │ Flamethrower   ⚡ 90   Special  │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Held Item ─────────────────────┐ │
│  │ 🥚 Lucky Egg       [Unequip]   │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Actions ───────────────────────┐ │
│  │  [◀ Move Up]    [Move Down ▶]  │ │
│  └─────────────────────────────────┘ │
│                                      │
│            [Close]                   │
└──────────────────────────────────────┘
```

### Drawer behavior:
- Slides up with 250ms ease-out animation
- Semi-transparent scrim behind (40% black) — tap scrim to dismiss
- Drag handle at top (swipe down to dismiss)
- Max height: 70vh. Scrollable if content overflows.
- `z-index: 90` (below modals at 100)

### Content sections:

**Header:** Sprite (64px), name (Press Start 2P 10px), level (JetBrains Mono 12px), type badges. Shiny sparkle if applicable.

**Stats grid:** 2×3 grid of stat labels + values. Same as desktop popover but larger text (VT323 18px values, 14px labels).

**Move:** Pokemon's best move. Name, power number, category badge (Physical = orange pill, Special = blue pill). Type-colored left border.

**Held item:** Name + icon + "Unequip" button. If no item, show "No held item" in muted text.

**Actions:**
- "Move Up" / "Move Down" buttons — reorder the pokemon in the team. These replace drag-and-drop on mobile. Disabled at boundaries (first pokemon can't move up, last can't move down).
- Both buttons are 44×44px minimum touch target.

---

## 3. Pokemon Reordering

**Desktop:** Keep existing drag-and-drop (HTML5 DnD). Already works.

**Mobile:** "Move Up" / "Move Down" buttons in the bottom drawer. Each press:
1. Swaps the pokemon with its neighbor in the team array
2. Updates the drawer to reflect new position
3. Drawer stays open on the same pokemon

**Implementation:** New `moveTeamMember(fromIdx, toIdx)` action in `gameStore` (or reuse `swapTeamMember`).

---

## 4. Item Management Fixes

### 4a: Usable item routing
`MapScreen.handleItemClick` must check `item.isUsable`:
- If `true` → open `'usable-item'` modal with the item
- If `false` → open `'item-equip'` modal (current behavior)

### 4b: Unequip from popover/drawer
"Unequip" button on held item section:
1. Removes `heldItem` from the pokemon
2. Returns the item to the bag (via new `unequipItem(pokemonIdx)` action in `gameStore`)
3. UI updates reactively

### 4c: Equip-over returns displaced item
When equipping an item to a pokemon that already holds one:
- The displaced item goes back to the bag (not silently dropped)
- Fix in `gameStore.equipItem`: before overwriting `heldItem`, push the old item back into `items` array

---

## 5. Stats Data Source

**Base stats:** Already on `PokemonInstance.baseStats` — `{ hp, atk, def, speed, special, spdef }`.

**Move:** Call `getMove(pokemon)` from `systems/battle-calc.ts`. Returns `{ name, power, type, category }`. This is the move the pokemon would use in battle. Import and call at render time (it's a pure function, no side effects).

---

## 6. New Components

### `PokemonDrawer` (mobile bottom drawer)
- New file: `src/components/ui/PokemonDrawer.tsx`
- Props: `pokemon: PokemonInstance | null`, `teamIndex: number`, `onClose: () => void`, `onMoveUp: () => void`, `onMoveDown: () => void`, `onUnequip: () => void`, `canMoveUp: boolean`, `canMoveDown: boolean`
- Renders only when `pokemon !== null`
- Uses `createPortal(content, document.body)` for proper stacking

### Enhanced `TeamHoverCard` (desktop popover)
- Modify existing `src/components/hud/TeamHoverCard.tsx`
- Add: stats grid, move info, unequip button
- Keep existing anchor positioning logic

### `gameStore` additions
- `unequipItem(pokemonIdx: number)` — removes held item, returns to bag
- Fix `equipItem` — return displaced item to bag before overwriting

---

## 7. Integration Points

### TeamBar changes:
- Desktop: hover behavior unchanged (triggers `TeamHoverCard`)
- Mobile: `onClick` on a slot opens `PokemonDrawer` with that pokemon
- Pass `selectedIndex` state + `onSelect` callback for drawer

### MapScreen changes:
- Hold `drawerPokemonIdx` state
- Pass to `PokemonDrawer`
- Fix `handleItemClick` routing for usable items

---

## 8. Out of Scope

- Battle animations (separate spec)
- Detailed move list (pokemon only has one move in this game)
- EV/IV display (doesn't exist in this game)
- Pokemon release/abandon from team
