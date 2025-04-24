"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BondLoadingModal } from "@/components/bond-loading-modal";
import { useWithdrawBond } from "@/hooks/use-protocol";

export interface WithdrawFormProps {
  onClose: () => void;
  bondId: string;
}

export function WithdrawForm({ bondId, onClose }: WithdrawFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the withdraw bond hook
  const { mutateAsync: withdrawBond } = useWithdrawBond();

  const handleSubmit = async () => {
    if (!bondId) {
      toast.error("Bond ID is missing");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Pass bondId as object parameter
      const txDigest = await withdrawBond({ bondId });
      
      toast.success("Successfully withdrawn from bond");
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to withdraw from bond");
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
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 rounded-xl shadow-lg backdrop-blur-md bg-white bg-opacity-20 border border-white border-opacity-30"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Withdraw from Bond
        </h2>
        
        <p className="mb-6 text-gray-600 text-center">
          Are you sure you want to withdraw your stake from this bond?
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >            
              Withdraw
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
