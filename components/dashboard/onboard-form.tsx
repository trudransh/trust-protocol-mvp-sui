"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BondLoadingModal } from "@/components/bond-loading-modal";
import { useCreateProfile } from '@/hooks/use-protocol';

export const OnboardForm = ({ onClose }: { onClose: () => void }) => {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the hook for profile creation
  const { mutateAsync: createProfile } = useCreateProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName) {
      toast.error("Please enter a display name");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Pass displayName directly to createProfile
      const txDigest = await createProfile(displayName);
      console.log("Profile created successfully, txDigest:", txDigest);
      toast.success("Profile created successfully!");
      onClose(); // This will trigger the refetch in the parent component
    } catch (error: any) {
      console.error("Error creating profile:", error);
      toast.error(error.message || "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />
      
      {/* Loading modal shown while creating profile */}
      {isLoading && <BondLoadingModal />}
      
      {/* Modal content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 relative z-10"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Join Trust Protocol
        </h2>
        <p className="mb-6 text-gray-600 text-center">
          Create your profile on the Trust Protocol
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Display Name
            </label>
            <Input 
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            Create Profile
          </Button>
        </form>
      </motion.div>
    </div>
  );
};