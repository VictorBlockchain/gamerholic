'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ChallengeCard from '@/components/cards/ChallengeCard'
import TournamentCard from '@/components/cards/TournamentCard'
import { supabase } from '@/lib/supabase'
import { ZERO_ADDRESS } from '@/lib/tokens'
import { GamingCard } from '@/components/ui/gaming-card'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  ArrowRight,
  Trophy,
  Gamepad2,
  Users,
  Coins,
  Swords,
  RadioTower,
  ShieldCheck,
  PlusCircle,
  Wallet,
} from 'lucide-react'
import StyledExplainer from '@/components/home/StyledExpliner'
import {
  getChallengeFactoryAddress,
  getTournamentFactoryAddress,
  getBlockExplorer,
  isMainnet,
} from '@/lib/contract-addresses'
import mainnetDeployment from '../../../contracts/deployments/mainnet.json'

function Explainer({
  trigger,
  title,
  description,
  icon,
  bullets,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  icon: React.ReactNode
  bullets: string[]
}) {
  const isMobile = useIsMobile()
  const Content = (
    <div className="w-[360px] rounded-xl border border-amber-500/30 bg-gradient-to-br from-gray-900 via-gray-900 to-black p-5 shadow-2xl sm:w-[440px]">
      <div className="mb-3 flex items-start gap-3">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/15 p-2">{icon}</div>
        <div className="flex-1">
          <h3 className="font-gaming text-lg font-bold text-white">{title}</h3>
          <p className="font-body text-sm text-amber-200">{description}</p>
        </div>
      </div>
      <ul className="grid gap-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-amber-100">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger className="block cursor-pointer">{trigger}</PopoverTrigger>
        <PopoverContent
          side="top"
          sideOffset={10}
          align="center"
          avoidCollisions={false}
          className="border-none bg-transparent p-0 shadow-none"
        >
          {Content}
        </PopoverContent>
      </Popover>
    )
  }
  return (
    <HoverCard openDelay={80} closeDelay={100}>
      <HoverCardTrigger className="block cursor-pointer">{trigger}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        sideOffset={10}
        align="center"
        avoidCollisions={false}
        className="border-none bg-transparent p-0 shadow-none"
      >
        {Content}
      </HoverCardContent>
    </HoverCard>
  )
}

// Helper component for the Verified Contracts Section
function CopyButton({ textToCopy, children }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (copied) return
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
        copied
          ? 'border-green-500/50 bg-green-500/10 text-green-300'
          : 'border-gray-700 bg-gray-800/60 text-gray-200 hover:bg-gray-800'
      }`}
    >
      {copied ? 'Copied!' : children}
    </button>
  )
}

// Helper component for the Verified Contracts Section
function ContractCard({ contract, explorerBase }) {
  const explorerUrl = `${explorerBase.replace(/\/$/, '')}/address/${contract.address}?tab=contract`
  const shorten = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/70 to-black p-5 shadow-lg transition-shadow duration-300 hover:shadow-xl">
      <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_60%)]" />
      </div>

      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10">
            <RadioTower className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-200">{contract.name}</p>
            <p className="text-[11px] text-gray-500">Mainnet</p>
          </div>
        </div>
        <div className="rounded-md border border-green-500/30 bg-green-500/10 px-2 py-0.5">
          <span className="text-[10px] font-medium text-green-400">Verified</span>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-black/30 p-3">
        <p className="font-mono text-xs text-indigo-300">{shorten(contract.address)}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
        >
          Open on Seitrace
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
        <CopyButton textToCopy={contract.address}>Copy address</CopyButton>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const handleViewChallenge = (id: string) => {
    console.log('Viewing challenge:', id)
  }
  const explorerBase = getBlockExplorer()
  const challengeFactoryAddr = getChallengeFactoryAddress()
  const tournamentFactoryAddr = getTournamentFactoryAddress()
  const tournamentDeployerAddr = (mainnetDeployment?.contracts?.TournamentDeployer?.address ??
    '') as string
  const verifiedContracts = [
    { name: 'ChallengeFactory', address: challengeFactoryAddr },
    { name: 'TournamentFactory', address: tournamentFactoryAddr },
    { name: 'TournamentDeployer', address: tournamentDeployerAddr },
  ].filter((c) => c.address && /^0x[a-fA-F0-9]{40}$/.test(c.address))
  const shorten = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

  // Lightweight tournaments fetch to show available tournaments like tournaments page
  type TournamentRow = {
    contract_address: string
    creator: string
    entry_fee: string | number | null
    max_participants: number | null
    created_at: string | null
    game_type: string | null
    metadata: any
    pay_token: string | null
    is_ffa: boolean | null
    status: number | null
    total_prize_pool: string | number | null
    participants: any
    xft_to_join: number | null
  }

  type UiStatus = 'ACTIVE' | 'STARTED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

  const weiToEth = (v?: string | number | null) => {
    if (!v) return 0
    const n = typeof v === 'string' ? Number(v) : Number(v)
    if (!Number.isFinite(n)) return 0
    return n / 1e18
  }

  const mapStatusToUi = (s?: number | null): UiStatus => {
    switch (Number(s ?? 0)) {
      case 0:
        return 'ACTIVE'
      case 1:
        return 'STARTED'
      case 2:
        return 'COMPLETED'
      case 3:
        return 'DISPUTED'
      case 4:
        return 'CANCELLED'
      default:
        return 'ACTIVE'
    }
  }

  const [tournamentRows, setTournamentRows] = React.useState<TournamentRow[]>([])
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('tournaments')
          .select(
            'contract_address, creator, entry_fee, max_participants, created_at, game_type, metadata, pay_token, is_ffa, status, total_prize_pool, participants',
          )
          .order('created_at', { ascending: false })
          .limit(6)
        if (error) throw error
        const normalized: TournamentRow[] = (data || []).map((d: any) => ({
          contract_address: d?.contract_address ?? '',
          creator: d?.creator ?? '',
          entry_fee: d?.entry_fee ?? null,
          max_participants: d?.max_participants ?? null,
          created_at: d?.created_at ?? null,
          game_type: d?.game_type ?? null,
          metadata: d?.metadata ?? {},
          pay_token: d?.pay_token ?? null,
          is_ffa: d?.is_ffa ?? null,
          status: d?.status ?? null,
          total_prize_pool: d?.total_prize_pool ?? null,
          participants: d?.participants ?? [],
          xft_to_join: d?.xft_to_join ?? null,
        }))
        if (!cancelled) setTournamentRows(normalized)
      } catch (e) {
        console.warn('Failed to load tournaments for Home:', e)
        if (!cancelled) setTournamentRows([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const homeTournaments = React.useMemo(() => {
    const upcomingRows = (tournamentRows || []).filter((r) => {
      try {
        const md = r.metadata || {}
        const sd = md?.startDate ? String(md.startDate).trim() : ''
        const st = md?.startTime ? String(md.startTime).trim() : ''
        if (!sd) return false
        const dateStr = st ? `${sd} ${st}` : sd
        const startAt = new Date(dateStr)
        if (isNaN(startAt.getTime())) return false
        return startAt.getTime() > Date.now()
      } catch {
        return false
      }
    })
    return upcomingRows.map((r) => {
      let title = r.game_type || ''
      let consoleName = ''
      let image = '/logo.png'
      let startDate = ''
      try {
        const md = r.metadata || {}
        title = String(md?.title || md?.game || title || '').trim()
        consoleName = String(md?.console || '').trim()
        startDate = md?.startDate
          ? String(md.startDate) + (md?.startTime ? ` ${String(md.startTime)}` : '')
          : ''
      } catch {}
      const entry = weiToEth(r.entry_fee)
      const isNative = String(r.pay_token || '').toLowerCase() === ZERO_ADDRESS.toLowerCase()
      const playersCurrent = Array.isArray(r?.participants) ? r.participants.length : 0
      const max = Number(r.max_participants || 0) || 0
      const prize = weiToEth(r.total_prize_pool)
      const type: 'bracket' | 'free-for-all' = r.is_ffa ? 'free-for-all' : 'bracket'
      const uiStatus = mapStatusToUi(r.status)
      const createdIso = r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString()
      return {
        id: r.contract_address,
        game: { name: title || r.game_type || '', console: consoleName, image },
        type,
        entryFee: { sei: isNative ? entry : 0, gamer: isNative ? 0 : entry },
        players: { current: playersCurrent, max },
        startDate: (startDate || createdIso).slice(0, 10),
        host: r.creator,
        status: uiStatus,
        prize,
      }
    })
  }, [tournamentRows])

  const handleViewTournament = (id: string) => router.push(`/tournaments/${id}`)

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_60%)]" />
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="mb-9 text-center md:mb-9">
            <span className="font-body mb-4 inline-block text-[11px] tracking-[0.2em] text-amber-400/80 uppercase sm:text-xs">
              I Win For A Living
            </span>
            <div className="relative mx-auto mb-6 h-20 w-20 overflow-hidden rounded-full border-[3px] border-orange-500 md:mb-8 md:h-32 md:w-32">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-amber-500 to-orange-600 opacity-50 blur-xl" />
              <Image
                src="/logo.png"
                alt="Gamerholic Logo"
                fill
                priority
                sizes="(min-width:768px) 128px, 80px"
                className="object-cover"
              />
            </div>
            <h1 className="font-gaming mb-2 bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-500 bg-clip-text text-3xl font-black text-transparent sm:text-4xl md:text-5xl">
              Play. Win. Get Paid.
            </h1>

            {/* Centered "Create" buttons with battle, trophy, and group icons */}
            <div className="mt-6 hidden justify-center md:flex">
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/create">
                      <Button
                        size="icon"
                        aria-label="Send Challenge"
                        className="btn-xbox-green group relative flex !size-12 items-center justify-center overflow-hidden !rounded-full p-0"
                      >
                        <Swords className="relative z-10 h-5 w-5" />
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-0" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="border border-green-500/30 bg-black/90 px-3 py-1 text-xs text-green-300"
                  >
                    Send Challenge
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/create">
                      <Button
                        size="icon"
                        aria-label="Create Tournament"
                        className="btn-xbox-yellow group relative flex !size-12 items-center justify-center overflow-hidden !rounded-full p-0"
                      >
                        <Trophy className="relative z-10 h-5 w-5" />
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-0" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="border border-amber-500/30 bg-black/90 px-3 py-1 text-xs text-amber-300"
                  >
                    Create Tournament
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/create">
                      <Button
                        size="icon"
                        aria-label="Create Team"
                        className="btn-xbox-blue group relative flex !size-12 items-center justify-center overflow-hidden !rounded-full p-0"
                      >
                        <Users className="relative z-10 h-5 w-5" />
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-0" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="border border-blue-500/30 bg-black/90 px-3 py-1 text-xs text-blue-300"
                  >
                    Create Team
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Smooth gamer divider */}
            <div className="mt-8 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent md:mt-10" />

            {/* Fun selling point cards */}
            <div className="mt-8 md:mt-10 md:rounded-2xl md:border md:border-amber-500/20 md:bg-black/30 md:p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <StyledExplainer
                  title="Free Tournaments"
                  description="Daily brackets with no entry fee."
                  icon={<Trophy className="h-6 w-6 text-amber-400" />}
                  bullets={[
                    'Win SEI or Gamer tokens',
                    'Leaderboard rewards',
                    'Zero cost, high hype',
                  ]}
                  trigger={
                    <GamingCard
                      variant="victory"
                      glow={false}
                      className="group relative overflow-hidden p-4"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 shadow-lg ring-1 shadow-amber-500/10 ring-amber-500/35 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-[1px] group-hover:scale-105 group-hover:shadow-amber-500/25 group-hover:ring-amber-500/50">
                          <Trophy className="h-6 w-6 text-amber-400" />
                          <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-transparent via-amber-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="mt-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-amber-500/60 via-amber-400/60 to-amber-500/60 opacity-90" />
                        <p className="text-sm leading-tight font-medium tracking-wide text-amber-100">
                          free tournaments
                        </p>
                      </div>
                    </GamingCard>
                  }
                />

                <StyledExplainer
                  title="Heads‑Up Challenges"
                  description="1v1 battles vs friends or rivals."
                  icon={<Swords className="h-6 w-6 text-amber-400" />}
                  bullets={[
                    'Set stakes in SEI or Gamer',
                    'Custom rules & maps',
                    'Instant bragging rights',
                  ]}
                  trigger={
                    <GamingCard
                      variant="power"
                      glow={false}
                      className="group relative overflow-hidden p-4"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/15 shadow-lg ring-1 shadow-purple-500/10 ring-purple-500/35 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-[1px] group-hover:scale-105 group-hover:shadow-purple-500/25 group-hover:ring-purple-500/50">
                          <Swords className="h-6 w-6 text-amber-400" />
                          <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-transparent via-purple-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="mt-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-purple-500/60 via-pink-500/60 to-purple-500/60 opacity-90" />
                        <p className="text-sm leading-tight font-medium tracking-wide text-amber-100">
                          Heads‑up vs friends
                        </p>
                      </div>
                    </GamingCard>
                  }
                />
                <StyledExplainer
                  title="On‑Chain Gaming"
                  description="Every challenge is secured by a contract."
                  icon={<ShieldCheck className="h-6 w-6 text-amber-400" />}
                  bullets={['Transparent outcomes', 'Auditable payouts', 'Trustless match records']}
                  trigger={
                    <GamingCard
                      variant="mystic"
                      glow={false}
                      className="group relative overflow-hidden p-4"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/15 shadow-lg ring-1 shadow-cyan-500/10 ring-cyan-500/35 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-[1px] group-hover:scale-105 group-hover:shadow-cyan-500/25 group-hover:ring-cyan-500/50">
                          <ShieldCheck className="h-6 w-6 text-amber-400" />
                          <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="mt-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-cyan-500/60 via-teal-500/60 to-cyan-500/60 opacity-90" />
                        <p className="text-sm leading-tight font-medium tracking-wide text-amber-100">
                          On‑chain gaming
                        </p>
                      </div>
                    </GamingCard>
                  }
                />
                <StyledExplainer
                  title="Free Tournaments"
                  description="Daily brackets with no entry fee."
                  icon={<Trophy className="h-6 w-6 text-white" />}
                  bullets={[
                    'Win SEI or Gamer tokens',
                    'Leaderboard rewards',
                    'Zero cost, high hype',
                  ]}
                  trigger={
                    <GamingCard
                      variant="victory"
                      glow={false}
                      className="group relative overflow-hidden p-4"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/15 shadow-lg ring-1 shadow-violet-500/10 ring-violet-500/35 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-[1px] group-hover:scale-105 group-hover:shadow-violet-500/25 group-hover:ring-violet-500/50">
                          <PlusCircle className="h-6 w-6 text-amber-400" />
                          <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-transparent via-violet-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="mt-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-violet-500/60 via-indigo-500/60 to-violet-500/60 opacity-90" />
                        <p className="text-sm leading-tight font-medium tracking-wide text-amber-100">
                          Tourny hosts paid
                        </p>
                      </div>
                    </GamingCard>
                  }
                />

                <StyledExplainer
                  title="Heads‑Up Challenges"
                  description="1v1 battles vs friends or rivals."
                  icon={<Swords className="h-6 w-6 text-white" />}
                  bullets={[
                    'Set stakes in SEI or Gamer',
                    'Custom rules & maps',
                    'Instant bragging rights',
                  ]}
                  trigger={
                    <GamingCard
                      variant="power"
                      glow={false}
                      className="group relative overflow-hidden p-4"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gray-500/40 bg-gray-500/15 shadow-lg ring-1 shadow-gray-500/10 ring-gray-500/35 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-[1px] group-hover:scale-105 group-hover:shadow-gray-500/25 group-hover:ring-gray-500/50">
                          <RadioTower className="h-6 w-6 text-amber-400" />
                          <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-transparent via-gray-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="mt-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-gray-500/60 via-gray-400/60 to-gray-500/60 opacity-90" />
                        <p className="text-sm leading-tight font-medium tracking-wide text-amber-100">
                          Stream your matches
                        </p>
                      </div>
                    </GamingCard>
                  }
                />

                <StyledExplainer
                  title="Contract Address"
                  description="Every challenge exposes its address for donations."
                  icon={<Wallet className="h-6 w-6 text-white" />}
                  bullets={[
                    'Open to viewer tips',
                    'Auditable on chain',
                    'Support your favorite players',
                  ]}
                  trigger={
                    <GamingCard
                      variant="victory"
                      glow={false}
                      className="group relative overflow-hidden p-4 sm:col-span-3"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15 shadow-lg ring-1 shadow-amber-500/10 ring-amber-500/35 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-[1px] group-hover:scale-105 group-hover:shadow-amber-500/25 group-hover:ring-amber-500/50">
                          <Wallet className="h-6 w-6 text-amber-400" />
                          <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-transparent via-amber-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="mt-1 h-0.5 w-10 rounded-full bg-gradient-to-r from-amber-500/60 via-orange-500/60 to-amber-500/60 opacity-90" />
                        <p className="text-sm leading-tight font-medium text-amber-100">
                          challenge wallets
                        </p>
                      </div>
                    </GamingCard>
                  }
                />
              </div>
            </div>

            {/* Lower divider for visual rhythm */}
            <div className="mt-6 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          </div>
        </div>
      </section>

      {/* Featured Challenges Section */}
      <section>
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-gaming text-3xl leading-tight font-black tracking-tight text-white md:text-4xl">
              Featured Tournaments
            </h2>

            <div className="mt-3 flex items-center justify-center gap-1">
              <span className="block h-[3px] w-[3px] rounded-sm bg-amber-400/40" />
              <span className="block h-px w-28 rounded-full bg-gradient-to-r from-amber-400/40 via-amber-300/20 to-amber-400/40 shadow-[0_0_6px_rgba(245,158,11,0.15)]" />
              <span className="block h-[3px] w-[3px] rounded-sm bg-amber-400/40" />
            </div>

            <p className="font-body mx-auto mt-3 max-w-xl text-lg text-gray-300">
              Jump into the action with these hot battles
            </p>
          </div>

          {homeTournaments.length === 0 ? (
            <div className="group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-amber-900/10 to-slate-900 p-8 text-center shadow-2xl transition-all duration-300 group-hover:scale-[1.02]">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 bg-[url('/grid.svg')] [mask-image:linear-gradient(to_bottom,rgba(251,191,36,0.05),transparent_50%,transparent)] bg-center opacity-5"></div>

              {/* Animated Icon Container */}
              <div className="mb-4 flex items-center justify-center">
                <div className="relative">
                  {/* Animated Glow */}
                  <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/20 blur-xl"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-600/20 to-orange-600/20 shadow-lg shadow-amber-500/50">
                    <Trophy className="h-8 w-8 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-white">No Tournaments Yet</h3>
                <p className="mx-auto max-w-md text-lg leading-relaxed text-gray-300">
                  Be the first to host. Create your own tournaments, set the rules, and let the
                  games begin.
                </p>

                {/* Prominent CTA */}
                <div className="flex items-center justify-center">
                  <Link href="/tournament/create">
                    <Button
                      size="lg"
                      className="group relative overflow-hidden rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/40"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <PlusCircle className="h-5 w-5" />
                        CREATE TOURNAMENT
                      </span>
                      {/* Shining Effect */}
                      <div className="absolute inset-0 -z-10 translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent transition-transform duration-700 group-hover:translate-x-0"></div>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
              {homeTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onViewTournament={handleViewTournament}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-12 bg-gradient-to-b from-transparent to-amber-500/5 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-gaming text-3xl leading-tight font-black tracking-tight text-white md:text-4xl">
              OnChain Gaming
            </h2>

            <div className="mt-3 flex items-center justify-center gap-1">
              <span className="block h-[3px] w-[3px] rounded-sm bg-amber-400/40" />
              <span className="block h-px w-28 rounded-full bg-gradient-to-r from-amber-400/40 via-amber-300/20 to-amber-400/40 shadow-[0_0_6px_rgba(245,158,11,0.15)]" />
              <span className="block h-[3px] w-[3px] rounded-sm bg-amber-400/40" />
            </div>

            <p className="font-body mx-auto mt-3 max-w-xl text-lg text-gray-300">
              Win For A Living
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
            {/* Card 1: Contract Address */}
            <div className="group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-amber-900/10 to-slate-900 p-px shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-amber-500/20">
              {/* Animated Glow Background */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/20 via-orange-600/10 to-amber-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              {/* Scanline Effect */}
              <div className="absolute inset-0 -z-10">
                <div className="animate-scanline h-full w-full bg-[linear-gradient(to_top,transparent_50%,rgba(251,191,36,0.05)_50%,transparent_51%)] bg-[length:100%_200%]"></div>
              </div>
              <div className="relative flex h-full flex-col items-center justify-center rounded-3xl bg-slate-950/80 p-8 backdrop-blur-sm">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/20 blur-xl"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-600/20 to-orange-600/20 shadow-lg shadow-amber-500/50">
                    <Wallet className="h-8 w-8 text-amber-400" />
                  </div>
                </div>
                <h3 className="mb-3 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-2xl font-black text-transparent">
                  Contract Address
                </h3>
                <p className="text-sm leading-relaxed font-medium text-gray-300">
                  Every Challenge, Tournament gets a unique, on-chain contract address.
                </p>
              </div>
            </div>

            {/* Card 2: Prize Pots Grow */}
            <div className="group relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-cyan-900/10 to-slate-900 p-px shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-cyan-500/20">
              {/* Animated Glow Background */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-cyan-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              {/* Scanline Effect */}
              <div className="absolute inset-0 -z-10">
                <div className="animate-scanline h-full w-full bg-[linear-gradient(to_top,transparent_50%,rgba(6,182,212,0.05)_50%,transparent_51%)] bg-[length:100%_200%]"></div>
              </div>
              <div className="relative flex h-full flex-col items-center justify-center rounded-3xl bg-slate-950/80 p-8 backdrop-blur-sm">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-500/20 blur-xl"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/50 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 shadow-lg shadow-cyan-500/50">
                    <Coins className="h-8 w-8 text-cyan-400" />
                  </div>
                </div>
                <h3 className="mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-2xl font-black text-transparent">
                  Prize Pots Grow
                </h3>
                <p className="text-sm leading-relaxed font-medium text-gray-300">
                  Prize pots grow in real-time with community donations and support.
                </p>
              </div>
            </div>

            {/* Card 3: Free Tournament Pass */}
            <div className="group relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 p-px shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-purple-500/20">
              {/* Animated Glow Background */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/20 via-pink-600/10 to-purple-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              {/* Scanline Effect */}
              <div className="absolute inset-0 -z-10">
                <div className="animate-scanline h-full w-full bg-[linear-gradient(to_top,transparent_50%,rgba(168,85,247,0.05)_50%,transparent_51%)] bg-[length:100%_200%]"></div>
              </div>
              <div className="relative flex h-full flex-col items-center justify-center rounded-3xl bg-slate-950/80 p-8 backdrop-blur-sm">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-purple-500/20 blur-xl"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-600/20 to-pink-600/20 shadow-lg shadow-purple-500/50">
                    <Trophy className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
                <h3 className="mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-2xl font-black text-transparent">
                  Free Tournaments
                </h3>
                <p className="text-sm leading-relaxed font-medium text-gray-300">
                  Join exclusive free tournaments using your NFT tournament pass.
                </p>
              </div>
            </div>
          </div>

          {/* Add this to your global CSS file for the scanline animation */}
          <style jsx>{`
            @keyframes scanline {
              0% {
                background-position: 0 100%;
              }
              100% {
                background-position: 0 -200%;
              }
            }
            .animate-scanline {
              animation: scanline 8s linear infinite;
            }
          `}</style>
        </div>
      </section>

      {/* Social links section - Redesigned */}
      <div className="relative my-16 flex items-center justify-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-8 items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-slate-900/80 px-4 backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
            <span className="text-xs font-semibold tracking-widest text-amber-400/80 uppercase">
              Connect
            </span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
          </div>
        </div>
      </div>

      {/* Social links section - Redesigned */}
      <section className="relative flex flex-col items-center gap-8 pb-24">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-64 w-64 rounded-full bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-purple-500/20 blur-3xl"></div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="mb-2 bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400 bg-clip-text text-base font-black tracking-[0.3em] text-transparent uppercase">
            Join The Community
          </p>
          <p className="text-sm text-gray-400">
            Get the latest updates and connect with other gamers
          </p>
        </div>

        {/* Social Links */}
        <div className="flex gap-6">
          {/* Discord Link */}
          <a
            href="https://discord.gg/rgbDcMXtEb"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
            aria-label="Discord"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 blur transition-all duration-300 group-hover:opacity-75 group-hover:duration-200"></div>
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-indigo-500/40 bg-slate-900/80 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
              <svg
                className="h-6 w-6 text-indigo-300 transition-colors duration-300 group-hover:text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.033.096a16.364 16.364 0 0 0 1.225 1.993a.078.078 0 0 0 .084.028a19.819 19.819 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
          </a>

          {/* Telegram Link */}
          <a
            href="https://t.me/gamerholix"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
            aria-label="Telegram"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 blur transition-all duration-300 group-hover:opacity-75 group-hover:duration-200"></div>
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/80 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
              <svg
                className="h-6 w-6 text-cyan-300 transition-colors duration-300 group-hover:text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </div>
          </a>

          {/* X (formerly Twitter) Link - NEW */}
          <a
            href="https://x.com/gamerholic_sei"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
            aria-label="X (formerly Twitter)"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-400 to-zinc-300 opacity-0 blur transition-all duration-300 group-hover:opacity-75 group-hover:duration-200"></div>
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-500/40 bg-slate-900/80 backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
              <svg
                className="h-6 w-6 text-slate-300 transition-colors duration-300 group-hover:text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
          </a>
        </div>
      </section>

      {/* Verified Contracts Section */}
      <section className="relative mt-16 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />
        <div className="relative container mx-auto px-4">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1">
              <ShieldCheck className="h-4 w-4 text-indigo-300" />
              <span className="text-xs font-medium tracking-wide text-indigo-200">
                Source Verified
              </span>
            </div>
            <h2 className="font-gaming mt-3 bg-gradient-to-r from-indigo-300 via-rose-300 to-amber-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              Verified Smart Contracts
            </h2>
            <p className="mt-2 text-sm text-gray-400">On Sei mainnet via Seitrace explorer</p>
          </div>

          {verifiedContracts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {verifiedContracts.map((contract) => (
                <ContractCard key={contract.name} contract={contract} explorerBase={explorerBase} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center backdrop-blur-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gray-700 bg-gray-800">
                <ShieldCheck className="h-8 w-8 text-gray-600" />
              </div>
              <p className="mt-4 text-sm text-gray-400">
                {isMainnet()
                  ? 'No verified contracts found in deployment JSON.'
                  : 'Switch to mainnet to view verified contracts.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
