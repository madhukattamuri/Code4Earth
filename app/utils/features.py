import numpy as np

def rgb_to_hsv_np(img_rgb: np.ndarray) -> np.ndarray:
    # img: HxWx3 in [0..255]
    arr = img_rgb.astype(np.float32) / 255.0
    r, g, b = arr[...,0], arr[...,1], arr[...,2]
    mx = np.max(arr, axis=-1)
    mn = np.min(arr, axis=-1)
    diff = mx - mn + 1e-8

    h = np.zeros_like(mx)
    mask = diff > 1e-8
    r_is_max = (mx == r) & mask
    g_is_max = (mx == g) & mask
    b_is_max = (mx == b) & mask

    h[r_is_max] = (60 * ((g[r_is_max]-b[r_is_max]) / diff[r_is_max]) + 360) % 360
    h[g_is_max] = (60 * ((b[g_is_max]-r[g_is_max]) / diff[g_is_max]) + 120) % 360
    h[b_is_max] = (60 * ((r[b_is_max]-g[b_is_max]) / diff[b_is_max]) + 240) % 360

    s = np.where(mx > 1e-6, diff / (mx + 1e-8), 0.0)
    v = mx
    hsv = np.stack([h, s, v], axis=-1)
    return hsv

def compute_basic_color_features(img_rgb: np.ndarray) -> dict:
    # ratios for green, brown (rust-like), white/gray (powdery), plus RGB means/stds
    hsv = rgb_to_hsv_np(img_rgb)
    h, s, v = hsv[...,0], hsv[...,1], hsv[...,2]

    green_mask = (h >= 25) & (h <= 100) & (s >= 0.15) & (v >= 0.15)
    brown_mask = (h >= 10) & (h <= 25) & (s >= 0.25) & (v <= 0.78)
    pale_mask  = (s <= 0.12) & (v >= 0.78)  # white/gray-ish (powdery)

    total = img_rgb.shape[0]*img_rgb.shape[1]
    green_ratio = float(np.sum(green_mask)) / max(1,total)
    brown_ratio = float(np.sum(brown_mask)) / max(1,total)
    pale_ratio  = float(np.sum(pale_mask))  / max(1,total)

    mean_rgb = img_rgb.reshape(-1,3).mean(axis=0).tolist()
    std_rgb  = img_rgb.reshape(-1,3).std(axis=0).tolist()

    return {
        "green_ratio": green_ratio,
        "brown_ratio": brown_ratio,
        "pale_ratio": pale_ratio,
        "mean_r": mean_rgb[0], "mean_g": mean_rgb[1], "mean_b": mean_rgb[2],
        "std_r": std_rgb[0],   "std_g": std_rgb[1],   "std_b": std_rgb[2],
    }

def vectorize_features(feat: dict) -> np.ndarray:
    return np.array([
        feat["green_ratio"], feat["brown_ratio"], feat["pale_ratio"],
        feat["mean_r"], feat["mean_g"], feat["mean_b"],
        feat["std_r"], feat["std_g"], feat["std_b"],
    ], dtype=np.float32)
