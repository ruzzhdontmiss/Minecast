"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuth() {
      try {
        if (!supabase) {
          router.push('/');
          return;
        }

        // 1. Check if there is an auth code in query params (PKCE flow)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // 2. Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          // Ensure profile exists in profiles table
          const user = session.user;
          const username = user.user_metadata?.username || 
                           user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           'creator';

          await supabase.from('profiles').upsert({
            id: user.id,
            username: username,
            email: user.email || null,
          });
        }

        router.push('/');
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setErrorMsg(err.message || "Failed to complete authentication.");
        setTimeout(() => router.push('/auth'), 3000);
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="p-8 rounded-2xl bg-gray-900/60 border border-gray-800 text-center space-y-4 max-w-sm w-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
        <h2 className="text-xl font-bold">Connecting your account...</h2>
        <p className="text-sm text-gray-400">
          {errorMsg ? errorMsg : "Finalizing authentication, redirecting to feed..."}
        </p>
      </div>
    </div>
  );
}
