"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Menu, X, Wallet } from "lucide-react"
import { ConnectButton } from "@mysten/dapp-kit"
import { useCurrentAccount } from "@mysten/dapp-kit"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const account = useCurrentAccount()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const toggleWalletModal = () => setIsWalletModalOpen(!isWalletModalOpen)

  return (
    <header className="sticky top-0 z-50 transition-all duration-300 bg-gradient-to-r from-[#cdffd8] to-[#94b9ff] w-full h-[70px] md:flex md:justify-center">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between w-full md:w-[70%]">
        <div className="flex items-center space-x-2">
          <Image src="/unn_finance.webp" width={40} height={40} alt="Trust Protocol" />
          <Link href="/" className="text-xl md:text-2xl font-serif text-primary font-bold tracking-wider">
            TRUST
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 font-semibold">
          <Link href="https://www.overleaf.com/read/zyhmdxynwxgt#a050e6" className="text-primary-foreground hover:underline">
            Whitepaper
          </Link>
          <Link href="https://t.me/+e2_TcJOoNO80MzA9" className="text-primary-foreground hover:underline">
            Telegram
          </Link>
            <Link href="https://x.com/_trustprotocol" className="text-primary-foreground hover:underline">
                Twitter
            </Link>
          <Link href="https://github.com/the-trustprotocol" className="text-primary-foreground hover:underline">
            Github
          </Link>
          {/* <Link href="https://www.canva.com/design/DAGdTE9O1ec/xb61kJvdKb_bM-K0NTBZ5A/view?utm_content=DAGdTE9O1ec&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h23a25db8b0#1" className="text-primary-foreground hover:underline">
           Deck
          </Link> */}
        </nav>
       
        <div className="flex items-center space-x-4">
          {/* Wallet Connection Button - Desktop */}
          <div className="hidden md:block">
            {account ? (
              <Button size="sm" variant="outline" className="text-primary-foreground border-primary-foreground">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </Button>
            ) : (
              <Button size="sm" onClick={toggleWalletModal} className="bg-primary text-white hover:bg-primary/90">
                <Wallet className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}
          </div>
          
          {/* Mobile Menu Toggle */}
          <button onClick={toggleMenu} className="md:hidden">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden bg-primary text-white">
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-2">
            <Link href="https://www.overleaf.com/read/zyhmdxynwxgt#a050e6" className="block py-2" onClick={toggleMenu}>
              White Paper
            </Link>
            <Link href="https://t.me/+e2_TcJOoNO80MzA9" className="block py-2" onClick={toggleMenu}>
            Telegram
            </Link>
            <Link href="https://x.com/_trustprotocol" className="block py-2" onClick={toggleMenu}>
                Twitter
            </Link>
            <Link href="https://github.com/the-trustprotocol" className="block py-2" onClick={toggleMenu}>
            Github
            </Link>
            {/* <Link href="https://www.canva.com/design/DAGdTE9O1ec/xb61kJvdKb_bM-K0NTBZ5A/view?utm_content=DAGdTE9O1ec&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h23a25db8b0#1" className="block py-2" onClick={toggleMenu}>
            Pitch deck
            </Link> */}
            
            {/* Wallet Connection - Mobile */}
            <div className="py-2">
              <ConnectButton />
            </div>
          </div>
        </nav>
      )}
      
      {/* Wallet Modal - Only show if not already connected and modal is open */}
      {isWalletModalOpen && !account && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Connect Wallet</h3>
              <button onClick={toggleWalletModal}>
                <X size={20} />
              </button>
            </div>
            <ConnectButton />
          </div>
        </div>
      )}
    </header>
  )
}

