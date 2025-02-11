"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface GamePreviewProps {
  gameCode: string
  gameCss: string
  onScoreUpdate?: (score: number) => void
  onTimerUpdate?: (timer: number) => void
}

export const GamePreview: React.FC<GamePreviewProps> = ({ gameCode, gameCss, onScoreUpdate, onTimerUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [gameInstance, setGameInstance] = useState<any>(null)
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null)
  const [gameWidth, setGameWidth] = useState(800)
  const [gameHeight, setGameHeight] = useState(600)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    ctx?.clearRect(0, 0, canvas.width, canvas.height)

    if (!gameCode.trim()) {
      if (ctx) {
        ctx.fillStyle = "white"
        ctx.font = "16px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Enter your game code and click 'Update Preview'", canvas.width / 2, canvas.height / 2)
      }
      return
    }

    // Apply CSS
    const styleElement = document.createElement("style")
    styleElement.textContent = gameCss
    document.head.appendChild(styleElement)

    // Execute the game code
    try {
      const gameModule = { exports: {} }
      const wrappedCode = `
        (function(module, exports) {
          ${gameCode}
          if (typeof startGame === 'function') {
            module.exports = {
              start: startGame,
              update: typeof update === 'function' ? update : () => {},
              draw: typeof draw === 'function' ? draw : () => {},
              getScore: typeof getScore === 'function' ? getScore : () => 0,
              handleInput: typeof handleInput === 'function' ? handleInput : () => {},
              getTimer: typeof getTimer === 'function' ? getTimer : () => 0,
            };
          } else {
            module.exports = { start: () => {}, update: () => {}, draw: () => {}, getScore: () => 0, handleInput: () => {}, getTimer: () => 0 };
          }
        })(gameModule, gameModule.exports);
      `
      // eslint-disable-next-line no-new-func
      new Function("gameModule", wrappedCode)(gameModule)

      const game: any = gameModule.exports
      setGameInstance(game)

      // Extract game dimensions from the code
      const widthMatch = gameCode.match(/let\s+gameWidth\s*=\s*(\d+)/)
      const heightMatch = gameCode.match(/let\s+gameHeight\s*=\s*(\d+)/)

      if (widthMatch && heightMatch) {
        setGameWidth(Number.parseInt(widthMatch[1]))
        setGameHeight(Number.parseInt(heightMatch[1]))
      }

      if (typeof game.start === "function") {
        game.start(canvas)
      }

      setError(null)
    } catch (err: any) {
      console.error("Error executing game code:", err)
      setError(err.toString())
      if (ctx) {
        ctx.fillStyle = "red"
        ctx.font = "16px Arial"
        ctx.textAlign = "center"
        ctx.fillText(`Error: ${err.toString()}`, canvas.width / 2, canvas.height / 2)
      }
    }

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [gameCode, gameCss])

  const gameLoop = () => {
    if (!gameInstance) return

    const ctx = canvasRef.current?.getContext("2d")
    if (ctx) {
      if (typeof gameInstance.update === "function") {
        gameInstance.update()
      }
      if (typeof gameInstance.draw === "function") {
        gameInstance.draw(ctx)
      }

      // Update score and timer
      if (typeof gameInstance.getScore === "function") {
        const currentScore = gameInstance.getScore()
        setScore(currentScore)
        if (onScoreUpdate) onScoreUpdate(currentScore)
      }
      if (typeof gameInstance.getTimer === "function") {
        const currentTimer = gameInstance.getTimer()
        setTimer(currentTimer)
        if (onTimerUpdate) onTimerUpdate(currentTimer)
      }
    }

    const frameId = requestAnimationFrame(gameLoop)
    setAnimationFrameId(frameId)
  }

  const handleStartGame = () => {
    if (!gameInstance || typeof gameInstance.start !== "function") return

    // Stop previous loop if running
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    canvasRef.current?.focus()
    gameInstance.start()
    gameLoop()
  }

  const handleUserInput = (event: Event) => {
    if (gameInstance && typeof gameInstance.handleInput === "function") {
      gameInstance.handleInput(event)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current
      if (container) {
        const parentWidth = container.parentElement?.clientWidth || window.innerWidth
        const parentHeight = container.parentElement?.clientHeight || window.innerHeight
        const scale = Math.min(
          parentWidth / gameWidth,
          parentHeight / gameHeight,
          1, // Limit scale to 1 to prevent enlarging on big screens
        )
        container.style.width = `${gameWidth * scale}px`
        container.style.height = `${gameHeight * scale}px`
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [gameWidth, gameHeight])

  useEffect(() => {
    const preventArrowScroll = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", preventArrowScroll)

    return () => window.removeEventListener("keydown", preventArrowScroll)
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleUserInput)
    window.addEventListener("keyup", handleUserInput)
    window.addEventListener("mousedown", handleUserInput)
    window.addEventListener("mouseup", handleUserInput)
    window.addEventListener("mousemove", handleUserInput)

    return () => {
      window.removeEventListener("keydown", handleUserInput)
      window.removeEventListener("keyup", handleUserInput)
      window.removeEventListener("mousedown", handleUserInput)
      window.removeEventListener("mouseup", handleUserInput)
      window.removeEventListener("mousemove", handleUserInput)
    }
  }, [handleUserInput]) // Added handleUserInput to dependency array

  return (
    <Card className="w-full h-full mx-auto overflow-hidden">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div ref={containerRef} style={{ width: gameWidth, height: gameHeight }}>
            <canvas
              id="gameCanvas"
              ref={canvasRef}
              width={gameWidth}
              height={gameHeight}
              className="border-2 border-primary rounded-lg"
              tabIndex={0}
            />
          </div>
        </div>
        {error && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleStartGame}
            variant="default"
            className="w-48 h-12 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Start Game
          </Button>
        </div>
        <div>Score: {score}</div>
        <div>Timer: {timer}</div>
      </CardContent>
    </Card>
  )
}

