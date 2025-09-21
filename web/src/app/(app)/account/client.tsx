"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
const PushNotificationSettings = dynamic(
  () => import("@/components/push-notification-settings").then((mod) => ({ default: mod.PUSH_NOTIFICATION_SETTINGS })),
  { ssr: false }
);

export const Client = ({ initialUsername = "" }: { initialUsername?: string }) => {
  const [username, setUsername] = useState(initialUsername);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'taken' | 'invalid' | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isSigningOut, startLogout] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setUsername(initialUsername);
  }, [initialUsername]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setAvailabilityStatus('invalid');
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const response = await fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      setAvailabilityStatus(data.available ? 'available' : 'taken');
    } catch (error) {
      console.error('Error checking username:', error);
      setAvailabilityStatus(null);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setAvailabilityStatus(null);
    
    if (newUsername.length >= 3) {
      const timeoutId = setTimeout(() => checkUsernameAvailability(newUsername), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSave = () => {
    if (availabilityStatus !== 'available') return;
    
    startSave(async () => {
      try {
        const response = await fetch('/api/update-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        
        if (response.ok) {
          setMsg('Username updated successfully!');
          setTimeout(() => setMsg(null), 3000);
        } else {
          setMsg('Failed to update username');
          setTimeout(() => setMsg(null), 3000);
        }
      } catch (error) {
        console.error('Error updating username:', error);
        setMsg('Failed to update username');
        setTimeout(() => setMsg(null), 3000);
      }
    });
  };

  const handleSignOut = () => {
    startLogout(async () => {
      try {
        const { createClient } = await import('@/supabase/client');
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/login";
      } catch (error) {
        console.error('Error signing out:', error);
      }
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Settings</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {username.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
                <p className="text-gray-600">Update your username</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-md ${
                      availabilityStatus === 'available' 
                        ? 'border-green-500 bg-green-50/50' 
                        : availabilityStatus === 'taken' 
                        ? 'border-red-500 bg-red-50/50' 
                        : 'border-gray-300 bg-white/50'
                    }`}
                    placeholder="Enter your username"
                  />
                  {isCheckingAvailability && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {availabilityStatus === 'available' && (
                  <p className="text-green-600 text-sm mt-1">✓ Username is available</p>
                )}
                {availabilityStatus === 'taken' && (
                  <p className="text-red-600 text-sm mt-1">✗ Username is already taken</p>
                )}
                {availabilityStatus === 'invalid' && (
                  <p className="text-yellow-600 text-sm mt-1">Username must be at least 3 characters</p>
                )}
              </div>

              {msg && (
                <div className={`p-3 rounded-2xl text-sm ${
                  msg.includes('successfully') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {msg}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={availabilityStatus !== 'available' || isSaving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none transition-all duration-300"
              >
                {isSaving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🔔</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                <p className="text-gray-600">Manage your notification preferences</p>
              </div>
            </div>
            <PushNotificationSettings user={{ id: "current-user-id" }} />
          </div>
        </div>

        {/* Account Actions Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">⚙️</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Account</h2>
                <p className="text-gray-600">Manage your account settings</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isSigningOut ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Signing Out...
                  </>
                ) : (
                  <>
                    <span>🚪</span>
                    Sign Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Matchly v1.0</p>
          <p className="mt-1">Tournament management made simple</p>
        </div>
      </div>
    </main>
  );
};