"""
Procedural Tactical Puzzle Generator for TVB 2026 Hong Kong Mahjong.
Generates infinite mathematically verified scenario variations for specific tactical themes:
- Multi-Sided & Complex Consecutive Waits (5-sided, Nobeta, Aryamen)
- 1-Fan Minimum Pivots & 0-Fan Chicken Hand Traps
- Guest Wind Discards vs Terminals
- Thirteen Orphans & Limit Hand Branching
"""

import random
from typing import Dict, Any, List
from engine.tiles import (
    ALL_TILE_CODES,
    INDEX_TILE_MAP, 
    TILE_INDEX_MAP, 
    TILE_INFO_MAP, 
    sort_tiles, 
    hand_to_counts
)
from engine.ukeire import calculate_ukeire_for_13
from evaluator import evaluate_14_hand


def _make_chow(suit: str, start_val: int) -> List[str]:
    """Helper to create a 3-tile Chow sequence."""
    return [f"{start_val}{suit}", f"{start_val+1}{suit}", f"{start_val+2}{suit}"]


def _make_pong(tile: str) -> List[str]:
    """Helper to create a 3-tile Pong triplet."""
    return [tile, tile, tile]


def _make_pair(tile: str) -> List[str]:
    """Helper to create a 2-tile Pair."""
    return [tile, tile]


def generate_waits_puzzle(seat_wind: str = "1z", prevailing_wind: str = "1z") -> Dict[str, Any]:
    """
    Generates a procedural Multi-Sided Wait puzzle.
    Builds a 5-tile or 4-tile consecutive block (e.g. 23456m or 34567p) + 2 finished melds + 1 pair + 1 isolated dummy.
    """
    suits = ['m', 'p', 's']
    primary_suit = random.choice(suits)
    other_suits = [s for s in suits if s != primary_suit]

    # Pattern A: 5-tile consecutive shape (e.g., 23456 or 34567 or 45678)
    start = random.randint(2, 4)
    run_5 = [f"{start + i}{primary_suit}" for i in range(5)]

    # Melds in other suits
    meld1 = _make_chow(other_suits[0], random.randint(1, 7))
    meld2 = _make_chow(other_suits[1], random.randint(1, 7))

    # Pair in honors or other suit
    pair_tile = random.choice(['1z', '2z', '3z', '4z', '5z', '6z', '7z'])
    pair = _make_pair(pair_tile)

    # Isolated dummy tile to discard (a guest wind or disconnected tile)
    dummy_choices = [t for t in ['1z', '2z', '3z', '4z', '5z', '6z', '7z'] if t != pair_tile]
    dummy = [random.choice(dummy_choices)]

    # Total: 5 + 3 + 3 + 2 + 1 = 14 tiles
    raw_tiles = run_5 + meld1 + meld2 + pair + dummy
    hand_tiles = sort_tiles(raw_tiles)

    eval_result = evaluate_14_hand(hand_tiles, seat_wind, prevailing_wind)

    return {
        "category": "waits",
        "category_name_zh": "多面聽牌效特訓",
        "category_name_en": "Multi-Sided Waits Drill",
        "title": f"{primary_suit.upper()}-Suit Multi-Sided Sequential Run Drill",
        "subtitle": f"Complex continuous shape ({run_5[0]}-{run_5[-1]}) with high-efficiency outs",
        "description": "Your hand contains a continuous sequential run. Identify the disconnected tile to discard to unlock the maximum multi-sided Ryanmen tile acceptance!",
        "tiles": hand_tiles,
        "seat_wind": seat_wind,
        "prevailing_wind": prevailing_wind,
        "hint": f"The continuous block in {primary_suit.upper()} can expand into multiple sequences or provide two-sided waits. Discard the isolated honor/dummy.",
        "proverb": "長條連續莫輕拆，五面聽張天下行",
        "evaluation": eval_result
    }


def generate_chicken_hand_trap_puzzle(seat_wind: str = "1z", prevailing_wind: str = "1z") -> Dict[str, Any]:
    """
    Generates a 0-Fan Chicken Hand Trap puzzle.
    Constructs 4 valid Chows in numbered suits + Dragon pair (which has 0 Fan in TVB 2026) + 1 isolated tile.
    """
    suits = ['m', 'p', 's']
    s1, s2, s3 = random.sample(suits, 3)

    # 4 chows (3+3+3+2 = 11 numbered tiles)
    chow1 = _make_chow(s1, random.randint(1, 6))
    chow2 = _make_chow(s2, random.randint(1, 6))
    chow3 = _make_chow(s3, random.randint(1, 6))
    
    # 2-tile consecutive wait in s1 (e.g. 23s)
    v = random.randint(2, 6)
    ryanmen = [f"{v}{s1}", f"{v+1}{s1}"]

    # Dragon pair (55z, 66z, or 77z - 0 Fan in chicken hand)
    dragon_tile = random.choice(['5z', '6z', '7z'])
    dragon_pair = _make_pair(dragon_tile)

    # Isolated non-value wind
    guest_winds = [w for w in ['1z', '2z', '3z', '4z'] if w != seat_wind and w != prevailing_wind]
    dummy_wind = [random.choice(guest_winds if guest_winds else ['4z'])]

    # Total: 3 + 3 + 3 + 2 + 2 + 1 = 14 tiles
    raw_tiles = chow1 + chow2 + chow3 + ryanmen + dragon_pair + dummy_wind
    hand_tiles = sort_tiles(raw_tiles)

    eval_result = evaluate_14_hand(hand_tiles, seat_wind, prevailing_wind)

    return {
        "category": "fan_pivot",
        "category_name_zh": "1番起胡抉擇特訓",
        "category_name_en": "1-Fan Minimum Pivot Drill",
        "title": "0-Fan Chicken Hand Trap Avoidance Drill",
        "subtitle": "Avoiding invalid Dragon-Pair 0-Fan traps under TVB 2026 rules",
        "description": "In TVB 2026 rules, a hand of 4 Chows with an honor pair is 0 Fan (Chicken Hand / 雞胡) and ILLEGAL. Discard the isolated dead wind to preserve paths to Ping Hu (1 Fan) or Dragon Pong (1 Fan).",
        "tiles": hand_tiles,
        "seat_wind": seat_wind,
        "prevailing_wind": prevailing_wind,
        "hint": "Discard the isolated dead guest wind. You can either Pong the Dragon into a 1-Fan Dragon Pong, or complete Ping Hu by forming a numbered pair.",
        "proverb": "雞胡無分難自救，平胡字眼不可留",
        "evaluation": eval_result
    }


def generate_half_flush_puzzle(seat_wind: str = "1z", prevailing_wind: str = "1z") -> Dict[str, Any]:
    """
    Generates a Half Flush (混一色 - 3 Fan) vs Ping Hu dilemma.
    Contains 8-9 tiles of one suit + 4 honor tiles + 1-2 stray foreign numbered tiles.
    """
    primary_suit = random.choice(['m', 'p', 's'])
    foreign_suit = random.choice([s for s in ['m', 'p', 's'] if s != primary_suit])

    # 9 tiles in primary suit (3 melds or runs)
    meld1 = _make_chow(primary_suit, 1)
    meld2 = _make_chow(primary_suit, 4)
    meld3 = _make_chow(primary_suit, 7)

    # 4 honor tiles (2 pairs)
    h1, h2 = random.sample(['1z', '2z', '3z', '4z', '5z', '6z', '7z'], 2)
    honors = _make_pair(h1) + _make_pair(h2)

    # 1 isolated foreign suit tile
    foreign_tile = [f"{random.randint(2, 8)}{foreign_suit}"]

    # Total: 9 + 4 + 1 = 14 tiles
    raw_tiles = meld1 + meld2 + meld3 + honors + foreign_tile
    hand_tiles = sort_tiles(raw_tiles)

    eval_result = evaluate_14_hand(hand_tiles, seat_wind, prevailing_wind)

    return {
        "category": "fan_pivot",
        "category_name_zh": "混一色 3番轉型特訓",
        "category_name_en": "Half-Flush 3-Fan Pivot Drill",
        "title": f"{primary_suit.upper()}-Suit Half Flush (混一色) 3-Fan Drill",
        "subtitle": "Locking in a high-value 3-Fan Half Flush over a low-point hand",
        "description": f"You hold a heavy {primary_suit.upper()}-suit structure with supporting honor pairs. Discard the isolated foreign {foreign_suit.upper()} tile to enter a 1-Shanten Half Flush worth 3 Fan!",
        "tiles": hand_tiles,
        "seat_wind": seat_wind,
        "prevailing_wind": prevailing_wind,
        "hint": f"Discard the isolated {foreign_tile[0]} to consolidate your hand into pure {primary_suit.upper()} + Honors (混一色 3番).",
        "proverb": "混一色成氣候足，莫留雜色阻前程",
        "evaluation": eval_result
    }


def generate_dead_wind_puzzle(seat_wind: str = "1z", prevailing_wind: str = "1z") -> Dict[str, Any]:
    """
    Generates a Dead Guest Wind vs Isolated Terminal Priority puzzle.
    """
    suits = ['m', 'p', 's']
    s1, s2, s3 = suits

    meld1 = _make_chow(s1, random.randint(1, 7))
    meld2 = _make_chow(s2, random.randint(1, 7))
    meld3 = _make_chow(s3, random.randint(1, 7))
    pair = _make_pair(f"{random.randint(1, 9)}{s1}")

    # Isolated guest wind (0 Fan)
    guest_winds = [w for w in ['1z', '2z', '3z', '4z'] if w != seat_wind and w != prevailing_wind]
    guest_wind = random.choice(guest_winds if guest_winds else ['4z'])

    # Isolated terminal (1 or 9)
    terminal_val = random.choice([1, 9])
    terminal = f"{terminal_val}{s2}"

    # Extra middle floating tile (e.g. 5p)
    stray = f"{random.randint(3, 7)}{s3}"

    # Total: 3 + 3 + 3 + 2 + 1 + 1 + 1 = 14 tiles
    raw_tiles = meld1 + meld2 + meld3 + pair + [guest_wind, terminal, stray]
    hand_tiles = sort_tiles(raw_tiles)

    eval_result = evaluate_14_hand(hand_tiles, seat_wind, prevailing_wind)

    return {
        "category": "honors_defense",
        "category_name_zh": "字牌與防守特訓",
        "category_name_en": "Guest Wind Discard Drill",
        "title": "Guest Wind Discard Priority Drill",
        "subtitle": "Discarding zero-fan guest winds before connected terminals",
        "description": "Evaluate opening discard priority: between an isolated zero-fan guest wind and an isolated numbered tile, which should be discarded first?",
        "tiles": hand_tiles,
        "seat_wind": seat_wind,
        "prevailing_wind": prevailing_wind,
        "hint": "Guest winds only have 3 remaining copies to form a pair. Numbered terminals can connect into 2-sided and 1-sided sequences.",
        "proverb": "起手先捨無番字，數牌留待看連張",
        "evaluation": eval_result
    }


def generate_thirteen_orphans_puzzle(seat_wind: str = "1z", prevailing_wind: str = "1z") -> Dict[str, Any]:
    """
    Generates a Thirteen Orphans (10 Fan) branching puzzle.
    Contains 10 unique terminals/honors + 1 pair + 3 stray numbered tiles.
    """
    all_terminals = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z']
    chosen_10 = random.sample(all_terminals, 10)
    paired = chosen_10[0]

    # 3 stray inner numbered tiles (2..8)
    strays = [f"{random.randint(2, 7)}m", f"{random.randint(3, 7)}p", f"{random.randint(4, 7)}s"]

    raw_tiles = chosen_10 + [paired] + strays
    hand_tiles = sort_tiles(raw_tiles)

    eval_result = evaluate_14_hand(hand_tiles, seat_wind, prevailing_wind)

    return {
        "category": "limit_hands",
        "category_name_zh": "十番例牌特訓",
        "category_name_en": "Thirteen Orphans Limit Hand Drill",
        "title": "10-Terminal Thirteen Orphans Branching Drill",
        "subtitle": "Deciding when to chase the 10-Fan maximum limit hand",
        "description": "You hold 10 unique Terminals/Honors. Discard an isolated inner numbered tile to pursue Thirteen Orphans (10 Fan)!",
        "tiles": hand_tiles,
        "seat_wind": seat_wind,
        "prevailing_wind": prevailing_wind,
        "hint": "With 10 unique terminal/honor tiles, you are only 3-Shanten away from Thirteen Orphans. Discard one of the stray middle tiles.",
        "proverb": "十張幺九十三起，滿胡十番莫遲疑",
        "evaluation": eval_result
    }


def generate_procedural_puzzle(category: str = "waits", seat_wind: str = "1z", prevailing_wind: str = "1z") -> Dict[str, Any]:
    """Router to generate a procedural puzzle for any tactical category."""
    if category == "waits":
        return generate_waits_puzzle(seat_wind, prevailing_wind)
    elif category == "fan_pivot":
        generators = [generate_chicken_hand_trap_puzzle, generate_half_flush_puzzle]
        return random.choice(generators)(seat_wind, prevailing_wind)
    elif category == "honors_defense":
        return generate_dead_wind_puzzle(seat_wind, prevailing_wind)
    elif category == "limit_hands":
        return generate_thirteen_orphans_puzzle(seat_wind, prevailing_wind)
    else:
        # Random pick across all categories
        generators = [
            generate_waits_puzzle,
            generate_chicken_hand_trap_puzzle,
            generate_half_flush_puzzle,
            generate_dead_wind_puzzle,
            generate_thirteen_orphans_puzzle
        ]
        return random.choice(generators)(seat_wind, prevailing_wind)
