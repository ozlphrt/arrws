import { useState, useCallback, useRef, useEffect } from 'react';
import DotCanvas from './components/DotCanvas';
import './App.css';

const STORAGE_KEY = 'arrws-game-state';

function App() {
  const [tapPosition, setTapPosition] = useState(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [lives, setLives] = useState(3);
  const [canUndo, setCanUndo] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [level, setLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const timeIntervalRef = useRef(null);
  const resetKeyRef = useRef(0);
  const dotCanvasRef = useRef(null);
  const savedSnakeStateRef = useRef(null);
  const completionDetectedRef = useRef(false); // Track if completion was detected

  // Load game state from localStorage
  const loadGameState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        return {
          level: state.level || 1,
          score: state.score || 0,
          time: state.time || 0,
          lives: state.lives || 3,
          gameStarted: state.gameStarted || false,
          snakeState: state.snakeState || null
        };
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
    return null;
  }, []);

  // Save game state to localStorage
  const saveGameState = useCallback((snakeState = null) => {
    try {
      const state = {
        level,
        score,
        time,
        lives,
        gameStarted,
        snakeState
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }, [level, score, time, lives, gameStarted]);

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
    // Reset completion detection flag
    completionDetectedRef.current = false;
    // Reset game state
    setGameStarted(false);
    setScore(0);
    setTime(0);
    setRemoveMode(false);
    setLives(3);
    setShowCompletionModal(false);
    setShowGameOverModal(false);
    setLevel(1);
    resetKeyRef.current += 1;
    
    // Clear timer
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);

    // Reset canvas
    if (dotCanvasRef.current) {
      dotCanvasRef.current.reset();
    }
  }, []);

  const handleRestartLevel = useCallback(() => {
    // Reset completion detection flag
    completionDetectedRef.current = false;
    // Reset game state but keep current level
    setGameStarted(false);
    setScore(0);
    setTime(0);
    setRemoveMode(false);
    setLives(3);
    setShowCompletionModal(false);
    setShowGameOverModal(false);
    resetKeyRef.current += 1;
    
    // Clear timer
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    // Reset canvas (will regenerate puzzle for current level)
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
    // Mark completion as detected
    completionDetectedRef.current = true;
    // Explicitly prevent game over modal from showing
    setShowGameOverModal(false);
    setShowCompletionModal(true);
    // Stop the timer
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, []);

  const handleNoMoves = useCallback(() => {
    // Check if completion was already detected - if so, don't show game over
    if (completionDetectedRef.current) {
      return; // Completion was detected, don't show game over
    }
    
    // Check if all snakes are cleared - if so, completion modal should show instead
    // Don't show game over if completion is already shown or should be shown
    if (showCompletionModal) {
      return; // Completion modal already showing, don't override
    }
    
    // Check if there are any snakes left - if not, completion should handle it
    if (dotCanvasRef.current && dotCanvasRef.current.getState) {
      const state = dotCanvasRef.current.getState();
      if (!state || (state.snakes && state.snakes.length === 0)) {
        // No snakes left - completion should handle this, not game over
        return;
      }
    }
    
    setShowGameOverModal(true);
    // Stop the timer
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  }, [showCompletionModal]);

  const handleSnakesChange = useCallback(() => {
    if (!isLoading) {
      const snakeState = dotCanvasRef.current && dotCanvasRef.current.getState 
        ? dotCanvasRef.current.getState() 
        : null;
      saveGameState(snakeState);
    }
  }, [isLoading, saveGameState]);

  const handleNext = useCallback(() => {
    // Reset completion detection flag
    completionDetectedRef.current = false;
    setShowCompletionModal(false);
    setShowGameOverModal(false);
    
    // Delay reset to allow modal to close first
    setTimeout(() => {
      // Increment level instead of resetting
      const newLevel = level + 1;
      setLevel(newLevel);
      setGameStarted(false);
      setScore(0);
      setTime(0);
      setRemoveMode(false);
      setLives(3);
      resetKeyRef.current += 1;
      
      // Clear timer
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }

      // Clear snake state from localStorage so new puzzle is generated for new level
      // But keep the new level number
      try {
        const state = {
          level: newLevel,
          score: 0,
          time: 0,
          lives: 3,
          gameStarted: false,
          snakeState: null // Clear snake state for new puzzle
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Error saving new level state:', error);
      }

      // Reset canvas for next level (will generate new puzzle)
      if (dotCanvasRef.current) {
        dotCanvasRef.current.reset();
      }
    }, 300); // Wait for modal close animation
  }, [level]);

  // Load state on mount
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setLevel(savedState.level);
      setScore(savedState.score);
      setTime(savedState.time);
      setLives(savedState.lives);
      setGameStarted(savedState.gameStarted);
      
      // Restore timer if game was started
      if (savedState.gameStarted && savedState.time > 0) {
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current);
        }
        timeIntervalRef.current = setInterval(() => {
          setTime(prev => prev + 1);
        }, 1000);
      }
    }
    
    // Store snake state to load after canvas is ready
    if (savedState && savedState.snakeState) {
      savedSnakeStateRef.current = savedState.snakeState;
    }
    
    setIsLoading(false);
  }, [loadGameState]);

  // Load snake state after canvas is ready
  useEffect(() => {
    if (!isLoading && savedSnakeStateRef.current && dotCanvasRef.current && dotCanvasRef.current.loadState) {
      const timeoutId = setTimeout(() => {
        if (dotCanvasRef.current && dotCanvasRef.current.loadState && savedSnakeStateRef.current) {
          dotCanvasRef.current.loadState(savedSnakeStateRef.current);
          savedSnakeStateRef.current = null; // Clear after loading
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  // Save state whenever it changes (debounced)
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        // Get snake state from canvas
        const snakeState = dotCanvasRef.current && dotCanvasRef.current.getState 
          ? dotCanvasRef.current.getState() 
          : null;
        saveGameState(snakeState);
      }, 500); // Debounce saves by 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [level, score, time, lives, gameStarted, isLoading, saveGameState]);

  // Save state before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const snakeState = dotCanvasRef.current && dotCanvasRef.current.getState 
        ? dotCanvasRef.current.getState() 
        : null;
      saveGameState(snakeState);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveGameState]);

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
      <header className="header">
        <div className="header-content">
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Level</span>
              <span className="stat-value">{level}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Time</span>
              <span className="stat-value">{formatTime(time)}</span>
            </div>
          </div>
        </div>
      </header>
      <main className="main-content">
        {!isLoading && (
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
            onNoMoves={handleNoMoves}
            onSnakesChange={handleSnakesChange}
            level={level}
            initialSnakeState={null}
          />
        )}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-stats">
            <button 
              className={`undo-btn ${!canUndo ? 'disabled' : ''}`}
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <span className="undo-label-top">UNDO</span>
              <span className="undo-label-bottom">
                <svg className="undo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6"/>
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                </svg>
              </span>
            </button>
            <button 
              className={`remove-snake-btn ${removeMode ? 'active' : ''} ${lives === 0 ? 'disabled' : ''}`}
              onClick={handleToggleRemoveMode}
              disabled={lives === 0}
            >
              <span className="remove-snake-label-top">REMOVE</span>
              <span className="remove-snake-label-bottom">{lives}</span>
            </button>
            <button className="restart-level-btn" onClick={handleRestartLevel}>
              <span className="restart-level-label-top">RESTART</span>
              <span className="restart-level-label-bottom">Level</span>
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
            <h2 className="modal-title">Level {level} Complete!</h2>
            <p className="modal-message">All snakes have been cleared.</p>
            <button className="modal-next-btn" onClick={handleNext}>
              Next Level
            </button>
          </div>
        </div>
      )}
      {showGameOverModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Game Over</h2>
            <p className="modal-message">No more moves are possible.</p>
            <button className="modal-next-btn" onClick={handleNewGame}>
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


