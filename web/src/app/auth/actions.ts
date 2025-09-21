"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/supabase/server";

async function getSiteUrl() {
  const hdrs = await headers();
  const origin = hdrs.get("origin");
  return process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost:3000";
}

export async function SEND_VERIFICATION_EMAIL(email: string) {
  const supabase = await createClient();

  console.log('Sending verification email for new user:', email);

  // For new users, use signInWithOtp with shouldCreateUser: true
  // This will send an OTP code for account creation
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('Error sending verification email:', error);
    return { error: error.message };
  }

  console.log('Verification email sent successfully');
  return { success: true };
}

export async function SEND_OTP_CODE(email: string) {
  const supabase = await createClient();

  // Send OTP code directly (no redirect needed for OTP)
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function VERIFY_OTP_CODE(email: string, token: string, returnUrl?: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(returnUrl || "/");
}

export async function SIGN_IN_WITH_GOOGLE(returnUrl?: string) {
  const supabase = await createClient();

  const siteUrl = await getSiteUrl();
  const callbackUrl = returnUrl 
    ? `${siteUrl}/auth/callback?next=${encodeURIComponent(returnUrl)}`
    : `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
    },
  });

  redirect(data?.url ?? "/");
}

export async function LOGOUT() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error && !error.message?.includes("session")) {
    console.error("Logout error:", error.message);
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
