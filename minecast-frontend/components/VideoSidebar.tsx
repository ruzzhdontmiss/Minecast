"use client";

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Send, X } from 'lucide-react';
import { useSocial } from '@/hooks/useSocial'; // Connection to Supabase
// Animation handled with CSS classes

interface VideoSidebarProps {
  videoId: string; // REQUIRED: To know which video we are liking
  rarityScore?: number;
}

const VideoSidebar: React.FC<VideoSidebarProps> = ({
  videoId,
  rarityScore = 0,
}) => {
  // 1. Get Real Data from Supabase Hook
  const { likes, isLiked, toggleLike, comments, addComment } = useSocial(videoId);

  // 2. Local UI State
  const [shouldAnimate, setShouldAnimate] = useState(false); // Your bounce animation
  const [showComments, setShowComments] = useState(false);   // Drawer toggle
  const [inputText, setInputText] = useState("");            // Comment input

  // Your Helper Function
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Wrapper to handle both Animation AND Database call
  const handleLikeClick = async () => {
    if (!isLiked) {
        setShouldAnimate(true);
        setTimeout(() => setShouldAnimate(false), 300);
    }
    toggleLike(); // Call the hook
  };

  // Determine rarity color and glow effect (Your Logic)
  const getRarityStyle = () => {
    if (rarityScore > 80) {
      return {
        color: '#FFD700', // Gold
        glow: 'drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]',
        bgColor: 'rgba(255, 215, 0, 0.1)',
      };
    } else if (rarityScore > 50) {
      return {
        color: '#10B981', // Green
        glow: '',
        bgColor: 'rgba(16, 185, 129, 0.1)',
      };
    } else {
      return {
        color: '#6B7280', // Gray
        glow: '',
        bgColor: 'rgba(107, 114, 128, 0.1)',
      };
    }
  };

  const rarityStyle = getRarityStyle();
  const circumference = 2 * Math.PI * 30; // radius = 30
  const offset = circumference - (rarityScore / 100) * circumference;

  return (
    <>
    {/* --- SIDEBAR ICONS (Your Original UI) --- */}
    <div className="absolute bottom-20 right-4 flex flex-col items-center gap-6 z-20">
      
      {/* Rarity Meter */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 70 70">
            {/* Background circle */}
            <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="4" />
            {/* Progress circle */}
            <circle
              cx="35"
              cy="35"
              r="30"
              fill="none"
              stroke={rarityStyle.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`transition-all duration-500 ${rarityStyle.glow}`}
              style={{ filter: rarityScore > 80 ? 'drop-shadow(0 0 8px rgba(255,215,0,0.8))' : 'none' }}
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: rarityStyle.color }}>
              {rarityScore}
            </span>
          </div>
        </div>
        {/* Rarity label */}
        <span className="text-[10px] font-bold uppercase tracking-wider shadow-black drop-shadow-md" style={{ color: rarityStyle.color }}>
          {rarityScore > 80 ? 'Legendary' : rarityScore > 50 ? 'Rare' : 'Common'}
        </span>
      </div>

      {/* Like Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleLikeClick}
          className="p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-black/50 active:scale-90 transition-all duration-200"
        >
          <div className={`${shouldAnimate ? 'animate-heart-bounce' : ''}`}>
            <Heart
              className={`w-6 h-6 transition-colors drop-shadow-lg ${
                isLiked ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </div>
        </button>
        <span className="text-xs font-semibold text-white drop-shadow-lg">
          {formatNumber(likes)}
        </span>
      </div>

      {/* Comment Button (Opens Drawer) */}
      <div className="flex flex-col items-center gap-1">
        <button 
          onClick={() => setShowComments(true)}
          className="p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-black/50 transition-colors"
        >
          <MessageCircle className="w-6 h-6 text-white drop-shadow-lg" />
        </button>
        <span className="text-xs font-semibold text-white drop-shadow-lg">
          {formatNumber(comments.length)}
        </span>
      </div>

      {/* Share Button */}
      <div className="flex flex-col items-center gap-1">
        <button className="p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-black/50 transition-colors">
          <Share2 className="w-6 h-6 text-white drop-shadow-lg" />
        </button>
      </div>
    </div>

    {/* --- COMMENTS DRAWER (New Feature) --- */}
    {showComments && (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        
        {/* Backdrop (Click to close) */}
        <div 
          onClick={() => setShowComments(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        />

        {/* Drawer Content */}
        <div 
          className="relative z-10 h-[60vh] w-full bg-[#121212] rounded-t-3xl border-t border-gray-800 flex flex-col shadow-2xl animate-slide-up"
        >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto absolute left-0 right-0 top-3" />
                <h3 className="font-bold text-white text-sm mt-2">Comments ({comments.length})</h3>
                <button onClick={() => setShowComments(false)} className="p-1 text-gray-400 hover:text-white mt-2 z-20">
                    <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                        <MessageCircle className="w-12 h-12 mb-2" />
                        <p className="text-sm">No comments yet.</p>
                        <p className="text-xs">Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {c.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-400 mb-0.5">
                                {c.profiles?.username || 'User'}
                            </p>
                            <p className="text-sm text-gray-200 leading-relaxed">{c.content}</p>
                        </div>
                    </div>
                    ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-800 bg-[#121212] pb-8">
                <div className="flex gap-2 items-center">
                    <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        className="flex-1 bg-gray-800 text-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (addComment(inputText), setInputText(""))}
                    />
                    <button 
                        onClick={() => { addComment(inputText); setInputText(""); }}
                        disabled={!inputText.trim()}
                        className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
              </div>

        </div>
      </div>
    )}
    </>
  );
};

export default VideoSidebar;