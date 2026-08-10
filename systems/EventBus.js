/**
 * systems/EventBus.js
 * Tiny pub/sub used to keep systems, scenes and DOM UI decoupled.
 * Systems emit; the HUD and panels listen. Nothing reaches into a scene.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  class EventBus {
    constructor() {
      this._handlers = new Map();
    }

    on(event, handler) {
      if (!this._handlers.has(event)) this._handlers.set(event, new Set());
      this._handlers.get(event).add(handler);
      return () => this.off(event, handler);
    }

    once(event, handler) {
      const wrapped = (payload) => {
        this.off(event, wrapped);
        handler(payload);
      };
      return this.on(event, wrapped);
    }

    off(event, handler) {
      const set = this._handlers.get(event);
      if (set) set.delete(handler);
    }

    emit(event, payload) {
      const set = this._handlers.get(event);
      if (!set) return;
      // Copy so handlers may unsubscribe during dispatch.
      for (const handler of Array.from(set)) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[EventBus] handler for "${event}" threw`, err);
        }
      }
    }
  }

  HA.EventBus = EventBus;
  HA.Events = new EventBus();

  /** Canonical event names — keeps typos out of the wiring. */
  HA.EVT = {
    STATE_CHANGED: 'state:changed',
    HP_CHANGED: 'state:hp',
    XP_GAINED: 'state:xp',
    GOLD_CHANGED: 'state:gold',
    LEVEL_UP: 'state:levelup',
    RANK_UP: 'state:rankup',
    STAT_POINTS: 'state:statpoints',
    INVENTORY_CHANGED: 'inventory:changed',
    EQUIPMENT_CHANGED: 'inventory:equipment',
    QUEST_COMPLETED: 'quest:completed',
    QUESTS_RESET: 'quest:reset',
    DUNGEON_CLEARED: 'dungeon:cleared',
    DUNGEON_TIER_UNLOCKED: 'dungeon:tier',
    PLAYER_DIED: 'player:died',
    TOAST: 'ui:toast',
    SAVED: 'save:written',
    OPEN_PANEL: 'ui:openPanel',
    CLOSE_PANELS: 'ui:closePanels'
  };
})(window);
