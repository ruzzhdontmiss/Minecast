"use client";

import { useState } from 'react';
import { Mail, Lock, User, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

type AuthMethod = 'email' | 'phone' | null;

export default function AuthPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [isSignIn, setIsSignIn] = useState(true);

  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Shared
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setError(null);
    setIsLoading(false);
  };

  const handleBack = () => {
    setAuthMethod(null);
    resetState();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { username: name },
            emailRedirectTo: 'https://minecast.vercel.app/auth/callback'
          },
        });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
        setIsSignIn(true);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!showOtpInput) {
        // Send OTP
        const { error } = await supabase.auth.signInWithOtp({
          phone,
        });
        if (error) throw error;
        setShowOtpInput(true);
        alert("OTP sent to your phone!");
      } else {
        // Verify OTP
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms',
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || "Phone authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://minecast.vercel.app/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8 md:p-10 relative">

          {/* Back Button - Moved to Card Container for absolute positioning check */}
          {authMethod && (
            <button
              onClick={handleBack}
              className="absolute left-6 top-6 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white z-20"
              title="Go Back"
              type="button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 animate-scale-in">
              MineCast
            </h1>
            <p className="text-gray-400 text-sm">Your AI-Driven Video Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm animate-slide-in">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* MAIN SELECTION SCREEN */}
          {!authMethod && (
            <div className="space-y-4 animate-slide-in">
              <p className="text-center text-gray-300 font-medium mb-6">How would you like to continue?</p>

              <button
                onClick={() => setAuthMethod('email')}
                className="w-full py-3.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <span>Continue with Email</span>
              </button>

              <button
                onClick={() => setAuthMethod('phone')}
                className="w-full py-3.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <span>Continue with Phone</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-[#0a0a0a] text-gray-400">or</span></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* EMAIL FORM */}
          {authMethod === 'email' && (
            <div className="space-y-6 animate-slide-in">
              <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                <button onClick={() => setIsSignIn(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isSignIn ? 'bg-white/10 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Sign In</button>
                <button onClick={() => setIsSignIn(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!isSignIn ? 'bg-white/10 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Sign Up</button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="name@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="••••••••" />
                  </div>
                </div>

                {!isSignIn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="Username" />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50">
                  {isLoading ? 'Processing...' : (isSignIn ? 'Sign In' : 'Sign Up')}
                </button>
              </form>
            </div>
          )}

          {/* PHONE FORM */}
          {authMethod === 'phone' && (
            <div className="space-y-6 animate-slide-in">
              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                {!showOtpInput ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500" placeholder="+1234567890" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Enter your number with country code (e.g. +1...)</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Enter OTP</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500" placeholder="123456" />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50">
                  {isLoading ? 'Processing...' : (showOtpInput ? 'Verify OTP' : 'Send Code')}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
