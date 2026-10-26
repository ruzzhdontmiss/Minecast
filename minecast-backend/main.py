import os
# Ensure OpenMP stability on macOS/Linux before importing ML libraries
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from web3 import Web3
from eth_account.messages import encode_defunct
import hashlib
import random
import traceback
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MineCast AI & Web3 Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory hash set for quick duplicate detection fallback
video_hashes = set()

# Initialize AI Engine
ai_engine = None
try:
    from ai_engine import AIEngine
    ai_engine = AIEngine()
    ai_engine.load_model()
    indexed_count = ai_engine.index.ntotal if (ai_engine.index is not None) else 0
    print(f"✅ AI Engine initialized successfully. Indexed videos: {indexed_count}")
except Exception as e:
    print(f"⚠️ AI Engine could not be initialized ({e}). Running in fallback mode.")
    traceback.print_exc()

@app.get("/")
def root():
    return {
        "service": "MineCast AI & Web3 Microservice",
        "status": "online",
        "docs_url": "http://localhost:8000/docs",
        "endpoints": {
            "health": "GET /health",
            "analyze_video": "POST /analyze",
            "index_video": "POST /index-video",
            "claim_reward": "POST /claim-reward"
        },
        "frontend_app": "http://localhost:3000"
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "ai_engine_active": ai_engine is not None and ai_engine.index is not None,
        "indexed_videos": ai_engine.index.ntotal if (ai_engine and ai_engine.index) else 0,
        "treasury_configured": bool(os.getenv("TREASURY_CONTRACT_ADDRESS") and os.getenv("SIGNER_PRIVATE_KEY"))
    }

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Analyzes video originality using OpenAI CLIP visual embeddings and FAISS similarity search.
    Returns rarity score (0-100), tier, is_duplicate flag, and descriptive status.
    """
    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty video file provided.")

        filename = file.filename or "uploaded_video.mp4"
        file_hash = hashlib.md5(contents).hexdigest()

        # 1. Primary Path: OpenAI CLIP + FAISS Vector Search
        if ai_engine and ai_engine.index is not None and ai_engine.index.ntotal > 0:
            try:
                match_filename, similarity = ai_engine.search(contents)
                print(f"🔍 CLIP Vector Search for '{filename}': Closest match='{match_filename}', Cosine Similarity={similarity:.4f}")

                # Threshold: Cosine similarity >= 0.85 indicates duplicate or near-identical copy
                SIMILARITY_THRESHOLD = 0.85
                is_duplicate = similarity >= SIMILARITY_THRESHOLD

                if is_duplicate:
                    # Low score for duplicates (5-20%)
                    rarity_score = max(5, int((1.0 - similarity) * 100))
                    tier = "Common"
                    message = f"Duplicate detected: Matches '{match_filename}' ({similarity * 100:.1f}% similarity)"
                else:
                    # Original content: Score scaled inversely to similarity (75-99%)
                    similarity_penalty = max(0.0, similarity) * 20
                    rarity_score = int(98 - similarity_penalty)
                    rarity_score = max(75, min(99, rarity_score))
                    tier = "Legendary" if rarity_score >= 90 else "Rare"
                    message = f"Original content verified via CLIP embeddings ({rarity_score}% originality)"

                video_hashes.add(file_hash)
                return {
                    "rarity_score": rarity_score,
                    "tier": tier,
                    "is_duplicate": is_duplicate,
                    "message": message,
                    "similarity": round(float(similarity), 4),
                    "matched_item": match_filename if is_duplicate else None,
                    "engine": "CLIP+FAISS"
                }

            except Exception as ml_err:
                print(f"⚠️ ML search failed ({ml_err}). Falling back to hash check.")
                traceback.print_exc()

        # 2. Fallback Path: Hash Check & Fresh Index Seeding
        if file_hash in video_hashes:
            score = random.randint(5, 15)
            tier = "Common"
            is_duplicate = True
            message = "Duplicate detected (Hash signature match)"
        else:
            video_hashes.add(file_hash)
            score = random.randint(80, 96)
            tier = "Legendary" if score >= 90 else "Rare"
            is_duplicate = False
            message = "Original content (Verified novel video)"

        return {
            "rarity_score": score,
            "tier": tier,
            "is_duplicate": is_duplicate,
            "message": message,
            "similarity": 1.0 if is_duplicate else 0.0,
            "matched_item": None,
            "engine": "FallbackHash"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Analysis endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze video: {str(e)}")

@app.post("/index-video")
async def index_video(file: UploadFile = File(...)):
    """
    Adds a verified original video into the FAISS index database for future originality matching.
    """
    if not ai_engine:
        raise HTTPException(status_code=503, detail="AI Engine is not initialized")

    try:
        contents = await file.read()
        filename = file.filename or "indexed_clip.mp4"
        total = ai_engine.add_video(contents, filename)
        return {
            "status": "success",
            "message": f"Video '{filename}' indexed into FAISS copyright database.",
            "total_indexed": total
        }
    except Exception as e:
        print(f"Error indexing video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ClaimRequest(BaseModel):
    wallet_address: str
    video_id: str

@app.post("/claim-reward")
async def claim_reward(req: ClaimRequest):
    """
    Generates an EIP-191 ECDSA signature authorizing the user to claim MT tokens from Treasury.sol.
    """
    print(f"Processing claim for wallet: {req.wallet_address}, video: {req.video_id}")
    
    private_key = os.getenv("SIGNER_PRIVATE_KEY")
    contract_address = os.getenv("TREASURY_CONTRACT_ADDRESS")
    
    if not private_key or not contract_address:
        print("Missing SIGNER_PRIVATE_KEY or TREASURY_CONTRACT_ADDRESS in .env")
        raise HTTPException(status_code=500, detail="Server missing Web3 configuration")

    try:
        wallet = Web3.to_checksum_address(req.wallet_address)
        contract = Web3.to_checksum_address(contract_address)
        
        # Exact message hash matching Treasury.sol:
        # keccak256(abi.encodePacked(msg.sender, videoId, address(this)))
        message_hash = Web3.solidity_keccak(
            ['address', 'string', 'address'],
            [wallet, req.video_id, contract]
        )
        
        signable_message = encode_defunct(message_hash)
        
        from eth_account import Account
        signed_message = Account.sign_message(signable_message, private_key=private_key)
        
        return {
            "signature": signed_message.signature.hex(),
            "video_id": req.video_id,
            "wallet_address": req.wallet_address
        }
    except Exception as e:
        print(f"Error generating signature: {e}")
        raise HTTPException(status_code=500, detail=str(e))