// src/components/videoPlayer.tsx
"use client";

import React, { useRef, useEffect, useState } from 'react';
import VideoSidebar from './VideoSidebar';
import { useAccount } from 'wagmi';
import axios from 'axios';

interface VideoPlayerProps {
  video: any; // Using any for now to accept both MOCK and real DB types
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { address: wagmiAddress } = useAccount();
  const address = wagmiAddress || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat Account 0 for Demo

  // Watch-to-Earn state
  const hasClaimedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // DB stores rarity_score as 0-1, Sidebar expects 0-100
  const rarityPercentage = video.rarity_score !== undefined 
    ? Math.round(video.rarity_score * 100) 
    : (video.rarityScore || 0);

  // DB uses 'url', MOCK used 'src'
  const videoSrc = video.url || video.src;
  const isImage = typeof videoSrc === 'string' && (
    videoSrc.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) || 
    videoSrc.startsWith('data:image/')
  );

  // Prefer creator's username, fallback to title
  const displayTitle = video.profiles?.username 
    ? `@${video.profiles.username}` 
    : (video.title || 'Untitled');

  const handleValidView = async () => {
    const videoIdStr = video.id?.toString();
    if (!videoIdStr || !address) return;

    // Check session storage to prevent multiple claims per session
    const sessionKey = `viewed_${videoIdStr}`;
    if (sessionStorage.getItem(sessionKey)) return;
    
    sessionStorage.setItem(sessionKey, 'true');
    console.log(`Valid view registered for video ${videoIdStr}!`);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await axios.post(`${API_URL}/claim-reward`, {
        wallet_address: address,
        video_id: videoIdStr
      });
      
      const { signature } = response.data;
      if (signature) {
        // Store signature in localStorage so WalletDrawer and WalletPage can pick it up
        const pendingRewardsStr = localStorage.getItem('minecast_pending_rewards') || '[]';
        const pendingRewards = JSON.parse(pendingRewardsStr);
        if (!pendingRewards.some((r: any) => r.videoId === videoIdStr)) {
          pendingRewards.push({
            videoId: videoIdStr,
            signature: signature,
            amount: 10 // 10 MT per view
          });
          localStorage.setItem('minecast_pending_rewards', JSON.stringify(pendingRewards));
          console.log("Reward signature saved to local storage!");
        }
      }
    } catch (error) {
      console.error("Failed to claim watch reward:", error);
    }
  };

  useEffect(() => {
    if (isPlaying && !hasClaimedRef.current) {
      timerRef.current = setTimeout(() => {
        hasClaimedRef.current = true;
        handleValidView();
      }, 5000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, address]); // Re-run if playing state or wallet connection changes

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.6, // Video must be 60% visible to play
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsPlaying(true);
          if (videoRef.current) {
            videoRef.current.play().catch(error => console.log("Autoplay prevented:", error));
          }
        } else {
          setIsPlaying(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const togglePlay = () => {
    if (isImage) return; // Images don't pause/play
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(error => console.log("Playback prevented:", error));
        setIsPlaying(true);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative h-screen w-full snap-start bg-black flex items-center justify-center">
      {isImage ? (
        <img
          src={videoSrc}
          alt={displayTitle}
          className="h-full w-full object-contain bg-black"
        />
      ) : (
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          muted
          playsInline
          onClick={togglePlay}
          className="h-full w-full object-cover cursor-pointer"
        />
      )}

      {/* Play/Pause Indicator Overlay */}
      {!isPlaying && !isImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm">
             <svg className="w-12 h-12 text-white opacity-90 pl-1" fill="currentColor" viewBox="0 0 20 20">
               <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
             </svg>
          </div>
        </div>
      )}

      {/* Video Info Overlay */}
      <div className="absolute bottom-16 left-0 w-full p-4 text-white bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none">
        <h3 className="text-xl font-bold drop-shadow-md">{displayTitle}</h3>
        <p className="text-sm drop-shadow-md">{video.description}</p>
      </div>

      {/* Video Sidebar - positioned absolutely on the right */}
      <div className="absolute top-0 right-0 h-full w-16 pointer-events-auto z-20">
        <VideoSidebar
          videoId={video.id?.toString()}
          rarityScore={rarityPercentage}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;