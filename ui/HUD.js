/**
 * ui/HUD.js
 * Binds player state to the DOM overlay: HP/XP bars, gold, level, rank badge,
 * panel buttons, the level-up animation and the System menu.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const doc = global.document;
  const EVT = HA.EVT;

  const HUD = {
    _els: null,
    _saveTimer: null,

    init() {
      this._els = {
        portrait: doc.getElementById('hud-portrait'),
        goldIcon: doc.getElementById('gold-icon'),
        name: doc.getElementById('hud-name'),
        level: doc.getElementById('hud-level'),
        rank: doc.getElementById('hud-rank'),
        rankName: doc.getElementById('hud-rank-name'),
        hpFill: doc.getElementById('bar-hp-fill'),
        hpText: doc.getElementById('bar-hp-text'),
        xpFill: doc.getElementById('bar-xp-fill'),
        xpText: doc.getElementById('bar-xp-text'),
        gold: doc.getElementById('hud-gold'),
        location: doc.getElementById('hud-location'),
        saved: doc.getElementById('hud-save'),
        questBadge: doc.getElementById('quest-badge'),
        statBadge: doc.getElementById('stat-badge'),
        levelup: doc.getElementById('levelup'),
        levelupLevel: doc.getElementById('levelup-level'),
        levelupSub: doc.getElementById('levelup-sub')
      };

      this._els.portrait.src = HA.TextureFactory.icons.portrait;
      this._els.goldIcon.src = HA.TextureFactory.icons.icon_gold;

      for (const button of doc.querySelectorAll('#hud-buttons .hbtn')) {
        button.addEventListener('click', () => this.openPanel(button.dataset.panel));
      }

      doc.addEventListener('keydown', (event) => this._onKeyDown(event));

      HA.Events.on(EVT.STATE_CHANGED, () => this.refresh());
      HA.Events.on(EVT.HP_CHANGED, () => this.refresh());
      HA.Events.on(EVT.GOLD_CHANGED, () => this.refresh());
      HA.Events.on(EVT.QUEST_COMPLETED, () => this.refresh());
      HA.Events.on(EVT.QUESTS_RESET, () => this.refresh());
      HA.Events.on(EVT.LEVEL_UP, (payload) => this.playLevelUp(payload));
      HA.Events.on(EVT.RANK_UP, (payload) => {
        HA.toast(`RANK UP — you are now a ${payload.rank.name}.`, 'gold', 4200);
      });
      HA.Events.on(EVT.SAVED, () => this.flashSaved());
      HA.Events.on(EVT.OPEN_PANEL, (name) => this.openPanel(name));

      this.refresh();
    },

    _onKeyDown(event) {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (HA.Modal.isOpen) return; // Esc is handled by Modal itself
      switch (key) {
        case 'q': this.openPanel('quests'); break;
        case 'i': case 'b': this.openPanel('inventory'); break;
        case 'c': this.openPanel('stats'); break;
        case 'escape': this.openPanel('menu'); break;
        default: return;
      }
      event.preventDefault();
    },

    openPanel(name) {
      if (HA.Modal.isOpen) {
        if (!HA.Modal.canDismiss()) return; // a results screen is waiting
        HA.Modal.close(true);
      }
      switch (name) {
        case 'quests': HA.QuestPanel.open(); break;
        case 'inventory': HA.InventoryPanel.open(); break;
        case 'stats': HA.StatsPanel.open(); break;
        case 'menu': this.openSystemMenu(); break;
        default: break;
      }
    },

    setLocation(text) {
      if (this._els) this._els.location.textContent = text;
    },

    refresh() {
      if (!this._els || !HA.Player) return;
      const player = HA.Player;
      const els = this._els;

      els.name.textContent = player.data.name;
      els.level.textContent = `Lv ${player.level}`;

      const rank = player.rank;
      els.rank.textContent = rank.id;
      els.rank.style.background = rank.color;
      els.rank.style.color = '#05060d';
      els.rankName.textContent = rank.name;

      const maxHp = player.maxHp;
      const hpPct = Math.max(0, Math.min(1, player.hp / maxHp));
      els.hpFill.style.width = `${hpPct * 100}%`;
      els.hpText.textContent = `${Math.ceil(player.hp)} / ${maxHp}`;

      const xpNeeded = player.xpToNext;
      const xpPct = Math.max(0, Math.min(1, player.data.xp / xpNeeded));
      els.xpFill.style.width = `${xpPct * 100}%`;
      els.xpText.textContent = `${player.data.xp} / ${xpNeeded} XP`;

      els.gold.textContent = player.gold.toLocaleString();

      const pendingQuests = HA.QuestSystem.available().length;
      els.questBadge.textContent = pendingQuests;
      els.questBadge.classList.toggle('hidden', pendingQuests === 0);

      const points = player.data.statPoints;
      els.statBadge.textContent = points;
      els.statBadge.classList.toggle('hidden', points === 0);
    },

    flashSaved() {
      const node = this._els.saved;
      node.textContent = 'saved';
      node.classList.add('is-visible');
      if (this._saveTimer) global.clearTimeout(this._saveTimer);
      this._saveTimer = global.setTimeout(() => node.classList.remove('is-visible'), 900);
    },

    /** Full-screen level-up burst. */
    playLevelUp(payload) {
      const els = this._els;
      els.levelupLevel.textContent = `Lv ${payload.level}`;
      els.levelupSub.textContent = `+${HA.Config.STAT_POINTS_PER_LEVEL * payload.levelsGained} stat points · HP restored`;
      els.levelup.classList.remove('hidden');
      // Restart the CSS animations by forcing a reflow.
      const ring = els.levelup.querySelector('.levelup__ring');
      const text = els.levelup.querySelector('.levelup__text');
      for (const node of [ring, text]) {
        node.style.animation = 'none';
        void node.offsetWidth;
        node.style.animation = '';
      }
      global.setTimeout(() => els.levelup.classList.add('hidden'), 1700);
      HA.toast(`Level ${payload.level} reached — spend your points in the Status window.`, 'xp', 3600);
    },

    openSystemMenu() {
      const modal = HA.Modal;
      modal.open({
        title: 'System',
        render: (body) => {
          const saved = HA.Player.data.savedAt ? new Date(HA.Player.data.savedAt) : null;
          body.appendChild(
            modal.el('p', null, 'Progress saves automatically to this browser. Clearing site data erases the hunter.')
          );
          body.appendChild(modal.keyValue('Storage', HA.SaveSystem.isAvailable() ? 'localStorage (active)' : 'unavailable'));
          body.appendChild(modal.keyValue('Last save', saved ? saved.toLocaleTimeString() : 'not yet'));
          body.appendChild(modal.keyValue('Hunter since', new Date(HA.Player.data.createdAt).toLocaleDateString()));

          body.appendChild(modal.sectionTitle('Controls'));
          const controls = modal.el('div');
          controls.appendChild(modal.keyValue('Move', 'WASD / Arrow keys / thumbstick'));
          controls.appendChild(modal.keyValue('Attack', 'Space or J'));
          controls.appendChild(modal.keyValue('Interact', 'E or Enter'));
          controls.appendChild(modal.keyValue('Quick heal', 'H'));
          controls.appendChild(modal.keyValue('Panels', 'Q quests · I bag · C status · Esc system'));
          body.appendChild(controls);

          body.appendChild(modal.sectionTitle('Backup'));
          const backup = modal.el('div', 'list');
          backup.appendChild(
            modal.button('Copy save code', 'btn--ghost', () => {
              const code = HA.SaveSystem.exportString();
              if (global.navigator.clipboard) {
                global.navigator.clipboard.writeText(code).then(
                  () => HA.toast('Save code copied to clipboard.', 'good'),
                  () => global.prompt('Copy your save code:', code)
                );
              } else {
                global.prompt('Copy your save code:', code);
              }
            })
          );
          backup.appendChild(
            modal.button('Restore from code', 'btn--ghost', () => {
              const code = global.prompt('Paste a save code:');
              if (!code) return;
              try {
                HA.SaveSystem.importString(code);
                global.location.reload();
              } catch (err) {
                HA.toast('That save code could not be read.', 'bad');
              }
            })
          );
          body.appendChild(backup);
        },
        actions: [
          {
            label: 'Save now',
            onClick: () => {
              HA.SaveSystem.flush();
              HA.toast('Progress saved.', 'good');
            }
          },
          {
            label: 'Erase save',
            className: 'btn--danger',
            onClick: () => {
              if (global.confirm('Erase this hunter permanently? This cannot be undone.')) {
                HA.SaveSystem.stopAutosave();
                HA.SaveSystem.clear();
                global.location.reload();
              }
            }
          },
          { label: 'Close', className: 'btn--ghost', keepOpen: false }
        ]
      });
    }
  };

  HA.HUD = HUD;
})(window);
