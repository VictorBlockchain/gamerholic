import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

interface TestingGame {
  arcade_id: number
  title: string
  assigned_at: string
  status: string
  thumbnail: string
  category: string
  reward: number
}

interface GamesBeingTestedProps {
  games: TestingGame[]
}

export function GamesBeingTested({ games }: GamesBeingTestedProps) {
  return (
    <div className="space-y-4">
      {games.map((game) => (
      <Link href={`/play/${game.arcade_id}`} className="text-primary hover:underline">
        
        <Card key={game.arcade_id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{game.title}</CardTitle>
              <Badge variant={game.status === "pending" ? "secondary" : "success"}>{game.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Image
                src={game.thumbnail || "/placeholder.svg"}
                alt={game.title}
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Category: {game.category}</p>
                <p className="text-sm text-muted-foreground mb-1">Assigned: {game.assigned_at}</p>
                <p className="text-sm font-semibold">Reward: {game.reward} SOL</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </Link>
      ))}
    </div>
  )
}

