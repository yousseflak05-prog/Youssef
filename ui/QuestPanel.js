/**
 * ui/QuestPanel.js
 * The Daily Quest board — the self-improvement core of the game.
 *
 * Quests are logged by hand. Once logged, the row locks out for the rest of the
 * calendar day (QuestSystem enforces it; this panel just reflects it).
 */
(function (global) {
  'use strict';

  const HA = (global.HA = global.HA || {});
  const M = () => HA.Modal;

  const QuestPanel = {
    open() {
      HA.QuestSystem.refresh();
      HA.Modal.open({
        title: 'Daily Quests',
        render: (body) => this.render(body),
        actions: [
          { label: 'Close', className: 'btn--ghost', keepOpen: false }
        ]
      });
    },

    render(body) {
      const log = HA.Player.data.quests;
      const modal = M();

      const header = modal.el('div', 'kv');
      header.appendChild(modal.el('span', null, `Resets in ${HA.QuestSystem.formattedReset()}`));
      const streak = modal.el('span', 'streak', `🔥 ${log.streak} day streak`);
      header.appendChild(streak);
      body.appendChild(header);

      const intro = modal.el(
        'p',
        null,
        'Do the work in real life, then log it here. Every completion feeds the hunter — XP, gold, and permanent stat growth.'
      );
      body.appendChild(intro);

      body.appendChild(modal.sectionTitle(
        `Today · ${log.completed.length}/${HA.Quests.length} complete`
      ));

      const list = modal.el('div', 'list');
      for (const quest of HA.Quests) {
        list.appendChild(this._questRow(quest));
      }
      body.appendChild(list);

      if (log.completed.length === HA.Quests.length) {
        const done = modal.el(
          'p',
          null,
          '⭐ Perfect day cleared. The gate rewards discipline — come back tomorrow.'
        );
        done.style.color = '#facc15';
        done.style.marginTop = '10px';
        body.appendChild(done);
      }
    },

    _questRow(quest) {
      const modal = M();
      const completed = HA.QuestSystem.isCompleted(quest.id);
      const row = modal.el('div', `row${completed ? ' row--done' : ''}`);

      row.appendChild(modal.el('div', 'row__icon', quest.icon));

      const main = modal.el('div', 'row__main');
      const name = modal.el('div', 'row__name');
      name.appendChild(modal.el('span', null, quest.name));
      const total = HA.QuestSystem.totalFor(quest.id);
      if (total > 0) {
        const tag = modal.el('span', 'tag', `x${total}`);
        tag.style.color = '#94a3b8';
        name.appendChild(tag);
      }
      main.appendChild(name);
      main.appendChild(modal.el('div', 'row__desc', quest.description));

      const rewards = quest.rewards;
      const statText = Object.keys(rewards.stats || {})
        .map((key) => `+${rewards.stats[key]} ${key.slice(0, 3).toUpperCase()}`)
        .join(' · ');
      main.appendChild(
        modal.el('div', 'row__rewards', `+${rewards.xp} XP · +${rewards.gold} gold${statText ? ` · ${statText}` : ''}`)
      );
      row.appendChild(main);

      const side = modal.el('div', 'row__side');
      if (completed) {
        const badge = modal.el('span', 'tag', 'Complete');
        badge.style.color = '#4ade80';
        badge.style.alignSelf = 'center';
        side.appendChild(badge);
      } else {
        side.appendChild(
          modal.button('Complete', '', () => {
            const result = HA.QuestSystem.complete(quest.id);
            if (!result.ok) {
              HA.toast(result.reason, 'bad');
            } else {
              HA.toast(`${quest.name} logged — +${result.xp} XP, +${result.gold} gold`, 'good', 3000);
              if (result.perfect) {
                HA.toast(
                  `Perfect day! +${result.perfect.xp} XP, +${result.perfect.gold} gold · ${result.perfect.streak} day streak`,
                  'gold',
                  4000
                );
              }
            }
            HA.Modal.refresh();
          })
        );
      }
      row.appendChild(side);
      return row;
    }
  };

  HA.QuestPanel = QuestPanel;
})(window);
