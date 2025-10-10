import { useEffect } from 'react';
import type { GameState } from '../types';

interface GameStateProbeProps {
  gameState: GameState;
  enabled?: boolean;
}

/**
 * GameStateProbe - Non-invasive AI instrumentation layer
 * 
 * This component exposes game state in the DOM for AI/automation tools
 * without affecting game rendering or functionality.
 * 
 * Features:
 * - Renders hidden JSON with full game state
 * - Exposes both visible-only and canonical (including hidden cards) state
 * - Provides bounding box metadata for vision training
 * - Emits custom events for AI tool coordination
 */
export function GameStateProbe({ gameState, enabled = true }: GameStateProbeProps) {
  useEffect(() => {
    if (!enabled) return;

    // Emit custom event when game state changes (for AI agents listening)
    const event = new CustomEvent('klondike:state-change', {
      detail: { timestamp: Date.now(), moves: gameState.moves }
    });
    window.dispatchEvent(event);
  }, [gameState, enabled]);

  if (!enabled) return null;

  // Build visible-only state (for perception tasks)
  const visibleState = {
    stock: gameState.stock.length,
    wasteTop: gameState.waste.length > 0 ? {
      suit: gameState.waste[gameState.waste.length - 1]!.suit,
      rank: gameState.waste[gameState.waste.length - 1]!.rank
    } : null,
    foundations: {
      spades: gameState.foundations.spades.length > 0 ? gameState.foundations.spades[gameState.foundations.spades.length - 1] : null,
      hearts: gameState.foundations.hearts.length > 0 ? gameState.foundations.hearts[gameState.foundations.hearts.length - 1] : null,
      diamonds: gameState.foundations.diamonds.length > 0 ? gameState.foundations.diamonds[gameState.foundations.diamonds.length - 1] : null,
      clubs: gameState.foundations.clubs.length > 0 ? gameState.foundations.clubs[gameState.foundations.clubs.length - 1] : null,
    },
    tableau: gameState.tableau.map(column => ({
      faceUp: column.filter(c => c.faceUp).map(c => ({ suit: c.suit, rank: c.rank })),
      faceDownCount: column.filter(c => !c.faceUp).length
    })),
    moves: gameState.moves,
    time: Math.floor((Date.now() - gameState.startTime) / 1000)
  };

  // Canonical state (for training - includes hidden cards)
  const canonicalState = {
    ...visibleState,
    canonical: {
      stock: gameState.stock,
      waste: gameState.waste,
      foundations: gameState.foundations,
      tableau: gameState.tableau,
      startTime: gameState.startTime
    }
  };

  return (
    <>
      {/* Visible state for perception validation */}
      <script
        id="__klondike_state_visible__"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(visibleState, null, 2) }}
      />

      {/* Canonical state for training (hidden cards included) */}
      <script
        id="__klondike_state_canonical__"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(canonicalState, null, 2) }}
      />

      {/* Game rules and instructions for AI */}
      <script
        id="__klondike_rules__"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            name: "Klondike Solitaire",
            objective: "Move all cards to the four foundation piles, sorted by suit from Ace to King",
            rules: {
              tableau: "Build down in alternating colors (red on black, black on red)",
              foundation: "Build up by suit starting with Ace",
              stock: "Draw cards one at a time; can recycle when empty",
              moves: "Only Kings can fill empty tableau columns"
            },
            controls: {
              click_stock: "Draw card from stock to waste",
              double_click_card: "Auto-move card to foundation if valid",
              drag_card: "Move card or sequence between piles"
            },
            scoring: {
              foundation_move: 10,
              reveal_card: 5,
              waste_to_tableau: 5,
              tableau_to_foundation: 10
            }
          }, null, 2)
        }}
      />
    </>
  );
}

/**
 * AI Drag Event Bridge
 * 
 * This window API allows AI tools to trigger drag operations
 * without interfering with the existing mouse/touch handlers.
 */
declare global {
  interface Window {
    __klondike_api__?: {
      getState: () => any;
      performDrag: (from: { pile: string; index: number }, to: { pile: string; index: number }) => Promise<boolean>;
      clickStock: () => void;
    };
  }
}
