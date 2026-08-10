/**
 * scenes/TownScene.js
 * Ascension Town — the safe hub. Five interactables: Home, Training Hall,
 * Library, Guild Hall and the Dungeon Gate.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const CFG = HA.Config;
  const T = HA.TextureFactory.TILE;

  const MAP_W = 40;
  const MAP_H = 30;

  // Door tile coordinates for every structure in town.
  const BUILDINGS = [
    { key: 'home', texture: 'building_home', tx: 8, ty: 10, label: 'Home' },
    { key: 'training', texture: 'building_training', tx: 15, ty: 7, label: 'Training Hall' },
    { key: 'library', texture: 'building_library', tx: 27, ty: 10, label: 'Library' },
    { key: 'guild', texture: 'building_guild', tx: 20, ty: 22, label: 'Guild Hall' }
  ];

  const GATE = { tx: 30, ty: 5 };
  const PLAZA = { x: 20, y: 15 };

  class TownScene extends HA.BaseWorldScene {
    constructor() {
      super('TownScene');
    }

    create(data) {
      this.isDead = false;
      this.interactables = [];
      this.cameras.main.setBackgroundColor('#080b14');
      this.createAnimations();

      this.buildMap(this.generateGrid());
      this.decorate();

      const spawn = this.resolveSpawn(data || {});
      this.createPlayer(spawn.x, spawn.y);
      this.setupInput();
      this.createPrompt();
      this.createEnemyGroup(); // empty in town, but keeps combat code uniform

      this.buildStructures();
      this.buildGate();

      this.cameras.main.fadeIn(400, 5, 6, 13);
      HA.HUD.setLocation('Ascension Town');
      HA.QuestSystem.refresh();
      HA.HUD.refresh();

      this.events.once('shutdown', () => this.shutdownBase());

      if (!HA.Player.getFlag('seenIntro')) {
        HA.Player.setFlag('seenIntro', true);
        this.time.delayedCall(500, () => this.showIntro());
      } else if (data && data.cleared) {
        HA.toast('Gate sealed. Ascension Town welcomes you back.', 'good', 3600);
      }
    }

    // ------------------------------------------------------------- map

    generateGrid() {
      const grid = [];
      for (let y = 0; y < MAP_H; y += 1) {
        const row = [];
        for (let x = 0; x < MAP_W; x += 1) {
          const edge = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
          if (edge || x === 1 || y === 1 || x === MAP_W - 2 || y === MAP_H - 2) {
            row.push(T.TREE);
          } else {
            row.push(Math.random() < 0.06 ? T.GRASS_ALT : T.GRASS);
          }
        }
        grid.push(row);
      }

      const setTile = (x, y, index) => {
        if (x > 0 && y > 0 && x < MAP_W - 1 && y < MAP_H - 1) grid[y][x] = index;
      };
      const rect = (x0, y0, w, h, index) => {
        for (let y = y0; y < y0 + h; y += 1) {
          for (let x = x0; x < x0 + w; x += 1) setTile(x, y, index);
        }
      };
      const hLine = (x0, x1, y, index) => {
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x += 1) setTile(x, y, index);
      };
      const vLine = (y0, y1, x, index) => {
        for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y += 1) setTile(x, y, index);
      };

      // Roads first, plazas on top — the stone courtyards should stay clean.
      for (const building of BUILDINGS) {
        hLine(PLAZA.x, building.tx, PLAZA.y, T.PATH);
        hLine(PLAZA.x, building.tx, PLAZA.y + 1, T.PATH);
        vLine(PLAZA.y, building.ty + 1, building.tx, T.PATH);
        vLine(PLAZA.y, building.ty + 1, building.tx + 1, T.PATH);
      }
      hLine(PLAZA.x, GATE.tx, PLAZA.y - 3, T.PATH);
      vLine(PLAZA.y - 3, GATE.ty + 2, GATE.tx, T.PATH);

      // central plaza + gate courtyard
      rect(PLAZA.x - 4, PLAZA.y - 3, 9, 7, T.PLAZA);
      rect(GATE.tx - 3, GATE.ty - 1, 7, 5, T.PLAZA);

      // pond + rocks + copses, so the open grass isn't a flat field
      rect(5, 22, 6, 4, T.WATER);
      setTile(4, 22, T.ROCK);
      setTile(11, 25, T.ROCK);
      setTile(33, 20, T.ROCK);
      setTile(34, 21, T.ROCK);
      setTile(6, 5, T.ROCK);

      const copses = [[4, 16], [30, 25], [36, 12], [24, 3], [10, 19], [33, 26], [3, 8]];
      for (const [cx, cy] of copses) {
        for (let dy = 0; dy < 2; dy += 1) {
          for (let dx = 0; dx < 2; dx += 1) {
            if (Math.random() < 0.75) setTile(cx + dx, cy + dy, T.TREE);
          }
        }
      }

      // fenced training yard next to the hall
      for (let x = 11; x <= 19; x += 1) setTile(x, 4, T.FENCE);
      setTile(11, 5, T.FENCE);
      setTile(19, 5, T.FENCE);

      return grid;
    }

    decorate() {
      // a few torches around the plaza, drawn as glowing particles
      const spots = [
        [PLAZA.x - 4, PLAZA.y - 3],
        [PLAZA.x + 4, PLAZA.y - 3],
        [PLAZA.x - 4, PLAZA.y + 3],
        [PLAZA.x + 4, PLAZA.y + 3]
      ];
      for (const [tx, ty] of spots) {
        const x = tx * CFG.TILE + CFG.TILE / 2;
        const y = ty * CFG.TILE + CFG.TILE / 2;
        this.add.rectangle(x, y, 6, 16, 0x1b2233).setDepth(3);
        const flame = this.add.image(x, y - 10, 'fx_spark').setDepth(5).setScale(1.6).setBlendMode('ADD');
        this.tweens.add({
          targets: flame,
          scale: 2.2,
          alpha: 0.6,
          duration: 700 + Math.random() * 400,
          yoyo: true,
          repeat: -1
        });
      }
    }

    resolveSpawn(data) {
      const tile = (tx, ty) => ({ x: tx * CFG.TILE + CFG.TILE / 2, y: ty * CFG.TILE + CFG.TILE / 2 });
      if (data.spawn === 'home') return tile(BUILDINGS[0].tx, BUILDINGS[0].ty + 2);
      if (data.spawn === 'gate') return tile(GATE.tx, GATE.ty + 3);

      const saved = HA.Player.data.position;
      if (saved && saved.scene === 'TownScene' && saved.x && saved.y) {
        return { x: saved.x, y: saved.y };
      }
      return tile(PLAZA.x, PLAZA.y + 2);
    }

    // ------------------------------------------------------ structures

    buildStructures() {
      const blockers = [];

      for (const spec of BUILDINGS) {
        const x = spec.tx * CFG.TILE + CFG.TILE / 2;
        const y = spec.ty * CFG.TILE + CFG.TILE;

        const sprite = this.add.image(x, y, spec.texture).setOrigin(0.5, 1).setDepth(6);

        // Collider covers the building body but leaves the doorway walkable.
        const blocker = this.add.rectangle(x, y - sprite.height * 0.55, sprite.width - 10, sprite.height * 0.8);
        this.physics.add.existing(blocker, true);
        blockers.push(blocker);

        const sign = this.add
          .text(x, y - sprite.height - 6, spec.label, {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#93c5fd',
            stroke: '#05060d',
            strokeThickness: 3
          })
          .setOrigin(0.5, 1)
          .setDepth(7);
        sign.setAlpha(0.9);

        this.addInteractable({
          x,
          y: y + 18,
          label: spec.label,
          promptOffset: 30,
          onInteract: () => this[`open${spec.key[0].toUpperCase()}${spec.key.slice(1)}`]()
        });
      }

      this.physics.add.collider(this.player, blockers);
    }

    buildGate() {
      const x = GATE.tx * CFG.TILE + CFG.TILE / 2;
      const y = GATE.ty * CFG.TILE + CFG.TILE;

      const portal = this.add.sprite(x, y - 20, 'portal', 0).setDepth(6);
      portal.play('portal-spin');
      portal.setScale(1);

      const glow = this.add.particles(x, y - 20, 'fx_spark', {
        speed: { min: 10, max: 45 },
        lifespan: 1200,
        frequency: 90,
        scale: { start: 1.1, end: 0 },
        alpha: { start: 0.9, end: 0 },
        blendMode: 'ADD',
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Ellipse(0, 0, 60, 90),
          quantity: 1
        }
      });
      glow.setDepth(7);

      this.add
        .text(x, y - 90, 'BLUE GATE', {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#7dd3fc',
          stroke: '#05060d',
          strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(8);

      this.addInteractable({
        x,
        y: y + 16,
        label: 'Enter the Gate',
        radius: 70,
        promptOffset: 26,
        onInteract: () => this.openDungeonGate()
      });
    }

    // ---------------------------------------------------- interactions

    showIntro() {
      const modal = HA.Modal;
      modal.open({
        title: 'System Notice',
        render: (body) => {
          body.appendChild(
            modal.el(
              'p',
              null,
              `You have been selected as a Player, ${HA.Player.data.name}. The system will now track your ascension.`
            )
          );
          body.appendChild(
            modal.el(
              'p',
              null,
              'Your hunter grows from two sources: gates you clear here, and the work you do out there. Log real tasks in the Daily Quests panel and the system will convert discipline into power.'
            )
          );
          body.appendChild(modal.sectionTitle('Controls'));
          body.appendChild(modal.keyValue('Move', 'WASD / arrows / thumbstick'));
          body.appendChild(modal.keyValue('Attack', 'Space or J'));
          body.appendChild(modal.keyValue('Interact', 'E or Enter'));
          body.appendChild(modal.keyValue('Panels', 'Q quests · I bag · C status'));
        },
        actions: [
          {
            label: 'Open Daily Quests',
            onClick: () => {
              HA.QuestPanel.open();
              return 'handled';
            },
            keepOpen: false
          },
          { label: 'Arise', className: 'btn--ghost', keepOpen: false }
        ]
      });
    }

    openHome() {
      const modal = HA.Modal;
      modal.open({
        title: 'Home',
        render: (body) => {
          body.appendChild(
            modal.el('p', null, 'A small apartment above the noodle shop. Quiet, cheap, and yours.')
          );
          body.appendChild(modal.keyValue('HP', `${Math.ceil(HA.Player.hp)} / ${HA.Player.maxHp}`));
          body.appendChild(modal.keyValue('Daily quests done', `${HA.QuestSystem.completedCount()} / ${HA.Quests.length}`));
          body.appendChild(modal.keyValue('Quests reset in', HA.QuestSystem.formattedReset()));
        },
        actions: [
          {
            label: 'Rest (full heal)',
            disabled: HA.Player.hp >= HA.Player.maxHp,
            onClick: () => {
              const healed = HA.Player.fullHeal();
              HA.SaveSystem.flush();
              HA.toast(healed > 0 ? `Rested. +${healed} HP.` : 'Already rested.', 'good');
            }
          },
          {
            label: 'Daily Quests',
            onClick: () => {
              HA.QuestPanel.open();
            },
            keepOpen: false
          },
          { label: 'Leave', className: 'btn--ghost', keepOpen: false }
        ]
      });
    }

    openTraining() {
      this._trainingModal('Training Hall', [
        { key: 'strength', label: 'Strength', blurb: 'Heavier swings, tougher body.' },
        { key: 'agility', label: 'Agility', blurb: 'Faster steps, sharper crits.' }
      ], CFG.TRAINING_COST);
    }

    openLibrary() {
      this._trainingModal('Library', [
        { key: 'intelligence', label: 'Intelligence', blurb: 'Better gold returns from every source.' },
        { key: 'discipline', label: 'Discipline', blurb: 'More XP from everything you do.' }
      ], CFG.LIBRARY_COST);
    }

    _trainingModal(title, options, baseCost) {
      const modal = HA.Modal;
      const costFor = (key) => Math.round(baseCost * (1 + HA.Player.stats[key] * 0.08));

      modal.open({
        title,
        render: (body) => {
          body.appendChild(
            modal.el(
              'p',
              null,
              title === 'Library'
                ? 'Shelves of gate reports and monster taxonomies. Study costs money; ignorance costs more.'
                : 'Weighted dummies, mana-treated flooring, and an instructor who does not smile.'
            )
          );
          body.appendChild(modal.keyValue('Gold', HA.Player.gold));
          body.appendChild(modal.sectionTitle('Train an attribute'));

          const list = modal.el('div', 'list');
          for (const option of options) {
            const cost = costFor(option.key);
            const row = modal.el('div', 'row');
            const main = modal.el('div', 'row__main');
            const name = modal.el('div', 'row__name');
            name.appendChild(modal.el('span', null, `${option.label} · ${HA.Player.stats[option.key]}`));
            main.appendChild(name);
            main.appendChild(modal.el('div', 'row__desc', option.blurb));
            main.appendChild(modal.el('div', 'row__rewards', `Cost ${cost} gold`));
            row.appendChild(main);

            const side = modal.el('div', 'row__side');
            side.appendChild(
              modal.button(
                `Train ${cost}g`,
                'btn--gold',
                () => {
                  if (!HA.Player.spendGold(cost)) {
                    HA.toast('Not enough gold.', 'bad');
                    return;
                  }
                  HA.Player.addStat(option.key, 1);
                  HA.toast(`+1 ${option.label}.`, 'good');
                  modal.refresh();
                },
                HA.Player.gold < cost
              )
            );
            row.appendChild(side);
            list.appendChild(row);
          }
          body.appendChild(list);

          if (title === 'Library') {
            body.appendChild(modal.sectionTitle('Gate archive'));
            for (const id of HA.DungeonOrder) {
              const def = HA.Dungeons[id];
              const progress = HA.DungeonSystem.progress(id);
              body.appendChild(
                modal.keyValue(
                  def.name,
                  `${progress.clears} clears · ${HA.DungeonSystem.tierName(progress.unlockedTier)} unlocked`
                )
              );
            }
          }
        },
        actions: [{ label: 'Leave', className: 'btn--ghost', keepOpen: false }]
      });
    }

    openGuild() {
      const modal = HA.Modal;
      modal.open({
        title: 'Guild Hall',
        render: (body) => {
          const rank = HA.Player.rank;
          const next = HA.Ranks.nextAfter(HA.Player.level);
          body.appendChild(
            modal.el('p', null, 'The association desk. Licences, supplies, and a healer who charges by the wound.')
          );
          const rankRow = modal.keyValue('Licence', rank.name);
          rankRow.lastChild.style.color = rank.color;
          body.appendChild(rankRow);
          body.appendChild(
            modal.keyValue('Next promotion', next ? `${next.name} at level ${next.minLevel}` : 'You stand at the top.')
          );
          body.appendChild(modal.keyValue('Gold', HA.Player.gold));

          body.appendChild(modal.sectionTitle('Supplies'));
          const list = modal.el('div', 'list');
          for (const itemId of HA.ItemUtil.shopStock) {
            const item = HA.ItemUtil.get(itemId);
            const row = modal.el('div', 'row');

            const icon = modal.el('div', 'row__icon');
            const img = global.document.createElement('img');
            img.src = HA.TextureFactory.iconFor(itemId);
            img.alt = '';
            icon.appendChild(img);
            row.appendChild(icon);

            const main = modal.el('div', 'row__main');
            const name = modal.el('div', 'row__name');
            name.appendChild(modal.el('span', null, item.name));
            const rarity = HA.ItemUtil.rarityOf(itemId);
            const tag = modal.el('span', 'tag', rarity.name);
            tag.style.color = rarity.color;
            name.appendChild(tag);
            main.appendChild(name);
            main.appendChild(modal.el('div', 'row__desc', item.description));
            main.appendChild(modal.el('div', 'row__rewards', `Owned: ${HA.Inventory.countOf(itemId)}`));
            row.appendChild(main);

            const side = modal.el('div', 'row__side');
            side.appendChild(
              modal.button(
                `Buy ${item.value}g`,
                'btn--gold',
                () => {
                  if (HA.Inventory.buy(itemId)) HA.toast(`Bought ${item.name}.`, 'good');
                  else HA.toast('Not enough gold.', 'bad');
                  modal.refresh();
                },
                HA.Player.gold < item.value
              )
            );
            row.appendChild(side);
            list.appendChild(row);
          }
          body.appendChild(list);
        },
        actions: [
          {
            label: `Heal ${CFG.GUILD_HEAL_COST}g`,
            className: 'btn--gold',
            disabled: HA.Player.hp >= HA.Player.maxHp || HA.Player.gold < CFG.GUILD_HEAL_COST,
            onClick: () => {
              if (!HA.Player.spendGold(CFG.GUILD_HEAL_COST)) {
                HA.toast('Not enough gold.', 'bad');
                return;
              }
              const healed = HA.Player.fullHeal();
              HA.toast(`Patched up. +${healed} HP.`, 'good');
            }
          },
          { label: 'Inventory', onClick: () => HA.InventoryPanel.open(), keepOpen: false },
          { label: 'Leave', className: 'btn--ghost', keepOpen: false }
        ]
      });
    }

    openDungeonGate() {
      const modal = HA.Modal;
      const dungeonId = HA.DungeonOrder[0];
      const def = HA.Dungeons[dungeonId];
      const progress = HA.DungeonSystem.progress(dungeonId);

      modal.open({
        title: 'Dungeon Gate',
        render: (body) => {
          body.appendChild(
            modal.el('p', null, `A ${def.subtitle}. Mana pressure hums against your teeth.`)
          );
          body.appendChild(modal.keyValue('Gate', def.name));
          body.appendChild(modal.keyValue('Rooms', def.rooms.length));
          body.appendChild(modal.keyValue('Clears', progress.clears));
          body.appendChild(
            modal.keyValue('Highest tier cleared', progress.highestTierCleared ? HA.DungeonSystem.tierName(progress.highestTierCleared) : '—')
          );
          body.appendChild(modal.keyValue('Your HP', `${Math.ceil(HA.Player.hp)} / ${HA.Player.maxHp}`));

          body.appendChild(modal.sectionTitle('Choose a difficulty'));
          const list = modal.el('div', 'list');
          for (const tier of HA.DungeonSystem.availableTiers(dungeonId)) {
            const row = modal.el('div', 'row');
            const main = modal.el('div', 'row__main');
            const name = modal.el('div', 'row__name');
            name.appendChild(modal.el('span', null, `${def.name} · ${HA.DungeonSystem.tierName(tier)}`));
            if (tier > progress.highestTierCleared) {
              const tag = modal.el('span', 'tag', 'Uncleared');
              tag.style.color = '#facc15';
              name.appendChild(tag);
            }
            main.appendChild(name);
            const factor = Math.pow(def.tierScaling.enemy, tier - 1);
            main.appendChild(
              modal.el('div', 'row__desc', `Enemy power ×${factor.toFixed(2)} · rewards ×${Math.pow(def.tierScaling.reward, tier - 1).toFixed(2)}`)
            );
            row.appendChild(main);

            const side = modal.el('div', 'row__side');
            side.appendChild(
              modal.button('Enter', '', () => {
                modal.close();
                this.enterDungeon(dungeonId, tier);
              })
            );
            row.appendChild(side);
            list.appendChild(row);
          }
          body.appendChild(list);

          if (HA.Player.hp < HA.Player.maxHp * 0.4) {
            const warn = modal.el('p', null, '⚠ You are badly hurt. Rest at Home or heal at the Guild Hall first.');
            warn.style.color = '#f87171';
            warn.style.marginTop = '10px';
            body.appendChild(warn);
          }
        },
        actions: [{ label: 'Step back', className: 'btn--ghost', keepOpen: false }]
      });
    }

    enterDungeon(dungeonId, tier) {
      this.savePosition();
      this.cameras.main.fade(420, 5, 20, 60);
      this.time.delayedCall(440, () => {
        this.scene.start('DungeonScene', { dungeonId, tier });
      });
    }

    update(time, delta) {
      this.baseUpdate(time, delta);
    }
  }

  HA.TownScene = TownScene;
})(window);
