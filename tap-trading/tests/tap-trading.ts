import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TapTrading } from "../target/types/tapTrading";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect, assert } from "chai";

describe("tap_trading", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.tapTrading as Program<TapTrading>;

  let marketPDA: PublicKey;
  let proxyAccountPDA: PublicKey;
  let betPDA: PublicKey;

  const LAMPORTS_PER_SOL = anchor.web3.LAMPORTS_PER_SOL;

  const authority = provider.wallet as anchor.Wallet;

  let bet_timestamp ;
  
  let user: Keypair;

  before(async () => {
    //generate keypair 
    user = Keypair.generate();

    //airdrop 
    const airdropSignature = await provider.connection.requestAirdrop(user.publicKey, 2 * 1000000000);

    //confirm airdrop
    await provider.connection.confirmTransaction(airdropSignature);

    //sleep for 20 second 
    await new Promise(resolve => setTimeout(resolve, 20000));
    //checking user balance
    const balance = await provider.connection.getBalance(user.publicKey)
    console.log(balance);
  });

  it("initialize the market ", async () => {
    [marketPDA] = PublicKey.findProgramAddressSync([Buffer.from("market")], program.programId);

    await program.methods.initializeMarket().accounts({
      market: marketPDA,
      authority: authority.publicKey,
      systemProgram: SystemProgram.programId
    }).rpc();

    const marketAccount = await program.account.market.fetch(marketPDA);
    console.log(marketAccount);

    expect(marketAccount.authority.toString()).to.equal(authority.publicKey.toString());
    expect(marketAccount.isActive).to.equal(true);

    // Fix: Compare BN values using .toNumber() or .eq()
    expect(marketAccount.totalVolume.toNumber()).to.equal(0);
    expect(marketAccount.totalFees.toNumber()).to.equal(0);
  });

  it("init user proxy account", async () => {
    [proxyAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("proxy_account"), user.publicKey.toBuffer()], 
      program.programId
    );

    // Fix: Add user as a signer
    await program.methods.createProxyAccount()
      .accounts({
        proxyAccount: proxyAccountPDA,
        owner: user.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([user])  // Add this line
      .rpc();

    const proxyAccountInfo = await program.account.proxyAccount.fetch(proxyAccountPDA);
    console.log(proxyAccountInfo);
    
    expect(proxyAccountInfo.owner.toString()).to.equal(user.publicKey.toString());
    expect(proxyAccountInfo.balance.toNumber()).to.equal(0);  // Fix: Add .toNumber()
  });

  it("Deposit fund to proxy account", async () => {
    
   const amount = 0.5 * anchor.web3.LAMPORTS_PER_SOL;
   
   await program.methods.deposit(new anchor.BN(amount)).accounts({
     proxyAccount: proxyAccountPDA,
     owner: user.publicKey,
     systemProgram: SystemProgram.programId
   }).signers([user]).rpc();

   const proxyAccount = await program.account.proxyAccount.fetch(
      proxyAccountPDA
    );
    expect(proxyAccount.balance.toNumber()).to.equal(amount);
    expect(proxyAccount.totalDeposited.toNumber()).to.equal(amount);
   


  });



   it("Creates a bet without session token", async () => {
    const timestamp = Date.now();
    bet_timestamp = timestamp;
    const odds = 200; // 2x odds (200%)
    const expiryTime = Math.floor(Date.now() / 1000) + 2;
    const betAmount = 0.1 * LAMPORTS_PER_SOL;

    [betPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        user.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(timestamp).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createBet(
        new anchor.BN(timestamp),
        new anchor.BN(odds),
        new anchor.BN(expiryTime),
        new anchor.BN(betAmount)
      )
      .accounts({
        bet: betPDA,
        proxyAccount: proxyAccountPDA,
        market: marketPDA,
        sessionToken: null,
        signer: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const betAccount = await program.account.bet.fetch(betPDA);
    expect(betAccount.user.toString()).to.equal(user.publicKey.toString());
    expect(betAccount.amount.toNumber()).to.equal(betAmount);
    expect(betAccount.odds.toNumber()).to.equal(odds);
    expect(betAccount.isActive).to.be.true;

    const proxyAccount = await program.account.proxyAccount.fetch(
      proxyAccountPDA
    );
    expect(proxyAccount.totalBets.toNumber()).to.equal(1);
  });

  it("Settles a bet (won)", async () => {

    await new Promise((resolve) => setTimeout(resolve, 12000));

    const initialBalance = (
      await program.account.proxyAccount.fetch(proxyAccountPDA)
    ).balance.toNumber();

    await program.methods
      .settleBet(true) // Won
      .accounts({
        bet: betPDA,
        proxyAccount: proxyAccountPDA,
        market: marketPDA,
        authority: authority.publicKey,
      })
      .rpc();

    const proxyAccount = await program.account.proxyAccount.fetch(
      proxyAccountPDA
    );
    
    // Balance should increase (original amount * odds / 100)
    const expectedWinnings = (0.1 * LAMPORTS_PER_SOL * 200) / 100;
    expect(proxyAccount.balance.toNumber()).to.be.greaterThan(initialBalance);

    // Bet account should be closed
    try {
      await program.account.bet.fetch(betPDA);
      assert.fail("Bet account should be closed");
    } catch (err) {
      expect(err.message).to.include("Account does not exist");
    }
  });

  it("Withdraws funds from proxy account", async () => {
    const withdrawAmount = 0.1 * LAMPORTS_PER_SOL;
    
    const initialBalance = (
      await program.account.proxyAccount.fetch(proxyAccountPDA)
    ).balance.toNumber();

    await program.methods
      .withdrawUser(new anchor.BN(withdrawAmount))
      .accounts({
        proxyAccount: proxyAccountPDA,
        owner: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const proxyAccount = await program.account.proxyAccount.fetch(
      proxyAccountPDA
    );
    expect(proxyAccount.balance.toNumber()).to.equal(
      initialBalance - withdrawAmount
    );
    expect(proxyAccount.totalWithdrawn.toNumber()).to.equal(withdrawAmount);
  });

  it("Owner withdraws fees from market", async () => {
    // First, create and lose a bet to generate fees
    const timestamp2 = Date.now() + 1000;
    const betAmount2 = 0.05 * anchor.web3.LAMPORTS_PER_SOL;
    const expiryTime2 = Math.floor(Date.now() / 1000) + 7200;

    const [betPDA2] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        user.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(timestamp2).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createBet(
        new anchor.BN(timestamp2),
        new anchor.BN(150),
        new anchor.BN(expiryTime2),
        new anchor.BN(betAmount2)
      )
      .accounts({
        bet: betPDA2,
        proxyAccount: proxyAccountPDA,
        market: marketPDA,
        sessionToken: null,
        signer: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Settle as lost
    await program.methods
      .settleBet(false)
      .accounts({
        bet: betPDA2,
        proxyAccount: proxyAccountPDA,
        market: marketPDA,
        authority: authority.publicKey,
      })
      .rpc();

    const marketBefore = await program.account.market.fetch(marketPDA);
    const feesToWithdraw = Math.floor(marketBefore.totalFees.toNumber() / 2);

    await program.methods
      .withdrawOwner(new anchor.BN(feesToWithdraw))
      .accounts({
        market: marketPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

      const marketAfter = await program.account.market.fetch(marketPDA);
    expect(marketAfter.totalFees.toNumber()).to.equal(
      marketBefore.totalFees.toNumber() - feesToWithdraw
    );
  });

 it("Fails to settle bet before expiry", async () => {
    const timestamp3 = Date.now() + 2000;
    const betAmount3 = 0.05 * LAMPORTS_PER_SOL;
    const expiryTime3 = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

    const [betPDA3] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        user.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(timestamp3).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createBet(
        new anchor.BN(timestamp3),
        new anchor.BN(150),
        new anchor.BN(expiryTime3),
        new anchor.BN(betAmount3)
      )
      .accounts({
        bet: betPDA3,
        proxyAccount: proxyAccountPDA,
        market: marketPDA,
        sessionToken: null,
        signer: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    try {
      await program.methods
        .settleBet(true)
        .accounts({
          bet: betPDA3,
          proxyAccount: proxyAccountPDA,
          market: marketPDA,
          authority: authority.publicKey,
        })
        .rpc();
      assert.fail("Should have failed to settle bet before expiry");
    } catch (err) {
      expect(err.message).to.include("BetNotExpired");
    }
  });

  it("Fails to create bet with insufficient balance", async () => {
    const timestamp4 = Date.now() + 3000;
    const expiryTime4 = Math.floor(Date.now() / 1000) + 3600;
    const tooLargeBetAmount = 10 * LAMPORTS_PER_SOL; // More than balance

    const [betPDA4] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        user.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(timestamp4).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .createBet(
          new anchor.BN(timestamp4),
          new anchor.BN(150),
          new anchor.BN(expiryTime4),
          new anchor.BN(tooLargeBetAmount)
        )
        .accounts({
          bet: betPDA4,
          proxyAccount: proxyAccountPDA,
          market: marketPDA,
          sessionToken: null,
          signer: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have failed with insufficient balance");
    } catch (err) {
      expect(err.message).to.include("InsufficientBalance");
    }
  });

  it("Fails to withdraw more than balance", async () => {
    const proxyAccount = await program.account.proxyAccount.fetch(
      proxyAccountPDA
    );
    const tooMuch = proxyAccount.balance.toNumber() + LAMPORTS_PER_SOL;

    try {
      await program.methods
        .withdrawUser(new anchor.BN(tooMuch))
        .accounts({
          proxyAccount: proxyAccountPDA,
          owner: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("Should have failed to withdraw too much");
    } catch (err) {
      expect(err.message).to.include("InsufficientBalance");
    }
  });

  it("Fails when unauthorized user tries to settle bet", async () => {
    const unauthorizedUser = Keypair.generate();
    const airdropSig = await provider.connection.requestAirdrop(
      unauthorizedUser.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const timestamp5 = Date.now() + 4000;
    const expiryTime5 = Math.floor(Date.now() / 1000) - 10; // Already expired
    const betAmount5 = 0.05 * LAMPORTS_PER_SOL;

    const [betPDA5] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        user.publicKey.toBuffer(),
        Buffer.from(new anchor.BN(timestamp5).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createBet(
        new anchor.BN(timestamp5),
        new anchor.BN(150),
        new anchor.BN(expiryTime5),
        new anchor.BN(betAmount5)
      )
      .accounts({
        bet: betPDA5,
        proxyAccount: proxyAccountPDA,
        market: marketPDA,
        sessionToken: null,
        signer: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    try {
      await program.methods
        .settleBet(true)
        .accounts({
          bet: betPDA5,
          proxyAccount: proxyAccountPDA,
          market: marketPDA,
          authority: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      assert.fail("Should have failed with unauthorized user");
    } catch (err) {
      expect(err.message).to.include("Unauthorized");
    }
  });

});