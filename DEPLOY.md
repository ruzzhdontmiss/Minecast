# MineCast Deployment Guide

## 1. Smart Contracts → Polygon Amoy (Testnet)

### Prerequisites
- Get a wallet (e.g., MetaMask) and export the **private key**.
- Get testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/).

### Steps
```bash
cd minecast-contracts
cp .env.example .env
# Edit .env and add your PRIVATE_KEY

npx hardhat run scripts/deploy.js --network amoy
```

This will deploy contracts and auto-update `minecast-frontend/utils/contracts/addresses.json`.

---

## 2. Backend → Render

### Steps
1. Push code to GitHub.
2. Go to [Render](https://render.com) → **New Web Service**.
3. Connect your repo, set **Root Directory** to `minecast-backend`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase key

> **Note**: The AI models (~500MB) will download on first startup. Free tier may be slow. Consider using a paid instance.

---

## 3. Frontend → Vercel

### Steps
1. Go to [Vercel](https://vercel.com) → **Import Project**.
2. Connect your repo, set **Root Directory** to `minecast-frontend`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase key
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g., `https://minecast-api.onrender.com`)
4. Deploy!

### Post-Deploy
- Update `NEXT_PUBLIC_API_URL` in `.env.local` to point to your Render URL.
- Update CORS origins in `minecast-backend/main.py` to include your Vercel domain.
