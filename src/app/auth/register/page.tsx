'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmitRegister = async (data: RegisterValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Call user registration
      await api.post('/user/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // 2. Call OTP send
      await api.post('/otp/send', {
        email: data.email,
        name: data.name,
      });

      setRegisteredEmail(data.email);
      setRegisteredName(data.name);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.post('/otp/verify', {
        email: registeredEmail,
        otp,
      });

      // Redirect to login with success indicator
      router.push('/auth/login?verified=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError(null);
    try {
      await api.post('/otp/send', {
        email: registeredEmail,
        name: registeredName,
      });
      alert('Verification OTP sent successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-indigo-950/20 via-background to-violet-950/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-md bg-card/70">
        {step === 'register' ? (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-extrabold text-center bg-linear-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Enter your details to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitRegister)} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="bg-muted/30 focus-visible:ring-primary/50"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="bg-muted/30 focus-visible:ring-primary/50"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-muted/30 focus-visible:ring-primary/50"
                    {...register('password')}
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>
                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="bg-muted/30 focus-visible:ring-primary/50"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                </div>
                {error && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
                <Button type="submit" className="w-full mt-2 font-semibold" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register & Verify
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Login
                </Link>
              </div>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-extrabold text-center bg-linear-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                Verify Email
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                We sent a 6-digit OTP code to <strong className="text-foreground">{registeredEmail}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="otp" className="text-sm font-medium">One-Time Password (OTP)</label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center text-xl tracking-[0.5em] font-bold bg-muted/30 focus-visible:ring-primary/50"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
                {error && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
                <Button type="submit" className="w-full font-semibold" disabled={isLoading || otp.length !== 6}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Code
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <div className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                Didn&apos;t receive code?{' '}
                <button 
                  type="button" 
                  onClick={handleResendOtp} 
                  disabled={isResending} 
                  className="text-primary hover:underline font-medium disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
              <button 
                type="button" 
                onClick={() => setStep('register')} 
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                ← Back to registration
              </button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
