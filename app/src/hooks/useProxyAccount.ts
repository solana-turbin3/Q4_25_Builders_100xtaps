'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useBettingProgram } from './useBettingProgram';
import { LAMPORTS_PER_SOL , PublicKey, SystemProgram} from '@solana/web3.js';
// import { BN } from '@coral-xyz/anchor';
import * as anchor from "@coral-xyz/anchor";



export const useProxyAccount = () => {
  const { publicKey } = useWallet();
  const { program, proxyAccountPDA,connection, wallet } = useBettingProgram();
  const [proxyAccount, setProxyAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedOnChain, setHasCheckedOnChain] = useState(false);

  // Fetch proxy account from blockchain
  const fetchProxyAccount = useCallback(async () => {
    if (!program || !proxyAccountPDA || !publicKey) {
      setProxyAccount(null);
      setHasCheckedOnChain(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching proxy account for:', proxyAccountPDA.toString());
      
      const account = await program.account.proxyAccount.fetch(proxyAccountPDA);
      console.log('Proxy account found:', account);
      
      setProxyAccount(account);
      setHasCheckedOnChain(true);
      
      // Store in localStorage for faster subsequent checks
      if (publicKey) {
        localStorage.setItem(
          `proxy_account_${publicKey.toString()}`,
          JSON.stringify({
            exists: true,
            pda: proxyAccountPDA.toString(),
            timestamp: Date.now(),
          })
        );
      }
    } catch (error: any) {
      console.log('Proxy account fetch error:', error);
      
      // Account doesn't exist or other error
      if (error.message?.includes('Account does not exist')) {
        console.log('Proxy account does not exist');
        setProxyAccount(null);
        
        // Clear localStorage
        if (publicKey) {
          localStorage.removeItem(`proxy_account_${publicKey.toString()}`);
        }
      }
      
      setHasCheckedOnChain(true);
    } finally {
      setIsLoading(false);
    }
  }, [program, proxyAccountPDA, publicKey]);

  // Check localStorage first, then fetch from chain
  useEffect(() => {
    if (!publicKey || !proxyAccountPDA) {
      setProxyAccount(null);
      setHasCheckedOnChain(false);
      return;
    }

    // Check localStorage first
    const stored = localStorage.getItem(`proxy_account_${publicKey.toString()}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Cache is valid for 5 minutes
        if (parsed.exists && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          console.log('Using cached proxy account info');
          // Still fetch from chain but don't wait
          fetchProxyAccount();
          return;
        }
      } catch (error) {
        console.error('Error reading cached proxy account:', error);
      }
    }

    // Fetch from chain
    fetchProxyAccount();
  }, [publicKey, proxyAccountPDA, fetchProxyAccount]);

const createProxyAccount = useCallback(async () => {
  if (!program || !publicKey || !proxyAccountPDA) {
    throw new Error('Program or wallet not initialized');
  }

  try {
    console.log('Creating proxy account...');
    const tx = await program.methods
      .createProxyAccount()  // ✅ Correct method name
      .accounts({
        proxyAccount: proxyAccountPDA,  // ✅ Add PDA
        owner: publicKey,
        systemProgram: SystemProgram.programId,  // ✅ Add system program
      })
      .rpc();

    console.log('Proxy account created:', tx);
    
    // Refetch the account
    await fetchProxyAccount();
  } catch (error) {
    console.error('Error creating proxy account:', error);
    throw error;
  }
}, [program, publicKey, proxyAccountPDA, fetchProxyAccount]);


  const [marketPDA] = useMemo(() => {
    if (!program) return [null];
    return PublicKey.findProgramAddressSync(
      [Buffer.from("market")],
      program.programId
    );
  }, [program]);


const deposit = useCallback(
  async (amount: number) => {
    if (!program || !publicKey || !proxyAccountPDA || !wallet) {
      throw new Error('Program or wallet not initialized');
    }

    try {
      console.log('Depositing:', amount, 'SOL');
      
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
      const bn = new anchor.BN(lamports);
      
      // Use sendAndConfirm instead of rpc
      const tx = await program.methods
        .deposit(bn)
        .accounts({
          proxyAccount: proxyAccountPDA,
          owner: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' });

      console.log('Deposit transaction:', tx);
      
      // Wait for confirmation
      await connection.confirmTransaction(tx, 'confirmed');
      console.log('Deposit confirmed');
      
      // Wait a bit before refetching
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchProxyAccount();
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  },
  [program, publicKey, proxyAccountPDA, wallet, connection, fetchProxyAccount]
);


 const withdraw = useCallback(
    async (amount: number) => {
      if (!program || !publicKey || !proxyAccountPDA) {
        throw new Error('Program or wallet not initialized');
      }

      try {
        console.log('Withdrawing:', amount, 'SOL');
        const tx = await program.methods
          .withdrawUser(new anchor.BN(amount * LAMPORTS_PER_SOL))
          .accounts({
            proxyAccount: proxyAccountPDA,
            owner: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log('Withdrawal successful:', tx);
        
        // Wait a bit before refetching
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchProxyAccount();
      } catch (error) {
        console.error('Error withdrawing:', error);
        throw error;
      }
    },
    [program, publicKey, proxyAccountPDA, fetchProxyAccount]
  );







  return {
    proxyAccount,
    proxyAccountPDA,
    isLoading: isLoading || !hasCheckedOnChain,
    createProxyAccount,
    deposit,
    withdraw,
    refetch: fetchProxyAccount,
  };
};