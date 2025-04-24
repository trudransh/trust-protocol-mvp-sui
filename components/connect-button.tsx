"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useWallets, useConnectWallet } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { useState } from "react";as

export function ConnectButton() {
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async (walletName: string) => {
    try {
      setErrorMessage(null);
      console.log(`Attempting to connect to wallet: ${walletName}`);
      const wallet = wallets.find((w) => w.name === walletName);
      if (!wallet) throw new Error(`Wallet ${walletName} not found`);
      await connect({ wallet });
      console.log(`Successfully connected to wallet: ${walletName}`);
    } catch (error) {
      console.error(`Failed to connect to ${walletName}:`, error);
      setErrorMessage(`Failed to connect to ${walletName}. Please try again.`);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {errorMessage && (
        <span className="text-red-500 text-sm">{errorMessage}</span>
      )}
      <div className="flex flex-col gap-2 w-full max-h-[300px] overflow-y-auto">
        {wallets.length === 0 ? (
          <span className="text-sm sm:text-base">
            No wallets detected. Please install a Sui wallet.
          </span>
        ) : (
          wallets.map((wallet) => (
            <Button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              className="w-full py-4 md:py-6 text-base sm:text-lg font-semibold bg-primary hover:bg-blue-700 text-white transition-colors"
              size="lg"
            >
              Connect with {wallet.name}
            </Button>
          ))
        )}
      </div>
    </div>
  );
}