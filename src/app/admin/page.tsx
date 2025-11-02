'use client'

import * as React from 'react'
import { useUser } from '@/context/UserContext'
import { useWalletClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert' // New import
import { Checkbox } from '@/components/ui/checkbox' // New import
import * as TF from '@/lib/contracts/tournamentFactory'
import * as CF from '@/lib/contracts/challengeFactory'
import { supabase } from '@/lib/supabase'
import {
  Settings,
  Shield,
  Wallet,
  Search,
  Terminal,
  AlertCircle,
  UserCheck,
  UserX,
  Coins,
  FileText,
  Trophy,
} from 'lucide-react' // New import
import { cn } from '@/lib/utils' // New import

// --- NEW STYLED COMPONENTS ---

// A styled section component for the admin dashboard
const AdminSection = ({
  title,
  icon,
  children,
  className,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) => (
  <Card
    className={cn(
      'group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10',
      className,
    )}
  >
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-3 text-xl">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
          {icon}
        </div>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
)

// A styled code block for displaying JSON data
const CodeBlock = ({ title, data }: { title: string; data: any }) => (
  <div className="rounded-xl border border-gray-700 bg-black/50 p-4">
    <div className="mb-2 flex items-center gap-2">
      <Terminal className="h-4 w-4 text-gray-400" />
      <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
    </div>
    <pre className="overflow-x-auto rounded-md bg-gray-900/50 p-3 font-mono text-xs text-green-400">
      {data ? JSON.stringify(data, null, 2) : 'No data'}
    </pre>
  </div>
)

// --- MAIN PAGE COMPONENT ---

export default function AdminPage() {
  const { address, isConnected, isAdmin, isMod } = useUser()
  const walletClient = useWalletClient()

  React.useEffect(() => {
    if (walletClient.data) {
      try {
        TF.setWalletClient(walletClient.data)
        CF.setWalletClient(walletClient.data)
      } catch (e) {
        console.warn('Failed to set wallet client:', e)
      }
    }
  }, [walletClient.data])

  const [targetAddress, setTargetAddress] = React.useState('')
  const [flag, setFlag] = React.useState(true)
  // TournamentFactory form state
  const [tfFeeRecipient, setTfFeeRecipient] = React.useState('')
  const [tfPlatformFeeBps, setTfPlatformFeeBps] = React.useState<string>('')
  const [tfMinimumEntryFeeEth, setTfMinimumEntryFeeEth] = React.useState<string>('')
  // ChallengeFactory form state
  const [cfFeeRecipient, setCfFeeRecipient] = React.useState('')
  const [cfPlatformFeeBps, setCfPlatformFeeBps] = React.useState<string>('')
  const [cfMinimumEntryFeeEth, setCfMinimumEntryFeeEth] = React.useState<string>('')
  const [txStatus, setTxStatus] = React.useState<string>('')

  const [lookupAddress, setLookupAddress] = React.useState('')
  const [challengeRecord, setChallengeRecord] = React.useState<any | null>(null)
  const [tournamentRecord, setTournamentRecord] = React.useState<any | null>(null)
  const [gamerWallet, setGamerWallet] = React.useState('')
  const [gamerRecord, setGamerRecord] = React.useState<any | null>(null)
  // TournamentFactory: XFT entry config & deployer state
  const [xftToJoinId, setXftToJoinId] = React.useState<string>('')
  const [xftContractAddress, setXftContractAddress] = React.useState('')
  const [xftEntryCount, setXftEntryCount] = React.useState<string>('')
  const [tournamentDeployerAddr, setTournamentDeployerAddr] = React.useState('')

  const disabled = !isConnected || !walletClient.data
  const canAdmin = isAdmin
  const canMod = isAdmin || isMod

  const handleTx = async (fn: () => Promise<any>, label: string) => {
    setTxStatus(`Submitting ${label}...`)
    try {
      const res = await fn()
      setTxStatus(`${label} confirmed: ${res?.hash ?? ''}`)
    } catch (e: any) {
      setTxStatus(`Error ${label}: ${e?.message ?? String(e)}`)
    }
  }

  // Prefill current contract configuration values
  React.useEffect(() => {
    const load = async () => {
      try {
        const [tfFee, tfMin, tfRec] = await Promise.all([
          TF.readPlatformFeeRate().catch(() => BigInt(0)),
          TF.readMinimumEntryFee().catch(() => BigInt(0)),
          TF.readFeeRecipient().catch(() => '' as `0x${string}`),
        ])
        setTfPlatformFeeBps(tfFee.toString())
        setTfMinimumEntryFeeEth(formatEther(tfMin))
        setTfFeeRecipient(tfRec || '')
      } catch (e) {
        console.warn('Failed to load TournamentFactory config', e)
      }
      try {
        const deployer = await TF.readTournamentDeployer().catch(() => '' as `0x${string}`)
        setTournamentDeployerAddr(deployer || '')
      } catch (e) {
        console.warn('Failed to read tournament deployer', e)
      }
      try {
        const [cfFee, cfMin, cfRec] = await Promise.all([
          CF.readPlatformFeeRate().catch(() => BigInt(0)),
          CF.readMinimumEntryFee().catch(() => BigInt(0)),
          CF.readFeeRecipient().catch(() => '' as `0x${string}`),
        ])
        setCfPlatformFeeBps(cfFee.toString())
        setCfMinimumEntryFeeEth(formatEther(cfMin))
        setCfFeeRecipient(cfRec || '')
      } catch (e) {
        console.warn('Failed to load ChallengeFactory config', e)
      }
    }
    load()
  }, [])

  return (
    <div className="relative min-h-screen bg-black pt-24 pb-24">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.05),transparent_60%)]" />

      <div className="relative container mx-auto px-4">
        {/* Redesigned Header */}
        <header className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-600/10 shadow-lg shadow-purple-500/10">
            <Settings className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="font-gaming bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
            Admin Controls
          </h1>
          <p className="mt-2 text-gray-400">Manage platform settings and view on-chain data.</p>
        </header>

        {/* Status Messages */}
        {!isConnected && (
          <Alert className="mb-6 border-amber-500/30 bg-amber-500/10 text-amber-300">
            <Wallet className="h-4 w-4" />
            <AlertDescription>Connect your wallet to use admin features.</AlertDescription>
          </Alert>
        )}

        {disabled && isConnected && (
          <Alert className="mb-6 border-red-500/30 bg-red-500/10 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Wallet client not ready. Ensure your wallet is connected.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* TournamentFactory: XFT Entry Config (Mod/Admin) */}
          <AdminSection
            title="TournamentFactory: XFT Entry Config"
            icon={<Shield className="h-4 w-4 text-white" />}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">XFT Token ID</Label>
                <Input
                  value={xftToJoinId}
                  onChange={(e) => setXftToJoinId(e.target.value)}
                  type="number"
                  min={0}
                  placeholder="e.g. 1"
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">XFT Contract Address</Label>
                <Input
                  value={xftContractAddress}
                  onChange={(e) => setXftContractAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">Required Entry Count</Label>
                <Input
                  value={xftEntryCount}
                  onChange={(e) => setXftEntryCount(e.target.value)}
                  type="number"
                  min={0}
                  placeholder="e.g. 1"
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                disabled={disabled || !canMod || !xftToJoinId || !xftContractAddress}
                onClick={() =>
                  handleTx(
                    () =>
                      TF.setXFTToJoinEntryCount(
                        address as `0x${string}`,
                        BigInt(xftToJoinId || '0'),
                        xftContractAddress as `0x${string}`,
                        BigInt(xftEntryCount || '0'),
                        walletClient.data!,
                      ),
                    'TournamentFactory.setXFTToJoinEntryCount',
                  )
                }
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Update XFT Entry Config
              </Button>
            </div>
          </AdminSection>

          {/* TournamentFactory Section */}
          <AdminSection
            title="TournamentFactory: Admin/Mod"
            icon={<Shield className="h-4 w-4 text-white" />}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Target Address</Label>
                <Input
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-gray-600 bg-gray-800/50 p-3">
                <Checkbox
                  id="flag"
                  checked={flag}
                  onCheckedChange={(checked) => setFlag(checked as boolean)}
                />
                <Label htmlFor="flag" className="text-sm font-medium text-gray-300">
                  Set flag to {String(flag)}
                </Label>
              </div>
              <div className="flex gap-3">
                <Button
                  disabled={disabled || !canAdmin || !targetAddress}
                  onClick={() =>
                    handleTx(
                      () =>
                        TF.setAdmin(
                          address as `0x${string}`,
                          targetAddress as `0x${string}`,
                          flag,
                          walletClient.data!,
                        ),
                      'TournamentFactory.setAdmin',
                    )
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <UserCheck className="mr-2 h-4 w-4" /> Set Admin
                </Button>
                <Button
                  disabled={disabled || !canAdmin || !targetAddress}
                  variant="secondary"
                  onClick={() =>
                    handleTx(
                      () =>
                        TF.setMod(
                          address as `0x${string}`,
                          targetAddress as `0x${string}`,
                          flag,
                          walletClient.data!,
                        ),
                      'TournamentFactory.setMod',
                    )
                  }
                  className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  <Shield className="mr-2 h-4 w-4" /> Set Mod
                </Button>
              </div>
            </div>
          </AdminSection>

          {/* ChallengeFactory Section */}
          <AdminSection
            title="ChallengeFactory: Admin/Mod"
            icon={<Shield className="h-4 w-4 text-white" />}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Target Address</Label>
                <Input
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center space-x-2 rounded-lg border border-gray-600 bg-gray-800/50 p-3">
                <Checkbox
                  id="flag2"
                  checked={flag}
                  onCheckedChange={(checked) => setFlag(checked as boolean)}
                />
                <Label htmlFor="flag2" className="text-sm font-medium text-gray-300">
                  Set flag to {String(flag)}
                </Label>
              </div>
              <div className="flex gap-3">
                <Button
                  disabled={disabled || !canAdmin || !targetAddress}
                  onClick={() =>
                    handleTx(
                      () =>
                        CF.setAdmin(
                          address as `0x${string}`,
                          targetAddress as `0x${string}`,
                          flag,
                          walletClient.data!,
                        ),
                      'ChallengeFactory.setAdmin',
                    )
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <UserCheck className="mr-2 h-4 w-4" /> Set Admin
                </Button>
                <Button
                  disabled={disabled || !canAdmin || !targetAddress}
                  variant="secondary"
                  onClick={() =>
                    handleTx(
                      () =>
                        CF.setMod(
                          address as `0x${string}`,
                          targetAddress as `0x${string}`,
                          flag,
                          walletClient.data!,
                        ),
                      'ChallengeFactory.setMod',
                    )
                  }
                  className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  <Shield className="mr-2 h-4 w-4" /> Set Mod
                </Button>
              </div>
            </div>
          </AdminSection>

          {/* Fees & Recipient (TournamentFactory) */}
          <AdminSection
            title="TournamentFactory: Fees"
            icon={<Coins className="h-4 w-4 text-white" />}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Fee Recipient</Label>
                <Input
                  value={tfFeeRecipient}
                  onChange={(e) => setTfFeeRecipient(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                disabled={disabled || !canAdmin || !tfFeeRecipient}
                onClick={() =>
                  handleTx(
                    () =>
                      TF.updateFeeRecipient(
                        address as `0x${string}`,
                        tfFeeRecipient as `0x${string}`,
                        walletClient.data!,
                      ),
                    'TournamentFactory.updateFeeRecipient',
                  )
                }
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                Update Fee Recipient
              </Button>
              <div>
                <Label className="text-sm font-medium text-gray-300">Platform Fee (bps)</Label>
                <Input
                  value={tfPlatformFeeBps}
                  onChange={(e) => setTfPlatformFeeBps(e.target.value)}
                  type="number"
                  min={0}
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                disabled={disabled || !canAdmin}
                onClick={() =>
                  handleTx(
                    () =>
                      TF.updatePlatformFeeRate(
                        address as `0x${string}`,
                        BigInt(tfPlatformFeeBps || '0'),
                        walletClient.data!,
                      ),
                    'TournamentFactory.updatePlatformFeeRate',
                  )
                }
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                Update Fee Rate
              </Button>
              <div>
                <Label className="text-sm font-medium text-gray-300">Minimum Entry Fee (ETH)</Label>
                <Input
                  value={tfMinimumEntryFeeEth}
                  onChange={(e) => setTfMinimumEntryFeeEth(e.target.value)}
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                disabled={disabled || !canAdmin}
                onClick={() =>
                  handleTx(
                    () =>
                      TF.updateMinimumEntryFee(
                        address as `0x${string}`,
                        parseEther(tfMinimumEntryFeeEth || '0'),
                        walletClient.data!,
                      ),
                    'TournamentFactory.updateMinimumEntryFee',
                  )
                }
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                Update Minimum Entry Fee
              </Button>
            </div>
          </AdminSection>

          {/* TournamentFactory: Deployer */}
          <AdminSection
            title="TournamentFactory: Deployer"
            icon={<Trophy className="h-4 w-4 text-white" />}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Deployer Address</Label>
                <Input
                  value={tournamentDeployerAddr}
                  onChange={(e) => setTournamentDeployerAddr(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                disabled={disabled || !canAdmin || !tournamentDeployerAddr}
                onClick={() =>
                  handleTx(
                    () =>
                      TF.setTournamentDeployer(
                        address as `0x${string}`,
                        tournamentDeployerAddr as `0x${string}`,
                        walletClient.data!,
                      ),
                    'TournamentFactory.setTournamentDeployer',
                  )
                }
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                Update Deployer
              </Button>
            </div>
          </AdminSection>

          {/* Fees & Recipient (ChallengeFactory) */}
          <AdminSection
            title="ChallengeFactory: Fees"
            icon={<Coins className="h-4 w-4 text-white" />}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Fee Recipient</Label>
                <Input
                  value={cfFeeRecipient}
                  onChange={(e) => setCfFeeRecipient(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                disabled={disabled || !canAdmin || !cfFeeRecipient}
                onClick={() =>
                  handleTx(
                    () =>
                      CF.updateFeeRecipient(
                        address as `0x${string}`,
                        cfFeeRecipient as `0x${string}`,
                        walletClient.data!,
                      ),
                    'ChallengeFactory.updateFeeRecipient',
                  )
                }
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                Update Fee Recipient
              </Button>
              <div>
                <Label className="text-sm font-medium text-gray-300">Platform Fee (bps)</Label>
                <Input
                  value={cfPlatformFeeBps}
                  onChange={(e) => setCfPlatformFeeBps(e.target.value)}
                  type="number"
                  min={0}
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                disabled={disabled || !canAdmin}
                onClick={() =>
                  handleTx(
                    () =>
                      CF.updatePlatformFeeRate(
                        address as `0x${string}`,
                        BigInt(cfPlatformFeeBps || '0'),
                        walletClient.data!,
                      ),
                    'ChallengeFactory.updatePlatformFeeRate',
                  )
                }
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                Update Fee Rate
              </Button>
              <div>
                <Label className="text-sm font-medium text-gray-300">Minimum Entry Fee (ETH)</Label>
                <Input
                  value={cfMinimumEntryFeeEth}
                  onChange={(e) => setCfMinimumEntryFeeEth(e.target.value)}
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                disabled={disabled || !canAdmin}
                onClick={() =>
                  handleTx(
                    () =>
                      CF.updateMinimumEntryFee(
                        address as `0x${string}`,
                        parseEther(cfMinimumEntryFeeEth || '0'),
                        walletClient.data!,
                      ),
                    'ChallengeFactory.updateMinimumEntryFee',
                  )
                }
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                Update Minimum Entry Fee
              </Button>
            </div>
          </AdminSection>

          {/* Lookup Gamer Section */}
          <AdminSection
            title="Lookup Gamer by Wallet"
            icon={<Search className="h-4 w-4 text-white" />}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Wallet Address</Label>
                <Input
                  value={gamerWallet}
                  onChange={(e) => setGamerWallet(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                onClick={async () => {
                  setGamerRecord(null)
                  const { data, error } = await supabase
                    .from('gamers')
                    .select('*')
                    .eq('wallet', gamerWallet)
                    .maybeSingle()
                  if (error) setGamerRecord({ error: error.message })
                  else setGamerRecord(data)
                }}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                <Search className="mr-2 h-4 w-4" /> Lookup Gamer
              </Button>
              <CodeBlock title="Gamer Record" data={gamerRecord} />
            </div>
          </AdminSection>

          {/* Lookup by Contract Section */}
          <AdminSection
            title="Lookup by Contract Address"
            icon={<FileText className="h-4 w-4 text-white" />}
          >
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Contract Address</Label>
                <Input
                  value={lookupAddress}
                  onChange={(e) => setLookupAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    setChallengeRecord(null)
                    const { data, error } = await supabase
                      .from('challenges')
                      .select('*')
                      .eq('contract_address', lookupAddress)
                      .maybeSingle()
                    if (error) {
                      setChallengeRecord({ error: error.message })
                    } else {
                      setChallengeRecord(data)
                    }
                  }}
                  className="flex-1 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  <Trophy className="mr-2 h-4 w-4" /> Challenge
                </Button>
                <Button
                  onClick={async () => {
                    setTournamentRecord(null)
                    const { data, error } = await supabase
                      .from('tournaments')
                      .select('*')
                      .eq('contract_address', lookupAddress)
                      .maybeSingle()
                    if (error) {
                      setTournamentRecord({ error: error.message })
                    } else {
                      setTournamentRecord(data)
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <FileText className="mr-2 h-4 w-4" /> Tournament
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <CodeBlock title="Challenge Record" data={challengeRecord} />
                <CodeBlock title="Tournament Record" data={tournamentRecord} />
              </div>
            </div>
          </AdminSection>
        </div>

        {/* Transaction Status Footer */}
        <Card className="mt-8 border-gray-800 bg-black/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Terminal className="h-5 w-5 text-gray-400" />
            <div className="flex-1 font-mono text-sm text-gray-300">
              {txStatus || 'Awaiting action...'}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
