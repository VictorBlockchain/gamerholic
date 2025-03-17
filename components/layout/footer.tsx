import Link from "next/link"
import { Cpu } from "lucide-react"
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative z-10 pt-24 pb-12 border-t border-[#222]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-lg"></div>
                <div className="relative w-10 h-10 rounded-lg flex items-center justify-center">
                              <Image
                                  src="/logo.png"
                                  alt="Gamerholic Logo"
                                  layout="fill"
                                  objectFit="cover"
                                />
                </div>
              </div>
              <span className="text-2xl font-bold tracking-tight">GAMERHOLIC</span>
            </div>
            <p className="text-gray-400 mb-6">
              The next generation esports and gaming platform powered by AI and blockchain technology.
            </p>
            <div className="text-xs text-gray-500">Contract: A16i7...ZRWpump</div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">Platform</h3>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Games
                </Link>
              </li>
              <li>
                <Link href="/tournaments" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Create Games
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/agreement" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#222] pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">© 2025 Gamerholic. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/agreement" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

