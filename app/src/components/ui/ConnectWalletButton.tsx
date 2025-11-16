'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSessionManager } from '@/hooks/useSessionManager';
import { SESSION_DURATIONS } from '@/lib/constants';
import { createPortal } from 'react-dom';

export const ConnectWalletButton: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const {
    sessionInfo,
    isCreatingSession,
    createSession,
    revokeSession,
    isSessionActive,
  } = useSessionManager();

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedDuration, setSelectedDuration] =
    useState<keyof typeof SESSION_DURATIONS>('2h');

  const handleEnableTrading = async () => {
    // Replace with your actual program ID
    const GAME_PROGRAM_ID = 'YourProgramIDHere11111111111111111111111111';
    const success = await createSession(GAME_PROGRAM_ID, selectedDuration);
    if (success) {
      setShowSessionModal(false);
    }
  };

  if (!connected) {
    return <WalletMultiButton />;
  }

  if (isSessionActive()) {
    const remainingTime = Math.max(
      0,
      sessionInfo!.expiresAt - Date.now()
    );
    const hours = Math.floor(remainingTime / 3600000);
    const minutes = Math.floor((remainingTime % 3600000) / 60000);

    return (
      <div className="flex items-center gap-2">
        <div className="px-4 py-2 bg-green-600/20 border border-green-500 rounded-lg">
          <div className="text-xs text-green-400">Trading Active</div>
          <div className="text-sm font-mono">
            {hours}h {minutes}m remaining
          </div>
        </div>
        <button
          onClick={revokeSession}
          className="px-4 py-2 bg-red-600/20 border border-red-500 rounded-lg hover:bg-red-600/30 transition"
        >
          Disable
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowSessionModal(true)}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 transition"
      >
        Enable Trading
      </button>

      {/* {showSessionModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowSessionModal(false)}
        >
          <div 
            className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Enable Popup-less Trading</h2>
            <p className="text-gray-300 mb-6">
              Create a session key to place bets without approving each
              transaction. Select duration:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {(Object.keys(SESSION_DURATIONS) as Array<keyof typeof SESSION_DURATIONS>).map((key) => (
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
                ⚠️ This will create a temporary session key with 0.01 SOL for gas
                fees. You can revoke access anytime.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition"
                disabled={isCreatingSession}
              >
                Cancel
              </button>
              <button
                onClick={handleEnableTrading}
                disabled={isCreatingSession}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingSession ? 'Creating...' : 'Enable Trading'}
              </button>
            </div>
          </div>
        </div>
      )} */}


        {showSessionModal && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setShowSessionModal(false)}
        >
          <div 
            className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Enable Popup-less Trading</h2>
            <p className="text-gray-300 mb-6">
              Create a session key to place bets without approving each
              transaction. Select duration:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {(Object.keys(SESSION_DURATIONS) as Array<keyof typeof SESSION_DURATIONS>).map((key) => (
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
                ⚠️ This will create a temporary session key with 0.01 SOL for gas
                fees. You can revoke access anytime.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition"
                disabled={isCreatingSession}
              >
                Cancel
              </button>
              <button
                onClick={handleEnableTrading}
                disabled={isCreatingSession}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingSession ? 'Creating...' : 'Enable Trading'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
};