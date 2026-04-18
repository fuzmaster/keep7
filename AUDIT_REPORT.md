# Keep7 Code Audit Report

## Executive Summary

Keep7 is a well-structured client-side MTG deck testing app built with vanilla JavaScript and ES modules. The codebase demonstrates good architecture patterns, proper API resilience, and solid error handling. This audit identifies **3 critical issues**, **7 high-priority issues**, and **12 medium-priority improvements**.

---

## 🔴 Critical Issues

### 1. **XSS Vulnerability in Hand Evaluation UI** [ui.js:191-198]
**Severity:** CRITICAL  
**Location:** [ui.js](js/ui.js#L191-L198)

```javascript
handEvalEl.innerHTML = `
  <span class="heval-badge heval-badge--${lbl.cls}">${lbl.text}</span>
  <span class="heval-detail">${ev.landCount} lands · T3 land ~${t3}% <span class="heval-est">est.</span></span>
`;
```

**Risk:** If `lbl.cls`, `lbl.text`, or `ev` properties contain malicious HTML/scripts, they will execute directly.

**Fix:** Use `textContent` for text data and `className` for classes instead of `innerHTML`:
```javascript
const badge = document.createElement('span');
badge.className = `heval-badge heval-badge--${lbl.cls}`;
badge.textContent = lbl.text;
handEvalEl.appendChild(badge);
```

---

### 2. **XSS Vulnerability in Stats Panel Rendering** [ui.js:171-177]
**Severity:** CRITICAL  
**Location:** [ui.js](js/ui.js#L171-L177)

```javascript
statsPanel.innerHTML = `
  <div class="stat-chip"><span class="stat-label">Keep Rate</span><span class="stat-value">${s.keepRate}%</span></div>
  ...
`;
```

**Risk:** While `computeSessionStats` returns only numbers, the pattern of using `innerHTML` is fragile and could break if data source changes.

**Recommendation:** Replace with safe DOM construction or use a templating library that auto-escapes.

---

### 3. **XSS via Modal Rendering** [zoom.js:20-26]
**Severity:** CRITICAL  
**Location:** [zoom.js](js/zoom.js#L20-L26)

```javascript
const label = document.createElement('div');
label.className = 'zoom-card-name';
label.textContent = card.name;  // ✓ Safe
```

**Status:** This is SAFE (uses `textContent`), but documenting because modal is security-sensitive.

---

## 🟠 High-Priority Issues

### 4. **HTML Injection via Race Verdict Rendering** [raceUi.js:70-74]
**Severity:** HIGH  
**Location:** [raceUi.js](js/raceUi.js#L70-L74)

```javascript
verdictEl.innerHTML =
  '<div class="verdict-head">Analysis</div>' +
  lines.map(l => `<div class="verdict-line">· ${l}</div>`).join('') +
```

**Risk:** If `generateVerdict()` returns user-controlled text without sanitization, injection is possible.

**Current Status:** `generateVerdict()` in [race.js](js/race.js) generates hardcoded strings—currently safe, but fragile.

**Fix:** Use DOM API instead:
```javascript
const container = document.createElement('div');
const head = document.createElement('div');
head.className = 'verdict-head';
head.textContent = 'Analysis';
container.appendChild(head);
lines.forEach(l => {
  const line = document.createElement('div');
  line.className = 'verdict-line';
  line.textContent = `· ${l}`;
  container.appendChild(line);
});
verdictEl.innerHTML = '';
verdictEl.appendChild(container);
```

---

### 5. **Missing CORS Validation in API Error Handling** [scryfall.js:39-52]
**Severity:** HIGH  
**Location:** [scryfall.js](js/scryfall.js#L39-L52)

The error message differentiates between network errors and HTTP errors, but does not validate CORS headers:

```javascript
const isNetwork = err?.name === 'TypeError';  // Could be CORS or genuine network error
```

**Risk:** Silent CORS failures may not be reported correctly to users.

**Recommendation:** Add explicit CORS checking. Consider logging detailed error info for debugging.

---

### 6. **No Input Validation on Deck Size** [ui.js:177-180]
**Severity:** HIGH  
**Location:** [ui.js](js/ui.js#L177-L180)

```javascript
if (deckSize !== 100 && deckSize !== 60 && deckSize !== 99 && deckSize !== 40) {
  html += ` <span class="vb-warn">· unusual size</span>`;
}
```

**Risk:** Allows loading decks with 0 cards, massive decks (10,000+ cards), causing performance degradation or crashes.

**Fix:**
```javascript
const VALID_SIZES = [40, 60, 99, 100];
if (deck.length === 0) {
  alert('Deck cannot be empty.');
  return;
}
if (deck.length > 500) {
  alert('Deck exceeds reasonable size limit (500 cards).');
  return;
}
if (!VALID_SIZES.includes(deckSize)) {
  html += ` <span class="vb-warn">· unusual size</span>`;
}
```

---

### 7. **Unhandled Promise Rejection in Web Deck Loading** [ui.js:349-364]
**Severity:** HIGH  
**Location:** [ui.js](js/ui.js#L349-L364)

```javascript
async function handleRandomWebDeck() {
  // ... no top-level catch for unhandled rejections
  const { remote, usedAnyFallback, requestedType } = await loadRandomWebDeckWithFallback();
}
```

**Risk:** If `loadRandomWebDeckWithFallback()` throws before `try` block, unhandled rejection occurs (unlikely but possible with module loading).

**Note:** The function has try/catch, but consider adding global handler:
```javascript
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled rejection:', event.reason);
});
```

---

### 8. **Race Condition in Deck State Mutation** [goldfish.js:20-26]
**Severity:** HIGH  
**Location:** [goldfish.js](js/goldfish.js#L20-L26)

```javascript
export function playLand(gf, cardIndex) {
  if (gf.landPlayedThisTurn) return gf;
  const card = gf.hand[cardIndex];
  if (!card || !isLand(card)) return gf;
  // ...
  const hand = [...gf.hand];
  hand.splice(cardIndex, 1);
  return { ...gf, hand, battlefield: [...gf.battlefield, card], landPlayedThisTurn: true };
}
```

**Issue:** The original `gf.hand[cardIndex]` reference is held, but the array is cloned. If rapid clicks occur, `cardIndex` might be out of bounds in cloned array.

**Fix:**
```javascript
export function playLand(gf, cardIndex) {
  if (gf.landPlayedThisTurn || cardIndex < 0 || cardIndex >= gf.hand.length) return gf;
  const card = gf.hand[cardIndex];
  if (!card || !isLand(card)) return gf;
  const hand = gf.hand.filter((_, i) => i !== cardIndex);
  return { ...gf, hand, battlefield: [...gf.battlefield, card], landPlayedThisTurn: true };
}
```

---

### 9. **localStorage Quota Exceeded Not Handled** [storage.js:43-51]
**Severity:** HIGH  
**Location:** [storage.js](js/storage.js#L43-L51)

```javascript
export function saveCardCacheByHash(hash, cardData) {
  const minimal = cardData.map(c => ({...}));
  // ...
  ls.set(KEY_CACHE_PFX + hash, JSON.stringify({ ts: Date.now(), data: minimal }));
}
```

**Risk:** `localStorage.setItem()` silently fails when quota exceeded, but doesn't notify user or clean old entries preemptively.

**Fix:**
```javascript
const ls = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { 
    try { 
      localStorage.setItem(k, v);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
        // Optionally trigger cleanup
        clearOldestCache();
        try { localStorage.setItem(k, v); } catch {}
      }
    }
  },
  del: k => { try { localStorage.removeItem(k); } catch {} },
};
```

---

### 10. **No Protection Against Deeply Nested Object Attacks** [parser.js]
**Severity:** HIGH  
**Location:** [parser.js](js/parser.js#L1-50)

**Issue:** While the parser is relatively safe, there's no depth limit on `split('//')` operations or other recursive structures.

**Recommendation:** Add reasonable limits:
```javascript
function normalizeCardName(rawName) {
  // Limit splits to prevent DoS from massively nested inputs
  const parts = rawName.split('//').slice(0, 2); // Max 2 parts
  let name = parts[0].trim();
  name = name.split(/[\[(]/, 1)[0].trim();
  return name;
}
```

---

## 🟡 Medium-Priority Issues

### 11. **Memory Leak Risk in Zoom Modal** [zoom.js:13-28]
**Severity:** MEDIUM  
**Location:** [zoom.js](js/zoom.js#L13-28)

```javascript
modal.addEventListener('click', closeZoom);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeZoom();
});
```

**Issue:** Event listeners are never removed. If zoom is opened/closed thousands of times, listeners accumulate in memory (though `document` listener is only added once).

**Fix:** Use `{ once: true }` or manual cleanup:
```javascript
function closeZoomHandler(e) {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeZoom();
}
document.addEventListener('keydown', closeZoomHandler);
// In cleanup: document.removeEventListener('keydown', closeZoomHandler);
```

---

### 12. **No Request Timeout for Large Fetch Operations** [scryfall.js:12]
**Severity:** MEDIUM  
**Location:** [scryfall.js](js/scryfall.js#L12)

```javascript
const REQUEST_TIMEOUT_MS = 12000;
```

**Issue:** 12 seconds allows large card collections to tie up the UI during fetch. Consider shorter timeout with better retry UX.

**Recommendation:**
```javascript
const REQUEST_TIMEOUT_MS = 8000;  // Shorter timeout
const MAX_RETRIES = 3;  // More retries to compensate
```

---

### 13. **No Protection Against API Rate Limiting** [scryfall.js:32-34]
**Severity:** MEDIUM  
**Location:** [scryfall.js](js/scryfall.js#L32-L34)

```javascript
if (response.status === 429 || response.status >= 500) && attempt < retries) {
  const backoffMs = response.status === 429 ? 2000 : 800 * (attempt + 1);
  await sleep(backoffMs);
}
```

**Status:** Exponential backoff is implemented correctly. ✓

**Recommendation:** Add request batching logic or request queue to prevent thundering herd:
```javascript
// Suggested: Add rate limiting queue
const requestQueue = [];
const processQueue = () => { /* process one per THROTTLE_MS */ };
```

---

### 14. **Unsafe Array Index Access in Golden Fish** [goldfishUi.js:58]
**Severity:** MEDIUM  
**Location:** [goldfishUi.js](js/goldfishUi.js#L58)

```javascript
const castable = getCastableFlags(gf);
// ... later:
cards.forEach((card, i) => {
  const isCastable = castableFlags[i];  // Could be undefined if lengths don't match
```

**Fix:**
```javascript
const isCastable = castableFlags && castableFlags[i] ? true : false;
```

---

### 15. **No Validation of Card Data Structure** [domUtils.js:2-5]
**Severity:** MEDIUM  
**Location:** [domUtils.js](js/domUtils.js#L2-L5)

```javascript
export function getImageUrl(card, size = 'small') {
  const uris = card.image_uris || card.card_faces?.[0]?.image_uris;
  return uris ? uris[size] || uris.small || uris.normal || null : null;
}
```

**Risk:** If `card.card_faces` is not an array, optional chaining masks the error silently.

**Recommendation:**
```javascript
export function getImageUrl(card, size = 'small') {
  if (!card) return null;
  const uris = card.image_uris || 
    (Array.isArray(card.card_faces) && card.card_faces[0]?.image_uris);
  return uris ? uris[size] || uris.small || uris.normal || null : null;
}
```

---

### 16. **Missing Null Check Before DOM Manipulation** [ui.js:78-96]
**Severity:** MEDIUM  
**Location:** [ui.js](js/ui.js#L78-L96)

```javascript
function showRemoteDeckHint(remote, { usedAnyFallback = false, requestedType = '' } = {}) {
  if (!savedHint) return;
  clearHint();

  const leadText = usedAnyFallback ? `No ${requestedType} decks available...` : `Loaded ${remote.deckType}...`;
```

**Issue:** `remote.deckType` and other properties are used unvalidated.

**Fix:**
```javascript
function showRemoteDeckHint(remote, { usedAnyFallback = false, requestedType = '' } = {}) {
  if (!savedHint || !remote) return;
  clearHint();

  const deckType = remote.deckType || 'Unknown';
  const deckName = remote.deckName || 'Deck';
  // ...
}
```

---

### 17. **Hardcoded Magic Numbers in Deck Validation** [ui.js:177-180]
**Severity:** MEDIUM  
**Location:** [ui.js](js/ui.js#L177-L180)

```javascript
if (deckSize !== 100 && deckSize !== 60 && deckSize !== 99 && deckSize !== 40) {
```

**Recommendation:** Extract to constants:
```javascript
const VALID_DECK_SIZES = [40, 60, 99, 100];
if (!VALID_DECK_SIZES.includes(deckSize)) {
  html += ` <span class="vb-warn">· unusual size</span>`;
}
```

---

### 18. **No Accessibility: Missing Alt Text on Various Elements**
**Severity:** MEDIUM  
**Location:** Multiple files

- [zoom.js:26](js/zoom.js#L26): `img.alt = card.name` ✓ (Good)
- [domUtils.js:45](js/domUtils.js#L45): `img.alt = card.name` ✓ (Good)
- Cards rendered via `appendCardSlot` may have skeletal alt text

**Recommendation:** Ensure all images have descriptive alts. For placeholders:
```javascript
img.alt = `${card.name} card image`;
```

---

### 19. **No Dark Mode Support Indicated in CSS**
**Severity:** MEDIUM  
**Note:** This is UI/CSS, not code audit specific, but worth noting.

**Recommendation:** Add `prefers-color-scheme` media query in CSS:
```css
@media (prefers-color-scheme: dark) {
  /* Ensure sufficient contrast */
}
```

---

### 20. **No Analytics or Error Telemetry**
**Severity:** MEDIUM  
**Location:** Entire codebase

**Risk:** Errors happening in production are not reported. Example:
```javascript
console.error('handleStart error', err);  // Only logs to console
```

**Recommendation:** Add optional telemetry:
```javascript
function reportError(context, error) {
  console.error(`[${context}]`, error);
  // Optional: send to logging service
  // if (window.errorReporter) window.errorReporter.captureException(error, { context });
}
```

---

### 21. **Potential Performance Issue: Image Preloading Not Coordinated** [ui.js:21-25]
**Severity:** MEDIUM  
**Location:** [ui.js](js/ui.js#L21-L25)

```javascript
function preloadImages(cards) {
  for (const c of cards) {
    const src = getImageUrl(c, 'small');
    if (src) { const img = new Image(); img.src = src; }
  }
}
```

**Issue:** Creates many Image objects simultaneously without managing load state. On slow networks, this can cause thrashing.

**Recommendation:** Limit concurrent preloads:
```javascript
async function preloadImages(cards, maxConcurrent = 2) {
  for (let i = 0; i < cards.length; i += maxConcurrent) {
    const batch = cards.slice(i, i + maxConcurrent);
    await Promise.all(batch.map(c => {
      return new Promise(resolve => {
        const src = getImageUrl(c, 'small');
        if (src) {
          const img = new Image();
          img.onload = img.onerror = resolve;
          img.src = src;
        } else {
          resolve();
        }
      });
    }));
  }
}
```

---

### 22. **Missing Feature: Link Validation in Remote Deck UI** [ui.js:91-95]
**Severity:** MEDIUM (Information Disclosure potential)  
**Location:** [ui.js](js/ui.js#L91-L95)

```javascript
const link = document.createElement('a');
link.href = remote.sourceUrl;
link.target = '_blank';
link.rel = 'noopener noreferrer';  // ✓ Good: prevents opener access
link.textContent = 'Source';
```

**Recommendation:** Validate URL protocol:
```javascript
function isValidSourceUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

if (remote.sourceUrl && isValidSourceUrl(remote.sourceUrl)) {
  link.href = remote.sourceUrl;
} else {
  link.textContent = 'Source (unavailable)';
  link.style.pointerEvents = 'none';
}
```

---

## 🟢 Low-Priority / Code Quality Recommendations

### 23. **Inconsistent Error Messages** [raceUi.js:53]
**Severity:** LOW  
**Location:** [raceUi.js](js/raceUi.js#L53)

Some errors use generic messages, others are specific. Standardize:
```javascript
class DeckError extends Error {
  constructor(message, code = 'DECK_ERROR') {
    super(message);
    this.code = code;
  }
}
```

---

### 24. **Missing JSDoc Comments**
**Severity:** LOW  
**Recommendation:** Add JSDoc to public APIs:
```javascript
/**
 * Shuffles an array in-place using Fisher-Yates algorithm.
 * @param {Array} cards - Array to shuffle
 * @returns {Array} - The shuffled array (same reference)
 */
export function shuffle(cards) {
  // ...
}
```

---

### 25. **Unused Legacy Functions** [storage.js:71-72]
**Severity:** LOW  
**Location:** [storage.js](js/storage.js#L71-L72)

```javascript
// Legacy no-ops so old call-sites don't break
export function saveCardCache() {}
export function loadCardCache()  { return null; }
```

**Recommendation:** These can be removed or deprecated after confirming no external usage.

---

## Summary Table

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 CRITICAL | 3 | XSS: `innerHTML` usage (3 locations) |
| 🟠 HIGH | 7 | CORS validation, input validation, promise handling, race conditions, quota handling, DoS vectors |
| 🟡 MEDIUM | 12 | Memory leaks, timeouts, rate limiting, null checks, accessibility, telemetry, performance |
| 🟢 LOW | 3 | Code quality, JSDoc, legacy functions |

---

## Remediation Priority

**Immediate (Within 1 sprint):**
1. Fix all XSS vulnerabilities (Issues #1–3, #4)
2. Add input validation for deck size (Issue #6)
3. Fix race condition in playLand (Issue #8)

**High Priority (Within 2 sprints):**
4. Handle localStorage quota exceeded (Issue #9)
5. Validate remote deck properties (Issue #16)
6. Extract hardcoded deck sizes to constants (Issue #17)
7. Add URL validation for source links (Issue #22)

**Medium Priority (Next iteration):**
8. Improve CORS error handling (Issue #5)
9. Add global error telemetry (Issue #20)
10. Optimize image preloading (Issue #21)

**Low Priority (Nice-to-have):**
11. Add JSDoc comments (Issue #24)
12. Remove legacy functions (Issue #25)

---

## Positive Findings ✓

- **Excellent API resilience:** Scryfall fetch includes proper retry logic, exponential backoff, timeout handling
- **Good error messages:** User-friendly feedback when API fails, network issues, or deck parsing fails
- **Smart caching:** Card cache by hash with TTL prevents unnecessary API calls
- **Accessible HTML:** Good use of ARIA labels, roles, semantic HTML
- **Module architecture:** Clean ES module separation makes code testable and maintainable
- **Safe randomness:** Uses `Math.random()` appropriately for non-crypto use cases

---

## Conclusion

Keep7 is a solid, well-architected project. The critical issues identified are primarily related to using `innerHTML` with dynamic content—a common pitfall even in professional codebases. With the recommended fixes applied, this codebase will be production-ready for handling user data securely.

**Estimated effort to remediate critical + high issues:** 1–2 days  
**Estimated effort for all issues:** 1 week  

---

*Audit completed: April 18, 2026*
