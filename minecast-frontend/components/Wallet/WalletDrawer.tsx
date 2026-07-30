"use client";

import React, { useEffect, useState } from 'react';
import { X, History, Loader2 } from 'lucide-react';
import { useWallet } from './WalletContext';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';

const treasuryABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "videoId", "type": "string"},
      {"internalType": "bytes", "name": "signature", "type": "bytes"}
    ],
    "name": "claimVideoReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const erc20ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Fallbacks for local demo if missing
const TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;
const REWARD_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as `0x${string}`;

const WalletDrawer: React.FC = () => {
  const { isOpen, closeWallet } = useWallet();
  const { address } = useAccount();

  // Read MT Balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: REWARD_TOKEN_ADDRESS,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const totalBalance = balanceData ? Number(formatUnits(balanceData as bigint, 18)) : 0;

  // Pending Rewards State
  const [pendingRewardsList, setPendingRewardsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('minecast_pending_rewards');
      if (stored) {
        setPendingRewardsList(JSON.parse(stored));
      }
    }
  }, [isOpen]);

  const pendingRewards = pendingRewardsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Write Contract
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isTxActive = isPending || isWaiting;

  const handleClaimRewards = () => {
    if (pendingRewardsList.length === 0 || !address) return;
    
    // Claim the first reward in the list for now
    const rewardToClaim = pendingRewardsList[0];
    
    writeContract({
      address: TREASURY_ADDRESS,
      abi: treasuryABI,
      functionName: 'claimVideoReward',
      args: [rewardToClaim.videoId, rewardToClaim.signature]
    });
  };

  useEffect(() => {
    if (isSuccess && pendingRewardsList.length > 0) {
      // Reward successfully claimed, remove from pending list and update storage
      const newList = pendingRewardsList.slice(1);
      setPendingRewardsList(newList);
      localStorage.setItem('minecast_pending_rewards', JSON.stringify(newList));
      refetchBalance(); // Refresh the on-chain balance display
    }
  }, [isSuccess]);

  const handleHistory = () => {
    console.log('History clicked');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeWallet}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-700 rounded-t-3xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '50vh', maxHeight: '50vh' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-2xl font-bold text-white">My Wallet</h2>
          <button
            onClick={closeWallet}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close wallet"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(50vh - 100px)' }}>
          {/* Main Card - Total Balance */}
          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-yellow-500 via-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/20">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-yellow-900/80 uppercase tracking-wide">
                Total Balance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-yellow-900">
                  {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xl font-semibold text-yellow-900/80">MT</span>
              </div>
            </div>
          </div>

          {/* Secondary Info - Pending Rewards */}
          <div className="mb-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-400 block mb-1">Pending Rewards</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {pendingRewards.toLocaleString()}
                  </span>
                  <span className="text-lg font-semibold text-gray-400">MT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleClaimRewards}
              disabled={pendingRewards === 0 || isTxActive}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isTxActive && <Loader2 className="w-5 h-5 animate-spin" />}
              {isTxActive ? 'Claiming...' : 'Claim Rewards'}
            </button>

            <button
              onClick={handleHistory}
              className="w-full py-4 px-6 bg-gray-800 border border-gray-700 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <History className="w-5 h-5" />
              History
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WalletDrawer;

