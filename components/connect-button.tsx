"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ConnectButton() {
  const { connected, account, detectedWallets, select, disconnect } = useWallet();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async (walletName: string) => {
    try {
      setErrorMessage(null);
      console.log(`Attempting to connect to wallet: ${walletName}`);
      await select(walletName);
      console.log(`Successfully connected to wallet: ${walletName}`);
    } catch (error) {
      console.error(`Failed to connect to ${walletName}:`, error);
      setErrorMessage(`Failed to connect to ${walletName}. Please try again.`);
    }
  };

  const handleDisconnect = async () => {
    try {
      setErrorMessage(null);
      console.log("Attempting to disconnect wallet...");
      await disconnect();
      console.log("Successfully disconnected wallet");
      console.log("Post-disconnect state:", { connected, account });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      setErrorMessage("Failed to disconnect wallet. Please try again.");
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {errorMessage && (
        <span className="text-red-500 text-sm">{errorMessage}</span>
      )}
      {connected && account ? (
        <Button
          variant="outline"
          className="w-full text-base sm:text-lg"
          onClick={handleDisconnect}
        >
          {account.address.slice(0, 6)}...{account.address.slice(-4)} (Disconnect)
        </Button>
      ) : (
        <div className="flex flex-col gap-2 w-full max-h-[300px] overflow-y-auto">
          {detectedWallets.length === 0 ? (
            <span className="text-sm sm:text-base">
              No wallets detected. Please install a Sui wallet.
            </span>
          ) : (
            detectedWallets.map((wallet) => (
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
      )}
    </div>
  );
}