import { Button } from "@/components/ui/button"
import { Gamepad2 } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="py-16 sm:py-24 px-4 text-center relative overflow-hiddenrounded-lg shadow-2xl mb-12">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      <h1
        className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 sm:mb-8 text-transparent text-white neon-glow glitch-effect"
        data-text="I Win For A Living"
      >
        I Win For A Living
      </h1>
      <p className="text-xl sm:text-2xl mb-8 sm:mb-10 max-w-2xl mx-auto text-gray-300">
        High Score Arcade: earn $$ when others fail to beat your score <br/><br/>+ esports: heads up games & tournaments
      </p>
    </section>
  )
}

