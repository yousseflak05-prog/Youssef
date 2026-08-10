/**
 * systems/QuestSystem.js
 * Daily self-improvement quests.
 *
 * The rule that matters: a quest can only be completed once per calendar day.
 * The check runs against the local date string stored in the save, and the log
 * rolls over lazily the first time it is read on a new day.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const EVT = HA.EVT;

  const QuestSystem = {
    /** Roll the daily log over if the calendar date changed. */
    refresh() {
      const log = HA.Player.data.quests;
      const today = HA.todayKey();
      if (log.date === today) return false;

      // The streak only survives if yesterday was a perfect day.
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (log.lastPerfectDate !== HA.todayKey(yesterday)) log.streak = 0;

      log.date = today;
      log.completed = [];
      log.perfectDayClaimed = false;
      HA.SaveSystem.markDirty();
      HA.Events.emit(EVT.QUESTS_RESET, log);
      return true;
    },

    isCompleted(questId) {
      this.refresh();
      return HA.Player.data.quests.completed.indexOf(questId) !== -1;
    },

    available() {
      this.refresh();
      return HA.Quests.filter((quest) => !this.isCompleted(quest.id));
    },

    completedCount() {
      this.refresh();
      return HA.Player.data.quests.completed.length;
    },

    totalFor(questId) {
      return HA.Player.data.quests.totals[questId] || 0;
    },

    /**
     * Log a real-life task as done. Returns a result object:
     * { ok, reason?, xp, gold, stats, perfect }
     */
    complete(questId) {
      this.refresh();
      const quest = HA.Quests.find((q) => q.id === questId);
      if (!quest) return { ok: false, reason: 'Unknown quest.' };
      if (this.isCompleted(questId)) {
        return { ok: false, reason: 'Already logged today. Come back tomorrow.' };
      }

      const log = HA.Player.data.quests;
      log.completed.push(questId);
      log.totals[questId] = (log.totals[questId] || 0) + 1;

      const rewards = quest.rewards;
      const xp = HA.Player.addXp(rewards.xp, { source: `quest:${questId}` });
      const gold = HA.Player.addGold(rewards.gold);
      const gainedStats = {};
      if (rewards.stats) {
        for (const key of Object.keys(rewards.stats)) {
          HA.Player.addStat(key, rewards.stats[key]);
          gainedStats[key] = rewards.stats[key];
        }
      }

      const result = { ok: true, quest, xp, gold, stats: gainedStats, perfect: null };

      // Perfect day bonus, granted once when the last quest of the day lands.
      if (log.completed.length === HA.Quests.length && !log.perfectDayClaimed) {
        log.perfectDayClaimed = true;
        log.streak += 1;
        log.lastPerfectDate = log.date;
        const bonus = HA.QuestPerfectDayBonus;
        const bonusXp = HA.Player.addXp(bonus.xp, { source: 'quest:perfect-day' });
        const bonusGold = HA.Player.addGold(bonus.gold);
        for (const key of Object.keys(bonus.stats || {})) {
          HA.Player.addStat(key, bonus.stats[key]);
        }
        result.perfect = { xp: bonusXp, gold: bonusGold, streak: log.streak };
      }

      HA.SaveSystem.markDirty();
      HA.SaveSystem.flush();
      HA.Events.emit(EVT.QUEST_COMPLETED, result);
      return result;
    },

    /** Milliseconds until the daily log resets (local midnight). */
    msUntilReset() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime();
    },

    formattedReset() {
      const ms = this.msUntilReset();
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    }
  };

  HA.QuestSystem = QuestSystem;
})(window);
