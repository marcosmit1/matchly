import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/contexts/modal-context";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Matchly",
  description: "The ultimate sport companion",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="msapplication-navbutton-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Matchly" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
        <link rel="shortcut icon" href="/app-logo.png" />
      </head>
      <body
        className={`${geist.className} bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50`}
        style={{
          minHeight: "100dvh",
        }}
      >
        <ModalProvider>
          <main className="app-content">{children}</main>
        </ModalProvider>
      </body>
    </html>
  );
}
