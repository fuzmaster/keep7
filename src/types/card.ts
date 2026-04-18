/* ── Card & Deck Types ─────────────────────────────────── */

export interface CardImageUris {
  small: string;
  normal: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

export interface CardFace {
  name: string;
  mana_cost: string;
  type_line?: string;
  image_uris?: CardImageUris;
}

export interface Card {
  name: string;
  type_line: string;
  cmc: number;
  mana_cost: string;
  image_uris?: CardImageUris;
  card_faces?: CardFace[];
  placeholder?: boolean;
}

export interface DeckState {
  cards: Card[];
  index: number;
}

/* ── Scryfall API ─────────────────────────────────────── */

export interface ScryfallIdentifier {
  name: string;
}

export interface ScryfallCollectionResponse {
  data: ScryfallCard[];
  not_found: ScryfallIdentifier[];
}

export interface ScryfallCard {
  name: string;
  type_line: string;
  cmc: number;
  mana_cost: string;
  image_uris?: CardImageUris;
  card_faces?: CardFace[];
}

/* ── Metrics ──────────────────────────────────────────── */

export type KeepVerdict = 'keepable' | 'marginal' | 'flood' | 'screw' | 'risky';

export interface HandEval {
  landCount: number;
  spellCount: number;
  earlySpells: number;
  keep: KeepVerdict;
}

export interface OpenerSample {
  landCount: number;
  wasKept: boolean;
}

export interface SessionStats {
  keeps: number;
  mulls: number;
  keepRate: number;
  avgLands: string;
  twoLandPct: number;
  threeLandPct: number;
  openers: number;
}

export interface KeepLabelResult {
  text: string;
  cls: string;
}

/* ── Race ─────────────────────────────────────────────── */

export interface DeckTrialResult extends SessionStats {
  avgT3Land: number;
  floodRisk: number;
  screwRisk: number;
  totalLands: number;
  deckSize: number;
}

/* ── Goldfish (enhanced) ──────────────────────────────── */

export interface ManaPool {
  W: number;
  U: number;
  B: number;
  R: number;
  G: number;
  C: number;
}

export interface ManaCost {
  generic: number;
  colors: Record<string, number>;
  total: number;
}

export interface Permanent {
  card: Card;
  tapped: boolean;
  producesColor: keyof ManaPool;
}

export interface GoldfishState {
  turn: number;
  hand: Card[];
  battlefield: Permanent[];
  graveyard: Card[];
  library: DeckState;
  manaPool: ManaPool;
  landPlayedThisTurn: boolean;
  spellsCastThisTurn: number;
  log: string[];
}

export interface GoldfishSummary {
  turn: number;
  landsInPlay: number;
  handSize: number;
  availableMana: number;
  manaPool: ManaPool;
  castable: number;
}

/* ── Remote Deck ──────────────────────────────────────── */

export interface RemoteDeckResult {
  deckText: string;
  deckName: string;
  fileName: string;
  deckType: string;
  sourceUrl: string;
}

/* ── URL Import ───────────────────────────────────────── */

export type DeckSource = 'moxfield' | 'archidekt' | 'unknown';

export interface ImportedDeck {
  deckText: string;
  deckName: string;
  source: DeckSource;
}

/* ── App-level ────────────────────────────────────────── */

export type AppMode = 'handtest' | 'goldfish' | 'race';
