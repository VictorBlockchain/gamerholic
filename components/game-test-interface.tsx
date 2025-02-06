import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { GamePreview } from "@/components/game-preview"

interface GameTestInterfaceProps {
  game: any
  onTestComplete: (testResult: string, score: number, feedback: string) => void
}

export function GameTestInterface({ game, onTestComplete }: GameTestInterfaceProps) {
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")

  const handleTestResult = (result: string) => {
    if (result === "pass" && score === null) {
      alert("Please enter a score before submitting a passing test.")
      return
    }
    onTestComplete(result, score, feedback)
  }

  return (
    <div className="space-y-4">
      <GamePreview gameCode={game.game_code} gameCss={game.game_css} />
      <div className="flex space-x-4">
        <Input
          type="number"
          placeholder="Enter score"
          value={score || ""}
          onChange={(e) => setScore(Number(e.target.value))}
        />
        <Button onClick={() => handleTestResult("pass")} variant="default">
          Pass Test
        </Button>
        <Button onClick={() => handleTestResult("fail")} variant="destructive">
          Fail Test
        </Button>
      </div>
      <Textarea
        placeholder="Enter your feedback about the game (required for failed tests)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
    </div>
  )
}

