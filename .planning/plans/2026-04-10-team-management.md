# Team Management UX — Implementation Plan

> **Spec:** `.planning/specs/2026-04-10-team-management-ux.md`

---

## Phase 1: Store fixes + Enhanced hover card (desktop)

### Batch 1: 1 sonnet coder + 1 opus reviewer

**Task 1: Store fixes**
- `gameStore.ts`: Add `unequipItem(pokemonIdx)` — removes heldItem, returns to bag
- `gameStore.ts`: Fix `equipItem` — return displaced item to bag before overwriting
- `MapScreen.tsx`: Fix `handleItemClick` — route usable items to `'usable-item'` modal

**Task 2: Enhanced TeamHoverCard**
- `TeamHoverCard.tsx`: Add base stats grid (HP/ATK/DEF/SPD/SP), move info (name, power, category), unequip button
- Import `getMove` from `systems/battle-calc.ts` for move data
- Styling: warm theme, VT323 14px values, #c8a96e labels

**Quality gate:** `tsc -b && pnpm test`

---

## Phase 2: Mobile bottom drawer + reordering

### Batch 2: 1 sonnet coder + 1 opus reviewer

**Task 3: PokemonDrawer component**
- New file: `components/ui/PokemonDrawer.tsx`
- Bottom-up slide drawer with: sprite, name, level, types, HP bar, stats grid, move info, held item + unequip, Move Up/Move Down buttons
- `createPortal` to body, scrim behind, swipe-to-dismiss
- 250ms ease-out animation, max-height 70vh

**Task 4: Wire into TeamBar + MapScreen**
- `TeamBar.tsx`: On mobile click → open drawer (pass pokemon + index)
- `MapScreen.tsx`: Hold `drawerPokemonIdx` state, render `PokemonDrawer`
- Move Up/Down call `swapTeamMember` to reorder

**Quality gate:** `tsc -b && pnpm test`

---

## Summary

| Phase | Tasks | Agents |
|-------|-------|--------|
| 1 | Store fixes + hover card | 1 sonnet + 1 opus |
| 2 | Mobile drawer + wiring | 1 sonnet + 1 opus |
