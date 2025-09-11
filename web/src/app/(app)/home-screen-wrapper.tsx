"use client";

import { useEffect } from "react";

export default function HomeScreenWrapper({ children }: { children: React.ReactNode }) {
  // Prevent scrolling on home screen
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    const preventTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) return; // Allow pinch zoom
      e.preventDefault();
    };
    
    // Apply scroll prevention to body
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    window.addEventListener('scroll', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventTouch, { passive: false });
    window.addEventListener('wheel', preventDefault, { passive: false });
    
    return () => {
      // Restore original body styles
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      
      window.removeEventListener('scroll', preventDefault);
      window.removeEventListener('touchmove', preventTouch);
      window.removeEventListener('wheel', preventDefault);
    };
  }, []);

  return (
    <main className="absolute-no-scroll px-4 py-6">
      {children}
    </main>
  );
}
