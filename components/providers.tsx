'use client'
import { createNetworkConfig, SuiClientProvider } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletProvider } from '@suiet/wallet-kit'
import '@suiet/wallet-kit/style.css'
import { ReactNode } from 'react'

// Create the network configuration using createNetworkConfig
const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
})

// Create a query client
const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}