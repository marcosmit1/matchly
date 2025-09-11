"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, CheckCircle } from "lucide-react";
import styles from "./login.module.css";
import { Input } from "@/blocks/input";
import { Button } from "@/blocks/button";
import { SEND_VERIFICATION_EMAIL, SEND_OTP_CODE, VERIFY_OTP_CODE, SIGN_IN_WITH_GOOGLE } from "@/app/auth/actions";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { LoadingSpinner } from "@/components/loading-spinner";

type USER_CREDENTIALS = {
  email?: string;
  password?: string;
};

type AuthState = 'email' | 'verification' | 'otp';

export default function LoginPage() {
  const [email, setemail] = useState("");
  const [otp, setotp] = useState("");
  const [isloading, setisloading] = useState(false);
  const [error, seterror] = useState("");
  const [authState, setAuthState] = useState<AuthState>('email');
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is already authenticated, redirect to app
        router.push('/');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in (e.g., via email verification link), redirect to app
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Check for error parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      switch (errorParam) {
        case 'verification_failed':
          seterror('Email verification failed. Please try again or contact support.');
          break;
        case 'verification_incomplete':
          seterror('Email verification was not completed. Please check your email and try the verification link again.');
          break;
        case 'no_session':
          seterror('Verification completed but session creation failed. Please try signing in again.');
          break;
        case 'unexpected_error':
          seterror('An unexpected error occurred during verification. Please try again.');
          break;
        case 'no_code':
          seterror('Invalid verification link. Please check your email and try again.');
          break;
        default:
          seterror('An error occurred during verification. Please try again.');
      }
      
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const HANDLE_EMAIL_SUBMIT = async (e: React.FormEvent) => {
    e.preventDefault();
    setisloading(true);
    seterror("");

    try {
      // First, try to send OTP to see if user exists and is verified
      const otpResult = await SEND_OTP_CODE(email);
      
      if (otpResult?.error) {
        if (otpResult.error.includes("User not found")) {
          // User doesn't exist, send verification email for new account
          const verifyResult = await SEND_VERIFICATION_EMAIL(email);
          if (verifyResult?.error) {
            seterror(verifyResult.error);
          } else {
            setAuthState('verification');
          }
        } else if (otpResult.error.includes("Email not confirmed")) {
          // User exists but email not confirmed, send verification email
          const verifyResult = await SEND_VERIFICATION_EMAIL(email);
          if (verifyResult?.error) {
            seterror(verifyResult.error);
          } else {
            setAuthState('verification');
          }
        } else if (otpResult.error.includes("Signups not allowed")) {
          // This means the user exists but we can't send OTP
          // Try verification email instead
          const verifyResult = await SEND_VERIFICATION_EMAIL(email);
          if (verifyResult?.error) {
            seterror(verifyResult.error);
          } else {
            setAuthState('verification');
          }
        } else {
          seterror(otpResult.error);
        }
      } else {
        // OTP sent successfully, user is verified
        setAuthState('otp');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        seterror("An unexpected error occurred. Please try again.");
      }
    } finally {
      setisloading(false);
    }
  };

  const HANDLE_VERIFY_CODE = async (e: React.FormEvent) => {
    e.preventDefault();
    setisloading(true);
    seterror("");

    try {
      const result = await VERIFY_OTP_CODE(email, otp);
      // If server action returned an error, show it and stop loading
      if (result?.error) {
        seterror(result.error);
        setisloading(false);
      }
      // On success, VERIFY_OTP_CODE will trigger a redirect and not return
    } catch (error: unknown) {
      // Swallow Next.js redirect exceptions
      if (error instanceof Error && !error.message.includes("NEXT_REDIRECT")) {
        seterror("An unexpected error occurred. Please try again.");
        setisloading(false);
      }
    }
  };

  const HANDLE_GOOGLE_SIGN_IN = async () => {
    setisloading(true);
    seterror("");

    try {
      await SIGN_IN_WITH_GOOGLE();
    } catch (error: unknown) {
      if (error instanceof Error && !error.message.includes("NEXT_REDIRECT")) {
        seterror("An unexpected error occurred. Please try again.");
      }
      setisloading(false);
    }
  };

  const HANDLE_BACK_TO_EMAIL = () => {
    setAuthState('email');
    setotp("");
    seterror("");
  };

  const HANDLE_I_VERIFIED_EMAIL = async () => {
    setisloading(true);
    seterror("");

    try {
      // Now send OTP code since email is verified
      // For existing users, this will send OTP directly
      // For new users, this will create the account and send OTP
      const result = await SEND_OTP_CODE(email);
      if (result?.error) {
        if (result.error.includes("User not found")) {
          // User still doesn't exist, try verification email again
          const verifyResult = await SEND_VERIFICATION_EMAIL(email);
          if (verifyResult?.error) {
            seterror(verifyResult.error);
          } else {
            seterror("Please check your email again and verify before continuing.");
          }
        } else {
          seterror(result.error);
        }
      } else {
        setAuthState('otp');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        seterror("An unexpected error occurred. Please try again.");
      }
    } finally {
      setisloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Matchly</h1>
          <p className="text-gray-600">Welcome to the ultimate tournament companion</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {authState === 'email' && (
            // Email input phase
            <>
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setemail(e.target.value)}
                    className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoCapitalize="none"
                    required
                  />
                </div>
                <Button
                  onClick={HANDLE_EMAIL_SUBMIT}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                  disabled={isloading}
                >
                  {isloading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </>
          )}

          {authState === 'verification' && (
            // Email verification phase for new users
            <>
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 text-sm mb-4">
                  We&apos;ve sent a verification code to <span className="text-blue-600 font-medium">{email}</span>
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  Please check your inbox for the 6-digit verification code
                </p>
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
                  <p><strong>New users:</strong> We do not have an account for you on records. </p>
                  <p>Enter the verification code to create your account</p>
                  <p className="mt-2 text-blue-600">✨ <strong>Tip:</strong> The code will be in your email inbox!</p>
                  <p className="mt-2 text-gray-500">After entering the code, you&apos;ll be automatically signed in.</p>
                </div>
              </div>
              
              <Button
                onClick={HANDLE_I_VERIFIED_EMAIL}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                disabled={isloading}
              >
                {isloading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  "I've Received the Code"
                )}
              </Button>
              
              <Button 
                onClick={HANDLE_BACK_TO_EMAIL} 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to email
              </Button>
            </>
          )}

          {authState === 'otp' && (
            // OTP verification phase
            <>
              <div className="text-center mb-6">
                <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter Verification Code</h2>
                <p className="text-gray-600 text-sm mb-4">
                  We&apos;ve sent a 6-digit code to <span className="text-blue-600 font-medium">{email}</span>
                </p>
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
                  <p>🔐 Enter the 6-digit code from your email to complete sign in</p>
                  <p className="mt-2 text-blue-600">✨ <strong>Alternative:</strong> You can also click the verification link in your email!</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setotp(e.target.value)}
                    className="pl-10 w-full h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                
                <Button
                  onClick={HANDLE_VERIFY_CODE}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
                  disabled={isloading}
                >
                  {isloading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    "Verify Code"
                  )}
                </Button>
                
                <Button 
                  onClick={HANDLE_BACK_TO_EMAIL} 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Back to email
                </Button>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="mt-6">
          <Button
            onClick={HANDLE_GOOGLE_SIGN_IN}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-medium flex items-center justify-center space-x-2"
            disabled={isloading}
          >
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            <span>Continue with Google</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
