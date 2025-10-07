"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/contexts/modal-context";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trophy,
  AlertTriangle,
  Target,
  Zap,
  Check
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/blocks/button";
import type { GolfTournament, GolfPenaltyType } from "@/types/golf";

interface GolfScorecardProps {
  tournament: GolfTournament;
  participant: any;
  holes: any[];
  existingScores: any[];
}

export function GolfScorecard({ tournament, participant, holes, existingScores }: GolfScorecardProps) {
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError, showConfirm } = useModal();

  useEffect(() => {
    // Load existing scores
    const scoreMap: Record<number, number> = {};
    existingScores.forEach(score => {
      scoreMap[score.hole_number] = score.strokes;
    });
    setScores(scoreMap);

    // Find first hole without a score
    const firstIncomplete = holes.find(hole => !scoreMap[hole.hole_number]);
    if (firstIncomplete) {
      setCurrentHole(firstIncomplete.hole_number);
    }
  }, [existingScores, holes]);

  const hole = holes.find(h => h.hole_number === currentHole);
  const currentScore = scores[currentHole] || 0;
  const vsPar = currentScore ? currentScore - hole.par : 0;

  const getScoreColor = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff <= -2) return 'text-purple-600'; // Eagle or better
    if (diff === -1) return 'text-green-600'; // Birdie
    if (diff === 0) return 'text-blue-600'; // Par
    if (diff === 1) return 'text-orange-600'; // Bogey
    return 'text-red-600'; // Double bogey or worse
  };

  const getScoreLabel = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff <= -3) return '🦅 Albatross';
    if (diff === -2) return '🦅 Eagle';
    if (diff === -1) return '🐦 Birdie';
    if (diff === 0) return '✓ Par';
    if (diff === 1) return '⚠️ Bogey';
    if (diff === 2) return '❌ Double';
    return `❌ +${diff}`;
  };

  const handleScoreChange = (strokes: number) => {
    setScores(prev => ({ ...prev, [currentHole]: strokes }));
  };

  const handleSaveScore = async () => {
    if (!currentScore || currentScore === 0) {
      showError("Please enter a score for this hole");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participant.id,
          hole_number: currentHole,
          strokes: currentScore,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save score');
      }

      showSuccess(`Hole ${currentHole} score saved!`);

      // Move to next hole if not the last
      if (currentHole < holes.length) {
        setCurrentHole(currentHole + 1);
      }
    } catch (error: any) {
      showError(error.message || "Failed to save score");
    } finally {
      setSaving(false);
    }
  };

  const handleReportPenalty = async (penaltyType: GolfPenaltyType) => {
    const confirmed = await showConfirm(
      `Report ${penaltyType} penalty on hole ${currentHole}?`,
      "Report Penalty?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/golf-tournaments/${tournament.id}/penalties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participant.id,
          hole_number: currentHole,
          penalty_type: penaltyType,
          strokes_added: 1,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to report penalty');
      }

      showSuccess("Penalty reported!");
    } catch (error: any) {
      showError(error.message || "Failed to report penalty");
    }
  };

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const completedHoles = Object.keys(scores).length;
  const totalPar = holes.slice(0, completedHoles).reduce((sum, h) => sum + h.par, 0);
  const totalVsPar = totalScore - totalPar;

  return (
    <div className="min-h-screen w-screen bg-gray-50 fixed inset-0 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white px-4 py-4 sticky top-0 z-10">
        <Link href={`/golf/${tournament.id}`} className="inline-flex items-center text-white/90 hover:text-white mb-3">
          <ArrowLeft size={18} className="mr-2" />
          Back to Tournament
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{participant.player_name}</h1>
            <div className="text-sm text-white/90">Fourball #{participant.fourball_number}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completedHoles}/{holes.length}</div>
            <div className="text-xs text-white/90">holes completed</div>
          </div>
        </div>

        {completedHoles > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-sm">
            <span>Total Score: {totalScore}</span>
            <span className={totalVsPar === 0 ? 'text-white' : totalVsPar < 0 ? 'text-green-200' : 'text-red-200'}>
              {totalVsPar > 0 ? '+' : ''}{totalVsPar} vs Par
            </span>
          </div>
        )}
      </div>

      {/* Hole Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setCurrentHole(Math.max(1, currentHole - 1))}
          disabled={currentHole === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">Hole {currentHole}</div>
          <div className="text-sm text-gray-500">Par {hole.par}</div>
        </div>

        <button
          onClick={() => setCurrentHole(Math.min(holes.length, currentHole + 1))}
          disabled={currentHole === holes.length}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Quick Score Buttons */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="text-xs text-gray-500 mb-2">Quick Score</div>
        <div className="grid grid-cols-4 gap-2">
          {[-2, -1, 0, 1].map((diff) => {
            const strokes = hole.par + diff;
            const isSelected = currentScore === strokes;
            return (
              <button
                key={diff}
                onClick={() => handleScoreChange(strokes)}
                className={`px-3 py-2 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-lg">{strokes}</div>
                <div className="text-xs opacity-80">
                  {diff === -2 ? 'Eagle' : diff === -1 ? 'Birdie' : diff === 0 ? 'Par' : 'Bogey'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Score Entry */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="text-xs text-gray-500 mb-2">Manual Entry</div>
        <div className="grid grid-cols-9 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((strokes) => {
            const isSelected = currentScore === strokes;
            return (
              <button
                key={strokes}
                onClick={() => handleScoreChange(strokes)}
                className={`aspect-square rounded-lg font-semibold text-lg transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {strokes}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Score Display */}
      {currentScore > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(currentScore, hole.par)}`}>
              {currentScore}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {getScoreLabel(currentScore, hole.par)}
            </div>
            {vsPar !== 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {vsPar > 0 ? '+' : ''}{vsPar} vs Par
              </div>
            )}
          </div>
        </div>
      )}

      {/* Penalties Section */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="text-xs text-gray-500 mb-2">Report Penalty (Optional)</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleReportPenalty('water')}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            💦 Water
          </button>
          <button
            onClick={() => handleReportPenalty('ob')}
            className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
          >
            🌲 OB
          </button>
          <button
            onClick={() => handleReportPenalty('bunker')}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors"
          >
            🏖️ Bunker
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={() => handleReportPenalty('3_putt')}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            ⛳ 3-Putt
          </button>
          <button
            onClick={() => handleReportPenalty('lost_ball')}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            🔍 Lost Ball
          </button>
          <button
            onClick={() => handleReportPenalty('other')}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            ⚠️ Other
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4">
        <Button
          onClick={handleSaveScore}
          disabled={!currentScore || saving}
          className="w-full"
          variant="default"
        >
          {saving ? (
            'Saving...'
          ) : (
            <>
              <Check size={18} className="mr-2" />
              Save Hole {currentHole} Score
            </>
          )}
        </Button>

        {currentScore > 0 && (
          <div className="mt-2 text-center">
            <button
              onClick={() => handleScoreChange(0)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Score
            </button>
          </div>
        )}
      </div>

      {/* Scorecard Overview */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="font-semibold text-gray-900 mb-3">Scorecard</div>
          <div className="grid grid-cols-9 gap-1 text-xs">
            {holes.slice(0, 9).map((h) => {
              const score = scores[h.hole_number];
              return (
                <div
                  key={h.hole_number}
                  onClick={() => setCurrentHole(h.hole_number)}
                  className={`aspect-square flex flex-col items-center justify-center rounded cursor-pointer ${
                    h.hole_number === currentHole
                      ? 'bg-blue-600 text-white'
                      : score
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <div className="font-semibold">{h.hole_number}</div>
                  {score && <div className="text-xs">{score}</div>}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-9 gap-1 text-xs mt-1">
            {holes.slice(9, 18).map((h) => {
              const score = scores[h.hole_number];
              return (
                <div
                  key={h.hole_number}
                  onClick={() => setCurrentHole(h.hole_number)}
                  className={`aspect-square flex flex-col items-center justify-center rounded cursor-pointer ${
                    h.hole_number === currentHole
                      ? 'bg-blue-600 text-white'
                      : score
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <div className="font-semibold">{h.hole_number}</div>
                  {score && <div className="text-xs">{score}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard Link */}
      <div className="px-4 pb-8">
        <Link href={`/golf/${tournament.id}/leaderboard`}>
          <Button className="w-full" variant="outline">
            <Trophy size={18} className="mr-2" />
            View Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
