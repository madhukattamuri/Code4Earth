import json, math
import numpy as np
from pathlib import Path
from .features import compute_basic_color_features, vectorize_features

def load_prototypes(model_path: str):
    data = json.loads(Path(model_path).read_text(encoding="utf-8"))
    # Return dict: class -> vector(np), and optional 'scale' for feature scaling
    protos = {}
    for k, v in data["prototypes"].items():
        protos[k] = np.array(v, dtype=np.float32)
    scale = np.array(data.get("scale", [1.0]*9), dtype=np.float32)
    return protos, scale

def softmax(x):
    x = np.array(x, dtype=np.float32)
    x = x - np.max(x)
    ex = np.exp(x)
    return ex / np.sum(ex)

def classify(img_rgb, model_path: str):
    protos, scale = load_prototypes(model_path)
    feat = compute_basic_color_features(img_rgb)
    vec = vectorize_features(feat) * scale

    # Convert prototype distances into "logits" (negative distance)
    logits = []
    classes = list(protos.keys())
    for c in classes:
        d = np.linalg.norm(vec - protos[c]*scale)
        logits.append(-float(d))
    probs = softmax(logits)
    best_idx = int(np.argmax(probs))
    return {
        "label": classes[best_idx],
        "confidence": float(probs[best_idx]),
        "scores": {cls: float(p) for cls, p in zip(classes, probs)},
        "features": feat
    }
