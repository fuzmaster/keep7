import { parseDecklist }  from './parser.js';
import { fetchCards }      from './scryfall.js';
import { buildDeck, createDeckState, draw, remaining } from './engine.js';
import {
  saveDecklist,
  loadDecklist,
  saveCardCacheByHash,
  loadCardCacheByHash,
  clearStorage,
  saveWebDeckType,
  loadWebDeckType,
} from './storage.js';
import { deckHash }        from './hash.js';
import { evalHand, computeSessionStats, landCountFromDeck, pLandInDraws, keepLabel } from './metrics.js';
import { openZoom }        from './zoom.js';
import { getImageUrl, appendCardSlot } from './domUtils.js';
import { SAMPLE_DECK }     from './sampleDeck.js';
import { loadRandomWebDeck } from './remoteDeck.js';

const byId = id => document.getElementById(id);
const ANY_DECK_TYPE = '__any__';

function preloadImages(cards) {
  for (const c of cards) {
    const src = getImageUrl(c, 'small');
    if (src) { const img = new Image(); img.src = src; }
  }
}

// ── Inline error helpers (replaces alert()) ─────────────────────────
function showInlineError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}
function clearInlineError(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

export function createApp() {
  const inputSection    = byId('input-section');
  const testSection     = byId('test-section');
  const decklistInput   = byId('decklist-input');
  const btnStart        = byId('btn-start');
  const btnSample       = byId('btn-sample');
  const webDeckType     = byId('web-deck-type');
  const btnWebSample    = byId('btn-web-sample');
  const btnMull         = byId('btn-mull');
  const btnKeep         = byId('btn-keep');
  const btnReset        = byId('btn-reset');
  const handContainer   = byId('hand-container');
  const drawsContainer  = byId('draws-container');
  const drawsArea       = byId('draws-area');
  const actionBar       = byId('action-bar');
  const headerRight     = byId('header-right');
  const validationBanner = byId('validation-banner');
  const savedHint       = byId('saved-hint');
  const handLabel       = byId('hand-label');
  const statsPanel      = byId('stats-panel');
  const handEvalEl      = byId('hand-eval');
  const inputError      = byId('input-error');

  let masterDeck    = [];
  let deckState     = null;
  let handNumber    = 0;
  let loading       = false;
  let currentHand   = [];
  let currentHash   = null;
  let deckLandCount = 0;
  let openerSamples = [];

  function clearHint() {
    if (!savedHint) return;
    savedHint.innerHTML = '';
  }

  function showHint(message) {
    if (!savedHint) return;
    clearHint();
    savedHint.appendChild(document.createTextNode(message));
    savedHint.classList.remove('hidden');
  }

  function isValidSourceUrl(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  function showRemoteDeckHint(remote, { usedAnyFallback = false, requestedType = '' } = {}) {
    if (!savedHint || !remote) return;
    clearHint();

    const deckType = remote.deckType || 'Unknown';
    const deckName = remote.deckName || 'Deck';
    const leadText = usedAnyFallback
      ? `No ${requestedType} decks available right now. Loaded ${deckType}: ${deckName}. `
      : `Loaded ${deckType}: ${deckName}. `;
    savedHint.appendChild(document.createTextNode(leadText));

    const link = document.createElement('a');
    if (remote.sourceUrl && isValidSourceUrl(remote.sourceUrl)) {
      link.href = remote.sourceUrl;
    }
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Source';
    if (!link.href) link.style.pointerEvents = 'none';
    savedHint.appendChild(link);

    savedHint.appendChild(document.createTextNode(' · '));
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Try another';
    retry.addEventListener('click', handleRandomWebDeck);
    savedHint.appendChild(retry);

    savedHint.classList.remove('hidden');
  }

  async function loadRandomWebDeckWithFallback() {
    const selectedType = webDeckType?.value || 'Commander Deck';
    try {
      const remote = await loadRandomWebDeck({ deckType: selectedType, retries: 2, timeoutMs: 10000 });
      return { remote, usedAnyFallback: false, requestedType: selectedType };
    } catch (firstError) {
      if (selectedType === ANY_DECK_TYPE || firstError?.code !== 'NO_DECKS_FOR_TYPE') throw firstError;
      const remote = await loadRandomWebDeck({ deckType: ANY_DECK_TYPE, retries: 2, timeoutMs: 10000 });
      return { remote, usedAnyFallback: true, requestedType: selectedType };
    }
  }

  // ── Skeletons ──────────────────────────────────────────────
  function renderSkeletons(container, n) {
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'card-slot card-slot--skeleton';
      s.style.animationDelay = `${i * 30}ms`;
      container.appendChild(s);
    }
  }

  // ── Cards ───────────────────────────────────────────────────
  function renderCards(container, cards, { lazyLoad = false } = {}) {
    container.innerHTML = '';
    cards.forEach((card, i) => {
      const zoom = () => openZoom(card);
      appendCardSlot(container, card, {
        index: i,
        delayMs: 35,
        baseClass: 'card-slot fade-in',
        role: 'button',
        tabIndex: 0,
        ariaLabel: `View ${card.name}`,
        onClick: zoom,
        onKeydown: e => { if (e.key === 'Enter') zoom(); },
        lazyLoad,
        imageSize: 'small',
      });
    });
  }

  // ── Header ──────────────────────────────────────────────────
  function updateHeader(showBack) {
    if (!headerRight) return;
    headerRight.innerHTML = '';
    if (!showBack) return;
    if (handNumber > 0) {
      const c = document.createElement('span');
      c.className = 'hand-counter';
      c.textContent = `Hand #${handNumber}`;
      headerRight.appendChild(c);
    }
    const btn = document.createElement('button');
    btn.className = 'btn-back'; btn.type = 'button'; btn.textContent = '← Deck';
    btn.setAttribute('aria-label', 'Return to decklist');
    btn.addEventListener('click', showInput);
    headerRight.appendChild(btn);
  }

  // ── Stats ───────────────────────────────────────────────────
  function renderStats(ev) {
    if (!statsPanel) return;
    const s = computeSessionStats(openerSamples);
    statsPanel.innerHTML = '';
    const stats = [
      { label: 'Keep Rate', value: `${s.keepRate}%` },
      { label: 'K / M',     value: `${s.keeps} / ${s.mulls}` },
      { label: 'Avg Lands', value: s.avgLands },
      { label: '2-Land %',  value: `${s.twoLandPct}%` },
      { label: '3-Land %',  value: `${s.threeLandPct}%` },
      { label: 'Openers',   value: s.openers, faint: true },
    ];
    stats.forEach(stat => {
      const chip = document.createElement('div');
      chip.className = 'stat-chip' + (stat.faint ? ' stat-chip--faint' : '');
      const label = document.createElement('span');
      label.className = 'stat-label';
      label.textContent = stat.label;
      const value = document.createElement('span');
      value.className = 'stat-value';
      value.textContent = stat.value;
      chip.appendChild(label);
      chip.appendChild(value);
      statsPanel.appendChild(chip);
    });

    if (handEvalEl && ev) {
      const lbl = keepLabel(ev);
      const t3  = pLandInDraws(deckLandCount - ev.landCount, masterDeck.length - 7, 3);
      handEvalEl.innerHTML = '';
      const badge = document.createElement('span');
      badge.className = `heval-badge heval-badge--${lbl.cls}`;
      badge.textContent = lbl.text;
      const detail = document.createElement('span');
      detail.className = 'heval-detail';
      detail.textContent = `${ev.landCount} lands · T3 land ~${t3}% `;
      const est = document.createElement('span');
      est.className = 'heval-est';
      est.textContent = 'est.';
      detail.appendChild(est);
      handEvalEl.appendChild(badge);
      handEvalEl.appendChild(detail);
      handEvalEl.className = 'hand-eval hand-eval--visible';
    } else if (handEvalEl) {
      handEvalEl.className = 'hand-eval';
      handEvalEl.innerHTML = '';
    }
  }

  // ── Validation banner ────────────────────────────────────────
  const VALID_DECK_SIZES = [40, 60, 99, 100];
  function showValidation(deckSize, notFound, parseErrors) {
    if (!validationBanner) return;
    validationBanner.innerHTML = '';

    const ok = document.createElement('span');
    ok.className = 'vb-ok';
    ok.textContent = `${deckSize} cards loaded`;
    validationBanner.appendChild(ok);

    if (!VALID_DECK_SIZES.includes(deckSize)) {
      const warn = document.createElement('span');
      warn.className = 'vb-warn';
      warn.textContent = ' · unusual size';
      validationBanner.appendChild(warn);
    }

    if (notFound.length) {
      const err = document.createElement('div');
      err.className = 'vb-err';
      err.textContent = `${notFound.length} not found: ${notFound.slice(0, 5).join(', ')}${notFound.length > 5 ? '…' : ''}`;
      validationBanner.appendChild(err);
    }

    if (parseErrors.length) {
      const err = document.createElement('div');
      err.className = 'vb-err';
      err.textContent = `${parseErrors.length} line${parseErrors.length > 1 ? 's' : ''} skipped`;
      validationBanner.appendChild(err);
    }

    const d = document.createElement('button');
    d.className = 'vb-dismiss'; d.type = 'button'; d.textContent = '✕';
    d.addEventListener('click', () => validationBanner.classList.add('hidden'));
    validationBanner.appendChild(d);

    validationBanner.className = 'validation-banner fade-in';
  }

  // ── Action state ─────────────────────────────────────────────
  function setActions(state) {
    if (state === 'hand') {
      btnMull.disabled = false; btnMull.classList.remove('hidden');
      btnKeep.disabled = false; btnKeep.classList.remove('hidden');
      btnReset.classList.add('hidden');
    } else if (state === 'keep') {
      btnMull.classList.add('hidden');
      btnKeep.classList.add('hidden');
      btnReset.disabled = false; btnReset.classList.remove('hidden');
    } else if (state === 'busy') {
      btnMull.disabled = true; btnKeep.disabled = true; btnReset.disabled = true;
    }
  }

  // ── Deal Hand ───────────────────────────────────────────────
  function dealHand() {
    deckState   = createDeckState(masterDeck);
    currentHand = draw(deckState, 7);
    handNumber++;

    const ev = evalHand(currentHand);
    openerSamples.push({ landCount: ev.landCount, wasKept: false });

    renderCards(handContainer, currentHand);
    preloadImages(deckState.cards.slice(deckState.index, deckState.index + 6));

    drawsArea?.classList.add('hidden');
    if (drawsContainer) drawsContainer.innerHTML = '';

    setActions('hand');
    updateHeader(true);
    renderStats(ev);
  }

  // ── Reveal draws ────────────────────────────────────────────
  function revealDraws() {
    if (!deckState) return;
    const n = Math.min(3, remaining(deckState));
    if (!n) return;
    const drawn = draw(deckState, n);
    renderCards(drawsContainer, drawn, { lazyLoad: true });
    drawsArea?.classList.remove('hidden');
    drawsArea?.classList.add('fade-in');
    preloadImages(deckState.cards.slice(deckState.index, deckState.index + 4));
    setActions('keep');
  }

  // ── Navigation ───────────────────────────────────────────────
  function showTest() {
    inputSection?.classList.add('hidden');
    testSection?.classList.remove('hidden');
    testSection?.classList.add('fade-in');
    actionBar?.classList.remove('hidden');
    handLabel?.focus();
  }

  function showInput() {
    testSection?.classList.add('hidden');
    actionBar?.classList.add('hidden');
    inputSection?.classList.remove('hidden');
    updateHeader(false);
    handNumber = 0;
    decklistInput?.focus();
  }

  // ── Track decisions ──────────────────────────────────────────
  function trackKeep() {
    if (openerSamples.length) openerSamples[openerSamples.length - 1].wasKept = true;
    renderStats(evalHand(currentHand));
    revealDraws();
  }

  function trackMulligan() {
    renderStats(evalHand(currentHand));
    dealHand();
  }

  // ── Load deck ────────────────────────────────────────────────
  async function handleStart() {
    if (loading) return;
    clearInlineError(inputError);

    const text = decklistInput?.value?.trim();
    if (!text) {
      showInlineError(inputError, 'Paste a decklist above before testing.');
      decklistInput?.focus();
      return;
    }

    loading = true;
    const orig = btnStart.textContent;
    btnStart.disabled = true;
    btnStart.classList.add('btn-start--loading');

    const { cardMap, errors: parseErrors } = parseDecklist(text);
    if (!cardMap.size) {
      restore();
      loading = false;
      showInlineError(inputError, 'Could not parse any cards. Expected format: "1 Sol Ring"');
      return;
    }

    const totalCards = Array.from(cardMap.values()).reduce((a, b) => a + b, 0);
    if (totalCards === 0) {
      restore();
      loading = false;
      showInlineError(inputError, 'Deck cannot be empty.');
      return;
    }
    if (totalCards > 500) {
      restore();
      loading = false;
      showInlineError(inputError, 'Deck exceeds the 500-card limit.');
      return;
    }

    const hash = deckHash(text);

    try {
      let cardData = loadCardCacheByHash(hash);
      if (cardData?.length) {
        btnStart.textContent = 'Loading…';
        renderSkeletons(handContainer, 7);
      } else {
        const names = Array.from(cardMap.keys());
        renderSkeletons(handContainer, 7);
        cardData = await fetchCards(names, (cur, tot) => {
          btnStart.textContent = tot > 1 ? `Fetching (${cur}/${tot})…` : 'Fetching…';
        });
        saveDecklist(text);
        saveCardCacheByHash(hash, cardData);
      }

      currentHash   = hash;
      const { deck, notFound } = buildDeck(cardMap, cardData);
      masterDeck    = deck;
      deckLandCount = landCountFromDeck(deck);
      openerSamples = [];
      handNumber    = 0;

      showTest();
      showValidation(deck.length, notFound, parseErrors);
      renderStats(null);
      dealHand();
    } catch (err) {
      console.error('handleStart error', err);
      masterDeck = [];
      const isFileProtocol = window.location.protocol === 'file:';
      const isNetworkError = err?.name === 'TypeError' || err?.name === 'AbortError';
      const hint = isFileProtocol ? ' Run this app from a local web server (not file://).' : '';
      showInlineError(inputError,
        isNetworkError
          ? `Could not reach Scryfall. Check your internet connection and try again.${hint}`
          : `Error fetching cards from Scryfall. Please try again.${hint}`
      );
    } finally {
      restore();
      loading = false;
    }

    function restore() {
      btnStart.textContent = orig;
      btnStart.disabled    = false;
      btnStart.classList.remove('btn-start--loading');
    }
  }

  async function handleRandomWebDeck() {
    if (loading) return;
    loading = true;
    const orig = btnWebSample?.textContent || 'Random Web Deck';
    if (btnWebSample) { btnWebSample.disabled = true; btnWebSample.textContent = 'Loading…'; }
    if (btnStart) btnStart.disabled = true;

    try {
      const { remote, usedAnyFallback, requestedType } = await loadRandomWebDeckWithFallback();
      if (decklistInput) decklistInput.value = remote.deckText;
      showRemoteDeckHint(remote, { usedAnyFallback, requestedType });
    } catch (err) {
      console.error('handleRandomWebDeck error', err);
      if (decklistInput) decklistInput.value = SAMPLE_DECK;
      const isNetworkError = err?.name === 'TypeError' || err?.name === 'AbortError';
      showHint(isNetworkError
        ? 'Could not reach web deck source. Loaded local sample deck instead.'
        : 'Web deck unavailable right now. Loaded local sample deck instead.');
    } finally {
      loading = false;
      if (btnWebSample) { btnWebSample.disabled = false; btnWebSample.textContent = orig; }
      if (btnStart) btnStart.disabled = false;
    }
  }

  // ── Saved hint ───────────────────────────────────────────────
  function restoreSavedDecklist() {
    const saved = loadDecklist();
    if (!saved || !savedHint) return;
    if (decklistInput) decklistInput.value = saved;
    clearHint();
    savedHint.appendChild(document.createTextNode('Last deck restored. '));
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = 'Clear';
    btn.addEventListener('click', () => {
      clearStorage();
      if (decklistInput) decklistInput.value = '';
      savedHint.classList.add('hidden');
    });
    savedHint.appendChild(btn);
    savedHint.classList.remove('hidden');
  }

  function restoreWebDeckType() {
    const saved = loadWebDeckType();
    if (!saved || !webDeckType) return;
    const hasOption = Array.from(webDeckType.options).some(o => o.value === saved);
    if (hasOption) webDeckType.value = saved;
  }

  function bindEvents() {
    btnStart?.addEventListener('click', handleStart);
    btnSample?.addEventListener('click', () => { if (decklistInput) decklistInput.value = SAMPLE_DECK; });
    btnWebSample?.addEventListener('click', handleRandomWebDeck);
    webDeckType?.addEventListener('change', () => saveWebDeckType(webDeckType.value));
    btnMull?.addEventListener('click', trackMulligan);
    btnKeep?.addEventListener('click', trackKeep);
    btnReset?.addEventListener('click', dealHand);

    // Clear inline error on user typing
    decklistInput?.addEventListener('input', () => clearInlineError(inputError));
  }

  return {
    init() {
      bindEvents();
      restoreWebDeckType();
      restoreSavedDecklist();
      renderStats(null);
    },
    getMasterDeck() { return masterDeck; },
    getDeckHash()   { return currentHash; },
  };
}
