"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu, X, Wallet } from "lucide-react";
import { ConnectButton } from "@/components/connect-button";
import { ConnectModal } from "@mysten/dapp-kit";
import {
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleWalletModal = () => {
    setIsWalletModalOpen(true);
    // Programmatically click the hidden trigger to open the modal
    if (triggerRef.current) {
      triggerRef.current.click();
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log("Attempting to disconnect wallet...");
      await disconnect();
      console.log("Successfully disconnected wallet");
      setIsWalletModalOpen(false);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300 bg-gradient-to-r from-[#cdffd8] to-[#94b9ff] w-full h-[70px]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between w-full md:w-[70%]">
        <div className="flex items-center space-x-2">
          <Image
            src="/unn_finance.webp"
            width={40}
            height={40}
            alt="Trust Protocol"
          />
          <Link
            href="/"
            className="text-xl md:text-2xl font-serif text-primary font-bold tracking-wider"
          >
            TRUST
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 font-semibold">
          <Link
            href=""
            className="text-primary-foreground hover:underline"
          >
            Whitepaper
          </Link>
          <Link
            href=""
            className="text-primary-foreground hover:underline"
          >
            Telegram
          </Link>
          <Link
            href=""
            className="text-primary-foreground hover:underline"
          >
            Twitter
          </Link>
          <Link
            href="https://github.com/trudransh/trust-protocol-mvp-sui"
            className="text-primary-foreground hover:underline"
          >
            Github
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {/* Wallet Connection Button - Desktop */}
          <div className="hidden md:block">
            {currentAccount ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-primary-foreground border-primary-foreground"
                  >
                    {currentAccount.address.slice(0, 6)}...
                    {currentAccount.address.slice(-4)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleDisconnect}>
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={toggleWalletModal}
                className="bg-primary text-white hover:bg-primary/90"
              >
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
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            <Link
              href="https://www.overleaf.com/read/zyhmdxynwxgt#a050e6"
              className="block py-2 text-base"
              onClick={toggleMenu}
            >
              Whitepaper
            </Link>
            <Link
              href="https://t.me/+e2_TcJOoNO80MzA9"
              className="block py-2 text-base"
              onClick={toggleMenu}
            >
              Telegram
            </Link>
            <Link
              href="https://x.com/_trustprotocol"
              className="block py-2 text-base"
              onClick={toggleMenu}
            >
              Twitter
            </Link>
            <Link
              href="https://github.com/the-trustprotocol"
              className="block py-2 text-base"
              onClick={toggleMenu}
            >
              Github
            </Link>
            <div className="py-2">
              {currentAccount ? (
                <Button
                  variant="outline"
                  className="w-full text-base sm:text-lg text-white border-white"
                  onClick={handleDisconnect}
                >
                  {currentAccount.address.slice(0, 6)}...
                  {currentAccount.address.slice(-4)} (Disconnect)
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-base sm:text-lg text-white border-white"
                  onClick={toggleWalletModal}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Connect Modal */}
      <ConnectModal
        trigger={
          <Button
            ref={triggerRef}
            size="sm"
            className="hidden" // Hide the trigger button
          >
            Hidden Trigger
          </Button>
        }
      />
    </header>
  );
}