// src/app/page.tsx
"use client";

import { useEffect, useState } from 'react';
import VideoPlayer from '@/components/videoPlayer';
import { supabase } from '@/utils/supabase';
import { MOCK_VIDEOS } from '@/data/videos';

export default function Home() {
  const [feedVideos, setFeedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      let videosData = [];
      if (supabase) {
        const { data: videos, error } = await supabase
          .from('videos')
          .select('*, profiles(username)')
          .order('created_at', { ascending: false });

        if (!error && videos && videos.length > 0) {
          videosData = videos;
        } else {
          if (error) console.error("Error fetching videos:", error);
          videosData = MOCK_VIDEOS;
        }
      } else {
        videosData = MOCK_VIDEOS;
      }
      setFeedVideos(videosData);
      setLoading(false);
    }
    
    fetchVideos();
  }, []);

  if (loading) {
    return (
      <main className="h-screen w-full bg-black flex items-center justify-center text-white">
        <p>Loading Feed...</p>
      </main>
    );
  }

  return (
    <main className="h-screen w-full">
      <div className="h-screen w-full snap-y snap-mandatory overflow-y-scroll bg-black">
        {feedVideos.length > 0 ? (
          feedVideos.map((video) => (
            <VideoPlayer key={video.id} video={video} />
          ))
        ) : (
          <div className="h-full w-full flex items-center justify-center text-white snap-start">
            <p>No videos found. Be the first to upload!</p>
          </div>
        )}
      </div>
    </main>
  );
}