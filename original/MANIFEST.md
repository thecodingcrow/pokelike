# pokelike.xyz Source Manifest

All files downloaded from https://pokelike.xyz/ on 2026-04-08.
Download used: `curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`

---

## Hosted Files (downloaded)

### HTML

| File | Source URL | Size (bytes) |
|------|-----------|-------------|
| `index.html` | https://pokelike.xyz/ | 8,771 |

### CSS

| File | Source URL | Size (bytes) |
|------|-----------|-------------|
| `css/style.css` | https://pokelike.xyz/css/style.css | 41,851 |

### JavaScript (load order matters)

| # | File | Source URL | Size (bytes) |
|---|------|-----------|-------------|
| 1 | `js/data.js` | https://pokelike.xyz/js/data.js | 54,680 |
| 2 | `js/map.js` | https://pokelike.xyz/js/map.js | 17,777 |
| 3 | `js/battle.js` | https://pokelike.xyz/js/battle.js | 15,938 |
| 4 | `js/ui.js` | https://pokelike.xyz/js/ui.js | 106,211 |
| 5 | `js/game.js` | https://pokelike.xyz/js/game.js | 43,213 |

### Sprites (from pokelike.xyz/sprites/)

| File | Source URL | Size (bytes) | Valid PNG |
|------|-----------|-------------|-----------|
| `sprites/Poke Center.png` | https://pokelike.xyz/sprites/Poke%20Center.png | 2,260 | yes |
| `sprites/Scientist.png` | https://pokelike.xyz/sprites/Scientist.png | 692 | yes |
| `sprites/aceTrainer.png` | https://pokelike.xyz/sprites/aceTrainer.png | 721 | yes |
| `sprites/brock.png` | https://pokelike.xyz/sprites/brock.png | 635 | yes |
| `sprites/catchPokemon.png` | https://pokelike.xyz/sprites/catchPokemon.png | 743 | yes |
| `sprites/fireSpitter.png` | https://pokelike.xyz/sprites/fireSpitter.png | 711 | yes |
| `sprites/fisher.png` | https://pokelike.xyz/sprites/fisher.png | 719 | yes |
| `sprites/grass.png` | https://pokelike.xyz/sprites/grass.png | 845 | yes |
| `sprites/hiker.png` | https://pokelike.xyz/sprites/hiker.png | 707 | yes |
| `sprites/policeman.png` | https://pokelike.xyz/sprites/policeman.png | 644 | yes |
| `sprites/teamRocket.png` | https://pokelike.xyz/sprites/teamRocket.png | 655 | yes |
| `sprites/tradeIcon.png` | https://pokelike.xyz/sprites/tradeIcon.png | 746 | yes |

---

## External Resources (not downloaded — fetched at runtime)

### Pokemon Sprites (PokeAPI)

- **Pattern:** `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`
- **Range used by game:** IDs 1–151 (Generation I / Kanto)
- **Example:** https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png

### Trainer Sprites (Pokemon Showdown)

- **Pattern:** `https://play.pokemonshowdown.com/sprites/trainers/{name}.png`
- **Known names used:** `dawn.png`, `red.png`
- **Example:** https://play.pokemonshowdown.com/sprites/trainers/red.png

### Font (Google Fonts / gstatic)

- **Family:** Press Start 2P
- **Loaded via:** `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap')` in `css/style.css`
- **Woff2 file:** https://fonts.gstatic.com/s/pressstart2p/v16/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2
