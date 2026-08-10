/**
 * systems/DungeonSystem.js
 * Tracks per-dungeon progress and hands out clear rewards.
 *
 * Progress shape (stored per dungeon id in the save):
 *   { unlockedTier, highestTierCleared, clears, bestTimeMs }
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const EVT = HA.EVT;

  const DungeonSystem = {
    definition(dungeonId) {
      return HA.Dungeons[dungeonId] || null;
    },

    progress(dungeonId) {
      const store = HA.Player.data.dungeons;
      if (!store[dungeonId]) {
        store[dungeonId] = { unlockedTier: 1, highestTierCleared: 0, clears: 0, bestTimeMs: null };
      }
      return store[dungeonId];
    },

    /** Tiers the player is allowed to enter right now. */
    availableTiers(dungeonId) {
      const def = this.definition(dungeonId);
      if (!def) return [];
      const progress = this.progress(dungeonId);
      const max = Math.min(def.maxTier, progress.unlockedTier);
      const tiers = [];
      for (let tier = 1; tier <= max; tier += 1) tiers.push(tier);
      return tiers;
    },

    tierName(tier) {
      const names = ['', 'Normal', 'Hard', 'Nightmare', 'Abyssal', 'Monarch'];
      return names[tier] || `Tier ${tier}`;
    },

    /** Roll a dungeon's loot table. Returns [{ id, qty }]. */
    rollLoot(dungeonId, tier) {
      const def = this.definition(dungeonId);
      if (!def || !def.loot) return [];
      const bonus = Math.min(0.35, (tier - 1) * 0.08);
      const drops = [];
      for (const entry of def.loot) {
        if (Math.random() <= entry.chance + bonus) {
          const min = entry.min || 1;
          const max = entry.max || min;
          drops.push({ id: entry.item, qty: Phaser.Math.Between(min, max) });
        }
      }
      return drops;
    },

    /**
     * Award a clear. Returns a summary the results modal renders.
     */
    completeClear(dungeonId, tier, elapsedMs) {
      const def = this.definition(dungeonId);
      const progress = this.progress(dungeonId);
      const rewardFactor = Math.pow(def.tierScaling.reward, tier - 1);

      const firstEver = progress.clears === 0;
      const firstAtTier = tier > progress.highestTierCleared;

      let xp = Math.round(def.clearReward.xp * rewardFactor);
      let gold = Math.round(def.clearReward.gold * rewardFactor);
      const items = this.rollLoot(dungeonId, tier);

      if (firstEver && def.firstClearReward) {
        xp += def.firstClearReward.xp || 0;
        gold += def.firstClearReward.gold || 0;
        for (const itemId of def.firstClearReward.items || []) {
          items.push({ id: itemId, qty: 1 });
        }
      }

      const grantedXp = HA.Player.addXp(xp, { source: `dungeon:${dungeonId}` });
      const grantedGold = HA.Player.addGold(gold);
      for (const drop of items) HA.Inventory.add(drop.id, drop.qty);

      progress.clears += 1;
      if (firstAtTier) progress.highestTierCleared = tier;
      if (elapsedMs && (!progress.bestTimeMs || elapsedMs < progress.bestTimeMs)) {
        progress.bestTimeMs = elapsedMs;
      }

      let unlockedTier = null;
      if (tier === progress.unlockedTier && tier < def.maxTier) {
        progress.unlockedTier = tier + 1;
        unlockedTier = progress.unlockedTier;
        HA.Events.emit(EVT.DUNGEON_TIER_UNLOCKED, { dungeonId, tier: unlockedTier });
      }

      HA.SaveSystem.markDirty();
      HA.SaveSystem.flush();

      const summary = {
        dungeonId,
        dungeonName: def.name,
        tier,
        tierName: this.tierName(tier),
        xp: grantedXp,
        gold: grantedGold,
        items,
        unlockedTier,
        firstClear: firstEver,
        elapsedMs
      };
      HA.Events.emit(EVT.DUNGEON_CLEARED, summary);
      return summary;
    }
  };

  HA.DungeonSystem = DungeonSystem;
})(window);
