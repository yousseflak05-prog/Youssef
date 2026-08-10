/**
 * ui/StatsPanel.js
 * The "Status Window" — level, rank, stats, unspent points, and lifetime
 * self-improvement totals.
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const M = () => HA.Modal;

  const STAT_META = [
    { key: 'strength', label: 'Strength', hint: 'Attack power, max HP, defense' },
    { key: 'intelligence', label: 'Intelligence', hint: 'Gold income' },
    { key: 'agility', label: 'Agility', hint: 'Move speed, crit chance' },
    { key: 'discipline', label: 'Discipline', hint: 'XP gain' }
  ];

  const StatsPanel = {
    open() {
      HA.Modal.open({
        title: 'Status Window',
        render: (body) => this.render(body),
        actions: [{ label: 'Close', className: 'btn--ghost', keepOpen: false }]
      });
    },

    render(body) {
      const modal = M();
      const player = HA.Player;
      const rank = player.rank;
      const nextRank = HA.Ranks.nextAfter(player.level);

      const head = modal.el('div');
      head.appendChild(modal.keyValue('Name', player.data.name));
      head.appendChild(modal.keyValue('Level', player.level));
      const rankRow = modal.keyValue('Rank', rank.name);
      rankRow.lastChild.style.color = rank.color;
      head.appendChild(rankRow);
      head.appendChild(modal.keyValue('XP', `${player.data.xp} / ${player.xpToNext}`));
      head.appendChild(
        modal.keyValue('Next rank', nextRank ? `${nextRank.id} at level ${nextRank.minLevel}` : 'Maximum rank')
      );
      head.appendChild(modal.keyValue('Gold', player.gold));
      body.appendChild(head);

      body.appendChild(
        modal.sectionTitle(
          player.data.statPoints > 0
            ? `Attributes · ${player.data.statPoints} point${player.data.statPoints === 1 ? '' : 's'} to spend`
            : 'Attributes'
        )
      );

      const grid = modal.el('div', 'stat-grid');
      for (const meta of STAT_META) grid.appendChild(this._statCard(meta));
      body.appendChild(grid);

      body.appendChild(modal.sectionTitle('Derived'));
      const derived = modal.el('div');
      derived.appendChild(modal.keyValue('Max HP', player.maxHp));
      derived.appendChild(modal.keyValue('Attack', player.attack));
      derived.appendChild(modal.keyValue('Defense', player.defense));
      derived.appendChild(modal.keyValue('Crit chance', `${Math.round(player.critChance * 100)}%`));
      derived.appendChild(modal.keyValue('XP bonus', `+${Math.round((player.xpMultiplier - 1) * 100)}%`));
      derived.appendChild(modal.keyValue('Gold bonus', `+${Math.round((player.goldMultiplier - 1) * 100)}%`));
      body.appendChild(derived);

      body.appendChild(modal.sectionTitle('Discipline record'));
      const record = modal.el('div');
      const totals = player.data.quests.totals || {};
      let lifetime = 0;
      for (const quest of HA.Quests) {
        const count = totals[quest.id] || 0;
        lifetime += count;
        record.appendChild(modal.keyValue(`${quest.icon} ${quest.name}`, count));
      }
      record.appendChild(modal.keyValue('Total tasks logged', lifetime));
      record.appendChild(modal.keyValue('Perfect-day streak', `${player.data.quests.streak} 🔥`));
      body.appendChild(record);

      const dungeonIds = Object.keys(player.data.dungeons || {});
      if (dungeonIds.length) {
        body.appendChild(modal.sectionTitle('Gate record'));
        const gates = modal.el('div');
        for (const id of dungeonIds) {
          const def = HA.Dungeons[id];
          const progress = player.data.dungeons[id];
          if (!def) continue;
          gates.appendChild(
            modal.keyValue(
              def.name,
              `${progress.clears} clear${progress.clears === 1 ? '' : 's'} · best tier ${
                HA.DungeonSystem.tierName(progress.highestTierCleared) || '—'
              }`
            )
          );
        }
        body.appendChild(gates);
      }
    },

    _statCard(meta) {
      const modal = M();
      const player = HA.Player;
      const card = modal.el('div', 'stat');
      const label = modal.el('div', 'stat__label');
      label.appendChild(modal.el('div', null, meta.label));
      const hint = modal.el('div', null, meta.hint);
      hint.style.fontSize = '10px';
      hint.style.opacity = '0.7';
      label.appendChild(hint);
      card.appendChild(label);

      card.appendChild(modal.el('div', 'stat__value', player.stats[meta.key]));

      const plus = modal.el('button', 'stat__plus', '+');
      plus.type = 'button';
      plus.disabled = player.data.statPoints <= 0;
      plus.title = 'Spend a stat point';
      plus.addEventListener('click', () => {
        if (player.spendStatPoint(meta.key)) {
          HA.toast(`+1 ${meta.label}`, 'good', 1400);
          HA.Modal.refresh();
        }
      });
      card.appendChild(plus);
      return card;
    }
  };

  HA.StatsPanel = StatsPanel;
})(window);
