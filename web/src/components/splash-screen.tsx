"use client";

import React, { useState, useEffect, useRef } from "react";

export default function SplashScreen({ force = false }: { force?: boolean }) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const seen = typeof window !== "undefined" && sessionStorage.getItem("matchly-splash-seen") === "1";
    if (seen && !force) {
      setShow(false);
      return;
    }

    // Initial animations - now handled by CSS transitions
    const timer1 = setTimeout(() => {
      if (logoRef.current) {
        logoRef.current.classList.add('animate-pulse');
      }
    }, 100);

    const timer2 = setTimeout(() => {
      if (textRef.current) {
        textRef.current.classList.add('opacity-100', 'translate-y-0');
      }
    }, 600);

    // Hide splash and mark as seen
    const hide = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShow(false);
        try {
          sessionStorage.setItem("matchly-splash-seen", "1");
        } catch {}
      }, 300);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(hide);
    };
  }, [force]);

  if (!show) return null;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 relative overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background decorative elements - same as login */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10 text-center">
        {/* Logo with enhanced presentation */}
        <div ref={logoRef} className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl flex items-center justify-center p-6 transform transition-all duration-1000 hover:scale-105">
            <img 
              src="/app-logo.png" 
              alt="Matchly" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl blur-lg opacity-30 -z-10 animate-pulse"></div>
        </div>
        
        {/* App name with gradient text */}
        <h1 ref={textRef} className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 transform transition-all duration-1000 opacity-0 translate-y-4">
          Matchly
        </h1>
        
        {/* Loading text */}
        <p className="text-gray-600 text-lg mb-8 transform transition-all duration-1000 delay-300">
          Welcome to The ultimate sport companion
        </p>
        
        {/* Modern loading spinner */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}