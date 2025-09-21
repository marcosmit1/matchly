"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Plus, Target, Users, Calendar, MapPin, Clock, Star, Trophy } from "lucide-react";
import { Button } from "@/blocks/button";
import Link from "next/link";

interface UserStats {
  player_id: string;
  matches_played: number;
  matches_won: number;
  games_won: number;
  games_lost: number;
  points_won: number;
  points_lost: number;
  win_rate: number;
  skill_level: number;
  last_match_at: string | null;
}

interface PlaytomicHomeProps {
  username: string;
  userStats: UserStats | null;
  timeString: string;
  dateString: string;
}

interface RecentActivity {
  id: string;
  name: string;
  type: 'league' | 'tournament';
  status: string;
  created_at: string;
  sport: string;
}

export function PlaytomicHome({ username, userStats, timeString, dateString }: PlaytomicHomeProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'circles'>('all');
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const skillLevel = userStats?.skill_level || 1.1;
  const winRate = userStats?.win_rate || 0;
  const matchesPlayed = userStats?.matches_played || 0;

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Fetch user's leagues and tournaments
      const [leaguesResponse, tournamentsResponse] = await Promise.all([
        fetch('/api/leagues'),
        fetch('/api/tournaments')
      ]);

      const leaguesData = await leaguesResponse.json();
      const tournamentsData = await tournamentsResponse.json();

      const leagues = (leaguesData.leagues || []).map((league: any) => ({
        id: league.id,
        name: league.name,
        type: 'league' as const,
        status: league.status,
        created_at: league.created_at,
        sport: league.sport
      }));

      const tournaments = (tournamentsData.tournaments || []).map((tournament: any) => ({
        id: tournament.id,
        name: tournament.name,
        type: 'tournament' as const,
        status: tournament.status,
        created_at: tournament.created_at,
        sport: tournament.sport
      }));

      // Combine and sort by creation date
      const allActivity = [...leagues, ...tournaments]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5); // Show only 5 most recent

      setRecentActivity(allActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 py-4 shadow-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center p-2 border border-white/30">
              <img 
                src="/app-logo.png" 
                alt="Matchly" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Matchly</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-md border border-white/20">
              <Search className="w-5 h-5 text-gray-700" />
            </div>
            <div className="relative p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-md border border-white/20">
              <Bell className="w-5 h-5 text-gray-700" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">20</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 relative z-10">
        {/* Welcome Section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {username}</h2>
            <p className="text-gray-600 text-lg">{timeString} • {dateString}</p>
          </div>
        </div>

        {/* Main Actions - Consolidated */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 text-center">What would you like to do?</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <Link href="/leagues">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 rounded-3xl"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Browse Leagues</h4>
                    <p className="text-sm text-gray-600">Join existing leagues or view your current ones</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/create-league">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10 rounded-3xl"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Create League</h4>
                    <p className="text-sm text-gray-600">Start a new league with friends or colleagues</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/create-tournament">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-3xl"></div>
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Create Tournament</h4>
                    <p className="text-sm text-gray-600">Organize a competitive tournament event</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        {userStats && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{matchesPlayed}</div>
                <div className="text-sm text-gray-600">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{winRate.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{skillLevel}</div>
                <div className="text-sm text-gray-600">Skill Level</div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {loadingActivity ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No recent activity</p>
              <p className="text-sm text-gray-500 mt-1">Create a league or tournament to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <Link key={`${activity.type}-${activity.id}`} href={`/${activity.type}s/${activity.id}`}>
                  <div className="flex items-center justify-between p-5 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-white/80 transition-all duration-300 border border-white/20 shadow-sm hover:shadow-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {activity.type === 'league' ? (
                          <Trophy className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Target className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.name}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {activity.sport} {activity.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'open' ? 'bg-green-100 text-green-800' :
                        activity.status === 'started' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
