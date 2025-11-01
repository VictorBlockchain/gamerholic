import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card' // Import Card components
import {
  UserCheck,
  Trophy,
  Coins,
  Link,
  Shield,
  Gavel,
  Ban,
  Scale,
  RefreshCw,
  Mail,
} from 'lucide-react' // Import icons

export const metadata: Metadata = {
  title: 'User Agreement - Gamerholic',
  description:
    'Read the terms governing your use of Gamerholic, including challenges, tournaments, rewards, and on-chain activity.',
}

// Helper component for section icons
const SectionIcon = ({ icon }: { icon: React.ReactNode }) => (
  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-600/10 shadow-lg shadow-amber-500/10">
    {icon}
  </div>
)

export default function UserAgreementPage() {
  return (
    <section className="relative overflow-hidden pt-24 pb-24">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.05),transparent_60%)]" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] [mask-image:linear-gradient(to_bottom,white,transparent,transparent)] bg-center opacity-[0.02]" />

      <div className="relative container mx-auto px-4">
        {/* Redesigned Header */}
        <header className="mb-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-600/10 shadow-lg shadow-amber-500/10">
            <Scale className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="font-gaming bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-500 bg-clip-text text-4xl font-black text-transparent sm:text-5xl md:text-6xl">
            User Agreement
          </h1>
          <p className="font-body mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            These terms govern your access to and use of Gamerholic. By using the service, you agree
            to this User Agreement.
          </p>
        </header>

        {/* Content Grid with Styled Cards */}
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Section 1: Eligibility & Accounts */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<UserCheck className="h-5 w-5 text-blue-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">
                    Eligibility & Accounts
                  </h2>
                  <p className="mt-4 text-gray-300">
                    You must be legally permitted to participate in skill‑based gaming in your
                    jurisdiction. You are responsible for maintaining the security of your account
                    and wallets, and for all activity that occurs under your credentials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Challenges & Tournaments */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Trophy className="h-5 w-5 text-purple-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">
                    Challenges & Tournaments
                  </h2>
                  <ul className="mt-4 space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                      <span>Follow posted rules, formats, and any eligibility requirements.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                      <span>
                        Outcomes may be subject to review; disputes are handled per our policies.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                      <span>
                        We may modify, suspend, or cancel events to maintain fairness or security.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Fees, Rewards & Donations */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Coins className="h-5 w-5 text-green-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">
                    Fees, Rewards & Donations
                  </h2>
                  <p className="mt-4 text-gray-300">
                    Entry fees, prize pools, rewards, and donations may be transacted in native
                    tokens or supported ERC‑20 assets. You acknowledge token volatility and accept
                    all risks associated with on‑chain settlement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: On‑Chain Activity */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Link className="h-5 w-5 text-cyan-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">On‑Chain Activity</h2>
                  <p className="mt-4 text-gray-300">
                    Transactions executed through smart contracts are public and immutable. Contract
                    addresses, entries, payouts, and event data may be visible on public block
                    explorers. You are solely responsible for your on‑chain interactions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Conduct & Safety */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Shield className="h-5 w-5 text-red-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">Conduct & Safety</h2>
                  <ul className="mt-4 space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
                      <span>No cheating, harassment, hate speech, or unlawful behavior.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
                      <span>
                        No exploitation of bugs or smart contracts; report issues promptly.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
                      <span>Respect other players, event organizers, and moderators.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two-column layout for shorter sections */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Section 6: Disputes */}
            <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/5">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <SectionIcon icon={<Gavel className="h-5 w-5 text-pink-400" />} />
                  <div>
                    <h2 className="font-gaming text-xl font-bold text-white">Disputes</h2>
                    <p className="mt-3 text-sm text-gray-300">
                      We aim to resolve disputes fairly based on available evidence and event rules.
                      Certain outcomes may be final once settled on‑chain.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 7: Termination */}
            <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/5">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <SectionIcon icon={<Ban className="h-5 w-5 text-orange-400" />} />
                  <div>
                    <h2 className="font-gaming text-xl font-bold text-white">Termination</h2>
                    <p className="mt-3 text-sm text-gray-300">
                      We may suspend or terminate access at our discretion for violations of this
                      Agreement or to protect users and the platform.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 8: Disclaimers & Liability */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Scale className="h-5 w-5 text-indigo-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">
                    Disclaimers & Liability
                  </h2>
                  <p className="mt-4 text-gray-300">
                    Gamerholic is provided “as is.” To the maximum extent permitted by law, we
                    disclaim warranties and limit liability for indirect, incidental, or
                    consequential damages. Nothing here excludes liability where prohibited by law.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two-column layout for shorter sections */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Section 9: Changes to This Agreement */}
            <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/5">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <SectionIcon icon={<RefreshCw className="h-5 w-5 text-teal-400" />} />
                  <div>
                    <h2 className="font-gaming text-xl font-bold text-white">
                      Changes to This Agreement
                    </h2>
                    <p className="mt-3 text-sm text-gray-300">
                      We may update these terms from time to time. Material changes will be
                      communicated through the site or by notification.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 10: Contact */}
            <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <SectionIcon icon={<Mail className="h-5 w-5 text-amber-400" />} />
                  <div>
                    <h2 className="font-gaming text-xl font-bold text-white">Contact</h2>
                    <p className="mt-3 text-sm text-gray-300">
                      Questions? Reach us at{' '}
                      <a
                        className="font-medium text-amber-400 transition-colors hover:text-amber-300"
                        href="mailto:support@gamerholic.xyz"
                      >
                        support@gamerholic.xyz
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer with Last Updated */}
        <footer className="mt-16 text-center">
          <p className="text-xs text-gray-500">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </footer>
      </div>
    </section>
  )
}
