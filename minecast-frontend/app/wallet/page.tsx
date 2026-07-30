"use client";

import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WalletPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full p-10 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-yellow-500/30 text-center shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden"
            >
                {/* Gold accent top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
                
                <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                    <Wallet className="w-8 h-8 text-yellow-500" />
                </div>
                
                <h2 className="text-3xl font-bold mb-3 text-white">
                    Connect Wallet
                </h2>
                
                <div className="inline-block px-3 py-1 mb-6 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm font-semibold tracking-wider">
                    COMING SOON
                </div>
                
                <p className="text-gray-400 leading-relaxed">
                    We're putting the final touches on our Web3 integration. Soon you'll be able to mint your viral clips as NFTs and earn MCT tokens!
                </p>
            </motion.div>
        </div>
    );
}
