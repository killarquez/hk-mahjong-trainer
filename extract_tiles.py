"""
Extracts individual Mahjong tile images from uploaded composite image.
Saves cropped tiles to static/tiles/{code}.png.
"""

import os
from PIL import Image

def process_tiles():
    img_path = 'C:/Users/alfre/.gemini/antigravity/brain/af6b0c68-4aad-44b2-80e9-98d0d667a334/media__1786863108427.png'
    img = Image.open(img_path).convert('RGB')
    width, height = img.size

    os.makedirs('static/tiles', exist_ok=True)

    # Convert to grayscale / threshold to find non-green areas (white tiles)
    # Green background is typically high in Green channel, low in Red channel
    # White tiles have high Red, Green, Blue values.
    
    # We can calculate bounding boxes based on grid coordinates or thresholding
    # Let's inspect rows by scanning vertical intensity of white pixels
    
    # Let's find white pixel mask: R > 200 and G > 200 and B > 200
    pixels = img.load()
    
    # Simple grid approximation based on tile layout in (568 x 515) image:
    # Top margin ~ 18px, bottom margin ~ 500px
    # Height of each row is roughly ~ 90px
    
    # Let's locate the 5 rows by scanning horizontal projection of white pixels:
    row_mask = []
    for y in range(height):
        white_count = sum(1 for x in range(width) if pixels[x, y][0] > 220 and pixels[x, y][1] > 220 and pixels[x, y][2] > 220)
        row_mask.append(white_count > 100) # True if line passes through white tiles

    # Find row Y ranges
    rows = []
    in_row = False
    start_y = 0
    for y, is_white in enumerate(row_mask):
        if is_white and not in_row:
            in_row = True
            start_y = y
        elif not is_white and in_row:
            in_row = False
            if y - start_y > 40: # Minimum tile height
                rows.append((start_y, y))

    print(f"Found {len(rows)} rows: {rows}")

    # Row 0: Winds & Dragons (7 tiles) -> 1z, 2z, 3z, 4z, 5z, 6z, 7z
    # Row 1: Flowers (8 tiles) -> skip or store
    # Row 2: Characters (9 tiles) -> 1m to 9m
    # Row 3: Dots (9 tiles) -> 1p to 9p
    # Row 4: Bamboos (9 tiles) -> 1s to 9s

    row_mapping = {
        0: ["1z", "2z", "3z", "4z", "5z", "6z", "7z"],
        1: [f"flower_{i}" for i in range(1, 9)],
        2: [f"{i}m" for i in range(1, 10)],
        3: [f"{i}p" for i in range(1, 10)],
        4: [f"{i}s" for i in range(1, 10)],
    }

    for r_idx, (y1, y2) in enumerate(rows):
        if r_idx not in row_mapping:
            continue
            
        codes = row_mapping[r_idx]
        
        # Scan horizontal profile within row to locate individual tiles (X ranges)
        col_mask = []
        for x in range(width):
            white_in_col = sum(1 for y in range(y1, y2) if pixels[x, y][0] > 220 and pixels[x, y][1] > 220 and pixels[x, y][2] > 220)
            col_mask.append(white_in_col > 20)

        cols = []
        in_col = False
        start_x = 0
        for x, is_white in enumerate(col_mask):
            if is_white and not in_col:
                in_col = True
                start_x = x
            elif not is_white and in_col:
                in_col = False
                if x - start_x > 25: # Minimum tile width
                    cols.append((start_x, x))

        print(f"Row {r_idx} ({len(codes)} expected): found {len(cols)} tiles.")

        for c_idx, (x1, x2) in enumerate(cols):
            if c_idx < len(codes):
                code = codes[c_idx]
                if code.startswith("flower"):
                    continue
                    
                # Add small padding or crop exactly
                cropped = img.crop((x1, y1, x2, y2))
                save_path = f"static/tiles/{code}.png"
                cropped.save(save_path)
                print(f"Saved {code} -> {save_path} ({x2-x1}x{y2-y1})")

if __name__ == "__main__":
    process_tiles()
