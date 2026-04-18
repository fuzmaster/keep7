import { createApp }         from './ui.js';
import { createGoldfishApp }  from './goldfishUi.js';
import { createRaceApp }      from './raceUi.js';

// Global safety net for unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled rejection:', event.reason);
});

function initModeTabs(apps) {
  const tabs   = Array.from(document.querySelectorAll('.mode-tab'));
  const panels = document.querySelectorAll('.mode-panel');

  function activateTab(tab) {
    const mode = tab.dataset.mode;
    tabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('mode-tab--active', active);
      t.setAttribute('aria-selected', String(active));
      t.setAttribute('tabindex', active ? '0' : '-1');
    });
    panels.forEach(p => p.classList.toggle('hidden', p.id !== `mode-${mode}`));
    apps[mode]?.onActivate?.();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab));

    // WAI-ARIA tablist: arrow key navigation
    tab.addEventListener('keydown', e => {
      const idx = tabs.indexOf(e.currentTarget);
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
      if (e.key === 'ArrowLeft')  next = tabs[(idx - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home')       next = tabs[0];
      if (e.key === 'End')        next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        activateTab(next);
        next.focus();
      }
    });
  });

  // Set initial tabindex state
  tabs.forEach((t, i) => t.setAttribute('tabindex', i === 0 ? '0' : '-1'));
}

const handApp     = createApp();
const goldfishApp = createGoldfishApp({ getDeck: () => handApp.getMasterDeck() });
const raceApp     = createRaceApp();

handApp.init();
goldfishApp.init();
raceApp.init();

initModeTabs({ handtest: handApp, goldfish: goldfishApp, race: raceApp });
