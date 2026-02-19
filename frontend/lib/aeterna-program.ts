import { Program, AnchorProvider, Idl, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";
import IDL from "./idl.json";

// Type definition for the IDL
export type Aeterna = {
    version: "0.1.0";
    name: "aeterna";
    instructions: typeof IDL.instructions;
    accounts: typeof IDL.accounts;
};

export const getProgram = (connection: Connection, wallet: any) => {
    const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: "processed",
    });
    setProvider(provider);
    return new Program(IDL as any, provider);
};

export const getPulseLinkAddress = (asset: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("pulse"), asset.toBuffer()],
        new PublicKey(PROGRAM_ID)
    )[0];
};
