/**
 * systems/InventorySystem.js
 * Stack-based inventory plus equipment slots. Operates on PlayerState.data so
 * everything it changes is saved automatically.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const EVT = HA.EVT;

  const InventorySystem = {
    get list() {
      return HA.Player.data.inventory;
    },

    countOf(itemId) {
      const entry = this.list.find((slot) => slot.id === itemId);
      return entry ? entry.qty : 0;
    },

    add(itemId, qty) {
      const amount = qty || 1;
      if (!HA.ItemUtil.get(itemId)) {
        console.warn(`[Inventory] unknown item "${itemId}"`);
        return false;
      }
      const entry = this.list.find((slot) => slot.id === itemId);
      if (entry) entry.qty += amount;
      else this.list.push({ id: itemId, qty: amount });
      HA.Events.emit(EVT.INVENTORY_CHANGED, this.list);
      HA.SaveSystem.markDirty();
      return true;
    },

    remove(itemId, qty) {
      const amount = qty || 1;
      const index = this.list.findIndex((slot) => slot.id === itemId);
      if (index === -1 || this.list[index].qty < amount) return false;
      this.list[index].qty -= amount;
      if (this.list[index].qty <= 0) this.list.splice(index, 1);
      HA.Events.emit(EVT.INVENTORY_CHANGED, this.list);
      HA.SaveSystem.markDirty();
      return true;
    },

    isEquipped(itemId) {
      const eq = HA.Player.data.equipment;
      return eq.weapon === itemId || eq.armor === itemId;
    },

    /** Equip from the bag. The previously equipped item returns to the bag. */
    equip(itemId) {
      const item = HA.ItemUtil.get(itemId);
      if (!item || item.type !== 'equipment') return false;
      if (this.countOf(itemId) <= 0) return false;

      const equipment = HA.Player.data.equipment;
      const slot = item.slot;
      const previous = equipment[slot];

      this.remove(itemId, 1);
      if (previous) this.add(previous, 1);
      equipment[slot] = itemId;

      HA.Events.emit(EVT.EQUIPMENT_CHANGED, equipment);
      HA.Events.emit(EVT.STATE_CHANGED, HA.Player);
      HA.SaveSystem.markDirty();
      return true;
    },

    unequip(slot) {
      const equipment = HA.Player.data.equipment;
      const current = equipment[slot];
      if (!current) return false;
      equipment[slot] = null;
      this.add(current, 1);
      HA.Events.emit(EVT.EQUIPMENT_CHANGED, equipment);
      HA.Events.emit(EVT.STATE_CHANGED, HA.Player);
      HA.SaveSystem.markDirty();
      return true;
    },

    /** Use a consumable. Returns a human-readable result message or null. */
    use(itemId) {
      const item = HA.ItemUtil.get(itemId);
      if (!item || item.type !== 'consumable') return null;
      if (this.countOf(itemId) <= 0) return null;

      if (item.effect && item.effect.heal) {
        if (HA.Player.hp >= HA.Player.maxHp) return 'Already at full HP.';
        const healed = HA.Player.heal(item.effect.heal);
        this.remove(itemId, 1);
        return `Restored ${healed} HP.`;
      }
      return null;
    },

    /** Quick-use the first healing item in the bag (bound to the H key). */
    quickHeal() {
      const potion = this.list.find((slot) => {
        const item = HA.ItemUtil.get(slot.id);
        return item && item.type === 'consumable' && item.effect && item.effect.heal;
      });
      if (!potion) return 'No potions left.';
      return this.use(potion.id);
    },

    buy(itemId) {
      const item = HA.ItemUtil.get(itemId);
      if (!item) return false;
      if (!HA.Player.spendGold(item.value)) return false;
      this.add(itemId, 1);
      return true;
    },

    sell(itemId) {
      const item = HA.ItemUtil.get(itemId);
      if (!item || this.countOf(itemId) <= 0) return false;
      if (!this.remove(itemId, 1)) return false;
      HA.Player.addGold(Math.floor(item.value * 0.5), { raw: true });
      return true;
    }
  };

  HA.Inventory = InventorySystem;
})(window);
