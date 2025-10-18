import numpy as np
from .features import rgb_to_hsv_np

def detect_green_tiles(img_rgb: np.ndarray, tile=32, thresh=0.20):
    H, W, _ = img_rgb.shape
    hsv = rgb_to_hsv_np(img_rgb)
    h, s, v = hsv[...,0], hsv[...,1], hsv[...,2]
    green = (h >= 25) & (h <= 100) & (s >= 0.15) & (v >= 0.15)

    grid_h = (H + tile - 1) // tile
    grid_w = (W + tile - 1) // tile
    grid = np.zeros((grid_h, grid_w), dtype=np.uint8)

    for gy in range(grid_h):
        for gx in range(grid_w):
            y1, y2 = gy*tile, min((gy+1)*tile, H)
            x1, x2 = gx*tile, min((gx+1)*tile, W)
            block = green[y1:y2, x1:x2]
            ratio = block.mean() if block.size > 0 else 0.0
            if ratio >= thresh:
                grid[gy, gx] = 1

    # Merge adjacent 1-tiles into components (4-connectivity)
    visited = np.zeros_like(grid, dtype=bool)
    boxes = []
    for gy in range(grid_h):
        for gx in range(grid_w):
            if grid[gy, gx] == 1 and not visited[gy, gx]:
                stack = [(gy, gx)]
                visited[gy, gx] = True
                miny = minx = 10**9
                maxy = maxx = -1
                while stack:
                    cy, cx = stack.pop()
                    miny = min(miny, cy); maxy = max(maxy, cy)
                    minx = min(minx, cx); maxx = max(maxx, cx)
                    for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                        ny, nx = cy+dy, cx+dx
                        if 0 <= ny < grid_h and 0 <= nx < grid_w:
                            if grid[ny, nx] == 1 and not visited[ny, nx]:
                                visited[ny, nx] = True
                                stack.append((ny, nx))
                # Convert tile box → pixel box
                x1 = int(minx * tile)
                y1 = int(miny * tile)
                x2 = int(min((maxx+1) * tile, W))
                y2 = int(min((maxy+1) * tile, H))
                if (x2 - x1) > 8 and (y2 - y1) > 8:
                    boxes.append([x1, y1, x2, y2])
    return boxes
