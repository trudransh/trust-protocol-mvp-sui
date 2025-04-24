"use client"

import { useRef, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { ConnectButton } from "@/components/connect-button"
import { X } from "lucide-react"

export function AnimatedWalletConnect() {
  const [isVisible, setIsVisible] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        ref={buttonRef}
        className="relative z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-white rounded-xl shadow-lg"
        >
          {isVisible && (
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
          <ConnectButton />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}