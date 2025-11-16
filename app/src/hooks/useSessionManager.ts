'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSessionWallet } from '@magicblock-labs/gum-react-sdk';
import { PublicKey } from '@solana/web3.js';
import { SessionInfo } from '@/lib/types';
import { SESSION_DURATIONS } from '@/lib/constants';

export const useSessionManager = () => {
  const sessionWallet = useSessionWallet();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('game_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          setSessionInfo(parsed);
        } else {
          localStorage.removeItem('game_session');
        }
      } catch (error) {
        console.error('Error loading session:', error);
        localStorage.removeItem('game_session');
      }
    }
  }, []);

  const createSession = useCallback(
    async (
      targetProgram: string,
      durationKey: keyof typeof SESSION_DURATIONS = '2h',
      topUpLamports: number = 0.01 * 1e9 // 0.01 SOL
    ) => {
      if (!sessionWallet) {
        setSessionError('Session wallet not initialized');
        return false;
      }

      setIsCreatingSession(true);
      setSessionError(null);

      try {
        const duration = SESSION_DURATIONS[durationKey];
        const validUntil = Math.floor(Date.now() / 1000) + duration;

        const session = await sessionWallet.createSession(
          new PublicKey(targetProgram),
          topUpLamports,
          validUntil,
          (sessionData) => {
            const info: SessionInfo = {
              sessionToken: sessionData.sessionToken,
              publicKey: sessionData.publicKey,
              expiresAt: validUntil * 1000,
            };
            setSessionInfo(info);
            localStorage.setItem('game_session', JSON.stringify(info));
          }
        );

        setIsCreatingSession(false);
        return true;
      } catch (error) {
        console.error('Error creating session:', error);
        setSessionError(
          error instanceof Error ? error.message : 'Failed to create session'
        );
        setIsCreatingSession(false);
        return false;
      }
    },
    [sessionWallet]
  );

  const revokeSession = useCallback(async () => {
    if (!sessionWallet) return;

    try {
      await sessionWallet.revokeSession();
      setSessionInfo(null);
      localStorage.removeItem('game_session');
    } catch (error) {
      console.error('Error revoking session:', error);
      setSessionError(
        error instanceof Error ? error.message : 'Failed to revoke session'
      );
    }
  }, [sessionWallet]);

  const isSessionActive = useCallback(() => {
    if (!sessionInfo) return false;
    return sessionInfo.expiresAt > Date.now();
  }, [sessionInfo]);

  return {
    sessionInfo,
    isCreatingSession,
    sessionError,
    createSession,
    revokeSession,
    isSessionActive,
    sessionWallet,
  };
};