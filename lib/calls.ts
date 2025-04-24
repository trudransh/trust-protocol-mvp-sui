import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, REGISTRY_ID, SUINS_REGISTRY } from '@/lib/constants';
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
export async function getBondInfo(client: SuiClient, bondId: string): Promise<UserBond | null> {
    console.log(`Getting info for bond ${bondId}`);
    
    try {
        const bond = await client.getObject({
            id: bondId,
            options: { showContent: true },
        });
        
        if (bond.data?.content?.dataType !== 'moveObject') {
            return null;
        }
        
        const fields = bond.data.content.fields as any;
        
        const user1 = fields.user_1;
        const user2 = fields.user_2;
        const moneyByUser1 = Number(fields.money_by_user_1?.value || 0) / 1_000_000_000;
        const moneyByUser2 = Number(fields.money_by_user_2?.value || 0) / 1_000_000_000;
        const totalAmount = moneyByUser1 + moneyByUser2;
        const bondType = Number(fields.bond_type);
        const bondStatus = Number(fields.bond_status);
        const createdAt = Number(fields.created_at);
        
        return {
            bondId,
            user1,
            user2,
            yourStakeAmount: moneyByUser1, // Default perspective
            theirStakeAmount: moneyByUser2,
            totalAmount,
            createdAt,
            status: BOND_STATUS[bondStatus as keyof typeof BOND_STATUS],
            counterPartyAddress: user2, // Default perspective
            type: BOND_TYPE[bondType as keyof typeof BOND_TYPE]
        };
    } catch (error) {
        console.error(`Error getting bond info for ${bondId}:`, error);
        throw error;
    }
}

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