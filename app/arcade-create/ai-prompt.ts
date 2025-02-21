const aiGameCreationPrompt = `Create a JavaScript-based game for the Gamerholic platform using the following structure and guidelines:

1. The game should be implemented as plain JavaScript that can run in a browser environment.
2. Use the canvas element provided by the platform for rendering the game.
3. Implement the game logic using vanilla JavaScript without any external libraries or frameworks.
4. The game must have a scoring system and should be challenging with increasing difficulty.
5. Implement the game using the following structure:

\`\`\`javascript
// Game variables (use let for variables that will change)
let score = 0;
let gameWidth = 800; // Default game width
let gameHeight = 600; // Default game height
// Add other necessary game variables here

function init(canvas) {
  // Initialize game elements and variables here
  // This function is called once when the game is loaded
  // Adjust game size based on the provided canvas
  gameWidth = canvas.width;
  gameHeight = canvas.height;
}

function start() {
  // Reset game state and start the game
  score = 0;
  // Initialize or reset other game variables
  // This function is called each time the game starts or restarts
}

function update(deltaTime, getCurrentTimer) {
  // Update game logic here
  // This function is called every frame
  // deltaTime is the time passed since the last frame in seconds
  // getCurrentTimer is a function that returns the current game timer value
  const currentTimer = getCurrentTimer();
  if (currentTimer <= 0) {
    gameOver();
    return;
  }
  // Update other game elements and increase difficulty over time
}

function draw(ctx, getCurrentTimer) {
  // Clear the canvas and draw game elements here
  // ctx is the 2D rendering context for the canvas
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  // Draw game elements
  drawUI(ctx, getCurrentTimer);
  // Add more drawing code for your game elements
}

function drawUI(ctx, getCurrentTimer) {
  // Draw score and timer
  const currentTimer = getCurrentTimer();
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(\`Score: \${score}\`, 20, 40);
  ctx.textAlign = 'right';
  const minutes = Math.floor(currentTimer / 60);
  const seconds = Math.ceil(currentTimer % 60);
  ctx.fillText(\`Time: \${minutes}:\${seconds.toString().padStart(2, '0')}\`, gameWidth - 20, 40);
}

function handleInput(event) {
  // Handle user input here
  // This function is called when the user interacts with the game
  // event.type will be 'keydown', 'keyup', 'mousedown', 'mouseup', or 'mousemove'
  // event will have properties like key, code, clientX, clientY, etc.
}

function getScore() {
  return score;
}

function gameOver() {
  // Handle game over state
  console.log("Game Over! Final Score:", score);
  // You may want to stop the game loop or show a game over screen here
}

// Initialize the game when the script loads
init(document.querySelector('canvas'));

// Expose necessary functions to the global scope
window.startGame = start;
window.handleInput = handleInput;
window.update = update;
window.draw = draw;
window.getScore = getScore;
\`\`\`

6. Do not include any HTML structure tags ie: 'body'. The game will be embedded in an existing structure.

7. Ensure that the game can be started by calling the global startGame() function.

8. Implement the getScore() function that returns the current score, and expose it to the global scope.

9. Make sure to implement proper game over conditions and update the score accordingly.

10. The game should be responsive and adjust to different canvas sizes. Use the gameWidth and gameHeight variables for positioning and sizing game elements.

11. Implement error handling to prevent the game from crashing due to runtime errors.

12. Use ES6+ syntax and best practices for clean, readable code.

13. Do not use setTimeout or setInterval for game loops or animations. The platform will handle calling the update and draw functions.

14. Do not add event listeners directly. Instead, use the handleInput function to process user inputs.

15. Avoid using global variables outside of the provided structure. Encapsulate game state within the functions.

16. Ensure that all game logic is contained within the provided functions (init, start, update, draw, handleInput, drawUI, gameOver).

17. The game should have a clear objective, scoring system, and increasing difficulty to engage players.

18. Include comments to explain complex logic or game mechanics for easier understanding and maintenance.

19. Ensure that the score and timer are always visible and properly positioned on the screen.

20. Use relative positioning for game elements based on the gameWidth and gameHeight variables to ensure consistency across different canvas sizes.

21. Implement a drawUI function to handle the rendering of the score, timer, and any other UI elements consistently.

22. Use appropriate font sizes and colors for UI elements to ensure readability against the game background.

23. Consider implementing a simple pause functionality to enhance user experience.

24. Test the game at different canvas sizes to ensure that all elements are visible and the game remains playable.

25. // Responsive Design
- Ensure the game canvas is centered in the game view.
- Make sure the score and timer are always visible, regardless of screen size.
- Use relative positioning for UI elements (score, timer) to ensure they remain visible on different screen sizes.
- Consider using percentages or viewport units for positioning instead of fixed pixel values.
- Implement a minimum size for the game canvas to ensure playability on smaller screens.

26. // Game Timer
- The game timer is provided by the platform through the getCurrentTimer function.
- Use getCurrentTimer() to get the current time remaining in the game.
- Update the game state based on the current timer value in the update function.
- Display the current time in the drawUI function.
- Implement game over logic when the timer reaches zero.

Use this template as a starting point for your game code. Be creative and implement an engaging game that fits within this structure. The game will be previewed in real-time as you develop it, so focus on creating a fun and interactive experience that works seamlessly with the Gamerholic platform. Remember to adjust game difficulty, speed, or complexity based on the score or elapsed time to keep the game challenging and engaging throughout the play session.

Important CSS Note: When writing custom CSS for your game, do not use any selectors that target the <body> tag or any other elements outside of the game canvas. Your CSS should only affect elements within the game canvas to avoid interfering with the main site's styling.`
