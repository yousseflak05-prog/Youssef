/**
 * ui/InventoryPanel.js
 * Bag + equipment. Equipment slots are shown first so the effect of a swap on
 * attack/defense is visible immediately.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const M = () => HA.Modal;

  const InventoryPanel = {
    open() {
      HA.Modal.open({
        title: 'Inventory',
        render: (body) => this.render(body),
        actions: [{ label: 'Close', className: 'btn--ghost', keepOpen: false }]
      });
    },

    render(body) {
      const modal = M();

      body.appendChild(modal.sectionTitle('Equipped'));
      const equipList = modal.el('div', 'list');
      equipList.appendChild(this._slotRow('weapon', 'Weapon'));
      equipList.appendChild(this._slotRow('armor', 'Armor'));
      body.appendChild(equipList);

      const summary = modal.el('div');
      summary.style.margin = '10px 0 4px';
      summary.appendChild(modal.keyValue('Attack', HA.Player.attack));
      summary.appendChild(modal.keyValue('Defense', HA.Player.defense));
      summary.appendChild(modal.keyValue('Crit chance', `${Math.round(HA.Player.critChance * 100)}%`));
      summary.appendChild(modal.keyValue('Move speed', Math.round(HA.Player.moveSpeed)));
      body.appendChild(summary);

      body.appendChild(modal.sectionTitle('Bag'));
      const bag = HA.Inventory.list;
      if (!bag.length) {
        body.appendChild(modal.el('div', 'empty', 'Your bag is empty. Clear a gate or visit the Guild Hall.'));
        return;
      }

      const list = modal.el('div', 'list');
      for (const slot of bag) list.appendChild(this._itemRow(slot));
      body.appendChild(list);
    },

    _slotRow(slot, label) {
      const modal = M();
      const itemId = HA.Player.data.equipment[slot];
      const item = HA.ItemUtil.get(itemId);
      const row = modal.el('div', 'row');

      const icon = modal.el('div', 'row__icon');
      if (item) {
        const img = global.document.createElement('img');
        img.src = HA.TextureFactory.iconFor(item.id);
        img.alt = '';
        icon.appendChild(img);
      } else {
        icon.textContent = '—';
      }
      row.appendChild(icon);

      const main = modal.el('div', 'row__main');
      const name = modal.el('div', 'row__name');
      name.appendChild(modal.el('span', null, item ? item.name : `No ${label.toLowerCase()}`));
      if (item) {
        const rarity = HA.ItemUtil.rarityOf(item.id);
        const tag = modal.el('span', 'tag', rarity.name);
        tag.style.color = rarity.color;
        name.appendChild(tag);
      }
      main.appendChild(name);
      main.appendChild(modal.el('div', 'row__desc', item ? this._statLine(item) : `${label} slot is empty.`));
      row.appendChild(main);

      if (item) {
        const side = modal.el('div', 'row__side');
        side.appendChild(
          modal.button('Unequip', 'btn--ghost', () => {
            HA.Inventory.unequip(slot);
            HA.Modal.refresh();
          })
        );
        row.appendChild(side);
      }
      return row;
    },

    _itemRow(slot) {
      const modal = M();
      const item = HA.ItemUtil.get(slot.id);
      const row = modal.el('div', 'row');
      if (!item) return row;

      const icon = modal.el('div', 'row__icon');
      const img = global.document.createElement('img');
      img.src = HA.TextureFactory.iconFor(item.id);
      img.alt = '';
      icon.appendChild(img);
      row.appendChild(icon);

      const main = modal.el('div', 'row__main');
      const name = modal.el('div', 'row__name');
      name.appendChild(modal.el('span', null, `${item.name} ×${slot.qty}`));
      const rarity = HA.ItemUtil.rarityOf(item.id);
      const tag = modal.el('span', 'tag', rarity.name);
      tag.style.color = rarity.color;
      name.appendChild(tag);
      main.appendChild(name);
      main.appendChild(modal.el('div', 'row__desc', item.description));
      main.appendChild(modal.el('div', 'row__rewards', this._statLine(item)));
      row.appendChild(main);

      const side = modal.el('div', 'row__side');
      if (item.type === 'equipment') {
        side.appendChild(
          modal.button('Equip', '', () => {
            HA.Inventory.equip(item.id);
            HA.toast(`${item.name} equipped.`, 'good');
            HA.Modal.refresh();
          })
        );
      } else {
        side.appendChild(
          modal.button('Use', '', () => {
            const message = HA.Inventory.use(item.id);
            if (message) HA.toast(message, message.startsWith('Already') ? 'bad' : 'good');
            HA.Modal.refresh();
          })
        );
      }
      side.appendChild(
        modal.button(`Sell ${Math.floor(item.value * 0.5)}g`, 'btn--ghost', () => {
          if (HA.Inventory.sell(item.id)) HA.toast(`Sold ${item.name}.`, 'gold');
          HA.Modal.refresh();
        })
      );
      row.appendChild(side);
      return row;
    },

    _statLine(item) {
      if (item.type === 'consumable') {
        return item.effect && item.effect.heal ? `Restores ${item.effect.heal} HP` : 'Consumable';
      }
      const parts = [];
      const stats = item.stats || {};
      if (stats.attack) parts.push(`+${stats.attack} ATK`);
      if (stats.defense) parts.push(`+${stats.defense} DEF`);
      if (stats.maxHp) parts.push(`+${stats.maxHp} HP`);
      if (stats.crit) parts.push(`+${Math.round(stats.crit * 100)}% crit`);
      if (stats.speed) parts.push(`+${stats.speed} speed`);
      return parts.join(' · ') || 'No bonuses';
    }
  };

  HA.InventoryPanel = InventoryPanel;
})(window);
