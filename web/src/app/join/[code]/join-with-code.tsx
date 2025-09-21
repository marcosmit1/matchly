"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/blocks/button";
import { Input } from "@/blocks/input";
import { Trophy, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { showToast } from "@/components/toast";

interface JoinWithCodeProps {
  inviteCode: string;
}

export function JoinWithCode({ inviteCode }: JoinWithCodeProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    type?: 'tournament' | 'league';
    data?: any;
    message?: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (inviteCode) {
      handleJoin();
    }
  }, [inviteCode]);

  const handleJoin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          type: data.type,
          data: data.data,
          message: data.message
        });
        
        showToast({ 
          type: "success", 
          title: data.message || "Successfully joined!" 
        });

        // Redirect after a short delay
        setTimeout(() => {
          if (data.type === 'tournament') {
            router.push(`/tournaments/${data.data.tournament_id}`);
          } else if (data.type === 'league') {
            router.push(`/leagues/${data.data.league_id}`);
          } else {
            router.push('/');
          }
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to join"
        });
        showToast({ 
          type: "error", 
          title: data.error || "Failed to join" 
        });
      }
    } catch (error) {
      console.error('Error joining:', error);
      setResult({
        success: false,
        message: "An unexpected error occurred"
      });
      showToast({ 
        type: "error", 
        title: "An unexpected error occurred" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Joining with Code
            </h1>
            <p className="text-gray-600">
              Code: <span className="font-mono font-semibold text-blue-600">{inviteCode}</span>
            </p>
          </div>

          {loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
              <p className="text-gray-600">Joining...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {result.success ? (
                <>
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-2">
                      Success!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {result.message}
                    </p>
                    {result.data && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>
                            {result.type === 'tournament' ? 'Tournament' : 'League'}: {result.data.tournament_name || result.data.league_name}
                          </span>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      Redirecting you now...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 mb-2">
                      Failed to Join
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {result.message}
                    </p>
                    <Button
                      onClick={() => router.push('/discover')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Go to Discover
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {!loading && !result && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Processing your invite code...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
