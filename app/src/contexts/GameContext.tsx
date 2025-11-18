'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback , useEffect} from 'react';
import { GameState, Bet, Collision } from '@/lib/types';
import { INITIAL_BALANCE, INITIAL_PRICE } from '@/lib/constants';
import { useBetting } from '@/hooks/useBetting';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';


interface GameContextType extends GameState {
  setBalance: (balance: number | ((prev: number) => number)) => void;
  setCurrentPrice: (price: number) => void;
  setCurrentTime: (time: number) => void;
  addPricePoint: (time: number, price: number) => void;
  addBet: (bet: Bet) => void;
  updateBets: (updater: (bets: Bet[]) => Bet[]) => void;
  addCollision: (collision: Collision) => void;
  addVanishingBet: (bet: Bet) => void;
  clearOldCollisions: () => void;
  clearOldVanishingBets: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [currentPrice, setCurrentPrice] = useState(INITIAL_PRICE);
  const [currentTime, setCurrentTime] = useState(0);
  const [priceHistory, setPriceHistory] = useState<GameState['priceHistory']>([]);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [collisions, setCollisions] = useState<Collision[]>([]);
  const [vanishingBets, setVanishingBets] = useState<Bet[]>([]);

  const { createBetOnChain, proxyAccount } = useBetting();


  useEffect(() => {
    if (proxyAccount) {
      const solBalance = proxyAccount.balance / LAMPORTS_PER_SOL;
      // Convert SOL to game dollars (you can adjust this rate)
      const gameBalance = solBalance * 100; // 1 SOL = $100 in game
      setBalance(gameBalance);
    }
  }, [proxyAccount]);


  const addPricePoint = useCallback((time: number, price: number) => {
    setPriceHistory((prev) => {
      const newHistory = [...prev, { time, price }];
      return newHistory.filter((p) => p.time >= time - 60);
    });
  }, []);


    const addBet = useCallback(
    (bet: Bet) => {
      setActiveBets((prev) => [...prev, bet]);

      console.log('Adding bet:', bet);



      // Fire and forget - don't wait for blockchain confirmation
      createBetOnChain(bet).then((success) => {
        if (success) {
          console.log('Bet successfully created on-chain');
        } else {
          console.log('Failed to create bet on-chain, but continuing locally');
        }
      }).catch((error) => {
        console.error('Error in createBetOnChain:', error);
      });
    },
    [createBetOnChain]
  );

  

  const updateBets = useCallback((updater: (bets: Bet[]) => Bet[]) => {
    setActiveBets(updater);
  }, []);

  const addCollision = useCallback((collision: Collision) => {
    setCollisions((prev) => [...prev, collision]);
  }, []);

  const addVanishingBet = useCallback((bet: Bet) => {
    setVanishingBets((prev) => [...prev, { ...bet, timestamp: Date.now() }]);
  }, []);

  const clearOldCollisions = useCallback(() => {
    setCollisions((prev) =>
      prev.filter((col) => Date.now() - col.timestamp < 2000)
    );
  }, []);

  const clearOldVanishingBets = useCallback(() => {
    setVanishingBets((prev) =>
      prev.filter((vb) => Date.now() - (vb as any).timestamp < 2000)
    );
  }, []);

  return (
    <GameContext.Provider
      value={{
        balance,
        currentPrice,
        currentTime,
        priceHistory,
        activeBets,
        collisions,
        vanishingBets,
        setBalance,
        setCurrentPrice,
        setCurrentTime,
        addPricePoint,
        addBet,
        updateBets,
        addCollision,
        addVanishingBet,
        clearOldCollisions,
        clearOldVanishingBets,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};