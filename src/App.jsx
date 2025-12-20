import { useState, useCallback, useRef, useEffect } from 'react';
import DotCanvas from './components/DotCanvas';
import './App.css';

// Color palettes - subtle, harmonic, easy on the eyes
const COLOR_PALETTES = [
  {
    name: 'Warm Earth',
    bgPrimary: '#9a8a76',
    bgSecondary: '#f5f0e8',
    bgTertiary: '#bbada0',
    textPrimary: '#776e65',
    textSecondary: '#f9f6f2',
    btnAccent: '#edc22e',
    btnAccentHover: '#f4d03f',
    snakeColor: '#c55a4a',
    dotFill: '#776e65',
    dotStroke: 'rgba(120, 110, 100, 0.3)'
  },
  {
    name: 'Cool Sage',
    bgPrimary: '#8a9a8a',
    bgSecondary: '#f0f5f2',
    bgTertiary: '#a8b8a8',
    textPrimary: '#5a6a5a',
    textSecondary: '#f0f5f2',
    btnAccent: '#8db88d',
    btnAccentHover: '#9dc89d',
    snakeColor: '#4a8a4a',
    dotFill: '#5a6a5a',
    dotStroke: 'rgba(90, 106, 90, 0.3)'
  },
  {
    name: 'Soft Lavender',
    bgPrimary: '#9a8a9a',
    bgSecondary: '#f5f0f5',
    bgTertiary: '#bbadb8',
    textPrimary: '#776775',
    textSecondary: '#f9f6f9',
    btnAccent: '#c8a8c8',
    btnAccentHover: '#d8b8d8',
    snakeColor: '#8a5a9a',
    dotFill: '#776775',
    dotStroke: 'rgba(119, 103, 117, 0.3)'
  },
  {
    name: 'Ocean Breeze',
    bgPrimary: '#7a8a9a',
    bgSecondary: '#f0f2f5',
    bgTertiary: '#a0b0c0',
    textPrimary: '#5a6a7a',
    textSecondary: '#f0f2f5',
    btnAccent: '#7aa8c8',
    btnAccentHover: '#8ab8d8',
    snakeColor: '#3a7aa8',
    dotFill: '#5a6a7a',
    dotStroke: 'rgba(90, 106, 122, 0.3)'
  },
  {
    name: 'Dusty Rose',
    bgPrimary: '#9a8a85',
    bgSecondary: '#f5f0ed',
    bgTertiary: '#bbada8',
    textPrimary: '#776765',
    textSecondary: '#f9f6f4',
    btnAccent: '#d8a8a8',
    btnAccentHover: '#e8b8b8',
    snakeColor: '#c85a5a',
    dotFill: '#776765',
    dotStroke: 'rgba(119, 103, 101, 0.3)'
  },
  {
    name: 'Forest Green',
    bgPrimary: '#7a8a7a',
    bgSecondary: '#f0f5f0',
    bgTertiary: '#a0b0a0',
    textPrimary: '#5a6a5a',
    textSecondary: '#f0f5f0',
    btnAccent: '#7ab87a',
    btnAccentHover: '#8ac88a',
    snakeColor: '#3a8a3a',
    dotFill: '#5a6a5a',
    dotStroke: 'rgba(90, 106, 90, 0.3)'
  },
  {
    name: 'Warm Sand',
    bgPrimary: '#a89a8a',
    bgSecondary: '#faf5f0',
    bgTertiary: '#c8b8a8',
    textPrimary: '#8a7a6a',
    textSecondary: '#faf5f0',
    btnAccent: '#e8c8a8',
    btnAccentHover: '#f8d8b8',
    snakeColor: '#c8783a',
    dotFill: '#8a7a6a',
    dotStroke: 'rgba(138, 122, 106, 0.3)'
  },
  {
    name: 'Muted Blue',
    bgPrimary: '#8a9aa8',
    bgSecondary: '#f0f2f5',
    bgTertiary: '#a8b8c8',
    textPrimary: '#6a7a8a',
    textSecondary: '#f0f2f5',
    btnAccent: '#a8c8e8',
    btnAccentHover: '#b8d8f8',
    snakeColor: '#7aa8c8',
    dotFill: '#6a7a8a',
    dotStroke: 'rgba(106, 122, 138, 0.3)'
  },
  {
    name: 'Earthy Brown',
    bgPrimary: '#8a7a6a',
    bgSecondary: '#f5f0ea',
    bgTertiary: '#a89888',
    textPrimary: '#6a5a4a',
    textSecondary: '#f5f0ea',
    btnAccent: '#c8a878',
    btnAccentHover: '#d8b888',
    snakeColor: '#b85a3a',
    dotFill: '#6a5a4a',
    dotStroke: 'rgba(106, 90, 74, 0.3)'
  },
  {
    name: 'Soft Gray',
    bgPrimary: '#8a8a8a',
    bgSecondary: '#f5f5f5',
    bgTertiary: '#b0b0b0',
    textPrimary: '#6a6a6a',
    textSecondary: '#f5f5f5',
    btnAccent: '#c8c8c8',
    btnAccentHover: '#d8d8d8',
    snakeColor: '#5a5a5a',
    dotFill: '#6a6a6a',
    dotStroke: 'rgba(106, 106, 106, 0.3)'
  }
];

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
  const [showNewGameConfirmModal, setShowNewGameConfirmModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState(0); // Default to Warm Earth
  const [darkMode, setDarkMode] = useState(false);
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

  const handleNewGameClick = useCallback(() => {
    // Show confirmation modal
    setShowNewGameConfirmModal(true);
  }, []);

  const handleNewGameConfirm = useCallback(() => {
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
    setShowNewGameConfirmModal(false);
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

  const handleNewGameCancel = useCallback(() => {
    setShowNewGameConfirmModal(false);
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

  // Apply color palette
  const applyPalette = useCallback((paletteIndex) => {
    const palette = COLOR_PALETTES[paletteIndex];
    if (!palette) return;
    
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', palette.bgPrimary);
    root.style.setProperty('--bg-secondary', palette.bgSecondary);
    root.style.setProperty('--bg-tertiary', palette.bgTertiary);
    root.style.setProperty('--text-primary', palette.textPrimary);
    root.style.setProperty('--text-secondary', palette.textSecondary);
    root.style.setProperty('--btn-accent', palette.btnAccent);
    root.style.setProperty('--btn-accent-hover', palette.btnAccentHover);
    root.style.setProperty('--game-snake-color', palette.snakeColor);
    root.style.setProperty('--game-dot-fill', palette.dotFill);
    root.style.setProperty('--game-dot-stroke', palette.dotStroke);
    
    // Force browser to recalculate CSS variables before reading them
    // Access offsetHeight to trigger a reflow and ensure CSS variables are updated
    root.offsetHeight; // Force reflow to ensure CSS variables are applied
    
    // Update existing snakes' colors after CSS variables are set
    // Use requestAnimationFrame to ensure CSS variables are fully updated
    requestAnimationFrame(() => {
      if (dotCanvasRef.current && dotCanvasRef.current.updateColors) {
        dotCanvasRef.current.updateColors();
      }
      
      // Force a redraw to update canvas background and dots
      if (dotCanvasRef.current && dotCanvasRef.current.forceRedraw) {
        dotCanvasRef.current.forceRedraw();
      }
    });
    
    // Save to localStorage
    localStorage.setItem('arrws-color-palette', paletteIndex.toString());
  }, []);

  const handlePaletteSelect = useCallback((index) => {
    setSelectedPalette(index);
    applyPalette(index);
    // Keep settings menu open after selecting palette
  }, [applyPalette]);

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

  // Toggle dark/light mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('arrws-dark-mode', newMode.toString());
      applyDarkMode(newMode);
      
      // Force canvas to redraw with new dark mode colors
      requestAnimationFrame(() => {
        if (dotCanvasRef.current && dotCanvasRef.current.forceRedraw) {
          dotCanvasRef.current.forceRedraw();
        }
      });
      
      return newMode;
    });
  }, []);

  // Apply dark/light mode
  const applyDarkMode = useCallback((isDark) => {
    const root = document.documentElement;
    const canvas = document.querySelector('.canvas');
    
    if (isDark) {
      root.classList.add('dark-mode');
      if (canvas) {
        canvas.classList.add('dark-mode');
      }
    } else {
      root.classList.remove('dark-mode');
      if (canvas) {
        canvas.classList.remove('dark-mode');
      }
    }
    
    // Force a reflow to ensure styles are applied
    if (canvas) {
      canvas.offsetHeight;
    }
  }, []);

  // Load dark mode preference on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('arrws-dark-mode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      applyDarkMode(true);
      // Force canvas redraw after dark mode is applied
      setTimeout(() => {
        if (dotCanvasRef.current && dotCanvasRef.current.forceRedraw) {
          dotCanvasRef.current.forceRedraw();
        }
      }, 100);
    }
  }, [applyDarkMode]);

  // Load color palette on mount
  useEffect(() => {
    const savedPalette = localStorage.getItem('arrws-color-palette');
    if (savedPalette) {
      const paletteIndex = parseInt(savedPalette, 10);
      if (paletteIndex >= 0 && paletteIndex < COLOR_PALETTES.length) {
        setSelectedPalette(paletteIndex);
        applyPalette(paletteIndex);
      }
    } else {
      applyPalette(0); // Apply default palette (Warm Earth)
      setSelectedPalette(0);
    }
  }, [applyPalette]);

  // Close settings menu when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest('.settings-toggle-btn') && !target.closest('.settings-menu')) {
        setShowSettings(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSettings]);

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
          <button 
            className="settings-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            aria-label="Settings"
          >
            <svg className="settings-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {showSettings && (
          <div className="settings-menu">
            <div className="settings-section">
              <div className="settings-label">Theme</div>
              <button 
                className="settings-option"
                onClick={() => {
                  toggleDarkMode();
                }}
              >
                <div className="settings-option-content">
                  {darkMode ? (
                    <svg className="settings-option-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg className="settings-option-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
              </button>
            </div>
            <div className="settings-section">
              <div className="settings-label">Color Palette</div>
              <div className="palette-grid">
                {COLOR_PALETTES.map((palette, index) => (
                  <button
                    key={index}
                    className={`palette-option ${selectedPalette === index ? 'active' : ''}`}
                    onClick={() => handlePaletteSelect(index)}
                    title={palette.name}
                  >
                    <div className="palette-preview">
                      <div className="palette-color" style={{ backgroundColor: palette.bgPrimary }}></div>
                      <div className="palette-color" style={{ backgroundColor: palette.bgSecondary }}></div>
                      <div className="palette-color" style={{ backgroundColor: palette.bgTertiary }}></div>
                      <div className="palette-color" style={{ backgroundColor: palette.snakeColor }}></div>
                    </div>
                    <span className="palette-name">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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
              <svg className="undo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 14l-5-5 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M4 9h11a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <span className="undo-label-bottom"></span>
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
            <button className="new-game-btn" onClick={handleNewGameClick}>
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
            <button className="modal-next-btn" onClick={handleNewGameClick}>
              New Game
            </button>
          </div>
        </div>
      )}
      {showNewGameConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Start New Game?</h2>
            <p className="modal-message"><strong>All your progress will be lost and you'll start back at level 1.</strong></p>
            <div className="modal-buttons">
              <button className="modal-cancel-btn" onClick={handleNewGameCancel}>
                Cancel
              </button>
              <button className="modal-confirm-btn" onClick={handleNewGameConfirm}>
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;


