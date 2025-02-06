export interface GameInterface {
  init: () => void
  start: () => void
  update: () => void
  draw: (ctx: CanvasRenderingContext2D) => void
  handleInput: (event: KeyboardEvent | MouseEvent) => void
  getScore: () => number
}

export function wrapGame(gameImplementation: Partial<GameInterface>) {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let animationFrameId: number
  let startTime: number
  let isGameRunning = false

  function initGame() {
    canvas = document.getElementById("gameCanvas") as HTMLCanvasElement
    if (!canvas) {
      console.error("Canvas element not found")
      return
    }
    ctx = canvas.getContext("2d")!
    if (!ctx) {
      console.error("Unable to get 2D context")
      return
    }

    canvas.width = 400
    canvas.height = 400

    window.addEventListener("keydown", handleInput)
    window.addEventListener("keyup", handleInput)
    canvas.addEventListener("mousedown", handleInput)
    canvas.addEventListener("mouseup", handleInput)
    canvas.addEventListener("mousemove", handleInput)

    if (typeof gameImplementation.init === "function") {
      gameImplementation.init()
    }
  }

  function startGame() {
    if (isGameRunning) {
      endGame()
    }
    startTime = Date.now()
    isGameRunning = true
    if (typeof gameImplementation.start === "function") {
      gameImplementation.start()
    }
    gameLoop()
  }

  function gameLoop() {
    if (!isGameRunning) return

    const currentTime = Date.now()
    const deltaTime = (currentTime - startTime) / 1000

    if (typeof gameImplementation.update === "function") {
      gameImplementation.update()
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (typeof gameImplementation.draw === "function") {
      gameImplementation.draw(ctx)
    }

    // Draw score and time
    ctx.fillStyle = "#fff"
    ctx.font = "16px Arial"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(
      `Score: ${typeof gameImplementation.getScore === "function" ? gameImplementation.getScore() : 0}`,
      10,
      10,
    )
    ctx.fillText(`Time: ${Math.floor(deltaTime)}s`, canvas.width - 70, 10)

    animationFrameId = requestAnimationFrame(gameLoop)
  }

  function handleInput(event: KeyboardEvent | MouseEvent) {
    if (typeof gameImplementation.handleInput === "function") {
      gameImplementation.handleInput(event)
    }
  }

  function endGame() {
    isGameRunning = false
    cancelAnimationFrame(animationFrameId)
    const finalScore = typeof gameImplementation.getScore === "function" ? gameImplementation.getScore() : 0
    const gameTime = Math.floor((Date.now() - startTime) / 1000)

    displayGameOver(finalScore, gameTime)
  }

  function displayGameOver(finalScore: number, gameTime: number) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#fff"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 40)
    ctx.font = "18px Arial"
    ctx.fillText(`Score: ${finalScore}`, canvas.width / 2, canvas.height / 2)
    ctx.fillText(`Time: ${gameTime}s`, canvas.width / 2, canvas.height / 2 + 30)
  }

  return {
    init: initGame,
    start: startGame,
    end: endGame,
  }
}

