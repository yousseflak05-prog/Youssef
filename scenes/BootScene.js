/**
 * scenes/BootScene.js
 * Generates every texture, loads the save, then hands off to the town.
 *
 * There is no asset download step in the prototype — art is drawn in code by
 * TextureFactory. If you drop real PNGs into /assets, load them in preload()
 * with the same keys and BootScene will use them instead (see assets/README.md).
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  class BootScene extends Phaser.Scene {
    constructor() {
      super('BootScene');
    }

    preload() {
      this.setStatus('Weaving mana into pixels…');
      // Real artwork, when you have it, goes here:
      //   this.load.spritesheet('player', 'assets/player.png',
      //     { frameWidth: 32, frameHeight: 32 });
      //   this.load.image('tiles', 'assets/tileset.png');
    }

    create() {
      HA.TextureFactory.generateAll(this);

      // Restore (or start) the hunter now that textures exist for the HUD.
      const saved = HA.SaveSystem.load();
      HA.Player = saved ? HA.PlayerState.fromSave(saved) : HA.PlayerState.newGame();
      HA.QuestSystem.refresh();

      HA.HUD.init();
      HA.SaveSystem.startAutosave();
      HA.SaveSystem.flush();

      this.setStatus(saved ? 'Hunter record found. Welcome back.' : 'Registering new hunter…');
      this.time.delayedCall(saved ? 250 : 450, () => {
        this.hideBootScreen();
        this.scene.start('TownScene');
      });
    }

    setStatus(text) {
      const node = global.document.getElementById('boot-status');
      if (node) node.textContent = text;
    }

    hideBootScreen() {
      const screen = global.document.getElementById('boot-screen');
      if (!screen) return;
      screen.classList.add('is-gone');
      global.setTimeout(() => screen.classList.add('hidden'), 600);
    }
  }

  HA.BootScene = BootScene;
})(window);
