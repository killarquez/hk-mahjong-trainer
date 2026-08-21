"""
Precise Grid Crop Script for Mahjong Tile Sheet.
Slices exact tile faces into static/tiles/{code}.png.
"""

import os
from PIL import Image

def slice_exact_tiles():
    img_path = 'C:/Users/alfre/.gemini/antigravity/brain/af6b0c68-4aad-44b2-80e9-98d0d667a334/media__1786863108427.png'
    img = Image.open(img_path)
    os.makedirs('static/tiles', exist_ok=True)

    # 1. Row 0: Winds & Dragons (7 tiles)
    # Codes: 1z, 2z, 3z, 4z, 5z, 6z, 7z
    row0_y1, row0_y2 = 10, 92
    r0_codes = ["1z", "2z", "3z", "4z", "5z", "6z", "7z"]
    # Total width ~ 556px starting around x=10
    tile_w_r0 = (555 - 10) / 7.0
    for i, code in enumerate(r0_codes):
        x1 = int(10 + i * tile_w_r0 + 2)
        x2 = int(10 + (i + 1) * tile_w_r0 - 2)
        crop_tile(img, x1, row0_y1, x2, row0_y2, code)

    # 2. Row 2: Characters (9 tiles: 1m to 9m)
    row2_y1, row2_y2 = 212, 294
    tile_w_9 = (555 - 10) / 9.0
    for i in range(9):
        code = f"{i+1}m"
        x1 = int(10 + i * tile_w_9 + 2)
        x2 = int(10 + (i + 1) * tile_w_9 - 2)
        crop_tile(img, x1, row2_y1, x2, row2_y2, code)

    # 3. Row 3: Dots (9 tiles: 1p to 9p)
    row3_y1, row3_y2 = 312, 394
    for i in range(9):
        code = f"{i+1}p"
        x1 = int(10 + i * tile_w_9 + 2)
        x2 = int(10 + (i + 1) * tile_w_9 - 2)
        crop_tile(img, x1, row3_y1, x2, row3_y2, code)

    # 4. Row 4: Bamboos (9 tiles: 1s to 9s)
    row4_y1, row4_y2 = 413, 495
    for i in range(9):
        code = f"{i+1}s"
        x1 = int(10 + i * tile_w_9 + 2)
        x2 = int(10 + (i + 1) * tile_w_9 - 2)
        crop_tile(img, x1, row4_y1, x2, row4_y2, code)

def crop_tile(img, x1, y1, x2, y2, code):
    cropped = img.crop((x1, y1, x2, y2))
    save_path = f"static/tiles/{code}.png"
    cropped.save(save_path)
    print(f"Saved {code} -> {save_path} (size: {x2-x1}x{y2-y1})")

if __name__ == "__main__":
    slice_exact_tiles()
