/**
 * ui/TouchControls.js
 * Virtual thumbstick + action buttons for phones and tablets.
 *
 * Scenes read `HA.Touch.vector` alongside the keyboard, and poll
 * consumeAttack()/consumeInteract() for the two action buttons, so touch and
 * keyboard paths stay identical downstream.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const doc = global.document;

  const TouchControls = {
    enabled: false,
    vector: { x: 0, y: 0 },
    _attack: false,
    _interact: false,
    _pointerId: null,
    _origin: { x: 0, y: 0 },
    _radius: 52,
    _els: null,

    isTouchDevice() {
      return (
        'ontouchstart' in global ||
        (global.navigator && global.navigator.maxTouchPoints > 0)
      );
    },

    init() {
      this._els = {
        root: doc.getElementById('touch-controls'),
        stick: doc.getElementById('touch-stick'),
        knob: doc.getElementById('touch-stick-knob'),
        attack: doc.getElementById('touch-attack'),
        interact: doc.getElementById('touch-interact')
      };

      if (!this.isTouchDevice()) return;
      this.enable();
    },

    enable() {
      if (this.enabled) return;
      this.enabled = true;
      this._els.root.classList.remove('hidden');
      doc.body.classList.add('is-touch');
      this._bindStick();
      this._bindButton(this._els.attack, () => { this._attack = true; });
      this._bindButton(this._els.interact, () => { this._interact = true; });
    },

    _bindButton(node, onPress) {
      const press = (event) => {
        event.preventDefault();
        onPress();
      };
      node.addEventListener('pointerdown', press);
      node.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    _bindStick() {
      const { stick, knob } = this._els;

      const start = (event) => {
        event.preventDefault();
        this._pointerId = event.pointerId;
        const rect = stick.getBoundingClientRect();
        this._origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        this._radius = rect.width * 0.4;
        stick.setPointerCapture(event.pointerId);
        move(event);
      };

      const move = (event) => {
        if (this._pointerId !== event.pointerId) return;
        event.preventDefault();
        let dx = event.clientX - this._origin.x;
        let dy = event.clientY - this._origin.y;
        const distance = Math.hypot(dx, dy);
        const clamped = Math.min(distance, this._radius);
        if (distance > 0) {
          dx = (dx / distance) * clamped;
          dy = (dy / distance) * clamped;
        }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;

        // Small dead zone so resting thumbs don't drift.
        const magnitude = clamped / this._radius;
        if (magnitude < 0.18) {
          this.vector = { x: 0, y: 0 };
        } else {
          this.vector = { x: dx / this._radius, y: dy / this._radius };
        }
      };

      const end = (event) => {
        if (this._pointerId !== event.pointerId) return;
        this._pointerId = null;
        this.vector = { x: 0, y: 0 };
        knob.style.transform = '';
      };

      stick.addEventListener('pointerdown', start);
      stick.addEventListener('pointermove', move);
      stick.addEventListener('pointerup', end);
      stick.addEventListener('pointercancel', end);
      stick.addEventListener('lostpointercapture', end);
      stick.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    consumeAttack() {
      const pressed = this._attack;
      this._attack = false;
      return pressed;
    },

    consumeInteract() {
      const pressed = this._interact;
      this._interact = false;
      return pressed;
    },

    /** Hide the pad while a modal is up so it can't be mashed through UI. */
    setVisible(visible) {
      if (!this.enabled) return;
      this._els.root.classList.toggle('hidden', !visible);
      if (!visible) {
        this.vector = { x: 0, y: 0 };
        this._els.knob.style.transform = '';
      }
    }
  };

  HA.Touch = TouchControls;
})(window);
