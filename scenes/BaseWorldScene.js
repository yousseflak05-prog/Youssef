/**
 * scenes/BaseWorldScene.js
 * Shared behaviour for any explorable map: tilemap building, the hunter, input,
 * melee combat, enemies, floating numbers and interaction prompts.
 *
 * TownScene and DungeonScene extend this. A future forest/second town only has
 * to supply a tile grid and its own interactables.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const CFG = HA.Config;
  const TILE = HA.TextureFactory.TILE;

  class BaseWorldScene extends Phaser.Scene {
    constructor(key) {
      super(key);
      this.interactables = [];
      this.enemies = null;
      this.player = null;
      this.facing = 'down';
      this.lastAttackAt = -9999;
      this.invulnUntil = 0;
      this.isDead = false;
    }

    // ------------------------------------------------------------- setup

    /** Build a tilemap layer from a 2D array of tile indices. */
    buildMap(grid) {
      const map = this.make.tilemap({
        data: grid,
        tileWidth: CFG.TILE,
        tileHeight: CFG.TILE
      });
      const tileset = map.addTilesetImage('tiles');
      const layer = map.createLayer(0, tileset, 0, 0);
      layer.setCollision(HA.TextureFactory.SOLID_TILES);

      this.map = map;
      this.groundLayer = layer;
      this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      return layer;
    }

    createAnimations() {
      if (this.anims.exists('walk-down')) return;
      const make = (key, frames, rate) =>
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers('player', { frames }),
          frameRate: rate,
          repeat: -1
        });
      make('walk-down', [0, 1], 7);
      make('walk-up', [2, 3], 7);
      make('walk-side', [4, 5], 7);
      make('idle-down', [0], 1);
      make('idle-up', [2], 1);
      make('idle-side', [4], 1);

      for (const key of ['imp', 'wolf', 'golem', 'knight']) {
        this.anims.create({
          key: `enemy-${key}`,
          frames: this.anims.generateFrameNumbers(`enemy_${key}`, { frames: [0, 1] }),
          frameRate: 4,
          repeat: -1
        });
      }

      this.anims.create({
        key: 'portal-spin',
        frames: this.anims.generateFrameNumbers('portal', { frames: [0, 1, 2, 3, 4, 5] }),
        frameRate: 8,
        repeat: -1
      });
    }

    createPlayer(x, y) {
      const shadow = this.add.image(x, y + 13, 'fx_shadow').setDepth(4).setAlpha(0.7);
      const player = this.physics.add.sprite(x, y, 'player', 0);
      player.setDepth(10);
      player.body.setSize(14, 12).setOffset(9, 18);
      player.setCollideWorldBounds(true);
      this.player = player;
      this.playerShadow = shadow;

      if (this.groundLayer) this.physics.add.collider(player, this.groundLayer);

      this.cameras.main.startFollow(player, true, 0.14, 0.14);
      this.cameras.main.setRoundPixels(true);
      this.applyCameraZoom();
      this.scale.on('resize', this.applyCameraZoom, this);
      return player;
    }

    /** Zoom in on small screens so the pixel art stays readable. */
    applyCameraZoom() {
      const width = this.scale.gameSize.width || global.innerWidth;
      const height = this.scale.gameSize.height || global.innerHeight;
      const shortest = Math.min(width, height);
      let zoom = 1.5;
      if (shortest < 460) zoom = 2;
      else if (shortest < 620) zoom = 1.75;
      else if (width > 1400) zoom = 2;
      this.cameras.main.setZoom(zoom);
    }

    setupInput() {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,J,K,E,ENTER,H');
      // Let the browser keep Q/I/C/Esc for the DOM panels.
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT
      ]);
    }

    /**
     * Register something the player can walk up to and press E on.
     * @param {{x:number,y:number,label:string,radius?:number,onInteract:Function}} spec
     */
    addInteractable(spec) {
      this.interactables.push(Object.assign({ radius: CFG.INTERACT_RADIUS }, spec));
      return spec;
    }

    createPrompt() {
      this.prompt = this.add
        .text(0, 0, '', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#e0f2fe',
          backgroundColor: 'rgba(5,6,13,0.82)',
          padding: { x: 6, y: 3 }
        })
        .setOrigin(0.5, 1)
        .setDepth(60)
        .setVisible(false);
    }

    // ----------------------------------------------------------- enemies

    createEnemyGroup() {
      this.enemies = this.physics.add.group();
      if (this.groundLayer) this.physics.add.collider(this.enemies, this.groundLayer);
      this.physics.add.collider(this.enemies, this.enemies);
      this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
        this.onEnemyTouch(enemy);
      });
    }

    spawnEnemy(defId, x, y, tier, scaling) {
      const base = HA.Enemies[defId];
      if (!base) return null;
      const stats = HA.Combat.scaleEnemy(base, tier || 1, scaling);

      const sprite = this.enemies.create(x, y, base.texture, 0);
      sprite.stats = stats;
      sprite.setDepth(9);
      sprite.setScale(stats.scale || 1);
      sprite.setCollideWorldBounds(true);
      sprite.setBounce(0.2);
      sprite.body.setSize(16, 14).setOffset(8, 16);
      sprite.play(`enemy-${defId.split('_')[1] || defId}`, true);
      sprite.nextHitAt = 0;

      // health pip above the sprite
      const width = stats.boss ? 56 : 26;
      sprite.hpBg = this.add.rectangle(x, y - 22, width, 4, 0x0b0f1d).setDepth(11).setAlpha(0.85);
      sprite.hpFill = this.add
        .rectangle(x - width / 2, y - 22, width, 3, stats.boss ? 0xef4444 : 0x38bdf8)
        .setOrigin(0, 0.5)
        .setDepth(12);
      sprite.hpWidth = width;

      if (stats.boss) {
        sprite.label = this.add
          .text(x, y - 32, stats.name, {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#fca5a5'
          })
          .setOrigin(0.5, 1)
          .setDepth(12);
      }
      return sprite;
    }

    updateEnemies(delta) {
      if (!this.enemies) return;
      const player = this.player;
      for (const enemy of this.enemies.getChildren()) {
        if (!enemy.active) continue;
        const stats = enemy.stats;
        const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

        if (!this.isDead && distance < stats.aggroRange) {
          this.physics.moveToObject(enemy, player, stats.speed);
          enemy.flipX = player.x < enemy.x;
        } else if (enemy.body) {
          enemy.body.velocity.scale(0.9);
        }

        // keep the health pip glued to the sprite
        const ratio = Phaser.Math.Clamp(stats.hp / stats.maxHp, 0, 1);
        enemy.hpBg.setPosition(enemy.x, enemy.y - 20 * (stats.scale || 1));
        enemy.hpFill.setPosition(enemy.x - enemy.hpWidth / 2, enemy.y - 20 * (stats.scale || 1));
        enemy.hpFill.width = enemy.hpWidth * ratio;
        if (enemy.label) enemy.label.setPosition(enemy.x, enemy.y - 30 * (stats.scale || 1));
      }
    }

    onEnemyTouch(enemy) {
      if (this.isDead || !enemy.active) return;
      const now = this.time.now;
      if (now < this.invulnUntil || now < enemy.nextHitAt) return;

      enemy.nextHitAt = now + CFG.ENEMY_HIT_COOLDOWN_MS;
      this.invulnUntil = now + CFG.INVULN_MS;

      const { damage, crit } = HA.Combat.enemyHitsPlayer(enemy.stats);
      const fatal = HA.Player.takeDamage(damage);

      this.floatingText(this.player.x, this.player.y - 18, `-${damage}${crit ? '!' : ''}`, '#f87171');
      this.cameras.main.shake(120, crit ? 0.008 : 0.004);
      this.player.setTint(0xff6b6b);
      this.tweens.add({
        targets: this.player,
        alpha: 0.35,
        duration: 90,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          this.player.clearTint();
          this.player.setAlpha(1);
        }
      });

      // knock the hunter away from the hit
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      this.player.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220);

      if (fatal) this.onPlayerDeath();
    }

    // ------------------------------------------------------------ combat

    tryAttack() {
      const now = this.time.now;
      if (now - this.lastAttackAt < CFG.ATTACK_COOLDOWN_MS) return;
      this.lastAttackAt = now;

      const offsets = {
        down: { x: 0, y: 1 },
        up: { x: 0, y: -1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };
      const dir = offsets[this.facing] || offsets.down;
      const cx = this.player.x + dir.x * CFG.ATTACK_REACH;
      const cy = this.player.y + dir.y * CFG.ATTACK_REACH + 4;

      // swing visual
      const slash = this.add.image(cx, cy, 'fx_slash').setDepth(20).setScale(0.85);
      slash.setRotation(Math.atan2(dir.y, dir.x));
      this.tweens.add({
        targets: slash,
        scale: 1.15,
        alpha: 0,
        duration: 190,
        onComplete: () => slash.destroy()
      });

      // pose for a beat
      this.player.anims.stop();
      this.player.setFrame(this.facing === 'up' || this.facing === 'down' ? 6 : 7);
      this.attackPoseUntil = now + 160;

      const hitbox = new Phaser.Geom.Rectangle(
        cx - CFG.ATTACK_WIDTH / 2,
        cy - CFG.ATTACK_WIDTH / 2,
        CFG.ATTACK_WIDTH,
        CFG.ATTACK_WIDTH
      );

      let hitAnything = false;
      if (this.enemies) {
        for (const enemy of this.enemies.getChildren()) {
          if (!enemy.active) continue;
          if (!Phaser.Geom.Intersects.RectangleToRectangle(hitbox, enemy.getBounds())) continue;
          hitAnything = true;
          this.damageEnemy(enemy, dir);
        }
      }
      if (!hitAnything) this.sfxWhiff();
    }

    damageEnemy(enemy, dir) {
      const { damage, crit } = HA.Combat.playerHits(enemy.stats);
      enemy.stats.hp -= damage;

      this.floatingText(
        enemy.x,
        enemy.y - 26,
        crit ? `${damage}!` : `${damage}`,
        crit ? '#facc15' : '#e2e8f0',
        crit ? 16 : 13
      );

      enemy.setTintFill(0xffffff);
      this.time.delayedCall(70, () => enemy.active && enemy.clearTint());
      if (enemy.body) {
        enemy.body.velocity.x += dir.x * 180;
        enemy.body.velocity.y += dir.y * 180;
      }

      this.emitSparks(enemy.x, enemy.y);
      if (enemy.stats.hp <= 0) this.killEnemy(enemy);
    }

    killEnemy(enemy) {
      // The corpse lingers for a death tween, so guard against a second swing
      // landing on it — that would pay out loot twice and desync room counts.
      if (enemy.isDying) return;
      enemy.isDying = true;
      enemy.setActive(false);

      const stats = enemy.stats;
      const x = enemy.x;
      const y = enemy.y;

      enemy.hpBg.destroy();
      enemy.hpFill.destroy();
      if (enemy.label) enemy.label.destroy();

      enemy.body.enable = false;
      enemy.setTintFill(0x38bdf8);
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        scaleX: (stats.scale || 1) * 1.3,
        scaleY: (stats.scale || 1) * 0.6,
        duration: 260,
        onComplete: () => enemy.destroy()
      });
      this.emitSparks(x, y, 14);

      const xp = HA.Player.addXp(stats.xp, { source: `enemy:${stats.id}` });
      const gold = HA.Player.addGold(stats.gold);
      this.floatingText(x, y - 40, `+${xp} XP`, '#c084fc', 12);
      this.floatingText(x + 14, y - 26, `+${gold}g`, '#facc15', 12);

      if (this.onEnemyKilled) this.onEnemyKilled(enemy, stats);
    }

    onPlayerDeath() {
      if (this.isDead) return;
      this.isDead = true;
      this.player.setVelocity(0, 0);
      HA.Events.emit(HA.EVT.PLAYER_DIED, { scene: this.scene.key });

      const lost = Math.floor(HA.Player.gold * CFG.DEATH_GOLD_PENALTY);
      if (lost > 0) HA.Player.addGold(-lost, { raw: true });

      this.cameras.main.shake(320, 0.012);
      this.tweens.add({ targets: this.player, angle: 90, alpha: 0.4, duration: 420 });
      this.cameras.main.fade(900, 8, 8, 20);

      this.time.delayedCall(1000, () => {
        HA.Player.data.hp = Math.max(1, Math.ceil(HA.Player.maxHp * CFG.RESPAWN_HP_FRACTION));
        HA.Events.emit(HA.EVT.HP_CHANGED, { hp: HA.Player.hp, maxHp: HA.Player.maxHp });
        HA.SaveSystem.flush();
        HA.toast(
          lost > 0
            ? `You fell. Dragged back to town — ${lost} gold lost.`
            : 'You fell. Dragged back to town.',
          'bad',
          4200
        );
        this.scene.start('TownScene', { spawn: 'home' });
      });
    }

    // -------------------------------------------------------------- fx

    floatingText(x, y, text, color, size) {
      const label = this.add
        .text(x, y, text, {
          fontFamily: 'monospace',
          fontSize: `${size || 13}px`,
          color: color || '#e2e8f0',
          stroke: '#05060d',
          strokeThickness: 3
        })
        .setOrigin(0.5)
        .setDepth(40);
      this.tweens.add({
        targets: label,
        y: y - 26,
        alpha: 0,
        duration: 750,
        ease: 'Cubic.easeOut',
        onComplete: () => label.destroy()
      });
    }

    emitSparks(x, y, count) {
      const particles = this.add.particles(x, y, 'fx_spark', {
        speed: { min: 40, max: 130 },
        lifespan: 320,
        quantity: count || 7,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        emitting: false
      });
      particles.setDepth(30);
      particles.explode(count || 7);
      this.time.delayedCall(400, () => particles.destroy());
    }

    sfxWhiff() { /* hook for audio — intentionally silent in the prototype */ }

    // ----------------------------------------------------------- update

    /** Movement + actions. Scenes call this from their own update(). */
    handleInput(delta) {
      const player = this.player;
      if (!player || !player.body) return;

      if (HA.Modal.isOpen || this.isDead) {
        player.setVelocity(0, 0);
        return;
      }

      const speed = HA.Player.moveSpeed;
      let vx = 0;
      let vy = 0;

      if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;

      if (HA.Touch.enabled) {
        const stick = HA.Touch.vector;
        if (Math.abs(stick.x) > 0.01 || Math.abs(stick.y) > 0.01) {
          vx += stick.x * 1.6;
          vy += stick.y * 1.6;
        }
      }

      const magnitude = Math.hypot(vx, vy);
      if (magnitude > 0) {
        const scale = Math.min(1, magnitude) / magnitude;
        player.setVelocity(vx * scale * speed, vy * scale * speed);
        if (Math.abs(vx) > Math.abs(vy)) this.facing = vx < 0 ? 'left' : 'right';
        else this.facing = vy < 0 ? 'up' : 'down';
      } else {
        player.setVelocity(0, 0);
      }

      this.updatePlayerAnimation(magnitude > 0);

      const attackPressed =
        Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
        Phaser.Input.Keyboard.JustDown(this.keys.J) ||
        HA.Touch.consumeAttack();
      if (attackPressed) this.tryAttack();

      const interactPressed =
        Phaser.Input.Keyboard.JustDown(this.keys.E) ||
        Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
        HA.Touch.consumeInteract();
      if (interactPressed) this.tryInteract();

      if (Phaser.Input.Keyboard.JustDown(this.keys.H)) {
        const message = HA.Inventory.quickHeal();
        if (message) HA.toast(message, message.startsWith('No') ? 'bad' : 'good');
      }
    }

    updatePlayerAnimation(moving) {
      if (this.attackPoseUntil && this.time.now < this.attackPoseUntil) return;
      const player = this.player;
      const sideways = this.facing === 'left' || this.facing === 'right';
      player.flipX = this.facing === 'left';
      const suffix = sideways ? 'side' : this.facing;
      player.anims.play(`${moving ? 'walk' : 'idle'}-${suffix}`, true);
    }

    /** Nearest interactable within range, or null. */
    nearestInteractable() {
      if (!this.player) return null;
      let best = null;
      let bestDistance = Infinity;
      for (const spot of this.interactables) {
        if (spot.disabled) continue;
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, spot.x, spot.y);
        if (distance <= spot.radius && distance < bestDistance) {
          best = spot;
          bestDistance = distance;
        }
      }
      return best;
    }

    tryInteract() {
      const spot = this.nearestInteractable();
      if (spot && spot.onInteract) spot.onInteract();
    }

    updatePrompt() {
      if (!this.prompt) return;
      const spot = HA.Modal.isOpen ? null : this.nearestInteractable();
      if (!spot) {
        this.prompt.setVisible(false);
        return;
      }
      const hint = HA.Touch.enabled ? 'Tap E' : '[E]';
      this.prompt.setText(`${hint} ${spot.label}`);
      this.prompt.setPosition(spot.x, spot.y - (spot.promptOffset || 46));
      this.prompt.setVisible(true);
    }

    syncShadow() {
      if (this.playerShadow && this.player) {
        this.playerShadow.setPosition(this.player.x, this.player.y + 13);
        this.playerShadow.setVisible(this.player.visible && !this.isDead);
      }
    }

    /** Persist where the hunter is standing so a reload resumes here. */
    savePosition() {
      if (!this.player || this.persistPosition === false) return;
      HA.Player.setPosition(this.scene.key, this.player.x, this.player.y);
    }

    baseUpdate(time, delta) {
      this.handleInput(delta);
      this.updateEnemies(delta);
      this.updatePrompt();
      this.syncShadow();

      this._saveAccumulator = (this._saveAccumulator || 0) + delta;
      if (this._saveAccumulator > 2000) {
        this._saveAccumulator = 0;
        this.savePosition();
      }
    }

    shutdownBase() {
      this.scale.off('resize', this.applyCameraZoom, this);
      this.savePosition();
      HA.SaveSystem.flush();
    }
  }

  HA.BaseWorldScene = BaseWorldScene;
  HA.TILE_INDEX = TILE;
})(window);
