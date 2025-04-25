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
  buildHasTrustProfileTx
} from '@/lib/calls';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from '@/lib/constants';
import { MIST_PER_SUI } from '@mysten/sui/utils';
import {  } from '@mysten/sui/utils';

// Define Registry ID
export const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID || "";
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
      const response = await client.devInspectTransactionBlock({
        sender: userAddress,
        transactionBlock: tx,
      });
      console.log("response in useHasUserProfile", response);
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
export function useUserBonds(options?: { enabled?: boolean }) {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  
  return useQuery<Bond[]>({
    queryKey: ['userBonds', currentAccount?.address],
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected');
      }
      
      try {
        // Query owned and object references for TrustBond objects
        const objects = await client.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::trust::TrustBond`
          },
          options: {
            showContent: true,
          }
        });
        
        if (!objects.data || objects.data.length === 0) {
          return [] as Bond[];
        }
        
        // Process all bonds
        const bonds: Bond[] = [];
        
        for (const obj of objects.data) {
          if (!obj.data?.objectId || !obj.data.content) continue;
          
          const bondId = obj.data.objectId;
          
          // Get full bond data
          const bond = await client.getObject({
            id: bondId,
            options: { showContent: true },
          });
          
          if (bond.data?.content?.dataType !== 'moveObject') continue;
          
          // Extract bond fields
          const fields = bond.data.content.fields as {
            user_1: string;
            user_2: string;
            bond_type: string | number;
            bond_status: string | number;
            money_by_user_1: { value: string | number };
            money_by_user_2: { value: string | number };
            created_at: string | number;
          };
          
          // Determine if current user is user1 or user2
          const isUser1 = fields.user_1 === currentAccount.address;
          
          bonds.push({
            bondId,
            counterPartyAddress: isUser1 ? fields.user_2 : fields.user_1,
            type: Number(fields.bond_type) === 0 ? 'one-way' : 'two-way',
            yourStakeAmount: formatBalance(isUser1 ? fields.money_by_user_1.value : fields.money_by_user_2.value),
            theirStakeAmount: formatBalance(isUser1 ? fields.money_by_user_2.value : fields.money_by_user_1.value),
            createdAt: Number(fields.created_at),
            status: Number(fields.bond_status) === 0 ? 'active' : 
                    Number(fields.bond_status) === 1 ? 'withdrawn' : 'broken'
          });
        }
        
        return bonds;
      } catch (error) {
        console.error('Error fetching user bonds:', error);
        return [] as Bond[];
      }
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!currentAccount?.address,
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
export const useBond = (bondId?: string) => {
  const client = useSuiClient();
  
  return useQuery<UserBond | null>({
    queryKey: ['bond', bondId],
    queryFn: async () => {
      if (!bondId) return null;
      try {
        const response = await client.getObject({
          id: bondId,
          options: { showContent: true },
        });
        
        // Format bond data
        if (response.data?.content?.dataType === 'moveObject') {
          const fields = response.data.content.fields as any;
          const user1 = fields.user_1;
          const user2 = fields.user_2;
          const moneyByUser1 = Number(fields.money_by_user_1?.value || 0) / 1_000_000_000;
          const moneyByUser2 = Number(fields.money_by_user_2?.value || 0) / 1_000_000_000;
          const bondType = Number(fields.bond_type);
          const bondStatus = Number(fields.bond_status);
          
          return {
            bondId,
            user1,
            user2,
            yourStakeAmount: moneyByUser1, // Default perspective
            theirStakeAmount: moneyByUser2,
            totalAmount: moneyByUser1 + moneyByUser2,
            createdAt: Number(fields.created_at),
            status: bondStatus === 0 ? "active" : bondStatus === 1 ? "withdrawn" : "broken",
            counterPartyAddress: user2, // Default perspective
            type: bondType === 0 ? "one-way" : "two-way"
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching bond ${bondId}:`, error);
        return null;
      }
    },
    enabled: Boolean(bondId),
  });
};

// Fix UserProfile hook to properly accept options
export function useUserProfile(options?: { enabled?: boolean }) {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  
  return useQuery<UserProfile>({
    queryKey: ['userProfile', currentAccount?.address],
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('Wallet not connected');
      }
      
     
        // First, get the profile ID
        const profileIdTx = new Transaction();
        profileIdTx.moveCall({
          target: `${PACKAGE_ID}::trust::get_profile_id`,
          arguments: [
            profileIdTx.object(REGISTRY_ID),
            profileIdTx.pure.address(currentAccount.address)
          ],
        });
        
        const profileIdResponse = await client.devInspectTransactionBlock({
          sender: currentAccount.address,
          transactionBlock: profileIdTx,
        });

        console.log("profileIdResponse", profileIdResponse);
        
        const profileIdValue = profileIdResponse.results?.[0]?.returnValues?.[0][0];
        const profileId = String(profileIdValue);

        console.log("profileId", profileId);
        
        if (!profileId) {
          throw new Error('Profile not found');
        }
        
        // Then, get profile data
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::trust::get_profile_data`,
          arguments: [
            tx.object(profileId),
          ],
        });

        console.log("tx", tx);
        
        const response = await client.devInspectTransactionBlock({
          sender: currentAccount.address,
          transactionBlock: tx,
        });

        console.log("GET PROFILE DATA RESPONSE", response);
        
        // Parse results from returnValues - format will be a tuple of values
        const results = response.results?.[0]?.returnValues;

        console.log("GET PROFILE DATA RESULTS", results);
        
        if (!results || !Array.isArray(results)) {
          throw new Error('Failed to get profile data');
        }
        
        // Safe parsing of returned values with proper type conversion
        return {
          name: String(results[0]?.[0] || ''),
          totalBonds: Number(results[1]?.[0] || 0),
          activeBonds: Number(results[2]?.[0] || 0),
          withdrawnBonds: Number(results[3]?.[0] || 0),
          brokenBonds: Number(results[4]?.[0] || 0),
          moneyInActiveBonds: Number(results[5]?.[0] || 0),
          moneyInWithdrawnBonds: Number(results[6]?.[0] || 0),
          moneyInBrokenBonds: Number(results[7]?.[0] || 0),
          trustScore: Number(results[8]?.[0] || 0),
          createdAt: Number(results[9]?.[0] || 0),
          updatedAt: Number(results[10]?.[0] || 0)
        };
      
    },
    enabled: options?.enabled,
  });
}

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
