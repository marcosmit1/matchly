"use client";

import { useState } from "react";
import { Search, Bell, Plus, Target, Users, Calendar, MapPin, Clock, Star, Trophy } from "lucide-react";
import { Button } from "@/blocks/button";
import Link from "next/link";

interface UserStats {
  matches_played: number;
  matches_won: number;
  games_won: number;
  games_lost: number;
  points_won: number;
  points_lost: number;
  win_rate: number;
  skill_level: number;
}

interface PlaytomicHomeProps {
  username: string;
  userStats: UserStats | null;
  timeString: string;
  dateString: string;
}

export function PlaytomicHome({ username, userStats, timeString, dateString }: PlaytomicHomeProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'circles'>('all');

  const skillLevel = userStats?.skill_level || 1.1;
  const winRate = userStats?.win_rate || 0;
  const matchesPlayed = userStats?.matches_played || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Matchly</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-600" />
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">20</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {username}</h2>
          <p className="text-gray-600 text-sm">{timeString} • {dateString}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/leagues">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Browse Leagues</span>
            </Button>
          </Link>
          <Link href="/create-league">
            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl py-4 flex items-center justify-center space-x-2">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create League</span>
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        {userStats && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
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
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No recent matches</p>
            <p className="text-sm text-gray-500 mt-1">Start playing to see your activity here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
