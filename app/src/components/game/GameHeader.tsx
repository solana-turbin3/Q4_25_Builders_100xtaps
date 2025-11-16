'use client';

import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { ConnectWalletButton } from '@/components/ui/ConnectWalletButton';
import { formatPrice } from '@/lib/utils';

export const GameHeader: React.FC = () => {
  const { balance, currentPrice, activeBets } = useGame();

  const pendingBets = activeBets.filter((b) => b.status === 'pending').length;

  return (
    <div className="p-3 sm:p-4 bg-black/40 backdrop-blur-sm flex justify-between items-center border-b border-purple-500/30 gap-4 flex-wrap">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-xl sm:text-3xl font-bold">100xTap</div>
        <div className="flex items-center gap-1 sm:gap-2 bg-gray-800/60 px-2 sm:px-3 py-1 rounded-full">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
          <span className="text-base sm:text-xl font-bold text-green-400">
            ${balance.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-4 items-center">
        <div className="flex gap-2 sm:gap-4 items-center text-xs sm:text-base">
          <div>
            <div className="text-[10px] sm:text-xs text-gray-400">Price</div>
            <div className="text-sm sm:text-xl font-mono font-bold">
              {formatPrice(currentPrice)}
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs text-gray-400">Bets</div>
            <div className="text-sm sm:text-xl font-bold text-blue-400">
              {pendingBets}
            </div>
          </div>
        </div>

        <ConnectWalletButton />
      </div>
    </div>
  );
};