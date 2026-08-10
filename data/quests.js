/**
 * data/quests.js
 * Daily self-improvement quests. These are logged manually by the player — the
 * game never verifies them, it just rewards the habit.
 *
 * `chain` is reserved for future quest chains: a quest with `chain` set only
 * appears once its prerequisite has been completed at least `chain.after` times.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  HA.Quests = [
    {
      id: 'study',
      name: 'Study Session',
      icon: '📚',
      description: 'Focus on learning for at least 30 minutes.',
      rewards: { xp: 60, gold: 25, stats: { intelligence: 1, discipline: 1 } }
    },
    {
      id: 'workout',
      name: 'Workout',
      icon: '🏋️',
      description: 'Train your body. Push-ups, weights, a run — your call.',
      rewards: { xp: 70, gold: 20, stats: { strength: 1, discipline: 1 } }
    },
    {
      id: 'work_session',
      name: 'Deep Work Session',
      icon: '💻',
      description: 'One uninterrupted block of real work. No feed, no noise.',
      rewards: { xp: 80, gold: 40, stats: { discipline: 1, agility: 1 } }
    },
    {
      id: 'reading',
      name: 'Reading',
      icon: '📖',
      description: 'Read 10+ pages of something that makes you sharper.',
      rewards: { xp: 50, gold: 18, stats: { intelligence: 1 } }
    }
  ];

  /** Bonus for clearing every daily quest in a single day. */
  HA.QuestPerfectDayBonus = {
    xp: 120,
    gold: 80,
    stats: { discipline: 1 }
  };
})(window);
