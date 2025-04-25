"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BondLoadingModal } from "@/components/bond-loading-modal";
import { toast } from "sonner";
import { showTransactionToast } from "../showTransactionToast";
import {
  CONTRACT_ADDRESSES,
  NULL_ADDRESS,
  ValidChainType,
} from "@/lib/constants";
import { useCreateBond } from "@/hooks/use-protocol";
import truncateEthAddress from "@/lib/truncateAddress";
import { X } from "lucide-react";


export const CreateBondForm = ({ onClose }: { onClose: () => void }) => {
  const [counterpartyAddress, setCounterpartyAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the create bond hook
  const { mutateAsync: createBond } = useCreateBond();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!counterpartyAddress) {
      toast.error("Please enter a counterparty address");
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Pass parameters as an object to match the hook's expected format
      const txDigest = await createBond({ 
        counterpartyAddress, 
        amount: parseFloat(amount) 
      });
      console.log("txDigest bild and ready to console", txDigest);
      
      toast.success(`Bond created with ${truncateEthAddress(counterpartyAddress)}`);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create bond");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {isLoading && <BondLoadingModal />}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Create New Bond
        </h2>
        <p className="mb-6 text-gray-600 text-center">
          Create a trust bond with another address
        </p>
        
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            <motion.div
              key="form-fields"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">
                  Counterparty Address
                </label>
                <Input 
                  type="text"
                  placeholder="Enter Sui address"
                  value={counterpartyAddress}
                  onChange={(e) => setCounterpartyAddress(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bond Amount
                </label>
                <div className="relative">
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8"
                    min="0"
                    step="0.01"
                  />
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    $
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <motion.div
            className="mt-6"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              Create Bond
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </>
  );
};
