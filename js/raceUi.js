import { parseDecklist }    from './parser.js';
import { fetchCards }        from './scryfall.js';
import { buildDeck, createDeckState, draw } from './engine.js';
import { saveCardCacheByHash, loadCardCacheByHash } from './storage.js';
import { deckHash }          from './hash.js';
import { runDeckTrials, generateVerdict } from './race.js';
import { openZoom }          from './zoom.js';
import { appendCardSlot }    from './domUtils.js';

const byId = id => document.getElementById(id);

export function createRaceApp() {
  const inputEl      = byId('race-input');
  const resultsEl    = byId('race-results');
  const textAEl      = byId('race-deck-a');
  const textBEl      = byId('race-deck-b');
  const btnCmp       = byId('btn-race-compare');
  const statusEl     = byId('race-status');
  const handAEl      = byId('race-hand-a');
  const handBEl      = byId('race-hand-b');
  const statsAEl     = byId('race-stats-a');
  const statsBEl     = byId('race-stats-b');
  const verdictEl    = byId('race-verdict');
  const btnNewHands  = byId('btn-race-new-hands');
  const btnRaceReset = byId('btn-race-reset');

  let deckA = null;
  let deckB = null;

  function setStatus(msg, spin = false) {
    if (!statusEl) return;
    if (!msg) { statusEl.className = 'race-status hidden'; return; }
    statusEl.textContent = msg;
    statusEl.className   = spin ? 'race-status race-status--spin' : 'race-status race-status--err';
  }

  async function loadOneDeck(raw, label, onProgress) {
    const { cardMap } = parseDecklist(raw);
    if (!cardMap.size) throw new Error(`Could not parse ${label} — check the format.`);

    const hash  = deckHash(raw);
    let cards   = loadCardCacheByHash(hash);

    if (!cards) {
      const names = Array.from(cardMap.keys());
      cards = await fetchCards(names, (c, t) =>
        onProgress(t > 1 ? `${label}: ${c}/${t}…` : `${label}…`, true));
      saveCardCacheByHash(hash, cards);
    }

    const { deck } = buildDeck(cardMap, cards);
    return deck;
  }

  function renderHand(container, cards) {
    if (!container) return;
    container.innerHTML = '';
    cards.forEach((card, i) => {
      appendCardSlot(container, card, {
        index: i,
        delayMs: 35,
        baseClass: 'card-slot card-slot--race fade-in',
        role: 'button',
        tabIndex: 0,
        ariaLabel: `View ${card.name}`,
        onClick: () => openZoom(card),
        imageSize: 'small',
      });
    });
  }

  function renderStats(container, st) {
    if (!container) return;
    container.innerHTML = `
      <div class="rc-stat"><span class="rc-label">Keep Rate</span><span class="rc-value">${st.keepRate}%</span></div>
      <div class="rc-stat"><span class="rc-label">Avg Opener Lands</span><span class="rc-value">${st.avgLands}</span></div>
      <div class="rc-stat"><span class="rc-label">T3 Land Hit</span><span class="rc-value rc-note">~${st.avgT3Land}%</span></div>
      <div class="rc-stat"><span class="rc-label">Flood Risk</span><span class="rc-value">${st.floodRisk}%</span></div>
      <div class="rc-stat"><span class="rc-label">Screw Risk</span><span class="rc-value">${st.screwRisk}%</span></div>
      <div class="rc-stat"><span class="rc-label">Deck / Lands</span><span class="rc-value">${st.deckSize} / ${st.totalLands}</span></div>
    `;
  }

  function dealHands() {
    if (!deckA || !deckB) return;
    renderHand(handAEl, draw(createDeckState(deckA), 7));
    renderHand(handBEl, draw(createDeckState(deckB), 7));
  }

  async function handleCompare() {
    const rawA = textAEl?.value?.trim();
    const rawB = textBEl?.value?.trim();
    if (!rawA || !rawB) { alert('Paste both decklists to compare.'); return; }

    if (btnCmp) btnCmp.disabled = true;
    setStatus('Loading Deck A…', true);

    try {
      deckA = await loadOneDeck(rawA, 'Deck A', setStatus);
      setStatus('Loading Deck B…', true);
      deckB = await loadOneDeck(rawB, 'Deck B', setStatus);

      setStatus('Simulating 20 openers each…', true);
      const stA = runDeckTrials(deckA, 20);
      const stB = runDeckTrials(deckB, 20);

      renderStats(statsAEl, stA);
      renderStats(statsBEl, stB);

      if (verdictEl) {
        const lines = generateVerdict(stA, stB);
        verdictEl.innerHTML =
          '<div class="verdict-head">Analysis</div>' +
          lines.map(l => `<div class="verdict-line">· ${l}</div>`).join('') +
          '<div class="verdict-note">Heuristic — based on 20 simulated openers per deck</div>';
      }

      dealHands();
      setStatus(null);
      inputEl?.classList.add('hidden');
      resultsEl?.classList.remove('hidden');
      resultsEl?.classList.add('fade-in');
    } catch (err) {
      console.error('Race compare error', err);
      setStatus(err.message || 'Network error — check your connection.');
    } finally {
      if (btnCmp) btnCmp.disabled = false;
    }
  }

  return {
    init() {
      btnCmp?.addEventListener('click', handleCompare);
      btnNewHands?.addEventListener('click', dealHands);
      btnRaceReset?.addEventListener('click', () => {
        deckA = null; deckB = null;
        resultsEl?.classList.add('hidden');
        inputEl?.classList.remove('hidden');
      });
    },
  };
}
