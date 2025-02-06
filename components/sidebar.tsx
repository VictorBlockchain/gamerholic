import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollText, Gamepad2, Trophy, Flame, Star, Zap } from "lucide-react"

export function Sidebar() {
  return (
    <div className="hidden border-r border-accent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:block">
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-2 p-4 w-[240px]">
        <div className="flex-1 space-y-1">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/">
              <Flame className="mr-2 h-4 w-4 text-[hsl(var(--neon-pink))]" />
              Trending
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/new">
              <Star className="mr-2 h-4 w-4 text-[hsl(var(--neon-purple))]" />
              New Games
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/blockchain">
              <Zap className="mr-2 h-4 w-4 text-[hsl(var(--neon-blue))]" />
              Blockchain
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/html5">
              <Gamepad2 className="mr-2 h-4 w-4" />
              HTML5 Games
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/leaderboard">
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/activity">
              <ScrollText className="mr-2 h-4 w-4" />
              Activity
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

