"use client";

import React, { useEffect, useState } from 'react';
import { Wallet, Coins, Award, ShieldCheck, ArrowUpRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import addresses from '@/utils/contracts/addresses.json';

const treasuryABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "videoId", "type": "string" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "claimVideoReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const erc20ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS || addresses.treasuryAddress) as `0x${string}`;
const REWARD_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS || addresses.mineTokenAddress) as `0x${string}`;

export default function WalletPage() {
  const { address, isConnected } = useAccount();

  // Read On-Chain MCT Balance
  const { data: balanceData, refetch: refetchBalance, isLoading: isBalanceLoading } = useReadContract({
    address: REWARD_TOKEN_ADDRESS,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const totalBalance = balanceData ? Number(formatUnits(balanceData as bigint, 18)) : 0;

  // Pending Watch Rewards stored from feed views
  const [pendingRewardsList, setPendingRewardsList] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('minecast_pending_rewards');
    if (stored) {
      try {
        setPendingRewardsList(JSON.parse(stored));
      } catch (e) {
        console.error("Error reading pending rewards", e);
      }
    }
  }, []);

  const pendingRewardsTotal = pendingRewardsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Write Contract Execution
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isTxActive = isPending || isWaiting;

  const handleClaim = (index: number) => {
    if (!address || pendingRewardsList.length <= index) return;
    const reward = pendingRewardsList[index];

    writeContract({
      address: TREASURY_ADDRESS,
      abi: treasuryABI,
      functionName: 'claimVideoReward',
      args: [reward.videoId, reward.signature]
    });
  };

  useEffect(() => {
    if (isSuccess && pendingRewardsList.length > 0) {
      const newList = pendingRewardsList.slice(1);
      setPendingRewardsList(newList);
      localStorage.setItem('minecast_pending_rewards', JSON.stringify(newList));
      refetchBalance();
    }
  }, [isSuccess]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
            MineCast Token Wallet
          </h1>
          <p className="text-gray-400 text-sm">
            Watch-to-Earn Rewards, Creator Royalties, and Polygon Smart Contracts
          </p>
        </div>

        {/* Connect Wallet Bar */}
        <div className="flex justify-center">
          <ConnectButton />
        </div>

        {/* Main Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-yellow-500/20 via-amber-600/10 to-yellow-950/40 border border-yellow-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(234,179,8,0.15)] relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-yellow-400/80">Total Balance</span>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-white">
                  {isBalanceLoading ? "..." : totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-2xl font-bold text-yellow-400">MCT</span>
              </div>
              <p className="text-xs text-gray-400">MineCast Token (ERC-20)</p>
            </div>
            <div className="p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
              <Coins className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </motion.div>

        {/* Watch-to-Earn Pending Rewards */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Watch-to-Earn Rewards</h2>
            </div>
            <span className="text-sm font-semibold text-gray-400">
              {pendingRewardsTotal} MCT Available to Claim
            </span>
          </div>

          {!isConnected ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p>Connect your wallet above to claim watch rewards.</p>
            </div>
          ) : pendingRewardsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-400/60" />
              <p className="text-sm">No pending rewards right now.</p>
              <p className="text-xs text-gray-600 mt-1">Watch videos in the feed for &gt;5 seconds to earn MCT tokens!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRewardsList.map((reward, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-950/80 rounded-xl border border-gray-800">
                  <div>
                    <p className="text-sm font-semibold text-white">Video #{reward.videoId}</p>
                    <p className="text-xs text-green-400 font-mono">+{reward.amount} MCT earned</p>
                  </div>
                  <button
                    onClick={() => handleClaim(idx)}
                    disabled={isTxActive}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium text-xs rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTxActive && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isTxActive ? "Claiming..." : "Claim on Chain"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deployed Web3 Contracts Card */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 text-xs text-gray-400 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smart Contract Verification</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
            <div className="p-3 bg-black/40 rounded-lg border border-gray-800/80">
              <p className="text-gray-500 text-[10px] uppercase">Reward Token (ERC-20)</p>
              <p className="truncate text-white" title={REWARD_TOKEN_ADDRESS}>{REWARD_TOKEN_ADDRESS}</p>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-gray-800/80">
              <p className="text-gray-500 text-[10px] uppercase">Video NFT (ERC-721)</p>
              <p className="truncate text-white" title={addresses.rareVideoNFTAddress}>{addresses.rareVideoNFTAddress}</p>
            </div>
            <div className="p-3 bg-black/40 rounded-lg border border-gray-800/80">
              <p className="text-gray-500 text-[10px] uppercase">Treasury Vault</p>
              <p className="truncate text-white" title={TREASURY_ADDRESS}>{TREASURY_ADDRESS}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
