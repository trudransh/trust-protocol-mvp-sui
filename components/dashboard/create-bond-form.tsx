"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BondLoadingModal } from "@/components/bond-loading-modal";
import Image from "next/image";
import { toast } from "sonner";
import { showTransactionToast } from "../showTransactionToast";
// import { useAccount, useReadContract } from "wagmi";
// import { createPublicClient, erc20Abi, formatUnits, http, parseUnits } from "viem";
import {
  CONTRACT_ADDRESSES,
  NULL_ADDRESS,
  ValidChainType,
} from "@/lib/constants";
// import {

  // waitForTransactionReceipt,
  // writeContract,
// } from "wagmi/actions";
// import { config } from "@/lib/wagmi-config";
import { USER_FACTORY_ABI } from "@/abi/user-factory";
import { buildCreateBondTx } from "@/lib/calls";
// import { isAddress } from "viem";
// import { useUserWalletFromRegistry } from "@/hooks/use-protocol";
// import { getEnsAddress, getEnsName } from "viem/actions";
// import { mainnet } from "viem/chains";
// import { normalize } from 'viem/ens'
// import { useChainId } from 'wagmi';
import { X } from "lucide-react";


export function CreateBondForm({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();

  const [formData, setFormData] = useState<{
    user2: string;
    amount: string;
  }>({
    user2: "",
    amount: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const chainId = useChainId();

  const { data: approvedAmount } = useReadContract({
    abi: erc20Abi,
    address: CONTRACT_ADDRESSES[chainId as ValidChainType].DEFAULT_ASSET_ADDRESS_ERC20 as `0x${string}`,
    functionName: "allowance",
    args: [address ?? NULL_ADDRESS, CONTRACT_ADDRESSES[chainId as ValidChainType].USER_FACTORY_SETTINGS],
  });
  const {data:userWallet} = useUserWalletFromRegistry(address ?? NULL_ADDRESS)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (createUser: boolean) => {
    setIsLoading(true);
    try {
      let finalAddress = formData.user2;
      if (!address) {
        toast.error("No address found");
        throw new Error("No address found");
      }
      if(!userWallet){
        toast.error("No wallet found")
        throw new Error("No wallet found")
      }
      if (!isAddress(formData.user2)) {
        const client = createPublicClient({
          chain: mainnet,
          transport: http(),
  })
        const returnEns = await getEnsAddress(client, {
          name: normalize(formData.user2),
        })
        if (!returnEns) {
          toast.error("Invalid ENS name");
          setIsLoading(false);
          return;
        }
        finalAddress = returnEns;
      }
      // Parse the input amount from the form
      const inputAmountParsed = parseFloat(formData.amount);
      if (isNaN(inputAmountParsed)) {
        toast.error("Invalid amount, Please enter a valid number.");
        setIsLoading(false);
        return;
      }

      // Format the approved amount from the ERC20 allowance (using 6 decimals for USDC)
      const approvedAmountFormatted = Number(
        formatUnits(approvedAmount || BigInt(0), 6)
      );
      
      // If the approved amount is lower than or equal to the input, run the approve transaction.
      if (approvedAmountFormatted < inputAmountParsed) {
        const approvalHash = await writeContract(config, {
          abi: erc20Abi,
          address: CONTRACT_ADDRESSES[chainId as ValidChainType].DEFAULT_ASSET_ADDRESS_ERC20 as `0x${string}`,
          functionName: "approve",
          args: [
            userWallet,
            parseUnits(inputAmountParsed.toString(), 6),
          ],
        });
        await waitForTransactionReceipt(config, {
          hash: approvalHash,
        });

        console.log("Approval transaction would run here");
      }
      const hash = await createBond(
        address,
        finalAddress as `0x${string}`,
        parseUnits(formData.amount, 6)
      );
      await waitForTransactionReceipt(config, {
        hash: hash,
      });
      showTransactionToast(hash)
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
      console.error(error);
    }finally{
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-md p-8 rounded-xl bg-gradient-to-br from-[#cdffd8] to-blue-300"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-blue-900 hover:text-blue-700"
      >
        <X className="h-6 w-6" />
      </button>

      <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">
        Create Bond 
      </h2>
      
      <div className="space-y-6">
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-blue-900 mb-1"
          >
            Ethereum Address or ENS Name
          </label>
          <Input
            id="user2"
            name="user2"
            placeholder="0x... or example.eth"
            value={formData.user2}
            onChange={handleInputChange}
            className="w-full bg-white/50 border-white/30 focus:border-blue-500 focus:ring-blue-500 placeholder-blue-900/50 text-blue-900"
          />
        </div>
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-blue-900 mb-1"
          >
            Amount in USDC
          </label>
          <Input
            id="amount"
            name="amount"
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full bg-white/50 border-white/30 focus:border-blue-500 focus:ring-blue-500 placeholder-blue-900/50 text-blue-900"
          />
        </div>
        <Button
          onClick={() => handleSubmit(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Create User with Bond
        </Button>
      </div>
    </motion.div>
  );
}
