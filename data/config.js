/**
 * data/config.js
 * Global, tweakable constants. Everything balance-related lives here or in the
 * sibling data files so gameplay can be re-tuned without touching systems code.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  HA.Config = {
    GAME_TITLE: 'Hunter Ascension',
    HERO_NAME: 'Youssef',

    SAVE_KEY: 'hunter-ascension:save:v1',
    SAVE_VERSION: 1,
    AUTOSAVE_MS: 10000,

    // Rendering ------------------------------------------------------------
    TILE: 32,          // world tiles are 32x32 px
    SPRITE_SRC: 16,    // characters are authored at 16x16 ...
    SPRITE_SCALE: 2,   // ... and drawn at 2x so they match the tile grid

    VIEW: { WIDTH: 960, HEIGHT: 540 },

    // Movement -------------------------------------------------------------
    BASE_SPEED: 150,          // px/sec at 0 agility
    SPEED_PER_AGILITY: 3,
    MAX_SPEED: 320,

    // Combat ---------------------------------------------------------------
    ATTACK_COOLDOWN_MS: 380,
    ATTACK_REACH: 26,         // px in front of the player
    ATTACK_WIDTH: 34,
    INVULN_MS: 700,           // player i-frames after taking a hit
    ENEMY_HIT_COOLDOWN_MS: 800,
    CRIT_MULTIPLIER: 1.8,
    DEATH_GOLD_PENALTY: 0.1,  // fraction of gold lost on death
    RESPAWN_HP_FRACTION: 0.5,

    // Progression ----------------------------------------------------------
    STAT_POINTS_PER_LEVEL: 3,
    MAX_LEVEL: 99,

    // Town services --------------------------------------------------------
    TRAINING_COST: 60,        // gold per Strength/Agility point
    LIBRARY_COST: 60,         // gold per Intelligence point
    GUILD_HEAL_COST: 25,

    // Interaction ----------------------------------------------------------
    INTERACT_RADIUS: 56,

    // Palette (dark fantasy / Solo Leveling inspired) ----------------------
    COLORS: {
      VOID: 0x05060d,
      NIGHT: 0x0b0f1d,
      STONE: 0x1a2036,
      PORTAL: 0x38bdf8,
      PORTAL_DEEP: 0x1d4ed8,
      MANA: 0x7dd3fc,
      GOLD: 0xfacc15,
      BLOOD: 0xef4444,
      XP: 0xa855f7,
      TEXT: 0xe2e8f0
    }
  };

  // CSS-side mirror of a few colours so UI + canvas stay in sync.
  HA.Config.CSS = {
    portal: '#38bdf8',
    gold: '#facc15',
    blood: '#ef4444',
    xp: '#a855f7'
  };
})(window);
