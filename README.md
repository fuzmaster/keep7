# Keep7

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![ES Modules](https://img.shields.io/badge/Module%20System-ES%20Modules-brightgreen)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![Client-Side Only](https://img.shields.io/badge/Backend-None-blue)]()
[![MTG Focused](https://img.shields.io/badge/For-MTG%20Players-ff0000)](https://magic.wizards.com/)

A fast, client-side MTG deck consistency lab.

Keep7 helps you test opening hands, goldfish early turns, compare two decklists, and load random sample decks from the web.

## Quick Start

```bash
# With Python 3
python -m http.server 5173

# Or Node.js (if you have http-server installed)
npx http-server -p 5173
```

Then open `http://localhost:5173` in your browser.

## Demo

**Hand Test Mode:** Draw opening hands, evaluate keep quality, reveal next draws, track session stats.

**Goldfish Mode:** Simulate turns 1–5 with land-play interactions and castable card highlights.

**Deck Race Mode:** Compare two decks side-by-side across 20 simulated openers and get a verdict.

**Random Web Deck:** Load a random MTG precon from MTGJSON, with type filtering and intelligent fallback.

## Features

- Hand Test mode
  - Parse decklists from plain text (`count card name` per line)
  - Draw opening hands and evaluate keep/mull quality
  - Reveal next 3 draws
  - Session stats (keep rate, opener land distribution, etc.)
- Goldfish mode
  - Simulate turns 1-5 with land-play interactions
  - Castable card highlighting and quick summary
- Deck Race mode
  - Compare two decks over 20 simulated openers each
  - Side-by-side opening hands, metrics, and verdict summary
- Random Web Deck mode (MTGJSON)
  - Load a random deck by selected deck type
  - Fallback flow: selected type -> any type -> local sample deck
  - Source link and quick "Try another" action
  - Type filter persistence in local storage

## Tech Stack

- Vanilla HTML/CSS/JavaScript (ES modules)
- Scryfall API for card image/data fetch
- MTGJSON API for remote sample deck loading
- No backend required

## Project Structure

- `index.html` - main app shell and mode panels
- `styles.css` - app styling and responsive layout
- `js/main.js` - app initialization and mode tab switching
- `js/ui.js` - Hand Test UI flow
- `js/goldfishUi.js` - Goldfish UI
- `js/raceUi.js` - Deck Race UI
- `js/remoteDeck.js` - MTGJSON random deck loader
- `js/storage.js` - local storage cache/persistence helpers
- `js/parser.js`, `js/engine.js`, `js/metrics.js`, etc. - core logic

## Getting Started

### Prerequisites

- Modern browser with ES module support (Chrome 61+, Firefox 67+, Safari 11+, Edge 79+)
- A local web server (see below)
- Internet connection (for Scryfall card images and MTGJSON deck catalog)

### Setup

Clone or download this repo, then from the root directory, start a static server:

**Python 3:**
```bash
python -m http.server 5173
```

**Node.js:**
```bash
npx http-server -p 5173
```

**Live Server (VS Code extension):**
- Right-click `index.html` → "Open with Live Server"

Then visit `http://localhost:5173`.

## Decklist Format

Use one card per line:

```text
1 Sol Ring
1 Arcane Signet
35 Plains
```

Notes:

- Prefix each line with a count.
- Unrecognized lines are skipped and reported in validation.

## Web Deck Loading Details

The `Random Web Deck` button uses MTGJSON v5:

1. Fetches `DeckList.json` (cached in memory).
2. Filters by selected deck type (or any type).
3. Picks a random recent candidate.
4. Fetches `/api/v5/decks/{fileName}.json`.
5. Normalizes sections into decklist lines for the textarea.

Resilience:

- Request timeout + retry
- Fallback to any deck type if selected type has no available candidates
- Final fallback to built-in local sample deck

## Persistence and Cache

Stored in `localStorage`:

- Last decklist text
- Selected web deck type
- Card cache (hash-keyed, TTL-based, bounded deck count)

Use the `Clear` action in the UI hint area to clear saved decklist/cache data.

## Notes

- Keep7 is fully client-side; no user-authored deck content is sent to your own server.
- Third-party API availability (Scryfall/MTGJSON) affects remote loading behavior.

## Troubleshooting

**"Module not found" or CORS errors:**
- Ensure you're running via a web server, not `file://`
- Check browser console for detailed errors

**Card images not loading:**
- Verify internet connection
- Check if Scryfall API is accessible

**Random Web Deck fails:**
- MTGJSON may be temporarily unavailable; app falls back to local sample
- Check network tab in DevTools for API response codes

**Local storage clearing:**
- Use the "Clear" button in the saved-hint area to reset cache/decklist
- Or clear browser localStorage manually (DevTools → Application → Local Storage)

## Contributing

Contributions welcome! Fork, make changes, and open a pull request.

Ideas:
- Additional deck filtering/sorting options
- Custom mulligan rules
- Matchup analysis tools
- Mobile UI improvements

## Roadmap Ideas

- More deck type presets and custom filters
- Better sampling controls (era/set windows)
- Extra mulligan heuristics and matchup overlays
- Export/share test snapshots
- Elo-weighted deck comparison

## License

MIT License. See LICENSE file for details.
