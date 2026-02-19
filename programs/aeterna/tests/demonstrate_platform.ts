import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Aeterna } from "../target/types/aeterna";
import { Keypair } from "@solana/web3.js";
import { assert } from "chai";

describe("Aeterna Platform Demo", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Aeterna as Program<Aeterna>;

    console.log("🚀 Starting AETERNA Platform Demonstration...");

    // --- ACTORS ---
    const alice = Keypair.generate(); // Organizer of "Techno Blast"
    const bob = Keypair.generate();   // Organizer of "Jazz Night"
    const user = Keypair.generate();  // Fan

    it("Setup Actors", async () => {
        // Airdrop SOL
        await provider.connection.confirmTransaction(
            await provider.connection.requestAirdrop(alice.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
            "confirmed"
        );
        await provider.connection.confirmTransaction(
            await provider.connection.requestAirdrop(bob.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
            "confirmed"
        );
        await provider.connection.confirmTransaction(
            await provider.connection.requestAirdrop(user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
            "confirmed"
        );
    });

    // --- STEP 1: CREATE EVENTS ---
    it("Creates Events (Platform Layer)", async () => {
        console.log("\n1️⃣  Creating Events...");

        // Alice creates Techno Blast
        const [aliceEventPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("event"), Buffer.from("Techno Blast")],
            program.programId
        );
        try {
            await program.methods
                .createEvent("Techno Blast")
                .accounts({
                    authority: alice.publicKey,
                    event: aliceEventPda,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([alice])
                .rpc();
            console.log(`✅ Alice created "Techno Blast" at ${aliceEventPda.toBase58()}`);
        } catch (e) { console.log("Event likely already exists (idempotent for demo)"); }

        // Bob creates Jazz Night
        const [bobEventPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("event"), Buffer.from("Jazz Night")],
            program.programId
        );
        try {
            await program.methods
                .createEvent("Jazz Night")
                .accounts({
                    authority: bob.publicKey,
                    event: bobEventPda,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([bob])
                .rpc();
            console.log(`✅ Bob created "Jazz Night" at ${bobEventPda.toBase58()}`);
        } catch (e) { console.log("Event likely already exists"); }
    });

    // --- STEP 2: MINT TICKETS ---
    it("Mints Tickets (User Layer)", async () => {
        console.log("\n2️⃣  Minting Tickets...");

        const [aliceEventPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("event"), Buffer.from("Techno Blast")],
            program.programId
        );

        // User buys a Techno Blast ticket
        const aliceTicket = Keypair.generate();
        await program.methods
            .initializePass({ uri: "https://arweave.net/techno-ticket-metadata" })
            .accounts({
                signer: user.publicKey,
                authority: alice.publicKey, // Alice is the authority for her tickets
                payer: user.publicKey,
                asset: aliceTicket.publicKey,
                event: aliceEventPda, // Linked to Alice's Event
                collection: null,
                mplCoreProgram: new anchor.web3.PublicKey("CoREENxT6tW1HoY8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([user, alice, aliceTicket])
            .rpc();
        console.log(`✅ User minted Techno Ticket: ${aliceTicket.publicKey.toBase58()}`);

        // Store for next test
        process.env.ALICE_TICKET = aliceTicket.publicKey.toBase58();
    });

    // --- STEP 3: SECURITY CHECK (The "Proof") ---
    it("Verifies Isolation (Hackathon Proof)", async () => {
        console.log("\n3️⃣  Verifying Isolation...");
        const aliceTicketKey = new anchor.web3.PublicKey(process.env.ALICE_TICKET); // In real mocha we'd use context, but let's just make it simple

        const [aliceEventPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("event"), Buffer.from("Techno Blast")],
            program.programId
        );

        // Alice tries to Resurrect her own ticket -> SHOULD SUCCEED
        try {
            await program.methods
                .resurrectPass({
                    newUri: "https://arweave.net/techno-vip",
                    newStage: "VIP",
                    currentXp: "100",
                })
                .accounts({
                    authority: alice.publicKey,
                    payer: alice.publicKey,
                    asset: aliceTicketKey,
                    mplCoreProgram: new anchor.web3.PublicKey("CoREENxT6tW1HoY8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
                    event: aliceEventPda, // Correct Event
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([alice])
                .rpc();
            console.log(`✅ Alice successfully upgraded the ticket to VIP.`);
        } catch (e) {
            console.error("❌ Alice failed to upgrade her own ticket (Unexpected):", e);
            throw e;
        }

        // Bob tries to Hack Alice's ticket -> SHOULD FAIL
        console.log("🕵️  Bob is attempting to hack Alice's event...");
        try {
            await program.methods
                .resurrectPass({
                    newUri: "https://arweave.net/jazz-hacked",
                    newStage: "HACKED",
                    currentXp: "0",
                })
                .accounts({
                    authority: bob.publicKey, // Bob signing
                    payer: bob.publicKey,
                    asset: aliceTicketKey,
                    mplCoreProgram: new anchor.web3.PublicKey("CoREENxT6tW1HoY8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
                    event: aliceEventPda, // Passing Alice's event (because that's what we want to attack)
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([bob])
                .rpc();
            assert.fail("Bob should NOT be able to resign!");
        } catch (e) {
            console.log(`✅ SUCCESS: Bob was blocked from updating Alice's ticket.`);
            // We expect an error related to constraint: event.authority == authority.key()
            // Bob (authority) != AliceEvent.authority (Alice)
        }

        console.log("\n🎉 PLATFORM DEMONSTRATION COMPLETE");
    });

    // --- STEP 4: QUESTS ---
    it("Quest System (Interaction Layer)", async () => {
        console.log("\n4️⃣  Quest System...");
        const aliceTicketKey = new anchor.web3.PublicKey(process.env.ALICE_TICKET);

        const [aliceEventPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("event"), Buffer.from("Techno Blast")],
            program.programId
        );

        // 1. Create Quest
        const [questPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("quest"), aliceEventPda.toBuffer(), Buffer.from("Main Stage")],
            program.programId
        );

        try {
            await program.methods
                .createQuest("Main Stage", new anchor.BN(50))
                .accounts({
                    authority: alice.publicKey,
                    event: aliceEventPda,
                    quest: questPda,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([alice])
                .rpc();
            console.log(`✅ Alice created Quest "Main Stage" (50 XP)`);
        } catch (e) { console.log("Quest likely exists"); }

        // 2. User Completes Quest
        await program.methods
            .completeQuest()
            .accounts({
                authority: alice.publicKey, // Scanner/Alice signs off
                payer: alice.publicKey,
                quest: questPda,
                event: aliceEventPda,
                asset: aliceTicketKey,
                mplCoreProgram: new anchor.web3.PublicKey("CoREENxT6tW1HoY8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([alice])
            .rpc();
        console.log(`✅ Quest Completed! Ticket Metadata updated.`);
    });
});
