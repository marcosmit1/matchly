'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Component that listens for navigation messages from the service worker
 * and handles deep linking within the PWA
 */
export function ServiceWorkerNavigation() {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📱 Received message from service worker:', event.data);
      
      if (event.data && event.data.type === 'NAVIGATE_TO') {
        const url = event.data.url;
        console.log('📱 PWA Navigation requested to:', url);
        console.log('📱 Current location:', window.location.href);
        
        // Add a small delay to ensure the PWA is ready
        setTimeout(() => {
          console.log('📱 Executing router.push to:', url);
          console.log('📱 Router object:', router);
          
          try {
            router.push(url);
            console.log('📱 router.push executed successfully');
            
            // Additional verification
            setTimeout(() => {
              console.log('📱 Location after navigation:', window.location.href);
            }, 500);
          } catch (error) {
            console.error('📱 Error during router.push:', error);
          }
        }, 100);
      }
    };

    // Listen for messages from the service worker
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [router]);

  return null; // This component doesn't render anything
}
