import { useState, useEffect } from 'react';
import type { GameState, Card } from './types';
import { loadCardSprites, type CardImageMap } from './cardSprites';
import { createInitialState, drawFromStock, moveCards, isGameWon, canPlaceOnFoundation } from './gameLogic';
import './App.css';

interface DragData {
  source: 'waste' | 'tableau';
  index: number;
  cardIndex?: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [time, setTime] = useState(0);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [cardImages, setCardImages] = useState<CardImageMap | null>(null);

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

  const handleNewGame = () => {
    setGameState(createInitialState());
    setTime(0);
  };

  const handleStockClick = () => {
    const newState = drawFromStock(gameState);
    setGameState(newState);
  };

  const handleDragStart = (source: 'waste' | 'tableau', index: number, cardIndex?: number) => {
    setDragData({ source, index, cardIndex });
  };

  const handleDrop = (target: 'tableau' | 'foundation', targetIndex: number) => {
    if (!dragData) return;

    const newState = moveCards(
      gameState,
      dragData,
      { source: target, index: targetIndex }
    );

    if (newState) {
      setGameState(newState);
      if (isGameWon(newState)) {
        setTimeout(() => alert(`🎉 You won in ${newState.moves} moves!`), 100);
      }
    }
    setDragData(null);
  };

  const handleAutoMoveToFoundation = (source: 'waste' | 'tableau', index: number) => {
    // Try to move the card to its foundation
    const newState = moveCards(
      gameState,
      { source, index, cardIndex: source === 'tableau' ? undefined : undefined },
      { source: 'foundation', index: 0 } // Index doesn't matter for foundation
    );

    if (newState) {
      setGameState(newState);
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
    onDoubleClick?: () => void
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
      // Make the drag preview fully visible
      if (e.dataTransfer) {
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.opacity = '1';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
        setTimeout(() => document.body.removeChild(dragImage), 0);
      }
      // Make the original card invisible
      e.currentTarget.style.opacity = '0';
      if (onDragStart) onDragStart();
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
      // Restore the original card visibility
      e.currentTarget.style.opacity = '1';
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

    return (
      <div 
        key={key}
        className={className} 
        data-suit={card.suit} 
        style={style}
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
        onDragEnd={draggable ? handleDragEnd : undefined}
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
            {gameState.waste.length > 0 && (() => {
              const card = gameState.waste[gameState.waste.length - 1]!;
              const canAutoMove = canPlaceOnFoundation(card, gameState.foundations[card.suit]);
              return renderCard(
                card,
                'card',
                undefined,
                true,
                () => handleDragStart('waste', 0),
                undefined,
                canAutoMove ? () => handleAutoMoveToFoundation('waste', 0) : undefined
              );
            })()}
          </div>

          <div className="spacer"></div>

          {(['spades', 'hearts', 'diamonds', 'clubs'] as const).map((suit, idx) => (
            <div
              key={suit}
              className="card-pile foundation"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop('foundation', idx)}
            >
              {gameState.foundations[suit].length > 0 ? (() => {
                const card = gameState.foundations[suit][gameState.foundations[suit].length - 1]!;
                return renderCard(card);
              })() : (
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
                    canAutoMove ? () => handleAutoMoveToFoundation('tableau', colIdx) : undefined
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
