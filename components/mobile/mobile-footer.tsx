import Link from "next/link"
import { Cpu, Twitter, Instagram, DiscIcon as Discord, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image";

export function MobileFooter() {
  return (
    <footer className="relative z-10 pt-12 pb-8 border-t border-[#222] bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
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
            <p className="text-gray-400 mb-6 text-sm">
              The next generation esports and gaming platform powered by AI and blockchain technology.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1">
            <div>
              <h3 className="text-base font-bold mb-4">Platform</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    Games
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    Tournaments
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    Marketplace
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-[#00FFA9] transition-colors text-sm">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between pt-6 border-t border-[#222]">
          <p className="text-gray-500 text-sm">© 2025 Gamerholic. All rights reserved.</p>

          <div className="flex space-x-4">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Twitter className="h-4 w-4 text-gray-400 hover:text-[#00FFA9]" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Instagram className="h-4 w-4 text-gray-400 hover:text-[#00FFA9]" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Discord className="h-4 w-4 text-gray-400 hover:text-[#00FFA9]" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Github className="h-4 w-4 text-gray-400 hover:text-[#00FFA9]" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}

