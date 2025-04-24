import { motion } from "framer-motion"

export function BondLoadingModal() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-8 flex flex-col items-center">
        <div className="relative w-32 h-32">
          <motion.div
            className="absolute top-0 left-0 w-16 h-16 bg-blue-500 rounded-full"
            animate={{
              x: [0, 64, 64, 0],
              y: [0, 0, 64, 64],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-16 h-16 bg-green-500 rounded-full"
            animate={{
              x: [0, -64, -64, 0],
              y: [0, 0, -64, -64],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-1 h-1 bg-white"
            style={{ x: "-50%", y: "-50%" }}
            animate={{
              scale: [0, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>
        <p className="mt-4 text-lg font-semibold text-blue-900">Loading...</p>
      </div>
    </motion.div>
  )
}

