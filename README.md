# Keep7

Testing a 100-card Magic deck on a phone is a pain.

Most tools feel cramped, slow, or built for desktop first. Keep7 fixes that.

Paste your list. Tap through opening hands. Goldfish turns. Compare two decks. Do it fast on mobile.

## 60-Second Recruiter Scan

**What it is:**
Mobile-first MTG deck testing app for opening-hand consistency and early-turn simulation.

**Problem solved:**
Commander deck testing on a phone is usually slow and clumsy.

**What I built:**
- Hand tester with keep/mull flow and draw reveal
- Turn 1-5 goldfish simulator
- Deck-vs-deck race mode with 20-hand trial verdicts
- Web deck loader (MTGJSON) with retries and fallback behavior
- Parser cleanup for noisy Moxfield export lines
- Full-screen tap-to-zoom card modal for mobile use

**Stack:**
Vanilla JS (ES modules), HTML, CSS, Scryfall API, MTGJSON API

**Why this matters:**
Shows product thinking, practical front-end architecture, API resilience, and mobile UX execution in one project.

## What This App Does

Keep7 is a client-side MTG deck testing app focused on Commander-sized lists.

It helps you answer real play questions:

- Is this opener keepable?
- How often do I hit land drops?
- Which version of this deck starts better?

## Why People Use Keep7

- **You can test in seconds, not minutes.**
  Paste a decklist and start drawing hands right away.

- **It works well on a phone.**
  Big tap targets, quick flows, full-screen card zoom.

- **You can compare deck versions side by side.**
  Run 20 opener trials for each list and read a plain verdict.

- **You can load random web decks for fun testing.**
  Pull from MTGJSON by deck type, then tap "Try another."

- **It keeps your choices.**
  Deck text, web deck type, and card cache are saved in local storage.

## Features

### Test Opening Hands

- Parse decklists from plain text
- Draw a 7-card opener
- Mulligan or keep
- Reveal the next 3 draws
- Track session stats (keep rate, land distribution, flood/screw signals)

### Goldfish Turns 1-5

- Simulate early turns with your actual list
- Play lands from hand
- See available mana and castable cards

### Compare Two Decks

- Run 20 opener simulations for Deck A and Deck B
- See both opening hands
- Review core stats for each deck
- Get a short verdict line you can act on

### Load Random Web Decks

- Load random decks from MTGJSON
- Filter by deck type
- Fallback flow: selected type -> any type -> local sample deck
- One-tap "Try another"

## Setup (Low Pressure)

No account. No backend setup. No database.

1. Clone this repo.
2. Start a local static server.
3. Open the app in your browser.

### Option A: Python

```bash
python -m http.server 5173
```

### Option B: Node

```bash
npx http-server -p 5173
```

Then open:

`http://localhost:5173`

## Decklist Input Format

Use one card per line:

```text
1 Sol Ring
1 Arcane Signet
35 Plains
```

The parser handles common export noise, including set codes and collector numbers from Moxfield-style lines.

## Tech and APIs

- Vanilla HTML/CSS/JavaScript (ES modules)
- Scryfall API for card data and images
- MTGJSON API for random web deck loading
- Fully client-side (no custom backend)

## Project Layout

- `index.html` - app shell and mode panels
- `styles.css` - visual system and responsive layout
- `js/ui.js` - hand test flow and interactions
- `js/goldfishUi.js` - goldfish mode UI
- `js/raceUi.js` - deck race mode UI
- `js/remoteDeck.js` - MTGJSON deck loading logic
- `js/parser.js` - decklist parsing and cleanup
- `js/storage.js` - local cache and saved settings

## Common Issues

### App does not load modules

Run from a local server, not `file://`.

### Card images do not appear

Check internet access and Scryfall availability.

### Random web deck fails

MTGJSON may be down. Keep7 falls back to a local sample deck.

## Portfolio Note

This project shows product thinking plus front-end execution:

- Mobile-first UX for a niche workflow
- Real-world parser cleanup for noisy deck exports
- Resilient API fallbacks
- Fast, no-framework JavaScript architecture

## License

MIT License. See `LICENSE`.
