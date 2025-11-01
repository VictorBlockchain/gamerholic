import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card' // Import Card components
import {
  Shield,
  FileText,
  Cookie,
  Wallet,
  Share2,
  Settings,
  Globe,
  RefreshCw,
  Mail,
} from 'lucide-react' // Import icons

export const metadata: Metadata = {
  title: 'Privacy Policy - Gamerholic',
  description:
    'Learn how Gamerholic collects, uses, and protects your information across our platform and on-chain experiences.',
}

// Helper component for section icons
const SectionIcon = ({ icon }: { icon: React.ReactNode }) => (
  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-600/10 pt-32 shadow-lg shadow-amber-500/10">
    {icon}
  </div>
)

export default function PrivacyPage() {
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
            <Shield className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="font-gaming bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-500 bg-clip-text text-4xl font-black text-transparent sm:text-5xl md:text-6xl">
            Privacy Policy
          </h1>
          <p className="font-body mx-auto mt-4 max-w-2xl pb-3 text-lg text-gray-300">
            We respect your privacy. This policy explains what we collect, how we use it, and the
            choices you have across Gamerholic’s website, apps, and on-chain features.
          </p>
        </header>

        {/* Content Grid with Styled Cards */}
        <div className="mx-auto max-w-4xl space-y-8 pt-3">
          {/* Section 1: Information We Collect */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<FileText className="h-5 w-5 text-amber-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">
                    Information We Collect
                  </h2>
                  <ul className="mt-4 space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                      <span>
                        Account identifiers such as username, profile details, and linked wallet
                        address.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                      <span>
                        Usage data like pages viewed, actions taken, device, and approximate
                        location.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                      <span>
                        On-chain data related to challenges, tournaments, entries, payouts, and
                        donations.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
                      <span>
                        Communication preferences and messages you send us (support, feedback).
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: How We Use Your Information */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Settings className="h-5 w-5 text-purple-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">
                    How We Use Your Information
                  </h2>
                  <ul className="mt-4 space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                      <span>
                        Operate core features: challenges, tournaments, rewards, and leaderboards.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                      <span>Secure accounts, prevent fraud, and comply with applicable laws.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                      <span>
                        Improve performance, personalize content, and support product development.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400" />
                      <span>
                        Communicate updates, service notices, and marketing (where permitted).
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two-column layout for shorter sections */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Section 3: Cookies and Analytics */}
            <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/5">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <SectionIcon icon={<Cookie className="h-5 w-5 text-cyan-400" />} />
                  <div>
                    <h2 className="font-gaming text-xl font-bold text-white">
                      Cookies and Analytics
                    </h2>
                    <p className="mt-3 text-sm text-gray-300">
                      We may use cookies, local storage, and analytics tools to remember
                      preferences, measure engagement, and improve the experience. You can manage
                      cookie settings in your browser.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Wallets and On‑Chain Activity */}
            <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/5">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <SectionIcon icon={<Wallet className="h-5 w-5 text-green-400" />} />
                  <div>
                    <h2 className="font-gaming text-xl font-bold text-white">
                      Wallets and On‑Chain Activity
                    </h2>
                    <p className="mt-3 text-sm text-gray-300">
                      Participation in on‑chain experiences is public. Contract interactions are
                      recorded on the blockchain and may be viewable by anyone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 5: Data Sharing */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Share2 className="h-5 w-5 text-pink-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">Data Sharing</h2>
                  <p className="mt-4 text-gray-300">
                    We may share limited information with service providers (e.g., hosting,
                    analytics, payments) to operate the platform. We do not sell personal
                    information. We may disclose information when required by law or to protect
                    users and the platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Your Choices */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Settings className="h-5 w-5 text-blue-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">Your Choices</h2>
                  <ul className="mt-4 space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
                      <span>
                        Access, update, or delete certain profile details in your account settings.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
                      <span>Disconnect wallets or stop using on‑chain features at any time.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
                      <span>Opt out of marketing communications via provided controls.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two-column layout for shorter sections */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Section 7: International Transfers */}
            <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <SectionIcon icon={<Globe className="h-5 w-5 text-indigo-400" />} />
                  <div>
                    <h2 className="font-gaming text-xl font-bold text-white">
                      International Transfers
                    </h2>
                    <p className="mt-3 text-sm text-gray-300">
                      Gamerholic may process data in multiple regions. We take steps to safeguard
                      transfers in accordance with applicable data protection laws.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 8: Policy Updates */}
            <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/5">
              <CardContent className="relative p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start gap-3">
                  <SectionIcon icon={<RefreshCw className="h-5 w-5 text-orange-400" />} />
                  <div>
                    <h2 className="font-gaming text-xl font-bold text-white">Policy Updates</h2>
                    <p className="mt-3 text-sm text-gray-300">
                      We may update this policy to reflect changes to our practices. Material
                      changes will be communicated through the site or by notification.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 9: Contact */}
          <Card className="group overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-900/90 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/5">
            <CardContent className="relative p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start gap-4">
                <SectionIcon icon={<Mail className="h-5 w-5 text-red-400" />} />
                <div>
                  <h2 className="font-gaming text-2xl font-bold text-white">Contact</h2>
                  <p className="mt-4 text-gray-300">
                    Questions or requests? Reach out to us at{' '}
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
