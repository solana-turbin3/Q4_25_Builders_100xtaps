'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSessionWallet } from '@magicblock-labs/gum-react-sdk';
import { SessionInfo } from '@/lib/types';
import { SESSION_DURATIONS } from '@/lib/constants';
import { BETTING_PROGRAM_ID } from './useBettingProgram';

export const useSessionManager = () => {
  const sessionWallet = useSessionWallet();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('betting_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          setSessionInfo(parsed);
          console.log('Loaded existing session, expires:', new Date(parsed.expiresAt));
        } else {
          console.log('Session expired, removing');
          localStorage.removeItem('betting_session');
        }
      } catch (error) {
        console.error('Error loading session:', error);
        localStorage.removeItem('betting_session');
      }
    }
  }, []);

  // Watch for sessionWallet changes and sync state
  useEffect(() => {
    if (sessionWallet?.sessionToken && sessionWallet?.publicKey) {
      console.log('SessionWallet detected:', {
        token: sessionWallet.sessionToken,
        publicKey: sessionWallet.publicKey.toString()
      });

      // Check if we already have this session stored
      const stored = localStorage.getItem('betting_session');
      if (!stored || !sessionInfo) {
        // Create a new session info from the wallet
        const durationKey = '2h'; // Default duration
        const expiresAt = Date.now() + SESSION_DURATIONS[durationKey];
        
        const info: SessionInfo = {
          sessionToken: sessionWallet.sessionToken,
          publicKey: sessionWallet.publicKey.toString(),
          expiresAt,
        };
        
        setSessionInfo(info);
        localStorage.setItem('betting_session', JSON.stringify(info));
        console.log('Session synced from wallet:', info);
      }
    }
  }, [sessionWallet?.sessionToken, sessionWallet?.publicKey]);

  const createSession = useCallback(
    async (durationKey: keyof typeof SESSION_DURATIONS = '2h') => {
      if (!sessionWallet?.createSession) {
        setSessionError('Session wallet not initialized');
        return false;
      }

      setIsCreatingSession(true);
      setSessionError(null);

      try {
        console.log('Creating session with duration:', durationKey);
        
        // SESSION_DURATIONS is in milliseconds, convert to MINUTES for the SDK
        const durationInMinutes = SESSION_DURATIONS[durationKey] / (1000 * 60);
        
        console.log('Duration in minutes:', durationInMinutes);
        console.log('Full createdSession object will be logged...');
        
        const createdSession = await sessionWallet.createSession(
          BETTING_PROGRAM_ID,
          // 0.01 * 1e9, // 0.01 SOL top-up
          // durationInMinutes // 
        );

        // Log the FULL response to see its structure
        console.log('Full session response:', JSON.stringify(createdSession, null, 2));
        console.log('Session keys:', Object.keys(createdSession));

        // Try multiple possible property names
        const token = createdSession.sessionToken || 
                     createdSession.token || 
                     (createdSession as any).session_token;
        
        const pubKey = createdSession.publicKey || 
                      (createdSession as any).public_key ||
                      (createdSession as any).pubkey;

        console.log('Extracted token:', token);
        console.log('Extracted publicKey:', pubKey);

        if (token || pubKey) {
          // Calculate expiry time from now
          const expiresAt = Date.now() + SESSION_DURATIONS[durationKey];
          
          const info: SessionInfo = {
            sessionToken: token?.toString() || '',
            publicKey: pubKey?.toString() || '',
            expiresAt,
          };
          
          setSessionInfo(info);
          localStorage.setItem('betting_session', JSON.stringify(info));
          console.log('Session saved, expires at:', new Date(expiresAt));
          
          setIsCreatingSession(false);
          return true;
        } else {
          // Even if we don't get the properties, the session might be created
          // Check if sessionWallet now has the token
          if (sessionWallet.sessionToken) {
            console.log('Session created but using wallet state');
            const expiresAt = Date.now() + SESSION_DURATIONS[durationKey];
            
            const info: SessionInfo = {
              sessionToken: sessionWallet.sessionToken,
              publicKey: sessionWallet.publicKey?.toString() || '',
              expiresAt,
            };
            
            setSessionInfo(info);
            localStorage.setItem('betting_session', JSON.stringify(info));
            console.log('Session saved from wallet state');
            
            setIsCreatingSession(false);
            return true;
          }
          
          throw new Error('Session creation returned invalid response: ' + JSON.stringify(createdSession));
        }
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
    if (!sessionWallet?.revokeSession) return;

    try {
      await sessionWallet.revokeSession();
      setSessionInfo(null);
      localStorage.removeItem('betting_session');
      console.log('Session revoked');
    } catch (error) {
      console.error('Error revoking session:', error);
      setSessionError(
        error instanceof Error ? error.message : 'Failed to revoke session'
      );
    }
  }, [sessionWallet]);

  const isSessionActive = useCallback(() => {
    if (!sessionInfo) {
      return false;
    }
    const isActive = sessionInfo.expiresAt > Date.now();
    const timeLeft = sessionInfo.expiresAt - Date.now();
    console.log('Session active check:', isActive, 'time left (minutes):', Math.floor(timeLeft / (1000 * 60)));
    return isActive;
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