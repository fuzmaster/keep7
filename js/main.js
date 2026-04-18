import { createApp }         from './ui.js';
import { createGoldfishApp }  from './goldfishUi.js';
import { createRaceApp }      from './raceUi.js';

// Global safety net for unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled rejection:', event.reason);
});

function initModeTabs(apps) {
  const tabs   = document.querySelectorAll('.mode-tab');
  const panels = document.querySelectorAll('.mode-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      tabs.forEach(t => {
        t.classList.toggle('mode-tab--active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      panels.forEach(p => p.classList.toggle('hidden', p.id !== `mode-${mode}`));
      apps[mode]?.onActivate?.();
    });
  });
}

const handApp     = createApp();
const goldfishApp = createGoldfishApp({ getDeck: () => handApp.getMasterDeck() });
const raceApp     = createRaceApp();

handApp.init();
goldfishApp.init();
raceApp.init();

initModeTabs({ handtest: handApp, goldfish: goldfishApp, race: raceApp });
