import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-accent/20 bg-background/80 backdrop-blur-sm py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2 text-primary">About</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/agreement" className="hover:text-primary">
                    User Agreement
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2 text-primary">Community</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="https://discord.gg/rgbDcMXtEb" className="hover:text-primary">
                    Discord
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-primary">
                    Developer Docs
                  </Link>
                </li>
                <li>
                  <Link href="/discover" className="hover:text-primary">
                    Discover Games
                  </Link>
                </li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2 text-primary">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-primary">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Telegram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-sm text-muted-foreground">© 2023 Gamerholic. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}

