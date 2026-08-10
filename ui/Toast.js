/**
 * ui/Toast.js
 * Transient corner messages ("+42 XP", "Gate cleared", "Not enough gold").
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});

  const Toast = {
    _root: null,
    _max: 4,

    init() {
      this._root = global.document.getElementById('toasts');
      HA.Events.on(HA.EVT.TOAST, (payload) => {
        if (typeof payload === 'string') this.show(payload);
        else this.show(payload.text, payload.kind, payload.life);
      });
    },

    /**
     * @param {string} text
     * @param {'info'|'good'|'bad'|'gold'|'xp'} [kind]
     * @param {number} [life] ms before it fades
     */
    show(text, kind, life) {
      if (!this._root || !text) return;
      const lifeMs = life || 2400;
      const node = global.document.createElement('div');
      node.className = `toast toast--${kind || 'info'}`;
      node.style.setProperty('--toast-life', `${lifeMs}ms`);
      node.textContent = text;
      this._root.appendChild(node);

      while (this._root.children.length > this._max) {
        this._root.removeChild(this._root.firstChild);
      }
      global.setTimeout(() => node.remove(), lifeMs + 400);
    }
  };

  HA.Toast = Toast;
  /** Shorthand used everywhere else. */
  HA.toast = (text, kind, life) => Toast.show(text, kind, life);
})(window);
