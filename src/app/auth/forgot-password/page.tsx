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

const emailSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

const resetPasswordSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

type EmailValue = z.infer<typeof emailSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<EmailValue>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmitEmail = async (data: EmailValue) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset OTP. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Verify OTP and get reset token
      const verifyRes = await api.post('/auth/verify-forgot-password-otp', {
        email,
        otp: data.otp,
      });
      const { resetToken } = verifyRes.data.data;

      // 2. Call reset password using the reset token
      await api.post('/auth/reset-password', {
        newPassword: data.newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${resetToken}`,
        },
      });

      alert('Password reset successfully! You can now log in.');
      router.push('/auth/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-indigo-950/20 via-background to-violet-950/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-md bg-card/70">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-extrabold text-center bg-linear-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {step === 'email' 
              ? 'Enter your email address and we will send you an OTP code to reset your password' 
              : 'Enter the 6-digit OTP code sent to your email and your new password'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-muted/30 focus-visible:ring-primary/50"
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              {error && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
              <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onSubmitReset)} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="otp" className="text-sm font-medium">OTP Code</label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="text-center text-lg tracking-widest font-bold bg-muted/30 focus-visible:ring-primary/50"
                  {...resetForm.register('otp')}
                />
                {resetForm.formState.errors.otp && (
                  <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.otp.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                <Input
                  id="newPassword"
                  type="password"
                  className="bg-muted/30 focus-visible:ring-primary/50"
                  {...resetForm.register('newPassword')}
                />
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="confirmNewPassword" className="text-sm font-medium">Confirm New Password</label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  className="bg-muted/30 focus-visible:ring-primary/50"
                  {...resetForm.register('confirmNewPassword')}
                />
                {resetForm.formState.errors.confirmNewPassword && (
                  <p className="text-xs text-red-500 mt-1">{resetForm.formState.errors.confirmNewPassword.message}</p>
                )}
              </div>
              {error && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
              <Button type="submit" className="w-full mt-2 font-semibold" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {step === 'reset' && (
            <button 
              type="button" 
              onClick={() => setStep('email')} 
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              ← Back to request code
            </button>
          )}
          <div className="text-sm text-center text-muted-foreground">
            Back to{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
