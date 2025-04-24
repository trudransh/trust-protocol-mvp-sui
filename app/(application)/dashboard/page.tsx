"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusIcon,
  MinusIcon,
  UserIcon,
  HandshakeIcon,
  CurrencyIcon,
  StarIcon,
  WalletIcon,
  LinkIcon,
  UnlinkIcon,
} from "lucide-react";

// Sui-specific wallet hook (commented out)
// import { useWallet } from "@suiet/wallet-kit";
// Placeholder for Sui-specific hooks (commented out)
// import { useSuiUserWallet, useSuiUserDetails } from "@/hooks/use-sui-protocol";
// Utility functions
import { formatDecimal, formatNumber, formatAddress, truncateText } from "@/lib/utils";
// Components
import { OnBoardForm } from "@/components/dashboard/onboard-form";
import { BondModal } from "@/components/bond-modal";
import { AnimatedWalletConnect } from "@/components/animated-connect-button";
import { BondLoadingModal } from "@/components/bond-loading-modal";

// Sui-specific address truncation
function truncateSuiAddress(address: string) {
  if (!address) return "";
  return address.slice(0, 6) + "..." + address.slice(-4);
}

// Define NULL_ADDRESS for Sui
const NULL_ADDRESS = "0x0";

// UserResolver component (static version)
function UserResolver({ address }: { address: string }) {
  // const { data: userWallet, isLoading } = useSuiUserWallet(address);
  // if (isLoading) {
  //   return <span>Loading...</span>;
  // }
  // return <span>{truncateSuiAddress(userWallet ?? NULL_ADDRESS)}</span>;
  return <span>{truncateSuiAddress(address)}</span>;
}

// Static mock data
const staticUserDetails = {
  totalAmount: "1000000",
  totalWithdrawnAmount: "200000",
  totalBrokenAmount: "100000",
  totalActiveBonds: 2,
  totalBrokenBonds: 1,
  totalWithdrawnBonds: 1,
  bondsDetails: [
    {
      counterPartyAddress: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      type: "two-way",
      yourStakeAmount: "500000",
      theirStakeAmount: "500000",
      createdAt: "1697059200", // Example timestamp (Oct 12, 2023)
      status: "active",
      bondAddress: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    },
    {
      counterPartyAddress: "0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
      type: "one-way",
      yourStakeAmount: "300000",
      theirStakeAmount: "0",
      createdAt: "1694476800", // Example timestamp (Sep 12, 2023)
      status: "active",
      bondAddress: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    },
  ],
};

export default function Dashboard() {
  // Wallet connection using Sui's useWallet hook (commented out)
  // const { connected: isConnected, account } = useWallet();
  // const address = account?.address;

  // Fetch user data from Sui contracts (commented out)
  // const { data: userWallet, isLoading: walletLoading } = useSuiUserWallet(
  //   address ?? NULL_ADDRESS
  // );
  // const { data: userDetails, isLoading: userDetailsLoading } = useSuiUserDetails(
  //   address ?? NULL_ADDRESS
  // );

  // State for bond modal
  const [bondAddress, setBondAddress] = useState(undefined);
  const [isBondModalOpen, setIsBondModalOpen] = useState(false);
  const [bondModalType, setBondModalType] = useState("create");

  // Modal states (commented out dynamic logic)
  // const [showOnboardModal, setShowOnboardModal] = useState(false);
  // const [showConnectModal, setShowConnectModal] = useState(false);

  // Open OnBoard modal if userWallet is not registered (commented out)
  // useEffect(() => {
  //   if (!walletLoading && (userWallet === NULL_ADDRESS || !userWallet)) {
  //     setShowOnboardModal(true);
  //   } else {
  //     setShowOnboardModal(false);
  //   }
  // }, [userWallet, walletLoading]);

  // Open Wallet Connect modal if not connected (commented out)
  // useEffect(() => {
  //   if (!isConnected) {
  //     setShowConnectModal(true);
  //   } else {
  //     setShowConnectModal(false);
  //   }
  // }, [isConnected]);

  // Loading state (commented out)
  // if (walletLoading) {
  //   return <BondLoadingModal />;
  // }

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
              <div className="text-2xl font-bold">
                $
                {staticUserDetails.totalAmount !== undefined &&
                staticUserDetails.totalWithdrawnAmount !== undefined
                  ? formatDecimal(
                      Number(
                        BigInt(staticUserDetails.totalAmount) -
                          BigInt(staticUserDetails.totalWithdrawnAmount) -
                          BigInt(staticUserDetails.totalBrokenAmount)
                      ) / 1e9 // Assuming 9 decimals for SUI
                    )
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total Amount LifeTime $
                {staticUserDetails.totalAmount !== undefined
                  ? formatDecimal(Number(BigInt(staticUserDetails.totalAmount)) / 1e9)
                  : "N/A"}
              </p>
            </CardContent>
          </Card>

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
              <div className="text-2xl font-bold">
                {staticUserDetails.totalActiveBonds}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {staticUserDetails.totalBrokenBonds} broken bonds,{" "}
                {staticUserDetails.totalWithdrawnBonds} withdrawn bonds
              </p>
            </CardContent>
          </Card>

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
            <h3 className="text-lg font-semibold text-gray-900">
              Bond Management
            </h3>
            <p className="text-sm text-gray-600">
              Click Create Bond And Start Your Trust Relationships
            </p>
          </div>
          <Button
            // onClick={() => {
            //   setIsBondModalOpen(true);
            //   setBondModalType("create");
            // }}
            disabled
            className="h-12 px-6 text-base whitespace-nowrap w-full sm:w-auto bg-[#0066FF] hover:bg-[#0052CC] text-white"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Create New Bond
          </Button>
        </div>

        {/* Active Bonds Table */}
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
                  {staticUserDetails.bondsDetails.map((bond, index) => (
                    <TableRow key={index} className="hover:bg-secondary/30">
                      <TableCell className="font-medium flex items-center gap-2">
                        <span className="bg-primary/10 p-1 rounded-full">
                          <UserIcon className="w-4 h-4 text-primary" />
                        </span>
                        <UserResolver address={bond.counterPartyAddress} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            bond.type === "two-way"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {bond.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <WalletIcon className="w-4 h-4 text-muted-foreground" />
                          {formatDecimal(Number(BigInt(bond.yourStakeAmount)) / 1e9)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <WalletIcon className="w-4 h-4 text-muted-foreground" />
                          {formatDecimal(Number(BigInt(bond.theirStakeAmount)) / 1e9)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(Number(bond.createdAt) * 1000).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            bond.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bond.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {bond.status === "active" ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                              // onClick={() => {
                              //   setIsBondModalOpen(true);
                              //   setBondAddress(bond.bondAddress);
                              //   setBondModalType("stake");
                              // }}
                              disabled
                            >
                              <PlusIcon className="w-4 h-4" />
                              Add
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                              // onClick={() => {
                              //   setIsBondModalOpen(true);
                              //   setBondAddress(bond.bondAddress);
                              //   setBondModalType("withdraw");
                              // }}
                              disabled
                            >
                              <MinusIcon className="w-4 h-4" />
                              Withdraw
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              // onClick={() => {
                              //   setIsBondModalOpen(true);
                              //   setBondAddress(bond.bondAddress);
                              //   setBondModalType("break");
                              // }}
                              disabled
                            >
                              <UnlinkIcon className="w-4 h-4" />
                              Break
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals (commented out) */}
      <AnimatePresence>
        {/* {showOnboardModal && (
          <OnBoardForm
            key="onboard-modal"
            isOpen={showOnboardModal}
            onClose={() => setShowOnboardModal(false)}
          />
        )} */}

        {/* {showConnectModal && (
          <AnimatedWalletConnect
            key="wallet-connect-modal"
            isOpen={showConnectModal}
            onClose={() => setShowConnectModal(false)}
          />
        )} */}

        {/* <BondModal
          isOpen={isBondModalOpen}
          onClose={() => setIsBondModalOpen(false)}
          type={bondModalType}
          bondAddress={bondAddress}
        /> */}
      </AnimatePresence>
    </div>
  );
}