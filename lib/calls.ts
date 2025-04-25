import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, REGISTRY_ID, SUINS_REGISTRY, BOND_OBJECT_ID } from '@/lib/constants';
import { groupBy } from "./utils";
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { MIST_PER_SUI } from '@mysten/sui/utils';

// Define network options
export type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

// Get a properly configured SuiClient
export function getSuiClient(network: Network = 'mainnet', customRpcUrl?: string): SuiClient {
    const url = customRpcUrl || getFullnodeUrl(network);
    return new SuiClient({ url });
}


// Bond status mapping
export const BOND_STATUS = {
  0: "active",
  1: "withdrawn",
  2: "broken"
} as const;

// Bond type mapping
export const BOND_TYPE = {
  0: "one-way",
  1: "two-way" 
} as const;

// Transaction response type
export type TransactionResponse = {
    digest: string;
    effects?: any;
    events?: any;
    objectChanges?: any;
    balanceChanges?: any;
};

// Modified UserBond type for Sui
export type UserBond = {
    bondId: string,
    user1: string,
    user2: string,
    yourStakeAmount: number,
    theirStakeAmount: number,
    totalAmount: number,
    createdAt: number,
    status: "active" | "broken" | "withdrawn",
    counterPartyAddress: string,
    type: "one-way" | "two-way",
};

// Modified User type for Sui
export type User = {
    profileId: string,
    name: string,
    trustScore: number,
    totalActiveBonds: number,
    totalAmount: number,
    totalBonds: number,
    totalBrokenBonds: number,
    totalWithdrawnBonds: number,
    totalWithdrawnAmount: number,
    totalBrokenAmount: number,
    bonds: string[]
    bondsDetails: UserBond[]
};

// Get user's trust profile
export async function getUserTrustProfile(client: any, userAddress: string): Promise<User | null> {
    console.log("Fetching trust profile for", userAddress);
    
    try {
        // Get user's profile by filtering for TrustProfile objects
        const { data } = await client.getOwnedObjects({
            owner: userAddress,
            filter: {
                StructType: `${PACKAGE_ID}::trust::TrustProfile`
            },
            options: { showContent: true }
        });
        
        if (!data.length) {
            console.log("No trust profile found for", userAddress);
            return null;
        }
        
        const profile = data[0];
        const content = profile.data?.content;
        if (content?.dataType !== 'moveObject') return null;
        
        const profileId = profile.data?.objectId || '';
        const fields = content.fields as any;
        
        // Get user's bonds
        const bonds = await getUserBonds(client, userAddress);
        
        // Return formatted user data
        return {
            profileId,
            name: fields.name,
            trustScore: Number(fields.trust_score),
            totalActiveBonds: Number(fields.active_bonds),
            totalBrokenBonds: Number(fields.broken_bonds),
            totalWithdrawnBonds: Number(fields.withdrawn_bonds),
            totalBonds: Number(fields.total_bonds),
            totalAmount: Number(fields.money_in_active_bonds) / 1_000_000_000, // Convert from MIST to SUI
            totalWithdrawnAmount: Number(fields.money_in_withdrawn_bonds) / 1_000_000_000,
            totalBrokenAmount: Number(fields.money_in_broken_bonds) / 1_000_000_000,
            bonds: bonds.map(bond => bond.bondId),
            bondsDetails: bonds
        };
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
}

// Get bonds related to a user
export async function getUserBonds(client: SuiClient, userAddress: string): Promise<UserBond[]> {
    console.log("Fetching bonds for", userAddress);
    
    try {
        // Query bonds where user is participant
        const { data } = await client.getOwnedObjects({
            owner: userAddress,
            filter: {
                StructType: `${PACKAGE_ID}::trust::TrustBond`
            },
            options: { showContent: true }
        });
        
        // Process each bond
        const bonds: UserBond[] = [];
        
        for (const item of data) {
            if (!item.data?.content || item.data.content.dataType !== 'moveObject') continue;
            
            const bondId = item.data.objectId;
            const fields = item.data.content.fields as any;
            
            const user1 = fields.user_1;
            const user2 = fields.user_2;
            const moneyByUser1 = Number(fields.money_by_user_1?.value || 0) / 1_000_000_000; // Convert MIST to SUI
            const moneyByUser2 = Number(fields.money_by_user_2?.value || 0) / 1_000_000_000;
            const totalAmount = moneyByUser1 + moneyByUser2;
            const bondType = Number(fields.bond_type);
            const bondStatus = Number(fields.bond_status);
            const createdAt = Number(fields.created_at);
            
            // Determine your stake amount vs their stake amount
            const isUser1 = userAddress === user1;
            const yourStakeAmount = isUser1 ? moneyByUser1 : moneyByUser2;
            const theirStakeAmount = isUser1 ? moneyByUser2 : moneyByUser1;
            const counterPartyAddress = isUser1 ? user2 : user1;
            
            bonds.push({
                bondId,
                user1,
                user2,
                yourStakeAmount,
                theirStakeAmount,
                totalAmount,
                createdAt,
                status: BOND_STATUS[bondStatus as keyof typeof BOND_STATUS],
                counterPartyAddress,
                type: BOND_TYPE[bondType as keyof typeof BOND_TYPE]
            });
        }
        
        return bonds;
    } catch (error) {
        console.error("Error fetching user bonds:", error);
        throw error;
    }
}

// Get bond info
async function getBondInfo( client: SuiClient, bondId: string): Promise<{
    user1: string;
    user2: string;
    bondType: number;
    bondStatus: number;
    moneyByUser1: number;
    moneyByUser2: number;
}> {
    try {
        const bond = await client.getObject({
            id: bondId,
            options: { showContent: true, showDisplay: true },
        });
        
        if (bond.data?.content?.dataType !== 'moveObject') {
            throw new Error("Invalid bond object");
        }
        
        console.log("Raw bond data:", JSON.stringify(bond.data.content, null, 2));
        
        // Type assertion for TrustBond fields
        const fields = bond.data.content.fields as any;
        
        // Extract balance values - handle potential nesting correctly
        let moneyByUser1 = 0;
        let moneyByUser2 = 0;
        
        // In Sui Move, Balance<SUI> objects are often structured differently
        // Check all possible formats
        if (fields.money_by_user_1) {
            if (typeof fields.money_by_user_1 === 'object') {
                if ('value' in fields.money_by_user_1) {
                    moneyByUser1 = Number(fields.money_by_user_1.value);
                } else if ('fields' in fields.money_by_user_1 && 'value' in fields.money_by_user_1.fields) {
                    moneyByUser1 = Number(fields.money_by_user_1.fields.value);
                }
            } else if (typeof fields.money_by_user_1 === 'string' || typeof fields.money_by_user_1 === 'number') {
                moneyByUser1 = Number(fields.money_by_user_1);
            }
        }
        
        if (fields.money_by_user_2) {
            if (typeof fields.money_by_user_2 === 'object') {
                if ('value' in fields.money_by_user_2) {
                    moneyByUser2 = Number(fields.money_by_user_2.value);
                } else if ('fields' in fields.money_by_user_2 && 'value' in fields.money_by_user_2.fields) {
                    moneyByUser2 = Number(fields.money_by_user_2.fields.value);
                }
            } else if (typeof fields.money_by_user_2 === 'string' || typeof fields.money_by_user_2 === 'number') {
                moneyByUser2 = Number(fields.money_by_user_2);
            }
        }
        
        // Format values
        const bondInfo = {
            user1: fields.user_1,
            user2: fields.user_2,
            bondType: Number(fields.bond_type),
            bondStatus: Number(fields.bond_status),
            moneyByUser1: formatBalance(moneyByUser1),
            moneyByUser2: formatBalance(moneyByUser2),
        };
        
        console.log(`Bond info: 
  User1: ${bondInfo.user1} (${bondInfo.moneyByUser1} SUI)
  User2: ${bondInfo.user2} (${bondInfo.moneyByUser2} SUI)
  Type: ${bondInfo.bondType} (${bondInfo.bondType === 0 ? 'one-way' : 'two-way'})
  Status: ${bondInfo.bondStatus} (${bondInfo.bondStatus === 0 ? 'active' : bondInfo.bondStatus === 1 ? 'withdrawn' : 'broken'})
  Total Value: ${bondInfo.moneyByUser1 + bondInfo.moneyByUser2} SUI`);
        
        return bondInfo;
    } catch (error) {
        throw error;
    }
}

const formatBalance = (balance: string | number): number => {
    return Number(balance) / Number(MIST_PER_SUI);
  };
// TRANSACTION BUILDING FUNCTIONS

// Create a trust profile transaction
export function buildCreateProfileTx(name: string): Transaction {
    const tx = new Transaction();
    const clock = tx.object('0x6');
    
    tx.moveCall({
        target: `${PACKAGE_ID}::trust::create_trust_profile`,
        arguments: [
            tx.object(REGISTRY_ID),
            tx.pure.string(name),
            tx.pure.bool(false),
            tx.object(SUINS_REGISTRY),  // Always include SuiNS object
            tx.object('0x6')
        ],
    });
    
    return tx;
}

// Create a bond transaction
export function buildCreateBondTx(
    profileId: string, 
    counterpartyAddress: string, 
    amount: number
): Transaction {
    const tx = new Transaction();
    const clock = tx.object('0x6');
    
    // Convert SUI to MIST
    const amountMist = BigInt(Math.floor(amount * 1_000_000_000));
    
    // Split coins for payment
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);
    
    tx.moveCall({
        target: `${PACKAGE_ID}::trust::create_bond`,
        arguments: [
            tx.object(BOND_OBJECT_ID),
            tx.object(profileId),
            tx.pure.address(counterpartyAddress),
            coin,
            clock,
        ],
    });
    
    return tx;
}

// Join a bond transaction
export function buildJoinBondTx(
    bondId: string,
    profileId: string,
    amount: number
): Transaction {
    const tx = new Transaction();
    const clock = tx.object('0x6');
    
    // Convert SUI to MIST
    const amountMist = BigInt(Math.floor(amount * 1_000_000_000));
    
    // Split coins for payment
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);
    
    tx.moveCall({
        target: `${PACKAGE_ID}::trust::join_bond`,
        arguments: [
            tx.object(bondId),
            tx.object(profileId),
            coin,
            clock,
        ],
    });
    
    return tx;
}

// Withdraw bond transaction
export function buildWithdrawBondTx(
    bondId: string,
    profileId: string
): Transaction {
    const tx = new Transaction();
    const clock = tx.object('0x6');
    
    tx.moveCall({
        target: `${PACKAGE_ID}::trust::withdraw_bond`,
        arguments: [
            tx.object(bondId),
            tx.object(profileId),
            clock,
        ],
    });
    
    return tx;
}


// Break bond transaction
export function buildBreakBondTx(
    bondId: string,
    profileId: string
): Transaction {
    const tx = new Transaction();
    const clock = tx.object('0x6');
    
    tx.moveCall({
        target: `${PACKAGE_ID}::trust::break_bond`,
        arguments: [
            tx.object(bondId),
            tx.object(profileId),
            clock,
        ],
    });
    
    return tx;
}

// Function to check if a user has a trust profile
export function buildHasTrustProfileTx(userAddress: string): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::trust::has_trust_profile`,
    arguments: [
      tx.object(REGISTRY_ID),
      tx.pure.address(userAddress)
    ],
  });
  
  return tx;
}

// Get bond information by bond ID
export function buildGetBondInfoTx(bondId: string): Transaction {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::trust::get_bond_info`,
    arguments: [
      tx.object(bondId)
    ],
  });
  
  return tx;
}

// Process bond info result from transaction
export function processBondInfoResult(result: any[]): {
  user1: string;
  user2: string;
  bondType: number;
  bondStatus: number; 
  user1Amount: number;
  user2Amount: number;
} {
  if (!result || !result.length) {
    throw new Error("Invalid bond info result");
  }
  
  return {
    user1: result[0][0],
    user2: result[0][1],
    bondType: Number(result[0][2]),
    bondStatus: Number(result[0][3]),
    user1Amount: Number(result[0][4]) / 1_000_000_000, // Convert from MIST to SUI
    user2Amount: Number(result[0][5]) / 1_000_000_000, // Convert from MIST to SUI
  };
}

// Fixed getUserBondIds function 


// Get individual bond by ID
// export async function getBondById(client: SuiClient, bondId: string): Promise<UserBond | null> {
//   try {
//     return await getBondInfo(client, bondId);
//   } catch (error) {
//     console.error(`Error fetching bond by ID ${bondId}:`, error);
//     throw error;
//   }
// }

// HELPER FUNCTIONS

// Helper to extract created object IDs from transaction effects
export function extractCreatedObjects(effects: any): string[] {
    if (!effects || !effects.created) return [];
    
    return effects.created.map((obj: any) => obj.reference.objectId);
}

// Helper to wait for object to be indexed and available
export async function waitForObject(client: SuiClient, objectId: string, maxAttempts = 10, delayMs = 1000): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const result = await client.getObject({
                id: objectId,
                options: { showContent: true }
            });
            
            if (result.data) {
                return result.data;
            }
        } catch (error) {
            console.log(`Waiting for object ${objectId} to be indexed (attempt ${i+1}/${maxAttempts})...`);
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    throw new Error(`Object ${objectId} not available after ${maxAttempts} attempts`);
}

// Add a utility function to adjust a perspective of a bond for a specific user
export function adjustBondPerspective(bond: UserBond, userAddress: string): UserBond {
    if (bond.user1 !== userAddress && bond.user2 !== userAddress) {
        return bond; // Not involved in this bond, return as is
    }
    
    const isUser1 = userAddress === bond.user1;
    
    return {
        ...bond,
        yourStakeAmount: isUser1 ? bond.yourStakeAmount : bond.theirStakeAmount,
        theirStakeAmount: isUser1 ? bond.theirStakeAmount : bond.yourStakeAmount,
        counterPartyAddress: isUser1 ? bond.user2 : bond.user1
    };
}

// Add a utility to create a default SuiClient instance
export const suiClient = getSuiClient('testnet');

// Get bond IDs directly from the contract using get_user_bond_ids
async function getUserBondIds( client : SuiClient, userBondsId: string, userAddress: string): Promise<string[]> {
    console.log(`Getting bond IDs for user ${userAddress}...`);
    try {
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::trust::get_user_bond_ids`,
            arguments: [
                tx.object(userBondsId),
                tx.pure.address(userAddress),
            ],
        });
        
        const result = await client.devInspectTransactionBlock({
            sender: userAddress,
            transactionBlock: tx,
        });

        console.log("Raw result:", JSON.stringify(result.results?.[0]?.returnValues));
        
        if (!result.results || !result.results[0]?.returnValues) {
            throw new Error("No result from get_user_bond_ids call");
        }
        
        const returnValue = result.results[0].returnValues[0];
        
        if (!Array.isArray(returnValue) || !Array.isArray(returnValue[0])) {
            throw new Error("Unexpected return format from get_user_bond_ids");
        }
        
        // Extract the inner array which contains the bond IDs
        const bondIdBytes = returnValue[0];
        
        // If this is an empty vector, return an empty array
        if (bondIdBytes.length === 0) {
            return [];
        }
        
        // If the first element is an array, this is a vector of IDs
        if (Array.isArray(bondIdBytes[0])) {
            // Multiple bond IDs
            const bondIds = bondIdBytes.map((idBytes: any) => {
                // Convert ID using the correct format for Sui Object ID
                return formatSuiObjectId(Array.isArray(idBytes) ? idBytes : [idBytes]);
            });
            return bondIds;
        } else {
            // Single bond ID
            return [formatSuiObjectId(bondIdBytes)];
        }
    } catch (error) {
        console.error(`Error getting bond IDs for ${userAddress}:`, error);
        throw error;
    }
}

function formatSuiObjectId(bytes: number[]): string {
    // Check if the first byte might be a length indicator and remove it if needed
    const idBytes = bytes.length === 33 ? bytes.slice(1) : bytes;
    
    // Format as hex string with proper padding
    let hexString = "";
    for (const byte of idBytes) {
        hexString += byte.toString(16).padStart(2, '0');
    }
    
    return `0x${hexString}`;
}

// Helper to find a created object of a specific type in transaction results
export function findCreatedObjectId(
  objectChanges: any[] | undefined, 
  objectType: string
): string | undefined {
  if (!objectChanges) return undefined;
  
  for (const change of objectChanges) {
    if (
      change.type === 'created' && 
      change.objectType.includes(objectType)
    ) {
      return change.objectId;
    }
  }
  
  return undefined;
}

// Get all bonds with details using the contract's get_user_bond_ids
export async function getAllUserBondsWithDetails(
  client: SuiClient, 
  userBondsId: string, 
  userAddress: string
): Promise<UserBond[]> {
  // First get all bond IDs
  const bondIds = await getUserBondIds(client, userBondsId, userAddress);
  const validBonds = [];
  
  // Then get details for each bond
  for (const bondId of bondIds) {
    try {
      const bondInfo = await getBondInfo(client, bondId);
      // Create a UserBond object from bondInfo
      const isUser1 = userAddress === bondInfo.user1;
      validBonds.push({
        bondId,
        user1: bondInfo.user1,
        user2: bondInfo.user2,
        yourStakeAmount: isUser1 ? bondInfo.moneyByUser1 : bondInfo.moneyByUser2,
        theirStakeAmount: isUser1 ? bondInfo.moneyByUser2 : bondInfo.moneyByUser1,
        totalAmount: bondInfo.moneyByUser1 + bondInfo.moneyByUser2,
        createdAt: 0, // Set default or fetch from bond object if available
        status: BOND_STATUS[bondInfo.bondStatus as keyof typeof BOND_STATUS],
        counterPartyAddress: isUser1 ? bondInfo.user2 : bondInfo.user1,
        type: BOND_TYPE[bondInfo.bondType as keyof typeof BOND_TYPE]
      });
    } catch (error:any) {
      console.warn(`Skipping invalid bond ID ${bondId}: ${error.message}`);
    }
  }
  
  return validBonds;
}
