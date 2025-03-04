"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from "lucide-react"
import p5 from "p5"

interface GamePreviewProps {
  gameCode: string
  gameCss: string
  onScoreUpdate?: (score: number) => void
  currentTimer?: number
  onGameStart?: (runGame: boolean) => void
  highScore?: number
}

export const GamePreview: React.FC<GamePreviewProps> = ({
  gameCode,
  gameCss,
  onScoreUpdate,
  currentTimer,
  onGameStart,
  highScore = 0,
}) => {
  const sketchRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [p5Instance, setP5Instance] = useState<p5 | null>(null)
  const [gameWidth, setGameWidth] = useState(800)
  const [gameHeight, setGameHeight] = useState(600)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [runGame, setRunGame] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const onScoreUpdateRef = useRef(onScoreUpdate)
  
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate
  }, [onScoreUpdate])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768)
      }
      checkMobile()
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preventDefaultKeys = (e: KeyboardEvent) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
          e.preventDefault()
        }
      }
      window.addEventListener("keydown", preventDefaultKeys)
      return () => {
        window.removeEventListener("keydown", preventDefaultKeys)
      }
    }
  }, [])
  
  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure it runs only in the client
  
    if (sketchRef.current && gameCode) {
      try {
        const newP5Instance = new p5((p: p5) => {
          p.setup = () => {
            p.createCanvas(gameWidth, gameHeight)
            if (typeof (window as any).setup === "function") {
              ;(window as any).setup(p)
            }
          }
  
          p.draw = () => {
            if (typeof (window as any).draw === "function") {
              ;(window as any).draw(p)
            }
            // Update score
            if (typeof (window as any).getScore === "function") {
              const currentScore = (window as any).getScore()
              setScore(currentScore)
              if (onScoreUpdateRef.current) onScoreUpdateRef.current(currentScore)
            }
  
            if (typeof (window as any).getCurrentTime === "function") {
              const currentTime = (window as any).getCurrentTime()
              setTimer(currentTime)
            }
          }
  
          p.mousePressed = () => {
            if (typeof (window as any).mousePressed === "function") {
              ;(window as any).mousePressed(p)
            }
          }
  
          p.keyPressed = () => {
            if (typeof (window as any).keyPressed === "function") {
              ;(window as any).keyPressed(p)
            }
            return false // Prevent default behavior
          }
  
          p.keyReleased = () => {
            if (typeof (window as any).keyReleased === "function") {
              ;(window as any).keyReleased(p)
            }
            return false // Prevent default behavior
          }
        }, sketchRef.current)
  
        setP5Instance(newP5Instance)
  
        // Evaluate the game code
        // eslint-disable-next-line no-new-func
        new Function(
          "p5",
          `
          return function(p) {
            ${gameCode}
          }
        `,
        )(p5)(newP5Instance)
  
        setError(null)
      } catch (err: any) {
        console.error("Error executing game code:", err)
        setError(err.toString())
      }
    }
  
    return () => {
      if (p5Instance) {
        p5Instance.remove()
      }
    }
  }, [gameCode, gameWidth, gameHeight])
  

  useEffect(() => {
    setTimer(currentTimer || 0)
  }, [currentTimer])
  
  useEffect(() => {
    // Apply CSS
    const styleElement = document.createElement("style")
    styleElement.textContent = gameCss
    document.head.appendChild(styleElement)
  
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [gameCss])
  
  const handleStartGame = () => {
    try {
      console.log("Starting game")
      if (typeof (window as any).startGame === "function") {
        ;(window as any).startGame(p5Instance)
      } else {
        console.error("startGame function is not defined")
      }
      setRunGame(true)
      setTimer(180) // Reset timer to 3 minutes
      if (onGameStart) {
        onGameStart(true)
      }
      // Focus on the game container to ensure it receives keyboard events
      containerRef.current?.focus()
    } catch (error) {
      console.error("Error starting game:", error)
      setError("Failed to start the game. Please try again.")
    }
  }
  
  const handleResize = useCallback(() => {
    if (typeof window !== 'undefined' && containerRef.current && p5Instance) {
      const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth
      const parentHeight = containerRef.current.parentElement?.clientHeight || window.innerHeight
      let scale = Math.min(parentWidth / gameWidth, parentHeight / gameHeight, 1)
  
      if (isMobile) {
        scale = Math.min(parentWidth / gameWidth, parentHeight / gameHeight)
      }
  
      containerRef.current.style.width = `${gameWidth * scale}px`
      containerRef.current.style.height = `${gameHeight * scale}px`
  
      p5Instance.resizeCanvas(gameWidth * scale, gameHeight * scale)
    }
  }, [gameWidth, gameHeight, isMobile, p5Instance])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", handleResize)
      handleResize()
  
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [handleResize])

  useEffect(() => {
    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [handleResize])

  const toggleFullScreen = () => {
    if (typeof window !== 'undefined') {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`)
        })
      } else {
        document.exitFullscreen()
      }
    }
  }
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleFullScreenChange = () => {
        setIsFullScreen(!!document.fullscreenElement)
      }
  
      document.addEventListener("fullscreenchange", handleFullScreenChange)
  
      return () => {
        document.removeEventListener("fullscreenchange", handleFullScreenChange)
      }
    }
  }, [])

  return (
    <>
    <Card className="w-full h-full mx-auto overflow-hidden">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div
            ref={containerRef}
            className={`relative ${isFullScreen ? "fixed inset-0 z-50 bg-black" : ""}`}
            style={{ width: gameWidth, height: gameHeight }}
            tabIndex={0}
            onKeyDown={(e) => e.preventDefault()}
          >
            {isMobile && (
              <Button onClick={toggleFullScreen} variant="outline" size="icon" className="absolute top-2 right-2 z-10">
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            <div ref={sketchRef} className="border-2 border-primary rounded-lg" />
          </div>
        </div>
        {error && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        {/* <div className="flex justify-center mt-4">
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
        <div className="mt-4 flex justify-between items-center bg-background/50 p-4 rounded-lg">
          <div className="text-xl font-bold text-primary">Score: {score}</div>
          <div className="text-xl font-bold text-primary">Time: {Math.ceil(timer)}s</div>
        </div> */}
      </CardContent>
    </Card>
    </>
  )
}

