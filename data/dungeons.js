/**
 * data/dungeons.js
 * Dungeon definitions.
 *
 * A dungeon is a list of rooms laid out left-to-right and joined by corridors.
 * DungeonScene builds the tilemap from `layout`, so adding a second dungeon is a
 * matter of adding another entry here — no scene code changes required.
 *
 * Tiers: every dungeon can be re-run at a higher tier. Tier N scales enemy
 * stats and rewards by `tierScaling ^ (N - 1)` and is unlocked by clearing N-1.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  HA.Dungeons = {
    blue_gate: {
      id: 'blue_gate',
      name: 'Blue Gate',
      subtitle: 'E-Rank Gate · Abandoned Subway',
      recommendedLevel: 1,
      maxTier: 5,
      tierScaling: { enemy: 1.55, reward: 1.4 },
      layout: {
        roomWidth: 15,
        roomHeight: 17,
        corridorLength: 5,
        corridorHeight: 3
      },
      rooms: [
        {
          id: 'r1',
          name: 'Collapsed Platform',
          spawns: [
            { type: 'shadow_imp', count: 3 }
          ]
        },
        {
          id: 'r2',
          name: 'Flooded Tunnel',
          spawns: [
            { type: 'gate_wolf', count: 2 },
            { type: 'shadow_imp', count: 2 }
          ]
        },
        {
          id: 'r3',
          name: 'Gate Core',
          isBossRoom: true,
          spawns: [
            { type: 'stone_golem', count: 2 },
            { type: 'shadow_knight', count: 1 }
          ]
        }
      ],
      /** Loot granted on a clear. `chance` is rolled per entry. */
      loot: [
        { item: 'health_potion', chance: 1, min: 2, max: 3 },
        { item: 'sword', chance: 0.5, min: 1, max: 1 },
        { item: 'dagger', chance: 0.35, min: 1, max: 1 },
        { item: 'hunter_armor', chance: 0.3, min: 1, max: 1 }
      ],
      clearReward: { xp: 220, gold: 180 },
      firstClearReward: { xp: 150, gold: 120, items: ['hunter_armor'] }
    }
  };

  /** Dungeons the player can see on the gate menu, in order. */
  HA.DungeonOrder = ['blue_gate'];
})(window);
