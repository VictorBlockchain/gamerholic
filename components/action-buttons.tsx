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
        className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full "
        size="lg"
        onClick={onSlap}
      >
       Slap ({slaps})
      </Button>
      <Button
        className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFC300] hover:to-[#FF8C00] text-black font-medium rounded-full"
        size="lg"
        onClick={onGrab}
      >
        Grab ({grabs})
      </Button>
      <Button
        className="bg-gradient-to-r from-[#00FFA9] to-[#00C3FF] hover:from-[#00D48F] hover:to-[#00A3DF] text-black font-medium rounded-full "
        size="lg"
        onClick={onSneak}
      >
        Sneak ({sneaks})
      </Button>
    </div>
  )
}

