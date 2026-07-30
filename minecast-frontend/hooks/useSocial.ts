import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';

export function useSocial(videoId: string) {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      // Use mock data when Supabase is not configured
      setLikes(0);
      setIsLiked(false);
      setComments([]);
      setUserId(null);
      return;
    }

    const client = supabase; // Store in local variable for TypeScript
    if (!client) return;

    const fetchData = async () => {
      try {
        // 1. Get current logged in user
        const { data: { user } } = await client.auth.getUser();
        setUserId(user?.id || null);

        // 2. Get total likes for this video
        const { count } = await client
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('video_id', videoId);
        setLikes(count || 0);

        // 3. Check if *we* liked it
        if (user) {
          const { data } = await client
            .from('likes')
            .select('id')
            .eq('video_id', videoId)
            .eq('user_id', user.id)
            .single();
          setIsLiked(!!data);
        }

        // 4. Get comments
        const { data: commentData } = await client
          .from('comments')
          .select('*, profiles(username)')
          .eq('video_id', videoId)
          .order('created_at', { ascending: false });
        setComments(commentData || []);
      } catch (error) {
        console.error('Error fetching social data:', error);
        // Fallback to empty state on error
        setLikes(0);
        setComments([]);
      }
    };

    fetchData();
  }, [videoId]);

  // Toggle Like
  const toggleLike = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      // Mock behavior when Supabase is not configured
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
      return;
    }

    const client = supabase;
    if (!client) return;

    if (!userId) {
      alert("Please login to like!");
      return;
    }

    if (isLiked) {
      setLikes(l => l - 1);
      setIsLiked(false);
      await client.from('likes').delete().eq('video_id', videoId).eq('user_id', userId);
    } else {
      setLikes(l => l + 1);
      setIsLiked(true);
      await client.from('likes').insert({ video_id: videoId, user_id: userId });
    }
  };

  // Add Comment
  const addComment = async (text: string) => {
    if (!text.trim()) return;

    if (!isSupabaseConfigured() || !supabase) {
      // Mock behavior when Supabase is not configured
      const newComment = {
        id: Date.now(),
        content: text,
        created_at: new Date().toISOString(),
        profiles: { username: 'Guest' }
      };
      setComments([newComment, ...comments]);
      return;
    }

    if (!userId) {
      alert("Please login to comment!");
      return;
    }

    // Show it instantly (Optimistic UI)
    const newComment = {
      id: Date.now(),
      content: text,
      created_at: new Date().toISOString(),
      profiles: { username: 'You' }
    };
    setComments([newComment, ...comments]);

    // Send to DB
    const client = supabase;
    if (!client) return;

    try {
      await client.from('comments').insert({
        content: text,
        video_id: videoId,
        user_id: userId
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      // Remove optimistic comment on error
      setComments(comments);
    }
  };

  return { likes, isLiked, toggleLike, comments, addComment, userId };
}