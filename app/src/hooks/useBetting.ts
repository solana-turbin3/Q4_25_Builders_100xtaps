'use client';

import { useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useBettingProgram } from './useBettingProgram';
import { useProxyAccount } from './useProxyAccount';
import { useSessionManager } from './useSessionManager';
import { Bet } from '@/lib/types';
import { useWallet } from '@solana/wallet-adapter-react';

const LAMPORTS_PER_SOL = 1000000000;

export const useBetting = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { program, proxyAccountPDA } = useBettingProgram();
  const { proxyAccount, refetch: refetchProxy } = useProxyAccount();
  const { sessionWallet, isSessionActive } = useSessionManager();
  const { publicKey, signTransaction } = useWallet();

  const [marketPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("market")],
    program.programId
  );

  const checkMarket = useCallback(async () => {
    if (!program || !marketPDA) return false;
    
    try {
      const market = await program.account.market.fetch(marketPDA);
      console.log('Market found:', market);
      return true;
    } catch (error) {
      console.log('Market not found');
      return false;
    }
  }, [program, marketPDA]);

  // ✅ Fund session wallet if needed
  const ensureSessionFunded = useCallback(async () => {
    if (!publicKey || !sessionWallet?.publicKey || !connection || !signTransaction) {
      throw new Error('Wallet not initialized');
    }

    try {
      // Check session wallet balance
      const balance = await connection.getBalance(sessionWallet.publicKey);
      console.log('Session wallet balance:', balance / LAMPORTS_PER_SOL, 'SOL');

      // If balance is less than 0.005 SOL, fund it
      if (balance < 0.005 * LAMPORTS_PER_SOL) {
        console.log('Funding session wallet with 0.01 SOL...');
        
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: sessionWallet.publicKey,
            lamports: 0.01 * LAMPORTS_PER_SOL,
          })
        );

        const { blockhash } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signed = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(signature, 'confirmed');
        
        console.log('✅ Session wallet funded:', signature);
        
        // Wait a bit for balance to update
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('✅ Session wallet already has sufficient balance');
      }
      
      return true;
    } catch (error) {
      console.error('Error funding session wallet:', error);
      throw error;
    }
  }, [publicKey, sessionWallet, connection, signTransaction]);

  const createBetOnChain = useCallback(
  async (bet: Bet): Promise<boolean> => {
    if (!program || !proxyAccountPDA || !publicKey) {
      console.error('Program or wallet not initialized');
      return false;
    }

    const marketExists = await checkMarket();
    if (!marketExists) {
      console.error('Market not initialized. Please initialize market first.');
      throw new Error('Market not initialized');
    }

    try {
      const useSession = isSessionActive() && sessionWallet?.publicKey && sessionWallet?.sessionToken;

      if (!useSession || !sessionWallet) {
        throw new Error('Session not active. Please create a session first.');
      }

      // ✅ Ensure session wallet is funded
      await ensureSessionFunded();

      const timestamp = Date.now();
      const odds = Math.floor(bet.odds * 100);
      
      // ✅ FIX: Calculate proper expiry time
      // If bet.endTime is already in milliseconds, convert to seconds
      // If bet.endTime is in seconds, use it directly
      let expiryTime;
      if (bet.endTime > 10000000000) {
        // It's in milliseconds (13 digits), convert to seconds
        expiryTime = Math.floor(bet.endTime / 1000);
      } else {
        // It's already in seconds (10 digits)
        expiryTime = bet.endTime;
      }
      
      // ✅ IMPORTANT: Ensure expiry is in the future
      const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
      if (expiryTime <= currentTimestamp) {
        // If it's in the past, set it to 60 seconds from now
        expiryTime = currentTimestamp + 60;
        console.warn('Bet endTime was in the past, setting to 60 seconds from now');
      }
      
      const betAmount = 0.1 * LAMPORTS_PER_SOL;

      const [betPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bet"),
          publicKey.toBuffer(),
          Buffer.from(new anchor.BN(timestamp).toArray("le", 8)),
        ],
        program.programId
      );

      console.log('Creating bet on-chain:', {
        betPDA: betPDA.toString(),
        timestamp,
        odds,
        expiryTime,
        expiryDate: new Date(expiryTime * 1000).toISOString(), // ✅ Log human-readable date
        currentTime: currentTimestamp,
        currentDate: new Date(currentTimestamp * 1000).toISOString(),
        betAmount,
        mainWallet: publicKey.toString(),
        sessionWallet: sessionWallet.publicKey.toString(),
      });

      // ✅ Build instruction
      const ix = await program.methods
        .createBet(
          new anchor.BN(timestamp),
          new anchor.BN(odds),
          new anchor.BN(expiryTime), // ✅ Now in correct format (seconds, future)
          new anchor.BN(betAmount)
        )
        .accounts({
          bet: betPDA,
          proxyAccount: proxyAccountPDA,
          market: marketPDA,
          sessionToken: sessionWallet.sessionToken,
          signer: sessionWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const transaction = new Transaction().add(ix);
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = sessionWallet.publicKey;

      console.log('Transaction fee payer (session):', sessionWallet.publicKey.toString());

      if (!sessionWallet.signTransaction) {
        throw new Error('Session wallet does not support signing');
      }

      const signed = await sessionWallet.signTransaction(transaction);
      console.log('Session signed transaction');

      const signature = await connection.sendRawTransaction(
        signed.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );
      
      console.log('✅ Bet transaction sent:', signature);
      
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✅ Bet confirmed!');
      await refetchProxy();
      
      return true;

    } catch (error) {
      console.error('Error creating bet on-chain:', error);
      return false;
    }
  },
  [program, proxyAccountPDA, publicKey, sessionWallet, isSessionActive, connection, marketPDA, refetchProxy, checkMarket, ensureSessionFunded]
);

  return {
    createBetOnChain,
    checkMarket,
    ensureSessionFunded,
    proxyAccount,
    isSessionActive: isSessionActive(),
  };
};