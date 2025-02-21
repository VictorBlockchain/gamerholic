export const aiGameCreationPrompt = `Create a p5.js-based game for the Gamerholic platform using the following structure and guidelines:

1. The game should be implemented using p5.js and run in a browser environment.
2. Use the p5.js canvas for rendering the game, with dimensions that adapt to the available space.
3. The game must have a scoring system and should be challenging with increasing difficulty.
4. IMPORTANT: All p5.js functions must be called using the 'p' object passed to each function. This ensures compatibility with our game preview system.
5. Implement the game using the following structure:

\`\`\`javascript
let score = 0;
let highScore = 0; // This will be updated from the React component
let gameWidth, gameHeight;
let gameState = 'start'; // Possible states: 'start', 'playing', 'gameover'
// Add other necessary game variables here

function setup(p) {
  // Create a canvas that fills the parent container
  gameWidth = p.windowWidth;
  gameHeight = p.windowHeight;
  p.createCanvas(gameWidth, gameHeight);

  // Set frame rate to ensure consistent performance
  p.frameRate(60);
  
  // Get highScore from the React component
  highScore = window.highScore || 0;

  // Initialize game elements and variables here
  initializeGame(p);
}

function draw(p) {
  // Clear the background
  if (!p) return;
  p.background(0);

  switch (gameState) {
    case 'start':
      drawStartScreen(p);
      break;
    case 'playing':
      updateGame(p);
      drawGame(p);
      break;
    case 'gameover':
      drawGameOverScreen(p);
      break;
  }
}

function drawStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('Click to Start', p.width / 2, p.height / 2);
}

function updateGame(p) {
  // Update game logic here
  // This function is called every frame
  // Update game elements and increase difficulty over time
  const currentTimer = getCurrentTimer();
  if (currentTimer <= 0) {
    gameOver(p);
    return;
  }
  // Add game update logic here
}

function drawGame(p) {
  // Draw game elements here
  drawUI(p);
  // Add more drawing code for your game elements
}

function drawGameOverScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text('Game Over', p.width / 2, p.height / 2);
  p.textSize(24);
  p.text('Click to Restart', p.width / 2, p.height / 2 + 40);
  p.text('Score: ' + score, p.width / 2, p.height / 2 + 80);
  p.text('High Score: ' + highScore, p.width / 2, p.height / 2 + 120);
}

function drawUI(p) {
  // Draw score and other UI elements
  p.fill(255);
  p.textSize(gameWidth * 0.03); // Relative text size
  p.textAlign(p.LEFT, p.TOP);
  p.text(\`Score: \${score}\`, gameWidth * 0.02, gameHeight * 0.02);
  p.text(\`High Score: \${highScore}\`, gameWidth * 0.02, gameHeight * 0.06);
  
  // Draw timer
  const currentTimer = getCurrentTimer();
  const minutes = Math.floor(currentTimer / 60);
  const seconds = Math.ceil(currentTimer % 60);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(\`Time: \${minutes}:\${seconds.toString().padStart(2, '0')}\`, gameWidth * 0.98, gameHeight * 0.02);
}

function keyPressed(p) {
  // Handle key press events
  // This function must be defined, even if empty
}

function keyReleased(p) {
  // Handle key release events
  // This function must be defined, even if empty
}

function mousePressed(p) {
  // Handle mouse input here
    // This function must be defined, even if empty
  
  if (gameState === 'start' || gameState === 'gameover') {
    startGame();
  }
}

function windowResized(p) {
  // Adjust the canvas size when the window is resized
  gameWidth = p.windowWidth;
  gameHeight = p.windowHeight;
  p.resizeCanvas(gameWidth, gameHeight);

  // Adjust game elements if necessary
  initializeGame(p);
}

function getScore() {
  return score;
}

function initializeGame(p) {
  // Initialize or reset game elements and variables
  gameWidth = p.width;
  gameHeight = p.height;
  // Add any other initialization logic here
}

function startGame() {
  // Reset game state and start the game
  score = 0;
  gameState = 'playing';
  // Initialize or reset other game variables
  // This function is called when the Start Game button is clicked
  initializeGame(p);
}

function gameOver(p) {
  // Handle game over state
  console.log("Game Over! Final Score:", score);
  if (score > highScore) {
    highScore = score;
    // Update high score in the React component
    if (window.updateHighScore) {
      window.updateHighScore(highScore);
    }
  }
  gameState = 'gameover';
}

function getCurrentTimer() {
  // Implement this function to return the current game time
  // This should be based on the game's internal timer logic
}

// Expose necessary functions to the global scope
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
window.mousePressed = mousePressed;
window.windowResized = windowResized;
window.getScore = getScore;
window.startGame = startGame;
\`\`\`

Important: Always define the following functions, even if they are empty:
   - setup(p)
   - draw(p)
   - keyPressed(p)
   - keyReleased(p)
   - mousePressed(p)
   - getScore()
   - startGame()

   Make sure to expose all necessary functions to the global scope as shown in the template.
   Use the 'p' parameter consistently when calling p5.js functions:
   Correct: p.rect(), p.fill(), p.width, p.height
   Incorrect: rect(), fill(), width, height
   
6. Do not include any HTML structure tags. The game will be embedded in an existing structure.

7. Ensure that the game can be started by calling the global startGame() function.

8. Implement the getScore() function that returns the current score, and expose it to the global scope.

9. Make sure to implement proper game over conditions and update the score accordingly.

10. The game should be responsive and adjust to different canvas sizes:
    - Ensure the game canvas is centered in the game view.
    - Make sure the score and timer are always visible, regardless of screen size.
    - Use relative positioning for UI elements (score, timer) to ensure they remain visible on different screen sizes.
    - Consider using percentages or viewport units for positioning instead of fixed pixel values.
    - Implement a minimum size for the game canvas to ensure playability on smaller screens.

11. Implement error handling to prevent the game from crashing due to runtime errors:
    - Use try-catch blocks in critical sections of your code.
    - Implement fallback behaviors for unexpected scenarios.
    - Log errors to the console for debugging purposes.

12. Use ES6+ syntax and best practices for clean, readable code.

13. Do not use setTimeout or setInterval for game loops or animations. p5.js handles the main loop.

14. Avoid using global variables outside of the provided structure. Encapsulate game state within the functions.

15. Ensure that all game logic is contained within the provided p5.js functions (setup, draw, etc.).

16. The game should have a clear objective, scoring system, and increasing difficulty to engage players.

17. Include comments to explain complex logic or game mechanics for easier understanding and maintenance.

18. Game Timer Implementation:
    - Use the getCurrentTimer function to get the current time remaining in the game.
    - Update the game state based on the current timer value in the updateGame function.
    - Display the current time in the drawUI function.
    - Implement game over logic when the timer reaches zero.

19. Use appropriate font sizes and colors for UI elements to ensure readability against the game background.

20. Consider implementing a simple pause functionality to enhance user experience.

21. Test the game at different canvas sizes to ensure that all elements are visible and the game remains playable.

22. Optimize performance:
    - Limit the number of objects created during gameplay.
    - Use efficient algorithms for collision detection and other computationally intensive tasks.
    - Consider using object pooling for frequently created/destroyed objects.

23. Implement proper cleanup in the gameOver function to ensure no lingering processes or memory leaks.

24. High Score Implementation:
    - Use the highScore variable to store and display the highest score achieved.
    - Update the high score when a new high score is achieved in the gameOver function.
    - Use window.updateHighScore(highScore) to update the high score in the React component if available.

Use this template as a starting point for your p5.js game code. Be creative and implement an engaging game that fits within this structure. The game will be previewed in real-time as you develop it, so focus on creating a fun and interactive experience that works seamlessly with the Gamerholic platform. Remember to adjust game difficulty, speed, or complexity based on the score or elapsed time to keep the game challenging and engaging throughout the play session.

Important Note: When writing custom p5.js code for your game, ensure that all drawing and update logic is contained within the p5.js functions (setup, draw, etc.), and always use the 'p' object to call p5.js functions. Do not manipulate the DOM or use vanilla JavaScript methods that might interfere with the main site's functionality.`

