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
  ValidChainType
} from "@/lib/constants";
import { useJoinBond } from "@/hooks/use-protocol";

export interface StakeBondFormProps {
  onClose: () => void;
  bondId: string;
}

export function StakeBondForm({ bondId, onClose }: StakeBondFormProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { mutateAsync: joinBond } = useJoinBond();


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleSubmit = async () => {
    if (!bondId) {
      toast.error("Bond ID is missing");
      return;
    }
    
    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const txDigest = await joinBond({ 
        bondId, 
        amount: inputAmount 
      });
      
      toast.success("Successfully staked in bond");
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to stake in bond");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>{isLoading && <BondLoadingModal />}</AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-xl shadow-lg backdrop-blur-md bg-white bg-opacity-20 border border-white border-opacity-30"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Add Stake to Bond
        </h2>
        
        <div className="space-y-6">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-blue-900 mb-1"
            >
              Amount
            </label>
            <div className="relative">
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={handleInputChange}
                className="w-full bg-white bg-opacity-50 border-blue-300 focus:border-blue-500 focus:ring-blue-500 pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Stake
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
