import { useState, useCallback, useRef, useEffect } from 'react';
import DotCanvas from './components/DotCanvas';
import './App.css';

function App() {
  const [tapPosition, setTapPosition] = useState(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [lives, setLives] = useState(3);
  const [canUndo, setCanUndo] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const timeIntervalRef = useRef(null);
  const resetKeyRef = useRef(0);
  const dotCanvasRef = useRef(null);

  const handleCanvasTap = useCallback((x, y) => {
    setTapPosition({ x, y });
  }, []);

  const handleScoreUpdate = useCallback((newScore) => {
    setScore(newScore);
  }, []);

  const handleGameStart = useCallback(() => {
    setGameStarted(true);
    setTime(0);
    setScore(0);
    // Start timer
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
    timeIntervalRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  }, []);

  const handleNewGame = useCallback(() => {
    // Reset game state
    setGameStarted(false);
    setScore(0);
    setTime(0);
    setRemoveMode(false);
    setLives(3);
    setShowCompletionModal(false);
    resetKeyRef.current += 1;
    
    // Clear timer
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    // Reset canvas
    if (dotCanvasRef.current) {
      dotCanvasRef.current.reset();
    }
  }, []);

  const handleToggleRemoveMode = useCallback(() => {
    if (lives > 0) {
      setRemoveMode(prev => !prev);
    }
  }, [lives]);

  const handleSnakeRemoved = useCallback(() => {
    if (lives > 0) {
      setLives(prev => {
        const newLives = prev - 1;
        // Turn off remove mode after removing a snake
        setRemoveMode(false);
        return newLives;
      });
    }
  }, [lives]);

  const handleUndoStateChange = useCallback((undoAvailable) => {
    setCanUndo(undoAvailable);
  }, []);

  const handleUndo = useCallback(() => {
    if (dotCanvasRef.current && dotCanvasRef.current.undo) {
      dotCanvasRef.current.undo();
    }
  }, []);

  const handleAllSnakesCleared = useCallback(() => {
    setShowCompletionModal(true);
    // Stop the timer
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);

  const handleNext = useCallback(() => {
    setShowCompletionModal(false);
    handleNewGame();
  }, [handleNewGame]);

  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      <main className="main-content">
        <DotCanvas 
          key={resetKeyRef.current}
          ref={dotCanvasRef}
          onTap={handleCanvasTap} 
          tapPosition={tapPosition}
          onScoreUpdate={handleScoreUpdate}
          onGameStart={handleGameStart}
          removeMode={removeMode}
          onSnakeRemoved={handleSnakeRemoved}
          onUndoStateChange={handleUndoStateChange}
          onAllSnakesCleared={handleAllSnakesCleared}
        />
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-stats">
            <div className="stat-item">
              <span className="stat-label">Time</span>
              <span className="stat-value">{formatTime(time)}</span>
            </div>
            <button 
              className={`undo-btn ${!canUndo ? 'disabled' : ''}`}
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <span className="undo-icon">↶</span>
            </button>
            <button 
              className={`remove-snake-btn ${removeMode ? 'active' : ''} ${lives === 0 ? 'disabled' : ''}`}
              onClick={handleToggleRemoveMode}
              disabled={lives === 0}
            >
              <span className="remove-snake-label-top">REMOVE</span>
              <span className="remove-snake-label-bottom">{lives}</span>
            </button>
            <button className="new-game-btn" onClick={handleNewGame}>
              <span className="new-game-label-top">NEW</span>
              <span className="new-game-label-bottom">Game</span>
            </button>
          </div>
        </div>
      </footer>
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Level Complete!</h2>
            <p className="modal-message">All snakes have been cleared.</p>
            <button className="modal-next-btn" onClick={handleNext}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


