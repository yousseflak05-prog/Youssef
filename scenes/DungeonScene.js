/**
 * scenes/DungeonScene.js
 * Builds a dungeon from its data definition: rooms in a row, joined by
 * corridors that stay sealed behind blue mana barriers until the room is clear.
 *
 * The whole layout is derived from `HA.Dungeons[id].layout` + `.rooms`, so a
 * second dungeon needs no code here — only another entry in data/dungeons.js.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const CFG = HA.Config;
  const T = HA.TextureFactory.TILE;

  class DungeonScene extends HA.BaseWorldScene {
    constructor() {
      super('DungeonScene');
    }

    init(data) {
      // A run is never resumed from a save — the hunter always reloads in town.
      this.persistPosition = false;
      this.dungeonId = (data && data.dungeonId) || HA.DungeonOrder[0];
      this.tier = (data && data.tier) || 1;
      this.def = HA.Dungeons[this.dungeonId];
      this.roomIndex = 0;
      this.cleared = false;
      this.isDead = false;
      this.startedAt = Date.now();
      this.barriers = [];
      this.interactables = [];
    }

    create() {
      this.cameras.main.setBackgroundColor('#03040a');
      this.createAnimations();

      const layout = this.def.layout;
      this.layout = layout;
      this.roomCount = this.def.rooms.length;

      this.grid = this.generateGrid();
      this.buildMap(this.grid);

      const spawn = this.roomCenter(0);
      this.createPlayer(spawn.x - CFG.TILE * 4, spawn.y);
      this.setupInput();
      this.createPrompt();
      this.createEnemyGroup();

      this.buildBarriers();
      this.buildExit();
      this.spawnRoom(0);

      this.cameras.main.fadeIn(500, 5, 20, 60);
      this.updateLocationLabel();
      this.events.once('shutdown', () => this.shutdownBase());

      HA.toast(`${this.def.name} · ${HA.DungeonSystem.tierName(this.tier)} — clear every room.`, 'info', 3600);
    }

    // ------------------------------------------------------------- map

    get roomStride() {
      return this.layout.roomWidth + this.layout.corridorLength;
    }

    roomOriginX(index) {
      return index * this.roomStride;
    }

    roomCenter(index) {
      const x = this.roomOriginX(index) + this.layout.roomWidth / 2;
      const y = this.layout.roomHeight / 2;
      return { x: x * CFG.TILE, y: y * CFG.TILE };
    }

    generateGrid() {
      const { roomWidth, roomHeight, corridorLength, corridorHeight } = this.layout;
      const width = this.roomCount * roomWidth + (this.roomCount - 1) * corridorLength;
      const height = roomHeight;

      const grid = [];
      for (let y = 0; y < height; y += 1) {
        grid.push(new Array(width).fill(T.D_WALL));
      }

      const carve = (x, y, index) => {
        if (x >= 0 && y >= 0 && x < width && y < height) grid[y][x] = index;
      };

      // room interiors
      for (let room = 0; room < this.roomCount; room += 1) {
        const x0 = this.roomOriginX(room);
        for (let y = 1; y < roomHeight - 1; y += 1) {
          for (let x = x0 + 1; x < x0 + roomWidth - 1; x += 1) {
            let tile = Math.random() < 0.14 ? T.D_FLOOR_ALT : T.D_FLOOR;
            if (Math.random() < 0.03) tile = T.RUBBLE;
            carve(x, y, tile);
          }
        }

        // rune circle in the middle of the boss room
        if (this.def.rooms[room].isBossRoom) {
          const cx = x0 + Math.floor(roomWidth / 2);
          const cy = Math.floor(roomHeight / 2);
          for (let dy = -2; dy <= 2; dy += 1) {
            for (let dx = -3; dx <= 3; dx += 1) {
              if (Math.abs(dx) + Math.abs(dy) <= 4) carve(cx + dx, cy + dy, T.D_RUNE);
            }
          }
        }

        // pillars for cover
        if (!this.def.rooms[room].isBossRoom) {
          carve(x0 + 4, 4, T.D_WALL);
          carve(x0 + roomWidth - 5, 4, T.D_WALL);
          carve(x0 + 4, roomHeight - 5, T.D_WALL);
          carve(x0 + roomWidth - 5, roomHeight - 5, T.D_WALL);
        }
      }

      // corridors (including the doorway tiles in both room walls)
      const midY = Math.floor(roomHeight / 2);
      const half = Math.floor(corridorHeight / 2);
      for (let room = 0; room < this.roomCount - 1; room += 1) {
        const startX = this.roomOriginX(room) + roomWidth - 1;
        const endX = this.roomOriginX(room + 1);
        for (let x = startX; x <= endX; x += 1) {
          for (let y = midY - half; y <= midY + half; y += 1) carve(x, y, T.D_FLOOR);
        }
      }

      return grid;
    }

    /** Mana barriers seal each corridor until the room behind them is cleared. */
    buildBarriers() {
      const { roomWidth, roomHeight, corridorHeight } = this.layout;
      const midY = Math.floor(roomHeight / 2);

      for (let room = 0; room < this.roomCount - 1; room += 1) {
        const tx = this.roomOriginX(room) + roomWidth - 1;
        const x = tx * CFG.TILE + CFG.TILE / 2;
        const y = midY * CFG.TILE + CFG.TILE / 2;

        const sprite = this.add.image(x, y, 'fx_barrier').setDepth(15);
        sprite.displayHeight = corridorHeight * CFG.TILE;
        sprite.setAlpha(0.85);
        this.tweens.add({ targets: sprite, alpha: 0.5, duration: 900, yoyo: true, repeat: -1 });

        const blocker = this.add.rectangle(x, y, CFG.TILE, corridorHeight * CFG.TILE);
        this.physics.add.existing(blocker, true);
        this.physics.add.collider(this.player, blocker);

        this.barriers.push({ sprite, blocker, room });
      }
    }

    /** Way back to town, at the mouth of the first room. */
    buildExit() {
      const center = this.roomCenter(0);
      const x = this.roomOriginX(0) * CFG.TILE + CFG.TILE * 1.5;
      const y = center.y;

      const portal = this.add.sprite(x, y, 'portal', 0).setDepth(6).setScale(0.75);
      portal.play('portal-spin');

      this.addInteractable({
        x,
        y,
        label: 'Leave the gate',
        radius: 60,
        promptOffset: 54,
        onInteract: () => this.confirmLeave()
      });
    }

    // ---------------------------------------------------------- rooms

    spawnRoom(index) {
      const room = this.def.rooms[index];
      if (!room) return;
      this.roomIndex = index;
      this.roomAlive = 0;

      const { roomWidth, roomHeight } = this.layout;
      const x0 = this.roomOriginX(index);
      const scaling = this.def.tierScaling.enemy;

      for (const spawn of room.spawns) {
        for (let i = 0; i < spawn.count; i += 1) {
          const tile = this.findFloorTile(x0 + 3, x0 + roomWidth - 4, 3, roomHeight - 4);
          const enemy = this.spawnEnemy(
            spawn.type,
            tile.tx * CFG.TILE + CFG.TILE / 2,
            tile.ty * CFG.TILE + CFG.TILE / 2,
            this.tier,
            scaling
          );
          if (enemy) {
            enemy.roomIndex = index;
            this.roomAlive += 1;
          }
        }
      }

      this.updateLocationLabel();
      const label = room.isBossRoom ? `${room.name} — boss` : room.name;
      HA.toast(`Room ${index + 1}/${this.roomCount} · ${label}`, 'info', 2600);

      // An empty room counts as cleared straight away.
      if (this.roomAlive === 0) this.time.delayedCall(200, () => this.onRoomCleared());
    }

    /** Pick a walkable tile in a rectangle, avoiding pillars and rubble walls. */
    findFloorTile(x0, x1, y0, y1) {
      const solid = HA.TextureFactory.SOLID_TILES;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const tx = Phaser.Math.Between(x0, x1);
        const ty = Phaser.Math.Between(y0, y1);
        if (solid.indexOf(this.grid[ty][tx]) === -1) return { tx, ty };
      }
      return { tx: Math.floor((x0 + x1) / 2), ty: Math.floor((y0 + y1) / 2) };
    }

    onEnemyKilled(enemy, stats) {
      if (enemy.roomIndex !== this.roomIndex) return;
      this.roomAlive -= 1;
      if (stats.boss) this.cameras.main.flash(320, 56, 189, 248);
      if (this.roomAlive > 0) return;
      this.onRoomCleared();
    }

    onRoomCleared() {
      const barrier = this.barriers.find((b) => b.room === this.roomIndex);
      if (barrier) {
        this.tweens.add({
          targets: barrier.sprite,
          alpha: 0,
          scaleX: 2,
          duration: 420,
          onComplete: () => barrier.sprite.destroy()
        });
        barrier.blocker.destroy();
        this.barriers = this.barriers.filter((b) => b !== barrier);
        HA.toast('Room cleared — the barrier fades.', 'good', 2600);
        this.time.delayedCall(300, () => this.spawnRoom(this.roomIndex + 1));
      } else {
        this.onDungeonCleared();
      }
    }

    onDungeonCleared() {
      if (this.cleared) return;
      this.cleared = true;
      const elapsed = Date.now() - this.startedAt;
      const summary = HA.DungeonSystem.completeClear(this.dungeonId, this.tier, elapsed);

      this.cameras.main.flash(600, 56, 189, 248);
      this.time.delayedCall(700, () => this.showResults(summary));
    }

    showResults(summary) {
      const modal = HA.Modal;
      modal.open({
        title: 'Gate Cleared',
        dismissible: false,
        render: (body) => {
          body.appendChild(
            modal.el('p', null, `${summary.dungeonName} · ${summary.tierName} sealed. The mana pressure drops.`)
          );
          body.appendChild(modal.keyValue('Time', `${Math.round(summary.elapsedMs / 1000)}s`));
          body.appendChild(modal.keyValue('XP', `+${summary.xp}`));
          body.appendChild(modal.keyValue('Gold', `+${summary.gold}`));

          body.appendChild(modal.sectionTitle('Loot'));
          if (!summary.items.length) {
            body.appendChild(modal.el('div', 'empty', 'The gate gave up nothing but dust.'));
          } else {
            const list = modal.el('div', 'list');
            for (const drop of summary.items) {
              const item = HA.ItemUtil.get(drop.id);
              const row = modal.el('div', 'row');
              const icon = modal.el('div', 'row__icon');
              const img = global.document.createElement('img');
              img.src = HA.TextureFactory.iconFor(drop.id);
              img.alt = '';
              icon.appendChild(img);
              row.appendChild(icon);

              const main = modal.el('div', 'row__main');
              const name = modal.el('div', 'row__name');
              name.appendChild(modal.el('span', null, `${item.name} ×${drop.qty}`));
              const rarity = HA.ItemUtil.rarityOf(drop.id);
              const tag = modal.el('span', 'tag', rarity.name);
              tag.style.color = rarity.color;
              name.appendChild(tag);
              main.appendChild(name);
              main.appendChild(modal.el('div', 'row__desc', item.description));
              row.appendChild(main);
              list.appendChild(row);
            }
            body.appendChild(list);
          }

          if (summary.unlockedTier) {
            const unlocked = modal.el(
              'p',
              null,
              `⚡ ${HA.DungeonSystem.tierName(summary.unlockedTier)} difficulty unlocked at this gate.`
            );
            unlocked.style.color = '#facc15';
            unlocked.style.marginTop = '10px';
            body.appendChild(unlocked);
          }
        },
        actions: [
          {
            label: 'Return to town',
            keepOpen: false,
            onClick: () => this.leaveDungeon(true)
          },
          {
            label: 'Run it again',
            className: 'btn--ghost',
            keepOpen: false,
            onClick: () => {
              this.scene.restart({ dungeonId: this.dungeonId, tier: this.tier });
            }
          }
        ]
      });
    }

    confirmLeave() {
      const modal = HA.Modal;
      modal.open({
        title: 'Leave the gate?',
        render: (body) => {
          body.appendChild(
            modal.el('p', null, 'Stepping out now abandons the run. Rooms you cleared will respawn on your next entry.')
          );
          body.appendChild(modal.keyValue('Progress', `Room ${this.roomIndex + 1} of ${this.roomCount}`));
          body.appendChild(modal.keyValue('HP', `${Math.ceil(HA.Player.hp)} / ${HA.Player.maxHp}`));
        },
        actions: [
          { label: 'Leave', keepOpen: false, onClick: () => this.leaveDungeon(false) },
          { label: 'Stay', className: 'btn--ghost', keepOpen: false }
        ]
      });
    }

    leaveDungeon(cleared) {
      this.cameras.main.fade(400, 5, 6, 13);
      this.time.delayedCall(420, () => {
        this.scene.start('TownScene', { spawn: 'gate', cleared: !!cleared });
      });
    }

    updateLocationLabel() {
      const room = this.def.rooms[this.roomIndex];
      HA.HUD.setLocation(
        `${this.def.name} · ${HA.DungeonSystem.tierName(this.tier)} — ${room ? room.name : 'Cleared'} (${this.roomIndex + 1}/${this.roomCount})`
      );
    }

    update(time, delta) {
      this.baseUpdate(time, delta);
    }
  }

  HA.DungeonScene = DungeonScene;
})(window);
