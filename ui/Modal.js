/**
 * ui/Modal.js
 * One reusable dialog for every popup in the game: building interactions,
 * inventory, quests, status, shop, dungeon results.
 *
 * While a modal is open `HA.Modal.isOpen` is true and the scenes stop reading
 * movement/attack input, so the hunter never wanders off during a conversation.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const doc = global.document;

  const Modal = {
    isOpen: false,
    _current: null,
    _els: null,

    init() {
      this._els = {
        root: doc.getElementById('modal-root'),
        title: doc.getElementById('modal-title'),
        body: doc.getElementById('modal-body'),
        actions: doc.getElementById('modal-actions'),
        close: doc.getElementById('modal-close')
      };

      this._els.close.addEventListener('click', () => this.close());
      this._els.root.addEventListener('click', (event) => {
        if (event.target.dataset.close) this.close();
      });

      doc.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isOpen) {
          event.preventDefault();
          this.close();
        }
      });

      HA.Events.on(HA.EVT.CLOSE_PANELS, () => this.close());
    },

    /**
     * @param {{
     *   title: string,
     *   render: (body: HTMLElement) => void,
     *   actions?: Array<{label:string, className?:string, disabled?:boolean, keepOpen?:boolean, onClick?:Function}>,
     *   onClose?: Function,
     *   dismissible?: boolean
     * }} options
     */
    open(options) {
      this._current = options;
      this.isOpen = true;
      const { root, title, close } = this._els;
      title.textContent = options.title || '';
      close.style.display = options.dismissible === false ? 'none' : '';
      root.classList.remove('hidden');
      if (HA.Touch) HA.Touch.setVisible(false);
      this.refresh();
      return this;
    },

    /** False while a results-style modal is waiting to be acknowledged. */
    canDismiss() {
      return !this._current || this._current.dismissible !== false;
    },

    /** Re-run the current modal's render + actions (after state changes). */
    refresh() {
      if (!this._current) return;
      const { body, actions } = this._els;
      body.innerHTML = '';
      actions.innerHTML = '';

      if (typeof this._current.render === 'function') {
        this._current.render(body);
      }

      const list = this._current.actions || [];
      if (!list.length) {
        actions.style.display = 'none';
      } else {
        actions.style.display = '';
        for (const spec of list) {
          const button = doc.createElement('button');
          button.type = 'button';
          button.className = `btn ${spec.className || ''}`.trim();
          button.textContent = spec.label;
          button.disabled = !!spec.disabled;
          button.addEventListener('click', () => {
            // Close first when the action dismisses the dialog, so a handler
            // that opens another panel isn't immediately closed again.
            const dismisses = spec.keepOpen === false;
            if (dismisses) this.close(true);
            const result = spec.onClick ? spec.onClick() : undefined;
            if (dismisses) return;
            if (result === 'close') this.close(true);
            else this.refresh();
          });
          actions.appendChild(button);
        }
      }
    },

    /**
     * @param {boolean} [force] required to dismiss a modal opened with
     *   `dismissible: false` (results screens the player must acknowledge).
     */
    close(force) {
      if (!this.isOpen) return;
      if (!force && this._current && this._current.dismissible === false) return;
      this.isOpen = false;
      this._els.root.classList.add('hidden');
      if (HA.Touch) HA.Touch.setVisible(true);
      const onClose = this._current && this._current.onClose;
      this._current = null;
      if (onClose) onClose();
    },

    // -- small DOM helpers shared by the panels ---------------------------

    el(tag, className, text) {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined && text !== null) node.textContent = text;
      return node;
    },

    sectionTitle(text) {
      return this.el('div', 'section-title', text);
    },

    keyValue(label, value) {
      const row = this.el('div', 'kv');
      row.appendChild(this.el('span', null, label));
      row.appendChild(this.el('span', null, String(value)));
      return row;
    },

    button(label, className, onClick, disabled) {
      const button = this.el('button', `btn ${className || ''}`.trim(), label);
      button.type = 'button';
      button.disabled = !!disabled;
      button.addEventListener('click', onClick);
      return button;
    }
  };

  HA.Modal = Modal;
})(window);
