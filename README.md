# Hunter Ascension

A browser-based 2D pixel RPG in the spirit of Solo Leveling, Pokémon and classic
Zelda — with one twist: **your hunter levels up from work you actually do.**

You play **Youssef**, an E-rank hunter in Ascension Town. Clear the Blue Gate for
XP, gold and loot — and log real-life tasks (study, workout, deep work, reading)
in the Daily Quest panel to permanently raise Strength, Intelligence, Agility and
Discipline. Each task can only be logged once per calendar day, so the only way
to grow the character is to keep showing up.

No build step. No backend. No accounts. Open `index.html` and play.

---

## Quick start

```bash
git clone <this-repo>
cd hunter-ascension

# any static server works — pick one:
python3 -m http.server 5173     # then open http://localhost:5173
npx serve . -l 5173
npm start                       # same as `npx serve`
```

You can also just **double-click `index.html`** — Phaser is vendored and all art
is generated in code, so the game runs from `file://` with no network at all.
(A local server is still recommended; some browsers restrict `localStorage` on
`file://`, which would disable saving.)

**Requirements:** any modern browser (Chrome/Edge/Firefox/Safari, desktop or
mobile). No Node.js needed to play — it is only there for the convenience server.

---

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | `WASD` / arrow keys | left thumbstick |
| Attack | `Space` or `J` | ⚔ button |
| Interact / confirm | `E` or `Enter` | `E` button |
| Quick-drink a potion | `H` | Bag → Use |
| Daily Quests | `Q` | 📜 Quests |
| Inventory | `I` or `B` | 🎒 Bag |
| Status window | `C` | 📊 Status |
| System menu | `Esc` | ⚙️ System |

Add `?debug=1` to the URL to switch on Arcade Physics body outlines.

---

## What's in the game

**Town.** Home (rest + save), Training Hall (buy Strength/Agility), Library (buy
Intelligence/Discipline, read the gate archive), Guild Hall (shop, healing, rank
licence) and the Dungeon Gate. Walk up to any of them and press `E`.

**Daily quests.** Study, Workout, Deep Work Session, Reading. Press *Complete*
after you've done the real thing. Each pays XP, gold and stat points, locks for
the rest of the day, and clearing all four grants a perfect-day bonus and extends
your streak.

**Levels and ranks.** XP requirements scale as `80·level^1.35 + 40·level`. Every
level grants 3 stat points, a full heal and a level-up animation. Ranks E → D →
C → B → A → S unlock at levels 1/5/10/18/28/40.

**Dungeon.** The Blue Gate: three rooms sealed behind mana barriers, three enemy
types (Shadow Imp, Gate Wolf, Stone Golem) and the Shadow Knight mini boss. Clear
it for XP, gold and rolled loot — and to unlock the next difficulty tier (Normal
→ Hard → Nightmare → Abyssal → Monarch), each scaling enemies ×1.55 and rewards
×1.4 per tier.

**Combat.** Real-time melee. Damage is `attack × rand(0.9–1.12) − defense × 0.6`,
crits multiply by 1.8. Enemies chase inside their aggro range and hit on contact.
Dying drops 10% of your gold and drags you back to town at half HP.

**Inventory.** Iron Sword, Shadow Dagger, Hunter Armor, Health Potion — equip,
use, buy and sell, with a rarity tier already threaded through the UI and loot
rolls.

**Saving.** Everything (stats, XP, gold, inventory, equipment, position, quest
log, streaks, dungeon progress) autosaves to `localStorage` every 10 seconds and
on every meaningful event, plus on tab hide and unload. The System menu can copy
a save code to the clipboard and restore one on another device.

---

## Project structure

```
hunter-ascension/
├── index.html              # DOM shell: canvas mount + HUD/panels markup
├── main.js                 # bootstraps the DOM UI, then the Phaser game
├── css/style.css           # HUD, modals, touch controls, responsive rules
├── vendor/phaser.min.js    # Phaser 3.80.1, vendored so it runs offline
├── data/                   # pure data — no logic, safe to re-balance
│   ├── config.js           #   tunables: speeds, cooldowns, costs, palette
│   ├── ranks.js            #   rank table + XP curve
│   ├── items.js            #   item database + rarity tiers
│   ├── enemies.js          #   enemy archetypes
│   ├── quests.js           #   daily self-improvement quests
│   └── dungeons.js         #   dungeon layouts, rooms, loot tables, tiers
├── systems/                # game logic, no rendering
│   ├── EventBus.js         #   pub/sub between systems, scenes and DOM UI
│   ├── SaveSystem.js       #   localStorage read/write/migrate/autosave
│   ├── PlayerState.js      #   single source of truth for the hunter
│   ├── InventorySystem.js  #   stacks, equipping, buying, selling
│   ├── QuestSystem.js      #   daily reset, once-per-day rule, streaks
│   ├── CombatSystem.js     #   pure damage maths + enemy tier scaling
│   ├── DungeonSystem.js    #   per-dungeon progress, loot rolls, clears
│   └── TextureFactory.js   #   all pixel art, drawn procedurally
├── ui/                     # DOM overlay
│   ├── Toast.js  Modal.js  TouchControls.js
│   ├── QuestPanel.js  InventoryPanel.js  StatsPanel.js
│   └── HUD.js              #   bars, gold, rank badge, level-up burst
├── scenes/                 # Phaser scenes
│   ├── BaseWorldScene.js   #   shared: map, player, input, combat, enemies
│   ├── BootScene.js        #   generate textures, load save, hand off
│   ├── TownScene.js        #   Ascension Town + all five interactables
│   └── DungeonScene.js     #   builds any dungeon from its data definition
├── assets/                 # sample placeholder PNGs + swap instructions
├── netlify.toml  vercel.json
└── docs/                   # unrelated earlier demo page kept out of the way
```

**Architecture in one line:** `data/` describes the world, `systems/` changes it,
`ui/` and `scenes/` display it, and `EventBus` is the only wire between them.
Scenes never reach into each other, and nothing but `SaveSystem` touches
`localStorage`.

Everything hangs off one global namespace, `HA`, and loads via plain `<script>`
tags in dependency order (see the bottom of `index.html`). That is a deliberate
choice: no bundler, no transpiler, no `node_modules` — clone and run.

---

## Extending it

The seams are already in place:

- **Another dungeon** — add an entry to `data/dungeons.js` and push its id into
  `HA.DungeonOrder`. `DungeonScene` builds rooms, corridors, barriers, spawns and
  loot from that data; no scene code changes.
- **Another map** — extend `BaseWorldScene`, return a tile grid from a
  `generateGrid()`, register interactables, add the class to the `scene` array in
  `main.js`.
- **Quest chains** — `data/quests.js` reserves a `chain` field, and
  `PlayerState.data.quests.totals` already tracks lifetime completions per quest,
  so a quest can gate on "study logged 10 times".
- **Equipment rarity** — `HA.Rarity` multipliers are already applied to gear
  stats and shown in every item row; new tiers only need a row in `items.js`.
- **Skills** — `CombatSystem.resolve()` takes plain stat bags, so a skill is a
  function that builds an attacker bag and a hitbox. `PlayerState` has room for a
  `skills` array in the save without a migration.
- **Bosses** — set `boss: true` and a `scale` on an enemy; the health bar, name
  plate and screen flash are already conditional on it.
- **Audio** — `BaseWorldScene.sfxWhiff()` is an empty hook; load sounds in
  `BootScene.preload()`.

Save files carry a `version`, and `SaveSystem.migrate()` is where schema bumps
go.

---

## Deploying

### Netlify

**Drag and drop:** open <https://app.netlify.com/drop> and drop the project
folder in. Done — it is a static site.

**From Git (recommended):**

1. Push this repo to GitHub/GitLab.
2. Netlify → *Add new site* → *Import an existing project* → pick the repo.
3. Build settings — `netlify.toml` already sets these, just confirm:
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.`
4. Deploy. Every push to the branch redeploys.

**From the CLI:**

```bash
npm install -g netlify-cli
netlify deploy --dir . --prod
```

### Vercel

```bash
npm install -g vercel
vercel --prod          # accept the defaults; framework = "Other", no build
```

Or import the repo at <https://vercel.com/new> — leave the build command empty
and set the output directory to `.`. `vercel.json` handles the cache headers.

### GitHub Pages

Push to a repo, then Settings → Pages → *Deploy from a branch* → your branch,
folder `/ (root)`.

### Anything else

Any static host works — S3, Cloudflare Pages, nginx, a USB stick. There is no
server-side code, no environment variables and no build output.

---

## Notes and limitations

- Saves live in the browser's `localStorage` for that exact origin. Clearing site
  data erases the hunter; use *System → Copy save code* to back it up.
- The daily quest reset uses the **device's local calendar date**. Changing the
  system clock will roll the quests over — the game is an honour system by design.
- Art is placeholder-grade on purpose. See [`assets/README.md`](assets/README.md)
  for the texture-key contract if you want to drop real sprites in.
- Phaser 3.80.1 is vendored under `vendor/` (MIT licensed) so the game has zero
  runtime dependencies.
