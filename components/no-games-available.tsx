import { Card, CardContent } from "@/components/ui/card"
import { Gamepad2 } from "lucide-react"

export function NoGamesAvailable() {
  return (
    <Card className="w-full bg-muted/50 border-dashed border-2 border-muted-foreground/25 hover:bg-muted/70 transition-colors">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Gamepad2 className="w-16 h-16 text-primary mb-4 animate-pulse" />
        <p className="text-xl font-semibold text-primary mb-2">No games available</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Be the first to create an exciting game in this category and start earning!
        </p>
      </CardContent>
    </Card>
  )
}

