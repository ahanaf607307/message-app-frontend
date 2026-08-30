'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loader2, MessageCircle, Share2, Users, Award } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', data);
      const { token, user } = response.data.data;
      login(token || response.data.data.accessToken, user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/google/url');
      if (response.data.success && response.data.data.url) {
        window.location.href = response.data.data.url;
      } else {
        throw new Error('Google redirect URL not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize Google login. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-indigo-950/40 via-background to-violet-950/40 font-sans-active">
      {/* Left side panel (branding / features) - Visible on md and larger */}
      <div className="hidden md:flex md:w-1/2 bg-linear-to-br from-blue-950 via-slate-900 to-indigo-950 p-12 text-white flex-col justify-between relative overflow-hidden border-r border-primary/20">
        {/* Glow effects */}
        <div className="absolute top-[-20%] left-[-20%] w-80 h-80 rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-80 h-80 rounded-full bg-blue-500/10 blur-[120px]"></div>

        {/* Brand logo */}
        <div className="flex items-center space-x-3 z-10">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <MessageCircle className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight bg-linear-to-r from-primary to-amber-300 bg-clip-text text-transparent">
            Your Chat
          </span>
        </div>

        {/* Feature bullets */}
        <div className="my-auto space-y-8 max-w-lg z-10">
          <h2 className="text-4xl lg:text-5xl font-black leading-tight bg-linear-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            See what&apos;s happening in the social space.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Connect, chat, and collaborate with people from around the globe in a safe and secure instant messaging network.
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Interactive Communities</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Start direct chats, build groups, and connect with people.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Real-Time Messaging</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Fast Socket.IO updates, live indicators, and reactive delivery status.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Premium Administration</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Interactive consoles, custom SVG stats, and active role configurations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground z-10 flex items-center gap-1.5">
          <span>© 2026 Your Chat Inc by Ahanaf Mubasshir. All rights reserved.</span>
        </div>
      </div>

      {/* Right side panel (form container) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative animate-fade-in">
        {/* Glow effect on mobile */}
        <div className="md:hidden absolute top-10 left-10 w-60 h-60 rounded-full bg-primary/5 blur-[80px] pointer-events-none"></div>

        <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-md bg-card/85 relative">
          <CardHeader className="space-y-1 pb-4">
            {/* Show logo on mobile header */}
            <div className="md:hidden flex items-center justify-center space-x-2.5 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-foreground">Your Chat</span>
            </div>
            <CardTitle className="text-3xl font-extrabold text-center bg-linear-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground text-xs">
              Welcome back! Join the conversation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-semibold">Email Address</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-muted/30 focus-visible:ring-primary/40 text-sm h-9.5"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="bg-muted/30 focus-visible:ring-primary/40 text-sm h-9.5"
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
              {error && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
              <Button type="submit" className="w-full font-bold h-10 shadow-md shadow-primary/20" disabled={isLoading || isGoogleLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In
              </Button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">Or join with</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full bg-muted/20 border-border/50 hover:bg-muted/40 font-semibold h-10"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
              )}
              Sign in with Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              New to Your Chat?{' '}
              <Link href="/auth/register" className="text-primary hover:underline font-bold">
                Create an account
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
