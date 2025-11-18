// 'use client';

// import { useMemo } from 'react';
// import { AnchorProvider, Program, setProvider } from '@coral-xyz/anchor';
// import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
// import { PublicKey } from '@solana/web3.js';
// import idl from '@/lib/idl/betting_program.json';
// import { TapTrading } from '@/lib/idl/idlType';

// export const BETTING_PROGRAM_ID = new PublicKey('2w4oVPm7JEd2qnWt1mJ4YLpXAW6Wrp9Rk2EfKFVJNanB');

// export const useBettingProgram = () => {
//   const { connection } = useConnection();
//   const { publicKey } = useWallet();

//   const program = useMemo(() => {
//     return new Program(idl as TapTrading, {
//       connection,
//     });
//   }, [connection]);

//   // Derive the proxy account PDA
//   const proxyAccountPDA = useMemo(() => {
//     if (!publicKey) return null;

//     const [pda] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from('proxy_account'),
//         publicKey.toBuffer(),
//       ],
//       BETTING_PROGRAM_ID
//     );

//     return pda;
//   }, [publicKey]);

//   return { 
//     program, 
//     connection,
//     proxyAccountPDA 
//   };
// };


'use client';

import { useMemo } from 'react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import idl from '@/lib/idl/betting_program.json';
import { TapTrading } from '@/lib/idl/idlType';

export const BETTING_PROGRAM_ID = new PublicKey('2w4oVPm7JEd2qnWt1mJ4YLpXAW6Wrp9Rk2EfKFVJNanB');

export const useBettingProgram = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const { program, provider } = useMemo(() => {
    if (!wallet) {
      // Return a program without provider for read-only operations
      const prog = new Program(idl as TapTrading, {
        connection,
      });
      return { program: prog, provider: null };
    }

    // Create provider with wallet
    const prov = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );

    const prog = new Program(idl as TapTrading, prov);
    
    return { program: prog, provider: prov };
  }, [connection, wallet]);

  // Derive the proxy account PDA
  const proxyAccountPDA = useMemo(() => {
    if (!wallet?.publicKey) return null;

    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('proxy_account'),
        wallet.publicKey.toBuffer(),
      ],
      BETTING_PROGRAM_ID
    );

    return pda;
  }, [wallet?.publicKey]);

  return { 
    program, 
    provider,
    connection,
    proxyAccountPDA,
    wallet
  };
};