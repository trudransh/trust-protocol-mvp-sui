import { getChainId, readContract, readContracts, writeContract } from "wagmi/actions";
import { config } from "./wagmi-config";
import { REGISTRY_ABI } from "@/abi/registry";
import {  CONTRACT_ADDRESSES, NULL_ADDRESS, ValidChainType } from "./constants";
import { USER_FACTORY_ABI } from "@/abi/user-factory";
import { USER_ABI } from "@/abi/user";
import { BOND_ABI } from "@/abi/bond";
import { groupBy } from "./utils";
import { useChainId } from "wagmi";
export type UserBond = {
    user1:`0x${string}`,
    user2:`0x${string}`,
    yourStakeAmount:bigint,
    theirStakeAmount:bigint,
    totalAmount:bigint,
    createdAt:bigint,
    status:"active" | "broken" | "withdrawn",
    counterPartyAddress:`0x${string}`
    type:"one-way" | "two-way",
    bondAddress:`0x${string}`
}
export type User = {
    totalActiveBonds:number,
    totalAmount:number,
    totalBonds:number,
    totalBrokenBonds:number,
    totalWithdrawnBonds:number,
    totalWithdrawnAmount:number,
    totalBrokenAmount:number,
    bonds:`0x${string}`[]
    bondsDetails:UserBond[]
}
// export async function 
export async function getUserWalletFromRegistry(user:`0x${string}`) : Promise<`0x${string}`> {
    const chainId = getChainId(config)
    console.log("chainId",chainId)
    const address = await readContract(config,{
        abi:REGISTRY_ABI,
        functionName:"addressToUserContracts",
        args:[user],
        address:CONTRACT_ADDRESSES[chainId as ValidChainType].REGISTRY
    })
    return address
}
export async function getOppositeBondUserAddress(bondAddress:`0x${string}`,user:`0x${string}`) : Promise<`0x${string}`> {
    const userWallet = await getUserWalletFromRegistry(user)
    const [_,user1,user2] =await readContract(config,{
        abi:BOND_ABI,
        functionName:"bond",
        address:bondAddress
    })
    if(user1 === userWallet){
        return user2
    }
    else if (
        user2 === userWallet
    ){
        return user1
    }
    
    return NULL_ADDRESS
    
}
export async function getApprovalAddressForCreateBonds(user1:`0x${string}`,user2:`0x${string}`) : Promise<`0x${string}`> {
    const chainId = getChainId(config)
    const user1Wallet = await getUserWalletFromRegistry(user1)
    const user2Wallet = await getUserWalletFromRegistry(user2)
    if(user1Wallet === NULL_ADDRESS){
        return CONTRACT_ADDRESSES[chainId as ValidChainType].USER_FACTORY; 
    }
    return user1Wallet
    
}

export async function getUserDetails(user:`0x${string}`) {
    const userWallet = await getUserWalletFromRegistry(user)
    const [userInfoResponse, bondsResponse] = await readContracts(config,{
        contracts:[
            {
                abi:USER_ABI,
                address:userWallet,
                functionName:"user"
            },
            {
                abi:USER_ABI,
                address:userWallet,
                functionName:"getAllBonds"
            }
        ]
    })

    if (userInfoResponse.status !== "success") {
        throw new Error(`Failed to fetch user info: ${userInfoResponse.error?.message}`);
    }

    if (bondsResponse.status !== "success") {
        throw new Error(`Failed to fetch bonds: ${bondsResponse.error?.message}`);
    }
    let bonds  = [...new Set(bondsResponse.result)]

    console.log("userInfoResponse",userInfoResponse)

    const userInfo = userInfoResponse.result as readonly [
        `0x${string}`,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint
    ];
    console.log("bonds",bonds)

    const bondDetailsCalls = [];

    for (const bond of bonds) {
        bondDetailsCalls.push({
            abi:BOND_ABI,
            address:bond,
            functionName:"bond"
        },{
            abi:BOND_ABI,
            address:bond,
            functionName:"individualAmount",
            args:[userWallet]
        })
    }
    
    const bondsDetailsResponse  = await readContracts(config,{
        contracts:bondDetailsCalls,
        allowFailure:false,
    })
    


    console.log("bondsDetailsResponse",bondsDetailsResponse)

    const finalBonds = groupBy(bondsDetailsResponse,2).map((bondDetail,index) => {
            
            const bond = bondDetail[0] as readonly [
                `0x${string}`,
                `0x${string}`,
                `0x${string}`,
                bigint,
                bigint,
                boolean,
                boolean,
                boolean,
                boolean
            ]
            
            const counterPartyAddress = bond[1] === userWallet ? bond[2] : bond[1]
            return {
                user1:bond[1],
                user2:bond[2],
                totalAmount:bond[3],
                createdAt:bond[4],
                yourStakeAmount:bondDetail[1] as bigint,
                theirStakeAmount:bond[3] - (bondDetail[1] as bigint),
                status:bond[5] ? "broken" : bond[6] ? "withdrawn" : bond[7] ? "active" : "freezed",
                counterPartyAddress,
                type:bondDetail[1] === BigInt(0) || (bond[3] - (bondDetail[1] as bigint)) === BigInt(0) ? "one-way" : "two-way",
                bondAddress:bonds[index]
            } as UserBond
       
      });
    const userData: User = {
        totalBonds: Number(userInfo[1]),
        totalAmount: Number(userInfo[2]),
        totalWithdrawnBonds: finalBonds.reduce((acc,bond) => bond.status === "withdrawn" ? acc + 1 : acc,0),
        totalBrokenBonds: finalBonds.reduce((acc,bond) => bond.status === "broken" ? acc + 1 : acc,0),
        totalActiveBonds: finalBonds.reduce((acc,bond) => bond.status === "active" ? acc + 1 : acc,0),
        totalWithdrawnAmount: Number(userInfo[6]),
        totalBrokenAmount: Number(userInfo[7]),
        bonds: Array.from(bonds ?? []),
        bondsDetails: finalBonds
    };

    console.log("userData",userData)


    return userData;
}
export async function createBond(user1:`0x${string}`,user2:`0x${string}`,initialAmount:bigint) : Promise<`0x${string}`> {
   const chainId = getChainId(config)
   const user1Wallet = await getUserWalletFromRegistry(user1)
   const user2Wallet = await getUserWalletFromRegistry(user2)
   let hash:`0x${string}` | undefined;
   if(user1Wallet === NULL_ADDRESS){
    hash =await writeContract(config,{
        abi:USER_FACTORY_ABI,
        address:CONTRACT_ADDRESSES[chainId as ValidChainType].USER_FACTORY,
        functionName:'createUserWithBond',
        args:[user1,user2,initialAmount,CONTRACT_ADDRESSES[chainId as ValidChainType].BOND_FACTORY_TOKEN,CONTRACT_ADDRESSES[chainId as ValidChainType].YIELD_PROVIDER_SERVICE]
    })
   }
   if(user1Wallet !== NULL_ADDRESS){

    hash =await writeContract(config,{
        abi:USER_ABI,
        address:user1Wallet,
        functionName:'createBond',
        args:[user2,CONTRACT_ADDRESSES[chainId as ValidChainType].DEFAULT_ASSET_ADDRESS_ERC20,CONTRACT_ADDRESSES[chainId as ValidChainType].YIELD_PROVIDER_SERVICE,initialAmount,CONTRACT_ADDRESSES[chainId as ValidChainType].BOND_FACTORY_TOKEN]
    })
   }



   if(!hash){
         throw new Error("User type is not resolved")
   }
   return hash
}