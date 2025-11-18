


'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useProxyAccount } from '@/hooks/useProxyAccount';
import { SESSION_DURATIONS } from '@/lib/constants';
import { createPortal } from 'react-dom';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';


type ModalStep = 'session' | 'create-account' | 'deposit' | null;

export const ConnectWalletButton: React.FC = () => {
  
  const { connected, publicKey, disconnect } = useWallet();
  const {
    sessionInfo,
    isCreatingSession,
    createSession,
    revokeSession,
    isSessionActive,
  } = useSessionManager();

  const {
    proxyAccount,
    proxyAccountPDA,
    isLoading: isLoadingProxy,
    createProxyAccount,
    deposit,
  } = useProxyAccount();

  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [selectedDuration, setSelectedDuration] =
    useState<keyof typeof SESSION_DURATIONS>('2h');
  const [depositAmount, setDepositAmount] = useState('0.1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

 




  // // Check if user needs to create proxy account
  // useEffect(() => {
  //   // Only show modal if wallet is connected AND publicKey exists
  //   if (connected && publicKey && !isLoadingProxy && !proxyAccount && !modalStep) {
  //     setModalStep('create-account');
  //   }
    
  //   // Clear modal if wallet disconnects
  //   if (!connected || !publicKey) {
  //     setModalStep(null);
  //   }
  // }, [connected, publicKey, isLoadingProxy, proxyAccount]); // Removed modalStep from deps to prevent loop

  useEffect(() => {
  // Only show modal after we've checked on-chain AND wallet is connected
  if (connected && publicKey && !isLoadingProxy) {
    // If no proxy account exists, show create modal
    if (!proxyAccount && !modalStep) {
      setModalStep('create-account');
    }
  }
  
  // Clear modal if wallet disconnects
  if (!connected || !publicKey) {
    setModalStep(null);
  }
}, [connected, publicKey, isLoadingProxy, proxyAccount]);

  const handleCreateProxyAccount = async () => {
    setIsProcessing(true);
    try {
      await createProxyAccount();
      setModalStep('deposit');
    } catch (error) {
      console.error('Failed to create proxy account:', error);
      alert('Failed to create proxy account. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async () => {
    setIsProcessing(true);
    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      await deposit(amount);
      setModalStep('session');
    } catch (error) {
      console.error('Failed to deposit:', error);
      alert('Failed to deposit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnableTrading = async () => {
    console.log("handleEnableTrading");
    setIsProcessing(true);
    try {
      const success = await createSession(selectedDuration);
      if (success) {
        setModalStep(null);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to enable trading. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipDeposit = () => {
    setModalStep('session');
  };

  const handleDisconnect = () => {
    disconnect();
    setModalStep(null);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  let mainContent: React.ReactNode;

 
if (!isMounted) {
  mainContent = <div className="px-6 py-3 bg-gray-800 rounded-lg">Loading...</div>;
} else if (!connected) {
  mainContent = <WalletMultiButton />;
} else if (isLoadingProxy) {
  mainContent = (
    <div className="px-4 py-2 bg-purple-600/20 border border-purple-500 rounded-lg">
      <div className="text-sm">Loading account...</div>
    </div>
  );
  
  } else if (proxyAccount && proxyAccountPDA) {
    mainContent = (
      <div className="flex items-center gap-2">
        {/* Wallet Address - Click to Disconnect */}
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 bg-gray-700/50 border border-gray-500 rounded-lg text-xs hover:bg-gray-600 transition"
          title="Disconnect Wallet"
        >
          {shortenAddress(publicKey!.toString())}
        </button>

        {/* Proxy Account Address - Click to Revoke Session if active */}
        <button
          onClick={isSessionActive() ? revokeSession : undefined}
          disabled={!isSessionActive()}
          className={`px-3 py-2 rounded-lg text-xs transition ${
            isSessionActive()
              ? 'bg-red-700/50 border border-red-500 hover:bg-red-600/50 cursor-pointer'
              : 'bg-gray-700/50 border border-gray-500 cursor-not-allowed opacity-50'
          }`}
          title={isSessionActive() ? "Revoke Session" : "No Active Session"}
        >
          {shortenAddress(proxyAccountPDA.toString())}
          {isSessionActive() && <span className="ml-1">🔓</span>}
        </button>

        {/* Session Status */}
        {isSessionActive() ? (
          <div className="px-4 py-2 bg-green-600/20 border border-green-500 rounded-lg">
            <div className="text-xs text-green-400">Trading Active</div>
            <div className="text-sm font-mono">
              {(proxyAccount.balance / LAMPORTS_PER_SOL).toFixed(4)} SOL
            </div>
          </div>
        ) : (
          <button
            onClick={() => setModalStep('session')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 transition"
          >
            Enable Trading
          </button>
        )}
      </div>
    );
  } else {
    // No proxy account: Show Create Account + Disconnect (to allow switching wallets)
    mainContent = (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setModalStep('create-account')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold hover:from-blue-500 hover:to-purple-500 transition"
        >
          Create Account
        </button>
        <button
          onClick={handleDisconnect}
          className="px-3 py-3 bg-gray-700/50 border border-gray-500 rounded-lg text-xs hover:bg-gray-600 transition"
          title="Switch Wallet"
        >
          {shortenAddress(publicKey!.toString())}
        </button>
      </div>
    );
  }

  return (
    <>
      {mainContent}

      {/* Modals */}
      {modalStep && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => !isProcessing && setModalStep(null)}
        >
          <div
            className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Create Account Modal */}
            {modalStep === 'create-account' && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Create Betting Account
                </h2>
                <p className="text-gray-300 mb-6">
                  You need to create a proxy account to start betting. This is a
                  one-time setup.
                </p>

                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-400">
                    ℹ️ Your betting account will be created on-chain. This requires
                    a small transaction fee (~0.001 SOL).
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStep(null)}
                    className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProxyAccount}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </>
            )}

            {/* Deposit Modal */}
            {modalStep === 'deposit' && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Deposit Funds
                </h2>
                <p className="text-gray-300 mb-6">
                  Deposit SOL to your betting account to start placing bets.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (SOL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-purple-900/50 border border-purple-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="0.1"
                  />
                </div>

                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-400">
                    ⚠️ You can deposit more funds or withdraw anytime from your
                    account settings.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkipDeposit}
                    className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition"
                    disabled={isProcessing}
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Depositing...' : 'Deposit'}
                  </button>
                </div>
              </>
            )}

            {/* Enable Trading Modal */}
            {modalStep === 'session' && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Enable Popup-less Trading
                </h2>
                <p className="text-gray-300 mb-6">
                  Create a session key to place bets without approving each
                  transaction. Select duration:
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {(
                    Object.keys(SESSION_DURATIONS) as Array <
                      keyof typeof SESSION_DURATIONS
                    >
                  ).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedDuration(key)}
                      className={`px-4 py-3 rounded-lg font-semibold transition ${
                        selectedDuration === key
                          ? 'bg-purple-600 border-2 border-purple-400'
                          : 'bg-purple-900/50 border border-purple-700 hover:bg-purple-800/50'
                      }`}
                    >
                      {key.toUpperCase()}
                    </button>
                  ))}
                </div>         

                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-400">
                    ⚠️ This will create a temporary session key with 0.01 SOL for
                    gas fees. You can revoke access anytime.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStep(null)}
                    className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnableTrading}
                    disabled={isProcessing || isCreatingSession}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing || isCreatingSession ? 'Creating...' : 'Enable Trading'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};