let score = 0
let gameOver = false
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D

export function init(canvasElement: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  canvas = canvasElement
  ctx = context
  console.log("Game initialized with canvas dimensions:", canvas.width, canvas.height)
}

export function start() {
  score = 0
  gameOver = false
  console.log("Game started")
}

export function update(deltaTime: number) {
  if (!gameOver) {
    score += deltaTime / 1000
  }
}

export function draw(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = "black"
  context.font = "24px Arial"
  context.fillText(`Score: ${Math.floor(score)}`, 10, 30)

  if (gameOver) {
    context.fillStyle = "red"
    context.font = "48px Arial"
    context.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2)
  }
}

export function handleInput(event: Event) {
  console.log("Input event:", event.type)
}

export function getScore() {
  return Math.floor(score)
}

