/**
 * systems/CombatSystem.js
 * Pure damage maths. No Phaser objects in here — scenes pass in plain stat
 * bags, which keeps combat testable and reusable for future skills/bosses.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const CFG = HA.Config;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  const CombatSystem = {
    /**
     * @param {{attack:number, critChance?:number}} attacker
     * @param {{defense:number}} defender
     * @returns {{damage:number, crit:boolean}}
     */
    resolve(attacker, defender) {
      const variance = randomBetween(0.9, 1.12);
      const crit = Math.random() < (attacker.critChance || 0);
      const mitigation = (defender.defense || 0) * 0.6;
      let damage = attacker.attack * variance - mitigation;
      if (crit) damage *= CFG.CRIT_MULTIPLIER;
      return { damage: Math.max(1, Math.round(damage)), crit };
    },

    playerHits(enemy) {
      return this.resolve(
        { attack: HA.Player.attack, critChance: HA.Player.critChance },
        { defense: enemy.defense }
      );
    },

    enemyHitsPlayer(enemy) {
      return this.resolve(
        { attack: enemy.attack, critChance: 0.05 },
        { defense: HA.Player.defense }
      );
    },

    /** Scale a base enemy definition to a dungeon tier. */
    scaleEnemy(def, tier, scaling) {
      const factor = Math.pow(scaling || 1.5, Math.max(0, (tier || 1) - 1));
      return {
        id: def.id,
        name: tier > 1 ? `${def.name} +${tier - 1}` : def.name,
        texture: def.texture,
        tint: def.tint,
        boss: !!def.boss,
        scale: def.scale || 1,
        maxHp: Math.round(def.hp * factor),
        hp: Math.round(def.hp * factor),
        attack: Math.round(def.attack * Math.pow(factor, 0.8)),
        defense: Math.round(def.defense * Math.pow(factor, 0.7)),
        speed: Math.round(def.speed * Math.min(1.4, Math.pow(factor, 0.12))),
        aggroRange: def.aggroRange,
        xp: Math.round(def.xp * Math.pow(factor, 0.9)),
        gold: Math.round(def.gold * Math.pow(factor, 0.85))
      };
    }
  };

  HA.Combat = CombatSystem;
})(window);
