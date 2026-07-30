# MINECAST PROJECT SPECIFICATION

## 1. Project Overview
MineCast is a **Web3 Short-Video Platform** (similar to TikTok/Instagram Reels) that integrates **AI-powered Originality Detection** and **Watch-to-Earn** blockchain mechanics. 

**Core Value Proposition:**
1.  **AI Rarity Engine:** Checks if a video is original or a copy before allowing NFT minting.
2.  **Proof-of-Watch:** Users earn "MineToken" (MT) for watching content (tracked via time/view logic).
3.  **Creator Economy:** Creators mint "Rare" videos as NFTs and earn royalties.

## 2. Tech Stack

### **Frontend (The Client)**
* **Framework:** Next.js 14 (App Router) with TypeScript.
* **Styling:** Tailwind CSS (Dark Mode/Glassmorphism theme).
* **Animations:** Framer Motion (for swipe feed, like animations, drawers).
* **Icons:** Lucide React.
* **State Management:** React Hooks (`useState`, `useEffect`, Custom Hooks).

### **Backend 1: The AI Engine (Python)**
* **Framework:** FastAPI (`uvicorn`).
* **ML Models:** OpenAI CLIP (Visual Embeddings) + FAISS (Vector Database).
* **Function:**
    * Receives video upload -> Extracts frames -> Generates Vector Embeddings.
    * Compares against `faiss_video.index` (Copyright DB).
    * Returns a **Rarity Score (0-100%)** and "Unique/Duplicate" status.

### **Backend 2: The Social Layer (Supabase)**
* **Auth:** Supabase Auth (Passwordless OTP / Google).
* **Database:** PostgreSQL.
    * `profiles`: User data (username, avatar, wallet_address).
    * `videos`: Video metadata (URL, creator, rarity score).
    * `likes`: Interaction tracking.
    * `comments`: Threaded discussions.
* **Storage:** Supabase Storage (Bucket: `videos`).

### **Backend 3: The Blockchain (Web3)**
* **Chain:** Polygon Amoy (Testnet) or Hardhat Local.
* **Libraries:** RainbowKit + Wagmi + Viem.
* **Contracts (Planned):**
    * `MineToken.sol` (ERC-20 Reward Token).
    * `RareVideoNFT.sol` (ERC-721 for minted videos).
    * `Treasury.sol` (Distributes rewards).

## 3. Core Modules & Architecture

### **A. Authentication & User Profile**
* **Flow:** User signs in via Email OTP (Supabase).
* **Navbar:** Real-time listener (`onAuthStateChange`). Displays "Sign In" button if guest, "Username/Profile Pill" if logged in.
* **Wallet:** Users connect MetaMask via RainbowKit.

### **B. The "Reels" Feed**
* **UI:** Full-screen vertical scroll (`snap-y snap-mandatory`).
* **Video Player:** Auto-plays when in view (Intersection Observer).
* **Sidebar:** Floating action bar on the right.
    * **Rarity Meter:** Visual gauge (Gold=Legendary, Green=Rare, Gray=Common) driven by the AI Score.
    * **Like/Comment:** Connected to Supabase via `useSocial` hook.
    * **Share:** Standard Web Share API.

### **C. Upload & AI Analysis Workflow**
1.  **User uploads video** -> Sent to Python API (`/analyze`).
2.  **Python** calculates Rarity Score -> Returns JSON.
3.  **Frontend** displays Score.
    * If Score > Threshold: "Publish" button appears.
    * If Score < Threshold: Rejected as duplicate.
4.  **On Publish:** Uploads file to Supabase Storage -> Saves metadata to Supabase DB.

### **D. Watch-to-Earn (In Progress)**
* Frontend tracks "Valid View Time" (e.g., >5 seconds).
* Will trigger a blockchain transaction or backend signature to reward MT Tokens.

## 4. Current Folder Structure
```text
minecast-frontend/
├── app/
│   ├── auth/page.tsx       # OTP Login
│   ├── upload/page.tsx     # AI Analysis & Publish
│   ├── layout.tsx          # Wraps Providers
│   └── page.tsx            # Main Reels Feed
├── components/
│   ├── Navigation/Navbar.tsx
│   ├── Feed/VideoSidebar.tsx  # Rarity Meter + Social Buttons
│   ├── Wallet/WalletDrawer.tsx
│   └── Providers.tsx       # Wagmi/RainbowKit Config
├── hooks/
│   └── useSocial.ts        # Supabase Logic
├── utils/
│   └── supabase.ts         # Client Config
└── .env.local              # API Keys
5. Design Guidelines
Visual Style: "Cyberpunk Lite" / High-end Dark Mode.

Colors: Black backgrounds (bg-black), Translucent overlays (bg-black/40 backdrop-blur), Neon accents (Blue for UI, Gold/Green for Rarity).

Responsiveness: Mobile-first design (looks like an App on phones).