'use client';

import { useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { BET_AMOUNT } from '@/lib/constants';

export const useGameState = () => {
  const {
    currentTime,
    currentPrice,
    activeBets,
    updateBets,
    setBalance,
    addCollision,
    addVanishingBet,
    clearOldCollisions,
    clearOldVanishingBets,
  } = useGame();

  // Bet collision detection
  useEffect(() => {
    updateBets((prev) => {
      return prev.map((bet) => {
        if (bet.checked) return bet;

        const timeCrossedStart = currentTime >= bet.startTime;
        const timeCrossedEnd = currentTime >= bet.endTime;

        if (timeCrossedStart && !timeCrossedEnd) {
          const priceInRange =
            currentPrice >= bet.startPrice && currentPrice <= bet.endPrice;

          if (priceInRange) {
            console.log('WIN:', {
              betId: bet.id,
              currentTime: currentTime.toFixed(2),
              currentPrice: currentPrice.toFixed(4),
            });

            addCollision({
              id: Date.now() + Math.random(),
              x: currentTime,
              y: (bet.startPrice + bet.endPrice) / 2,
              won: true,
              timestamp: Date.now(),
              payout: bet.payout,
            });

            setBalance((b) => b + BET_AMOUNT + bet.payout);
            return { ...bet, status: 'won' as const, checked: true };
          }
        }

        if (timeCrossedEnd && bet.status === 'pending') {
          console.log('LOSS:', {
            betId: bet.id,
            currentTime: currentTime.toFixed(2),
          });

          addCollision({
            id: Date.now() + Math.random(),
            x: bet.endTime,
            y: (bet.startPrice + bet.endPrice) / 2,
            won: false,
            timestamp: Date.now(),
            payout: 0,
          });

          addVanishingBet(bet);
          return { ...bet, status: 'lost' as const, checked: true };
        }

        return bet;
      });
    });

    clearOldCollisions();
    clearOldVanishingBets();
  }, [
    currentTime,
    currentPrice,
    updateBets,
    setBalance,
    addCollision,
    addVanishingBet,
    clearOldCollisions,
    clearOldVanishingBets,
  ]);

  return {
    currentTime,
    currentPrice,
    activeBets,
  };
};