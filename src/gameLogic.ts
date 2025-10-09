import type { Card, GameState, Rank, Suit } from './types';
import { SUITS, RANKS, getRankValue, isRed, isBlack } from './types';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck;
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export function createInitialState(): GameState {
  const deck = shuffle(createDeck());
  
  // Deal tableau: 7 columns, 1-7 cards each
  const tableau: Card[][] = [];
  let deckIndex = 0;
  
  for (let col = 0; col < 7; col++) {
    const column: Card[] = [];
    for (let row = 0; row <= col; row++) {
      const card = deck[deckIndex++]!;
      // Only top card is face up
      card.faceUp = row === col;
      column.push(card);
    }
    tableau.push(column);
  }
  
  // Remaining cards go to stock
  const stock = deck.slice(28);
  
  return {
    stock,
    waste: [],
    foundations: {
      spades: [],
      hearts: [],
      diamonds: [],
      clubs: []
    },
    tableau,
    moves: 0,
    startTime: Date.now()
  };
}

export function drawFromStock(state: GameState): GameState {
  if (state.stock.length === 0) {
    // Recycle waste back to stock
    return {
      ...state,
      stock: [...state.waste].reverse().map(card => ({ ...card, faceUp: false })),
      waste: [],
      moves: state.moves + 1
    };
  }
  
  const card = state.stock[0]!;
  return {
    ...state,
    stock: state.stock.slice(1),
    waste: [...state.waste, { ...card, faceUp: true }],
    moves: state.moves + 1
  };
}

export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) {
    return card.rank === 'A';
  }
  
  const topCard = foundation[foundation.length - 1]!;
  return (
    card.suit === topCard.suit &&
    getRankValue(card.rank) === getRankValue(topCard.rank) + 1
  );
}

export function canPlaceOnTableau(card: Card, column: Card[]): boolean {
  if (column.length === 0) {
    return card.rank === 'K';
  }
  
  const topCard = column[column.length - 1]!;
  if (!topCard.faceUp) return false;
  
  // Must be opposite color
  if ((isRed(card.suit) && isRed(topCard.suit)) || 
      (isBlack(card.suit) && isBlack(topCard.suit))) {
    return false;
  }
  
  // Must be one rank lower
  return getRankValue(card.rank) === getRankValue(topCard.rank) - 1;
}

export function moveToFoundation(
  state: GameState,
  source: 'waste' | 'tableau',
  sourceIndex: number
): GameState | null {
  let card: Card | undefined;
  let newState = { ...state };
  
  if (source === 'waste') {
    if (state.waste.length === 0) return null;
    card = state.waste[state.waste.length - 1];
  } else {
    const column = state.tableau[sourceIndex];
    if (!column || column.length === 0) return null;
    card = column[column.length - 1];
    if (!card?.faceUp) return null;
  }
  
  if (!card) return null;
  
  const foundation = state.foundations[card.suit];
  if (!canPlaceOnFoundation(card, foundation)) return null;
  
  // Perform the move
  newState.foundations = {
    ...state.foundations,
    [card.suit]: [...foundation, card]
  };
  
  if (source === 'waste') {
    newState.waste = state.waste.slice(0, -1);
  } else {
    const column = [...state.tableau[sourceIndex]!];
    column.pop();
    
    // Flip top card if exists
    if (column.length > 0 && !column[column.length - 1]!.faceUp) {
      column[column.length - 1] = { ...column[column.length - 1]!, faceUp: true };
    }
    
    newState.tableau = [...state.tableau];
    newState.tableau[sourceIndex] = column;
  }
  
  newState.moves = state.moves + 1;
  return newState;
}

export function moveCards(
  state: GameState,
  from: { source: 'waste' | 'tableau', index: number, cardIndex?: number },
  to: { source: 'tableau' | 'foundation', index: number }
): GameState | null {
  // Moving to foundation
  if (to.source === 'foundation') {
    return moveToFoundation(state, from.source, from.index);
  }
  
  // Moving to tableau
  let cards: Card[] = [];
  let newState = { ...state };
  
  if (from.source === 'waste') {
    if (state.waste.length === 0) return null;
    cards = [state.waste[state.waste.length - 1]!];
  } else {
    const column = state.tableau[from.index];
    if (!column || column.length === 0) return null;
    
    const cardIndex = from.cardIndex ?? column.length - 1;
    if (!column[cardIndex]?.faceUp) return null;
    
    cards = column.slice(cardIndex);
  }
  
  const targetColumn = state.tableau[to.index] || [];
  if (!canPlaceOnTableau(cards[0]!, targetColumn)) return null;
  
  // Perform the move
  newState.tableau = [...state.tableau];
  
  if (from.source === 'waste') {
    newState.waste = state.waste.slice(0, -1);
  } else {
    const fromColumn = [...state.tableau[from.index]!];
    const cardIndex = from.cardIndex ?? fromColumn.length - 1;
    fromColumn.splice(cardIndex);
    
    // Flip top card if exists
    if (fromColumn.length > 0 && !fromColumn[fromColumn.length - 1]!.faceUp) {
      fromColumn[fromColumn.length - 1] = { ...fromColumn[fromColumn.length - 1]!, faceUp: true };
    }
    
    newState.tableau[from.index] = fromColumn;
  }
  
  newState.tableau[to.index] = [...targetColumn, ...cards];
  newState.moves = state.moves + 1;
  
  return newState;
}

export function isGameWon(state: GameState): boolean {
  return Object.values(state.foundations).every(foundation => foundation.length === 13);
}
