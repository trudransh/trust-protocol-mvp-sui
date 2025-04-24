import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentAccount, useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit';
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
  getSuiClient
} from '@/lib/calls';

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

/**
 * Hook to fetch user's bonds
 */
export const useUserBonds = (address?: string) => {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  
  // Use provided address or current connected wallet
  const userAddress = address || currentAccount?.address;
  
  return useQuery<UserBond[]>({
    queryKey: ['userBonds', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      return getUserBonds(getSuiClient(), userAddress);
    },
    enabled: Boolean(userAddress),
  });
};

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
 * Hook to check if a user already has a profile
 */
export const useHasProfile = (address?: string) => {
  const { data: userData, isLoading } = useUserData(address);
  
  return {
    hasProfile: Boolean(userData?.profileId),
    profileId: userData?.profileId,
    isLoading
  };
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