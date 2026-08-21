"""
Mahjong Tile Slice & Asset Generator
Extracts all 34 tiles from user-uploaded images and updates static/tiles/ and frontend/public/tiles/
"""

import os
from PIL import Image, ImageOps

IMG1_PATH = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787108269515.png"
IMG2_PATH = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787108281881.png"
IMG3_PATH = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787108291476.png"

TARGET_DIRS = [
    r"c:\Users\alfre\Desktop\antigravity\cli\static\tiles",
    r"c:\Users\alfre\Desktop\antigravity\cli\frontend\public\tiles",
    r"c:\Users\alfre\Desktop\antigravity\cli\frontend\dist\tiles"
]

def ensure_dirs():
    for d in TARGET_DIRS:
        os.makedirs(d, exist_ok=True)

def crop_and_save(img, x1, y1, x2, y2, code):
    # Crop the exact tile rounded rectangle
    cropped = img.crop((x1, y1, x2, y2))
    
    # Save to all target directories
    for d in TARGET_DIRS:
        out_path = os.path.join(d, f"{code}.png")
        cropped.save(out_path, format="PNG")
    print(f"Saved tile {code}: bbox=({x1}, {y1}, {x2}, {y2}) size={x2-x1}x{y2-y1}")

def extract_all_tiles():
    ensure_dirs()
    
    img1 = Image.open(IMG1_PATH).convert("RGBA")
    img2 = Image.open(IMG2_PATH).convert("RGBA")
    img3 = Image.open(IMG3_PATH).convert("RGBA")
    
    # Standard column x spans for 8-column sheets
    # img1 cols:
    cols_img1 = [
        (2, 114),
        (125, 237),
        (247, 358),
        (371, 483),
        (496, 607),
        (618, 729),
        (740, 851),
        (864, 975)
    ]
    
    # img1 row y ranges:
    r0_y = (0, 154)
    r1_y = (172, 326)
    r2_y = (344, 497)
    
    # 1. img1 Row 0: 1p .. 8p
    r0_tiles = ["1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p"]
    for c_idx, code in enumerate(r0_tiles):
        x1, x2 = cols_img1[c_idx]
        y1, y2 = r0_y
        crop_and_save(img1, x1, y1, x2, y2, code)
        
    # 2. img1 Row 1: 9p, 1s .. 7s
    r1_tiles = ["9p", "1s", "2s", "3s", "4s", "5s", "6s", "7s"]
    for c_idx, code in enumerate(r1_tiles):
        x1, x2 = cols_img1[c_idx]
        y1, y2 = r1_y
        crop_and_save(img1, x1, y1, x2, y2, code)
        
    # 3. img1 Row 2: 8s, 9s, 1m, 2m, 4m, 3m, 5m, 6m (Note position of 4m and 3m in sheet!)
    r2_tiles = ["8s", "9s", "1m", "2m", "4m", "3m", "5m", "6m"]
    for c_idx, code in enumerate(r2_tiles):
        x1, x2 = cols_img1[c_idx]
        y1, y2 = r2_y
        crop_and_save(img1, x1, y1, x2, y2, code)

    # 4. img2 Row 0: 7m, 8m, 9m, 1z (E), 2z (S), 3z (W), 4z (N), 5z (C - Red Dragon)
    cols_img2 = [
        (4, 112),
        (126, 237),
        (249, 360),
        (372, 482),
        (496, 606),
        (619, 726),
        (742, 852),
        (866, 974)
    ]
    img2_tiles = ["7m", "8m", "9m", "1z", "2z", "3z", "4z", "5z"]
    for c_idx, code in enumerate(img2_tiles):
        x1, x2 = cols_img2[c_idx]
        y1, y2 = 14, 167
        crop_and_save(img2, x1, y1, x2, y2, code)

    # 5. img3 Row 0: 6z (F - Green Dragon), 7z (B - White Dragon)
    cols_img3 = [
        (3, 115),
        (126, 237)
    ]
    img3_tiles = ["6z", "7z"]
    for c_idx, code in enumerate(img3_tiles):
        x1, x2 = cols_img3[c_idx]
        y1, y2 = 5, 159
        crop_and_save(img3, x1, y1, x2, y2, code)

    print("\nSuccessfully extracted all 34 tiles!")

if __name__ == "__main__":
    extract_all_tiles()
