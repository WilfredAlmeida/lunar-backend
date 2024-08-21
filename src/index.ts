import { Connection, Keypair, PublicKey, sendAndConfirmRawTransaction, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"
import dotenv from "dotenv"
import bs58 from "bs58";

const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"

dotenv.config()

// address of bridge pool on Solana and Eclipse
const POOL_ADDRESS = new PublicKey("61vGBCJ5DTDax5e5p1f7f96PTzDC78GUggsUtaicdH81")

const KEYPAIR = Keypair.fromSecretKey(
  bs58.decode(process.env.KEYPAIR_1!)
);

const solanaRpcConnection = new Connection(process.env.RPC_ENDPOINT_SOLANA!)
const eclipseRpcConnection = new Connection(process.env.RPC_ENDPOINT_ECLIPSE!)

async function main() {

  const messageToAddInMemo =
    "Bridged via Lunar"
  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: KEYPAIR.publicKey, isSigner: true, isWritable: true }],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(messageToAddInMemo, "utf-8"),
  });

  // Listen for deposit transactions on the Solana pool and transfer from the Eclipse pool
  solanaRpcConnection.onLogs(POOL_ADDRESS, async (logData) => {
    if (logData.err) return
    try {
      const parsedData = logData.logs
        .map(log => {
          const match = log.match(/to:(\w+),amount:(\d+)/);
          if (match) {
            return {
              to: match[1],
              amount: parseInt(match[2], 10)
            };
          }
          return null;
        })
        .find(item => item !== null);

      if (!parsedData || (!parsedData.amount && !parsedData.to)) return

      console.log(parsedData);

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: KEYPAIR.publicKey,
          toPubkey: new PublicKey(parsedData.to),
          lamports: parsedData.amount,
        })
      );

      transaction.add(memoInstruction);

      const blockhashResult = await eclipseRpcConnection.getLatestBlockhash("finalized")

      transaction.recentBlockhash = blockhashResult.blockhash
      transaction.lastValidBlockHeight = blockhashResult.lastValidBlockHeight

      transaction.sign(KEYPAIR)

      const signatureRaw = transaction.signatures[0].signature;
      const signatureString = bs58.encode(signatureRaw!);

      console.log(signatureString);

      const confirmedTx = await sendAndConfirmRawTransaction(eclipseRpcConnection, transaction.serialize())

      console.log(`${new Date().toISOString()} Transaction successful on Eclipse`);
      console.log(`${new Date().toISOString()} Explorer URL: https://explorer.dev.eclipsenetwork.xyz/tx/${signatureString}?cluster=devnet`);
    } catch (e) {
      console.log(`ERROR: ${e}`);
    }
  });

}

main()
