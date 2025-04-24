"use client";

import { useRouter } from "next/navigation";
import { ParticleBackground } from "@/components/home/particle-bg";
import { ConnectButton } from "@/components/connect-button";
import { X } from "lucide-react";

export function WalletModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="w-full max-w-sm sm:max-w-md mx-4">
          <div className="bg-gradient-to-r from-[#cdffd8] to-[#94b9ff] rounded-xl shadow-xl overflow-hidden">
            <div className="relative h-[450px] sm:h-[500px]">
              <div className="absolute inset-0">
                <ParticleBackground />
              </div>
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 sm:p-8">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-primary-foreground hover:opacity-70 transition-opacity"
                >
                  <X size={20} />
                </button>
                <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-8 sm:mb-12 text-center">
                  Connect Your Wallet
                </h2>
                <div className="w-full max-w-[280px] mx-auto">
                  <ConnectButton />
                </div>
                <div className="mt-8 sm:mt-12 text-center text-primary-foreground max-w-[80%] text-sm sm:text-base">
                  <p>
                    Connect your wallet to access your trust score and start
                    building reputation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}