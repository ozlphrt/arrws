import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { Snake, generateRandomSnake, isPuzzleSolvable } from '../utils/snake';

const ROWS = 36;
const COLS = 18;

const DotCanvas = forwardRef(function DotCanvas({ onTap, tapPosition, onScoreUpdate, onGameStart, removeMode = false, onSnakeRemoved, onUndoStateChange, onAllSnakesCleared, level = 1 }, ref) {
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const animationIntervalsRef = useRef(new Map()); // Map of snake index to interval ID
  const animationStatesRef = useRef(new Map()); // Map of snake index to { startPos, endPos, startTime, duration }
  const [snakes, setSnakes] = useState([]);
  const snakesRef = useRef([]); // Keep ref in sync for accurate detection
  const gridMapRef = useRef(new Map()); // Maps {row, col} to {x, y}
  const [progress, setProgress] = useState(null); // { phase, progress, message }
  const initialSnakeCountRef = useRef(0); // Track initial snake count for score calculation
  const gameStartCalledRef = useRef(false); // Track if onGameStart has been called
  const historyRef = useRef([]); // History of snake states for undo
  const completionModalShownRef = useRef(false); // Track if completion modal has been shown
  const firstMovementPendingRef = useRef(false); // Track if first movement needs to trigger timer
  const [firstMovementTriggered, setFirstMovementTriggered] = useState(false); // Track first movement for timer start
  
  // Refs to queue parent callbacks to avoid calling during render
  const pendingScoreUpdateRef = useRef(null);
  const pendingSnakeRemovedRef = useRef(false);
  const pendingUndoStateChangeRef = useRef(null);
  
  // Helper to save current state to history
  const saveStateToHistory = useCallback((snakesList) => {
    const snapshot = snakesList.map(snake => ({
      gridPositions: snake.gridPositions.map(pos => ({ ...pos })),
      direction: snake.direction,
      color: snake.color
    }));
    historyRef.current.push(snapshot);
    // Limit history to last 50 moves
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    }
    // Notify parent about undo availability (queue for after render)
    if (onUndoStateChange) {
      pendingUndoStateChangeRef.current = historyRef.current.length > 0;
    }
  }, [onUndoStateChange]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    const containerRect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Let CSS control the size (respects aspect-ratio: 1/2 for portrait)
    const computedStyle = window.getComputedStyle(canvas);
    const displayWidth = parseFloat(computedStyle.width) || containerRect.width;
    const displayHeight = parseFloat(computedStyle.height) || containerRect.height;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Create dots array
    const padding = 20;
    const availableWidth = displayWidth - (padding * 2);
    const availableHeight = displayHeight - (padding * 2);

    const dotSpacingX = availableWidth / (COLS - 1);
    const dotSpacingY = availableHeight / (ROWS - 1);
    const minSpacing = Math.min(dotSpacingX, dotSpacingY);
    const dotRadius = Math.max(2, Math.min(8, minSpacing * 0.15));

    dotsRef.current = [];
    gridMapRef.current.clear();
    
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = padding + (col * dotSpacingX);
        const y = padding + (row * dotSpacingY);
        dotsRef.current.push({ x, y, radius: dotRadius, row, col });
        gridMapRef.current.set(`${row},${col}`, { x, y });
      }
    }
  }, []);

  const gridToCanvas = useCallback((row, col) => {
    const key = `${row},${col}`;
    const cached = gridMapRef.current.get(key);
    if (cached) {
      return cached;
    }
    
    // Calculate position for off-screen coordinates based on dot spacing
    // Get spacing from first few dots if available
    if (dotsRef.current.length >= 2) {
      const dot0 = dotsRef.current[0];
      const dot1 = dotsRef.current[1];
      const dotSpacingX = Math.abs(dot1.x - dot0.x);
      
      // Find vertical spacing
      let dotSpacingY = dotSpacingX;
      for (let i = 0; i < dotsRef.current.length - COLS; i++) {
        const dotA = dotsRef.current[i];
        const dotB = dotsRef.current[i + COLS];
        if (dotA.col === dotB.col) {
          dotSpacingY = Math.abs(dotB.y - dotA.y);
          break;
        }
      }
      
      // Get origin from first dot
      const originDot = dotsRef.current[0];
      const originRow = originDot.row;
      const originCol = originDot.col;
      
      // Calculate offset from origin
      const colDiff = col - originCol;
      const rowDiff = row - originRow;
      
      const x = originDot.x + (colDiff * dotSpacingX);
      const y = originDot.y + (rowDiff * dotSpacingY);
      
      return { x, y };
    }
    
    return { x: 0, y: 0 };
  }, []);

  // Easing function: ease-out for smoother, more natural deceleration
  const easeOutCubic = useCallback((t) => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  const drawSnake = useCallback((ctx, snake, snakeIndex) => {
    if (snake.gridPositions.length === 0) return;

    // Get interpolated positions for smooth animation
    const animationState = animationStatesRef.current.get(snakeIndex);
    let snakeBody;
    
    if (animationState && animationState.startTime) {
      const now = Date.now();
      const elapsed = now - animationState.startTime;
      const progress = Math.min(elapsed / animationState.duration, 1);
      
      if (progress >= 1) {
        // Animation complete, clean up and use final position
        animationStatesRef.current.delete(snakeIndex);
        snakeBody = snake.gridPositions.map(pos => gridToCanvas(pos.row, pos.col));
      } else {
        // Use ease-out for smoother, more natural movement
        const easedProgress = easeOutCubic(progress);
        
        // Interpolate head position
        const startHead = gridToCanvas(animationState.startPos.row, animationState.startPos.col);
        const endHead = gridToCanvas(animationState.endPos.row, animationState.endPos.col);
        const currentHead = {
          x: startHead.x + (endHead.x - startHead.x) * easedProgress,
          y: startHead.y + (endHead.y - startHead.y) * easedProgress
        };
        
        // Get body positions (these don't interpolate, just use current grid positions)
        const bodyPositions = snake.gridPositions.slice(1).map(pos => gridToCanvas(pos.row, pos.col));
        snakeBody = [currentHead, ...bodyPositions];
      }
    } else {
      // No animation in progress, use grid positions directly
      snakeBody = snake.gridPositions.map(pos => gridToCanvas(pos.row, pos.col));
    }
    
    // Draw snake body
    const snakeColor = snake.color;
    const lineWidth = 8;
    
    ctx.strokeStyle = snakeColor;
    ctx.fillStyle = snakeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (snakeBody.length === 1) {
      // Single dot
      const pos = snakeBody[0];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw path
      ctx.beginPath();
      ctx.moveTo(snakeBody[0].x, snakeBody[0].y);
      for (let i = 1; i < snakeBody.length; i++) {
        ctx.lineTo(snakeBody[i].x, snakeBody[i].y);
      }
      ctx.stroke();

      // Draw body segments
      snakeBody.forEach((pos, index) => {
        if (index === 0) return; // Skip head, draw arrow separately
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw arrow head
    const headPos = snakeBody[0];
    const direction = snake.getHeadDirection();
    const arrowSize = 18;

    ctx.save();
    ctx.translate(headPos.x, headPos.y);
    // Arrow is drawn pointing up, so add Math.PI/2 to make angle 0 point right
    ctx.rotate(direction.angle + Math.PI / 2);
    
    ctx.beginPath();
    ctx.moveTo(0, -arrowSize / 2);
    ctx.lineTo(-arrowSize / 2, arrowSize / 2);
    ctx.lineTo(arrowSize / 2, arrowSize / 2);
    ctx.closePath();
    ctx.fillStyle = snake.color;
    ctx.fill();
    
    ctx.restore();
  }, [gridToCanvas, easeOutCubic]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Draw dots even if empty to show canvas
    if (dotsRef.current.length === 0) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.width / dpr;
      const displayHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      return;
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw dots
    dotsRef.current.forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#776e65';
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 110, 100, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Draw snakes
    snakes.forEach((snake, index) => {
      drawSnake(ctx, snake, index);
    });
  }, [snakes, drawSnake]);

  // Hover state changes are handled by the animation loop

  // Calculate distance from point to line segment (returns distance and if point is on segment)
  const distanceToLineSegment = useCallback((px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Segment is a point
      const dx = px - x1;
      const dy = py - y1;
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    const param = Math.max(0, Math.min(1, dot / lenSq));
    const xx = x1 + param * C;
    const yy = y1 + param * D;

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const findSnakeAtPosition = useCallback((x, y, snakesList) => {
    // More forgiving detection for easier selection
    const headRadius = 24; // Arrow head detection radius (increased from 12)
    const lineHitMargin = 12; // Line segment detection (increased from 5)
    let bestSnake = null;
    let bestDistance = Infinity;
    
    for (let i = 0; i < snakesList.length; i++) {
      const snake = snakesList[i];
      if (snake.gridPositions.length === 0) continue;
      
      const snakePath = snake.gridPositions.map(pos => gridToCanvas(pos.row, pos.col));
      
      // Check head first (highest priority)
      if (snakePath.length > 0) {
        const head = snakePath[0];
        const dx = head.x - x;
        const dy = head.y - y;
        const headDist = Math.sqrt(dx * dx + dy * dy);
        
        if (headDist <= headRadius && headDist < bestDistance) {
          bestDistance = headDist;
          bestSnake = i;
        }
      }
      
      // Check line segments if head not close
      if (bestDistance > headRadius) {
        for (let j = 0; j < snakePath.length - 1; j++) {
          const p1 = snakePath[j];
          const p2 = snakePath[j + 1];
          const dist = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
          
          if (dist <= lineHitMargin && dist < bestDistance) {
            bestDistance = dist;
            bestSnake = i;
          }
        }
      }
      
      // Also check body segments (dots) for easier selection
      if (bestDistance > headRadius) {
        for (let j = 1; j < snakePath.length; j++) {
          const segment = snakePath[j];
          const dx = segment.x - x;
          const dy = segment.y - y;
          const segmentDist = Math.sqrt(dx * dx + dy * dy);
          
          if (segmentDist <= lineHitMargin && segmentDist < bestDistance) {
            bestDistance = segmentDist;
            bestSnake = i;
          }
        }
      }
    }
    
    return bestSnake;
  }, [gridToCanvas, distanceToLineSegment]);

  const startSnakeMovement = useCallback((snakeIndex) => {
    // Check if this snake is already moving
    // Note: Multiple snakes can move simultaneously - each has its own interval
    if (animationIntervalsRef.current.has(snakeIndex)) {
      return; // Already moving, don't start again
    }
    
    // Start continuous movement for this specific snake
    // Each snake gets its own independent interval, allowing multiple snakes to move at once
    // Use faster interval (80ms instead of 150ms) for smoother movement
    const intervalId = setInterval(() => {
      setSnakes(prevSnakes => {
        // Check if snake still exists and is valid
        if (snakeIndex >= prevSnakes.length || !prevSnakes[snakeIndex]) {
          // Snake was removed, clean up interval
          const interval = animationIntervalsRef.current.get(snakeIndex);
          if (interval) {
            clearInterval(interval);
            animationIntervalsRef.current.delete(snakeIndex);
          }
          animationStatesRef.current.delete(snakeIndex);
          return prevSnakes;
        }
        
        const activeSnake = prevSnakes[snakeIndex];
        
        // Store start position for animation
        const startHead = activeSnake.getHead();
        
        // Create snake copy for movement
        const snakeCopy = new Snake([...activeSnake.gridPositions], activeSnake.color);
        snakeCopy.direction = activeSnake.direction; // Preserve direction
        
        // Try to move - create copies of all snakes with preserved directions
        const allSnakesCopy = prevSnakes.map((s, idx) => {
          if (idx === snakeIndex) return snakeCopy;
          const sCopy = new Snake([...s.gridPositions], s.color);
          sCopy.direction = s.direction; // Preserve direction for other snakes too
          return sCopy;
        });
        
        // Check for head-to-head collision first
        const headToHeadSnake = snakeCopy.checkHeadToHeadCollision(allSnakesCopy, ROWS, COLS);
        if (headToHeadSnake) {
          // Head-to-head collision detected
          // Find the other snake's index to check if it's also moving
          const otherSnakeIndex = prevSnakes.findIndex((s, idx) => 
            idx !== snakeIndex && s && headToHeadSnake && 
            s.getHead().row === headToHeadSnake.getHead().row &&
            s.getHead().col === headToHeadSnake.getHead().col
          );
          const otherSnakeIsMoving = otherSnakeIndex !== -1 && 
            animationIntervalsRef.current.has(otherSnakeIndex);
          
          let directionChanged;
          // Use snake index to deterministically decide turn direction to avoid deadlock
          // Lower index turns clockwise, higher index turns counter-clockwise
          if (otherSnakeIsMoving && snakeIndex < otherSnakeIndex) {
            // This snake has lower index - turn clockwise
            directionChanged = snakeCopy.changeDirectionClockwise(ROWS, COLS, allSnakesCopy);
          } else if (otherSnakeIsMoving && snakeIndex > otherSnakeIndex) {
            // This snake has higher index - turn counter-clockwise to break deadlock
            directionChanged = snakeCopy.tryCounterClockwiseOrOther(ROWS, COLS, allSnakesCopy, snakeCopy.direction, snakeCopy.getHead());
          } else {
            // Only this snake is moving, or other snake is not moving - turn clockwise
            directionChanged = snakeCopy.changeDirectionClockwise(ROWS, COLS, allSnakesCopy);
          }
          
          if (directionChanged) {
            // Direction changed successfully, continue with movement
            const moved = snakeCopy.move(ROWS, COLS, allSnakesCopy);
            if (moved) {
              // Mark first movement to trigger timer start
              if (!gameStartCalledRef.current) {
                gameStartCalledRef.current = true;
                firstMovementPendingRef.current = true;
              }
              
              const endHead = snakeCopy.getHead();
              // Start animation
              animationStatesRef.current.set(snakeIndex, {
                startPos: startHead,
                endPos: endHead,
                startTime: Date.now(),
                duration: 30 // Match interval duration for smooth transition
              });
              const updatedSnakes = [...prevSnakes];
              updatedSnakes[snakeIndex] = snakeCopy;
              snakesRef.current = updatedSnakes;
              return updatedSnakes;
            }
          }
          // If direction change failed or move failed, fall through to collision handling
        }
        
        // Check for other collisions (only check on-screen positions)
        if (snakeCopy.hasCollided(allSnakesCopy, ROWS, COLS)) {
          // Snake collided - vibrate, remove it and clean up interval
          if ('vibrate' in navigator) {
            navigator.vibrate(200); // Vibrate for 200ms
          }
          const interval = animationIntervalsRef.current.get(snakeIndex);
          if (interval) {
            clearInterval(interval);
            animationIntervalsRef.current.delete(snakeIndex);
          }
          animationStatesRef.current.delete(snakeIndex);
          
          // Remove the snake and update score
          const updated = prevSnakes.filter((_, idx) => idx !== snakeIndex);
          if (onScoreUpdate && initialSnakeCountRef.current > 0) {
            const removed = initialSnakeCountRef.current - updated.length;
            pendingScoreUpdateRef.current = removed; // Queue for after render
          }
          return updated;
        }
        
        const moved = snakeCopy.move(ROWS, COLS, allSnakesCopy);
        
        if (moved) {
          // Mark first movement to trigger timer start
          if (!gameStartCalledRef.current) {
            gameStartCalledRef.current = true;
            firstMovementPendingRef.current = true;
          }
          
          const endHead = snakeCopy.getHead();
          // Start animation
          animationStatesRef.current.set(snakeIndex, {
            startPos: startHead,
            endPos: endHead,
            startTime: Date.now(),
            duration: 30 // Match interval duration for smooth transition
          });
        }
        
        // Check if completely off-screen after move
        if (snakeCopy.isCompletelyOffScreen(ROWS, COLS)) {
          // Snake is completely off-screen - remove it and clean up interval
          const interval = animationIntervalsRef.current.get(snakeIndex);
          if (interval) {
            clearInterval(interval);
            animationIntervalsRef.current.delete(snakeIndex);
          }
          animationStatesRef.current.delete(snakeIndex);
          
          // Remove the snake and update score
          const updated = prevSnakes.filter((_, idx) => idx !== snakeIndex);
          if (onScoreUpdate && initialSnakeCountRef.current > 0) {
            const removed = initialSnakeCountRef.current - updated.length;
            pendingScoreUpdateRef.current = removed; // Queue for after render
          }
          return updated;
        }
        
        if (!moved) {
          // Can't move for some reason - vibrate and stop this snake's movement
          if ('vibrate' in navigator) {
            navigator.vibrate(200); // Vibrate for 200ms
          }
          const interval = animationIntervalsRef.current.get(snakeIndex);
          if (interval) {
            clearInterval(interval);
            animationIntervalsRef.current.delete(snakeIndex);
          }
          animationStatesRef.current.delete(snakeIndex);
          return prevSnakes;
        }
        
        // Update the snake
        const updatedSnakes = [...prevSnakes];
        updatedSnakes[snakeIndex] = snakeCopy;
        snakesRef.current = updatedSnakes; // Keep ref in sync
        return updatedSnakes;
      });
    }, 30); // Move every 30ms for faster, smoother movement
    
    // Store the interval ID for this snake
    animationIntervalsRef.current.set(snakeIndex, intervalId);
  }, []);

  // Handle mouse/touch hover and interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasCoordinates = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const getSnakeAtPosition = (x, y) => {
      // Use ref to get current snakes for accurate detection
      return findSnakeAtPosition(x, y, snakesRef.current);
    };

    const handleClick = (clientX, clientY) => {
      // Detect which snake was clicked
      const { x, y } = getCanvasCoordinates(clientX, clientY);
      const snakeIndex = getSnakeAtPosition(x, y);
      
      if (snakeIndex !== null) {
        // If in remove mode, remove the snake instead of moving it
        if (removeMode) {
          setSnakes(prevSnakes => {
            if (snakeIndex < prevSnakes.length) {
              // Save state before removal
              saveStateToHistory(prevSnakes);
              
              // Clean up animation intervals
              const interval = animationIntervalsRef.current.get(snakeIndex);
              if (interval) {
                clearInterval(interval);
                animationIntervalsRef.current.delete(snakeIndex);
              }
              animationStatesRef.current.delete(snakeIndex);
              
              // Remove the snake
              const updated = prevSnakes.filter((_, idx) => idx !== snakeIndex);
              snakesRef.current = updated;
              
              // Notify parent that a snake was removed (queue for after render)
              if (onSnakeRemoved) {
                pendingSnakeRemovedRef.current = true;
              }
              
              // Vibrate for feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(100);
              }
              
              return updated;
            }
            return prevSnakes;
          });
          return; // Don't proceed with normal click handling
        }
        
        // Normal mode: start snake movement
        // Save state before starting movement
        setSnakes(prevSnakes => {
          if (snakeIndex < prevSnakes.length) {
            // Only save if snake is not already moving
            if (!animationIntervalsRef.current.has(snakeIndex)) {
              saveStateToHistory(prevSnakes);
            }
            
            setTimeout(() => {
              startSnakeMovement(snakeIndex);
            }, 0);
          }
          return prevSnakes;
        });
      }

      if (onTap) {
        const { x, y } = getCanvasCoordinates(clientX, clientY);
        onTap(x, y);
      }
    };

    const handleTouch = (e) => {
      e.preventDefault();
      const touch = e.touches[0] || e.changedTouches[0];
      const clientX = touch.clientX;
      const clientY = touch.clientY;

      // Handle tap
      handleClick(clientX, clientY);
    };

    const handleMouseClick = (e) => {
      handleClick(e.clientX, e.clientY);
    };

    canvas.addEventListener('click', handleMouseClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });

    return () => {
      canvas.removeEventListener('click', handleMouseClick);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [findSnakeAtPosition, startSnakeMovement, onTap, removeMode, onSnakeRemoved, saveStateToHistory]);

  // Keep snakesRef in sync with snakes state
  useEffect(() => {
    snakesRef.current = snakes;
  }, [snakes]);

  // Detect when all snakes are cleared
  useEffect(() => {
    // Only trigger if game has started and all snakes are cleared, and modal hasn't been shown yet
    if (gameStartCalledRef.current && snakes.length === 0 && initialSnakeCountRef.current > 0 && !completionModalShownRef.current && onAllSnakesCleared) {
      completionModalShownRef.current = true;
      // Clear progress to prevent "Initializing..." from showing
      setProgress(null);
      // Small delay to ensure state is settled
      const timeoutId = setTimeout(() => {
        onAllSnakesCleared();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [snakes.length, onAllSnakesCleared]);

  // Track previous snakes length for other purposes
  const prevSnakesLengthRef = useRef(0);
  useEffect(() => {
    prevSnakesLengthRef.current = snakes.length;
  }, [snakes.length]);

  // Check for pending first movement and trigger state update (runs after render)
  useEffect(() => {
    if (firstMovementPendingRef.current && !firstMovementTriggered) {
      firstMovementPendingRef.current = false;
      setFirstMovementTriggered(true);
    }
  });

  // Process queued parent callbacks after render to avoid render warnings
  useEffect(() => {
    // Handle score update
    if (pendingScoreUpdateRef.current !== null && onScoreUpdate) {
      const score = pendingScoreUpdateRef.current;
      pendingScoreUpdateRef.current = null;
      setTimeout(() => {
        onScoreUpdate(score);
      }, 0);
    }
    
    // Handle snake removed
    if (pendingSnakeRemovedRef.current && onSnakeRemoved) {
      pendingSnakeRemovedRef.current = false;
      setTimeout(() => {
        onSnakeRemoved();
      }, 0);
    }
    
    // Handle undo state change
    if (pendingUndoStateChangeRef.current !== null && onUndoStateChange) {
      const canUndo = pendingUndoStateChangeRef.current;
      pendingUndoStateChangeRef.current = null;
      setTimeout(() => {
        onUndoStateChange(canUndo);
      }, 0);
    }
  });

  // Start timer on first movement (defer to avoid render warning)
  useEffect(() => {
    if (firstMovementTriggered && onGameStart) {
      // Use setTimeout to ensure this runs after the current render cycle
      const timeoutId = setTimeout(() => {
        onGameStart();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [firstMovementTriggered, onGameStart]);

  useEffect(() => {
    resizeCanvas();
    
    // Initialize snakes after canvas is ready
    // Use a small delay to ensure canvas is rendered
    let initTimer;
    
    // Show progress immediately if no snakes
    // But don't generate if completion modal is shown or if we just completed a level
    if (snakes.length === 0 && !completionModalShownRef.current && initialSnakeCountRef.current === 0) {
      console.log('Setting initial progress');
      setProgress({ phase: 'generating', progress: 0, message: 'Initializing...' });
      
      initTimer = setTimeout(() => {
        console.log('Starting puzzle generation');
        const generateValidPuzzle = async () => {
          try {
            setProgress({ phase: 'generating', progress: 0, message: 'Generating puzzle...' });
          
          // Yield to browser to allow initial render
          await new Promise(resolve => setTimeout(resolve, 0));
          
          // Calculate difficulty parameters based on level
          // Snake length distribution: Early (3-15), Mid (5-25), Late (10-40)
          let minLength, maxLength;
          if (level <= 5) {
            minLength = 3;
            maxLength = 15;
          } else if (level <= 15) {
            minLength = 5;
            maxLength = 25;
          } else {
            minLength = 10;
            maxLength = 40;
          }
          
          // Grid density: Early (70-80%), Mid (80-85%), Late (85-90%)
          let targetCoverage;
          if (level <= 5) {
            targetCoverage = 0.70 + (level - 1) * 0.02; // 70% to 78%
          } else if (level <= 15) {
            targetCoverage = 0.80 + ((level - 5) / 10) * 0.05; // 80% to 85%
          } else {
            targetCoverage = 0.85 + ((level - 15) / 10) * 0.05; // 85% to 90% (capped)
          }
          targetCoverage = Math.min(0.90, targetCoverage);
          
          const maxPuzzleAttempts = 10; // Try up to 10 times to generate a solvable puzzle
          
          for (let puzzleAttempt = 0; puzzleAttempt < maxPuzzleAttempts; puzzleAttempt++) {
          // Report generation attempt progress
          const attemptProgress = Math.floor((puzzleAttempt / maxPuzzleAttempts) * 30);
          setProgress({ 
            phase: 'generating', 
            progress: attemptProgress, 
            message: `Generating puzzle... (attempt ${puzzleAttempt + 1}/${maxPuzzleAttempts})` 
          });
          
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const occupiedPositions = new Set();
          const newSnakes = [];
          const totalDots = ROWS * COLS;
          let attempts = 0;
          const maxAttempts = 1000; // Limit attempts to avoid infinite loops
          let snakesPlaced = 0;
          
          // Keep generating snakes until we fill most of the grid or can't place more
          while (attempts < maxAttempts) {
            const snake = generateRandomSnake(ROWS, COLS, minLength, maxLength, occupiedPositions, newSnakes);
            if (snake) {
              newSnakes.push(snake);
              snakesPlaced++;
              // Mark all positions as occupied
              snake.getOccupiedPositions().forEach(pos => occupiedPositions.add(pos));
              
              // Report progress during generation
              const coverage = occupiedPositions.size / totalDots;
              const coveragePercent = Math.round(coverage * 100);
              const targetPercent = Math.round(targetCoverage * 100);
              const genProgress = attemptProgress + Math.floor((coverage / targetCoverage) * 10);
              
              // Calculate better estimate: use actual average length of placed snakes
              let estimatedTargetSnakes = snakesPlaced;
              if (snakesPlaced > 0) {
                const totalLength = newSnakes.reduce((sum, s) => sum + s.gridPositions.length, 0);
                const avgLength = totalLength / snakesPlaced;
                const remainingCoverage = targetCoverage - coverage;
                if (remainingCoverage > 0 && avgLength > 0) {
                  const remainingDots = remainingCoverage * totalDots;
                  const estimatedRemaining = Math.ceil(remainingDots / avgLength);
                  estimatedTargetSnakes = snakesPlaced + estimatedRemaining;
                } else {
                  // We're at or past target, estimate is current count
                  estimatedTargetSnakes = snakesPlaced;
                }
              } else {
                // Initial estimate based on target coverage and average expected length
                const avgLength = (minLength + maxLength) / 2;
                estimatedTargetSnakes = Math.ceil((targetCoverage * totalDots) / avgLength);
              }
              
              // Update progress periodically
              if (snakesPlaced % 2 === 0 || snakesPlaced === 1) {
                setProgress({ 
                  phase: 'generating', 
                  progress: Math.min(90, genProgress), 
                  message: `Placing snakes... (${snakesPlaced}${coveragePercent < targetPercent ? ` of ~${estimatedTargetSnakes}` : ''})` 
                });
                // Yield to browser for smoother UI
                await new Promise(resolve => setTimeout(resolve, 10));
              }
              
              // If we've reached target coverage, we're good
              if (coverage >= targetCoverage) {
                break;
              }
            } else {
              attempts++;
              // If we fail to place a snake 50 times in a row, likely grid is full
              if (attempts % 50 === 0 && attempts > 50) {
                break;
              }
            }
          }
          
          // No validation needed - reverse generation guarantees solvability!
          if (newSnakes.length > 0) {
            setProgress({ 
              phase: 'complete', 
              progress: 100, 
              message: `Puzzle ready! (${newSnakes.length} snakes)` 
            });
            setTimeout(() => {
              setSnakes(newSnakes);
              snakesRef.current = newSnakes;
              initialSnakeCountRef.current = newSnakes.length;
              setProgress(null);
            }, 500);
            return; // Success - puzzle is guaranteed solvable
          }
          }
          
          // If we couldn't generate a solvable puzzle after max attempts,
          // still set the snakes (fallback - should be rare)
          setProgress({ phase: 'generating', progress: 0, message: 'Final attempt...' });
          const occupiedPositions = new Set();
          const newSnakes = [];
          const totalDots = ROWS * COLS;
          let attempts = 0;
          const maxAttempts = 1000;
          
          while (attempts < maxAttempts) {
            const snake = generateRandomSnake(ROWS, COLS, minLength, maxLength, occupiedPositions, newSnakes);
            if (snake) {
              newSnakes.push(snake);
              snake.getOccupiedPositions().forEach(pos => occupiedPositions.add(pos));
              const coverage = occupiedPositions.size / totalDots;
              if (coverage >= targetCoverage) {
                break;
              }
            } else {
              attempts++;
              if (attempts % 50 === 0 && attempts > 50) {
                break;
              }
            }
          }
          
          setProgress({ 
            phase: 'complete', 
            progress: 100, 
            message: `Puzzle ready! (${newSnakes.length} snakes)` 
          });
          setTimeout(() => {
            setSnakes(newSnakes);
            snakesRef.current = newSnakes;
            initialSnakeCountRef.current = newSnakes.length;
            historyRef.current = []; // Clear history on new puzzle
            if (onUndoStateChange) {
              pendingUndoStateChangeRef.current = false;
            }
            setProgress(null);
          }, 500);
        } catch (error) {
          console.error('Error generating puzzle:', error);
          setProgress({ phase: 'error', progress: 0, message: 'Error generating puzzle. Please refresh.' });
          // Fallback: generate without validation
          const occupiedPositions = new Set();
          const newSnakes = [];
          const totalDots = ROWS * COLS;
          let attempts = 0;
          const maxAttempts = 1000;
          
          // Use same difficulty parameters for fallback
          let minLength, maxLength, targetCoverage;
          if (level <= 5) {
            minLength = 3;
            maxLength = 15;
            targetCoverage = 0.70 + (level - 1) * 0.02;
          } else if (level <= 15) {
            minLength = 5;
            maxLength = 25;
            targetCoverage = 0.80 + ((level - 5) / 10) * 0.05;
          } else {
            minLength = 10;
            maxLength = 40;
            targetCoverage = 0.85 + ((level - 15) / 10) * 0.05;
          }
          targetCoverage = Math.min(0.90, targetCoverage);
          
          while (attempts < maxAttempts) {
            const snake = generateRandomSnake(ROWS, COLS, minLength, maxLength, occupiedPositions, newSnakes);
            if (snake) {
              newSnakes.push(snake);
              snake.getOccupiedPositions().forEach(pos => occupiedPositions.add(pos));
              const coverage = occupiedPositions.size / totalDots;
              if (coverage >= targetCoverage) {
                break;
              }
            } else {
              attempts++;
              if (attempts % 50 === 0 && attempts > 50) {
                break;
              }
            }
          }
          
          setSnakes(newSnakes);
          snakesRef.current = newSnakes;
          initialSnakeCountRef.current = newSnakes.length;
          setProgress(null);
        }
        };
        
        generateValidPuzzle();
      }, 100); // Small delay to ensure canvas is ready
    }

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        resizeCanvas();
      }, 200);
    });

    return () => {
      if (initTimer) {
        clearTimeout(initTimer);
      }
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clean up all intervals
      animationIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      animationIntervalsRef.current.clear();
    };
  }, [resizeCanvas, snakes.length, level]);

  // Animation loop for smooth rendering
  useEffect(() => {
    let animationId;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [draw, snakes]);

  // Drawing is handled by the animation loop

  // Expose reset and undo methods via ref
  useImperativeHandle(ref, () => ({
    reset: () => {
      // Clear all intervals
      animationIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      animationIntervalsRef.current.clear();
      animationStatesRef.current.clear();
      
      // Reset snakes and score tracking
      setSnakes([]);
      snakesRef.current = [];
      initialSnakeCountRef.current = 0;
      gameStartCalledRef.current = false; // Reset game start flag
      completionModalShownRef.current = false; // Reset completion modal flag
      firstMovementPendingRef.current = false; // Reset pending flag
      setFirstMovementTriggered(false); // Reset first movement flag
      historyRef.current = []; // Clear history
      setProgress({ phase: 'generating', progress: 0, message: 'Initializing...' });
      if (onUndoStateChange) {
        pendingUndoStateChangeRef.current = false;
      }
    },
    undo: () => {
      if (historyRef.current.length === 0) {
        return false; // No history to undo
      }
      
      // Stop all moving snakes
      animationIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      animationIntervalsRef.current.clear();
      animationStatesRef.current.clear();
      
      // Restore previous state
      const previousState = historyRef.current.pop();
      const restoredSnakes = previousState.map(snapshot => {
        const snake = new Snake(snapshot.gridPositions, snapshot.color);
        snake.direction = snapshot.direction;
        return snake;
      });
      
      setSnakes(restoredSnakes);
      snakesRef.current = restoredSnakes;
      
      // Update undo availability (queue for after render)
      if (onUndoStateChange) {
        pendingUndoStateChangeRef.current = historyRef.current.length > 0;
      }
      
      return true; // Undo successful
    },
    canUndo: () => historyRef.current.length > 0
  }));

  // Debug: log progress state
  if (progress) {
    console.log('Progress state:', progress);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        className="canvas"
      />
      {progress && (
        <div className="progress-overlay" style={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="progress-container">
            <div className="progress-message">{progress.message || 'Loading...'}</div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <div className="progress-percentage">{progress.progress}%</div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DotCanvas;

