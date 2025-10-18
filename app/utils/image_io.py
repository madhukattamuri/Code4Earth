from io import BytesIO
from PIL import Image
import numpy as np

def load_image_from_upload(upload) -> Image.Image:
    # upload: starlette.datastructures.UploadFile
    img = Image.open(upload.file).convert("RGB")
    return img

def pil_to_numpy(img: Image.Image) -> np.ndarray:
    return np.array(img)

def numpy_to_pil(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(arr.astype("uint8"))

def resize_max_side(img: Image.Image, max_side: int = 1024) -> Image.Image:
    w, h = img.size
    scale = max(w, h) / max_side if max(w, h) > max_side else 1.0
    if scale > 1.0:
        new_w, new_h = int(w / scale), int(h / scale)
        return img.resize((new_w, new_h), Image.LANCZOS)
    return img
