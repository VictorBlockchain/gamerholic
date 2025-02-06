// Simple card game implementation
let score = 0
let timeRemaining = 180 // 3 minutes
let deck = []
let playerHand = []
let isGameRunning = false

function createGame() {
  function init(canvas) {
    // Initialize the game
    resetGame()
  }

  function start() {
    isGameRunning = true
    resetGame()
  }

  function update() {
    if (!isGameRunning) return

    timeRemaining--
    if (timeRemaining <= 0) {
      isGameRunning = false
    }
  }

  function draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw game state
    ctx.fillStyle = "white"
    ctx.font = "20px Arial"
    ctx.fillText(`Score: ${score}`, 10, 30)
    ctx.fillText(`Time: ${timeRemaining}s`, 10, 60)

    // Draw player's hand
    playerHand.forEach((card, index) => {
      ctx.fillStyle = "white"
      ctx.fillRect(50 + index * 70, 250, 60, 90)
      ctx.fillStyle = "black"
      ctx.font = "16px Arial"
      ctx.fillText(card, 60 + index * 70, 290)
    })
  }

  function resetGame() {
    score = 0
    timeRemaining = 180
    deck = createDeck()
    playerHand = [drawCard(), drawCard()]
  }

  function createDeck() {
    const suits = ["♠", "♥", "♦", "♣"]
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
    return suits.flatMap((suit) => values.map((value) => value + suit))
  }

  function drawCard() {
    if (deck.length === 0) {
      deck = createDeck()
    }
    return deck.splice(Math.floor(Math.random() * deck.length), 1)[0]
  }

  return { init, start, update, draw }
}

// Make createGame available globally
window.createGame = createGame

