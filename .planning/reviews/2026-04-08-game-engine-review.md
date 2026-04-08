# Game Engine Expert Review

## CRITICAL

1. **Elite Four flow is broken** — `transition` state is unreachable. After beating E4 member 1, machine goes to `badge` → `map` instead of `transition` → next E4 battle. Need `isEliteFourNotComplete` guard that fires before `isBossBattle` in `battle.result` always block, targeting `#game.transition`. (gameMachine.ts:630,752)

## HIGH

2. **Physical/special split uses attacker stats, not move category** — `calcDamage` re-derives `isSpecial` from base stats instead of using `move.isSpecial`. Wrong stats used if move category disagrees with attacker profile. (battle.ts:122)

3. **Ditto transform doesn't copy moveTier** — Transformed Ditto always uses moveTier 0 (weakest moves) regardless of target's tier. (battle.ts:278-288)

4. **advanceNode doesn't update DAG** — `gameStore.advanceNode` only sets `currentNode` but never calls `advanceFromNode()`. Siblings never lock, children never unlock. Map freezes after first move. (gameStore.ts:126-129)

5. **startMap doesn't generate map** — `startMap` clears state but never calls `generateMap()`. Map stays null. (gameStore.ts:122-123)

## MEDIUM

6. **Air Balloon checks wrong side** — Checks attacker's items instead of defender's. Ground immunity applies to wrong Pokemon. (battle.ts:157)

7. **Shallow copy lets Ditto mutate original team** — `{ ...p }` doesn't deep-copy `baseStats`, `types`, or `heldItem`. Ditto's transform writes through to source objects. (battle.ts:236)

8. **MAX_ROUNDS stalemate** — 300-round timeout returns `playerWon=false` with misleading "Defeat!" log. (battle.ts:482)

## LOW

9. **Question mark shiny rate (23%)** is very generous for a "rare" encounter. Validate against design intent. (gameMachine.ts:106-115)

10. **Missing test categories** — Plan omits: DAG reachability guarantee, Elite Four sequencing, item equip interactions, Magikarp/Abra Struggle fallback, evolution during Elite Four.
