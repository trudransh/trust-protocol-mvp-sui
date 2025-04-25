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

import { useBreakBond } from "@/hooks/use-protocol";


export interface BreakBondFormProps {
  onClose: () => void;
  bondId: string;
}

export function BreakBondForm({ bondId, onClose }: BreakBondFormProps) {

  const [formData, setFormData] = useState<{
    user2: string;
    amount: string;
  }>({
    user2: bondId,
    amount: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // Use the break bond hook
  const { mutateAsync: breakBond } = useBreakBond();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!bondId) {
      toast.error("Bond ID is missing");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Pass bondId as object parameter
      const txDigest = await breakBond({ bondId });
      
      toast.success("Bond broken successfully");
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to break bond");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#cdffd8] to-blue-300">
      <AnimatePresence>{isLoading && <BondLoadingModal />}</AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 rounded-xl shadow-lg backdrop-blur-md bg-white bg-opacity-20 border border-white border-opacity-30"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-red-600">
          Break Bond
        </h2>
        
        <p className="mb-6 text-gray-600 text-center">
          Are you sure you want to break this bond? This action cannot be undone.
        </p>
        
        <div className="flex space-x-4">
          <motion.div className="flex-1" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Cancel
            </Button>
          </motion.div>
          
          <motion.div className="flex-1" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleSubmit}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >            
              Confirm
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
