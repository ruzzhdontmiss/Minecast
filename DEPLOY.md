# MineCast: Complete Deployment & Operations Guide

MineCast is an AI-powered Web3 short-video platform featuring **OpenAI CLIP visual embeddings**, **FAISS vector search**, **Supabase social storage**, and **Polygon smart contracts (ERC-20 + ERC-721 + Watch-to-Earn Treasury)**.

---

## 1. Required API Keys & Account Connections

To run or deploy MineCast, you need the following accounts and keys:

| Service | Needed For | Free / Paid? | Key / Variable Name | Where to Get |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase** | PostgreSQL Database & Video Object Storage | Free tier available | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY` | [supabase.com](https://supabase.com) → Project Settings → API |
| **Polygon Amoy Testnet Wallet** | Deploying contracts & on-chain signer for rewards | Free | `PRIVATE_KEY`<br>`SIGNER_PRIVATE_KEY` | MetaMask / Rabby → Account Details → Export Private Key |
| **Polygon Amoy Faucet** | Testnet MATIC to pay gas fees | Free | Test MATIC balance | [Polygon Faucet](https://faucet.polygon.technology/) |
| **Render / Railway / VPS** | Hosting Python FastAPI + PyTorch CLIP model | Free (Fallback) / ~$7/mo (Full AI) | `TREASURY_CONTRACT_ADDRESS`<br>`SIGNER_PRIVATE_KEY` | [render.com](https://render.com) or [railway.app](https://railway.app) |
| **Vercel** | Hosting Next.js 16 frontend | Free tier available | `NEXT_PUBLIC_API_URL` | [vercel.com](https://vercel.com) |

> [!NOTE]
> All local test keys (Hardhat Account #0 private key & Supabase project keys) are already pre-configured in `.env.local` and `.env` files for immediate local development.

---

## 2. Local Development (Running Everything on Your Machine)

### A. Run Smart Contracts & Deploy Locally
```bash
npm run test:contracts
npm run deploy:contracts:local
```
This deploys `MineToken` (MCT), `RareVideoNFT` (MCRV), and `Treasury` to local Hardhat, transfers 500,000 MCT to Treasury, and automatically writes the contract addresses and ABIs to `minecast-frontend/utils/contracts/addresses.json`.

### B. Run the FastAPI AI Microservice
```bash
npm run dev:backend
# Or manually:
cd minecast-backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```
- Health Check: `http://localhost:8000/health`
- Swagger API Docs: `http://localhost:8000/docs`

### C. Run the Next.js Frontend
```bash
npm run dev:frontend
# Or manually:
cd minecast-frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Production Deployment

### Step 1: Deploy Smart Contracts to Polygon Amoy Testnet
1. Open [`minecast-contracts/.env`](file:///Users/ruzzhx/Documents/minecast/minecast-contracts/.env) and set your private key:
   ```env
   PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY
   ```
2. Ensure your wallet has testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/).
3. Deploy:
   ```bash
   npm run deploy:contracts:amoy
   ```
4. Note the printed `Treasury` and `RareVideoNFT` addresses.

### Step 2: Deploy Backend to Render / Railway
1. Push code to GitHub.
2. In [Render](https://render.com) → **New Web Service**:
   - **Root Directory**: `minecast-backend`
   - **Build Command**: `pip install -r requirements.txt` (or `pip install -r requirements-light.txt` for 512MB free tier)
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://srbycjgizzkqyukyuwad.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_eLGf5XbqZEdnE4um6fXFKA_BWvWMH-K
     SIGNER_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
     TREASURY_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_TREASURY_ADDRESS
     KMP_DUPLICATE_LIB_OK=TRUE
     OMP_NUM_THREADS=1
     ```

### Step 3: Deploy Frontend to Vercel
1. In [Vercel](https://vercel.com) → **Import Project**:
   - **Root Directory**: `minecast-frontend`
   - **Framework Preset**: Next.js
   - **Environment Variables**:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://srbycjgizzkqyukyuwad.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_eLGf5XbqZEdnE4um6fXFKA_BWvWMH-K
     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
     NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_TREASURY_ADDRESS
     NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=0xYOUR_DEPLOYED_MINETOKEN_ADDRESS
     NEXT_PUBLIC_RARE_VIDEO_NFT_ADDRESS=0xYOUR_DEPLOYED_RAREVIDEONFT_ADDRESS
     ```
