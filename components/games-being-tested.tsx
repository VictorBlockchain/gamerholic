import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface TestingGame {
  id: string
  title: string
  assigned_at: string
  status: string
}

interface GamesBeingTestedProps {
  games: TestingGame[]
}

export function GamesBeingTested({ games }: GamesBeingTestedProps) {
  return (
    <div className="space-y-4">
      {games.length === 0 ? (
        <p>You are not currently testing any games.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Game Title</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  <Link href={`/play/${game.id}`} className="text-primary hover:underline">
                    {game.title}
                  </Link>
                </TableCell>
                <TableCell>{game.assigned_at}</TableCell>
                <TableCell>
                  <Badge variant={game.status === "completed" ? "success" : "default"}>{game.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

