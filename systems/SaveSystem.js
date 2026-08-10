/**
 * systems/SaveSystem.js
 * localStorage persistence. Everything the game needs to resume — stats,
 * inventory, position, quest log and dungeon progress — round-trips through
 * here. Writes are throttled; reads are defensive (a corrupt blob starts a new
 * game rather than throwing).
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const CFG = HA.Config;

  const SaveSystem = {
    _available: null,
    _timer: null,
    _dirty: false,

    /** Feature-detect localStorage (private mode / disabled storage). */
    isAvailable() {
      if (this._available !== null) return this._available;
      try {
        const probe = '__ha_probe__';
        global.localStorage.setItem(probe, '1');
        global.localStorage.removeItem(probe);
        this._available = true;
      } catch (err) {
        console.warn('[SaveSystem] localStorage unavailable, progress will not persist.', err);
        this._available = false;
      }
      return this._available;
    },

    load() {
      if (!this.isAvailable()) return null;
      let raw;
      try {
        raw = global.localStorage.getItem(CFG.SAVE_KEY);
      } catch (err) {
        console.warn('[SaveSystem] read failed', err);
        return null;
      }
      if (!raw) return null;
      try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return null;
        return this.migrate(data);
      } catch (err) {
        console.warn('[SaveSystem] corrupt save discarded', err);
        return null;
      }
    },

    /** Hook for future schema changes; today every version is v1. */
    migrate(data) {
      if (!data.version) data.version = CFG.SAVE_VERSION;
      return data;
    },

    write(data) {
      if (!this.isAvailable()) return false;
      try {
        data.version = CFG.SAVE_VERSION;
        data.savedAt = Date.now();
        global.localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(data));
        HA.Events.emit(HA.EVT.SAVED, data.savedAt);
        return true;
      } catch (err) {
        console.warn('[SaveSystem] write failed', err);
        return false;
      }
    },

    clear() {
      if (!this.isAvailable()) return;
      try {
        global.localStorage.removeItem(CFG.SAVE_KEY);
      } catch (err) {
        console.warn('[SaveSystem] clear failed', err);
      }
    },

    /** Mark state dirty; the autosave loop flushes it. */
    markDirty() {
      this._dirty = true;
    },

    flush() {
      if (!HA.Player) return;
      this._dirty = false;
      this.write(HA.Player.serialize());
    },

    /** Start autosaving. Also flushes on tab hide / unload. */
    startAutosave() {
      if (this._timer) return;
      this._timer = global.setInterval(() => {
        if (this._dirty) this.flush();
      }, CFG.AUTOSAVE_MS);

      global.addEventListener('visibilitychange', () => {
        if (global.document.visibilityState === 'hidden') this.flush();
      });
      global.addEventListener('pagehide', () => this.flush());
      global.addEventListener('beforeunload', () => this.flush());
    },

    stopAutosave() {
      if (this._timer) {
        global.clearInterval(this._timer);
        this._timer = null;
      }
    },

    /** Export/import helpers — handy for moving a save between devices. */
    exportString() {
      return btoa(unescape(encodeURIComponent(JSON.stringify(HA.Player.serialize()))));
    },

    importString(encoded) {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(encoded.trim()))));
      this.write(parsed);
      return parsed;
    }
  };

  HA.SaveSystem = SaveSystem;
})(window);
