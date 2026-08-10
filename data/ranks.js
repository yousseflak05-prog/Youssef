/**
 * data/ranks.js
 * Hunter ranks and the XP curve. Both are pure functions of level so they can be
 * recomputed from a save file without storing derived values.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  const RANKS = [
    { id: 'E', name: 'E-Rank Hunter', minLevel: 1, color: '#94a3b8' },
    { id: 'D', name: 'D-Rank Hunter', minLevel: 5, color: '#4ade80' },
    { id: 'C', name: 'C-Rank Hunter', minLevel: 10, color: '#38bdf8' },
    { id: 'B', name: 'B-Rank Hunter', minLevel: 18, color: '#a855f7' },
    { id: 'A', name: 'A-Rank Hunter', minLevel: 28, color: '#f97316' },
    { id: 'S', name: 'S-Rank Hunter', minLevel: 40, color: '#facc15' }
  ];

  HA.Ranks = {
    LIST: RANKS,

    /** Rank object for a given level. */
    forLevel(level) {
      let current = RANKS[0];
      for (const rank of RANKS) {
        if (level >= rank.minLevel) current = rank;
      }
      return current;
    },

    /** The next rank up, or null at S-rank. */
    nextAfter(level) {
      for (const rank of RANKS) {
        if (level < rank.minLevel) return rank;
      }
      return null;
    },

    /** Total XP needed to go from `level` to `level + 1`. */
    xpForLevel(level) {
      return Math.floor(80 * Math.pow(level, 1.35) + 40 * level);
    }
  };
})(window);
