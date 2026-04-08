# Sprite URL Reference

## PokeAPI Sprites (enumerable by ID)

All Pokemon sprites are available from the PokeAPI GitHub repo:

- **Normal:** `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`
- **Shiny:** `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/{id}.png`

IDs range from 1–1350 (includes all forms, megas, regional variants, G-max, etc.)
Game uses Gen 1 (1–151) plus cross-gen evolutions: Steelix (208), Scizor (212), Crobat (169), Espeon (196), Umbreon (197), etc.

## Trainer Sprites (Pokemon Showdown)

- **Template:** `https://play.pokemonshowdown.com/sprites/trainers/{name}.png`
- **Known trainers:** dawn, red

## Game-specific Sprites (pokelike.xyz)

Stored locally in `/original/sprites/`:
- Poke Center.png, Scientist.png, aceTrainer.png, brock.png
- catchPokemon.png, fireSpitter.png, fisher.png, grass.png
- hiker.png, policeman.png, teamRocket.png, tradeIcon.png

## Font

- **Press Start 2P:** `https://fonts.gstatic.com/s/pressstart2p/v16/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2`

## Cached Pokemon Data Structure (from localStorage)

```json
{
  "id": 98,
  "name": "Krabby",
  "types": ["Water"],
  "baseStats": {
    "hp": 30,
    "atk": 105,
    "def": 90,
    "speed": 50,
    "special": 25,
    "spdef": 25
  },
  "bst": 325,
  "spriteUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/98.png",
  "shinySpriteUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/98.png"
}
```

Note: Uses Gen 1 stat split (special + spdef separate), not the unified "special" from RBY.

## Full Pokemon List

The page caches the complete PokeAPI species list (1350 entries) in localStorage key.
Full list stored in `pokemon-list-full.json`. For the game rebuild, only IDs 1-151 + cross-gen evos are needed.
