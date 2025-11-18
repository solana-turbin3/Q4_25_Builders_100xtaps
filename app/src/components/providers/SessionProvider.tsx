'use client';

import React, { ReactNode } from 'react';
import {
  SessionWalletProvider,
  useSessionKeyManager,
} from '@magicblock-labs/gum-react-sdk';
import { AnchorWallet, useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { SOLANA_NETWORK } from '@/lib/constants';

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet() as AnchorWallet

  const sessionWallet = useSessionKeyManager(
    anchorWallet,
    connection,
    SOLANA_NETWORK
  );

  return (
    <SessionWalletProvider sessionWallet={sessionWallet}>
      {children}
    </SessionWalletProvider>
  );
};