"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
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
  CircleIcon,
  CircleCheckIcon,
  XCircleIcon,
} from "lucide-react";

// Utility functions
import { formatAmount } from "@/lib/utils";
// Components
import { OnboardForm } from "@/components/dashboard/onboard-form";
import { BondModal } from "@/components/bond-modal";
import { BondLoadingModal } from "@/components/bond-loading-modal";

// Hooks
import { useUserProfile, useUserBondsFromContract } from "@/hooks/use-protocol";

// Format amounts with SUI token
const formatSui = (amount: number) => {
  return `${formatAmount(amount)} SUI`;
};

// Sui-specific address truncation
function truncateSuiAddress(address: string | undefined) {
  if (!address) return "";
  return address.slice(0, 6) + "..." + address.slice(-4);
}

// UserResolver component
function UserResolver({ address }: { address: string | undefined }) {
  return <span>{truncateSuiAddress(address)}</span>;
}

// Bond status badge component
function BondStatusBadge({ status }: { status: string }) {
  let bgColor, textColor, icon;

  switch (status) {
    case "active":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = <CircleCheckIcon className="w-3 h-3 mr-1" />;
      break;
    case "withdrawn":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      icon = <MinusIcon className="w-3 h-3 mr-1" />;
      break;
    case "broken":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      icon = <XCircleIcon className="w-3 h-3 mr-1" />;
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
      icon = <CircleIcon className="w-3 h-3 mr-1" />;
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs ${bgColor} ${textColor} flex items-center inline-flex`}
    >
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Dashboard() {
  console.log("Dashboard component mounting...");
  const currentAccount = useCurrentAccount();
  const address = currentAccount?.address;

  // Data fetching hooks
  const {
    data: userProfileResult,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchUserProfile,
  } = useUserProfile();

  // Access the profile data from the result
  const profileExists = userProfileResult?.exists || false;
  const userProfile = userProfileResult?.data || null;

  // Log profile data and state changes for debugging
  useEffect(() => {
    console.log("Current state:", {
      address,
      profileLoading,
      profileExists,
      profileError: profileError?.message,
      userProfile,
    });
    if (userProfileResult) {
      console.log("User profile result:", userProfileResult);
      if (userProfile) {
        console.log("Profile data successfully loaded:", userProfile);
      }
    }
  }, [address, profileLoading, profileExists, profileError, userProfileResult, userProfile]);

  // Bond filtering and sorting
  const [bondStatusFilter, setBondStatusFilter] = useState<string | null>(null);

  const { data: bonds, isLoading: bondsLoading, isError: bondsError, error: bondsErrorDetails } = useUserBondsFromContract();

  // Log bond data for debugging
  useEffect(() => {
    console.log("Bonds state:", {
      bonds,
      bondsLoading,
      bondsError,
      bondsErrorDetails: bondsErrorDetails?.message,
    });
  }, [bonds, bondsLoading, bondsError, bondsErrorDetails]);

  // Timeout to detect stuck loading state
  useEffect(() => {
    if (profileLoading || bondsLoading) {
      const timer = setTimeout(() => {
        console.warn("Loading timeout after 10 seconds. Profile loading:", profileLoading, "Bonds loading:", bondsLoading);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [profileLoading, bondsLoading]);

  // Filtered bonds based on status
  const filteredBonds = bondStatusFilter
    ? bonds?.filter((bond) => bond.status === bondStatusFilter)
    : bonds;

  // Count bonds by status
  const activeBondsCount = bonds?.filter((bond) => bond.status === "active").length || 0;
  const brokenBondsCount = bonds?.filter((bond) => bond.status === "broken").length || 0;
  const withdrawnBondsCount = bonds?.filter((bond) => bond.status === "withdrawn").length || 0;

  // Bond modal states
  const [selectedBondId, setSelectedBondId] = useState<string | undefined>(undefined);
  const [isBondModalOpen, setIsBondModalOpen] = useState(false);
  const [bondModalType, setBondModalType] = useState<"create" | "stake" | "withdraw" | "break">("create");

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    console.log("Onboarding completed, refreshing dashboard...");
    await refetchUserProfile();
    if (profileExists === true) {
      console.log("Refetching bonds");
    }
  };

  // Calculate dashboard metrics safely
  const totalValueLocked = userProfile ? userProfile.moneyInActiveBonds || 0 : 0;
  const totalWithdrawnAmount = userProfile ? userProfile.moneyInWithdrawnBonds || 0 : 0;
  const totalBrokenAmount = userProfile ? userProfile.moneyInBrokenBonds || 0 : 0;
  const totalAmount = totalValueLocked + totalWithdrawnAmount + totalBrokenAmount;

  // Loading state: Show loader if address is missing, profile is loading, or bonds are loading for an existing profile
  if (!address || profileLoading || (profileExists === true && bondsLoading)) {
    console.log("Showing loading modal", { address, profileLoading, profileExists, bondsLoading });
    return <BondLoadingModal />;
  }

  // Error or no profile: Show onboarding form
  if (profileError || profileExists === false) {
    console.log("Showing onboarding modal due to:", { profileError: profileError?.message, profileExists });
    return <OnboardForm onClose={handleOnboardingComplete} />;
  }

  // Dashboard content: Render when profile data is available
  if (profileExists === true && userProfile) {
    console.log("Rendering dashboard with profile data");
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#cdffd8] to-[#94b9ff]">
        <main className="container mx-auto p-4 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold bg-clip-text text-primary">
              {userProfile.name}'s Sui Trust Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Track and manage your on-chain trust relationships on Sui
            </p>
          </div>

          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-lg bg-white/80 transition-shadow">
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
                  {formatSui(totalValueLocked)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total Withdrawn: {formatSui(totalWithdrawnAmount)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total Broken: {formatSui(totalBrokenAmount)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total Lifetime Value: {formatSui(totalAmount)}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg bg-white/80 transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <HandshakeIcon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Bond Statistics
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userProfile.activeBonds || 0} Active
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  Broken Bonds: {userProfile.brokenBonds || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  Withdrawn Bonds: {userProfile.withdrawnBonds || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  Total Bonds: {userProfile.totalBonds || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg bg-white/80 transition-shadow">
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
                <div className="text-2xl font-bold">
                  {userProfile.trustScore || 100}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Based on your Sui chain bond activity
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Profile created:{" "}
                  {new Date(Number(userProfile.createdAt) * 1000).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Last updated:{" "}
                  {new Date(Number(userProfile.updatedAt) * 1000).toLocaleDateString()}
                </div>
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
                Create and manage trust bonds using SUI tokens
              </p>
            </div>
            <Button
              onClick={() => {
                console.log("Opening bond creation modal");
                setIsBondModalOpen(true);
                setBondModalType("create");
                setSelectedBondId(undefined);
              }}
              className="h-12 px-6 text-base whitespace-nowrap w-full sm:w-auto bg-[#0066FF] hover:bg-[#0052CC] text-white"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Create New Bond
            </Button>
          </div>

          {/* Bonds Table with Filter */}
          <div className="mt-8 flex-1 overflow-hidden min-h-[400px]">
            <Card className="h-full bg-white/80 flex flex-col">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    All Bonds ({bonds?.length || 0})
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant={bondStatusFilter === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBondStatusFilter(null)}
                    >
                      All ({bonds?.length || 0})
                    </Button>
                    <Button
                      variant={bondStatusFilter === "active" ? "default" : "outline"}
                      size="sm"
                      className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                      onClick={() => setBondStatusFilter("active")}
                    >
                      Active ({activeBondsCount})
                    </Button>
                    <Button
                      variant={bondStatusFilter === "withdrawn" ? "default" : "outline"}
                      size="sm"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                      onClick={() => setBondStatusFilter("withdrawn")}
                    >
                      Withdrawn ({withdrawnBondsCount})
                    </Button>
                    <Button
                      variant={bondStatusFilter === "broken" ? "default" : "outline"}
                      size="sm"
                      className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                      onClick={() => setBondStatusFilter("broken")}
                    >
                      Broken ({brokenBondsCount})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader className="bg-secondary/50 sticky top-0">
                    <TableRow>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Your Stake</TableHead>
                      <TableHead>Their Stake</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBonds && filteredBonds.length > 0 ? (
                      filteredBonds.map((bond, index) => (
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
                              {formatSui(bond.yourStakeAmount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <WalletIcon className="w-4 h-4 text-muted-foreground" />
                              {formatSui(bond.theirStakeAmount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(Number(bond.createdAt) * 1000).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <BondStatusBadge status={bond.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {bond.status === "active" ? (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => {
                                    console.log("Opening stake modal for bond:", bond.bondId);
                                    setIsBondModalOpen(true);
                                    setSelectedBondId(bond.bondId);
                                    setBondModalType("stake");
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
                                    console.log("Opening withdraw modal for bond:", bond.bondId);
                                    setIsBondModalOpen(true);
                                    setSelectedBondId(bond.bondId);
                                    setBondModalType("withdraw");
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
                                    console.log("Opening break modal for bond:", bond.bondId);
                                    setIsBondModalOpen(true);
                                    setSelectedBondId(bond.bondId);
                                    setBondModalType("break");
                                  }}
                                >
                                  <UnlinkIcon className="w-4 h-4" />
                                  Break
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {bondStatusFilter
                            ? `No ${bondStatusFilter} bonds found.`
                            : "No bonds found. Create a new bond to get started."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Modals */}
        <AnimatePresence>
          <BondModal
            isOpen={isBondModalOpen}
            onClose={() => {
              console.log("Bond modal closing, will refresh data");
              setIsBondModalOpen(false);
              setTimeout(() => {
                refetchUserProfile();
                if (profileExists === true) {
                  console.log("Refetching bonds");
                }
              }, 100);
            }}
            type={bondModalType}
            bondId={selectedBondId}
          />
        </AnimatePresence>
      </div>
    );
  }

  // Fallback for unexpected state
  console.log("Unexpected state: showing onboarding modal");
  return <OnboardForm onClose={handleOnboardingComplete} />;
}