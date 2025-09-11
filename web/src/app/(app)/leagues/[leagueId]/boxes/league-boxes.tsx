'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, Trophy, Target, Star, Award, Medal } from 'lucide-react';

interface Player {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  wins?: number;
  losses?: number;
  points?: number;
}

interface Box {
  id: string;
  name: string;
  level: number;
  players: Player[];
  max_players: number;
}

interface LeagueBoxesProps {
  leagueId: string;
}

export function LeagueBoxes({ leagueId }: LeagueBoxesProps) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [currentBoxIndex, setCurrentBoxIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    fetchBoxes();
  }, [leagueId]);

  const fetchBoxes = async () => {
    try {
      // For now, we'll create mock boxes since the box system isn't fully implemented yet
      // In a real implementation, this would fetch from the database
      const mockBoxes: Box[] = [
        {
          id: 'box-1',
          name: 'Championship Box',
          level: 1,
          max_players: 5,
          players: [
            { id: '1', username: 'player1', email: 'player1@test.com', full_name: 'Alex Johnson', wins: 8, losses: 2, points: 24 },
            { id: '2', username: 'player2', email: 'player2@test.com', full_name: 'Sarah Williams', wins: 7, losses: 3, points: 21 },
            { id: '3', username: 'player3', email: 'player3@test.com', full_name: 'Mike Chen', wins: 6, losses: 4, points: 18 },
            { id: '4', username: 'player4', email: 'player4@test.com', full_name: 'Emma Davis', wins: 5, losses: 5, points: 15 },
            { id: '5', username: 'player5', email: 'player5@test.com', full_name: 'James Wilson', wins: 4, losses: 6, points: 12 }
          ]
        },
        {
          id: 'box-2',
          name: 'Premier Box',
          level: 2,
          max_players: 5,
          players: [
            { id: '6', username: 'player6', email: 'player6@test.com', full_name: 'Lisa Brown', wins: 6, losses: 4, points: 18 },
            { id: '7', username: 'player7', email: 'player7@test.com', full_name: 'David Miller', wins: 5, losses: 5, points: 15 },
            { id: '8', username: 'player8', email: 'player8@test.com', full_name: 'Anna Garcia', wins: 4, losses: 6, points: 12 },
            { id: '9', username: 'player9', email: 'player9@test.com', full_name: 'Tom Anderson', wins: 3, losses: 7, points: 9 },
            { id: '10', username: 'player10', email: 'player10@test.com', full_name: 'Kate Taylor', wins: 2, losses: 8, points: 6 }
          ]
        },
        {
          id: 'box-3',
          name: 'Division 1',
          level: 3,
          max_players: 5,
          players: [
            { id: '11', username: 'player11', email: 'player11@test.com', full_name: 'Chris Martinez', wins: 4, losses: 6, points: 12 },
            { id: '12', username: 'player12', email: 'player12@test.com', full_name: 'Rachel Lee', wins: 3, losses: 7, points: 9 },
            { id: '13', username: 'player13', email: 'player13@test.com', full_name: 'Mark Thompson', wins: 2, losses: 8, points: 6 },
            { id: '14', username: 'player14', email: 'player14@test.com', full_name: 'Sophie White', wins: 1, losses: 9, points: 3 },
            { id: '15', username: 'player15', email: 'player15@test.com', full_name: 'Ben Harris', wins: 0, losses: 10, points: 0 }
          ]
        },
        {
          id: 'box-4',
          name: 'Division 2',
          level: 4,
          max_players: 5,
          players: [
            { id: '16', username: 'player16', email: 'player16@test.com', full_name: 'Olivia Clark', wins: 2, losses: 8, points: 6 },
            { id: '17', username: 'player17', email: 'player17@test.com', full_name: 'Ryan Lewis', wins: 1, losses: 9, points: 3 },
            { id: '18', username: 'player18', email: 'player18@test.com', full_name: 'Grace Walker', wins: 0, losses: 10, points: 0 },
            { id: '19', username: 'player19', email: 'player19@test.com', full_name: 'Jake Hall', wins: 0, losses: 10, points: 0 },
            { id: '20', username: 'player20', email: 'player20@test.com', full_name: 'Maya Young', wins: 0, losses: 10, points: 0 }
          ]
        }
      ];

      setBoxes(mockBoxes);
    } catch (error) {
      console.error('Error fetching boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextBox = () => {
    setCurrentBoxIndex((prev) => (prev + 1) % boxes.length);
  };

  const prevBox = () => {
    setCurrentBoxIndex((prev) => (prev - 1 + boxes.length) % boxes.length);
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextBox();
    } else if (isRightSwipe) {
      prevBox();
    }
  };

  const getBoxColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600'; // Gold - Championship
      case 2: return 'bg-gradient-to-r from-slate-300 to-slate-500'; // Silver - Premier
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600'; // Bronze - Division 1
      case 4: return 'bg-gradient-to-r from-blue-400 to-blue-600'; // Blue - Division 2
      case 5: return 'bg-gradient-to-r from-green-400 to-green-600'; // Green - Division 3
      case 6: return 'bg-gradient-to-r from-purple-400 to-purple-600'; // Purple - Division 4
      default: return 'bg-gradient-to-r from-indigo-400 to-indigo-600'; // Indigo - Default
    }
  };

  const getBoxIcon = (level: number) => {
    switch (level) {
      case 1: return <Trophy className="w-6 h-6 text-white" />; // Championship - Gold
      case 2: return <Award className="w-6 h-6 text-white" />; // Premier - Silver
      case 3: return <Medal className="w-6 h-6 text-white" />; // Division 1 - Bronze
      case 4: return <Star className="w-6 h-6 text-white" />; // Division 2 - Blue
      default: return <Users className="w-6 h-6 text-white" />; // Default
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (boxes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No boxes found</h3>
        <p className="text-gray-600">The league hasn't been started yet or boxes haven't been created.</p>
      </div>
    );
  }

  const currentBox = boxes[currentBoxIndex];

  return (
    <div className="space-y-6">
      {/* Box Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevBox}
          className="p-2 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex space-x-2">
          {boxes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBoxIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentBoxIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={nextBox}
          className="p-2 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Current Box Display */}
      <div 
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Box Header */}
        <div className={`${getBoxColor(currentBox.level)} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getBoxIcon(currentBox.level)}
              <div>
                <h2 className="text-xl font-bold text-white">{currentBox.name}</h2>
                <p className="text-white/80 text-sm">Level {currentBox.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Players</p>
              <p className="text-2xl font-bold text-white">{currentBox.players.length}/{currentBox.max_players}</p>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="p-6">
          <div className="space-y-3">
            {currentBox.players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{player.full_name || player.username}</h3>
                    <p className="text-sm text-gray-500">@{player.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">Wins</p>
                    <p className="font-semibold text-green-600">{player.wins || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Losses</p>
                    <p className="font-semibold text-red-600">{player.losses || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Points</p>
                    <p className="font-semibold text-blue-600">{player.points || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Box Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Box {currentBoxIndex + 1} of {boxes.length}</span>
          <span>Swipe or use arrows to navigate</span>
        </div>
      </div>
    </div>
  );
}
