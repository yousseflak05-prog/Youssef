/**
 * systems/TextureFactory.js
 * Every sprite in the game is drawn here, at runtime, from code.
 *
 * Why: placeholder pixel art that ships as source instead of binary keeps the
 * repo tiny, guarantees no missing-asset 404s, and lets you swap in real art
 * later by loading a file with the same texture key in BootScene (see
 * assets/README.md).
 *
 * Authoring resolution is 16x16 "logical" pixels for characters and items, and
 * 16x16 scaled 2x for the 32px tileset, so everything stays on a crisp grid.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const CFG = HA.Config;

  const PALETTE = {
    outline: '#05060d',
    night: '#0b0f1d',
    stone: '#1a2036',
    stoneLit: '#252d47',
    grass: '#1d3b2a',
    grassLit: '#27523a',
    grassDark: '#162c20',
    dirt: '#3b3226',
    dirtLit: '#4a4031',
    water: '#0e2a4d',
    waterLit: '#154a7a',
    wood: '#4a3524',
    woodLit: '#6b4d34',
    roof: '#3b1f3a',
    roofLit: '#572f54',
    skin: '#e8b88c',
    skinDark: '#c2905f',
    hair: '#141a26',
    coat: '#182238',
    coatLit: '#26344f',
    trim: '#38bdf8',
    trimDeep: '#1d4ed8',
    steel: '#9fb2c9',
    steelDark: '#5c6b80',
    gold: '#facc15',
    blood: '#ef4444',
    purple: '#8b5cf6',
    white: '#e2e8f0',
    shadow: 'rgba(0,0,0,0.35)'
  };

  /** Little drawing helper: logical pixels -> device pixels. */
  function pen(ctx, scale, ox, oy) {
    return {
      rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(ox + x * scale, oy + y * scale, w * scale, h * scale);
        return this;
      },
      px(x, y, color) {
        return this.rect(x, y, 1, 1, color);
      },
      clear(x, y, w, h) {
        ctx.clearRect(ox + x * scale, oy + y * scale, w * scale, h * scale);
        return this;
      }
    };
  }

  function offscreen(w, h) {
    const canvas = global.document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // ---------------------------------------------------------------- tiles

  /** Tile indices used by the tilemaps. Keep in sync with drawTile(). */
  const TILE = {
    GRASS: 0,
    GRASS_ALT: 1,
    PATH: 2,
    PLAZA: 3,
    WATER: 4,
    TREE: 5,
    ROCK: 6,
    D_FLOOR: 7,
    D_FLOOR_ALT: 8,
    D_WALL: 9,
    RUBBLE: 10,
    VOID: 11,
    D_RUNE: 12,
    FENCE: 13
  };

  const TILE_COUNT = 14;

  /** Solid tiles — used for arcade collision. */
  const SOLID_TILES = [TILE.WATER, TILE.TREE, TILE.ROCK, TILE.D_WALL, TILE.VOID, TILE.FENCE];

  function noiseDots(p, color, seedList) {
    for (const [x, y] of seedList) p.px(x, y, color);
  }

  function drawTile(ctx, index, scale) {
    const p = pen(ctx, scale, index * 16 * scale, 0);
    switch (index) {
      case TILE.GRASS:
        p.rect(0, 0, 16, 16, PALETTE.grass);
        noiseDots(p, PALETTE.grassLit, [[2, 3], [3, 3], [9, 5], [10, 5], [5, 11], [6, 11], [12, 12]]);
        noiseDots(p, PALETTE.grassDark, [[7, 2], [13, 8], [1, 13]]);
        break;
      case TILE.GRASS_ALT:
        p.rect(0, 0, 16, 16, PALETTE.grass);
        noiseDots(p, PALETTE.grassLit, [[4, 4], [11, 9]]);
        p.px(4, 3, PALETTE.trim).px(11, 8, PALETTE.purple).px(8, 13, PALETTE.gold);
        break;
      case TILE.PATH:
        p.rect(0, 0, 16, 16, PALETTE.dirt);
        noiseDots(p, PALETTE.dirtLit, [[2, 2], [3, 6], [9, 3], [12, 9], [6, 12], [13, 13]]);
        break;
      case TILE.PLAZA:
        p.rect(0, 0, 16, 16, '#2a3350');
        p.rect(0, 0, 16, 1, '#3a4670').rect(0, 8, 16, 1, '#3a4670');
        p.rect(0, 0, 1, 16, '#3a4670').rect(8, 8, 1, 8, '#3a4670');
        noiseDots(p, '#222a44', [[4, 4], [12, 3], [5, 12], [13, 11]]);
        break;
      case TILE.WATER:
        p.rect(0, 0, 16, 16, PALETTE.water);
        p.rect(2, 4, 5, 1, PALETTE.waterLit).rect(9, 9, 4, 1, PALETTE.waterLit);
        p.rect(4, 12, 3, 1, PALETTE.waterLit);
        break;
      case TILE.TREE:
        // A tree has to read as a silhouette against grass, so the canopy is
        // much darker than the ground with a single cool rim highlight.
        p.rect(0, 0, 16, 16, PALETTE.grassDark);
        p.rect(2, 13, 12, 2, '#0a1a12');           // ground shadow
        p.rect(7, 10, 3, 4, '#2c1f14');            // trunk
        p.rect(7, 10, 1, 4, '#41301f');
        p.rect(2, 2, 12, 9, '#081a11');            // canopy outline
        p.rect(3, 3, 10, 7, '#123a24');            // canopy body
        p.rect(4, 2, 8, 1, '#123a24');
        p.rect(4, 3, 4, 2, '#2a7048');             // rim light
        p.rect(9, 5, 3, 2, '#1c5233');
        p.px(6, 7, '#2a7048').px(11, 8, '#1c5233');
        break;
      case TILE.ROCK:
        p.rect(0, 0, 16, 16, PALETTE.grass);
        p.rect(2, 5, 12, 9, PALETTE.stone);
        p.rect(3, 4, 10, 2, PALETTE.stoneLit);
        p.rect(2, 13, 12, 1, PALETTE.outline);
        p.rect(5, 8, 3, 2, PALETTE.stoneLit);
        break;
      case TILE.D_FLOOR:
        p.rect(0, 0, 16, 16, '#131a2b');
        p.rect(0, 0, 16, 1, '#182036').rect(0, 0, 1, 16, '#182036');
        noiseDots(p, '#0d1322', [[5, 6], [10, 11], [12, 4]]);
        break;
      case TILE.D_FLOOR_ALT:
        p.rect(0, 0, 16, 16, '#131a2b');
        p.rect(0, 0, 16, 1, '#182036').rect(0, 0, 1, 16, '#182036');
        p.rect(4, 7, 6, 1, '#0a0f1c').rect(9, 8, 4, 1, '#0a0f1c');
        p.rect(3, 12, 5, 1, '#0a0f1c');
        break;
      case TILE.D_WALL:
        p.rect(0, 0, 16, 16, '#0a0e1a');
        p.rect(0, 0, 16, 7, '#1d2740').rect(0, 8, 16, 7, '#1d2740');
        p.rect(0, 7, 16, 1, '#070a13').rect(0, 15, 16, 1, '#070a13');
        p.rect(7, 0, 1, 7, '#070a13').rect(3, 8, 1, 7, '#070a13').rect(11, 8, 1, 7, '#070a13');
        p.rect(0, 0, 16, 1, '#2b3a5e');
        break;
      case TILE.RUBBLE:
        p.rect(0, 0, 16, 16, '#131a2b');
        p.rect(3, 9, 4, 3, PALETTE.stone).rect(9, 11, 3, 2, PALETTE.stone);
        p.rect(6, 5, 2, 2, PALETTE.stoneLit);
        break;
      case TILE.VOID:
        p.rect(0, 0, 16, 16, '#03040a');
        p.rect(0, 0, 16, 1, '#0d1322');
        break;
      case TILE.D_RUNE:
        p.rect(0, 0, 16, 16, '#131a2b');
        p.rect(6, 3, 4, 1, PALETTE.trimDeep).rect(5, 4, 6, 1, PALETTE.trim);
        p.rect(4, 7, 8, 1, PALETTE.trimDeep).rect(6, 11, 4, 1, PALETTE.trim);
        break;
      case TILE.FENCE:
        p.rect(0, 0, 16, 16, PALETTE.grass);
        p.rect(1, 6, 14, 2, PALETTE.wood);
        p.rect(3, 3, 2, 11, PALETTE.woodLit);
        p.rect(11, 3, 2, 11, PALETTE.woodLit);
        break;
      default:
        p.rect(0, 0, 16, 16, '#ff00ff');
    }
  }

  // ------------------------------------------------------------ characters

  /**
   * Hunter sprite. `dir` is 'down' | 'up' | 'side'; `frame` 0/1 alternates the
   * stride; `attack` extends the arms forward.
   */
  function drawHunter(p, dir, frame, opts) {
    const o = opts || {};
    const coat = o.coat || PALETTE.coat;
    const coatLit = o.coatLit || PALETTE.coatLit;
    const trim = o.trim || PALETTE.trim;
    const bob = frame === 1 ? 1 : 0;
    const top = 1 + bob;

    // head
    p.rect(5, top + 1, 6, 5, PALETTE.skin);
    p.rect(5, top, 6, 2, PALETTE.hair);
    p.rect(4, top + 1, 1, 3, PALETTE.hair);
    p.rect(11, top + 1, 1, 3, PALETTE.hair);
    if (dir === 'down') {
      p.px(6, top + 3, PALETTE.outline).px(9, top + 3, PALETTE.outline);
      p.px(6, top + 3, trim).px(9, top + 3, trim);
    } else if (dir === 'side') {
      p.rect(4, top + 1, 5, 5, PALETTE.hair);
      p.rect(9, top + 1, 3, 5, PALETTE.skin);
      p.px(10, top + 3, trim);
    } else {
      p.rect(5, top, 6, 5, PALETTE.hair);
    }

    // torso / coat
    p.rect(4, top + 6, 8, 6, coat);
    p.rect(4, top + 6, 8, 1, coatLit);
    if (dir === 'down') {
      p.rect(7, top + 6, 2, 6, trim);
      p.rect(5, top + 8, 1, 1, PALETTE.steel);
    } else if (dir === 'up') {
      p.rect(6, top + 6, 4, 6, o.cape || PALETTE.trimDeep);
    } else {
      p.rect(5, top + 6, 2, 6, trim);
    }

    // arms
    const reach = o.attack ? 2 : 0;
    if (dir === 'side') {
      p.rect(10 + reach, top + 7, 2, 4, coatLit);
    } else {
      p.rect(3, top + 7 - (o.attack ? 1 : 0), 2, 4, coatLit);
      p.rect(11, top + 7 - (o.attack ? 1 : 0), 2, 4, coatLit);
    }

    // legs
    const legY = top + 12;
    if (frame === 0) {
      p.rect(5, legY, 2, 3, PALETTE.outline);
      p.rect(9, legY, 2, 3, PALETTE.outline);
    } else {
      p.rect(4, legY, 3, 2, PALETTE.outline);
      p.rect(9, legY, 3, 3, PALETTE.outline);
    }
  }

  function drawImp(p, frame) {
    const bob = frame === 1 ? 1 : 0;
    p.rect(4, 4 + bob, 8, 7, '#2b1a44');
    p.rect(4, 4 + bob, 8, 1, '#3f2668');
    p.rect(3, 2 + bob, 2, 3, '#3f2668'); // horns
    p.rect(11, 2 + bob, 2, 3, '#3f2668');
    p.px(6, 7 + bob, PALETTE.blood).px(9, 7 + bob, PALETTE.blood);
    p.rect(6, 9 + bob, 4, 1, '#0b0713');
    p.rect(2, 6 + bob, 2, 4, '#20123a'); // wings
    p.rect(12, 6 + bob, 2, 4, '#20123a');
    p.rect(5, 11 + bob, 2, 3, '#1a1030');
    p.rect(9, 11 + bob, 2, 3, '#1a1030');
  }

  function drawWolf(p, frame) {
    const bob = frame === 1 ? 1 : 0;
    p.rect(2, 6 + bob, 12, 5, '#243047');
    p.rect(2, 6 + bob, 12, 1, '#33455f');
    p.rect(10, 3 + bob, 5, 5, '#243047'); // head
    p.rect(11, 2 + bob, 1, 2, '#33455f'); // ears
    p.rect(14, 2 + bob, 1, 2, '#33455f');
    p.px(13, 5 + bob, PALETTE.trim);
    p.rect(13, 7 + bob, 2, 1, '#0b0f19');
    p.rect(0, 4 + bob, 3, 2, '#243047'); // tail
    p.rect(3, 11 + bob, 2, 3, '#1a2334');
    p.rect(7, 11 + bob, 2, 3, '#1a2334');
    p.rect(11, 11 + bob, 2, 3, '#1a2334');
  }

  function drawGolem(p, frame) {
    const bob = frame === 1 ? 1 : 0;
    p.rect(3, 3 + bob, 10, 9, '#3c4557');
    p.rect(3, 3 + bob, 10, 1, '#525d72');
    p.rect(1, 5 + bob, 2, 5, '#333b4b');
    p.rect(13, 5 + bob, 2, 5, '#333b4b');
    p.rect(5, 6 + bob, 2, 2, PALETTE.trim);
    p.rect(9, 6 + bob, 2, 2, PALETTE.trim);
    p.rect(5, 10 + bob, 6, 1, '#1d2430');
    p.rect(4, 12 + bob, 3, 3, '#333b4b');
    p.rect(9, 12 + bob, 3, 3, '#333b4b');
  }

  function drawKnight(p, frame) {
    const bob = frame === 1 ? 1 : 0;
    // cape
    p.rect(2, 4 + bob, 12, 9, '#1b1440');
    // body
    p.rect(4, 4 + bob, 8, 8, '#2a2f52');
    p.rect(4, 4 + bob, 8, 1, '#3c4478');
    // helm
    p.rect(5, 1 + bob, 6, 4, '#3c4478');
    p.rect(4, 0 + bob, 2, 3, '#565fa0'); // horns
    p.rect(10, 0 + bob, 2, 3, '#565fa0');
    p.px(6, 3 + bob, PALETTE.blood).px(9, 3 + bob, PALETTE.blood);
    // sword
    p.rect(12, 2 + bob, 1, 10, PALETTE.steel);
    p.rect(11, 8 + bob, 3, 1, PALETTE.steelDark);
    p.rect(5, 12 + bob, 2, 3, '#1b2038');
    p.rect(9, 12 + bob, 2, 3, '#1b2038');
  }

  // ----------------------------------------------------------------- items

  function drawItemIcon(p, kind) {
    switch (kind) {
      case 'sword':
        p.rect(7, 1, 2, 9, PALETTE.steel);
        p.rect(7, 1, 1, 9, PALETTE.white);
        p.rect(4, 10, 8, 1, PALETTE.steelDark);
        p.rect(7, 11, 2, 4, PALETTE.wood);
        p.rect(6, 14, 4, 1, PALETTE.gold);
        break;
      case 'dagger':
        p.rect(7, 3, 2, 6, PALETTE.trim);
        p.rect(7, 3, 1, 6, PALETTE.white);
        p.rect(5, 9, 6, 1, PALETTE.steelDark);
        p.rect(7, 10, 2, 4, '#241a33');
        break;
      case 'armor':
        p.rect(4, 3, 8, 9, PALETTE.coat);
        p.rect(4, 3, 8, 1, PALETTE.coatLit);
        p.rect(3, 4, 2, 4, PALETTE.coatLit);
        p.rect(11, 4, 2, 4, PALETTE.coatLit);
        p.rect(7, 4, 2, 8, PALETTE.trim);
        p.rect(5, 12, 6, 1, PALETTE.steelDark);
        break;
      case 'potion':
        p.rect(6, 1, 4, 2, PALETTE.steelDark);
        p.rect(5, 3, 6, 3, '#7f8ea3');
        p.rect(4, 6, 8, 8, '#7f8ea3');
        p.rect(5, 8, 6, 5, PALETTE.blood);
        p.rect(5, 8, 2, 1, '#ff8a8a');
        break;
      case 'gold':
        p.rect(4, 5, 8, 7, PALETTE.gold);
        p.rect(5, 4, 6, 1, '#fde68a');
        p.rect(5, 12, 6, 1, '#a16207');
        p.rect(7, 7, 2, 3, '#a16207');
        break;
      default:
        p.rect(3, 3, 10, 10, PALETTE.purple);
    }
  }

  // ------------------------------------------------------------- buildings

  /**
   * Buildings are drawn at 4x logical scale into their own textures so they
   * read as chunky pixel structures next to the 32px tiles.
   */
  function drawBuilding(ctx, kind, scale) {
    const p = pen(ctx, scale, 0, 0);
    const W = 24;
    const roofColors = {
      home: ['#5b2f3a', '#7d4250'],
      training: ['#5a3a1f', '#7d5430'],
      library: ['#243a6b', '#33529a'],
      guild: ['#3d2a5c', '#573c85']
    }[kind] || ['#3b1f3a', '#572f54'];

    // body
    p.rect(2, 8, W - 4, 12, '#1b2233');
    p.rect(2, 8, W - 4, 1, '#2a3550');
    p.rect(2, 19, W - 4, 1, PALETTE.outline);

    // roof
    for (let i = 0; i < 7; i += 1) {
      p.rect(1 + i, 8 - i, W - 2 - i * 2, 1, i % 2 ? roofColors[0] : roofColors[1]);
    }
    p.rect(0, 8, W, 1, PALETTE.outline);

    // windows
    p.rect(5, 11, 3, 3, '#0c1120');
    p.rect(16, 11, 3, 3, '#0c1120');
    p.rect(5, 11, 3, 1, PALETTE.trim);
    p.rect(16, 11, 3, 1, PALETTE.trim);

    // door
    p.rect(10, 13, 4, 7, '#2a1c14');
    p.rect(10, 13, 4, 1, '#3f2a1e');
    p.px(13, 16, PALETTE.gold);

    // per-building sign motif above the door
    switch (kind) {
      case 'home':
        p.rect(11, 3, 2, 3, '#9ca3af'); // chimney smoke
        p.rect(11, 1, 2, 1, '#6b7280');
        break;
      case 'training':
        p.rect(8, 4, 8, 1, PALETTE.steel); // barbell
        p.rect(7, 3, 2, 3, PALETTE.steelDark);
        p.rect(15, 3, 2, 3, PALETTE.steelDark);
        break;
      case 'library':
        p.rect(9, 3, 3, 4, '#c084fc'); // books
        p.rect(12, 3, 3, 4, '#60a5fa');
        p.rect(9, 7, 6, 1, '#1f2937');
        break;
      case 'guild':
        p.rect(11, 2, 2, 6, PALETTE.gold); // banner
        p.rect(9, 3, 6, 3, '#7c3aed');
        p.px(11, 4, PALETTE.gold).px(12, 4, PALETTE.gold);
        break;
      default:
        break;
    }
  }

  function drawPortalFrame(ctx, frame, w, h) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const pulse = Math.sin((frame / 6) * Math.PI * 2);

    // stone arch
    ctx.fillStyle = '#12182a';
    ctx.fillRect(cx - w * 0.42, cy - h * 0.46, w * 0.84, h * 0.92);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(cx - w * 0.36, cy - h * 0.4, w * 0.72, h * 0.8);

    // swirling gate
    const rings = 5;
    for (let i = rings; i >= 1; i -= 1) {
      const t = i / rings;
      const rx = w * 0.3 * t * (1 + pulse * 0.05 * t);
      const ry = h * 0.36 * t * (1 - pulse * 0.04 * t);
      const alpha = 0.18 + (1 - t) * 0.7;
      ctx.fillStyle = `rgba(${Math.round(56 + 60 * (1 - t))}, ${Math.round(
        189 - 40 * t
      )}, 248, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // bright core
    ctx.fillStyle = `rgba(224, 242, 254, ${0.65 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.07, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // arch pillars on top so the gate reads as a doorway
    ctx.fillStyle = '#1b2440';
    ctx.fillRect(cx - w * 0.46, cy - h * 0.5, w * 0.1, h);
    ctx.fillRect(cx + w * 0.36, cy - h * 0.5, w * 0.1, h);
    ctx.fillStyle = '#2b3a5e';
    ctx.fillRect(cx - w * 0.46, cy - h * 0.5, w * 0.92, h * 0.06);
  }

  // ------------------------------------------------------------------ API

  const TextureFactory = {
    TILE,
    TILE_COUNT,
    SOLID_TILES,
    PALETTE,
    icons: {},

    /** Build every texture. Called once from BootScene. */
    generateAll(scene) {
      this.buildTileset(scene);
      this.buildHunter(scene);
      this.buildEnemies(scene);
      this.buildItems(scene);
      this.buildBuildings(scene);
      this.buildPortal(scene);
      this.buildEffects(scene);
      this.buildIcons();
    },

    _canvasTexture(scene, key, w, h) {
      if (scene.textures.exists(key)) scene.textures.remove(key);
      const texture = scene.textures.createCanvas(key, w, h);
      texture.context.imageSmoothingEnabled = false;
      return texture;
    },

    buildTileset(scene) {
      const size = CFG.TILE;
      const texture = this._canvasTexture(scene, 'tiles', size * TILE_COUNT, size);
      const ctx = texture.context;
      for (let i = 0; i < TILE_COUNT; i += 1) drawTile(ctx, i, size / 16);
      texture.refresh();
    },

    buildHunter(scene) {
      // Frames are rasterised at SPRITE_SCALE so world sprites can stay at
      // scale 1 — that keeps arcade bodies in plain pixel units.
      const S = CFG.SPRITE_SRC * CFG.SPRITE_SCALE;
      const frames = [
        ['down', 0], ['down', 1],
        ['up', 0], ['up', 1],
        ['side', 0], ['side', 1],
        ['down', 0, true], ['side', 0, true]
      ];
      const texture = this._canvasTexture(scene, 'player', S * frames.length, S);
      const ctx = texture.context;
      frames.forEach(([dir, frame, attack], i) => {
        drawHunter(pen(ctx, CFG.SPRITE_SCALE, i * S, 0), dir, frame, { attack });
        texture.add(i, 0, i * S, 0, S, S);
      });
      texture.refresh();
    },

    buildEnemies(scene) {
      const S = CFG.SPRITE_SRC * CFG.SPRITE_SCALE;
      const painters = {
        enemy_imp: drawImp,
        enemy_wolf: drawWolf,
        enemy_golem: drawGolem,
        enemy_knight: drawKnight
      };
      for (const key of Object.keys(painters)) {
        const texture = this._canvasTexture(scene, key, S * 2, S);
        const ctx = texture.context;
        for (let frame = 0; frame < 2; frame += 1) {
          painters[key](pen(ctx, CFG.SPRITE_SCALE, frame * S, 0), frame);
          texture.add(frame, 0, frame * S, 0, S, S);
        }
        texture.refresh();
      }
    },

    buildItems(scene) {
      const S = CFG.SPRITE_SRC;
      const kinds = ['sword', 'dagger', 'armor', 'potion', 'gold'];
      for (const kind of kinds) {
        const texture = this._canvasTexture(scene, `icon_${kind}`, S, S);
        drawItemIcon(pen(texture.context, 1, 0, 0), kind);
        texture.refresh();
      }
    },

    buildBuildings(scene) {
      const scale = 4;
      for (const kind of ['home', 'training', 'library', 'guild']) {
        const texture = this._canvasTexture(scene, `building_${kind}`, 24 * scale, 20 * scale);
        drawBuilding(texture.context, kind, scale);
        texture.refresh();
      }
    },

    buildPortal(scene) {
      const w = 96;
      const h = 128;
      const frameCount = 6;
      const texture = this._canvasTexture(scene, 'portal', w * frameCount, h);
      const ctx = texture.context;
      const { canvas: tmpCanvas, ctx: tmpCtx } = offscreen(w, h);
      for (let i = 0; i < frameCount; i += 1) {
        drawPortalFrame(tmpCtx, i, w, h);
        ctx.drawImage(tmpCanvas, i * w, 0);
        texture.add(i, 0, i * w, 0, w, h);
      }
      texture.refresh();
    },

    buildEffects(scene) {
      // soft round particle
      const spark = this._canvasTexture(scene, 'fx_spark', 8, 8);
      const sctx = spark.context;
      const grad = sctx.createRadialGradient(4, 4, 0, 4, 4, 4);
      grad.addColorStop(0, 'rgba(224,242,254,1)');
      grad.addColorStop(0.5, 'rgba(56,189,248,0.7)');
      grad.addColorStop(1, 'rgba(29,78,216,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 8, 8);
      spark.refresh();

      // slash arc
      const slash = this._canvasTexture(scene, 'fx_slash', 48, 48);
      const cctx = slash.context;
      cctx.strokeStyle = 'rgba(226,232,240,0.95)';
      cctx.lineWidth = 5;
      cctx.lineCap = 'round';
      cctx.beginPath();
      cctx.arc(10, 24, 22, -Math.PI / 2.4, Math.PI / 2.4);
      cctx.stroke();
      cctx.strokeStyle = 'rgba(56,189,248,0.8)';
      cctx.lineWidth = 2;
      cctx.beginPath();
      cctx.arc(10, 24, 17, -Math.PI / 2.6, Math.PI / 2.6);
      cctx.stroke();
      slash.refresh();

      // drop shadow
      const shadow = this._canvasTexture(scene, 'fx_shadow', 24, 12);
      const shctx = shadow.context;
      shctx.fillStyle = 'rgba(0,0,0,0.38)';
      shctx.beginPath();
      shctx.ellipse(12, 6, 10, 4.5, 0, 0, Math.PI * 2);
      shctx.fill();
      shadow.refresh();

      // barrier used to lock dungeon doors
      const gate = this._canvasTexture(scene, 'fx_barrier', CFG.TILE, CFG.TILE * 3);
      const gctx = gate.context;
      const gGrad = gctx.createLinearGradient(0, 0, CFG.TILE, 0);
      gGrad.addColorStop(0, 'rgba(29,78,216,0.15)');
      gGrad.addColorStop(0.5, 'rgba(56,189,248,0.75)');
      gGrad.addColorStop(1, 'rgba(29,78,216,0.15)');
      gctx.fillStyle = gGrad;
      gctx.fillRect(0, 0, CFG.TILE, CFG.TILE * 3);
      gctx.fillStyle = 'rgba(224,242,254,0.55)';
      for (let y = 4; y < CFG.TILE * 3; y += 10) gctx.fillRect(0, y, CFG.TILE, 2);
      gate.refresh();
    },

    /** Data-URL icons for the DOM inventory / quest UI. */
    buildIcons() {
      const kinds = ['sword', 'dagger', 'armor', 'potion', 'gold'];
      for (const kind of kinds) {
        const { canvas, ctx } = offscreen(64, 64);
        drawItemIcon(pen(ctx, 4, 0, 0), kind);
        this.icons[`icon_${kind}`] = canvas.toDataURL('image/png');
      }
      // hunter portrait for the HUD
      const { canvas, ctx } = offscreen(64, 64);
      drawHunter(pen(ctx, 4, 0, 0), 'down', 0, {});
      this.icons.portrait = canvas.toDataURL('image/png');
    },

    iconFor(itemId) {
      const item = HA.ItemUtil.get(itemId);
      const key = item ? item.icon : 'icon_gold';
      return this.icons[key] || this.icons.icon_gold;
    }
  };

  HA.TextureFactory = TextureFactory;
  HA.TILE = TILE;
})(window);
