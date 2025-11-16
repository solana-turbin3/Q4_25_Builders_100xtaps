'use client';

import React from 'react';
import { GameHeader } from '@/components/game/GameHeader';
import { GameCanvas } from '@/components/game/GameCanvas';
import { ActiveBets } from '@/components/game/ActiveBets';
import { Navigation } from '@/components/ui/Navigation';
import { usePriceWebSocket } from '@/hooks/usePriceWebSocket';
import { useGameState } from '@/hooks/useGameState';

export default function HomePage() {
  const { isConnected } = usePriceWebSocket();
  useGameState();

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white flex flex-col overflow-hidden">
      <GameHeader />
      <GameCanvas />
      <ActiveBets />
      <Navigation />

      {!isConnected && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-900/90 border border-red-500 px-4 py-2 rounded-lg text-sm z-50">
          ⚠️ Connecting to price feed...
        </div>
      )}
    </div>
  );
}