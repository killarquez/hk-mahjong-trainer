"""
Mahjong Tile Notation Parser and Validator.
Supports standard compact notation (e.g., '123m456p789s111z55z') and spaced terms ('1m 2m 3m East East').
Enforces 136-tile deck rules (no flowers, max 4 of each tile type).
"""

import re
from typing import List, Dict, Any, Tuple
from lexicon import TILE_LOOKUP

# Shorthand alias mappings for user friendly input
TEXT_ALIASES: Dict[str, str] = {
    "east": "1z", "dung": "1z", "東": "1z",
    "south": "2z", "naam": "2z", "南": "2z",
    "west": "3z", "sai": "3z", "西": "3z",
    "north": "4z", "bak": "4z", "北": "4z",
    "red": "5z", "middle": "5z", "zung": "5z", "中": "5z", "紅中": "5z",
    "green": "6z", "faat": "6z", "發": "6z", "發財": "6z",
    "white": "7z", "board": "7z", "baak": "7z", "白": "7z", "白板": "7z"
}

def parse_tile_string(raw_input: str) -> Tuple[List[str], List[str]]:
    """
    Parses a string input into a sorted list of standard tile codes (e.g. ['1m', '2m', '3m', ...]).
    Returns (tile_codes, error_messages).
    """
    tiles: List[str] = []
    errors: List[str] = []
    text = raw_input.strip()

    if not text:
        return tiles, ["Input string is empty."]

    # Step 1: Replace text aliases (like "East", "紅中", etc.)
    tokens = text.split()
    if len(tokens) > 1 or any(alias in text.lower() for alias in TEXT_ALIASES):
        for token in tokens:
            lower_token = token.lower().strip()
            if lower_token in TEXT_ALIASES:
                tiles.append(TEXT_ALIASES[lower_token])
            elif lower_token in TILE_LOOKUP:
                tiles.append(lower_token)
            else:
                sub_tiles, sub_errs = parse_compact_notation(token)
                if sub_tiles:
                    tiles.extend(sub_tiles)
                else:
                    errors.append(f"Unrecognized tile token: '{token}'")
    else:
        tiles, errors = parse_compact_notation(text)

    tiles.sort(key=tile_sort_key)
    validation_errs = validate_hand(tiles)
    errors.extend(validation_errs)

    return tiles, errors


def parse_compact_notation(compact: str) -> Tuple[List[str], List[str]]:
    """Parse compact mahjong string like '123m456p789s111z55z'."""
    tiles: List[str] = []
    errors: List[str] = []

    pattern = re.compile(r'([1-9]+)([mpsz])', re.IGNORECASE)
    matches = pattern.findall(compact)

    if not matches:
        return tiles, [f"Could not parse compact notation: '{compact}'"]

    for digits, suit in matches:
        suit = suit.lower()
        for digit in digits:
            code = f"{digit}{suit}"
            if code in TILE_LOOKUP:
                tiles.append(code)
            else:
                errors.append(f"Invalid tile code: {code}")

    return tiles, errors


def tile_sort_key(code: str) -> Tuple[int, int]:
    """Sort key helper: m=0, p=1, s=2, z=3."""
    suit_order = {'m': 0, 'p': 1, 's': 2, 'z': 3}
    if len(code) == 2 and code[0].isdigit() and code[1] in suit_order:
        return (suit_order[code[1]], int(code[0]))
    return (9, 9)


def validate_hand(tiles: List[str]) -> List[str]:
    """Validate 136-tile deck rules (max 4 per tile, valid tiles only)."""
    errors = []
    counts: Dict[str, int] = {}
    
    for t in tiles:
        if t not in TILE_LOOKUP:
            errors.append(f"Invalid tile '{t}' in hand.")
            continue
        counts[t] = counts.get(t, 0) + 1
        if counts[t] > 4:
            errors.append(f"Tile '{TILE_LOOKUP[t]['chinese']}' ({t}) exceeds 4 copies limit in a 136-tile deck.")

    return errors


def format_tiles_cantonese(tiles: List[str]) -> List[Dict[str, Any]]:
    """Format list of tile codes into rich Cantonese & English tile dictionaries."""
    formatted = []
    for t in tiles:
        if t in TILE_LOOKUP:
            info = TILE_LOOKUP[t]
            formatted.append({
                "code": t,
                "chinese": info["chinese"],
                "jyutping": info["jyutping"],
                "english": info.get("english", t),
                "suit": info["suit"],
                "value": info["value"],
                "is_terminal": info["is_terminal"],
                "is_honor": info["is_honor"]
            })
    return formatted
