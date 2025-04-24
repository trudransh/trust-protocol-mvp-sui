"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useReadContract } from "wagmi";
import { createPublicClient, erc20Abi, formatUnits, http, parseUnits } from "viem";
import { CONTRACT_ADDRESSES, NULL_ADDRESS, CHAIN_ID, ValidChainType } from "@/lib/constants";
import { getChainId, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { config } from "@/lib/wagmi-config";
import { USER_FACTORY_ABI } from "@/abi/user-factory";
import { createBond } from "@/lib/calls";
import { isAddress } from "viem";
import { mainnet } from "viem/chains";
import { getEnsAddress, normalize } from "viem/ens";
import { showTransactionToast } from "../showTransactionToast";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BondLoadingModal } from "@/components/bond-loading-modal";
import { ArrowRight, EclipseIcon as Ethereum, DollarSign, Loader2 } from "lucide-react";
import { useChainId } from "wagmi";


export function OnBoardForm({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address } = useAccount();
  const [formData, setFormData] = useState({ user2: "", amount: "" });
  const [isLoading, setIsLoading] = useState(false);
  const chainId = useChainId();

  const { data: approvedAmount } = useReadContract({
    abi: erc20Abi,
    address: CONTRACT_ADDRESSES[chainId as ValidChainType].DEFAULT_ASSET_ADDRESS_ERC20 as `0x${string}`,
    functionName: "allowance",
    args: [address ?? NULL_ADDRESS, CONTRACT_ADDRESSES[CHAIN_ID].USER_FACTORY],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (createUser: boolean) => {
    setIsLoading(true);
    try {
      if (!address) {
        toast.error("No address found");
        throw new Error("No address found");
      }
      const chainId = getChainId(config)
      console.log("chainIasdfasdfdd",chainId)
      console.log("USR FACTORY", CONTRACT_ADDRESSES[chainId as ValidChainType]?.USER_FACTORY)
      if (!createUser) {
       
        const hash = await writeContract(config, {
          abi: USER_FACTORY_ABI,
          address: CONTRACT_ADDRESSES[chainId as ValidChainType].USER_FACTORY,
          functionName: "createUser",
          args: [address],
        });
        await waitForTransactionReceipt(config, { hash });
        showTransactionToast(hash);
        return; // We’ll handle closing in the finally block
      }

      let finalAddress = formData.user2;
      if (!isAddress(formData.user2)) {
        const client = createPublicClient({
          chain: mainnet,
          transport: http(),
        });
        const returnEns = await getEnsAddress(client, {
          name: normalize(formData.user2),
        });
        if (!returnEns) {
          toast.error("Invalid ENS name");
          return;
        }
        finalAddress = returnEns;
      }

      const inputAmountParsed = parseFloat(formData.amount);
      if (isNaN(inputAmountParsed)) {
        toast.error("Invalid amount, Please enter a valid number.");
        return;
      }

      const approvedAmountFormatted = Number(
        formatUnits(approvedAmount || BigInt(0), 6)
      );

      if (approvedAmountFormatted < inputAmountParsed) {

        const approvalHash = await writeContract(config, {
          abi: erc20Abi,
          address: CONTRACT_ADDRESSES[chainId as ValidChainType].DEFAULT_ASSET_ADDRESS_ERC20 as `0x${string}`,
          functionName: "approve",
          args: [
            CONTRACT_ADDRESSES[chainId as ValidChainType].USER_FACTORY,
            parseUnits(inputAmountParsed.toString(), 6),
          ],
        });
        await waitForTransactionReceipt(config, { hash: approvalHash });
      }

      const hash = await createBond(
        address,
        finalAddress as `0x${string}`,
        parseUnits(formData.amount, 6)
      );
      await waitForTransactionReceipt(config, { hash });
      showTransactionToast(hash);
    } catch (error) {
      toast.error((error as Error).message);
      console.error(error);
    } finally {
      setIsLoading(false); // ✅ Stop the loading modal
      onClose();           // ✅ Close the OnBoard modal regardless of success or error
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg p-8 rounded-2xl backdrop-blur-xl bg-white/90 border border-white/20 shadow-2xl mx-4"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            exit={{ y: -20 }}
          >
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold bg-clip-text text-primary">
                  Join Trust Protocol
                </h2>
                <p className="text-muted-foreground">
                  Secure your reputation with on-chain bonds
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Counterparty Address
                      <span className="text-muted-foreground ml-1">(ENS supported)</span>
                    </label>
                    <div className="relative">
                      <Input
                        name="user2"
                        placeholder="vitalik.eth or 0x..."
                        value={formData.user2}
                        onChange={handleInputChange}
                        className="pl-10 pr-4 py-5 text-base bg-background/95 hover:bg-background transition-colors"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <Ethereum className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Bond Amount
                      <span className="text-muted-foreground ml-1">(USDC)</span>
                    </label>
                    <div className="relative">
                      <Input
                        name="amount"
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className="pl-10 pr-4 py-5 text-base bg-background/95 hover:bg-background transition-colors"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleSubmit(true)}
                      className="w-full h-14 text-lg font-semibold bg-primary hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Create Bond
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="px-2 bg-background text-muted-foreground">
                        Or continue without
                      </span>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleSubmit(false)}
                      variant="outline"
                      className="w-full h-14 text-lg font-medium text-foreground hover:bg-muted/50"
                      disabled={isLoading}
                    >
                      Skip Bond Creation
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BondLoadingModal />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
