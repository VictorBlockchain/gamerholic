'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trophy,
  Sword,
  Menu,
  X,
  Wallet,
  User,
  Target,
  Users,
  Link as LinkIcon,
  LogOut,
  Network,
  Crown,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import HeaderLogoClient from './HeaderLogoClient'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { useGamerProfile } from '@/context/GamerProfileContext'
import { getNetworkConfig } from '@/lib/config/deployment'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface HeaderProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function Header({ activeTab = 'challenges', onTabChange }: HeaderProps) {
  const { user, handleLogOut } = useDynamicContext()
  const { address, profile } = useGamerProfile()
  const net = getNetworkConfig()
  const { toast } = useToast()
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const level = (profile as any)?.level ?? 1
  const xp = level * 100
  const nextLevelXp = xp + 100
  const progressPct = Math.min(100, Math.round((xp / nextLevelXp) * 100))

  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Ensure SSR/CSR markup matches by deferring user-dependent UI until after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    {
      id: 'challenges',
      label: 'Challenges',
      icon: Sword,
      gradient: 'from-yellow-500 to-amber-600',
      description: 'Head-to-head battles',
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      icon: Trophy,
      gradient: 'from-amber-500 to-orange-600',
      description: 'Compete for glory',
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: Users,
      gradient: 'from-orange-500 to-red-600',
      description: 'Team battles',
    },
  ]

  const handleNavClick = (tab: string) => {
    if (tab === 'challenges') {
      router.push('/challenges')
    } else if (tab === 'tournaments') {
      router.push('/tournaments')
    } else if (tab === 'teams') {
      router.push('/teams')
    } else if (tab === 'profile') {
      router.push('/profile')
    } else {
      onTabChange?.(tab)
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-40 transition-all duration-300',
          isScrolled
            ? 'border-b border-black bg-black/90 backdrop-blur-xl'
            : 'border-b border-black bg-gradient-to-b from-black/80 via-black/70 to-black/60',
        )}
      >
        {/* Animated top border with gaming flair */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-600 shadow-lg shadow-amber-500/50">
          <div className="h-full animate-pulse bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
        </div>
        <div className="absolute top-1 right-0 left-0 h-px bg-gradient-to-r from-yellow-400/60 via-amber-400/80 to-orange-400/60" />

        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand - Gaming Theme */}
            <div className="mt-3 flex items-center gap-3">
              <div className="group relative">
                <HeaderLogoClient />
              </div>
              <div className="hidden sm:block">
                <h1 className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-2xl font-black tracking-tight text-transparent">
                  GAMERHOLIC
                </h1>
              </div>
              <div className="sm:hidden">
                <h1 className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-lg font-black text-transparent">
                  GAMERHOLIC
                </h1>
              </div>
            </div>

            {/* Desktop Navigation - Gaming Style */}
            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <div key={item.id} className="group relative">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        'group relative rounded-xl px-4 py-2 transition-all duration-300',
                        isActive
                          ? 'border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 shadow-lg shadow-yellow-500/20'
                          : 'border border-transparent hover:border-yellow-500/20 hover:bg-white/5',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Icon
                            className={cn(
                              'h-4 w-4 transition-all duration-300',
                              isActive
                                ? 'text-yellow-400'
                                : 'text-white/70 group-hover:text-yellow-400',
                            )}
                          />
                          {isActive && (
                            <div className="absolute inset-0 animate-pulse bg-yellow-400/20 blur-sm" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm font-bold transition-all duration-300',
                            isActive
                              ? 'text-yellow-400'
                              : 'text-white/70 group-hover:text-yellow-400',
                          )}
                        >
                          {item.label}
                        </span>
                      </div>

                      {/* Active indicator with gaming flair */}
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
                          <div className="h-1 w-1 animate-pulse rounded-full bg-yellow-400" />
                          <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400" />
                          <div className="h-1 w-1 animate-pulse rounded-full bg-yellow-400" />
                        </div>
                      )}
                    </button>

                    {/* Hover tooltip */}
                    {!isActive && (
                      <div className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-lg border border-yellow-500/30 bg-black/90 px-3 py-1 whitespace-nowrap opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                        <p className="text-xs font-medium text-amber-400">{item.description}</p>
                        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-t border-l border-yellow-500/30 bg-yellow-500" />
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Right side actions - Gaming Theme */}
            <div className="flex items-center gap-2">
              {/* Wallet Modal Trigger */}
              {!mounted || !user ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        aria-label="Open wallet connect modal"
                        className="group relative flex h-9 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-500 to-yellow-500 px-4 font-bold text-black transition-all duration-300 hover:scale-105"
                      >
                        <Wallet className="h-4 w-4" />
                        <span className="hidden sm:inline">Connect Wallet</span>
                      </Button>
                    </DialogTrigger>

                    {/* This wrapper ensures the modal is perfectly centered on the screen */}
                    <DialogContent
                      className="animate-fade-in-up fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-amber-500 bg-black p-0 text-center shadow-2xl"
                      showCloseButton={false}
                    >
                      {/* Top Accent Bar */}
                      <div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500"></div>

                      <div className="p-6 sm:p-8">
                        {/* Close Button */}
                        <DialogClose className="absolute top-4 right-4 rounded-full border border-gray-600 p-2 text-gray-400 transition-colors hover:border-amber-500 hover:text-amber-300">
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close</span>
                        </DialogClose>

                        {/* Main Content */}
                        <div className="space-y-6">
                          {/* Fun Icon */}
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-amber-500 bg-gradient-to-br from-amber-400 to-yellow-500">
                            <Wallet className="h-8 w-8 text-black" />
                          </div>

                          {/* Welcoming Title */}
                          <DialogTitle className="text-2xl font-black text-white">
                            Ready to Play?
                          </DialogTitle>

                          {/* Engaging Description */}
                          <DialogDescription className="text-base font-medium text-gray-400">
                            Connect your wallet to enter the arena, challenge rivals, and claim your
                            rewards.
                          </DialogDescription>

                          {/* Prominent CTA Button */}
                          <div className="pt-4 text-center">
                            <Suspense
                              fallback={
                                <div className="h-12 w-full animate-pulse rounded-xl bg-gray-800"></div>
                              }
                            >
                              <WalletConnectButton />
                            </Suspense>
                          </div>

                          {/* Footer Tip */}
                          <p className="text-xs text-gray-500">
                            New to Web3? Your wallet is your identity and inventory. Keep it safe!
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <style jsx>{`
                    @keyframes fade-in-up {
                      from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                      }
                    }
                    .animate-fade-in-up {
                      animation: fade-in-up 0.3s ease-out;
                    }
                  `}</style>
                </>
              ) : null}

              {/* Profile Dropdown (only when connected) */}
              {mounted && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-white/70 transition-colors duration-300 hover:bg-white/5 hover:text-amber-400"
                    >
                      <div className="relative">
                        <User className="h-4 w-4" />
                        <div className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-black bg-green-400" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="min-w-[20rem] overflow-hidden rounded-2xl border border-gray-700 bg-black text-white"
                    sideOffset={8}
                  >
                    {/* User Identity Section */}
                    <div className="border-b border-gray-800 p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 rounded-xl border-2 border-amber-500">
                          <AvatarImage
                            src={profile?.avatarUrl || '/logo.png'}
                            alt={profile?.username || 'gamer'}
                          />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold text-white">{profile?.username || 'gamer'}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-black">
                              Lv {level}
                            </span>
                            <div className="h-2 flex-1 rounded-full bg-gray-800">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                                style={{ width: `${progressPct}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <DropdownMenuItem
                        asChild
                        className="rounded-lg p-3 transition-colors hover:bg-gray-800 focus:bg-gray-800"
                      >
                        <Link href="/challenge/create" className="flex w-full items-center gap-3">
                          <Sword className="h-4 w-4 text-amber-400" />
                          <span>Create Challenge</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="rounded-lg p-3 transition-colors hover:bg-gray-800 focus:bg-gray-800"
                      >
                        <Link href="/tournament/create" className="flex w-full items-center gap-3">
                          <Trophy className="h-4 w-4 text-amber-400" />
                          <span>Create Tournament</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="rounded-lg p-3 transition-colors hover:bg-gray-800 focus:bg-gray-800"
                      >
                        <Link
                          href={address ? `/profile/${address}/edit` : `/profile`}
                          className="flex w-full items-center gap-3"
                        >
                          <Target className="h-4 w-4 text-amber-400" />
                          <span>Edit Profile</span>
                        </Link>
                      </DropdownMenuItem>

                      {/* Wallet Submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="rounded-lg p-3 transition-colors hover:bg-gray-800 focus:bg-gray-800">
                          <Wallet className="h-4 w-4" />
                          <span>Wallet & Network</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="min-w-[16rem] rounded-xl border border-gray-700 bg-black">
                          <DropdownMenuItem className="p-3 transition-colors hover:bg-gray-800 focus:bg-gray-800">
                            <Network className="h-4 w-4" />
                            <span>Network: {net.name}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (address) {
                                navigator.clipboard.writeText(address)
                                toast({
                                  title: 'Address copied',
                                  description: `${address.slice(0, 6)}...${address.slice(-4)}`,
                                })
                              }
                            }}
                            className="p-3 transition-colors hover:bg-gray-800 focus:bg-gray-800"
                          >
                            <LinkIcon className="h-4 w-4" />
                            <span>Copy Address</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const url = net.blockExplorer
                              if (url) window.open(url, '_blank')
                            }}
                            className="p-3 transition-colors hover:bg-gray-800 focus:bg-gray-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>Open Explorer</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator className="my-2 h-px bg-gray-800" />

                      <DropdownMenuItem
                        onClick={() => router.push(address ? `/profile/${address}` : '/profile')}
                        className="rounded-lg p-3 transition-colors hover:bg-gray-800 focus:bg-gray-800"
                      >
                        <User className="h-4 w-4" />
                        <span>View Profile</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-2 h-px bg-gray-800" />

                      {/* Disconnect Button */}
                      <DropdownMenuItem
                        onClick={() => setDisconnectOpen(true)}
                        className="rounded-lg p-3 text-red-400 transition-colors hover:bg-red-500/10 focus:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Disconnect Wallet</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              {/* Disconnect Confirmation */}
              <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
                {/* This wrapper ensures the dialog is perfectly centered on the screen */}
                <AlertDialogContent className="animate-fade-in-up fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-red-500 bg-black p-0 text-center shadow-2xl">
                  {/* Top Accent Bar - Red for warning/action */}
                  <div className="h-2 bg-gradient-to-r from-red-600 via-orange-600 to-red-600"></div>

                  <div className="p-6 sm:p-8">
                    {/* Close Button */}
                    <AlertDialogCancel className="absolute top-4 right-4 rounded-full border border-gray-600 p-2 text-gray-400 transition-colors hover:border-red-500 hover:text-red-300">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </AlertDialogCancel>

                    {/* Main Content */}
                    <div className="space-y-4">
                      {/* Warning Icon */}
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-red-500 bg-gradient-to-br from-red-600/20 to-orange-600/20">
                        <LogOut className="h-8 w-8 text-red-400" />
                      </div>

                      {/* Title */}
                      <AlertDialogTitle className="text-2xl font-black text-white">
                        Disconnect Wallet?
                      </AlertDialogTitle>

                      {/* Description */}
                      <AlertDialogDescription className="text-base font-medium text-gray-400">
                        You can reconnect anytime from the Wallet button.
                      </AlertDialogDescription>
                    </div>

                    {/* Action Buttons */}
                    <AlertDialogFooter className="mt-6 gap-3 sm:gap-4">
                      <AlertDialogCancel className="flex-1 rounded-xl border border-gray-600 bg-gray-800 py-3 font-semibold text-white transition-colors hover:bg-gray-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="flex-1 rounded-xl border-2 border-red-500 bg-gradient-to-r from-red-600 to-orange-600 py-3 font-semibold text-white transition-all hover:scale-105"
                        onClick={() => {
                          setDisconnectOpen(false)
                          handleLogOut?.()
                        }}
                      >
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </div>
                </AlertDialogContent>
              </AlertDialog>

              {/* Duplicate styled-jsx removed; using the earlier animation styles */}

              {/* Mobile Menu Toggle - Gaming Style */}
              <Button
                variant="ghost"
                size="sm"
                className="group text-white/70 transition-colors duration-300 hover:text-yellow-400 lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <div className="relative">
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 animate-pulse" />
                  ) : (
                    <Menu className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-yellow-400/20 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </Button>
            </div>
          </div>

          {/* Mobile Menu - Gaming Theme */}
          {isMobileMenuOpen && (
            <div className="border-t border-yellow-500/20 bg-black/90 backdrop-blur-xl lg:hidden">
              <div className="space-y-2 px-4 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300',
                        isActive
                          ? 'border border-yellow-500/40 bg-gradient-to-r from-yellow-500/20 to-amber-500/20'
                          : 'border border-transparent hover:bg-white/5',
                      )}
                    >
                      <div className="relative">
                        <Icon
                          className={cn(
                            'h-5 w-5 transition-colors duration-300',
                            isActive ? 'text-yellow-400' : 'text-white/70',
                          )}
                        />
                        {isActive && (
                          <div className="absolute inset-0 animate-pulse bg-yellow-400/20 blur-sm" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <span
                          className={cn(
                            'text-sm font-bold transition-colors duration-300',
                            isActive ? 'text-yellow-400' : 'text-white/70',
                          )}
                        >
                          {item.label}
                        </span>
                        <p className="text-xs text-white/50">{item.description}</p>
                      </div>
                      {isActive && (
                        <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                      )}
                    </button>
                  )
                })}

                {/* Mobile Stats */}
                <div className="flex gap-2 border-t border-yellow-500/20 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 items-center gap-2 text-white/70 transition-all duration-300 hover:bg-white/5 hover:text-yellow-400"
                  >
                    <Target className="h-4 w-4" />
                    <span className="text-xs font-bold">Stats</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 items-center gap-2 border-yellow-500/30 text-yellow-400 transition-all duration-300 hover:bg-yellow-500/10"
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-bold">Wallet</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
