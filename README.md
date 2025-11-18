# 100xTap - Solana-Powered Price Prediction Betting Game  
**License: MIT**

Tech: **Solana · Next.js · React**

---

## 🚀 Overview

**100xTap** is an exciting, high-stakes **price prediction betting game** built on the **Solana blockchain**.  
Users connect their Solana wallet to place leveraged bets on live price movements (e.g., BTC/USD via WebSocket).  
it's a fast, “tap-to-bet” experience where timing = profit.

The game uses:

- **Proxy accounts** for isolated user funds  
- **Session keys (MagicBlock/Gum)** for popup-less transactions  
- **Real-time price feeds** + responsive canvas UI  
- **Anchor smart contracts** for bet creation, settlement, fees  

No repetitive wallet popups — enable once, enjoy 2 hours of frictionless trading!

---

## ✨ Features

| Feature | Description | Status |
|--------|-------------|--------|
| Wallet Connect | Multi-wallet support | ✅ |
| Proxy Account Setup | On-chain fund isolation | ✅ |
| Session Keys | Popup-less txns (up to 2h) | ✅ |
| Bet Placement | Real-time price prediction | ✅ |
| Bet Settlement | Auto-resolve on expiry | ✅ |
| Profile Analytics | Win rate, P&L tracking | ✅ |
| Mobile Optimization | Touch-friendly canvas | ✅ |

### Additional Highlights

- **Real-time betting:** Tap UP/DOWN with customizable odds (up to 100x)
- **Active bets dashboard:** Track pending, won, lost bets
- **Profile screen:** Win rate, total wagered, profit, history
- **Secure design:** Session keys auto-expire & revocable
- **Mobile-first UI:** Smooth gradients, animations, optimized layout

---

## 🛠 Tech Stack

### **Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- @solana/wallet-adapter-react
- @magicblock-labs/gum-react-sdk

### **Blockchain**
- Solana (Devnet/Mainnet)
- Anchor Framework (Rust)
- @coral-xyz/anchor client

### **Backend / Integrations**
- WebSocket live price feed
- Solana Web3.js for RPC + txns


---

## 🎮 Usage

### **1. Connect Wallet**
Tap **Connect Wallet**, approve in Phantom/Solflare.

### **2. First-Time Setup**
- Create proxy account (~0.001 SOL)
- Deposit SOL (optional)
- Enable trading session (30m / 1h / 2h)

### **3. Place Bets**
- Watch live price canvas  
- Tap **UP** or **DOWN**  
- Bets auto-settle on expiry  

### **4. Manage Profile**
- Withdraw funds  
- View P&L, win rate  
- Revoke session keys  


---

## 🙏 Acknowledgments

- Solana Foundation  
- Anchor Team  
- MagicBlock Labs  
- Open-source contributors  

---

⭐ **Star the repo if you like it!**  
Questions? Open an issue.  
**Happy betting! **

