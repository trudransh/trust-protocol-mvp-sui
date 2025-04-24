"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Link2, Fingerprint, Scale, Cog, Layers } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

const features = [
  { title: "Sybil Resistant", description: "Protect against identity fraud and manipulation.", icon: Shield },
  { title: "Bond Backed Reputation", description: "Establish trust through financial commitments.", icon: Link2 },
  { title: "Low Collateral", description: "Accessible trust-building with minimal upfront investment.", icon: Scale },
  { title: "Portable Identity", description: "Carry your reputation across different platforms and chains.", icon: Fingerprint },
  { title: "Precise & Extendable", description: "Integrate with ENS, Uniswap, and more for enhanced functionality.", icon: Cog },
  { title: "Agnostic & Interoperable", description: "Works seamlessly across various blockchain ecosystems.", icon: Layers },
];

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType;
}

const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.1 }}
      onHoverStart={() => {
        setIsHovered(true);
        controls.start("hover");
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        controls.start("initial");
      }}
    >
      <Card className="bg-white/20 backdrop-blur-sm border border-white/10 shadow-lg transition-all group relative overflow-hidden h-full">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-[#94b9ff]/10"
          initial="initial"
          animate={controls}
          variants={{
            initial: { opacity: 0, scale: 0.95 },
            hover: { opacity: 1, scale: 1 },
          }}
          transition={{ duration: 0.3 }}
        />

        <CardHeader>
          <CardTitle className="flex items-center z-10 relative">
            <motion.div
              className="p-3 bg-white/30 rounded-lg mr-4 backdrop-blur-sm border border-white/20"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <feature.icon />
            </motion.div>
            <span className="bg-clip-text text-primary">{feature.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="z-10 relative">
          <p className="text-muted-foreground">{feature.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function Features() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-[#94b9ff]/5 -z-10" />
      <motion.h2
        className="text-4xl font-bold text-center mb-12 bg-clip-text"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Key Features
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </div>

      {/* Floating blockchain symbols */}
      {typeof window !== "undefined" &&
        [...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/10 pointer-events-none"
            initial={{
              x: Math.random() * windowSize.width,
              y: Math.random() * windowSize.height,
              scale: Math.random() * 0.5 + 0.5,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * -100],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: Math.random() * 10 + 10,
              delay: Math.random() * 10,
            }}
          >
            {i % 3 === 0 ? <Shield /> : i % 3 === 1 ? <Link2 /> : <Layers />}
          </motion.div>
        ))}
    </section>
  );
}
