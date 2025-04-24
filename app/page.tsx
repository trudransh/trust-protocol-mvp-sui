'use client'
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Features from "@/components/home/features";
import HowItWorks from "@/components/home/how-it-works";
import UseCases from "@/components/home/use-cases";
import Footer from "@/components/layout/footer";
import { ArrowRight, Rocket, Info } from "lucide-react";
import { useState } from "react";
import Header from "@/components/layout/header";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TestComponent from '@/components/test';

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-r from-[#cdffd8] to-[#94b9ff] z-10 relative overflow-hidden">
        <motion.div
          style={{ opacity }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="animate-bounce flex flex-col items-center">
            <span className="text-sm text-muted-foreground">Scroll to explore</span>
            <div className="w-6 h-6 border-2 border-primary rounded-full animate-spin" />
          </div>
          <TestComponent />
        </motion.div>

        <Header />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center py-16 md:py-24 space-y-8">
            {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full flex items-center justify-center"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Image
                  src="/trust-hero.png"
                  width={400}
                  height={400}
                  alt="Trust Protocol"
                  className="w-[60%] md:w-[50%] mx-auto drop-shadow-2xl"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl lg:text-5xl text-primary font-bold tracking-wider mb-2">
                Programmable Onchain Trust Primitive
                <Tooltip>
                  <TooltipTrigger className="ml-2 inline-block">
                    <Info className="w-5 h-5 text-primary/80 hover:text-primary cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-background/90 backdrop-blur-sm">
                    <p className="text-sm">Trust primitive enabling decentralized reputation management</p>
                  </TooltipContent>
                </Tooltip>
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">
                Trust protocol is an open-source layer zero for decentralized trust infrastructure
              </p>
            </motion.div>


            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
            >
              <Button 
                asChild
                className="group transform transition-all"
              >
                <Link 
                  href="/dashboard" 
                  className="text-white flex items-center gap-2 px-8 py-6 text-lg"
                >
                  <Rocket className={cn(
                    "w-5 h-5 transition-transform",
                    isHovered ? "rotate-45" : ""
                  )} />
                  <span>Launch App</span>
                  
                  <ArrowRight className={cn(
                    "w-5 h-5 transition-all",
                    isHovered ? "translate-x-1" : ""
                  )} />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Sections with Scroll Animations */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <Features />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <HowItWorks />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <UseCases />
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </TooltipProvider>
  );
}