"""
Mahjong Tile Data Structures, Deck Representation, and Utilities.
TVB 2026 Rules: 34 Standard Tile Types (136 total, 0 flowers).
"""

import random
import re
from typing import List, Dict, Any, Tuple, Optional

# Canonical 34 tile types
ALL_TILE_CODES: List[str] = [
    # 0..8: Characters (萬子)
    "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
    # 9..17: Dots / Circles (筒子)
    "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
    # 18..26: Bamboos (索子)
    "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
    # 27..30: Winds (風牌)
    "1z", "2z", "3z", "4z",
    # 31..33: Dragons (三元牌)
    "5z", "6z", "7z"
]

TILE_INDEX_MAP: Dict[str, int] = {code: i for i, code in enumerate(ALL_TILE_CODES)}
INDEX_TILE_MAP: Dict[int, str] = {i: code for i, code in enumerate(ALL_TILE_CODES)}

# Unicode Mahjong Glyphs for rich display
TILE_UNICODE_MAP: Dict[str, str] = {
    "1m": "🀇", "2m": "🀈", "3m": "🀉", "4m": "🀊", "5m": "🀋", "6m": "🀌", "7m": "🀍", "8m": "🀎", "9m": "🀏",
    "1p": "🀙", "2p": "🀚", "3p": "🀛", "4p": "🀜", "5p": "🀝", "6p": "🀞", "7p": "🀟", "8p": "🀠", "9p": "🀡",
    "1s": "🀐", "2s": "🀑", "3s": "🀒", "4s": "🀓", "5s": "🀔", "6s": "🀕", "7s": "🀖", "8s": "🀗", "9s": "🀘",
    "1z": "🀀", "2z": "🀁", "3z": "🀂", "4z": "🀃",
    "5z": "🀄", "6z": "🀅", "7z": "🀆"
}

TILE_INFO_MAP: Dict[str, Dict[str, Any]] = {
    # Characters (萬)
    "1m": {"chinese": "一萬", "jyutping": "jat1 maan6", "english": "1 Character", "suit": "m", "value": 1, "is_terminal": True, "is_honor": False, "unicode": "🀇"},
    "2m": {"chinese": "二萬", "jyutping": "ji6 maan6", "english": "2 Character", "suit": "m", "value": 2, "is_terminal": False, "is_honor": False, "unicode": "🀈"},
    "3m": {"chinese": "三萬", "jyutping": "saam1 maan6", "english": "3 Character", "suit": "m", "value": 3, "is_terminal": False, "is_honor": False, "unicode": "🀉"},
    "4m": {"chinese": "四萬", "jyutping": "sei3 maan6", "english": "4 Character", "suit": "m", "value": 4, "is_terminal": False, "is_honor": False, "unicode": "🀊"},
    "5m": {"chinese": "五萬", "jyutping": "ng5 maan6", "english": "5 Character", "suit": "m", "value": 5, "is_terminal": False, "is_honor": False, "unicode": "🀋"},
    "6m": {"chinese": "六萬", "jyutping": "luk6 maan6", "english": "6 Character", "suit": "m", "value": 6, "is_terminal": False, "is_honor": False, "unicode": "🀌"},
    "7m": {"chinese": "七萬", "jyutping": "cat1 maan6", "english": "7 Character", "suit": "m", "value": 7, "is_terminal": False, "is_honor": False, "unicode": "🀍"},
    "8m": {"chinese": "八萬", "jyutping": "baat3 maan6", "english": "8 Character", "suit": "m", "value": 8, "is_terminal": False, "is_honor": False, "unicode": "🀎"},
    "9m": {"chinese": "九萬", "jyutping": "gau2 maan6", "english": "9 Character", "suit": "m", "value": 9, "is_terminal": True, "is_honor": False, "unicode": "🀏"},

    # Dots (筒)
    "1p": {"chinese": "一筒", "jyutping": "jat1 tung4", "english": "1 Dot", "suit": "p", "value": 1, "is_terminal": True, "is_honor": False, "unicode": "🀙"},
    "2p": {"chinese": "二筒", "jyutping": "ji6 tung4", "english": "2 Dot", "suit": "p", "value": 2, "is_terminal": False, "is_honor": False, "unicode": "🀚"},
    "3p": {"chinese": "三筒", "jyutping": "saam1 tung4", "english": "3 Dot", "suit": "p", "value": 3, "is_terminal": False, "is_honor": False, "unicode": "🀛"},
    "4p": {"chinese": "四筒", "jyutping": "sei3 tung4", "english": "4 Dot", "suit": "p", "value": 4, "is_terminal": False, "is_honor": False, "unicode": "🀜"},
    "5p": {"chinese": "五筒", "jyutping": "ng5 tung4", "english": "5 Dot", "suit": "p", "value": 5, "is_terminal": False, "is_honor": False, "unicode": "🀝"},
    "6p": {"chinese": "六筒", "jyutping": "luk6 tung4", "english": "6 Dot", "suit": "p", "value": 6, "is_terminal": False, "is_honor": False, "unicode": "🀞"},
    "7p": {"chinese": "七筒", "jyutping": "cat1 tung4", "english": "7 Dot", "suit": "p", "value": 7, "is_terminal": False, "is_honor": False, "unicode": "🀟"},
    "8p": {"chinese": "八筒", "jyutping": "baat3 tung4", "english": "8 Dot", "suit": "p", "value": 8, "is_terminal": False, "is_honor": False, "unicode": "🀠"},
    "9p": {"chinese": "九筒", "jyutping": "gau2 tung4", "english": "9 Dot", "suit": "p", "value": 9, "is_terminal": True, "is_honor": False, "unicode": "🀡"},

    # Bamboos (索)
    "1s": {"chinese": "一索", "jyutping": "jat1 sok3", "english": "1 Bamboo", "suit": "s", "value": 1, "is_terminal": True, "is_honor": False, "unicode": "🀐"},
    "2s": {"chinese": "二索", "jyutping": "ji6 sok3", "english": "2 Bamboo", "suit": "s", "value": 2, "is_terminal": False, "is_honor": False, "unicode": "🀑"},
    "3s": {"chinese": "三索", "jyutping": "saam1 sok3", "english": "3 Bamboo", "suit": "s", "value": 3, "is_terminal": False, "is_honor": False, "unicode": "🀒"},
    "4s": {"chinese": "四索", "jyutping": "sei3 sok3", "english": "4 Bamboo", "suit": "s", "value": 4, "is_terminal": False, "is_honor": False, "unicode": "🀓"},
    "5s": {"chinese": "五索", "jyutping": "ng5 sok3", "english": "5 Bamboo", "suit": "s", "value": 5, "is_terminal": False, "is_honor": False, "unicode": "🀔"},
    "6s": {"chinese": "六索", "jyutping": "luk6 sok3", "english": "6 Bamboo", "suit": "s", "value": 6, "is_terminal": False, "is_honor": False, "unicode": "🀕"},
    "7s": {"chinese": "七索", "jyutping": "cat1 sok3", "english": "7 Bamboo", "suit": "s", "value": 7, "is_terminal": False, "is_honor": False, "unicode": "🀖"},
    "8s": {"chinese": "八索", "jyutping": "baat3 sok3", "english": "8 Bamboo", "suit": "s", "value": 8, "is_terminal": False, "is_honor": False, "unicode": "🀗"},
    "9s": {"chinese": "九索", "jyutping": "gau2 sok3", "english": "9 Bamboo", "suit": "s", "value": 9, "is_terminal": True, "is_honor": False, "unicode": "🀘"},

    # Winds (字 - 風牌)
    "1z": {"chinese": "東風", "jyutping": "dung1 fung1", "english": "East Wind", "suit": "z", "value": 1, "is_terminal": False, "is_honor": True, "honor_type": "wind", "unicode": "🀀"},
    "2z": {"chinese": "南風", "jyutping": "naam4 fung1", "english": "South Wind", "suit": "z", "value": 2, "is_terminal": False, "is_honor": True, "honor_type": "wind", "unicode": "🀁"},
    "3z": {"chinese": "西風", "jyutping": "sai1 fung1", "english": "West Wind", "suit": "z", "value": 3, "is_terminal": False, "is_honor": True, "honor_type": "wind", "unicode": "🀂"},
    "4z": {"chinese": "北風", "jyutping": "bak1 fung1", "english": "North Wind", "suit": "z", "value": 4, "is_terminal": False, "is_honor": True, "honor_type": "wind", "unicode": "🀃"},

    # Dragons (字 - 三元牌)
    "5z": {"chinese": "紅中", "jyutping": "hung4 zung1", "english": "Red Dragon", "suit": "z", "value": 5, "is_terminal": False, "is_honor": True, "honor_type": "dragon", "unicode": "🀄"},
    "6z": {"chinese": "發財", "jyutping": "faat3 coi4", "english": "Green Dragon", "suit": "z", "value": 6, "is_terminal": False, "is_honor": True, "honor_type": "dragon", "unicode": "🀅"},
    "7z": {"chinese": "白板", "jyutping": "baak6 baan2", "english": "White Dragon", "suit": "z", "value": 7, "is_terminal": False, "is_honor": True, "honor_type": "dragon", "unicode": "🀆"},
}

THIRTEEN_ORPHANS_TILES: List[str] = [
    "1m", "9m", "1p", "9p", "1s", "9s",
    "1z", "2z", "3z", "4z", "5z", "6z", "7z"
]
THIRTEEN_ORPHANS_INDICES: List[int] = [TILE_INDEX_MAP[t] for t in THIRTEEN_ORPHANS_TILES]

DRAGON_INDICES: List[int] = [TILE_INDEX_MAP["5z"], TILE_INDEX_MAP["6z"], TILE_INDEX_MAP["7z"]]
WIND_INDICES: List[int] = [TILE_INDEX_MAP["1z"], TILE_INDEX_MAP["2z"], TILE_INDEX_MAP["3z"], TILE_INDEX_MAP["4z"]]
HONOR_INDICES: List[int] = WIND_INDICES + DRAGON_INDICES


def tile_to_index(code: str) -> int:
    """Returns canonical index 0..33 for a tile code."""
    return TILE_INDEX_MAP[code]


def index_to_tile(idx: int) -> str:
    """Returns tile code string for canonical index 0..33."""
    return INDEX_TILE_MAP[idx]


def tile_sort_key(code: str) -> int:
    """Sort key matching canonical Mahjong tile order."""
    return TILE_INDEX_MAP.get(code, 999)


def sort_tiles(tiles: List[str]) -> List[str]:
    """Sorts tile codes according to canonical order (m -> p -> s -> z)."""
    return sorted(tiles, key=tile_sort_key)


def hand_to_counts(hand: List[str]) -> List[int]:
    """Converts list of tile codes to a 34-element integer count list."""
    counts = [0] * 34
    for t in hand:
        if t in TILE_INDEX_MAP:
            counts[TILE_INDEX_MAP[t]] += 1
    return counts


def counts_to_hand(counts: List[int]) -> List[str]:
    """Converts 34-element count list back to sorted tile codes."""
    hand = []
    for idx, c in enumerate(counts):
        if c > 0:
            hand.extend([INDEX_TILE_MAP[idx]] * c)
    return hand


def create_full_deck() -> List[str]:
    """Creates a standard 136-tile deck (4 copies of each 34 tile types, zero flowers)."""
    deck = []
    for code in ALL_TILE_CODES:
        deck.extend([code] * 4)
    return deck


def create_shuffled_wall() -> List[str]:
    """Creates and shuffles a standard 136-tile wall."""
    deck = create_full_deck()
    random.shuffle(deck)
    return deck


def parse_compact_string(text: str) -> Tuple[List[str], List[str]]:
    """
    Parses compact standard notation like '123m456p789s1122z'.
    Returns (tiles, errors).
    """
    tiles = []
    errors = []
    clean = text.strip()
    if not clean:
        return tiles, ["Input string is empty."]

    pattern = re.compile(r'([1-9]+)([mpsz])', re.IGNORECASE)
    matches = pattern.findall(clean)

    if not matches:
        return tiles, [f"Invalid notation: '{clean}'. Expected format like '123m456p789s1122z'."]

    for digits, suit_char in matches:
        s = suit_char.lower()
        for d in digits:
            code = f"{d}{s}"
            if code in TILE_INDEX_MAP:
                tiles.append(code)
            else:
                errors.append(f"Invalid tile code: '{code}'.")

    tiles.sort(key=tile_sort_key)

    # Validate 4-copies limit
    counts = hand_to_counts(tiles)
    for idx, c in enumerate(counts):
        if c > 4:
            code = INDEX_TILE_MAP[idx]
            info = TILE_INFO_MAP[code]
            errors.append(f"Tile {info['chinese']} ({code}) appears {c} times (max 4 per deck).")

    return tiles, errors
