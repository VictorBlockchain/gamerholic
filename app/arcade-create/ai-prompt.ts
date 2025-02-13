export const aiGameCreationPrompt = `
Create a JavaScript-based game for the Gamerholic platform using the following structure and guidelines:

1. The game should be implemented as plain JavaScript that can run in a browser environment.
2. Use the canvas element provided by the platform for rendering the game.
3. Implement the game logic using vanilla JavaScript without any external libraries or frameworks.
4. The game must have a scoring system and should be challenging with increasing difficulty.
5. Implement the game using the following structure:

// Game variables (use let for variables that will change)
let score = 0;
// Add other necessary game variables here

function init() {
  // Initialize game elements and variables here
  // This function is called once when the game is loaded
}

function start() {
  // Reset game state and start the game
  score = 0;
  // Initialize or reset other game variables
  // This function is called each time the game starts or restarts
}

function update() {
  // Update game logic here
  // This function is called every frame
}

function draw(ctx) {
  // Clear the canvas and draw game elements here
  // ctx is the 2D rendering context for the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw game elements
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(\`Score: \${score}\`, 10, 30);
  
  // Add more drawing code for your game elements
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

// Initialize the game when the script loads
init();

// Expose necessary functions to the global scope
window.startGame = start;
window.handleInput = handleInput;
window.update = update;
window.draw = draw;
window.getScore = getScore;

6. Do not include any HTML structure tags or styling. The game will be embedded in an existing structure.

7. Ensure that the game can be started by calling the global startGame() function.

8. Implement the getScore() function that returns the current score, and expose it to the global scope.

9. Make sure to implement proper game over conditions and update the score accordingly.

10. The game should be responsive and adjust to different canvas sizes if possible. You can access the canvas size using ctx.canvas.width and ctx.canvas.height in the draw function.

11. Implement error handling to prevent the game from crashing due to runtime errors.

12. Use ES6+ syntax and best practices for clean, readable code.

13. Do not use setTimeout or setInterval for game loops or animations. The platform will handle calling the update and draw functions.

14. Do not add event listeners directly. Instead, use the handleInput function to process user inputs.

15. Avoid using global variables outside of the provided structure. Encapsulate game state within the functions.

16. Ensure that all game logic is contained within the provided functions (init, start, update, draw, handleInput).

17. The game should have a clear objective, scoring system, and increasing difficulty to engage players.

18. Include comments to explain complex logic or game mechanics for easier understanding and maintenance.

Use this template as a starting point for your game code. Be creative and implement an engaging game that fits within this structure. The game will be previewed in real-time as you develop it, so focus on creating a fun and interactive experience that works seamlessly with the Gamerholic platform.
`

