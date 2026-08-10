/**
 * main.js
 * Bootstraps the DOM UI, then the Phaser game.
 *
 * Load order (see index.html): data -> systems -> ui -> scenes -> main.
 * Everything hangs off the single global `HA` namespace, so there is no build
 * step: open index.html and it runs.
 */
(function (global) {
  'use strict';

  const HA = global.HA;

  function fail(message, error) {
    console.error('[Hunter Ascension]', message, error || '');
    const status = global.document.getElementById('boot-status');
    if (status) {
      status.textContent = message;
      status.classList.add('is-error');
    }
  }

  function start() {
    if (!global.Phaser) {
      fail('Phaser failed to load. Check that vendor/phaser.min.js is present.');
      return;
    }

    // DOM UI first — BootScene talks to the HUD as soon as it has a player.
    HA.Toast.init();
    HA.Modal.init();
    HA.Touch.init();

    const config = {
      type: Phaser.AUTO,
      parent: 'game-canvas',
      backgroundColor: '#05060d',
      pixelArt: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: /[?&]debug=1/.test(global.location.search)
        }
      },
      scene: [HA.BootScene, HA.TownScene, HA.DungeonScene]
    };

    try {
      HA.game = new Phaser.Game(config);
    } catch (error) {
      fail('The gate refused to open. See the browser console for details.', error);
      return;
    }

    // Pause the simulation when the tab is hidden so nothing drifts.
    global.document.addEventListener('visibilitychange', () => {
      if (!HA.game || !HA.game.scene) return;
      const hidden = global.document.visibilityState === 'hidden';
      for (const key of ['TownScene', 'DungeonScene']) {
        const scene = HA.game.scene.getScene(key);
        if (!scene) continue;
        if (hidden && scene.scene.isActive()) scene.scene.pause();
        else if (!hidden && scene.scene.isPaused()) scene.scene.resume();
      }
    });
  }

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
