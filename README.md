# Lunar Backend

This backend does the following:
1. Listen for transactions happening on the Solana pool
2. Filter deposit transactions
3. Transfer tokens from the pool on Eclipse

## Getting Started
1. Clone the repo and `cd` into the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Execute the backend: `tsx src/index.ts`

### Env variables
1. `RPC_ENDPOINT_SOLANA`: Solana RPC Endpoint
2. `RPC_ENDPOINT_ECLIPSE`: Eclipse RPC Endpoint
3. `KEYPAIR_1`: Signer Keypair