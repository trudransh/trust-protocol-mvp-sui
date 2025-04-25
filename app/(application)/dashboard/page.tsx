"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { AnimatePresence, motion } from "framer-motion";
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

// Utility functions
import { formatDecimal, formatNumber, formatAddress, truncateText } from "@/lib/utils";
// Components
import { OnboardForm } from "@/components/dashboard/onboard-form";
import { BondModal } from "@/components/bond-modal";
import { BondLoadingModal } from "@/components/bond-loading-modal";

// Important: Use the correct hook name - useHasUserProfile, not useHasProfile
import { useHasUserProfile, useUserProfile, useUserBonds,useProfileId } from "@/hooks/use-protocol";
import { formatAmount } from "@/lib/utils";

// Sui-specific address truncation
function truncateSuiAddress(address) {
  if (!address) return "";
  return address.slice(0, 6) + "..." + address.slice(-4);
}

// Define NULL_ADDRESS for Sui
const NULL_ADDRESS = "0x0";

// UserResolver component
function UserResolver({ address }) {
  return <span>{truncateSuiAddress(address)}</span>;
}

export default function Dashboard() {
  console.log("Dashboard component mounting...");
  const currentAccount = useCurrentAccount();
  const address = currentAccount?.address || NULL_ADDRESS;
  console.log("Current account address:", address);
  
  // App state - using useRef to avoid rerender cycles
  const initializingRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const profileCheckAttemptsRef = useRef(0);
  const maxAttempts = 3;
  const timeoutRef = useRef(null);
  
  // Bond modal states
  const [selectedBondId, setSelectedBondId] = useState(undefined);
  const [isBondModalOpen, setIsBondModalOpen] = useState(false);
  const [bondModalType, setBondModalType] = useState('create');
  
  // Data fetching hooks with the CORRECT hook name - useHasUserProfile
  const { 
    data: hasProfile, 
    isLoading: profileCheckLoading, 
    refetch: refetchProfileCheck 
  } = useHasUserProfile(address);
  
  console.log("useHasUserProfile result:", { hasProfile, profileCheckLoading });
  
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    refetch: refetchUserProfile,
    isError: profileError,
    error: profileErrorDetails
  } = useUserProfile({
    enabled: hasProfile === true
  });

  const {
    data: profileId,
    isLoading: profileIdLoading,
    refetch: refetchProfileId
  } = useProfileId();

  console.log("profileId", profileId);
  
  console.log("useUserProfile result:", { 
    userProfile, 
    profileLoading,
    profileError,
    errorDetails: profileErrorDetails
  });
  
  const { 
    data: userBonds, 
    isLoading: bondsLoading, 
    refetch: refetchUserBonds 
  } = useUserBonds({
    enabled: hasProfile === true
  });
  
  console.log("useUserBonds result:", { userBonds, bondsLoading });
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  // Set timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        console.log("Loading timeout reached after 15 seconds");
        
        // Check if we're still loading
        if (isLoading) {
          console.log("Still loading after timeout, showing error state");
          setIsLoading(false);
          
          // If hasProfile is true but no profile data, show onboarding
          if (hasProfile === true && !userProfile) {
            console.log("Profile exists but data failed to load, showing onboarding as fallback");
            setShowOnboardModal(true);
          }
        }
        
        timeoutRef.current = null;
      }, 15000); // 15 second timeout
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, hasProfile, userProfile]);
  
  // Process profile check and data loading
  useEffect(() => {
    // Skip first render
    if (initializingRef.current) {
      initializingRef.current = false;
      return;
    }
    
    console.log("Profile check state:", {
      profileCheckLoading,
      hasProfile,
      userProfile,
      profileLoading,
      bondsLoading,
      profileError,
      attempts: profileCheckAttemptsRef.current
    });
    
    const manageProfileState = async () => {
      // If profile check is loading, wait
      if (profileCheckLoading) {
        console.log("Profile check is still loading");
        return;
      }
      
      // Profile check complete
      console.log("Profile check completed. Result:", hasProfile);
      
      if (hasProfile === true) {
        console.log("User has profile, checking data loading state");
        
        // If data is loading, wait
        if (profileLoading || bondsLoading) {
          console.log("Profile or bonds data still loading");
          setIsLoading(true);
          setDashboardReady(false);
          return;
        }
        
        // Data loading complete
        if (userProfile) {
          console.log("Profile data loaded successfully:", userProfile);
          setIsLoading(false);
          setDashboardReady(true);
          setShowOnboardModal(false);
        } else {
          console.log("Profile check says user has profile, but data is missing");
          
          // Try refetching if within attempt limits
          if (profileCheckAttemptsRef.current < maxAttempts) {
            profileCheckAttemptsRef.current++;
            console.log(`Attempt ${profileCheckAttemptsRef.current}/${maxAttempts}: Refetching profile data`);
            try {
              await refetchUserProfile();
            } catch (err) {
              console.error("Error refetching profile data:", err);
            }
          } else {
            console.log("Max attempts reached. Showing onboarding as fallback");
            setIsLoading(false);
            setDashboardReady(false);
            setShowOnboardModal(true);
          }
        }
      } else if (hasProfile === false) {
        console.log("User does not have a profile, showing onboarding modal");
        setIsLoading(false);
        setDashboardReady(false);
        setShowOnboardModal(true);
      } else {
        console.log("hasProfile is undefined, attempting to refetch");
        
        if (profileCheckAttemptsRef.current < maxAttempts) {
          profileCheckAttemptsRef.current++;
          console.log(`Attempt ${profileCheckAttemptsRef.current}/${maxAttempts}: Refetching profile check`);
          try {
            await refetchProfileCheck();
          } catch (err) {
            console.error("Error refetching profile check:", err);
          }
        } else {
          console.log("Max attempts reached with undefined profile check. Showing onboarding.");
          setIsLoading(false);
          setDashboardReady(false);
          setShowOnboardModal(true);
        }
      }
    };
    
    manageProfileState();
  }, [
    hasProfile, 
    profileCheckLoading, 
    userProfile, 
    profileLoading, 
    bondsLoading, 
    profileError,
    refetchProfileCheck,
    refetchUserProfile
  ]);
  
  // Refetch all data - with improved error handling
  const refetchData = async () => {
    console.log("Refreshing all data...");
    setIsLoading(true);
    setDashboardReady(false);
    profileCheckAttemptsRef.current = 0;
    
    try {
      // First check if profile exists
      console.log("Checking if profile exists...");
      const profileCheckResult = await refetchProfileCheck();
      console.log("Profile check result:", profileCheckResult);
      
      if (profileCheckResult.data === true) {
        console.log("Profile confirmed to exist, fetching profile data...");
        
        try {
          const profileResult = await refetchUserProfile();
          console.log("Profile data result:", profileResult);
          
          if (profileResult.data) {
            console.log("Profile data loaded successfully");
            
            // Also refetch bonds but don't block on it
            refetchUserBonds()
              .then(result => console.log("Bonds data refreshed:", result))
              .catch(err => console.error("Error refreshing bonds:", err));
            
            setDashboardReady(true);
            setShowOnboardModal(false);
          } else {
            console.log("Profile data failed to load");
            setDashboardReady(false);
          }
        } catch (err) {
          console.error("Error fetching profile data:", err);
          setDashboardReady(false);
        }
      } else {
        console.log("No profile found or profile check failed");
        setShowOnboardModal(true);
        setDashboardReady(false);
      }
    } catch (error) {
      console.error("Error in refetchData:", error);
      setDashboardReady(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    console.log("Onboarding completed, refreshing dashboard...");
    await refetchData();
  };
  
  // Calculate dashboard metrics safely
  const totalValueLocked = userProfile ? userProfile.moneyInActiveBonds || 0 : 0;
  const totalWithdrawnAmount = userProfile ? userProfile.moneyInWithdrawnBonds || 0 : 0;
  const totalBrokenAmount = userProfile ? userProfile.moneyInBrokenBonds || 0 : 0;
  const totalAmount = totalValueLocked + totalWithdrawnAmount + totalBrokenAmount;
  
  console.log("Rendering dashboard with states:", { 
    isLoading, 
    dashboardReady, 
    showOnboardModal 
  });
  
  // Show loading screen during initial load or data fetching
  if (isLoading || !dashboardReady) {
    console.log("Showing loading modal. Loading state:", { isLoading, dashboardReady });
    return <BondLoadingModal />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#cdffd8] to-[#94b9ff]">
      <main className="container mx-auto p-4 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-clip-text text-primary">
            Trust Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Track and manage your on-chain trust relationships
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
                ${formatAmount(totalValueLocked)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Withdrawn Amount: ${formatAmount(totalWithdrawnAmount)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Broken Amount: ${formatAmount(totalBrokenAmount)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Amount Lifetime: ${formatAmount(totalAmount)}
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
                  Active Bonds
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userProfile?.activeBonds || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Broken Bonds: {userProfile?.brokenBonds || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Withdrawn Bonds: {userProfile?.withdrawnBonds || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Bonds: {userProfile?.totalBonds || 0}
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
                {userProfile?.trustScore || 100}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Based on your bond activity
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
              Click Create Bond And Start Your Trust Relationships
            </p>
          </div>
          <Button
            onClick={() => {
              console.log("Opening bond creation modal");
              setIsBondModalOpen(true);
              setBondModalType('create');
              setSelectedBondId(undefined);
            }}
            className="h-12 px-6 text-base whitespace-nowrap w-full sm:w-auto bg-[#0066FF] hover:bg-[#0052CC] text-white"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Create New Bond
          </Button>
        </div>

        {/* Active Bonds Table */}
        <div className="mt-8 flex-1 overflow-hidden min-h-[400px]">
          <Card className="h-full bg-white/80 flex flex-col">
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
                  {userBonds && userBonds.length > 0 ? (
                    userBonds.map((bond, index) => (
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
                              bond.type === 'two-way' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {bond.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <WalletIcon className="w-4 h-4 text-muted-foreground" />
                            {formatAmount(bond.yourStakeAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <WalletIcon className="w-4 h-4 text-muted-foreground" />
                            {formatAmount(bond.theirStakeAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(Number(bond.createdAt) * 1000).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              bond.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
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
                                  console.log("Opening stake modal for bond:", bond.bondId);
                                  setIsBondModalOpen(true);
                                  setSelectedBondId(bond.bondId);
                                  setBondModalType('stake');
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
                                  setBondModalType('withdraw');
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
                                  setBondModalType('break');
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
                        No active bonds found. Create a new bond to get started.
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
        {showOnboardModal && (
          <OnboardForm
            key="onboard-modal"
            onClose={handleOnboardingComplete}
          />
        )}

        <BondModal
          isOpen={isBondModalOpen}
          onClose={() => {
            console.log("Bond modal closing, will refresh data");
            setIsBondModalOpen(false);
            // Small delay to ensure state updates
            setTimeout(() => refetchData(), 100);
          }}
          type={bondModalType as 'create' | 'withdraw' | 'break' | 'stake'}
          bondId={selectedBondId}
        />
      </AnimatePresence>
    </div>
  );
}