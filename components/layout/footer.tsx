import { Github, Twitter, Mail } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#cdffd8] to-[#94b9ff] backdrop-blur-lg border-t border-primary/20 text-primary">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary-800">
              Trust Protocol
            </h3>
            <p className="text-sm text-primary-700">
              Decentralized reputation layer for Web3
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-primary-800">Protocol</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/docs" 
                className="text-sm text-primary-700 hover:text-primary-900 transition-colors hover:underline"
              >
                Documentation
              </Link>
              <Link 
                href="/governance" 
                className="text-sm text-primary-700 hover:text-primary-900 transition-colors hover:underline"
              >
                Governance
              </Link>
              <Link 
                href="/blog" 
                className="text-sm text-primary-700 hover:text-primary-900 transition-colors hover:underline"
              >
                Blog
              </Link>
            </nav>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-primary-800">Community</h4>
            <div className="flex space-x-4">
              <motion.a 
                href="https://github.com/trust-protocol" 
                target="_blank"
                whileHover={{ scale: 1.1 }}
                className="p-2 bg-white/20 rounded-full hover:bg-primary-100 transition-all border border-primary-200"
              >
                <Github className="w-5 h-5 text-primary-800" />
              </motion.a>
              <motion.a 
                href="https://twitter.com/trust_protocol" 
                target="_blank"
                whileHover={{ scale: 1.1 }}
                className="p-2 bg-white/20 rounded-full hover:bg-primary-100 transition-all border border-primary-200"
              >
                <Twitter className="w-5 h-5 text-primary-800" />
              </motion.a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-primary-800">Stay Updated</h4>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/30 border border-primary-300 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-primary-800 placeholder-primary-600"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-300 my-8" />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-primary-700">
          <div className="mb-4 md:mb-0">
            © {new Date().getFullYear()} Trust Protocol. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <Link 
              href="/privacy" 
              className="hover:text-primary-900 transition-colors hover:underline"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="hover:text-primary-900 transition-colors hover:underline"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}