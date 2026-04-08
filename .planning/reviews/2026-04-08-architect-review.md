# Software Architect Review

## CRITICAL

1. **Duplicated actions — gameMachine.ts inlines everything, actions.ts is dead code.** Both files define the same logic. Pick one approach: either machine imports from actions.ts, or delete actions.ts. (gameMachine.ts:180-331, actions.ts:50-65)

## HIGH

2. **Machine reads localStorage directly, bypasses Zustand.** `resolveNodeType` reads `localStorage.getItem('poke_hard_mode_wins')` — a key that doesn't even exist in the persistence store. Should use `usePersistenceStore.getState().hasHardModeWin()`. (gameMachine.ts:192-196)

3. **`teamFull` snapshot goes stale.** Snapshotted on CLICK_NODE but checked later after MAKE_CHOICE. If team changed between those events, guard is wrong. Should read store at decision time, not from cached context. (gameMachine.ts:199, 660, 722)

4. **`runBattle` actor mutates Zustand inside fromPromise.** Actors should return data; side effects belong in `onDone` actions. Couples actor to store, makes it untestable. (gameMachine.ts:458-460)

## MEDIUM

5. **`choices` union type is untagged.** `PokemonInstance[] | Item[]` with no discriminator. Consumers must guess. Add discriminated wrapper: `{ kind: 'pokemon'; list } | { kind: 'item'; list }`. (gameMachine.ts:49)

6. **guards.ts is also dead code.** Exports standalone functions never imported by the machine, which defines all guards inline. (guards.ts:1-122)

7. **No per-key corrupt-data recovery in persistence.** One corrupt key wipes ALL progress silently. Parse each key independently with per-key fallback. (persistenceStore.ts:209)

8. **Build deps in wrong section.** `tailwindcss`, `@tailwindcss/vite`, `shadcn`, `tw-animate-css` should be devDependencies. (package.json)

## LOW

9. **React re-render risk.** `useMachine()` at App level re-renders entire tree. Use `createActor()` + context + `useSelector()` for granular subscriptions.

10. **Unused `_get` workaround.** Just remove the param from the Zustand `create` callback entirely. (gameStore.ts:73)
