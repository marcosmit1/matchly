import type { Metadata } from "next";

import "../globals.css";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { NavWrapper } from "@/components/navigation/nav-wrapper";
import { ServiceWorkerNavigation } from "@/components/service-worker-navigation";
import { ToastContainer } from "@/components/toast";

export const metadata: Metadata = {
  title: "matchly",
  description: "The ultimate sport companion",
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
    <div className="w-full h-screen bg-gray-50 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Fixed Header Area */}
      <div className="flex-shrink-0">
        {/* Content will be in a scrollable container */}
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 scrollable-content" style={{ paddingBottom: "80px" }}>
        {children}
      </div>
      
      {/* Fixed Navigation */}
      <div className="flex-shrink-0">
        <NavWrapper />
      </div>
      
      <ServiceWorkerNavigation />
      <ToastContainer />
    </div>
  );
}
