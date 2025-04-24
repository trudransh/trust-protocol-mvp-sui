'use client'
import { useCurrentAccount, useConnectWallet, useWallets } from '@mysten/dapp-kit'
import { Button } from "@/components/ui/button"


export function ConnectButton() {
  const wallets = useWallets()
  const account = useCurrentAccount()
  const { mutate: connect } = useConnectWallet()

  const handleConnect = () => {
    // Connect to the first available wallet
    if (wallets.length > 0) {
      connect({
        wallet: wallets[0],
      })
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {account ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <span className="text-primary-foreground font-medium">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
          <Button 
            onClick={() => connect({
              wallet: wallets[0],
            })}
            variant="destructive"
            className="w-full"
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          className="w-full py-6 text-lg font-semibold bg-primary hover:bg-blue-700 text-white transition-colors"
          size="lg"
        >
          Connect Wallet
        </Button>
      )}
    </div>
  )
}