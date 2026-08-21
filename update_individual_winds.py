"""
Generate and update all 34 Mahjong tiles with the individual winds and dragons.
"""

import os
from PIL import Image

TARGET_DIRS = [
    r"c:\Users\alfre\Desktop\antigravity\cli\static\tiles",
    r"c:\Users\alfre\Desktop\antigravity\cli\frontend\public\tiles",
    r"c:\Users\alfre\Desktop\antigravity\cli\frontend\dist\tiles"
]

IMG1_PATH = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787108269515.png"
IMG2_PATH = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787108281881.png"
IMG3_PATH = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787108291476.png"

# Individual Wind Images uploaded by user:
EAST_IMG = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787109310734.png"
SOUTH_IMG = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787109334532.png"
WEST_IMG = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787109322492.png"
NORTH_IMG = r"C:/Users/alfre/.gemini/antigravity/brain/8f0154ab-38f9-441f-acd1-a27c9f95a6f7/.user_uploaded/media_1787109344810.png"

def save_tile(img, code):
    for d in TARGET_DIRS:
        os.makedirs(d, exist_ok=True)
        out_p = os.path.join(d, f"{code}.png")
        img.save(out_p, format="PNG")
    print(f"Saved {code}.png (size={img.size})")

def process_all():
    img1 = Image.open(IMG1_PATH).convert("RGBA")
    img2 = Image.open(IMG2_PATH).convert("RGBA")
    img3 = Image.open(IMG3_PATH).convert("RGBA")

    # 1. Dots (1p .. 9p)
    # Row 0 of img1: 1p .. 8p
    dots_r0_cols = [
        (2, 114), (125, 237), (247, 358), (371, 483),
        (496, 607), (618, 729), (740, 851), (864, 975)
    ]
    for idx, (x1, x2) in enumerate(dots_r0_cols):
        tile_code = f"{idx + 1}p"
        crop = img1.crop((x1, 0, x2, 154))
        save_tile(crop, tile_code)
    # 9p is Row 1 Col 0 of img1
    crop_9p = img1.crop((2, 172, 114, 326))
    save_tile(crop_9p, "9p")

    # 2. Bamboos (1s .. 9s)
    # Row 1 of img1: 1s .. 7s (Cols 1 .. 7)
    bamboo_r1_cols = [
        (125, 237), (247, 358), (371, 483),
        (496, 607), (618, 729), (740, 851), (864, 975)
    ]
    for idx, (x1, x2) in enumerate(bamboo_r1_cols):
        tile_code = f"{idx + 1}s"
        crop = img1.crop((x1, 172, x2, 326))
        save_tile(crop, tile_code)
    # 8s & 9s are Row 2 Cols 0 & 1 of img1
    crop_8s = img1.crop((2, 344, 114, 497))
    save_tile(crop_8s, "8s")
    crop_9s = img1.crop((125, 344, 237, 497))
    save_tile(crop_9s, "9s")

    # 3. Characters (1m .. 9m)
    # Row 2 of img1: 1m, 2m, 4m (index 4), 3m (index 5), 5m, 6m
    crop_1m = img1.crop((247, 344, 358, 497))
    save_tile(crop_1m, "1m")
    crop_2m = img1.crop((371, 344, 483, 497))
    save_tile(crop_2m, "2m")
    crop_4m = img1.crop((496, 344, 607, 497))
    save_tile(crop_4m, "4m")
    crop_3m = img1.crop((618, 344, 729, 497))
    save_tile(crop_3m, "3m")
    crop_5m = img1.crop((740, 344, 851, 497))
    save_tile(crop_5m, "5m")
    crop_6m = img1.crop((864, 344, 975, 497))
    save_tile(crop_6m, "6m")
    # 7m, 8m, 9m from img2 Cols 0, 1, 2
    crop_7m = img2.crop((4, 14, 112, 167))
    save_tile(crop_7m, "7m")
    crop_8m = img2.crop((126, 14, 237, 167))
    save_tile(crop_8m, "8m")
    crop_9m = img2.crop((249, 14, 360, 167))
    save_tile(crop_9m, "9m")

    # 4. Winds (1z, 2z, 3z, 4z) from User Individual Uploads
    # 1z: East (東)
    east_img = Image.open(EAST_IMG).convert("RGBA")
    save_tile(east_img, "1z")
    # 2z: South (南)
    south_img = Image.open(SOUTH_IMG).convert("RGBA")
    save_tile(south_img, "2z")
    # 3z: West (西)
    west_img = Image.open(WEST_IMG).convert("RGBA")
    save_tile(west_img, "3z")
    # 4z: North (北)
    north_img = Image.open(NORTH_IMG).convert("RGBA")
    save_tile(north_img, "4z")

    # 5. Dragons (5z, 6z, 7z)
    # 5z: Red Dragon (中 / C) from img2 Col 7
    crop_5z = img2.crop((864, 14, 974, 167))
    save_tile(crop_5z, "5z")
    # 6z: Green Dragon (發 / F) from img3 Col 0
    crop_6z = img3.crop((3, 5, 115, 159))
    save_tile(crop_6z, "6z")
    # 7z: White Dragon (白 / B frame) from img3 Col 1
    crop_7z = img3.crop((125, 5, 237, 159))
    save_tile(crop_7z, "7z")

    print("\nAll 34 tiles successfully updated!")

if __name__ == "__main__":
    process_all()
