import React from 'react'
import { Button } from '../ui/button'
import { Trophy, Wallet } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'


export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#cdffd8] to-[#94b9ff]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <Image 
            src="/unn_finance.webp" 
            width={40} 
            height={40} 
            alt="Trust Protocol"
            className="h-8 w-8 sm:h-10 sm:w-10"
          />
          <Link 
            href="/" 
            className="text-lg font-bold tracking-wider text-primary sm:text-xl md:text-2xl"
          >
            TRUST
          </Link>
        </div>

        {/* Navigation Buttons - Hidden on mobile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1 text-xs sm:gap-2 sm:text-sm"
          >
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">
            <Link href="/leaderboard">Leaderboard</Link>
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}