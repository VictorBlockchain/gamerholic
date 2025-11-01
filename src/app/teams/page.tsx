import { Button } from '@/components/ui/button'
import { Users, Plus, ArrowRight, Sparkles, Zap, ExternalLink } from 'lucide-react'

export default function TeamsComingSoon() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black pt-24">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.1),transparent_70%)]">
        <div className="absolute inset-0 bg-[url('/grid.svg')] [mask-image:linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_40%,transparent)] bg-center opacity-20"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Glowing Title */}
        <h1 className="font-gaming mx-auto mb-6 max-w-2xl animate-pulse bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-5xl font-black text-transparent md:text-7xl">
          TEAMS
        </h1>

        {/* Hype Text */}
        <p className="mx-auto mb-12 max-w-2xl text-lg font-medium text-gray-300 md:text-xl">
          Assemble your squad. Dominate the arena. The ultimate team-based combat experience is on
          the horizon.
        </p>

        {/* Interactive Team Formation Visual */}
        <div className="relative mx-auto mb-12 h-64 w-64 md:h-80 md:w-80">
          {/* Connection Lines */}
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="url(#gradient1)" strokeWidth="2" />
            <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="url(#gradient1)" strokeWidth="2" />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Player 1 */}
          <div className="absolute top-0 left-0 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 md:h-24 md:w-24">
            <Users className="h-8 w-8 text-cyan-400 md:h-10 md:w-10" />
          </div>

          {/* Player 2 */}
          <div className="absolute top-0 right-0 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/50 to-pink-900/50 md:h-24 md:w-24">
            <Users className="h-8 w-8 text-purple-400 md:h-10 md:w-10" />
          </div>

          {/* Central "Join" Slot */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div className="group relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-amber-500/50 bg-gradient-to-br from-amber-900/50 to-orange-900/50 transition-all duration-300 hover:scale-110 md:h-28 md:w-28">
              <Plus className="h-8 w-8 text-amber-400 md:h-10 md:w-10" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </div>

        {/* X Follow CTA */}
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
          <p className="text-lg font-medium text-gray-300">Follow us on X to join the waitlist!</p>
          <a
            href="https://x.com/gamerholic_sei"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full"
          >
            <Button
              size="lg"
              className="w-full rounded-xl border-2 border-white bg-black py-4 text-lg font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-gray-900"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Follow @gamerholic_sei
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </a>
        </div>

        {/* Footer Info */}
        <p className="mt-8 text-xs text-gray-500">
          <Sparkles className="mr-1 inline-block h-3 w-3" />
          Get the latest updates and be the first to know when the gates open.
        </p>
      </div>
    </section>
  )
}
