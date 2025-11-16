'use client';

import React from 'react';
import { useGame } from '@/contexts/GameContext';

export const ActiveBets: React.FC = () => {
  const { activeBets } = useGame();

  return (
    <div className="p-2 sm:p-3 bg-black/40 backdrop-blur-sm border-t border-purple-500/30">
      <div className="flex gap-2 overflow-x-auto pb-1 max-h-16 sm:max-h-20">
        {activeBets
          .slice(-8)
          .reverse()
          .map((bet) => (
            <div
              key={bet.id}
              className={`text-xs p-1.5 sm:p-2 rounded-lg whitespace-nowrap shrink-0 border-2 ${
                bet.status === 'won'
                  ? 'bg-green-900/50 border-green-500'
                  : bet.status === 'lost'
                  ? 'bg-red-900/30 border-red-700'
                  : 'bg-yellow-500 text-black border-yellow-300'
              }`}
            >
              <div className="font-mono text-[9px] sm:text-[10px]">
                ${bet.startPrice.toFixed(2)}-${bet.endPrice.toFixed(2)}
              </div>
              <div className="font-bold text-[10px] sm:text-xs">
                {bet.odds.toFixed(2)}x • $10
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};