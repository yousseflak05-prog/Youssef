# Assets

Every sprite in Hunter Ascension is **drawn in code at runtime** by
[`systems/TextureFactory.js`](../systems/TextureFactory.js). The PNGs in this
folder are exports of exactly those generated textures — they are here as
**sample placeholders**: reference sheets you can open in Aseprite/Piskel/GIMP,
paint over, and load instead of the generated ones.

Nothing in this folder is loaded by the game by default. The game runs with zero
network requests for art, which is why it works from `file://` and never 404s.

## Swapping in your own art

1. Draw over a PNG here (or make a new one at the same dimensions).
2. Load it in `scenes/BootScene.js` → `preload()` using the **same texture key**.
3. Delete the matching `build*` call in `TextureFactory.generateAll()` — or just
   let `preload()` win, since a loaded texture with that key is used as-is once
   you remove the generator call for it.

```js
// scenes/BootScene.js
preload() {
  this.load.spritesheet('player', 'assets/player.png', { frameWidth: 32, frameHeight: 32 });
  this.load.image('tiles', 'assets/tiles.png');
}
```

## Texture contract

| Key | File | Size | Frames | Notes |
|---|---|---|---|---|
| `tiles` | `tiles.png` | 448×32 | 14 × 32×32 | Tileset. Frame order must match `TextureFactory.TILE` |
| `player` | `player.png` | 256×32 | 8 × 32×32 | 0–1 walk down, 2–3 walk up, 4–5 walk side, 6 attack down, 7 attack side |
| `enemy_imp` | `enemy_imp.png` | 64×32 | 2 × 32×32 | idle bob |
| `enemy_wolf` | `enemy_wolf.png` | 64×32 | 2 × 32×32 | idle bob |
| `enemy_golem` | `enemy_golem.png` | 64×32 | 2 × 32×32 | idle bob |
| `enemy_knight` | `enemy_knight.png` | 64×32 | 2 × 32×32 | mini boss, drawn at 2.6× in-game |
| `portal` | `portal.png` | 576×128 | 6 × 96×128 | blue gate loop |
| `building_home` … `building_guild` | `building_*.png` | 96×80 | single | origin is bottom-centre (the doorway) |
| `icon_*` | `icon_*.png` | 16×16 | single | inventory / HUD icons |
| `fx_spark` | `fx_spark.png` | 8×8 | single | particle |
| `fx_slash` | `fx_slash.png` | 48×48 | single | attack arc, rotated to face |
| `fx_shadow` | `fx_shadow.png` | 24×12 | single | drop shadow under the hunter |
| `fx_barrier` | `fx_barrier.png` | 32×96 | single | dungeon room barrier |

## Tileset frame order

| Index | Tile | Solid |
|---|---|---|
| 0 | grass | |
| 1 | grass (flowers) | |
| 2 | dirt path | |
| 3 | stone plaza | |
| 4 | water | ✔ |
| 5 | tree | ✔ |
| 6 | rock | ✔ |
| 7 | dungeon floor | |
| 8 | dungeon floor (cracked) | |
| 9 | dungeon wall | ✔ |
| 10 | rubble | |
| 11 | void | ✔ |
| 12 | dungeon rune | |
| 13 | fence | ✔ |

Solid indices live in `TextureFactory.SOLID_TILES`; change that array if your
tileset uses a different order.

## Audio

There is no audio in the prototype. `BaseWorldScene.sfxWhiff()` is a deliberate
hook: drop `this.load.audio(...)` calls into `BootScene.preload()` and play them
from the combat methods.
