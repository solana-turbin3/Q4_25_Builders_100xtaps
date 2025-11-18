'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGame } from '@/contexts/GameContext';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useProxyAccount } from '@/hooks/useProxyAccount';
import { Navigation } from '@/components/ui/Navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';


export default function ProfilePage() {
  const { publicKey, connected, disconnect } = useWallet();
  const { balance, activeBets } = useGame();
  const { sessionInfo, revokeSession, isSessionActive } = useSessionManager();
  const { proxyAccount, proxyAccountPDA, withdraw, deposit, isLoading: isLoadingProxy } = useProxyAccount();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const wonBets = activeBets.filter((b) => b.status === 'won');
  const lostBets = activeBets.filter((b) => b.status === 'lost');
  const pendingBets = activeBets.filter((b) => b.status === 'pending');

  const totalWagered = (wonBets.length + lostBets.length) * 10;
  const totalProfit = wonBets.reduce((sum, bet) => sum + bet.payout, 0);
  const winRate =
    wonBets.length + lostBets.length > 0
      ? (wonBets.length / (wonBets.length + lostBets.length)) * 100
      : 0;

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setIsProcessing(true);
    try {
      await withdraw(parseFloat(withdrawAmount));
      setWithdrawAmount('');
      alert('Withdrawal successful');
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Withdrawal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setIsProcessing(true);
    try {
      await deposit(parseFloat(depositAmount));
      setDepositAmount('');
      alert('Deposit successful');
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Deposit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Convert BN to number safely
  const convertBNToNumber = (bn: any): number => {
    if (!bn) return 0;
    if (typeof bn === 'number') return bn;
    if (bn.toNumber) return bn.toNumber();
    return 0;
  };

  const proxyBalance = proxyAccount ? convertBNToNumber(proxyAccount.balance) / LAMPORTS_PER_SOL : 0;
  const totalDeposited = proxyAccount ? convertBNToNumber(proxyAccount.totalDeposited) / LAMPORTS_PER_SOL : 0;
  const totalWithdrawn = proxyAccount ? convertBNToNumber(proxyAccount.totalWithdrawn) / LAMPORTS_PER_SOL : 0;
  const totalBetsCount = proxyAccount ? convertBNToNumber(proxyAccount.totalBets) : 0;

  if (!connected) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white flex flex-col overflow-hidden">
        <div className="p-4 bg-black/40 backdrop-blur-sm border-b border-purple-500/30">
          <h1 className="text-3xl font-bold">👤 Profile</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="bg-purple-900/50 border border-purple-500 rounded-2xl p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-300 mb-6">
              Connect your wallet to view your profile and statistics
            </p>
            <WalletMultiButton />
          </div>
        </div>

        <Navigation />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-black text-white flex flex-col overflow-hidden">
      <div className="p-4 bg-black/40 backdrop-blur-sm border-b border-purple-500/30">
        <h1 className="text-3xl font-bold">👤 Profile</h1>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Wallet & Proxy Info */}
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <div className="text-sm text-gray-400">Wallet Address</div>
                <button
                  onClick={() => disconnect()}
                  className="text-xl font-mono font-bold hover:text-purple-400 transition cursor-pointer"
                  title="Disconnect Wallet"
                >
                  {shortenAddress(publicKey!.toString())}
                </button>
              </div>
              {proxyAccount && proxyAccountPDA && (
                <div className="flex flex-col text-right">
                  <div className="text-sm text-gray-400">Proxy Address</div>
                  <button
                    onClick={isSessionActive() ? revokeSession : undefined}
                    disabled={!isSessionActive()}
                    className={`font-mono font-bold transition ${
                      isSessionActive()
                        ? 'text-red-400 hover:text-red-300 cursor-pointer'
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                    title={isSessionActive() ? "Revoke Session" : "No Active Session"}
                  >
                    {shortenAddress(proxyAccountPDA.toString())}
                    {isSessionActive() && <span className="ml-1">🔓</span>}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">Game Balance</div>
                <div className="text-2xl font-bold text-green-400">
                  ${balance.toFixed(2)}
                </div>
              </div>
              {proxyAccount && (
                <div>
                  <div className="text-sm text-gray-400">Proxy Balance</div>
                  <div className="text-2xl font-bold text-green-400">
                    {proxyBalance.toFixed(4)} SOL
                  </div>
                </div>
              )}
            </div>

            {/* Deposit/Withdraw Controls */}
            {proxyAccount && (
              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-black/20 rounded-lg">
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount (SOL)"
                    className="w-full px-3 py-2 bg-purple-900/50 border border-purple-700 rounded text-white text-sm"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={isProcessing || isLoadingProxy}
                    className="w-full px-3 py-2 bg-green-600 rounded text-white text-sm hover:bg-green-500 transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Depositing...' : 'Deposit'}
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Amount (SOL)"
                    className="w-full px-3 py-2 bg-purple-900/50 border border-purple-700 rounded text-white text-sm"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={isProcessing || isLoadingProxy || !withdrawAmount}
                    className="w-full px-3 py-2 bg-red-600 rounded text-white text-sm hover:bg-red-500 transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Withdrawing...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            )}

            {/* Session Status */}
            {isSessionActive() && sessionInfo && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-400 font-semibold">
                      ✅ Trading Session Active
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Expires: {new Date(sessionInfo.expiresAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={revokeSession}
                    className="px-4 py-2 bg-red-600/20 border border-red-500 rounded-lg text-sm hover:bg-red-600/30 transition"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-purple-900/50 border border-purple-500/30 rounded-xl p-4">
              <div className="text-sm text-gray-400">Total Bets</div>
              <div className="text-3xl font-bold">
                {wonBets.length + lostBets.length}
              </div>
            </div>

            <div className="bg-green-900/50 border border-green-500/30 rounded-xl p-4">
              <div className="text-sm text-gray-400">Won</div>
              <div className="text-3xl font-bold text-green-400">
                {wonBets.length}
              </div>
            </div>

            <div className="bg-red-900/50 border border-red-500/30 rounded-xl p-4">
              <div className="text-sm text-gray-400">Lost</div>
              <div className="text-3xl font-bold text-red-400">
                {lostBets.length}
              </div>
            </div>

            <div className="bg-blue-900/50 border border-blue-500/30 rounded-xl p-4">
              <div className="text-sm text-gray-400">Win Rate</div>
              <div className="text-3xl font-bold text-blue-400">
                {winRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-400">Total Wagered</div>
                <div className="text-2xl font-bold">${totalWagered.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Profit</div>
                <div className="text-2xl font-bold text-green-400">
                  +${totalProfit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Pending Bets</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {pendingBets.length}
                </div>
              </div>
            </div>
            {proxyAccount && (
              <div className="mt-4 pt-4 border-t border-purple-500/30">
                <div className="text-sm text-gray-400 mb-2">Proxy Account Stats</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Deposited:</span>
                    <div className="font-bold">{totalDeposited.toFixed(4)} SOL</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Withdrawn:</span>
                    <div className="font-bold">{totalWithdrawn.toFixed(4)} SOL</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Bets:</span>
                    <div className="font-bold">{totalBetsCount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Recent Bets</h3>
            {activeBets.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No bets placed yet. Start trading to see your history!
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {activeBets
                  .slice()
                  .reverse()
                  .slice(0, 20)
                  .map((bet) => (
                    <div
                      key={bet.id}
                      className={`p-3 rounded-lg border ${
                        bet.status === 'won'
                          ? 'bg-green-900/20 border-green-500/30'
                          : bet.status === 'lost'
                          ? 'bg-red-900/20 border-red-500/30'
                          : 'bg-yellow-900/20 border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-mono">
                            ${bet.startPrice.toFixed(2)} → ${bet.endPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {bet.odds.toFixed(2)}x odds • $10 wagered
                          </div>
                        </div>
                        <div className="text-right">
                          {bet.status === 'won' && (
                            <div className="text-lg font-bold text-green-400">
                              +${bet.payout.toFixed(2)}
                            </div>
                          )}
                          {bet.status === 'lost' && (
                            <div className="text-lg font-bold text-red-400">
                              -$10.00
                            </div>
                          )}
                          {bet.status === 'pending' && (
                            <div className="text-sm text-yellow-400">
                              Pending...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Best Bet */}
          {wonBets.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">🏆 Best Bet</h3>
              {(() => {
                const bestBet = wonBets.reduce((best, bet) =>
                  bet.payout > best.payout ? bet : best
                );
                return (
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-mono">
                          ${bestBet.startPrice.toFixed(2)} → ${bestBet.endPrice.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {bestBet.odds.toFixed(2)}x odds
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-green-400">
                        +${bestBet.payout.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}