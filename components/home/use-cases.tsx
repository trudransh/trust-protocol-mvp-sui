import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ShieldCheck, Handshake, Building, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const useCases = [
  { 
    title: "Decentralized Social Networks", 
    description: "Enhance user authenticity and reduce spam.",
    icon: Users,
    tip: "Prevent bot accounts and fake engagement through verified reputation"
  },
  {
    title: "DeFi Protocols",
    description: "Improve risk assessment and enable under-collateralized lending.",
    icon: ShieldCheck,
    tip: "Use trust scores to determine creditworthiness in lending pools"
  },
  { 
    title: "DAO Governance", 
    description: "Strengthen voting mechanisms and prevent Sybil attacks.",
    icon: Handshake,
    tip: "Weight voting power based on established trust and participation history"
  },
  {
    title: "Web3 Marketplaces",
    description: "Build trust between buyers and sellers in decentralized commerce.",
    icon: Building,
    tip: "Enable escrow-free transactions between trusted parties"
  },
]

export default function UseCases() {
  return (
    <TooltipProvider>
      <section className="py-16 relative">
        <motion.h2
          className="text-3xl font-bold text-center mb-8 bg-clip-text "
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Use Cases
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="bg-white/20 backdrop-blur-sm border border-white/10 hover:bg-white/30 transition-all group relative h-full">
                <div className="absolute top-4 right-4">
                  <Tooltip>
                    <TooltipTrigger>
                      <ShieldCheck className="w-4 h-4 text-primary/80 hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-background/90 backdrop-blur-sm">
                      <p className="text-sm">{useCase.tip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center">
                    <motion.div
                      className="p-3 bg-primary/10 rounded-lg mr-4"
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <useCase.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <span className="bg-clip-text text-primary">
                      {useCase.title}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{useCase.description}</p>
                  <motion.div
                    className="flex items-center text-primary font-medium gap-1"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <span className="text-sm">Explore implementations</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Animated connection lines */}
        {/* <div className="hidden md:block absolute inset-0">
          <motion.div
            className="absolute left-1/2 top-1/2 w-px h-[60%] bg-gradient-to-b from-primary/20 to-transparent"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 1 }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 w-[40%] h-px bg-gradient-to-r from-primary/20 to-transparent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div> */}
      </section>
    </TooltipProvider>
  )
}