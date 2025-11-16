import { PublicKey } from '@solana/web3.js';

export interface Bet {
  id: string;
  startPrice: number;
  endPrice: number;
  startTime: number;
  endTime: number;
  midPrice: number;
  odds: number;
  payout: number;
  status: 'pending' | 'won' | 'lost';
  checked: boolean;
}

export interface PricePoint {
  time: number;
  price: number;
}

export interface Collision {
  id: number;
  x: number;
  y: number;
  won: boolean;
  timestamp: number;
  payout: number;
}

export interface GameState {
  balance: number;
  currentPrice: number;
  currentTime: number;
  priceHistory: PricePoint[];
  activeBets: Bet[];
  collisions: Collision[];
  vanishingBets: Bet[];
}

export interface SessionInfo {
  sessionToken: string;
  publicKey: string;
  expiresAt: number;
}