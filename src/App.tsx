import { useState, useEffect } from 'react';
import type { GameState, Card } from './types';
import { getCardGlyph, CARD_BACK } from './types';
import { createInitialState, drawFromStock, moveCards, isGameWon } from './gameLogic';
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <div className="stock-waste">
            <div 
              className="card-pile stock" 
              onClick={handleStockClick}
              title="Click to draw"
            >
              {gameState.stock.length > 0 ? (
                <div className="card-back">{CARD_BACK}</div>
              ) : (
                <div className="card-empty">↻</div>
              )}
            </div>

            <div className="card-pile waste">
              {gameState.waste.length > 0 && (
                <div
                  className="card"
                  data-suit={gameState.waste[gameState.waste.length - 1]!.suit}
                  draggable
                  onDragStart={() => handleDragStart('waste', 0)}
                >
                  {getCardGlyph(gameState.waste[gameState.waste.length - 1]!)}
                </div>
              )}
            </div>
          </div>

          <div className="foundations">
            {(['spades', 'hearts', 'diamonds', 'clubs'] as const).map((suit, idx) => (
              <div
                key={suit}
                className="card-pile foundation"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop('foundation', idx)}
              >
                {gameState.foundations[suit].length > 0 ? (
                  <div 
                    className="card"
                    data-suit={gameState.foundations[suit][gameState.foundations[suit].length - 1]!.suit}
                  >
                    {getCardGlyph(gameState.foundations[suit][gameState.foundations[suit].length - 1]!)}
                  </div>
                ) : (
                  <div className="pile-placeholder">{['♠', '♥', '♦', '♣'][idx]}</div>
                )}
              </div>
            ))}
          </div>
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
                column.map((card, cardIdx) => (
                  <div
                    key={cardIdx}
                    className={`card ${!card.faceUp ? 'face-down' : ''}`}
                    data-suit={card.suit}
                    style={{ top: `${cardIdx * 25}px` }}
                    draggable={card.faceUp}
                    onDragStart={() => card.faceUp && handleDragStart('tableau', colIdx, cardIdx)}
                  >
                    {getCardGlyph(card)}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
