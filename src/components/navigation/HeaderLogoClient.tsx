'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HeaderLogoClient() {
  return (
    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
      <Link href="/" aria-label="Go to home" className="block">
        <Image
          src="/logo.png"
          alt="Gamerholic Logo"
          width={48}
          height={48}
          className="h-full w-full object-contain"
          priority
        />
      </Link>
    </div>
  )
}