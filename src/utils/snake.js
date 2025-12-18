const DIRECTIONS = {
  UP: { row: -1, col: 0, angle: -Math.PI / 2 },
  DOWN: { row: 1, col: 0, angle: Math.PI / 2 },
  LEFT: { row: 0, col: -1, angle: Math.PI },
  RIGHT: { row: 0, col: 1, angle: 0 }
};

export class Snake {
  constructor(gridPositions, color = null) {
    this.gridPositions = gridPositions; // Array of {row, col}
    this.direction = this.calculateDirection();
    this.color = color || this.generateColor();
    this.isMoving = false;
  }

  calculateDirection() {
    if (this.gridPositions.length < 2) {
      return DIRECTIONS.RIGHT;
    }
    
    const head = this.gridPositions[0];
    const neck = this.gridPositions[1];
    
    const rowDiff = head.row - neck.row;
    const colDiff = head.col - neck.col;
    
    if (rowDiff === -1) return DIRECTIONS.UP;
    if (rowDiff === 1) return DIRECTIONS.DOWN;
    if (colDiff === -1) return DIRECTIONS.LEFT;
    if (colDiff === 1) return DIRECTIONS.RIGHT;
    
    return DIRECTIONS.RIGHT;
  }

  generateColor() {
    // Get snake color from CSS variable, fallback to default
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      let snakeColor = getComputedStyle(root).getPropertyValue('--game-snake-color');
      if (snakeColor && snakeColor.trim() !== '') {
        return snakeColor.trim();
      }
    }
    return '#e74c3c'; // Red default
  }

  getHead() {
    return this.gridPositions[0];
  }

  getTail() {
    return this.gridPositions[this.gridPositions.length - 1];
  }

  getHeadDirection() {
    return this.direction;
  }

  // Change direction to a perpendicular direction (90-degree turn)
  // Prefers turning right, then left, then opposite if needed
  changeDirectionToPerpendicular(rows, cols, allSnakes) {
    const currentDir = this.direction;
    const head = this.getHead();
    
    // Get perpendicular directions
    let perpendicularDirs = [];
    if (currentDir.row === 0) {
      // Moving horizontally, can turn up or down
      perpendicularDirs = [DIRECTIONS.UP, DIRECTIONS.DOWN];
    } else {
      // Moving vertically, can turn left or right
      perpendicularDirs = [DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
    }
    
    // Try each perpendicular direction to find one that doesn't cause immediate collision
    for (const newDir of perpendicularDirs) {
      const testRow = head.row + newDir.row;
      const testCol = head.col + newDir.col;
      
      // Check if this direction would cause immediate collision
      let wouldCollide = false;
      
      // Check bounds
      if (testRow < 0 || testRow >= rows || testCol < 0 || testCol >= cols) {
        continue; // Off-screen, try next direction
      }
      
      // Check collision with other snakes
      for (const snake of allSnakes) {
        if (snake === this) continue;
        
        for (let i = 0; i < snake.gridPositions.length; i++) {
          const pos = snake.gridPositions[i];
          if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
            if (pos.row === testRow && pos.col === testCol) {
              // Allow moving into other snake's tail
              const tail = snake.getTail();
              if (testRow === tail.row && testCol === tail.col) {
                continue;
              }
              wouldCollide = true;
              break;
            }
          }
        }
        if (wouldCollide) break;
      }
      
      // Check self-collision (excluding tail)
      if (!wouldCollide) {
        const tail = this.getTail();
        for (let i = 1; i < this.gridPositions.length; i++) {
          const pos = this.gridPositions[i];
          if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
            if (pos.row === testRow && pos.col === testCol) {
              // Allow moving into own tail
              if (testRow === tail.row && testCol === tail.col) {
                continue;
              }
              wouldCollide = true;
              break;
            }
          }
        }
      }
      
      if (!wouldCollide) {
        // This direction is safe, use it
        this.direction = newDir;
        return true;
      }
    }
    
    // If no perpendicular direction works, try opposite direction as last resort
    // Normalize angle to [-π, π]
    let oppositeAngle = currentDir.angle + Math.PI;
    if (oppositeAngle > Math.PI) {
      oppositeAngle -= 2 * Math.PI;
    }
    const oppositeDir = {
      row: -currentDir.row,
      col: -currentDir.col,
      angle: oppositeAngle
    };
    
    const testRow = head.row + oppositeDir.row;
    const testCol = head.col + oppositeDir.col;
    
    // Check if opposite direction is valid
    if (testRow >= 0 && testRow < rows && testCol >= 0 && testCol < cols) {
      let wouldCollide = false;
      for (const snake of allSnakes) {
        if (snake === this) continue;
        for (let i = 0; i < snake.gridPositions.length; i++) {
          const pos = snake.gridPositions[i];
          if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
            if (pos.row === testRow && pos.col === testCol) {
              const tail = snake.getTail();
              if (testRow === tail.row && testCol === tail.col) {
                continue;
              }
              wouldCollide = true;
              break;
            }
          }
        }
        if (wouldCollide) break;
      }
      
      if (!wouldCollide) {
        this.direction = oppositeDir;
        return true;
      }
    }
    
    // No valid direction found
    return false;
  }

  changeDirectionClockwise(rows, cols, allSnakes) {
    const currentDir = this.direction;
    const head = this.getHead();
    
    // Determine clockwise direction based on current direction
    // RIGHT -> DOWN -> LEFT -> UP -> RIGHT
    let clockwiseDir;
    if (currentDir === DIRECTIONS.RIGHT) {
      clockwiseDir = DIRECTIONS.DOWN;
    } else if (currentDir === DIRECTIONS.DOWN) {
      clockwiseDir = DIRECTIONS.LEFT;
    } else if (currentDir === DIRECTIONS.LEFT) {
      clockwiseDir = DIRECTIONS.UP;
    } else if (currentDir === DIRECTIONS.UP) {
      clockwiseDir = DIRECTIONS.RIGHT;
    } else {
      // Fallback to perpendicular if direction is unknown
      return this.changeDirectionToPerpendicular(rows, cols, allSnakes);
    }
    
    // Check if clockwise direction is safe
    const testRow = head.row + clockwiseDir.row;
    const testCol = head.col + clockwiseDir.col;
    
    // Snakes can move off-screen, so we allow off-screen turns
    // Only check collisions for on-screen positions
    const isOnScreen = testRow >= 0 && testRow < rows && testCol >= 0 && testCol < cols;
    
    // Check collision with other snakes (only for on-screen positions)
    if (isOnScreen) {
      for (const snake of allSnakes) {
        if (snake === this) continue;
        
        for (let i = 0; i < snake.gridPositions.length; i++) {
          const pos = snake.gridPositions[i];
          if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
            if (pos.row === testRow && pos.col === testCol) {
              // Allow moving into other snake's tail
              const tail = snake.getTail();
              if (testRow === tail.row && testCol === tail.col) {
                continue;
              }
              // Clockwise would collide on-screen, try counter-clockwise
              return this.tryCounterClockwiseOrOther(rows, cols, allSnakes, currentDir, head);
            }
          }
        }
      }
      
      // Check self-collision (excluding tail) - only for on-screen
      const tail = this.getTail();
      for (let i = 1; i < this.gridPositions.length; i++) {
        const pos = this.gridPositions[i];
        if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
          if (pos.row === testRow && pos.col === testCol) {
            // Allow moving into own tail
            if (testRow === tail.row && testCol === tail.col) {
              continue;
            }
            // Clockwise would collide on-screen, try counter-clockwise
            return this.tryCounterClockwiseOrOther(rows, cols, allSnakes, currentDir, head);
          }
        }
      }
    }
    
    // Clockwise direction is safe (even if off-screen, snakes can move off-screen)
    this.direction = clockwiseDir;
    return true;
  }

  tryCounterClockwiseOrOther(rows, cols, allSnakes, currentDir, head) {
    // Try counter-clockwise direction
    let counterClockwiseDir;
    if (currentDir === DIRECTIONS.RIGHT) {
      counterClockwiseDir = DIRECTIONS.UP;
    } else if (currentDir === DIRECTIONS.DOWN) {
      counterClockwiseDir = DIRECTIONS.RIGHT;
    } else if (currentDir === DIRECTIONS.LEFT) {
      counterClockwiseDir = DIRECTIONS.DOWN;
    } else if (currentDir === DIRECTIONS.UP) {
      counterClockwiseDir = DIRECTIONS.LEFT;
    } else {
      // Fallback to perpendicular
      return this.changeDirectionToPerpendicular(rows, cols, allSnakes);
    }
    
    const testRow = head.row + counterClockwiseDir.row;
    const testCol = head.col + counterClockwiseDir.col;
    
    // Check bounds
    if (testRow < 0 || testRow >= rows || testCol < 0 || testCol >= cols) {
      // Counter-clockwise is off-screen, try perpendicular
      return this.changeDirectionToPerpendicular(rows, cols, allSnakes);
    }
    
    // Check collision with other snakes
    for (const snake of allSnakes) {
      if (snake === this) continue;
      
      for (let i = 0; i < snake.gridPositions.length; i++) {
        const pos = snake.gridPositions[i];
        if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
          if (pos.row === testRow && pos.col === testCol) {
            const tail = snake.getTail();
            if (testRow === tail.row && testCol === tail.col) {
              continue;
            }
            // Counter-clockwise would collide, try perpendicular
            return this.changeDirectionToPerpendicular(rows, cols, allSnakes);
          }
        }
      }
    }
    
    // Check self-collision
    const tail = this.getTail();
    for (let i = 1; i < this.gridPositions.length; i++) {
      const pos = this.gridPositions[i];
      if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
        if (pos.row === testRow && pos.col === testCol) {
          if (testRow === tail.row && testCol === tail.col) {
            continue;
          }
          // Counter-clockwise would collide, try perpendicular
          return this.changeDirectionToPerpendicular(rows, cols, allSnakes);
        }
      }
    }
    
    // Counter-clockwise direction is safe
    this.direction = counterClockwiseDir;
    return true;
  }

  canMove(rows, cols, occupiedPositions) {
    const head = this.getHead();
    const nextRow = head.row + this.direction.row;
    const nextCol = head.col + this.direction.col;

    // Check if next position is occupied by another snake (only check if on-screen)
    if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
      const nextPos = `${nextRow},${nextCol}`;
      if (occupiedPositions.has(nextPos)) {
        return false;
      }
    }

    // Check if next position is the tail (allowed, since tail moves)
    const tail = this.getTail();
    if (nextRow === tail.row && nextCol === tail.col) {
      return true;
    }

    // Allow movement even off-screen (snake will continue until fully off-screen)
    return true;
  }

  move(rows, cols, allSnakes) {
    // Create set of occupied positions (excluding own tail, and only for on-screen positions)
    const occupiedPositions = new Set();
    allSnakes.forEach(snake => {
      const tail = snake.getTail();
      snake.gridPositions.forEach((pos, index) => {
        // Allow moving to own tail
        if (snake === this && index === snake.gridPositions.length - 1) {
          return;
        }
        // Only track on-screen positions for collision
        if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
          occupiedPositions.add(`${pos.row},${pos.col}`);
        }
      });
    });

    if (!this.canMove(rows, cols, occupiedPositions)) {
      return false;
    }

    const head = this.getHead();
    const nextRow = head.row + this.direction.row;
    const nextCol = head.col + this.direction.col;

    // Always allow movement (even off-screen)
    const newHead = {
      row: nextRow,
      col: nextCol
    };

    // Move head forward
    this.gridPositions.unshift(newHead);
    // Remove tail
    this.gridPositions.pop();

    // Don't recalculate direction - preserve the current direction
    // This ensures snakes continue in a straight line even when off-screen

    return true;
  }

  isCompletelyOffScreen(rows, cols) {
    // Check if all segments are off-screen with a small margin
    // This ensures the tail is fully off before removal
    return this.gridPositions.every(pos => 
      pos.row < -1 || pos.row >= rows + 1 || pos.col < -1 || pos.col >= cols + 1
    );
  }

  isOffScreen(rows, cols) {
    const head = this.getHead();
    return head.row < 0 || head.row >= rows || head.col < 0 || head.col >= cols;
  }

  // Check if this snake would collide head-to-head with another snake
  // Returns the other snake if head-to-head collision detected, null otherwise
  checkHeadToHeadCollision(allSnakes, rows, cols) {
    const head = this.getHead();
    const dir = this.direction;
    const nextRow = head.row + dir.row;
    const nextCol = head.col + dir.col;
    
    // Only check if head is on-screen
    if (head.row < 0 || head.row >= rows || head.col < 0 || head.col >= cols) {
      return null;
    }
    
    // Check if next position would be another snake's head
    for (const snake of allSnakes) {
      if (snake === this) continue;
      
      const otherHead = snake.getHead();
      // Only check on-screen snakes
      if (otherHead.row < 0 || otherHead.row >= rows || 
          otherHead.col < 0 || otherHead.col >= cols) {
        continue;
      }
      
      // Check if our next position is their head
      if (nextRow === otherHead.row && nextCol === otherHead.col) {
        // Also check if they're moving towards us (head-to-head)
        const otherDir = snake.direction;
        const otherNextRow = otherHead.row + otherDir.row;
        const otherNextCol = otherHead.col + otherDir.col;
        
        if (otherNextRow === head.row && otherNextCol === head.col) {
          return snake; // Head-to-head collision detected
        }
      }
    }
    
    return null;
  }

  hasCollided(allSnakes, rows, cols) {
    const head = this.getHead();
    
    // Only check collision if head is on-screen
    if (head.row < 0 || head.row >= rows || head.col < 0 || head.col >= cols) {
      return false;
    }
    
    const headKey = `${head.row},${head.col}`;
    
    for (const snake of allSnakes) {
      if (snake === this) continue;
      
      for (let i = 0; i < snake.gridPositions.length; i++) {
        const pos = snake.gridPositions[i];
        // Only check on-screen positions
        if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
          const posKey = `${pos.row},${pos.col}`;
          if (posKey === headKey) {
            return true;
          }
        }
      }
    }
    
    // Check self-collision (head hitting body) - only on-screen
    for (let i = 1; i < this.gridPositions.length; i++) {
      const pos = this.gridPositions[i];
      if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
        if (pos.row === head.row && pos.col === head.col) {
          return true;
        }
      }
    }
    
    return false;
  }

  getOccupiedPositions() {
    return this.gridPositions.map(pos => `${pos.row},${pos.col}`);
  }

  // Check if this snake can move in any direction
  canMoveInAnyDirection(rows, cols, allSnakes) {
    const head = this.getHead();
    const allDirections = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
    
    // Create set of occupied positions (excluding own tail)
    const occupiedPositions = new Set();
    allSnakes.forEach(snake => {
      const tail = snake.getTail();
      snake.gridPositions.forEach((pos, index) => {
        // Allow moving to own tail
        if (snake === this && index === snake.gridPositions.length - 1) {
          return;
        }
        // Only track on-screen positions for collision
        if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
          occupiedPositions.add(`${pos.row},${pos.col}`);
        }
      });
    });

    // Try each direction
    for (const dir of allDirections) {
      const nextRow = head.row + dir.row;
      const nextCol = head.col + dir.col;
      
      // Check if next position is occupied (only check if on-screen)
      if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
        const nextPos = `${nextRow},${nextCol}`;
        if (occupiedPositions.has(nextPos)) {
          continue; // This direction is blocked
        }
      }
      
      // Check if next position is the tail (allowed, since tail moves)
      const tail = this.getTail();
      if (nextRow === tail.row && nextCol === tail.col) {
        return true; // Can move to tail
      }
      
      // Allow movement even off-screen (snake will continue until fully off-screen)
      // But for "no moves" detection, we only care about on-screen moves
      if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
        return true; // Can move in this direction
      }
    }
    
    return false; // No valid moves found
  }
}

// Generate snake in reverse - start from off-screen and work backwards
// This guarantees solvability because we know the solution (forward movement)
export function generateRandomSnake(rows, cols, minLength = 3, maxLength = 8, occupiedPositions = new Set(), existingSnakes = []) {
  const attempts = 500;
  
  for (let attempt = 0; attempt < attempts; attempt++) {
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    
    // Choose a random direction for the snake to move
    const directions = [
      DIRECTIONS.UP,
      DIRECTIONS.DOWN,
      DIRECTIONS.LEFT,
      DIRECTIONS.RIGHT
    ];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    // Start from off-screen or near edge, moving backwards
    // The head will be the last position we place (on-screen)
    // We'll build the snake backwards from off-screen towards on-screen
    const snake = tryCreateSnakeReverse(rows, cols, length, direction, occupiedPositions, existingSnakes);
    
    if (snake) {
      // Double-check for deadlocks with existing snakes
      if (!hasDeadlock(snake, existingSnakes, rows, cols)) {
        // Additional check: ensure existing snakes can still move
        // Build occupied positions including new snake
        const allOccupied = new Set(occupiedPositions);
        snake.getOccupiedPositions().forEach(pos => allOccupied.add(pos));
        
        // Check if any existing snake would be completely blocked
        let allCanMove = true;
        for (const existingSnake of existingSnakes) {
          const head = existingSnake.getHead();
          // Only check on-screen snakes
          if (head.row < 0 || head.row >= rows || head.col < 0 || head.col >= cols) {
            continue;
          }
          
          const dir = existingSnake.direction;
          const nextRow = head.row + dir.row;
          const nextCol = head.col + dir.col;
          
          // Check if next position is blocked (excluding own tail)
          const tail = existingSnake.getTail();
          if (nextRow === tail.row && nextCol === tail.col) {
            continue; // Can move into own tail
          }
          
          if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
            const nextPosKey = `${nextRow},${nextCol}`;
            if (allOccupied.has(nextPosKey)) {
              // Check if it's blocked by new snake's body (not tail)
              let blockedByNewSnake = false;
              const newTail = snake.getTail();
              if (nextRow === newTail.row && nextCol === newTail.col) {
                blockedByNewSnake = false; // Can move into new snake's tail
              } else {
                for (let i = 0; i < snake.gridPositions.length - 1; i++) {
                  const pos = snake.gridPositions[i];
                  if (pos.row === nextRow && pos.col === nextCol) {
                    blockedByNewSnake = true;
                    break;
                  }
                }
              }
              
              if (blockedByNewSnake) {
                allCanMove = false;
                break;
              }
            }
          }
        }
        
        if (allCanMove) {
          return snake;
        }
      }
    }
  }

  return null;
}

// Create snake by working backwards from off-screen
// This guarantees the snake can move forward (solution is known)
function tryCreateSnakeReverse(rows, cols, length, direction, occupiedPositions, existingSnakes = []) {
  // Choose a random on-screen position for where the head will end up
  // We'll build backwards from here, allowing turns
  const headRow = Math.floor(Math.random() * rows);
  const headCol = Math.floor(Math.random() * cols);
  
  // Check if head position is available
  const headKey = `${headRow},${headCol}`;
  if (occupiedPositions.has(headKey)) {
    return null;
  }
  
  // Build path from tail to head in correct order: [tail, ..., neck, head]
  // Then we'll reverse to get [head, neck, ..., tail] which Snake expects
  // We start at head position and build backwards to tail, allowing turns
  const pathBackwards = [];
  let currentRow = headRow;
  let currentCol = headCol;
  const used = new Set([headKey]);
  let currentBackwardDir = { row: -direction.row, col: -direction.col }; // Opposite of forward direction
  
  // Start with head position
  pathBackwards.push({ row: currentRow, col: currentCol });
  
  // Build backwards from head: place tail segments
  // Allow 90-degree turns to create interesting paths
  // IMPORTANT: All segments must stay on-screen
  for (let i = 1; i < length; i++) {
    // Get all possible directions: straight back, or 90-degree turns
    const perpendicularDirs = [];
    
    // Get perpendicular directions (90-degree turns from current backward direction)
    if (currentBackwardDir.row === 0) {
      // Moving horizontally backwards, can turn up or down
      perpendicularDirs.push({ row: -1, col: 0 }, { row: 1, col: 0 });
    } else {
      // Moving vertically backwards, can turn left or right
      perpendicularDirs.push({ row: 0, col: -1 }, { row: 0, col: 1 });
    }
    
    // Try all directions: continue straight back, or turn
    const possibleDirs = [currentBackwardDir, ...perpendicularDirs];
    const validMoves = [];
    
    for (const dir of possibleDirs) {
      const newRow = currentRow + dir.row;
      const newCol = currentCol + dir.col;
      const posKey = `${newRow},${newCol}`;
      
      // CRITICAL: All segments must be on-screen
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
        continue; // Skip off-screen positions
      }
      
      // Skip if already used
      if (used.has(posKey)) {
        continue;
      }
      
      // Check if position is occupied by another snake
      if (occupiedPositions.has(posKey)) {
        continue;
      }
      
      // Check for self-collisions (adjacent non-consecutive segments)
      if (i >= 2) {
        const prevPos = pathBackwards[i - 2];
        const rowDiff = Math.abs(newRow - prevPos.row);
        const colDiff = Math.abs(newCol - prevPos.col);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
          continue; // Adjacent non-consecutive segments
        }
      }
      
      // Check if this position would block the forward path from head
      // We're building backwards, so check if new position is in forward path
      // Don't place body segments in positions that the snake will move through
      const maxForwardSteps = Math.min(length, 8); // Check up to 8 steps or snake length
      let wouldBlockForward = false;
      
      for (let forwardStep = 1; forwardStep <= maxForwardSteps; forwardStep++) {
        const forwardRow = headRow + (direction.row * forwardStep);
        const forwardCol = headCol + (direction.col * forwardStep);
        
        // If forward path goes off-screen, no need to check further
        if (forwardRow < 0 || forwardRow >= rows || forwardCol < 0 || forwardCol >= cols) {
          break;
        }
        
        // If this new position is in the forward path, it could block movement
        // After reversing, this segment will be at index (length - i - 1) in the final path
        // After forwardStep moves, segments shift: segment at index j moves to j-forwardStep
        // So segment at (length - i - 1) would be at (length - i - 1 - forwardStep)
        // If this is still >= 0 (not the tail), it would block
        if (newRow === forwardRow && newCol === forwardCol) {
          const finalIndex = length - i - 1;
          const indexAfterMoves = finalIndex - forwardStep;
          
          // If the segment would still be in the body (not become the tail) after forwardStep moves,
          // and it's at the forward path position, it would block
          if (indexAfterMoves >= 0) {
            wouldBlockForward = true;
            break;
          }
        }
      }
      
      if (wouldBlockForward) {
        continue; // Would block forward movement - skip this position
      }
      
      validMoves.push({ row: newRow, col: newCol, dir });
    }
    
    if (validMoves.length === 0) {
      return null; // Cannot continue - no valid on-screen moves
    }
    
    // Randomly choose a valid move
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    currentRow = move.row;
    currentCol = move.col;
    currentBackwardDir = move.dir; // Update direction for next segment
    
    pathBackwards.push({ row: currentRow, col: currentCol });
    used.add(`${currentRow},${currentCol}`);
  }
  
  // Reverse to get [head, neck, ..., tail] order (what Snake expects)
  const path = pathBackwards.reverse();
  
  // Verify all segments are on-screen
  for (const pos of path) {
    if (pos.row < 0 || pos.row >= rows || pos.col < 0 || pos.col >= cols) {
      return null; // Some segment is off-screen - reject
    }
  }
  
  // Verify head is first
  if (!path[0]) {
    return null;
  }
  
  // Create snake - it will calculate direction from head and neck
  const snake = new Snake(path);
  // Direction should match: head points in 'direction'
  // Snake calculates: direction = head - neck
  // So if head is at (r, c) and neck is at (r-dr, c-dc), direction is (dr, dc)
  // This should match our intended 'direction'
  const calculatedDir = snake.calculateDirection();
  snake.direction = calculatedDir;
  
  // CRITICAL: Check if snake can move forward (not blocked by own body)
  // Simulate forward movement for multiple steps to ensure clear path
  const head = snake.getHead();
  const tail = snake.getTail();
  const dir = snake.direction;
  
  // Simulate forward movement for up to snake length steps
  // This ensures the snake can actually move without self-collision
  let forwardRow = head.row;
  let forwardCol = head.col;
  const maxSteps = Math.min(snake.gridPositions.length, 8); // Check up to 8 steps or snake length
  
  for (let step = 1; step <= maxSteps; step++) {
    forwardRow += dir.row;
    forwardCol += dir.col;
    
    // If moved off-screen, path is clear (snake can exit)
    if (forwardRow < 0 || forwardRow >= rows || forwardCol < 0 || forwardCol >= cols) {
      break; // Clear path to exit
    }
    
    // Allow moving into own tail on first step (tail moves away)
    if (step === 1 && forwardRow === tail.row && forwardCol === tail.col) {
      continue; // Can move into tail
    }
    
    // Check if this forward position is blocked by snake's own body
    // As snake moves forward, body segments shift, so we need to account for that
    // After step N, the tail has moved N positions, so exclude last N segments
    const excludeFromEnd = Math.min(step, snake.gridPositions.length - 1);
    
    for (let i = 1; i < snake.gridPositions.length - excludeFromEnd; i++) {
      const bodyPos = snake.gridPositions[i];
      if (bodyPos.row === forwardRow && bodyPos.col === forwardCol) {
        return null; // Snake's own body blocks forward movement - reject
      }
    }
  }
  
  // Early deadlock check before returning
  if (existingSnakes && existingSnakes.length > 0) {
    if (hasDeadlock(snake, existingSnakes, rows, cols)) {
      return null; // Reject to prevent deadlock
    }
  }
  
  return snake;
}

function tryCreateSnakePath(startRow, startCol, length, rows, cols, occupiedPositions) {
  const path = [{ row: startRow, col: startCol }];
  const used = new Set([`${startRow},${startCol}`]);

  // Check if start position is available
  if (occupiedPositions.has(`${startRow},${startCol}`)) {
    return null;
  }

  let currentRow = startRow;
  let currentCol = startCol;
  let lastDirection = null;

  // Generate path with 90-degree turns
  for (let i = 1; i < length; i++) {
    const validMoves = [];
    
    // Get all 4 directions
    const directions = [
      { row: -1, col: 0, name: 'UP' },
      { row: 1, col: 0, name: 'DOWN' },
      { row: 0, col: -1, name: 'LEFT' },
      { row: 0, col: 1, name: 'RIGHT' }
    ];

    // Filter valid moves (90-degree turns or straight)
    directions.forEach(dir => {
      const newRow = currentRow + dir.row;
      const newCol = currentCol + dir.col;
      const posKey = `${newRow},${newCol}`;

      // Check bounds
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
        return;
      }

      // Check if already used in this path
      if (used.has(posKey)) {
        return;
      }

      // Check if occupied by other snakes
      if (occupiedPositions.has(posKey)) {
        return;
      }

      // Prevent self-collisions: check if new position would be adjacent to any existing body segment
      // (except the immediate previous position and the position before that, which are expected to be adjacent)
      let isAdjacentToBody = false;
      const previousIndex = path.length - 1;
      const prevPrevIndex = path.length - 2;
      
      for (let j = 0; j < path.length; j++) {
        // Skip the last position (we're moving from there) and second-to-last
        if (j === previousIndex || j === prevPrevIndex) {
          continue;
        }
        
        const bodyPos = path[j];
        const rowDiff = Math.abs(newRow - bodyPos.row);
        const colDiff = Math.abs(newCol - bodyPos.col);
        
        // If new position is adjacent to any body segment (excluding expected adjacent positions)
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
          isAdjacentToBody = true;
          break;
        }
      }
      
      if (isAdjacentToBody) {
        return; // Skip this move to prevent self-collision
      }

      // Allow straight movement or 90-degree turns
      validMoves.push({ row: newRow, col: newCol, direction: dir });
    });

    if (validMoves.length === 0) {
      return null; // Cannot continue path
    }

    // Randomly choose a valid move
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    currentRow = move.row;
    currentCol = move.col;
    
    path.push({ row: currentRow, col: currentCol });
    used.add(`${currentRow},${currentCol}`);
    lastDirection = move.direction;
  }

  const snake = new Snake(path);
  return snake;
}

// Validate that a snake can actually move forward (is solvable)
function isSnakeSolvable(snake, rows, cols, occupiedPositions) {
  const head = snake.getHead();
  const direction = snake.direction;
  const tail = snake.getTail();
  
  // Check if snake can move forward at least 2 steps (ensures clear path)
  // This prevents snakes from being immediately blocked
  let currentRow = head.row;
  let currentCol = head.col;
  const minStepsForward = 2;
  
  for (let step = 1; step <= minStepsForward; step++) {
    currentRow += direction.row;
    currentCol += direction.col;
    
    // If we've moved off-screen, that's fine - snake can exit
    if (currentRow < 0 || currentRow >= rows || currentCol < 0 || currentCol >= cols) {
      return true; // Snake has clear exit path
    }
    
    const nextPos = `${currentRow},${currentCol}`;
    
    // Can't move into another snake (that's not our own tail)
    if (occupiedPositions.has(nextPos)) {
      // Allow moving into own tail (tail will move away)
      if (step === 1 && currentRow === tail.row && currentCol === tail.col) {
        continue; // First step can be into tail
      }
      return false;
    }
    
    // Check if would collide with own body (not tail)
    // As snake moves, tail moves away, so check if next position is in body (excluding tail)
    let wouldCollideWithBody = false;
    for (let i = 0; i < snake.gridPositions.length - 1; i++) {
      const pos = snake.gridPositions[i];
      // Only check if this position is still in the body after movement
      // After step 1: tail is at original position, so exclude last 1 segment
      // After step 2: tail has moved, so exclude last 2 segments
      const excludeFromEnd = Math.min(step, snake.gridPositions.length - 1);
      if (i < snake.gridPositions.length - excludeFromEnd) {
        if (pos.row === currentRow && pos.col === currentCol) {
          wouldCollideWithBody = true;
          break;
        }
      }
    }
    
    if (wouldCollideWithBody) {
      return false;
    }
  }
  
  // Snake can move forward multiple steps
  return true;
}

// Check if a snake would create a deadlock with existing snakes
// Deadlock can occur in multiple ways:
// 1. Direct head-to-head pointing
// 2. Circular deadlocks (A→B→C→A)
// 3. Blocked forward paths (snake can't move because path is blocked)
function hasDeadlock(newSnake, existingSnakes, rows, cols) {
  const newHead = newSnake.getHead();
  const newDirection = newSnake.direction;
  
  // Check if new snake's head is on-screen
  if (newHead.row < 0 || newHead.row >= rows || newHead.col < 0 || newHead.col >= cols) {
    return false; // Off-screen snakes can't deadlock
  }
  
  // Calculate where new snake is pointing (next position)
  const newNextRow = newHead.row + newDirection.row;
  const newNextCol = newHead.col + newDirection.col;
  
  // Build set of all occupied positions (excluding tails)
  const allSnakes = [...existingSnakes, newSnake];
  const occupiedPositions = new Set();
  allSnakes.forEach(snake => {
    const tail = snake.getTail();
    snake.gridPositions.forEach((pos, index) => {
      // Allow moving to own tail
      if (index === snake.gridPositions.length - 1) {
        return;
      }
      // Only track on-screen positions
      if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
        occupiedPositions.add(`${pos.row},${pos.col}`);
      }
    });
  });
  
  // Check 1: Direct head-to-head deadlock
  for (const existingSnake of existingSnakes) {
    const existingHead = existingSnake.getHead();
    const existingDirection = existingSnake.direction;
    
    // Check if existing snake's head is on-screen
    if (existingHead.row < 0 || existingHead.row >= rows || existingHead.col < 0 || existingHead.col >= cols) {
      continue; // Skip off-screen snakes
    }
    
    // Calculate where existing snake is pointing (next position)
    const existingNextRow = existingHead.row + existingDirection.row;
    const existingNextCol = existingHead.col + existingDirection.col;
    
    // Deadlock: new snake's head points at existing snake's head
    // AND existing snake's head points at new snake's head
    if (newNextRow === existingHead.row && newNextCol === existingHead.col &&
        existingNextRow === newHead.row && existingNextCol === newHead.col) {
      return true; // Direct deadlock
    }
    
    // Adjacent heads pointing at each other
    const rowDiff = Math.abs(newHead.row - existingHead.row);
    const colDiff = Math.abs(newHead.col - existingHead.col);
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      if (newNextRow === existingHead.row && newNextCol === existingHead.col &&
          existingNextRow === newHead.row && existingNextCol === newHead.col) {
        return true; // Adjacent deadlock
      }
    }
  }
  
  // Check 2: Can new snake actually move forward?
  // If next position is blocked by another snake's body (not tail), it's a deadlock
  if (newNextRow >= 0 && newNextRow < rows && newNextCol >= 0 && newNextCol < cols) {
    const nextPosKey = `${newNextRow},${newNextCol}`;
    // Check if blocked by another snake's body (excluding tails)
    for (const existingSnake of existingSnakes) {
      const existingTail = existingSnake.getTail();
      // If next position is another snake's tail, that's OK (tail moves)
      if (newNextRow === existingTail.row && newNextCol === existingTail.col) {
        continue;
      }
      // Check if next position is in another snake's body
      for (let i = 0; i < existingSnake.gridPositions.length - 1; i++) {
        const pos = existingSnake.gridPositions[i];
        if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
          if (pos.row === newNextRow && pos.col === newNextCol) {
            return true; // Blocked by another snake's body
          }
        }
      }
    }
  }
  
  // Check 3: Path intersection deadlock
  // Check if any snake's forward path intersects with another snake's body
  // This catches cases where snakes' paths cross and block each other
  const allOnScreenSnakes = allSnakes.filter(s => {
    const h = s.getHead();
    return h.row >= 0 && h.row < rows && h.col >= 0 && h.col < cols;
  });
  
  // For each pair of snakes, check if their paths intersect in a blocking way
  for (let i = 0; i < allOnScreenSnakes.length; i++) {
    const snake1 = allOnScreenSnakes[i];
    const head1 = snake1.getHead();
    const dir1 = snake1.direction;
    const tail1 = snake1.getTail();
    
    // Simulate snake1's forward path (up to 5 steps or until off-screen)
    const forwardPath1 = new Set();
    let row1 = head1.row;
    let col1 = head1.col;
    for (let step = 1; step <= 5; step++) {
      row1 += dir1.row;
      col1 += dir1.col;
      
      if (row1 < 0 || row1 >= rows || col1 < 0 || col1 >= cols) {
        break; // Off-screen, path is clear
      }
      
      // Skip if this is the tail (tail moves away)
      if (step === 1 && row1 === tail1.row && col1 === tail1.col) {
        continue;
      }
      
      forwardPath1.add(`${row1},${col1}`);
    }
    
    // Check if snake1's forward path intersects with any other snake's body
    for (let j = 0; j < allOnScreenSnakes.length; j++) {
      if (i === j) continue;
      
      const snake2 = allOnScreenSnakes[j];
      const tail2 = snake2.getTail();
      
      // Check each position in snake1's forward path
      for (const pathPos of forwardPath1) {
        // Skip if this is snake2's tail (tail moves)
        const [pathRow, pathCol] = pathPos.split(',').map(Number);
        if (pathRow === tail2.row && pathCol === tail2.col) {
          continue;
        }
        
        // Check if this forward path position is in snake2's body
        for (let k = 0; k < snake2.gridPositions.length - 1; k++) {
          const bodyPos = snake2.gridPositions[k];
          if (bodyPos.row >= 0 && bodyPos.row < rows && 
              bodyPos.col >= 0 && bodyPos.col < cols) {
            if (bodyPos.row === pathRow && bodyPos.col === pathCol) {
              // Found intersection - check if snake2's path also blocks snake1
              const head2 = snake2.getHead();
              const dir2 = snake2.direction;
              
              // Simulate snake2's forward path
              let row2 = head2.row;
              let col2 = head2.col;
              for (let step2 = 1; step2 <= 5; step2++) {
                row2 += dir2.row;
                col2 += dir2.col;
                
                if (row2 < 0 || row2 >= rows || col2 < 0 || col2 >= cols) {
                  break;
                }
                
                if (step2 === 1 && row2 === tail2.row && col2 === tail2.col) {
                  continue;
                }
                
                // Check if snake2's forward path intersects with snake1's body
                for (let k2 = 0; k2 < snake1.gridPositions.length - 1; k2++) {
                  const bodyPos1 = snake1.gridPositions[k2];
                  if (bodyPos1.row >= 0 && bodyPos1.row < rows && 
                      bodyPos1.col >= 0 && bodyPos1.col < cols) {
                    if (bodyPos1.row === row2 && bodyPos1.col === col2) {
                      return true; // Mutual path intersection deadlock
                    }
                  }
                }
              }
              
              // Even if not mutual, if snake1's path is blocked, it's a deadlock
              return true;
            }
          }
        }
      }
    }
  }
  
  // Check 4: Circular deadlock detection
  // Build a graph of which snakes point at which other snakes' heads
  
  // For each snake, find which other snake's head it points at
  const pointingGraph = new Map();
  for (let i = 0; i < allOnScreenSnakes.length; i++) {
    const snake = allOnScreenSnakes[i];
    const head = snake.getHead();
    const dir = snake.direction;
    const nextRow = head.row + dir.row;
    const nextCol = head.col + dir.col;
    
    // Find which snake (if any) has its head at the next position
    for (let j = 0; j < allOnScreenSnakes.length; j++) {
      if (i === j) continue;
      const otherSnake = allOnScreenSnakes[j];
      const otherHead = otherSnake.getHead();
      if (nextRow === otherHead.row && nextCol === otherHead.col) {
        if (!pointingGraph.has(i)) {
          pointingGraph.set(i, []);
        }
        pointingGraph.get(i).push(j);
      }
    }
  }
  
  // Check for cycles using DFS
  const visited = new Set();
  const recStack = new Set();
  
  const hasCycle = (node) => {
    if (recStack.has(node)) {
      return true; // Cycle detected
    }
    if (visited.has(node)) {
      return false;
    }
    
    visited.add(node);
    recStack.add(node);
    
    const targets = pointingGraph.get(node) || [];
    for (const target of targets) {
      if (hasCycle(target)) {
        return true;
      }
    }
    
    recStack.delete(node);
    return false;
  };
  
  for (let i = 0; i < allOnScreenSnakes.length; i++) {
    if (!visited.has(i) && hasCycle(i)) {
      return true; // Circular deadlock detected
    }
  }
  
  return false; // No deadlock
}

// State representation: hash of all snake positions
function hashState(snakes) {
  return snakes.map(s => 
    s.gridPositions.map(p => `${p.row},${p.col}`).join('|')
  ).sort().join('::');
}

// Check if puzzle is solved (all snakes off-screen)
function isSolved(snakes, rows, cols) {
  return snakes.every(snake => snake.isCompletelyOffScreen(rows, cols));
}

// Deep copy a snake
function copySnake(snake) {
  const copy = new Snake([...snake.gridPositions], snake.color);
  copy.direction = snake.direction;
  return copy;
}

// Generate next states: try moving each snake that can move
function getNextStates(currentState, rows, cols) {
  const nextStates = [];
  const currentSnakes = currentState.snakes;
  const currentMoveSequence = currentState.moveSequence || [];
  
  for (let i = 0; i < currentSnakes.length; i++) {
    const snake = currentSnakes[i];
    
    // Skip if already off-screen
    if (snake.isCompletelyOffScreen(rows, cols)) {
      continue;
    }
    
    // Create deep copy of all snakes
    const newSnakes = currentSnakes.map(copySnake);
    const snakeToMove = newSnakes[i];
    
    // Check if can move - build occupied positions from other snakes
    const occupiedPositions = new Set();
    newSnakes.forEach((s, idx) => {
      if (idx !== i) {
        const tail = s.getTail();
        s.gridPositions.forEach((pos, posIdx) => {
          // Allow moving to own tail
          if (posIdx === s.gridPositions.length - 1) {
            return;
          }
          // Only track on-screen positions for collision
          if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
            occupiedPositions.add(`${pos.row},${pos.col}`);
          }
        });
      }
    });
    
    if (!snakeToMove.canMove(rows, cols, occupiedPositions)) {
      continue;
    }
    
    // Try to move
    const moved = snakeToMove.move(rows, cols, newSnakes);
    
    if (moved) {
      // Check for collision after move
      if (!snakeToMove.hasCollided(newSnakes, rows, cols)) {
        nextStates.push({
          snakes: newSnakes,
          moveSequence: [...currentMoveSequence, i]
        });
      }
    }
  }
  
  return nextStates;
}

// BFS to find solution - guarantees solvability
export function isPuzzleSolvable(snakes, rows, cols, maxDepth = 100, onProgress = null) {
  if (snakes.length === 0) {
    if (onProgress) onProgress({ phase: 'validating', progress: 100, message: 'Checking solution...' });
    return { solvable: true, solution: [] };
  }
  
  // Check if already solved
  if (isSolved(snakes, rows, cols)) {
    if (onProgress) onProgress({ phase: 'validating', progress: 100, message: 'Checking solution...' });
    return { solvable: true, solution: [] };
  }
  
  const visited = new Set();
  const queue = [{
    snakes: snakes.map(copySnake),
    moveSequence: [],
    depth: 0
  }];
  
  visited.add(hashState(queue[0].snakes));
  let statesExplored = 0;
  const maxStates = 10000; // Increased limit - we need to explore more to guarantee solvability
  const reportInterval = 50; // Report less frequently to reduce re-renders
  let lastProgressUpdate = 0;
  
  while (queue.length > 0) {
    // Memory limit check - if we hit limits, we can't verify solvability
    if (statesExplored >= maxStates) {
      if (onProgress) onProgress({ phase: 'validating', progress: 100, message: 'Validation timeout - cannot verify' });
      // Cannot verify - reject puzzle to be safe
      return { solvable: false, solution: null };
    }
    
    // Memory limit on visited set
    if (visited.size > maxStates) {
      if (onProgress) onProgress({ phase: 'validating', progress: 100, message: 'Validation timeout - cannot verify' });
      // Cannot verify - reject puzzle to be safe
      return { solvable: false, solution: null };
    }
    
    const current = queue.shift();
    statesExplored++;
    
    // Throttle progress updates to prevent excessive re-renders
    const now = Date.now();
    if (onProgress && (now - lastProgressUpdate > 100 || statesExplored % reportInterval === 0)) {
      const progress = Math.min(95, Math.floor((statesExplored / maxStates) * 90));
      const depth = current.depth;
      onProgress({ 
        phase: 'validating', 
        progress, 
        message: `Exploring solutions... (${statesExplored}/${maxStates})` 
      });
      lastProgressUpdate = now;
    }
    
    // Check if solved
    if (isSolved(current.snakes, rows, cols)) {
      if (onProgress) onProgress({ phase: 'validating', progress: 100, message: 'Solution found!' });
      return { solvable: true, solution: current.moveSequence };
    }
    
    // Depth limit to prevent infinite search
    if (current.depth >= maxDepth) {
      continue;
    }
    
    // Generate next states
    const nextStates = getNextStates(current, rows, cols);
    
    // Don't limit branching - we need to explore all possibilities to guarantee solvability
    // Instead, we rely on maxStates and maxDepth limits
    for (const nextState of nextStates) {
      const stateHash = hashState(nextState.snakes);
      
      if (!visited.has(stateHash)) {
        visited.add(stateHash);
        queue.push({
          ...nextState,
          depth: current.depth + 1
        });
      }
    }
  }
  
  if (onProgress) onProgress({ phase: 'validating', progress: 100, message: 'No solution found' });
  return { solvable: false, solution: null };
}

export { DIRECTIONS };

