const sampleGameCode = `
// Game variables
let canvas, ctx;
let score = 0;
let ballX = 200;
let ballY = 200;
let ballRadius = 10;
let ballSpeedX = 2;
let ballSpeedY = -2;
let paddleWidth = 100;
let paddleHeight = 10;
let paddleX = 150;
let gameOver = false;
let animationId;

function initGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 400;
  
  // Add event listener for paddle movement
  document.addEventListener('keydown', handleInput);
  
  // Start the game loop
  gameLoop();
}

function gameLoop() {
  update();
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function update() {
  if (gameOver) return;

  // Move the ball
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Ball collision with walls
  if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width) {
    ballSpeedX = -ballSpeedX;
  }
  if (ballY - ballRadius < 0) {
    ballSpeedY = -ballSpeedY;
  }

  // Ball collision with paddle
  if (
    ballY + ballRadius > canvas.height - paddleHeight &&
    ballX > paddleX &&
    ballX < paddleX + paddleWidth
  ) {
    ballSpeedY = -ballSpeedY;
    score++;
  }

  // Game over condition
  if (ballY + ballRadius > canvas.height) {
    gameOver = true;
  }
}

function draw() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the ball
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0f0';
  ctx.fill();
  ctx.closePath();

  // Draw the paddle
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = '#00f';
  ctx.fill();
  ctx.closePath();

  // Draw the score
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(\`Score: \${score}\`, 10, 30);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function handleInput(event) {
  if (gameOver) return;

  // Move paddle left and right
  if (event.key === 'ArrowLeft' && paddleX > 0) {
    paddleX -= 20;
  } else if (event.key === 'ArrowRight' && paddleX < canvas.width - paddleWidth) {
    paddleX += 20;
  }
}

function startGame() {
  // Reset game state
  score = 0;
  ballX = 200;
  ballY = 200;
  ballSpeedX = 2;
  ballSpeedY = -2;
  paddleX = 150;
  gameOver = false;

  // Cancel any existing animation
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  // Start the game loop
  gameLoop();
}

// Initialize the game when the script loads
initGame();
`

export default sampleGameCode

