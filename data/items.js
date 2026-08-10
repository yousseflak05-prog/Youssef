/**
 * data/items.js
 * Item database. `rarity` is already threaded through the UI and loot tables so
 * new tiers of gear only need a row here.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  HA.Rarity = {
    common: { id: 'common', name: 'Common', color: '#94a3b8', mult: 1 },
    uncommon: { id: 'uncommon', name: 'Uncommon', color: '#4ade80', mult: 1.15 },
    rare: { id: 'rare', name: 'Rare', color: '#38bdf8', mult: 1.35 },
    epic: { id: 'epic', name: 'Epic', color: '#a855f7', mult: 1.6 },
    legendary: { id: 'legendary', name: 'Legendary', color: '#facc15', mult: 2 }
  };

  /**
   * slot: 'weapon' | 'armor' | null (consumables have no slot)
   * type: 'equipment' | 'consumable'
   */
  HA.Items = {
    sword: {
      id: 'sword',
      name: 'Iron Sword',
      type: 'equipment',
      slot: 'weapon',
      rarity: 'common',
      stats: { attack: 6 },
      value: 80,
      icon: 'icon_sword',
      description: 'Standard association-issue blade. Reliable, heavy, honest.'
    },
    dagger: {
      id: 'dagger',
      name: 'Shadow Dagger',
      type: 'equipment',
      slot: 'weapon',
      rarity: 'uncommon',
      stats: { attack: 3, crit: 0.12, speed: 20 },
      value: 110,
      icon: 'icon_dagger',
      description: 'Light, fast, and eager. Trades raw power for critical strikes.'
    },
    hunter_armor: {
      id: 'hunter_armor',
      name: 'Hunter Armor',
      type: 'equipment',
      slot: 'armor',
      rarity: 'uncommon',
      stats: { defense: 5, maxHp: 20 },
      value: 140,
      icon: 'icon_armor',
      description: 'Reinforced mana-weave plating worn by licensed hunters.'
    },
    health_potion: {
      id: 'health_potion',
      name: 'Health Potion',
      type: 'consumable',
      slot: null,
      rarity: 'common',
      effect: { heal: 50 },
      value: 30,
      icon: 'icon_potion',
      description: 'Restores 50 HP. Tastes like copper and regret.'
    }
  };

  HA.ItemUtil = {
    get(id) {
      return HA.Items[id] || null;
    },
    rarityOf(id) {
      const item = HA.Items[id];
      return HA.Rarity[item && item.rarity ? item.rarity : 'common'];
    },
    /** Shop stock for the Guild Hall. */
    shopStock: ['health_potion', 'sword', 'dagger', 'hunter_armor']
  };
})(window);
