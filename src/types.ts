export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Record<Suit, Card[]>;
  tableau: Card[][];
  moves: number;
  startTime: number;
}

// Unicode playing card characters (colored!)
export const CARD_GLYPHS: Record<Suit, Record<Rank, string>> = {
  spades: {
    'A': '🂡', '2': '🂢', '3': '🂣', '4': '🂤', '5': '🂥', '6': '🂦', '7': '🂧',
    '8': '🂨', '9': '🂩', '10': '🂪', 'J': '🂫', 'Q': '🂬', 'K': '🂭'
  },
  hearts: {
    'A': '🂱', '2': '🂲', '3': '🂳', '4': '🂴', '5': '🂵', '6': '🂶', '7': '🂷',
    '8': '🂸', '9': '🂹', '10': '🂺', 'J': '🂻', 'Q': '🂼', 'K': '🂽'
  },
  diamonds: {
    'A': '🃁', '2': '🃂', '3': '🃃', '4': '🃄', '5': '🃅', '6': '🃆', '7': '🃇',
    '8': '🃈', '9': '🃉', '10': '🃊', 'J': '🃋', 'Q': '🃌', 'K': '🃍'
  },
  clubs: {
    'A': '🃑', '2': '🃒', '3': '🃓', '4': '🃔', '5': '🃕', '6': '🃖', '7': '🃗',
    '8': '🃘', '9': '🃙', '10': '🃚', 'J': '🃛', 'Q': '🃜', 'K': '🃝'
  }
};

export const CARD_BACK = '🂠';

export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function isBlack(suit: Suit): boolean {
  return suit === 'spades' || suit === 'clubs';
}

export function getRankValue(rank: Rank): number {
  return RANKS.indexOf(rank);
}

export function getCardGlyph(card: Card): string {
  if (!card.faceUp) return CARD_BACK;
  return CARD_GLYPHS[card.suit]?.[card.rank] || CARD_BACK;
}
