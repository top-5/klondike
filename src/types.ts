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

// Get sprite position for a card
// Spritesheet layout: 4 rows (spades, hearts, diamonds, clubs) x 13 columns (A-K)
export function getCardSpritePosition(card: Card): { row: number; col: number } {
  const suitIndex = SUITS.indexOf(card.suit);
  const rankIndex = RANKS.indexOf(card.rank);
  return { row: suitIndex, col: rankIndex };
}
