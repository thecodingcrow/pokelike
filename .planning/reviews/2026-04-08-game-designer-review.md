# Game Designer Review

## CRITICAL

1. **No animation playback system in Phase 1.** Without it, battles resolve instantly — core gameplay loop feels broken. Need `useBattlePlayback` hook that steps through `detailedLog`. MVP: HP drain (steps(8)), damage shake, faint fade, send-out slide. Canvas projectiles can wait for Phase 2.

## HIGH

2. **HP bar drain contradicts design system.** Design system says `transition-none` everywhere but HP bars need `steps(8)` animation. The CSS already has it right but component JSX example is wrong. Fix the example.

3. **Difficulty spike at Gym 5 (Koga).** ~10 level gap with Leftovers + Rocky Helmet. Brutal on Hard Mode. Either add guaranteed Pokecenter before layer 7 on maps 4-5, or reduce Koga's Weezing to level 40.

4. **Roguelike identity is thin.** No meaningful build decisions since battles are auto. No item synergies. No run modifiers/seeds. Lean into item synergies as primary decision space. Add synergy tooltips. Consider daily seed mode later.

## MEDIUM

5. **Air Balloon immunity applied backwards.** (Duplicate of engine review #6) Checks attacker's items instead of defender's. (battle.ts:157)

6. **No error handling for PokeAPI failures.** Machine silently breaks if API is down during starter select. Need `fetchError` state with retry + offline fallback from localStorage cache.

7. **Zero accessibility tasks.** Minimum: aria-labels on interactives, aria-live region for battle log, keyboard nav for map nodes, text alongside type colors.

## LOW

8. **Sound design omission.** 3 sounds would massively improve feel: hit impact, level-up jingle, evolution fanfare. Spec a `useSfx` hook now, implement in Phase 2 with Web Audio API generated tones.
