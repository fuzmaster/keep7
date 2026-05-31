# Keep7

MTG deck testing tool for opening hands, early turns, and deck comparison.

Paste a decklist. Draw hands. Goldfish turns 1–5. Compare two decks side by side. Works on mobile.

**[→ Try it at keep7.vercel.app](https://keep7.vercel.app)**

---

## What it does

Keep7 helps you answer real play questions before you sit down at a table:

- **Is this opener keepable?** Draw 7-card hands, keep or mulligan, see your next 3 draws.
- **How does my curve play out?** Goldfish turns 1–5 — tap lands, cast spells, see available mana.
- **Which version of this deck starts better?** Run 20 opener trials for each list, get a plain verdict.

## Modes

### Hand Test
- Parse any standard decklist format
- Draw a 7-card opener, keep or mulligan
- Reveal next 3 draws after you keep
- Track session stats: keep rate, land distribution, flood/screw risk

### Goldfish
- Simulate turns 1–5 against an empty board
- Play lands from hand, tap for mana, cast spells
- Action log tracks what happened each turn

### Deck Race
- Compare two decklists across 20 simulated openers each
- Stats: keep rate, avg lands, T3 land %, flood/screw risk
- Plain-English verdict you can act on

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** throughout
- **CSS Modules** — no CSS-in-JS, no utility framework
- **Scryfall API** — card data and images, with retry/fallback
- **MTGJSON** — random web deck loading
- Fully client-side — no custom backend, no auth, no database

## Setup

```bash
git clone https://github.com/fuzmaster/keep7.git
cd keep7
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Decklist format

One card per line:

```
4 Lightning Bolt
4 Goblin Guide
20 Mountain
```

Handles Moxfield export format automatically (set codes, collector numbers, etc.).

## Importing decks

- **Paste a decklist** — plain text, one card per line
- **Moxfield / Archidekt URLs** — import via the URL field
- **Random web deck** — loads from MTGJSON by deck type

## Reliability

- Scryfall requests are batched, rate-limited, and retried on failure
- If Scryfall is unavailable, the app falls back to placeholder cards — simulation still works
- Card data is cached in `localStorage` by deck hash (7-day TTL, up to 5 decks)
- `localStorage` failures are handled gracefully

## Project layout

```
src/
  app/            Next.js App Router pages and layout
  components/     UI components with colocated CSS modules
  hooks/          State logic for each mode (useHandTest, useGoldfish, useRace)
  lib/            Business logic: parser, engine, scryfall, storage, metrics
  types/          TypeScript interfaces
```

## Privacy

Keep7 runs entirely in your browser. Deck text and session data never leave your device. The only external requests are to Scryfall (card images/data) and MTGJSON (optional random deck loading).

## License

MIT
