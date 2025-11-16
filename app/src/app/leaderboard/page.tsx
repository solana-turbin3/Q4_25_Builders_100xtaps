'use client';

import React from 'react';
import { Navigation } from '@/components/ui/Navigation';

export default function LeaderboardPage() {
  // Mock data - replace with real data later
  const leaderboard = [
    { rank: 1, address: '7xKX...9mPq', profit: '+$5,420', wins: 42, losses: 18 },
    { rank: 2, address: '3pQr...4nBx', profit: '+$3,890', wins: 35, losses: 22 },
    { rank: 3, address: '9kLm...2vCd', profit: '+$2,760', wins: 28, losses: 15 },
    { rank: 4, address: '5wXy...8hTn', profit: '+$1,990', wins: 24, losses: 19 },
    { rank: 5, address: '2bFg...6jKm', profit: '+$1,450', wins: 21, losses: 17 },
  ];

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white flex flex-col overflow-hidden">
      <div className="p-4 bg-black/40 backdrop-blur-sm border-b border-purple-500/30">
        <h1 className="text-3xl font-bold">🏆 Leaderboard</h1>
        <p className="text-gray-400 text-sm">Top traders of all time</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {leaderboard.map((player) => (
            <div
              key={player.rank}
              className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-xl p-4 flex items-center gap-4 hover:border-purple-400/50 transition"
            >
              <div
                className={`text-3xl font-bold w-12 text-center ${
                  player.rank === 1
                    ? 'text-yellow-400'
                    : player.rank === 2
                    ? 'text-gray-300'
                    : player.rank === 3
                    ? 'text-orange-400'
                    : 'text-gray-500'
                }`}
              >
                #{player.rank}
              </div>

              <div className="flex-1">
                <div className="font-mono text-lg">{player.address}</div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>✅ {player.wins} wins</span>
                  <span>❌ {player.losses} losses</span>
                  <span>
                    📊{' '}
                    {((player.wins / (player.wins + player.losses)) * 100).toFixed(
                      1
                    )}
                    % win rate
                  </span>
                </div>
              </div>

              <div className="text-2xl font-bold text-green-400">
                {player.profit}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-gray-500 mt-8">
          <p>Leaderboard updates every 24 hours</p>
        </div>
      </div>

      <Navigation />
    </div>
  );
}