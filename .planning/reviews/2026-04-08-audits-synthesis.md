# Audit Synthesis — Sprites, Math, Utils

## Sprites & Assets Audit

**All local sprites present and valid** — 12 PNGs in `original/sprites/`, all verified.

**PokeAPI sprites accessible** — tested IDs 1, 25, 151, 208, 212 (normal + shiny). All 200 OK.

**Trainer sprites (Showdown CDN) accessible** — red, dawn, brock, youngster all 200 OK.

**Font (Press Start 2P) accessible** — Google Fonts URL works.

**No missing assets** for the current game scope.

## Math Formula Audit

| Formula | Status | Notes |
|---------|--------|-------|
| HP: `floor(baseHp * level / 50) + level + 10` | MATCH | Identical to original |
| Effective stat: `floor(baseStat * level / 50) + 5` | MATCH | All item mods identical |
| Damage: `floor((2*lvl/5+2)*power*atk/def/50+2)` | MATCH | Intentional fix: uses `move.isSpecial` instead of re-deriving |
| STAB 1.5x, type effectiveness, crits 1.5x, RNG 0.85-1.0 | MATCH | All multipliers verified |
| Item effects (Life Orb, Choice Band/Specs/Scarf, etc.) | MATCH | All line-for-line identical |
| Level gain (+2 trainer, +1 wild, Lucky Egg +1) | MATCH | Hard mode verified |
| BST ranges and level ranges | MATCH | All 9 map tiers correct |
| Evolution thresholds | MATCH | Spot-checked 10 chains |

## Utils Isolation Audit

### Must Fix
1. **`calcHp` is duplicated** in 3 files: battle.ts, evolution.ts, pokeapi.ts. Now exported from battle-calc.ts — other files should import from there.

2. **`Math.random()` is hardcoded** in calcDamage (crits, RNG variance) and runBattle (Focus Band). Cannot deterministically test these paths. Should accept optional `rng` parameter.

3. **Key private functions should be exported for testing:**
   - `getTypeEffectiveness` — critical game mechanic
   - `hasItem` — used in 10+ places
   - `getTypeBoostItem` — subtle bug surface
   - `weightedRandom` in map.ts — needs injectable RNG

### No Circular Dependencies Found
- systems/ does NOT import from store/
- store/ imports from systems/ (map generation) — one-directional, correct
- machines/ imports from both store/ and systems/ — correct direction

### No Type Issues
- All `import type` usage is correct
- No runtime values imported as type-only
