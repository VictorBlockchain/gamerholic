import { Button } from "@/components/ui/button"
import { Hand, Grab, Footprints } from "lucide-react"

interface ActionButtonsProps {
  onSlap: () => Promise<void>
  onGrab: () => Promise<void>
  onSneak: () => Promise<void>
  grabs: number
  slaps:number
  sneaks: number
}

export function ActionButtons({ onSlap, onGrab, onSneak, grabs, slaps, sneaks }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Button
        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
        size="lg"
        onClick={onSlap}
      >
        <Hand className="mr-2 h-5 w-5" /> Slap ({slaps})
      </Button>
      <Button
        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
        size="lg"
        onClick={onGrab}
      >
        <Grab className="mr-2 h-5 w-5" /> Grab ({grabs})
      </Button>
      <Button
        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
        size="lg"
        onClick={onSneak}
      >
        <Footprints className="mr-2 h-5 w-5" /> Sneak ({sneaks})
      </Button>
    </div>
  )
}

