"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ArrowRight, Users, Lock, Network, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

const steps = [
  {
    title: "Create or Join Bonds",
    description: "Deposit funds into a bond (one-way or mutual)",
    tip: "Start with as little as 0.1 ETH to create a new bond",
    icon: Shield,
  },
  {
    title: "Earn Reputation",
    description: "Active bonds increase your reputation over time",
    tip: "Reputation grows exponentially with bond duration",
    icon: Users,
  },
  {
    title: "Break Bonds",
    description: "Incurs a 10% penalty to the treasury and reputation loss",
    tip: "Penalties prevent malicious behavior and false commitments",
    icon: Lock,
  },
  {
    title: "Utilize Trust",
    description: "Leverage your established trust across various DApps and platforms.",
    tip: "Use your reputation score in DeFi, DAOs, and social networks",
    icon: Network,
  },
];

export default function HowItWorks() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });

      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return (
    <TooltipProvider>
      <section className="py-16 relative overflow-hidden">
        <div className="absolute hidden md:block top-[120px] left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-transparent" />

        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.2 }}
              className="relative"
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
            >
              {/* Timeline connector */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden md:block absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-primary/30"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.2 + 0.5, duration: 0.5 }}
                />
              )}

              <Card className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-xl transition-all group h-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />

                <div className="absolute top-4 right-4">
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-primary/80 hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-background/90 backdrop-blur-sm">
                      <p className="text-sm">{step.tip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center text-primary">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#94b9ff] text-white flex items-center justify-center mr-3 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <step.icon className="w-5 h-5" />
                    </motion.div>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                  <AnimatePresence></AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Floating Ethereum symbols */}
        <div className="absolute inset-0 pointer-events-none">
          {typeof window !== "undefined" &&
            [...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-primary/20"
                initial={{
                  x: Math.random() * windowSize.width,
                  y: Math.random() * windowSize.height,
                  scale: Math.random() * 0.5 + 0.5,
                  opacity: 0,
                }}
                animate={{
                  y: [null, Math.random() * -100],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: Math.random() * 10 + 10,
                  delay: Math.random() * 10,
                }}
              >
                <Shield />
              </motion.div>
            ))}
        </div>
      </section>
    </TooltipProvider>
  );
}
