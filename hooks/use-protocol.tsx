import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui/client';
import { 
  getUserTrustProfile, 
  getUserBonds, 
  buildCreateProfileTx,
  buildCreateBondTx,
  buildJoinBondTx,
  buildWithdrawBondTx,
  buildBreakBondTx,
  extractCreatedObjects,
  User,
  UserBond,
  getSuiClient,
  buildHasTrustProfileTx,
  suiClient,
  getBondById,
  buildGetBondInfoTx,
  processBondInfoResult,
  getAllUserBondsWithDetails
} from '@/lib/calls';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, REGISTRY_ID, BOND_OBJECT_ID } from '@/lib/constants';
import { MIST_PER_SUI } from '@mysten/sui/utils';
import {  } from '@mysten/sui/utils';

// Define Registry ID

const CLOCK_OBJECT_ID = '0x6'; // Standard clock object ID

// Format balance from MIST to SUI
const formatBalance = (balance: string | number): number => {
  return Number(balance) / Number(MIST_PER_SUI);
};

// Define Bond type to match our contract
export interface Bond {
  bondId: string;
  counterPartyAddress: string;
  type: 'one-way' | 'two-way';  // corresponds to bond_type: 0 = one-way, 1 = two-way
  yourStakeAmount: number;
  theirStakeAmount: number;
  createdAt: number;
  status: 'active' | 'withdrawn' | 'broken'; // corresponds to bond_status: 0 = active, 1 = withdrawn, 2 = broken
}

// Define Profile type to match our contract
// Define Profile type to match our contract
export interface UserProfile {
  name: string;
  totalBonds: number;
  activeBonds: number;
  withdrawnBonds: number;
  brokenBonds: number;
  moneyInActiveBonds: number;
  moneyInWithdrawnBonds: number;
  moneyInBrokenBonds: number;
  trustScore: number;
  createdAt: number;
  updatedAt: number;
}

// Define the return type for useUserProfile
interface UserProfileResult {
  exists: boolean;
  data: UserProfile | null;
}
/**
 * Hook to fetch user data from Sui network
 */
export const useUserData = (address?: string) => {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  
  // Use provided address or current connected wallet
  const userAddress = address || currentAccount?.address;
  
  return useQuery<User | null>({
    queryKey: ['userData', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      return getUserTrustProfile(client, userAddress);
    },
    enabled: Boolean(userAddress),
  });
};

export const useHasUserProfile = (userAddress: string) => {
  const client = useSuiClient();

  console.log("userAddress", userAddress);
  console.log("client", client);
  return useQuery<boolean>({  
    queryKey: ['hasUserProfile', userAddress],
    queryFn: async () => {
      const tx = buildHasTrustProfileTx(userAddress);
      console.log(tx);
      console.log(userAddress);
      const response = await client.devInspectTransactionBlock({
        sender: userAddress,
        transactionBlock: tx,
      });
      console.log(response);
      // Extract return value from response and convert to boolean
      const returnValue = response.results?.[0]?.returnValues?.[0];
      if (!returnValue) {
        return false;
      }
      console.log("returnValue in useHasUserProfile", returnValue);
      // Convert to string first to safely handle any type
      const stringValue = String(returnValue[0]);
      return stringValue === '1' || stringValue === 'true';
    }
  });
};

/**
 * Hook to fetch user's bonds
 */
// export function useUserBonds(options?: { enabled?: boolean }) {
//   const suiClient = useSuiClient();
//   const currentAccount = useCurrentAccount();
  
//   return useQuery<UserBond[]>({
//     queryKey: ['userBonds', currentAccount?.address],
//     queryFn: async () => {
//       if (!currentAccount?.address) {
//         throw new Error('Wallet not connected');
//       }
      
//       try {
//         // Get all bond IDs for the user
//         const bondIds = await getUserBondIds(suiClient, currentAccount.address);
//         console.log("bondIds", bondIds);
//         if (!bondIds.length) {
//           return [];
//         }
        
//         // Fetch details for each bond
//         const bonds = await Promise.all(
//           bondIds.map(id => getBondById(suiClient, id))
//         );
        
//         // Filter out any null results
//         return bonds.filter(bond => bond !== null) as UserBond[];
//       } catch (error) {
//         console.error('Error fetching user bonds:', error);
//         throw error;
//       }
//     },
//     enabled: options?.enabled !== false && !!currentAccount?.address
//   });
// }

/**
 * Hook to fetch user's bonds from the contract
 */
export function useUserBondsFromContract(options?: { enabled?: boolean }) {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  return useQuery<UserBond[]>({
    queryKey: ['userBondsFromContract', currentAccount?.address],
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected');
      }

      return getAllUserBondsWithDetails(suiClient, BOND_OBJECT_ID, currentAccount.address);
    },
    enabled: options?.enabled !== false && !!currentAccount?.address  
  });
}

/**
 * Hook to create a user profile
 */
export const useCreateProfile = () => {
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const currentAccount = useCurrentAccount();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const tx = buildCreateProfileTx(name);
      const client = getSuiClient();
      
      const {digest} = await signAndExecuteTransaction({
        transaction: tx,
      });
      return digest;
    },
    onSuccess: () => {
      if (currentAccount?.address) {
        queryClient.invalidateQueries({ queryKey: ['userData', currentAccount.address] });
      }
    }
  });
};

/**
 * Hook to create a bond with another user
 */
export const useCreateBond = () => {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const currentAccount = useCurrentAccount();
  const { data: userData } = useUserData();
  
  return useMutation<
    string,
    Error,
    { counterpartyAddress: string; amount: number }
  >({
    mutationFn: async ({ counterpartyAddress, amount }) => {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected');
      }
      
      if (!userData?.profileId) {
        throw new Error('You need to create a profile first');
      }
      
      // Pass object with named parameters
      const tx = buildCreateBondTx(
        userData.profileId, 
        counterpartyAddress, 
        amount 
      );
      
      return new Promise((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              resolve(result.digest);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });
    },
    onSuccess: () => {
      if (currentAccount?.address) {
        queryClient.invalidateQueries({ queryKey: ['userData', currentAccount.address] });
        queryClient.invalidateQueries({ queryKey: ['userBonds', currentAccount.address] });
      }
    },
  });
};

/**
 * Hook to join an existing bond
 */
export const useJoinBond = () => {
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const currentAccount = useCurrentAccount();
  const { data: userData } = useUserData();
  
  return useMutation<
    string,
    Error,
    { bondId: string; amount: number }
  >({
    mutationFn: async ({ bondId, amount }) => {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected');
      }
      
      if (!userData?.profileId) {
        throw new Error('You need to create a profile first');
      }
      
      const tx = buildJoinBondTx(bondId, userData.profileId, amount);
      const {digest} = await signAndExecuteTransaction({
        transaction: tx,
      });
      return digest;
    },
    onSuccess: () => {
      // Invalidate queries
      if (currentAccount?.address) {
        queryClient.invalidateQueries({ queryKey: ['userData', currentAccount.address] });
        queryClient.invalidateQueries({ queryKey: ['userBonds', currentAccount.address] });
      }
    },
  });
};

/**
 * Hook to withdraw from a bond
 */
export const useWithdrawBond = () => {
  const { mutateAsync: SignAndExecuteTransaction } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const currentAccount = useCurrentAccount();
  const { data: userData } = useUserData();
  
  return useMutation<
    string,
    Error,
    { bondId: string }
  >({
    mutationFn: async ({ bondId }) => {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected');
      }
      
      if (!userData?.profileId) {
        throw new Error('Profile not found');
      }
      
      const tx = buildWithdrawBondTx(bondId, userData.profileId);
      const {digest} = await SignAndExecuteTransaction({
        transaction: tx,
      });
      return digest;
    },
    onSuccess: () => {
      // Invalidate queries
      if (currentAccount?.address) {
        queryClient.invalidateQueries({ queryKey: ['userData', currentAccount.address] });
        queryClient.invalidateQueries({ queryKey: ['userBonds', currentAccount.address] });
      }
    },
  });
};

/**
 * Hook to break a bond
 */
export const useBreakBond = () => {
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const currentAccount = useCurrentAccount();
  const { data: userData } = useUserData();
  
  return useMutation<
    string,
    Error,
    { bondId: string }
  >({
    mutationFn: async ({ bondId }) => {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected');
      }
      
      if (!userData?.profileId) {
        throw new Error('Profile not found');
      }
      
      const tx = buildBreakBondTx(bondId, userData.profileId);
      const {digest} = await signAndExecuteTransaction({
        transaction: tx,
      });
      return digest;
    },
    onSuccess: () => {
      // Invalidate queries
      if (currentAccount?.address) {
        queryClient.invalidateQueries({ queryKey: ['userData', currentAccount.address] });
        queryClient.invalidateQueries({ queryKey: ['userBonds', currentAccount.address] });
      }
    },
  });
};


/**
 * Hook to get bond details by ID
 */


// Fix UserProfile hook to properly accept options
export function useUserProfile(options?: { enabled?: boolean }) {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

  return useQuery<UserProfileResult>({
    queryKey: ['userProfile', currentAccount?.address],
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected');
      }

      try {
        // Step 1: Check if profile exists
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::trust::has_trust_profile`,
          arguments: [
            tx.object(REGISTRY_ID),
            tx.pure.address(currentAccount.address),
          ],
        });

        const response = await client.devInspectTransactionBlock({
          sender: currentAccount.address,
          transactionBlock: tx,
        });

        const returnValue = response.results?.[0]?.returnValues?.[0];
        const exists = returnValue && String(returnValue[0]) === '1';

        if (!exists) {
          return { exists: false, data: null };
        }

        // Step 2: Get profile ID
        const profileId = await getProfileId(REGISTRY_ID, currentAccount.address);

        // Step 3: Get profile data
        const data = await getProfileData(profileId);

        return { exists: true, data };
      } catch (error) {
        console.error('Error fetching profile data:', error);
        return { exists: false, data: null };
      }
    },
    enabled: options?.enabled !== false && !!currentAccount?.address && !!REGISTRY_ID,
  });
}

// Function to get a profile ID from the registry
async function getProfileId(registryId: string, userAddress: string): Promise<string> {
  console.log(`Looking up profile ID for address ${userAddress}...`);

  try {
    const objects = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::trust::TrustProfile`,
      },
      options: {
        showContent: true,
      },
    });

    if (!objects.data || objects.data.length === 0) {
      throw new Error(`No profile found for address ${userAddress}`);
    }

    const profileId = objects.data[0].data?.objectId;
    if (!profileId) {
      throw new Error(`Invalid profile for address ${userAddress}`);
    }

    console.log(`Found profile ID: ${profileId}`);
    return profileId;
  } catch (error) {
    console.error("Error finding profile:", error);
    throw error;
  }
}

// Function to get profile data from an ID
async function getProfileData(profileId: string): Promise<UserProfile> {
  console.log(`Fetching profile data for ${profileId}...`);

  try {
    const profile = await suiClient.getObject({
      id: profileId,
      options: { showContent: true },
    });

    console.log("GET PROFILE DATA RESPONSE", profile);

    if (!profile.data || profile.data.content?.dataType !== 'moveObject') {
      throw new Error("Invalid profile object");
    }

    const fields = profile.data.content.fields as {
      name: string;
      total_bonds: string | number;
      active_bonds: string | number;
      withdrawn_bonds: string | number;
      broken_bonds: string | number;
      money_in_active_bonds: string | number;
      money_in_withdrawn_bonds: string | number;
      money_in_broken_bonds: string | number;
      trust_score: string | number;
      created_at: string | number;
      updated_at: string | number;
    };

    return {
      name: fields.name,
      totalBonds: Number(fields.total_bonds),
      activeBonds: Number(fields.active_bonds),
      withdrawnBonds: Number(fields.withdrawn_bonds),
      brokenBonds: Number(fields.broken_bonds),
      moneyInActiveBonds: formatBalance(fields.money_in_active_bonds),
      moneyInWithdrawnBonds: formatBalance(fields.money_in_withdrawn_bonds),
      moneyInBrokenBonds: formatBalance(fields.money_in_broken_bonds),
      trustScore: Number(fields.trust_score),
      createdAt: Number(fields.created_at),
      updatedAt: Number(fields.updated_at),
    };
  } catch (error) {
    console.error(`Error getting profile data:`, error);
    throw new Error(`Failed to get profile data: ${error}`);
  }
}

// Helper function to properly format balance values

// Find ProfileRegistry (used during initialization)
export function useProfileRegistry() {
  const client = useSuiClient();
  
  return useQuery({
    queryKey: ['profileRegistry', PACKAGE_ID],
    queryFn: async () => {
      if (!REGISTRY_ID) {
        console.warn("Registry ID not configured. Please set NEXT_PUBLIC_REGISTRY_ID in your environment.");
        return null;
      }
      return REGISTRY_ID;
    },
  });
}



// Get profile ID for the current user
export function useProfileId() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  
  return useQuery({
    queryKey: ['profileId', currentAccount?.address, REGISTRY_ID],
    queryFn: async () => {
      if (!currentAccount?.address) throw new Error('Wallet not connected');
      if (!REGISTRY_ID) throw new Error('Registry ID not configured');
      
      try {
        // Query owned objects to find the TrustProfile
        const objects = await client.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::trust::TrustProfile`
          },
          options: {
            showContent: true,
          }
        });
        
        if (!objects.data || objects.data.length === 0) {
          throw new Error('No profile found');
        }
        
        const profileId = objects.data[0].data?.objectId;
        if (!profileId) {
          throw new Error('Invalid profile');
        }
        
        return profileId;
      } catch (error) {
        console.error('Error getting profile ID:', error);
        throw error;
      }
    },
    enabled: !!currentAccount?.address && !!REGISTRY_ID,
  });
}
