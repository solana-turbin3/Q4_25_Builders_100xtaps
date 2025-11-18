import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TapTrading } from "../target/types/tapTrading";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function initializeMarket() {
  // Configure the client to use the local cluster or devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TapTrading as Program<TapTrading>;

  console.log("Program ID:", program.programId.toString());
  console.log("Authority (Deployer):", provider.wallet.publicKey.toString());

  // Derive market PDA
  const [marketPDA, marketBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("market")],
    program.programId
  );

  console.log("Market PDA:", marketPDA.toString());
  console.log("Market Bump:", marketBump);

  try {
    // Check if market already exists
    try {
      const market = await program.account.market.fetch(marketPDA);
      console.log("Market already initialized!");
      console.log("Market data:", market);
      return;
    } catch (e) {
      console.log("Market not found, initializing...");
    }

    // Initialize market
    const tx = await program.methods
      .initializeMarket()
      .accounts({
        market: marketPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Market initialized successfully!");
    console.log("Transaction signature:", tx);

    // Fetch and display market data
    const market = await program.account.market.fetch(marketPDA);
    console.log("\nMarket Data:");
    console.log("- Authority:", market.authority.toString());
    console.log("- Total Volume:", market.totalVolume.toString());
    console.log("- Total Fees:", market.totalFees.toString());
    console.log("- Is Active:", market.isActive);
    console.log("- Bump:", market.bump);
  } catch (error) {
    console.error("Error initializing market:", error);
    throw error;
  }
}

initializeMarket()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
