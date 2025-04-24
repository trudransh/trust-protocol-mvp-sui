'use client'
import { useRouter } from 'next/navigation'
import { ParticleBackground } from "@/components/home/particle-bg"
import { ConnectButton } from "@/components/connect-button"
import { useCurrentAccount } from '@mysten/dapp-kit'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export function WalletModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  const router = useRouter()
  const currentAccount = useCurrentAccount()

  // Redirect when connected
  useEffect(() => {
    if (currentAccount && isOpen) {
      router.push("/dashboard")
      onClose()
    }
  }, [currentAccount, isOpen, router, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal - Centered and not blurred */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-gradient-to-r from-[#cdffd8] to-[#94b9ff] rounded-xl shadow-xl overflow-hidden">
            <div className="relative h-[500px]">
              {/* Particle Background */}
              <div className="absolute inset-0">
                <ParticleBackground />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
                {/* Close button */}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-primary-foreground hover:opacity-70 transition-opacity"
                >
                  <X size={24} />
                </button>

                <h2 className="text-3xl font-bold text-primary-foreground mb-12 text-center">
                  Connect Your Wallet
                </h2>

                <div className="w-full max-w-[280px] mx-auto">
                  <ConnectButton />
                </div>

                <div className="mt-12 text-center text-primary-foreground max-w-[80%]">
                  <p>Connect your wallet to access your trust score and start building reputation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}