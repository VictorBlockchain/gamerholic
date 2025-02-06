import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Home, Search, Gamepad } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary neon-glow">404 - Page Not Found</h1>
        <p className="text-xl mb-8">Oops! It looks like this game level doesn't exist.</p>
        <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-lg neon-border-1">
          <p className="mb-6">Don't worry, you can try these power-ups to get back in the game:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/">
              <Button className="w-full cyberpunk-button">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link href="/discover">
              <Button className="w-full cyberpunk-button">
                <Search className="mr-2 h-4 w-4" />
                Discover
              </Button>
            </Link>
            <Link href="/games">
              <Button className="w-full cyberpunk-button">
                <Gamepad className="mr-2 h-4 w-4" />
                Games
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

