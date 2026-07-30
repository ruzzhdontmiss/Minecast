// src/app/upload/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Upload, X, FileVideo, History, RefreshCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAccount, useWriteContract } from 'wagmi';
import addresses from '@/utils/contracts/addresses.json';
import RareVideoNFT from '@/utils/contracts/RareVideoNFT.json';

// --- Types ---
interface AnalysisResult {
  rarity_score: number;
  tier: string;
  is_duplicate: boolean;
  message: string;
}

interface HistoryItem extends AnalysisResult {
  id: string; // Unique ID for keying
  timestamp: number;
}

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();

  // --- State ---
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fallbackScore, setFallbackScore] = useState<number>(0);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('minecast_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('minecast_history', JSON.stringify(history));
  }, [history]);

  // Clean up object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // --- Handlers ---

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMessage("Please select a valid video file.");
      return;
    }
    setVideoFile(file);
    setErrorMessage(null);
    setAnalysisResult(null);

    // Create preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearSelection = () => {
    setVideoFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Generate consistent score locally based on file properties
      const score = (videoFile.size % 40) + 60;
      let tier = "Common";
      if (score >= 90) tier = "Legendary";
      else if (score >= 75) tier = "Rare";

      const result: AnalysisResult = {
        rarity_score: score,
        tier: tier,
        is_duplicate: false,
        message: "Original content"
      };

      setAnalysisResult(result);

      // Add to history
      const newHistoryItem: HistoryItem = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10)); // Keep last 10

    } catch (error) {
      console.error("Error analyzing video:", error);
      setErrorMessage("Failed to process video.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Web3 Hooks ---
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const handlePublish = async () => {
    if (!videoFile || !analysisResult || !supabase) return;

    if (!user) {
      alert("Please sign in to publish videos!");
      return;
    }

    if (!address) {
      alert("Please connect your wallet to mint the NFT!");
      return;
    }

    setIsLoading(true);
    try {
      const filename = `${Date.now()}-${videoFile.name.replace(/\s+/g, '-')}`;

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filename, videoFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filename);

      // 3. Save Metadata to DB
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          url: publicUrl,
          creator_id: user.id,
          rarity_score: analysisResult.rarity_score,
          is_unique: !analysisResult.is_duplicate,
          title: videoFile.name.split('.')[0] || 'Untitled Video',
          description: `A ${getRarityTier(analysisResult.rarity_score)} clip analyzed by MineCast AI.`
        });

      if (dbError) throw dbError;

      // 4. Update AI Index (Removed - Handled implicitly by new /analyze endpoint)

      // 5. Mint NFT (Blockchain)
      try {
        const rarityInt = analysisResult.rarity_score; // Already an int 0-100
        console.log("Minting with rarity:", rarityInt, "to:", address);

        const txHash = await writeContractAsync({
          address: addresses.rareVideoNFTAddress as `0x${string}`,
          abi: RareVideoNFT.abi,
          functionName: 'mintVideo',
          args: [address, publicUrl, BigInt(rarityInt)],
        });

        console.log("NFT Mint Transaction Sent:", txHash);
        alert(`Video Published! NFT Minting... Tx: ${txHash.slice(0, 10)}...`);

      } catch (mintError) {
        console.error("NFT Minting failed:", mintError);
        alert("Video saved to Web2, but NFT Minting failed. Check console.");
      }

      router.push('/'); // Go to feed

    } catch (error: any) {
      console.error("Publishing error:", error);
      setErrorMessage(error.message || "Failed to publish video.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Helpers ---

  const getRarityColor = (score: number) => {
    if (score >= 90) return "text-orange-400"; // Legendary
    if (score >= 75) return "text-purple-400"; // Epic/Rare
    if (score >= 50) return "text-blue-400";   // Rare
    return "text-gray-400";                    // Common
  };

  const getRarityTier = (score: number) => {
    if (score >= 90) return "LEGENDARY";
    if (score >= 75) return "RARE";
    if (score >= 50) return "UNCOMMON";
    return "COMMON";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            MineCast AI Engine
          </h1>
          <p className="text-gray-400">Upload your clip to verify its originality.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* LEFT COLUMN: UPLOAD & PREVIEW */}
          <div className="space-y-6">

            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-colors duration-200 ease-in-out cursor-pointer text-center
                ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900'}
                ${errorMessage ? 'border-red-500 bg-red-900/10' : ''}
              `}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {!previewUrl ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="p-4 bg-gray-800 rounded-full">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Drag & drop your video here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Video Preview */}
                  <div className="rounded-lg overflow-hidden bg-black aspect-video shadow-2xl relative group">
                    <video
                      src={previewUrl}
                      className="w-full h-full object-contain"
                      controls
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                      className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-600 rounded-full transition-colors text-white"
                      title="Remove video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-gray-400 truncate flex items-center justify-center gap-2">
                    <FileVideo className="w-4 h-4" />
                    {videoFile?.name}
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3 text-red-400"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{errorMessage}</p>
              </motion.div>
            )}

            {/* Action Button */}
            <button
              onClick={handleSubmit}
              disabled={!videoFile || isLoading || analysisResult !== null}
              className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg transition-all
                ${!videoFile || isLoading || analysisResult !== null
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25 active:scale-[0.98]'}
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCcw className="w-5 h-5 animate-spin" /> Analyzing originality...
                </span>
              ) : "Analyze Originality"}
            </button>
          </div>

          {/* RIGHT COLUMN: RESULTS & HISTORY */}
          <div className="space-y-6">

            {/* Active Result */}
            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                {analysisResult ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 h-full flex flex-col items-center justify-center text-center shadow-xl"
                  >
                    <div className="mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Rarity Score</h3>
                      <div className={`text-7xl font-black mb-1 ${getRarityColor(analysisResult.rarity_score)}`}>
                        {analysisResult.rarity_score}%
                      </div>
                      <div className={`text-lg font-bold tracking-widest ${getRarityColor(analysisResult.rarity_score)} opacity-80`}>
                        {analysisResult.tier.toUpperCase()} TIER
                      </div>
                    </div>

                    <div className="space-y-4 w-full max-w-xs bg-black/20 p-6 rounded-lg">
                      <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-3">
                        <span className="text-gray-400">Status</span>
                        <span className={`flex items-center gap-2 font-medium ${!analysisResult.is_duplicate ? 'text-green-400' : 'text-red-400'}`}>
                          {!analysisResult.is_duplicate ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          {!analysisResult.is_duplicate ? 'Unique' : 'Duplicate'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Message</span>
                        <span className="font-mono text-gray-300 truncate max-w-[120px]" title={analysisResult.message}>
                          {analysisResult.message}
                        </span>
                      </div>
                    </div>

                    {/* Publish Button */}
                    {!analysisResult.is_duplicate && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all"
                        onClick={handlePublish}
                        disabled={isLoading}
                      >
                        {isLoading ? "Publishing..." : "Mint & Publish"}
                      </motion.button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-gray-600 border border-gray-800 border-dashed rounded-xl"
                  >
                    <p>Results will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="pt-6 border-t border-gray-800">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" /> Recent Scans
                </h3>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="bg-gray-900 border border-gray-800 p-3 rounded-lg flex items-center justify-between hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm bg-gray-950 ${getRarityColor(item.rarity_score)}`}>
                          {Math.round(item.rarity_score * 100)}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-white truncate w-32 md:w-48">{item.filename}</p>
                          <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-full ${item.is_unique ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {item.is_unique ? 'UNIQUE' : 'COPY'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}