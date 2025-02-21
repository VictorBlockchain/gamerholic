"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from "lucide-react"

interface GamePreviewProps {
  gameCode: string
  gameCss: string
  onScoreUpdate?: (score: number) => void
  currentTimer?: number
  onGameStart?: (runGame: boolean) => void
}

export const GamePreview: React.FC<GamePreviewProps> = ({
  gameCode,
  gameCss,
  onScoreUpdate,
  currentTimer,
  onGameStart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [gameInstance, setGameInstance] = useState<any>(null)
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null)
  const [gameWidth, setGameWidth] = useState(800)
  const [gameHeight, setGameHeight] = useState(600)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [runGame, setRunGame] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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
        gameInstance.update(1 / 60, () => currentTimer) // Pass a function to get currentTimer
      }
      if (typeof gameInstance.draw === "function") {
        gameInstance.draw(ctx, () => currentTimer) // Pass a function to get currentTimer
      }

      // Update score
      if (typeof gameInstance.getScore === "function") {
        const currentScore = gameInstance.getScore()
        setScore(currentScore)
        if (onScoreUpdate) onScoreUpdate(currentScore)
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
    setRunGame(true)
    if (onGameStart) {
      onGameStart(true)
    }
  }

  const handleUserInput = useCallback(
    (event: Event) => {
      if (gameInstance && typeof gameInstance.handleInput === "function") {
        gameInstance.handleInput(event)
      }
    },
    [gameInstance],
  )

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const endX = touch.clientX
    const endY = touch.clientY
    const startX = touchStartRef.current.x
    const startY = touchStartRef.current.y

    const deltaX = endX - startX
    const deltaY = endY - startY

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        simulateKeyEvent("ArrowRight")
      } else {
        simulateKeyEvent("ArrowLeft")
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        simulateKeyEvent("ArrowDown")
      } else {
        simulateKeyEvent("ArrowUp")
      }
    }

    touchStartRef.current = null
  }

  const simulateKeyEvent = (key: string) => {
    const keyDownEvent = new KeyboardEvent("keydown", { key })
    const keyUpEvent = new KeyboardEvent("keyup", { key })
    handleUserInput(keyDownEvent)
    handleUserInput(keyUpEvent)
  }

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current
      if (container) {
        const parentWidth = container.parentElement?.clientWidth || window.innerWidth
        const parentHeight = container.parentElement?.clientHeight || window.innerHeight
        let scale = Math.min(parentWidth / gameWidth, parentHeight / gameHeight, 1)

        // For mobile, allow scaling beyond 1 to fit the full screen
        if (isMobile) {
          scale = Math.min(parentWidth / gameWidth, parentHeight / gameHeight)
        }

        container.style.width = `${gameWidth * scale}px`
        container.style.height = `${gameHeight * scale}px`

        // Update canvas size
        const canvas = canvasRef.current
        if (canvas) {
          canvas.width = gameWidth * scale
          canvas.height = gameHeight * scale
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.scale(scale, scale)
          }
        }
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [gameWidth, gameHeight, isMobile])

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
  }, [handleUserInput])

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullScreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange)
    }
  }, [])

  return (
    <Card className="w-full h-full mx-auto overflow-hidden">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div
            ref={containerRef}
            className={`relative ${isFullScreen ? "fixed inset-0 z-50 bg-black" : ""}`}
            style={{ width: gameWidth, height: gameHeight }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {isMobile && (
              <Button onClick={toggleFullScreen} variant="outline" size="icon" className="absolute top-2 right-2 z-10">
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
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
          {!runGame && (
            <Button
              onClick={handleStartGame}
              variant="default"
              className="w-48 h-12 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start Game
            </Button>
          )}
        </div>
        {/* <div>Score: {score}</div>
        <div>Timer: {timer}</div> */}
      </CardContent>
    </Card>
  )
}

