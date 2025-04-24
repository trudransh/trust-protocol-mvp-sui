"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BondLoadingModal } from "@/components/bond-loading-modal";
import Image from "next/image";
import { toast } from "sonner";
import { showTransactionToast } from "../showTransactionToast";
import {
  CONTRACT_ADDRESSES,
  NULL_ADDRESS,
} from "@/lib/constants";
import { USER_FACTORY_ABI } from "@/abi/user-factory";
import { createBond } from "@/lib/calls";
import { USER_ABI } from "@/abi/user";
import { useUserWalletFromRegistry } from "@/hooks/use-protocol";

export interface BreakBondFormProps {
  onClose : () => void 
  bondAddress: string
}


export function BreakBondForm({bondAddress, onClose}:BreakBondFormProps ){
  const { address } = useAccount();

  const [formData, setFormData] = useState<{
    user2: string;
    amount: string;
  }>({
    user2: bondAddress,
    amount: "",
  });

  const {data:userWallet} = useUserWalletFromRegistry(address ?? NULL_ADDRESS)


 

  const [isLoading, setIsLoading] = useState(false);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (createUser: boolean) => {
    setIsLoading(true);
    try {
      let finalAddress =  bondAddress;
      if (!address) {
        toast.error("No address found");
        throw new Error("No address found");
      }
      if(!userWallet){
        toast.error("No wallet found")
        throw new Error("No wallet found")
      }
      
     
     
      const hash = await writeContract(
        config,{
            abi:USER_ABI,
            address:userWallet,
            functionName:'breakBond',
            args:[finalAddress as `0x${string}`]
        }
      ) 
      await waitForTransactionReceipt(config, {
        hash: hash,
      });
      showTransactionToast(hash)
      onClose()
    } catch (error) {
      toast.error((error as Error).message);
      console.error(error);
    }
    finally{
      setIsLoading(false);
    }
  
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#cdffd8] to-blue-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-xl shadow-lg backdrop-blur-md bg-white bg-opacity-20 border border-white border-opacity-30"
        style={{ backgroundColor: "rgba(148, 185, 255, 0.2)" }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">
          Are you sure to want break bond !
        </h2>
        <div className="space-y-6">
          <div className="flex space-x-4">
            <Button
              onClick={() => handleSubmit(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >            
              Confirm
            </Button>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>{isLoading && <BondLoadingModal />}</AnimatePresence>
    </div>
  );
}
