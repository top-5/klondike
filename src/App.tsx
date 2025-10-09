import { useState, useEffect } from 'react';
import type { GameState, Card } from './types';
import { loadCardSprites, type CardImageMap } from './cardSprites';
import { createInitialState, drawFromStock, moveCards, isGameWon, canPlaceOnFoundation } from './gameLogic';
import { soundManager } from './soundEffects';
import './App.css';

interface DragData {
  source: 'waste' | 'tableau';
  index: number;
  cardIndex?: number;
}

interface DragState {
  isDragging: boolean;
  cards: Card[];
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  sourceElement: HTMLElement | null;
}

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [time, setTime] = useState(0);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [cardImages, setCardImages] = useState<CardImageMap | null>(null);
  const [customDrag, setCustomDrag] = useState<DragState | null>(null);

  // Load card sprites on mount
  useEffect(() => {
    loadCardSprites()
      .then((images) => setCardImages(images))
      .catch((err) => console.error('Failed to load card sprites:', err));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(Math.floor((Date.now() - gameState.startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.startTime]);

  // Handle custom drag mouse/touch move
  useEffect(() => {
    if (!customDrag?.isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      setCustomDrag(prev => prev ? {
        ...prev,
        currentX: clientX,
        currentY: clientY
      } : null);
    };

    const handleEnd = (clientX: number, clientY: number) => {
      if (!customDrag) return;

      // Reset cursor
      document.body.style.cursor = '';

      // Find the drop target
      const target = document.elementFromPoint(clientX, clientY);
      const dropZone = target?.closest('.tableau-column, .card-pile.foundation');
      
      if (dropZone && dragData) {
        // Determine target type and index
        if (dropZone.classList.contains('tableau-column')) {
          const columns = Array.from(document.querySelectorAll('.tableau-column'));
          const targetIndex = columns.indexOf(dropZone);
          if (targetIndex >= 0) {
            handleDrop('tableau', targetIndex);
          }
        } else if (dropZone.classList.contains('foundation')) {
          const foundations = Array.from(document.querySelectorAll('.card-pile.foundation'));
          const targetIndex = foundations.indexOf(dropZone);
          if (targetIndex >= 0) {
            handleDrop('foundation', targetIndex);
          }
        }
      }

      // Clear custom drag
      setCustomDrag(null);
      setDragData(null);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging
      if (e.touches.length > 0) {
        handleMove(e.touches[0]!.clientX, e.touches[0]!.clientY);
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch) {
        handleEnd(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [customDrag, dragData]);

  const handleNewGame = () => {
    setGameState(createInitialState());
    setTime(0);
  };

  const handleStockClick = () => {
    const newState = drawFromStock(gameState);
    setGameState(newState);
    
    // Play flip sound when drawing a card
    soundManager.playFlip();
  };

  const handleDragStart = (source: 'waste' | 'tableau', index: number, cardIndex?: number) => {
    setDragData({ source, index, cardIndex });
  };

  const handleCustomDragStart = (
    clientX: number,
    clientY: number,
    rect: DOMRect,
    source: 'waste' | 'tableau',
    index: number,
    cardIndex?: number,
    cards?: Card[]
  ) => {
    if (!cards || cards.length === 0) return;

    // Calculate offset from card's top-left corner to click/touch position
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    
    setDragData({ source, index, cardIndex });
    setCustomDrag({
      isDragging: true,
      cards: cards,
      startX: offsetX, // Store offset within the card
      startY: offsetY,
      currentX: clientX,
      currentY: clientY,
      sourceElement: null
    });

    // Set cursor to grabbing
    document.body.style.cursor = 'grabbing';
  };

  const handleDrop = (target: 'tableau' | 'foundation', targetIndex: number) => {
    if (!dragData) return;

    // Check if any tableau column will have a card flipped
    let willFlipCard = false;
    if (dragData.source === 'tableau') {
      const sourceColumn = gameState.tableau[dragData.index];
      const cardIndex = dragData.cardIndex ?? sourceColumn!.length - 1;
      const remainingCards = cardIndex;
      if (remainingCards > 0 && sourceColumn && !sourceColumn[remainingCards - 1]?.faceUp) {
        willFlipCard = true;
      }
    }

    const newState = moveCards(
      gameState,
      dragData,
      { source: target, index: targetIndex }
    );

    if (newState) {
      setGameState(newState);
      
      // Play flip sound if a card was revealed
      if (willFlipCard) {
        soundManager.playFlip();
      }
      
      if (isGameWon(newState)) {
        setTimeout(() => alert(`🎉 You won in ${newState.moves} moves!`), 100);
      }
    }
    setDragData(null);
  };

  const handleAutoMoveToFoundation = (source: 'waste' | 'tableau', index: number) => {
    // Check if this will flip a card in tableau
    let willFlipCard = false;
    if (source === 'tableau') {
      const sourceColumn = gameState.tableau[index];
      if (sourceColumn && sourceColumn.length > 1 && !sourceColumn[sourceColumn.length - 2]?.faceUp) {
        willFlipCard = true;
      }
    }

    // Try to move the card to its foundation
    const newState = moveCards(
      gameState,
      { source, index, cardIndex: source === 'tableau' ? undefined : undefined },
      { source: 'foundation', index: 0 } // Index doesn't matter for foundation
    );

    if (newState) {
      setGameState(newState);
      
      // Play flip sound if a card was revealed
      if (willFlipCard) {
        soundManager.playFlip();
      }
      
      if (isGameWon(newState)) {
        setTimeout(() => alert(`🎉 You won in ${newState.moves} moves!`), 100);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCard = (
    card: Card, 
    className = 'card', 
    style?: React.CSSProperties,
    draggable?: boolean,
    onDragStart?: () => void,
    key?: string | number,
    onDoubleClick?: () => void,
    column?: Card[], // Optional: full column for stack preview
    cardIndex?: number // Optional: card index in column
  ) => {
    if (!cardImages) {
      // Loading fallback - show empty card
      return <div key={key} className={`${className} card-loading`} style={style}></div>;
    }

    const imageUrl = cardImages.get(card.suit, card.rank);
    if (!imageUrl) {
      console.warn(`Missing card image for ${card.suit}-${card.rank}`);
      return <div key={key} className={className} style={style}></div>;
    }

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!draggable) return;
      e.preventDefault();
      
      // Get the cards to drag (current card and all below it in the column)
      let cardsToMove: Card[] = [card];
      if (column && cardIndex !== undefined && cardIndex < column.length - 1) {
        cardsToMove = column.slice(cardIndex);
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      handleCustomDragStart(e.clientX, e.clientY, rect, 'tableau', 0, cardIndex, cardsToMove);
      
      if (onDragStart) onDragStart();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (!draggable) return;
      e.preventDefault();
      
      // Get the cards to drag (current card and all below it in the column)
      let cardsToMove: Card[] = [card];
      if (column && cardIndex !== undefined && cardIndex < column.length - 1) {
        cardsToMove = column.slice(cardIndex);
      }

      const touch = e.touches[0];
      if (touch) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        handleCustomDragStart(touch.clientX, touch.clientY, rect, 'tableau', 0, cardIndex, cardsToMove);
      }
      
      if (onDragStart) onDragStart();
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (onDoubleClick) {
        // Add flying animation class
        e.currentTarget.classList.add('card-flying');
        setTimeout(() => {
          onDoubleClick();
          // Remove animation class after move completes
          setTimeout(() => {
            e.currentTarget.classList.remove('card-flying');
          }, 100);
        }, 400); // Match CSS animation duration
      }
    };

    // Check if this card is being dragged
    const isBeingDragged = customDrag?.isDragging && customDrag.cards.some(c => 
      c.suit === card.suit && c.rank === card.rank
    );

    return (
      <div 
        key={key}
        className={className} 
        data-suit={card.suit} 
        style={{
          ...style,
          opacity: isBeingDragged ? 0 : 1, // Fully hide the original cards during drag
          cursor: draggable ? 'grab' : 'default'
        }}
        onMouseDown={draggable ? handleMouseDown : undefined}
        onTouchStart={draggable ? handleTouchStart : undefined}
        onDoubleClick={draggable ? handleClick : undefined}
      >
        <img src={imageUrl} alt={`${card.rank} of ${card.suit}`} draggable={false} />
      </div>
    );
  };

  const renderCardBack = (style?: React.CSSProperties, key?: string | number) => {
    if (!cardImages) {
      return <div key={key} className="card card-back card-loading" style={style}></div>;
    }
    return (
      <div key={key} className="card card-back" style={style}>
        <img src={cardImages.cardBack} alt="Card back" draggable={false} />
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>♠️ Klondike Solitaire ♥️</h1>
        <div className="controls">
          <button onClick={handleNewGame} className="btn-primary">New Game</button>
          <span>Moves: {gameState.moves}</span>
          <span>Time: {formatTime(time)}</span>
        </div>
      </header>

      <div className="game-area">
        <div className="top-row">
          <div
            className="card-pile stock"
            onClick={handleStockClick}
            title="Click to draw"
          >
            {gameState.stock.length > 0 ? (
              renderCardBack()
            ) : (
              <div className="card-empty">↻</div>
            )}
          </div>

          <div className="card-pile waste">
            {gameState.waste.length > 0 && (
              // Render all cards in the waste pile (stacked with no offset)
              gameState.waste.map((card, cardIdx) => {
                const isTopCard = cardIdx === gameState.waste.length - 1;
                const canAutoMove = isTopCard && canPlaceOnFoundation(card, gameState.foundations[card.suit]);
                return renderCard(
                  card,
                  'card',
                  undefined, // No offset - cards are perfectly stacked
                  isTopCard, // Only top card is draggable
                  isTopCard ? () => handleDragStart('waste', 0) : undefined,
                  cardIdx,
                  canAutoMove ? () => handleAutoMoveToFoundation('waste', 0) : undefined
                );
              })
            )}
          </div>

          <div className="spacer"></div>

          {(['spades', 'hearts', 'diamonds', 'clubs'] as const).map((suit, idx) => (
            <div
              key={suit}
              className="card-pile foundation"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop('foundation', idx)}
            >
              {gameState.foundations[suit].length > 0 ? (
                // Render all cards in the foundation stack
                gameState.foundations[suit].map((card, cardIdx) => {
                  // Only top card should be draggable from foundation (but we disable dragging in Klondike)
                  return renderCard(
                    card,
                    'card',
                    { top: `${Math.min(cardIdx * 2, 20)}px` }, // Slight offset, max 20px
                    false, // Foundations are not draggable in Klondike
                    undefined,
                    cardIdx,
                    undefined
                  );
                })
              ) : (
                <div className="pile-placeholder">{['♠', '♥', '♦', '♣'][idx]}</div>
              )}
            </div>
          ))}
        </div>

        <div className="tableau">
          {gameState.tableau.map((column, colIdx) => (
            <div
              key={colIdx}
              className="tableau-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop('tableau', colIdx)}
            >
              {column.length === 0 ? (
                <div className="pile-placeholder">K</div>
              ) : (
                column.map((card, cardIdx) => {
                  if (!card.faceUp) {
                    return renderCardBack({ top: `${cardIdx * 25}px` }, cardIdx);
                  }
                  
                  // Check if this is the top card and can auto-move to foundation
                  const isTopCard = cardIdx === column.length - 1;
                  const canAutoMove = isTopCard && canPlaceOnFoundation(card, gameState.foundations[card.suit]);
                  
                  return renderCard(
                    card,
                    'card',
                    { top: `${cardIdx * 25}px` },
                    true,
                    () => handleDragStart('tableau', colIdx, cardIdx),
                    cardIdx,
                    canAutoMove ? () => handleAutoMoveToFoundation('tableau', colIdx) : undefined,
                    column, // Pass the full column
                    cardIdx  // Pass the card index
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom drag overlay */}
      {customDrag && customDrag.isDragging && (
        <div
          style={{
            position: 'fixed',
            left: customDrag.currentX - customDrag.startX, // Subtract the offset
            top: customDrag.currentY - customDrag.startY,
            pointerEvents: 'none',
            zIndex: 10000,
            cursor: 'grabbing'
          }}
        >
          {customDrag.cards.map((card, idx) => (
            <div
              key={`${card.suit}-${card.rank}-drag`}
              className="card"
              style={{
                position: 'absolute',
                top: `${idx * 25}px`,
                left: 0,
                width: 'calc(min(100vw, 100vh) * 0.095)',
                height: 'calc(min(100vw, 100vh) * 0.134)'
              }}
            >
              <img 
                src={cardImages?.get(card.suit, card.rank)} 
                alt={`${card.rank} of ${card.suit}`} 
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
