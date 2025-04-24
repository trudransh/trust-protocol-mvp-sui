'use client'

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusIcon,
  MinusIcon,
  UserIcon,
  HandshakeIcon,
  CurrencyIcon,
  StarIcon,
  WalletIcon,
  SettingsIcon,
  LinkIcon,
  UnlinkIcon,
  Coins
} from "lucide-react"

import { } from "@/hooks/use-protocol";
import { CHAIN_ID, NULL_ADDRESS } from "@/lib/constants";
import {  } from "@/lib/utils";
import { OnBoardForm } from "@/components/dashboard/onboard-form";
import { BondModal } from "@/components/bond-modal";
import truncateEthAddress from "@/lib/truncateAddress"
import { BondLoadingModal } from "@/components/bond-loading-modal";


function UserResolver({address}:{address:`0x${string}`}) {
  const {data:userWallet,isLoading} = useResolveUserWallet(address )
  if(isLoading) {
    return <span>Loading...</span>
  }
  return (<span>{truncateEthAddress(userWallet ?? NULL_ADDRESS)}</span>)

}

export default function Dashboard() {
  const { isConnected, address, status: accountStatus } = useAccount();
  const { data: userWallet, isLoading: walletLoading } = useUserWalletFromRegistry(address ?? NULL_ADDRESS);
  const { data: userDetails, isLoading: userDetailsLoading } = useUserDetails(address ?? NULL_ADDRESS);
  const [bondAddress, setBondAddress] = useState<string | undefined>(undefined)
  const [isBondModalOpen, setIsBondModalOpen] = useState(false)
  const [bondModalType, setBondModalType] = useState<'create' | 'withdraw' | 'break' | 'stake'>('create')
  console.log({CHAIN_ID})
  // Modal States
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // UseEffect to open OnBoard modal if userWallet is NULL
  useEffect(() => {
    if (!walletLoading && (userWallet === NULL_ADDRESS || userWallet === undefined)) {
      setShowOnboardModal(true);
    } else {
      setShowOnboardModal(false);
    }
  }, [userWallet, walletLoading]);
  
  // UseEffect to handle Wallet Connect modal
  useEffect(() => {
    if (!isConnected) {
      setShowConnectModal(true);
    } else {
      setShowConnectModal(false);
    }
  }, [isConnected]);

  // if(!isConnected){

  //   return <AnimatedWalletConnect isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
  // }
  if(walletLoading){
    return <BondLoadingModal/>
  }
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#cdffd8] to-[#94b9ff]">
      <main className="container mx-auto p-4 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#94b9ff]">
            Trust Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Track and manage your on-chain trust relationships
          </p>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <CurrencyIcon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Value Locked
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${userDetails?.totalAmount !== undefined && userDetails?.totalWithdrawnAmount !== undefined ? formateDefaultAssetAmount(BigInt(userDetails.totalAmount) - (BigInt(userDetails.totalWithdrawnAmount)) - BigInt(userDetails.totalBrokenAmount)): 'N/A'}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Amount LifeTime ${userDetails?.totalAmount !== undefined ? formateDefaultAssetAmount(BigInt(userDetails.totalAmount)) : 'N/A'}</p>
              </CardContent>
          </Card>

          {/* <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 flex items-center gap-2">
              <HandshakeIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Bonds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{!userDetailsLoading ? userDetails?.totalActiveBonds ?? 0 : 'Loading...'}</div>
            </CardContent>
          </Card> */}
          <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <HandshakeIcon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Bonds
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userDetails?.totalActiveBonds ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{userDetails?.totalBrokenBonds} broken bonds, {userDetails?.totalWithdrawnBonds} withdrawn bonds</p>
              </CardContent>
            </Card>

          {/* <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Reputation Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Coming Soon</div>
            </CardContent>
          </Card>
        */}

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <StarIcon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reputation Score
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Coming Soon</div>
            </CardContent>
          </Card>
        </div> 

        {/* Bond Creation Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-gray-900">Bond Management</h3>
              <p className="text-sm text-gray-600">Click Create Bond And Start Your Trust Relationships</p>
            </div>
          <Button 
              onClick={() => {
                setIsBondModalOpen(true)
                setBondModalType('create')
              }}
              className="h-12 px-6 text-base whitespace-nowrap w-full sm:w-auto bg-[#0066FF] hover:bg-[#0052CC] text-white"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Create New Bond
            </Button>


        </div>

        <div className="mt-8 flex-1 overflow-hidden min-h-[400px]">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <h2 className="text-xl font-semibold">Active Bonds</h2>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-secondary/50 sticky top-0">
                  <TableRow>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Your Stake</TableHead>
                    <TableHead>Their Stake</TableHead>
                    <TableHead>Initiated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userDetails?.bondsDetails?.map((bond, index) => (
                    <TableRow key={index} className="hover:bg-secondary/30">
                      <TableCell className="font-medium flex items-center gap-2">
                        <span className="bg-primary/10 p-1 rounded-full">
                          <UserIcon className="w-4 h-4 text-primary" />
                        </span>
                        <UserResolver address={bond.counterPartyAddress} />
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          bond.type === 'two-way' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bond.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <WalletIcon className="w-4 h-4 text-muted-foreground" />
                          {formateDefaultAssetAmount(BigInt(bond.yourStakeAmount))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <WalletIcon className="w-4 h-4 text-muted-foreground" />
                          {formateDefaultAssetAmount(BigInt(bond.theirStakeAmount))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(Number(bond.createdAt) * 1000).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          bond.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bond.status}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        {bond.status === 'active' ? (
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => {
                                setIsBondModalOpen(true)
                                setBondAddress(bond.bondAddress)
                                setBondModalType('stake')
                              }}
                            >
                              <PlusIcon className="w-4 h-4" />
                              Add
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => {
                                setIsBondModalOpen(true)
                                setBondAddress(bond.bondAddress)
                                setBondModalType('withdraw')
                                // WithdrawBondForm(bond)
                              }}
                            >
                              <MinusIcon className="w-4 h-4" />
                              Withdraw
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setIsBondModalOpen(true)
                                setBondAddress(bond.bondAddress)
                                setBondModalType('break')
                              }}
                            >
                              <UnlinkIcon className="w-4 h-4" />
                              Break
                            </Button>
                          </div>
                        ) : (
                          null
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showOnboardModal && (
          <OnBoardForm
            key="onboard-modal"
            isOpen={showOnboardModal}
            onClose={() => setShowOnboardModal(false)}
          />
        )}

        {showConnectModal && (
          <AnimatedWalletConnect
            key="wallet-connect-modal"
            isOpen={showConnectModal}
            onClose={() => setShowConnectModal(false)}
          />
        )}
        

      <BondModal
        isOpen={isBondModalOpen}
        onClose={() => setIsBondModalOpen(false)}
        type={bondModalType}
        bondAddress={bondAddress}
      />
      </AnimatePresence>
    </div>
  );
}
