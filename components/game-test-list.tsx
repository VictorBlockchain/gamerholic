import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gamepad2 } from "lucide-react"

interface GameTestListProps {
  games: any[]
  onGameSelect: (game: any) => void
}

export function GameTestList({ games, onGameSelect }: GameTestListProps) {
  console.log(games)

  return (
    <ScrollArea className="h-[400px]">
      {games.length === 0 ? (
        <p>No games currently need testing.</p>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <Card key={game.game_id} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{game.title}</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-2">
                  Category: {game.category} | Play Fee: {game.play_fee} SOL
                </div>
                <Button onClick={() => onGameSelect(game)} className="w-full">
                  Test Game
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ScrollArea>
  )
}

