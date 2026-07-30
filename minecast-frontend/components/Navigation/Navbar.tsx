// src/components/Navigation.tsx
"use client"; // This component uses 'Link', so we mark it as a Client Component.

import Link from 'next/link'; // The Next.js component for client-side navigation
import React from 'react';
import { LogOut } from 'lucide-react';

// Import the icons we need (you can find more at heroicons.com)
import { HomeIcon, ArrowUpTrayIcon, WalletIcon } from '@heroicons/react/24/outline';
import { useWallet } from '@/components/Wallet/WalletContext';
import { useAuth } from '@/hooks/useAuth';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navigation = () => {
  const { isAuthenticated, profile, signOut, loading } = useAuth();

  // Get display name: username or email or fallback
  const displayName = profile?.username || profile?.email?.split('@')[0] || 'User';

  return (
    <>
      {/* Top Navigation Bar with Auth Section */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          {/* Brand / Logo (Left) */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              MineCast
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/upload" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Upload
              </Link>
              <Link href="/wallet" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Wallet
              </Link>
            </div>
          </div>

          {/* Auth & Connect (Right) */}
          <div className="flex items-center gap-4">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />

            {!loading && (
              <>
                {!isAuthenticated ? (
                  // Sign In Button
                  <Link
                    href="/auth"
                    className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full border border-white/5 transition-all text-sm backdrop-blur-sm"
                  >
                    Sign In
                  </Link>
                ) : (
                  // User Profile Pill
                  <div className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-gray-200 max-w-[100px] truncate">
                        {displayName}
                      </span>
                    </div>

                    <button
                      onClick={signOut}
                      className="p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 z-10 w-full border-t border-gray-700 bg-black">
        {/* We use flexbox to space out the icons */}
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">

          {/* Link to Home Page */}
          <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-white">
            <HomeIcon className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </Link>

          {/* Wallet Button - Opens Drawer */}
          {/* Wallet Link */}
          <Link href="/wallet" className="flex flex-col items-center text-green-400 hover:text-green-300 transition-colors">
            <WalletIcon className="h-6 w-6" />
            <span className="text-xs font-bold">Wallet</span>
          </Link>

          {/* Link to Upload Page */}
          <Link href="/upload" className="flex flex-col items-center text-gray-400 hover:text-white">
            <ArrowUpTrayIcon className="h-6 w-6" />
            <span className="text-xs">Upload</span>
          </Link>

        </div>
      </nav>
    </>
  );
};

export default Navigation;