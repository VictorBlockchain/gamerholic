import { useState } from "react"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react"

interface Game {
  id: string
  title: string
  thumbnail_image: string
  category: string
  created_at: string
  status: string
  tester: string | null
}

interface GameTestingTableProps {
  games: Game[]
  onGameSelect: (game: Game) => void
}

type SortKey = "title" | "category" | "created_at" | "status"

export function GameTestingTable({ games, onGameSelect }: GameTestingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 100

  const sortedGames = [...games].sort((a, b) => {
    if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1
    if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedGames.length / gamesPerPage)
  const indexOfLastGame = currentPage * gamesPerPage
  const indexOfFirstGame = indexOfLastGame - gamesPerPage
  const currentGames = sortedGames.slice(indexOfFirstGame, indexOfLastGame)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (column !== sortKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead onClick={() => toggleSort("title")} className="cursor-pointer">
                Title <SortIcon column="title" />
              </TableHead>
              <TableHead onClick={() => toggleSort("category")} className="cursor-pointer">
                Type <SortIcon column="category" />
              </TableHead>
              <TableHead onClick={() => toggleSort("created_at")} className="cursor-pointer">
                Date Added <SortIcon column="created_at" />
              </TableHead>
              <TableHead onClick={() => toggleSort("status")} className="cursor-pointer">
                Status <SortIcon column="status" />
              </TableHead>
              <TableHead>Tester</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentGames.map((game) => (
              <TableRow key={game.id}>
                <TableCell>
                  <Image
                    src={game.thumbnail_image || "/placeholder.svg"}
                    alt={game.title}
                    width={50}
                    height={50}
                    className="rounded-md"
                  />
                </TableCell>
                <TableCell className="font-medium">{game.title}</TableCell>
                <TableCell>{game.category}</TableCell>
                <TableCell>{new Date(game.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{game.status}</TableCell>
                <TableCell>{game.tester || "Open"}</TableCell>
                <TableCell>
                  <Button onClick={() => onGameSelect(game)} disabled={game.status !== "pending_test"}>
                    Select for Testing
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {indexOfFirstGame + 1}-{Math.min(indexOfLastGame, games.length)} of {games.length} games
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

