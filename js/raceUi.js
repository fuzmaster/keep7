import { parseDecklist }    from './parser.js';
import { fetchCards }        from './scryfall.js';
import { buildDeck, createDeckState, draw } from './engine.js';
import { saveCardCacheByHash, loadCardCacheByHash } from './storage.js';
import { deckHash }          from './hash.js';
import { runDeckTrials, generateVerdict } from './race.js';
import { openZoom }          from './zoom.js';
import { appendCardSlot }    from './domUtils.js';
import { showInlineError, clearInlineError, setButtonBusy } from './messageUi.js';

const byId = id => document.getElementById(id);

export function createRaceApp() {
  const inputEl       = byId('race-input');
  const resultsEl     = byId('race-results');
  const textAEl       = byId('race-deck-a');
  const textBEl       = byId('race-deck-b');
  const btnCmp        = byId('btn-race-compare');
  const statusEl      = byId('race-status');
  const handAEl       = byId('race-hand-a');
  const handBEl       = byId('race-hand-b');
  const statsAEl      = byId('race-stats-a');
  const statsBEl      = byId('race-stats-b');
  const verdictEl     = byId('race-verdict');
  const btnNewHands   = byId('btn-race-new-hands');
  const btnRaceReset  = byId('btn-race-reset');
  const raceInputError = byId('race-input-error');

  let deckA = null;
  let deckB = null;

  function setStatus(msg, spin = false, tone = 'error') {
    if (!statusEl) return;
    if (!msg) { statusEl.className = 'race-status hidden'; return; }
    statusEl.textContent = msg;
    if (spin) {
      statusEl.className = 'race-status race-status--spin';
      return;
    }
    statusEl.className = tone === 'warn'
      ? 'race-status race-status--warn'
      : 'race-status race-status--err';
  }

  async function loadOneDeck(raw, label, onProgress) {
    const { cardMap } = parseDecklist(raw);
    if (!cardMap.size) throw new Error(`Could not parse ${label} — check the format.`);
    const hash = deckHash(raw);
    let cards  = loadCardCacheByHash(hash);
    let degraded = false;
    if (!cards) {
      const names = Array.from(cardMap.keys());
      try {
        cards = await fetchCards(names, (c, t) =>
          onProgress(t > 1 ? `${label}: ${c}/${t}…` : `${label}…`, true));
      } catch (err) {
        console.warn(`${label}: Scryfall unavailable, using placeholder-only cards.`, err);
        cards = [];
        degraded = true;
      }
      saveCardCacheByHash(hash, cards);
    }
    const { deck } = buildDeck(cardMap, cards);
    return { deck, degraded };
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
        onKeydown: e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openZoom(card);
          }
        },
        imageSize: 'small',
      });
    });
  }

  // Safe DOM-based stats render — no innerHTML with data
  function renderStats(container, st) {
    if (!container) return;
    container.innerHTML = '';
    const rows = [
      ['Keep Rate',        `${st.keepRate}%`],
      ['Avg Opener Lands', `${st.avgLands}`],
      ['T3 Land Hit',      `~${st.avgT3Land}%`, true],
      ['Flood Risk',       `${st.floodRisk}%`],
      ['Screw Risk',       `${st.screwRisk}%`],
      ['Deck / Lands',     `${st.deckSize} / ${st.totalLands}`],
    ];
    rows.forEach(([labelText, valueText, note]) => {
      const chip = document.createElement('div');
      chip.className = 'rc-stat';
      const lbl = document.createElement('span');
      lbl.className = 'rc-label';
      lbl.textContent = labelText;
      const val = document.createElement('span');
      val.className = 'rc-value' + (note ? ' rc-note' : '');
      val.textContent = valueText;
      chip.appendChild(lbl);
      chip.appendChild(val);
      container.appendChild(chip);
    });
  }

  function dealHands() {
    if (!deckA || !deckB) return;
    renderHand(handAEl, draw(createDeckState(deckA), 7));
    renderHand(handBEl, draw(createDeckState(deckB), 7));
  }

  async function handleCompare() {
    const rawA = textAEl?.value?.trim();
    const rawB = textBEl?.value?.trim();

    // Inline validation — no alert()
    if (!rawA || !rawB) {
      showInlineError(raceInputError, 'Paste a decklist into both Deck A and Deck B before comparing.');
      if (!rawA) textAEl?.focus();
      else textBEl?.focus();
      return;
    }
    clearInlineError(raceInputError);

    const restoreCompare = setButtonBusy(btnCmp, true, 'Comparing…');
    setStatus('Loading Deck A…', true);

    try {
      const a = await loadOneDeck(rawA, 'Deck A', setStatus);
      deckA = a.deck;
      setStatus('Loading Deck B…', true);
      const b = await loadOneDeck(rawB, 'Deck B', setStatus);
      deckB = b.deck;

      const degradedMode = a.degraded || b.degraded;

      setStatus('Simulating 20 openers each…', true);
      const stA = runDeckTrials(deckA, 20);
      const stB = runDeckTrials(deckB, 20);

      renderStats(statsAEl, stA);
      renderStats(statsBEl, stB);

      if (verdictEl) {
        verdictEl.innerHTML = '';
        const head = document.createElement('div');
        head.className = 'verdict-head';
        head.textContent = 'Analysis';
        verdictEl.appendChild(head);

        const lines = generateVerdict(stA, stB);
        lines.forEach(l => {
          const line = document.createElement('div');
          line.className = 'verdict-line';
          line.textContent = `· ${l}`;
          verdictEl.appendChild(line);
        });

        const note = document.createElement('div');
        note.className = 'verdict-note';
        note.textContent = 'Heuristic — based on 20 simulated openers per deck';
        verdictEl.appendChild(note);
      }

      dealHands();
      if (degradedMode) {
        setStatus('Scryfall is unavailable. Deck Race ran in name-only mode with limited card detail.', false, 'warn');
      } else {
        setStatus(null);
      }
      inputEl?.classList.add('hidden');
      resultsEl?.classList.remove('hidden');
      resultsEl?.classList.add('fade-in');
    } catch (err) {
      console.error('Race compare error', err);
      setStatus(err.message || 'Network error — check your connection.');
    } finally {
      restoreCompare();
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
        setStatus(null);
        clearInlineError(raceInputError);
      });
      // Clear error on typing
      textAEl?.addEventListener('input', () => clearInlineError(raceInputError));
      textBEl?.addEventListener('input', () => clearInlineError(raceInputError));
    },
  };
}
