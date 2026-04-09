import { createGoldfishState, playLand, advanceTurn, goldfishSummary, getCastableFlags } from './goldfish.js';
import { isLand } from './metrics.js';

const byId = id => document.getElementById(id);

function getImageUrl(card, size) {
  const uris = card.image_uris || card.card_faces?.[0]?.image_uris;
  return uris ? uris[size] || uris.small || uris.normal || null : null;
}

export function createGoldfishApp({ getDeck }) {
  let gfState = null;

  const idleEl      = byId('gf-idle');
  const activeEl    = byId('gf-active');
  const turnEl      = byId('gf-turn');
  const manaEl      = byId('gf-mana');
  const summaryEl   = byId('gf-summary');
  const handEl      = byId('gf-hand');
  const handCountEl = byId('gf-hand-count');
  const bfEl        = byId('gf-battlefield');
  const btnNext     = byId('btn-gf-next');
  const btnReset    = byId('btn-gf-reset');
  const btnGoLoad   = byId('btn-gf-go-load');

  function start() {
    const deck = getDeck();
    if (!deck?.length) {
      idleEl?.classList.remove('hidden');
      activeEl?.classList.add('hidden');
      return;
    }
    gfState = createGoldfishState(deck);
    idleEl?.classList.add('hidden');
    activeEl?.classList.remove('hidden');
    render();
  }

  function render() {
    if (!gfState) return;
    const s        = goldfishSummary(gfState);
    const castable = getCastableFlags(gfState);

    if (turnEl)     turnEl.textContent     = s.turn;
    if (manaEl)     manaEl.textContent     = s.mana;
    if (handCountEl) handCountEl.textContent = `(${s.handSize})`;
    if (summaryEl)  summaryEl.textContent  =
      `${s.landsInPlay} land${s.landsInPlay !== 1 ? 's' : ''} in play · ${s.castable} castable`;

    renderZone(handEl,  gfState.hand,        castable, true);
    renderZone(bfEl,    gfState.battlefield, [],       false);

    if (btnNext) {
      btnNext.disabled   = gfState.turn >= 5;
      btnNext.textContent = gfState.turn >= 5 ? 'Done (T5)' : `→ Turn ${gfState.turn + 1}`;
    }
  }

  function renderZone(container, cards, castableFlags, interactive) {
    if (!container) return;
    container.innerHTML = '';

    if (!cards.length) {
      const em = document.createElement('div');
      em.className   = 'zone-empty';
      em.textContent = '—';
      container.appendChild(em);
      return;
    }

    cards.forEach((card, i) => {
      const land      = isLand(card);
      const isCastable = castableFlags[i];
      const canPlay   = land && interactive && !gfState.landPlayedThisTurn;

      const slot = document.createElement('div');
      slot.className = 'card-slot card-slot--sm fade-in';
      slot.style.animationDelay = `${i * 25}ms`;
      slot.setAttribute('aria-label', card.name);

      if (canPlay) {
        slot.classList.add('card-land-highlight');
        slot.setAttribute('role', 'button');
        slot.title = 'Play this as your land drop';
        slot.addEventListener('click', () => { gfState = playLand(gfState, i); render(); });
      } else if (isCastable) {
        slot.classList.add('card-castable-glow');
      }

      const src = getImageUrl(card, 'small');
      if (src) {
        const img = document.createElement('img');
        img.src = src; img.alt = card.name; img.width = 146; img.height = 204;
        slot.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'card-placeholder'; ph.textContent = card.name;
        slot.appendChild(ph);
      }

      container.appendChild(slot);
    });
  }

  function bindEvents() {
    btnNext?.addEventListener('click',  () => { gfState = advanceTurn(gfState); render(); });
    btnReset?.addEventListener('click', start);
    btnGoLoad?.addEventListener('click', () => {
      document.querySelector('[data-mode="handtest"]')?.click();
    });
  }

  return {
    init() { bindEvents(); },
    onActivate() {
      const deck = getDeck();
      if (!deck?.length) {
        idleEl?.classList.remove('hidden');
        activeEl?.classList.add('hidden');
      } else if (!gfState) {
        start();
      } else {
        render();
      }
    },
  };
}
