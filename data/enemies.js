/**
 * data/enemies.js
 * Enemy archetypes. Stats here are tier-1 values; DungeonSystem scales them for
 * harder gate tiers, so a single row supports every difficulty.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  HA.Enemies = {
    shadow_imp: {
      id: 'shadow_imp',
      name: 'Shadow Imp',
      texture: 'enemy_imp',
      hp: 30,
      attack: 7,
      defense: 1,
      speed: 70,
      aggroRange: 190,
      xp: 14,
      gold: 9,
      tint: 0x8b5cf6,
      boss: false
    },
    gate_wolf: {
      id: 'gate_wolf',
      name: 'Gate Wolf',
      texture: 'enemy_wolf',
      hp: 46,
      attack: 10,
      defense: 2,
      speed: 105,
      aggroRange: 240,
      xp: 22,
      gold: 13,
      tint: 0x38bdf8,
      boss: false
    },
    stone_golem: {
      id: 'stone_golem',
      name: 'Stone Golem',
      texture: 'enemy_golem',
      hp: 88,
      attack: 14,
      defense: 6,
      speed: 45,
      aggroRange: 165,
      xp: 38,
      gold: 22,
      tint: 0x94a3b8,
      boss: false
    },
    shadow_knight: {
      id: 'shadow_knight',
      name: 'Shadow Knight',
      texture: 'enemy_knight',
      hp: 240,
      attack: 20,
      defense: 8,
      speed: 88,
      aggroRange: 420,
      xp: 160,
      gold: 130,
      tint: 0x6366f1,
      boss: true,
      scale: 2.6
    }
  };
})(window);
