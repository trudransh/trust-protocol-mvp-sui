'use client'
import { useRouter } from 'next/navigation'
import { ParticleBackground } from "@/components/home/particle-bg"
import { X } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useState } from 'react'
import { showTransactionToast } from '@/components/showTransactionToast'
import { CreateBondForm } from './dashboard/create-bond-form'
import { StakeBondForm } from './dashboard/stake-form'
import { NULL_ADDRESS } from '@/lib/constants'
import { BreakBondForm } from './dashboard/break-bond-form'
import { WithdrawForm } from './dashboard/withdraw-form'

export interface BondModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'create' | 'withdraw' | 'break' | 'stake',
  bondId?: string
}

export function BondModal({ isOpen, onClose, type, bondId }: BondModalProps) {
  const [isLoading, setIsLoading] = useState(false); // Loading state

  if (!isOpen) return null;

  function handleModal(type: 'create' | 'withdraw' | 'break' | 'stake') {
    switch (type) {
      case 'create':
        return <CreateBondForm onClose={onClose} />;
      case 'withdraw':
        return <WithdrawForm bondId={bondId ?? NULL_ADDRESS} onClose={onClose} />;
      case 'break':
        return <BreakBondForm bondId={bondId ?? NULL_ADDRESS} onClose={onClose} />;
      case 'stake':
        return <StakeBondForm bondId={bondId ?? NULL_ADDRESS} onClose={onClose} />;
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Just blur the background, no gradient */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="flex items-center justify-center min-h-screen">
        {handleModal(type)}
      </div>
    </div>
  );
}