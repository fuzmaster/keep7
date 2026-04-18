import { createDeckState, draw } from './engine.js';
import { evalHand, computeSessionStats, pLandInDraws, landCountFromDeck } from './metrics.js';

export function runDeckTrials(deck, n = 20) {
  const deckLands = landCountFromDeck(deck);
  const samples   = [];

  for (let i = 0; i < n; i++) {
    const state = createDeckState(deck);
    const hand  = draw(state, 7);
    const ev    = evalHand(hand);
    const t3    = pLandInDraws(deckLands - ev.landCount, deck.length - 7, 3);
    samples.push({ landCount: ev.landCount, wasKept: ev.keep === 'keepable', keep: ev.keep, t3 });
  }

  const sess      = computeSessionStats(samples);
  const avgT3Land = Math.round(samples.reduce((a, s) => a + s.t3,  0) / n);
  const floodRisk = Math.round(samples.filter(s => s.keep === 'flood').length / n * 100);
  const screwRisk = Math.round(samples.filter(s => s.keep === 'screw').length / n * 100);

  return { ...sess, avgT3Land, floodRisk, screwRisk, totalLands: deckLands, deckSize: deck.length };
}

export function generateVerdict(a, b) {
  const lines = [];

  const keepDiff = a.keepRate - b.keepRate;
  if (Math.abs(keepDiff) >= 10) {
    lines.push(keepDiff > 0 ? 'Deck A has more keepable openers' : 'Deck B has more keepable openers');
  }

  const t3Diff = a.avgT3Land - b.avgT3Land;
  if (Math.abs(t3Diff) >= 6) {
    lines.push(t3Diff > 0
      ? 'Deck A hits land drops more consistently through turn 3'
      : 'Deck B hits land drops more consistently through turn 3');
  }

  if (a.screwRisk > b.screwRisk + 10) lines.push('Deck A has higher mana screw risk');
  else if (b.screwRisk > a.screwRisk + 10) lines.push('Deck B has higher mana screw risk');

  if (a.floodRisk > b.floodRisk + 10) lines.push('Deck A floods more often');
  else if (b.floodRisk > a.floodRisk + 10) lines.push('Deck B floods more often');

  const avgDiff = parseFloat(a.avgLands) - parseFloat(b.avgLands);
  if (Math.abs(avgDiff) >= 0.5) {
    lines.push(avgDiff < 0 ? 'Deck A starts with fewer lands on average' : 'Deck B starts with fewer lands on average');
  }

  return lines.length ? lines : ['Both decks perform similarly in early turns'];
}