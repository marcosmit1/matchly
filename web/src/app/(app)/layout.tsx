import type { Metadata } from "next";

import "../globals.css";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { NavWrapper } from "@/components/navigation/nav-wrapper";
import { ServiceWorkerNavigation } from "@/components/service-worker-navigation";
import { ToastContainer } from "@/components/toast";

export const metadata: Metadata = {
  title: "matchly",
  description: "The ultimate tournament companion",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full min-h-screen bg-gray-50" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)" }}>
      {children}
      <NavWrapper />
      <ServiceWorkerNavigation />
      <ToastContainer />
    </div>
  );
}
