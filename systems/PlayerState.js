/**
 * systems/PlayerState.js
 * The single source of truth for the hunter. Scenes render it, systems mutate
 * it through these methods, and SaveSystem serialises it verbatim.
 *
 * Derived numbers (max HP, attack, defense, crit, move speed) are always
 * computed from base stats + equipment so a save never stores a stale value.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const CFG = HA.Config;
  const EVT = HA.EVT;

  function todayKey(date) {
    const d = date || new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  function defaultData() {
    return {
      version: CFG.SAVE_VERSION,
      createdAt: Date.now(),
      savedAt: Date.now(),
      name: CFG.HERO_NAME,

      level: 1,
      xp: 0,
      statPoints: 0,
      stats: { strength: 5, intelligence: 5, agility: 5, discipline: 5 },
      hp: null, // filled in below from maxHp

      gold: 50,

      inventory: [
        { id: 'sword', qty: 1 },
        { id: 'health_potion', qty: 3 }
      ],
      equipment: { weapon: null, armor: null },

      position: { scene: 'TownScene', x: 0, y: 0 },

      quests: {
        date: todayKey(),
        completed: [],
        perfectDayClaimed: false,
        streak: 0,
        lastPerfectDate: null,
        totals: {}
      },

      dungeons: {},

      flags: { seenIntro: false },
      playtimeMs: 0
    };
  }

  class PlayerState {
    constructor(data) {
      this.data = data || defaultData();
      this._normalise();
    }

    // -- lifecycle ---------------------------------------------------------

    static newGame() {
      const state = new PlayerState(defaultData());
      state.data.hp = state.maxHp;
      return state;
    }

    static fromSave(raw) {
      if (!raw) return PlayerState.newGame();
      const base = defaultData();
      const merged = Object.assign(base, raw);
      merged.stats = Object.assign(base.stats, raw.stats || {});
      merged.equipment = Object.assign(base.equipment, raw.equipment || {});
      merged.position = Object.assign(base.position, raw.position || {});
      merged.quests = Object.assign(base.quests, raw.quests || {});
      merged.flags = Object.assign(base.flags, raw.flags || {});
      merged.dungeons = raw.dungeons || {};
      merged.inventory = Array.isArray(raw.inventory) ? raw.inventory : base.inventory;
      const state = new PlayerState(merged);
      if (typeof state.data.hp !== 'number' || Number.isNaN(state.data.hp)) {
        state.data.hp = state.maxHp;
      }
      state.data.hp = Phaser.Math.Clamp(state.data.hp, 0, state.maxHp);
      if (state.data.hp <= 0) state.data.hp = Math.ceil(state.maxHp * CFG.RESPAWN_HP_FRACTION);
      return state;
    }

    _normalise() {
      const d = this.data;
      d.level = Math.max(1, Math.floor(d.level || 1));
      d.xp = Math.max(0, Math.floor(d.xp || 0));
      d.gold = Math.max(0, Math.floor(d.gold || 0));
      d.statPoints = Math.max(0, Math.floor(d.statPoints || 0));
      for (const key of Object.keys(d.stats)) {
        d.stats[key] = Math.max(1, Math.floor(d.stats[key] || 1));
      }
      if (d.hp === null || d.hp === undefined) d.hp = this.maxHp;
    }

    serialize() {
      // Plain deep copy — the state is pure JSON already.
      return JSON.parse(JSON.stringify(this.data));
    }

    // -- derived stats -----------------------------------------------------

    get stats() { return this.data.stats; }
    get level() { return this.data.level; }
    get gold() { return this.data.gold; }
    get hp() { return this.data.hp; }

    get equippedWeapon() { return HA.ItemUtil.get(this.data.equipment.weapon); }
    get equippedArmor() { return HA.ItemUtil.get(this.data.equipment.armor); }

    _gearBonus(key) {
      let total = 0;
      for (const item of [this.equippedWeapon, this.equippedArmor]) {
        if (item && item.stats && item.stats[key]) {
          const mult = HA.Rarity[item.rarity] ? HA.Rarity[item.rarity].mult : 1;
          total += key === 'crit' ? item.stats[key] : item.stats[key] * mult;
        }
      }
      return total;
    }

    get maxHp() {
      const base = 60 + this.data.stats.strength * 8 + (this.data.level - 1) * 6;
      return Math.round(base + this._gearBonus('maxHp'));
    }

    get attack() {
      const base = 5 + this.data.stats.strength * 2 + Math.floor(this.data.stats.agility * 0.5);
      return Math.round(base + this._gearBonus('attack'));
    }

    get defense() {
      const base = 1 + Math.floor(this.data.stats.strength * 0.4);
      return Math.round(base + this._gearBonus('defense'));
    }

    get critChance() {
      return Math.min(0.6, 0.04 + this.data.stats.agility * 0.008 + this._gearBonus('crit'));
    }

    get moveSpeed() {
      const raw = CFG.BASE_SPEED + this.data.stats.agility * CFG.SPEED_PER_AGILITY + this._gearBonus('speed');
      return Math.min(CFG.MAX_SPEED, raw);
    }

    /** Discipline makes every XP source worth more. */
    get xpMultiplier() {
      return 1 + this.data.stats.discipline * 0.02;
    }

    /** Intelligence improves gold income. */
    get goldMultiplier() {
      return 1 + this.data.stats.intelligence * 0.015;
    }

    get rank() {
      return HA.Ranks.forLevel(this.data.level);
    }

    get xpToNext() {
      return HA.Ranks.xpForLevel(this.data.level);
    }

    // -- mutations ---------------------------------------------------------

    _touch() {
      HA.SaveSystem.markDirty();
      HA.Events.emit(EVT.STATE_CHANGED, this);
    }

    addXp(amount, opts) {
      const options = opts || {};
      const scaled = options.raw ? Math.round(amount) : Math.round(amount * this.xpMultiplier);
      if (scaled <= 0) return 0;
      this.data.xp += scaled;
      HA.Events.emit(EVT.XP_GAINED, { amount: scaled, source: options.source });

      let levelsGained = 0;
      while (this.data.level < CFG.MAX_LEVEL && this.data.xp >= this.xpToNext) {
        this.data.xp -= this.xpToNext;
        this.data.level += 1;
        this.data.statPoints += CFG.STAT_POINTS_PER_LEVEL;
        levelsGained += 1;
      }
      if (this.data.level >= CFG.MAX_LEVEL) this.data.xp = 0;

      if (levelsGained > 0) {
        const previousRank = HA.Ranks.forLevel(this.data.level - levelsGained);
        // Level-ups fully restore the hunter — a small mercy, and it makes
        // grinding a dungeon feel like progress rather than attrition.
        this.data.hp = this.maxHp;
        HA.Events.emit(EVT.LEVEL_UP, {
          level: this.data.level,
          levelsGained,
          statPoints: this.data.statPoints
        });
        HA.Events.emit(EVT.HP_CHANGED, { hp: this.data.hp, maxHp: this.maxHp });
        if (previousRank.id !== this.rank.id) {
          HA.Events.emit(EVT.RANK_UP, { rank: this.rank });
        }
      }
      this._touch();
      return scaled;
    }

    addGold(amount, opts) {
      const options = opts || {};
      const scaled = options.raw ? Math.round(amount) : Math.round(amount * this.goldMultiplier);
      this.data.gold = Math.max(0, this.data.gold + scaled);
      HA.Events.emit(EVT.GOLD_CHANGED, { gold: this.data.gold, delta: scaled });
      this._touch();
      return scaled;
    }

    spendGold(amount) {
      if (this.data.gold < amount) return false;
      this.data.gold -= amount;
      HA.Events.emit(EVT.GOLD_CHANGED, { gold: this.data.gold, delta: -amount });
      this._touch();
      return true;
    }

    addStat(key, amount) {
      if (!(key in this.data.stats)) return;
      const before = this.maxHp;
      this.data.stats[key] += amount;
      // Growing Strength raises max HP; hand the player the difference so a
      // stat point never feels like it did nothing.
      const gained = this.maxHp - before;
      if (gained > 0) this.data.hp = Math.min(this.maxHp, this.data.hp + gained);
      this._touch();
      HA.Events.emit(EVT.HP_CHANGED, { hp: this.data.hp, maxHp: this.maxHp });
    }

    /** Spend a level-up point. Returns false when none are available. */
    spendStatPoint(key) {
      if (this.data.statPoints <= 0) return false;
      if (!(key in this.data.stats)) return false;
      this.data.statPoints -= 1;
      this.addStat(key, 1);
      HA.Events.emit(EVT.STAT_POINTS, { remaining: this.data.statPoints });
      return true;
    }

    heal(amount) {
      const before = this.data.hp;
      this.data.hp = Math.min(this.maxHp, this.data.hp + Math.round(amount));
      HA.Events.emit(EVT.HP_CHANGED, { hp: this.data.hp, maxHp: this.maxHp });
      this._touch();
      return this.data.hp - before;
    }

    fullHeal() {
      return this.heal(this.maxHp);
    }

    /** Returns true if this damage was fatal. */
    takeDamage(amount) {
      this.data.hp = Math.max(0, this.data.hp - Math.round(amount));
      HA.Events.emit(EVT.HP_CHANGED, { hp: this.data.hp, maxHp: this.maxHp });
      this._touch();
      return this.data.hp <= 0;
    }

    setPosition(sceneKey, x, y) {
      this.data.position = { scene: sceneKey, x: Math.round(x), y: Math.round(y) };
      HA.SaveSystem.markDirty();
    }

    setFlag(key, value) {
      this.data.flags[key] = value;
      this._touch();
    }

    getFlag(key) {
      return this.data.flags[key];
    }
  }

  PlayerState.todayKey = todayKey;

  HA.PlayerState = PlayerState;
  HA.todayKey = todayKey;
})(window);
