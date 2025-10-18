from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import json
from sqlalchemy.orm import Session

# image pipeline
from app.utils.image_io import load_image_from_upload, pil_to_numpy, resize_max_side
from app.utils.detection import detect_green_tiles
from app.utils.disease import classify

# DB & Auth
from app.db import Base, engine
from app.db_models import User
from app.schemas import UserCreate, UserLogin, UserOut, Token
from app.auth import (
    get_db, get_current_user, get_password_hash, verify_password, create_access_token
)

app = FastAPI(title="Crop & Disease Detection (Demo)")

# create tables on startup
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- health ----------
@app.get("/api/health")
def health():
    return {"ok": True}

# ---------- auth ----------
@app.post("/api/auth/signup", response_model=Token, status_code=201)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current

# ---------- detection ----------
@app.post("/api/detect-crops")
async def detect_crops(file: UploadFile = File(...)):
    img = load_image_from_upload(file)
    img = resize_max_side(img, max_side=1024)
    arr = pil_to_numpy(img)
    boxes = detect_green_tiles(arr, tile=32, thresh=0.18)
    w, h = img.size
    return JSONResponse({"image_size": [w, h], "boxes": boxes})

@app.post("/api/detect-disease")
async def detect_disease(file: UploadFile = File(...), lang: str = "en"):
    img = load_image_from_upload(file)
    img = resize_max_side(img, max_side=1024)
    arr = pil_to_numpy(img)

    model_path = Path(__file__).resolve().parent / "models" / "disease_prototypes.json"
    result = classify(arr, str(model_path))

    advice_path = Path(__file__).resolve().parent / "models" / "advice_i18n.json"
    advice_all = {}
    if advice_path.exists():
        advice_all = json.loads(advice_path.read_text(encoding="utf-8"))
    lang = lang if lang in {"en", "hi", "te"} else "en"
    advice_lang = advice_all.get(lang, advice_all.get("en", {}))

    label = result.get("label", "")
    result["advice"] = advice_lang.get(label, advice_lang.get("Generic", {}))
    return JSONResponse(result)

# ---------- static (mount last) ----------
web_dir = Path(__file__).resolve().parent.parent / "web"
app.mount("/", StaticFiles(directory=str(web_dir), html=True), name="static")
