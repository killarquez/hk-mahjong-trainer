"""
Procedural Tactical Puzzle Generator for TVB 2026 Hong Kong Mahjong Tournament.
Generates dynamic endless benchmark puzzles across 4 competitive tournament categories:
1. multi_sided_waits: Complex multi-tile winning waits (3-sided, 4-sided, 5-sided waits: e.g. 23456, 334556, 1112345678999).
2. one_fan_pivots: 1-Fan minimum tournament dilemmas (avoiding 0-fan chicken hand traps by sacrificing 1-2 outs to secure Ping Hu or Value Honor).
3. flush_discards: Half Flush / Full Flush shape optimization (purging non-suit tiles while preserving maximum suit connectivity).
4. opening_discards: Opening turn-1 / turn-2 shape efficiency and value preservation.
"""

import random
from typing import Dict, Any, List, Optional
from engine.tiles import ALL_TILE_CODES, sort_tiles, hand_to_counts, INDEX_TILE_MAP, TILE_INFO_MAP
from engine.shanten import calculate_tvb_shanten
from engine.ukeire import calculate_ukeire_for_13
from evaluator import evaluate_14_hand

SUITS = ['m', 'p', 's']
WINDS = ['1z', '2z', '3z', '4z']
DRAGONS = ['5z', '6z', '7z']

def generate_multi_sided_wait_puzzle() -> Dict[str, Any]:
    """Generates a 14-tile hand that contains a complex multi-sided wait (3+ accepted outs for Tenpai)."""
    suit = random.choice(SUITS)
    other_suits = [s for s in SUITS if s != suit]
    other_suit = random.choice(other_suits)

    templates = [
        # 1. Five-sided / Four-sided shape: 2345678 in suit + 2 melds + pair + 1 junk
        lambda s, os: [f"2{s}", f"3{s}", f"4{s}", f"5{s}", f"6{s}", f"7{s}", f"8{s}", f"2{os}", f"3{os}", f"4{os}", f"7{os}", f"7{os}", f"9{os}", random.choice(["1z", "2z", "3z", "4z"])],
        # 2. Overlapping double sequence + pair: 334556 in suit + meld + pair + 1 isolated
        lambda s, os: [f"3{s}", f"3{s}", f"4{s}", f"5{s}", f"5{s}", f"6{s}", f"4{os}", f"5{os}", f"6{os}", f"8{os}", f"8{os}", f"1{os}", f"2{os}", random.choice(["5z", "6z", "7z"])],
        # 3. Triple sequence with embedded pair: 2344567 in suit + meld + pair + 1 isolated
        lambda s, os: [f"2{s}", f"3{s}", f"4{s}", f"4{s}", f"5{s}", f"6{s}", f"7{s}", f"1{os}", f"2{os}", f"3{os}", f"9{os}", f"9{os}", f"5{os}", random.choice(["1z", "2z"])],
        # 4. Extended Lianmen: 34567 in suit + 2 melds + pair + 1 isolated
        lambda s, os: [f"3{s}", f"4{s}", f"5{s}", f"6{s}", f"7{s}", f"1{os}", f"2{os}", f"3{os}", f"6{os}", f"7{os}", f"8{os}", f"9{os}", f"9{os}", random.choice(["3z", "4z"])]
    ]

    chosen_template = random.choice(templates)
    tiles = sort_tiles(chosen_template(suit, other_suit))
    eval_res = evaluate_14_hand(tiles, seat_wind="1z", prevailing_wind="1z")

    return {
        "category": "multi_sided_waits",
        "category_name": "多面聽與複雜牌型 (Multi-Sided Waits)",
        "category_name_zh": "多面聽牌效",
        "title": "Complex Multi-Sided Shape Optimization (多面聽牌型抉擇)",
        "hand": tiles,
        "tiles": tiles,
        "scenario": f"You are in East Round. Your hand contains a highly connected {TILE_INFO_MAP[f'1{suit}']['chinese'][1:]} shape. Identify the discard that maximizes your multi-sided winning wait without breaking connected sequences.",
        "eval": eval_res,
        "evaluation": eval_res
    }

def generate_one_fan_pivot_puzzle() -> Dict[str, Any]:
    """Generates a 14-tile hand that risks becoming an illegal 0-Fan Chicken Hand (雞胡) under TVB 2026 rules."""
    s1, s2 = random.sample(SUITS, 2)
    dragon = random.choice(DRAGONS)
    d_info = TILE_INFO_MAP[dragon]

    tiles = sort_tiles([
        f"2{s1}", f"2{s1}", f"2{s1}",  # Triplet of number (disqualifies Ping Hu)
        f"4{s1}", f"5{s1}", f"6{s1}",  # Chow 1
        f"3{s2}", f"4{s2}", f"5{s2}",  # Chow 2
        f"7{s2}", f"8{s2}",            # Partial chow (needs 6s2 or 9s2)
        f"8{s1}", f"8{s1}",            # Numbered pair (not value honor)
        dragon                         # Dragon tile
    ])

    eval_res = evaluate_14_hand(tiles, seat_wind="1z", prevailing_wind="1z")

    return {
        "category": "one_fan_pivots",
        "category_name": "1番起胡與避開雞胡陷阱 (1-Fan Pivot & Chicken Traps)",
        "category_name_zh": "1番起胡抉擇",
        "title": "TVB 1-Fan Minimum Guarantee Dilemma (最低1番起胡抉擇)",
        "hand": tiles,
        "tiles": tiles,
        "scenario": f"TVB 2026 tournament rules strictly enforce a 1-Fan minimum. A 0-Fan Chicken Hand (雞胡) cannot win. You hold {d_info['chinese']} ({dragon}) alongside mixed suits. Choose the strategic discard that avoids a 0-fan dead hand trap.",
        "eval": eval_res,
        "evaluation": eval_res
    }

def generate_flush_puzzle() -> Dict[str, Any]:
    """Generates a Half Flush / Full Flush shape dilemma."""
    flush_suit = random.choice(SUITS)
    honors = random.sample(WINDS + DRAGONS, 3)

    flush_nums = random.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 7)
    suit_tiles = [f"{n}{flush_suit}" for n in flush_nums]
    suit_tiles.extend([f"{flush_nums[0]}{flush_suit}", f"{min(7, flush_nums[1])+1}{flush_suit}", f"{min(7, flush_nums[1])+2}{flush_suit}"])
    
    suit_tiles.extend([honors[0], honors[0], honors[1], honors[2]])
    suit_tiles = suit_tiles[:14]

    tiles = sort_tiles(suit_tiles)
    eval_res = evaluate_14_hand(tiles, seat_wind="1z", prevailing_wind="1z")

    return {
        "category": "flush_discards",
        "category_name": "混一色與清一色取捨 (Flush Shape Optimization)",
        "category_name_zh": "十番例牌與清混一色",
        "title": "Half Flush vs Speed Pivot (混一色牌效與進張抉擇)",
        "hand": tiles,
        "tiles": tiles,
        "scenario": f"You hold a heavy {TILE_INFO_MAP[f'1{flush_suit}']['chinese'][1:]} suit cluster with honor pairs. Balance maximizing Half Flush (混一色 3番) potential against pure tile acceptance speed.",
        "eval": eval_res,
        "evaluation": eval_res
    }

def generate_opening_puzzle() -> Dict[str, Any]:
    """Generates an opening turn 1-2 dilemma with multiple isolated honors, terminals, and partial blocks."""
    s1, s2, s3 = SUITS
    tiles = sort_tiles([
        f"1{s1}", f"2{s1}", f"4{s1}", f"7{s1}", f"8{s1}",
        f"3{s2}", f"5{s2}", f"6{s2}", f"9{s2}",
        f"2{s3}", f"8{s3}",
        "1z", "4z", "6z"
    ])

    eval_res = evaluate_14_hand(tiles, seat_wind="1z", prevailing_wind="1z")

    return {
        "category": "opening_discards",
        "category_name": "開局捨牌與價值保留 (Opening Discard Strategy)",
        "category_name_zh": "字牌與防守",
        "title": "Opening Turn-1 Value Retention (開局捨牌第一張)",
        "hand": tiles,
        "tiles": tiles,
        "scenario": "Hand 1/16 opening turn. You hold multiple isolated honors (East, North, Green) and weak terminal suits. Identify the mathematically optimal discard that preserves maximum safe outs and value paths.",
        "eval": eval_res,
        "evaluation": eval_res
    }

def generate_puzzle_by_category(category: Optional[str] = None) -> Dict[str, Any]:
    """Generates a procedural tactical puzzle by category or randomly."""
    cat = (category or "all").lower()
    if cat in ["multi_sided_waits", "waits"]:
        return generate_multi_sided_wait_puzzle()
    elif cat in ["one_fan_pivots", "fan_pivot"]:
        return generate_one_fan_pivot_puzzle()
    elif cat in ["flush_discards", "limit_hands"]:
        return generate_flush_puzzle()
    elif cat in ["opening_discards", "honors_defense"]:
        return generate_opening_puzzle()
    else:
        fn = random.choice([
            generate_multi_sided_wait_puzzle,
            generate_one_fan_pivot_puzzle,
            generate_flush_puzzle,
            generate_opening_puzzle
        ])
        return fn()
