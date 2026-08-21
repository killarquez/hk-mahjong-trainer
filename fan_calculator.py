"""
Fan Counting Engine for Hong Kong Mahjong (TVB 2026 Ruleset).
Strictly implements scoring according to TVB USA 2026 Appendix 3: 指定胡牌種類表.
Rules: Minimum 1 Fan to win, Maximum 10 Fan Limit. Zero Flowers. Seven Pairs Banned.
"""

from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
from engine.tiles import (
    ALL_TILE_CODES,
    TILE_INDEX_MAP,
    INDEX_TILE_MAP,
    TILE_UNICODE_MAP,
    TILE_INFO_MAP,
    THIRTEEN_ORPHANS_TILES,
    hand_to_counts,
    sort_tiles
)

THIRTEEN_ORPHANS_SET = set(THIRTEEN_ORPHANS_TILES)


def calculate_fan(
    tiles: List[str], 
    winning_tile: Optional[str] = None, 
    is_self_draw: bool = False,
    prevailing_wind: str = "1z",  # Default East (1z)
    seat_wind: str = "1z",        # Default East (1z)
    open_melds: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Calculates the Fan value and detailed breakdown of a 14-tile winning hand according to TVB 2026 rules.
    If open_melds is provided, those melds are fixed and preserved without re-grouping.
    """
    if len(tiles) != 14:
        return {
            "is_valid_win": False,
            "total_fan": 0,
            "hand_name": "無效手牌 / Invalid Hand",
            "breakdown": [],
            "error": f"Hand must contain exactly 14 tiles (got {len(tiles)})."
        }

    # Count tile occurrences
    counts = Counter(tiles)
    
    # 1. Thirteen Orphans (十三幺 - 10 Fan Limit) - only valid if fully concealed (0 open melds)
    if not open_melds and is_thirteen_orphans(counts):
        return build_response(
            is_valid=True,
            total_fan=10,
            hand_name="十三幺 (Thirteen Orphans)",
            breakdown=[{"code": "X3", "name": "十三幺 (Thirteen Orphans)", "jyutping": "Sap6saam1jiu1", "fan": 10, "desc": "10-Fan Limit Hand"}],
            is_limit=True
        )

    # Decompose into standard hand melds (4 melds + 1 pair)
    decompositions = decompose_hand(tiles, open_melds=open_melds)
    if not decompositions:
        return {
            "is_valid_win": False,
            "total_fan": 0,
            "hand_name": "未合胡牌牌型 / Invalid Winning Structure",
            "breakdown": [],
            "error": "Hand structure does not form 4 valid melds (Chows/Pongs) and 1 Pair. Seven Pairs is banned in TVB 2026."
        }

    # Pick the highest scoring valid decomposition
    best_eval = None
    max_fan = -1

    for pair, melds in decompositions:
        eval_res = evaluate_decomposition(
            pair=pair, 
            melds=melds, 
            counts=counts, 
            tiles=tiles,
            is_self_draw=is_self_draw,
            prevailing_wind=prevailing_wind,
            seat_wind=seat_wind
        )
        if eval_res["total_fan"] > max_fan:
            max_fan = eval_res["total_fan"]
            best_eval = eval_res

    if not best_eval:
        return {
            "is_valid_win": False,
            "total_fan": 0,
            "hand_name": "無效手牌",
            "breakdown": [],
            "error": "Could not evaluate hand."
        }

    # Enforce TVB 2026 Min 1 Fan rule (0 Fan Chicken hand is invalid)
    if best_eval["total_fan"] < 1:
        best_eval["is_valid_win"] = False
        best_eval["error"] = "雞胡 (0番) 不符合TVB 2026比賽規定 (最低起胡 1 番) / 0-Fan Chicken Hand is invalid under TVB 2026 min 1 Fan rule."
    
    return best_eval


def is_thirteen_orphans(counts: Counter) -> bool:
    """Check if hand is Thirteen Orphans (十三幺)."""
    if set(counts.keys()) != THIRTEEN_ORPHANS_SET:
        return False
    return sorted(counts.values()) == [1]*12 + [2]


def evaluate_decomposition(
    pair: str, 
    melds: List[Tuple[str, List[str]]],
    counts: Counter,
    tiles: List[str],
    is_self_draw: bool,
    prevailing_wind: str,
    seat_wind: str
) -> Dict[str, Any]:
    """Evaluate Fan for a single valid 4-meld + 1-pair decomposition under TVB 2026 rules."""
    breakdown = []
    total_fan = 0
    is_limit = False

    # Extract pongs and chows
    pongs = [mtiles for mtype, mtiles in melds if mtype == 'pong']
    chows = [mtiles for mtype, mtiles in melds if mtype == 'chow']
    pong_tiles = [mt[0] for mt in pongs]

    # --- Limit Hands (10 Fan) ---
    # X4: All Honors (字一色 - 10 Fan)
    if all(TILE_INFO_MAP[t]["is_honor"] for t in tiles):
        return build_response(
            is_valid=True,
            total_fan=10,
            hand_name="字一色 (All Honors)",
            breakdown=[{"code": "X4", "name": "字一色 (All Honors)", "jyutping": "Zi6jat1sik1", "fan": 10, "desc": "Hand composed entirely of honor tiles."}],
            is_limit=True
        )

    # X2: Big Four Winds (大四喜 - 10 Fan)
    wind_pongs = {t for t in pong_tiles if TILE_INFO_MAP[t].get("honor_type") == "wind"}
    if wind_pongs == {"1z", "2z", "3z", "4z"}:
        return build_response(
            is_valid=True,
            total_fan=10,
            hand_name="大四喜 (Big Four Winds)",
            breakdown=[{"code": "X2", "name": "大四喜 (Big Four Winds)", "jyutping": "Daai6sei3hei2", "fan": 10, "desc": "Four triplets of all four winds."}],
            is_limit=True
        )

    # X1: Big Three Dragons (大三元 - 8 Fan)
    dragon_pongs = {t for t in pong_tiles if TILE_INFO_MAP[t].get("honor_type") == "dragon"}
    if dragon_pongs == {"5z", "6z", "7z"}:
        total_fan += 8
        breakdown.append({"code": "X1", "name": "大三元 (Big Three Dragons)", "jyutping": "Daai6saam1jyun4", "fan": 8, "desc": "Three triplets of Red, Green, and White dragons."})

    # B4: Little Four Winds (小四喜 - 5 Fan)
    if len(wind_pongs) == 3 and TILE_INFO_MAP[pair].get("honor_type") == "wind":
        total_fan += 5
        breakdown.append({"code": "B4", "name": "小四喜 (Little Four Winds)", "jyutping": "Siu2sei3hei2", "fan": 5, "desc": "Three wind triplets + one wind pair."})

    # B3: Little Three Dragons (小三元 - 4 Fan)
    if len(dragon_pongs) == 2 and TILE_INFO_MAP[pair].get("honor_type") == "dragon":
        total_fan += 4
        breakdown.append({"code": "B3", "name": "小三元 (Little Three Dragons)", "jyutping": "Siu2saam1jyun4", "fan": 4, "desc": "Two dragon triplets + one dragon pair."})

    # --- High / Medium Hands ---
    # B5: Full Flush (清一色 - 7 Fan)
    suits = {TILE_INFO_MAP[t]["suit"] for t in tiles}
    num_suits = {s for s in suits if s != 'z'}
    has_honors = 'z' in suits

    if len(num_suits) == 1 and not has_honors:
        total_fan += 7
        breakdown.append({"code": "B5", "name": "清一色 (Full Flush)", "jyutping": "Cing1jat1sik1", "fan": 7, "desc": "All tiles belong to one single numerical suit."})
    elif len(num_suits) == 1 and has_honors:
        total_fan += 3
        breakdown.append({"code": "B2", "name": "混一色 (Half Flush)", "jyutping": "Wan6jat1sik1", "fan": 3, "desc": "All tiles belong to one numerical suit + honors."})

    # B1: All Triplets (對對胡 - 3 Fan)
    if len(pongs) == 4:
        total_fan += 3
        breakdown.append({"code": "B1", "name": "對對胡 (All Triplets)", "jyutping": "Deoi3deoi3wu2", "fan": 3, "desc": "Four triplets/kongs and one pair."})

    # A1: Common Hand (平胡 - 1 Fan)
    # Rules: 4 chows, pair must be numbered suit (no dragons, no winds), whole hand has no honors
    if len(chows) == 4 and not has_honors and not TILE_INFO_MAP[pair]["is_honor"]:
        total_fan += 1
        breakdown.append({"code": "A1", "name": "平胡 (Common Hand)", "jyutping": "Ping4wu2", "fan": 1, "desc": "Four sequences and a numbered suit pair (no honors)."})

    # --- Honor Triplet Modifiers (+1 Fan each) ---
    # Dragon pongs (cannot stack with Big Three Dragons or Little Three Dragons)
    if dragon_pongs != {"5z", "6z", "7z"} and not (len(dragon_pongs) == 2 and TILE_INFO_MAP[pair].get("honor_type") == "dragon"):
        if "5z" in dragon_pongs:
            total_fan += 1
            breakdown.append({"code": "A7", "name": "紅中刻 (Red Dragon Pong)", "jyutping": "Hung4zung1 hak1", "fan": 1, "desc": "Triplet of Red Dragon (中)."})
        if "6z" in dragon_pongs:
            total_fan += 1
            breakdown.append({"code": "A7", "name": "發財刻 (Green Dragon Pong)", "jyutping": "Faat3coi4 hak1", "fan": 1, "desc": "Triplet of Green Dragon (發)."})
        if "7z" in dragon_pongs:
            total_fan += 1
            breakdown.append({"code": "A7", "name": "白板刻 (White Dragon Pong)", "jyutping": "Baak6baan2 hak1", "fan": 1, "desc": "Triplet of White Dragon (白)."})

    # Wind pongs (Seat Wind & Prevailing Wind)
    if seat_wind in pong_tiles and wind_pongs != {"1z", "2z", "3z", "4z"} and not (len(wind_pongs) == 3 and TILE_INFO_MAP[pair].get("honor_type") == "wind"):
        w_info = TILE_INFO_MAP[seat_wind]
        total_fan += 1
        breakdown.append({"code": "A4", "name": f"門風刻 ({w_info['chinese']} Seat Wind Pong)", "jyutping": "Mun4 fung1 hak1", "fan": 1, "desc": f"Triplet matching seat wind ({w_info['chinese']})."})

    if prevailing_wind in pong_tiles and wind_pongs != {"1z", "2z", "3z", "4z"} and not (len(wind_pongs) == 3 and TILE_INFO_MAP[pair].get("honor_type") == "wind"):
        w_info = TILE_INFO_MAP[prevailing_wind]
        total_fan += 1
        breakdown.append({"code": "A3", "name": f"圈風刻 ({w_info['chinese']} Round Wind Pong)", "jyutping": "Hyun1 fung1 hak1", "fan": 1, "desc": f"Triplet matching prevailing round wind ({w_info['chinese']})."})

    # A2: Self-Draw (+1 Fan)
    if is_self_draw:
        total_fan += 1
        breakdown.append({"code": "A2", "name": "自摸 (Self-Draw)", "jyutping": "Zi6mo1", "fan": 1, "desc": "Winning tile was drawn from the wall."})

    # Cap at 10 Fan limit
    capped_fan = min(10, total_fan)
    is_limit = (capped_fan >= 10)

    hand_name = breakdown[0]["name"] if breakdown else ("雞胡 (0-Fan Chicken Hand)" if total_fan == 0 else f"{capped_fan}番手牌")

    return build_response(
        is_valid=(capped_fan >= 1),
        total_fan=capped_fan,
        hand_name=hand_name,
        breakdown=breakdown,
        is_limit=is_limit
    )


def decompose_hand(
    tiles: List[str],
    open_melds: Optional[List[Dict[str, Any]]] = None
) -> List[Tuple[str, List[Tuple[str, List[str]]]]]:
    """
    Decomposes a list of tiles into all possible (pair, melds) combinations.
    Each meld is ('chow'|'pong', [t1, t2, t3]).
    If open_melds is provided, those melds are fixed and preserved,
    and only the concealed tiles are decomposed into the remaining melds + pair.
    """
    if open_melds:
        fixed_melds: List[Tuple[str, List[str]]] = []
        concealed_tiles = list(tiles)
        for m in open_melds:
            m_type = "pong" if m["type"] in ["pong", "kong", "concealed_kong"] else "chow"
            m_tiles = list(m["tiles"][:3])
            fixed_melds.append((m_type, m_tiles))
            for t in m_tiles:
                if t in concealed_tiles:
                    concealed_tiles.remove(t)

        counts = Counter(concealed_tiles)
        results = []
        for tile in set(concealed_tiles):
            if counts[tile] >= 2:
                remaining = counts.copy()
                remaining[tile] -= 2
                melds = []
                if solve_melds(remaining, melds):
                    results.append((tile, melds + fixed_melds))
        return results

    counts = Counter(tiles)
    results = []

    # Try each tile that has at least 2 copies as pair (eye)
    for tile in set(tiles):
        if counts[tile] >= 2:
            remaining = counts.copy()
            remaining[tile] -= 2
            melds = []
            if solve_melds(remaining, melds):
                results.append((tile, melds))
                
    return results


def solve_melds(counts: Counter, melds: List[Tuple[str, List[str]]]) -> bool:
    """Recursively extract 4 melds (Pongs or Chows) from remaining tile counts."""
    first_tile = None
    for t in sort_tiles(list(counts.keys())):
        if counts[t] > 0:
            first_tile = t
            break

    if first_tile is None:
        return True

    # 1. Try Pong
    if counts[first_tile] >= 3:
        counts[first_tile] -= 3
        melds.append(('pong', [first_tile, first_tile, first_tile]))
        if solve_melds(counts, melds):
            return True
        melds.pop()
        counts[first_tile] += 3

    # 2. Try Chow for numbered tiles
    info = TILE_INFO_MAP.get(first_tile)
    if info and not info["is_honor"]:
        suit = info["suit"]
        val = info["value"]
        if val <= 7:
            t2 = f"{val+1}{suit}"
            t3 = f"{val+2}{suit}"
            if counts[t2] > 0 and counts[t3] > 0:
                counts[first_tile] -= 1
                counts[t2] -= 1
                counts[t3] -= 1
                melds.append(('chow', [first_tile, t2, t3]))
                if solve_melds(counts, melds):
                    return True
                melds.pop()
                counts[first_tile] += 1
                counts[t2] += 1
                counts[t3] += 1

    return False


def build_response(is_valid: bool, total_fan: int, hand_name: str, breakdown: List[Dict[str, Any]], is_limit: bool = False) -> Dict[str, Any]:
    return {
        "is_valid_win": is_valid,
        "total_fan": total_fan,
        "hand_name": hand_name,
        "breakdown": breakdown,
        "is_limit": is_limit,
        "min_fan_rule_applied": True
    }


# ==========================================
# TVB 2026 TOURNAMENT POINT PAYOUT TABLE
# ==========================================
TVB_POINTS_TABLE = {
    0: {"ron_delta": 0, "self_draw_delta_per_opp": 0, "total_winner_ron": 0, "total_winner_self_draw": 0},
    1: {"ron_delta": -10, "self_draw_delta_per_opp": -5, "total_winner_ron": 10, "total_winner_self_draw": 15},
    2: {"ron_delta": -20, "self_draw_delta_per_opp": -10, "total_winner_ron": 20, "total_winner_self_draw": 30},
    3: {"ron_delta": -30, "self_draw_delta_per_opp": -15, "total_winner_ron": 30, "total_winner_self_draw": 45},
    4: {"ron_delta": -40, "self_draw_delta_per_opp": -20, "total_winner_ron": 40, "total_winner_self_draw": 60},
    5: {"ron_delta": -50, "self_draw_delta_per_opp": -25, "total_winner_ron": 50, "total_winner_self_draw": 75},
    6: {"ron_delta": -60, "self_draw_delta_per_opp": -30, "total_winner_ron": 60, "total_winner_self_draw": 90},
    7: {"ron_delta": -70, "self_draw_delta_per_opp": -35, "total_winner_ron": 70, "total_winner_self_draw": 105},
    8: {"ron_delta": -80, "self_draw_delta_per_opp": -40, "total_winner_ron": 80, "total_winner_self_draw": 120},
    9: {"ron_delta": -90, "self_draw_delta_per_opp": -45, "total_winner_ron": 90, "total_winner_self_draw": 135},
    10: {"ron_delta": -100, "self_draw_delta_per_opp": -50, "total_winner_ron": 100, "total_winner_self_draw": 150}
}


def get_point_payout_details(fan: int, is_self_draw: bool) -> Dict[str, Any]:
    """Returns official TVB 2026 score deltas for winner and loser(s)."""
    capped_fan = max(0, min(10, fan))
    row = TVB_POINTS_TABLE.get(capped_fan, TVB_POINTS_TABLE[0])
    
    if is_self_draw:
        return {
            "is_self_draw": True,
            "winner_gain": row["total_winner_self_draw"],
            "each_opponent_loss": row["self_draw_delta_per_opp"],
            "total_pot": row["total_winner_self_draw"],
            "summary_zh": f"自摸 {capped_fan} 番：勝者得 +{row['total_winner_self_draw']} 分（三家各付 {abs(row['self_draw_delta_per_opp'])} 分）",
            "summary_en": f"Self-Draw {capped_fan} Fan: Winner gains +{row['total_winner_self_draw']} pts (each opponent pays {abs(row['self_draw_delta_per_opp'])} pts)"
        }
    else:
        return {
            "is_self_draw": False,
            "winner_gain": row["total_winner_ron"],
            "shooter_loss": row["ron_delta"],
            "non_shooter_loss": 0,
            "total_pot": row["total_winner_ron"],
            "summary_zh": f"出銃食胡 {capped_fan} 番：勝者得 +{row['total_winner_ron']} 分（出銃者包賠 {abs(row['ron_delta'])} 分）",
            "summary_en": f"Ron Win {capped_fan} Fan: Winner gains +{row['total_winner_ron']} pts (shooter pays {abs(row['ron_delta'])} pts)"
        }


# ==========================================
# FAN QUIZ PROCEDURAL HAND GENERATOR
# ==========================================
import random

ALL_PATTERNS_LIST = [
    {"id": "A1", "name_zh": "平胡 (Common Hand)", "name_en": "Ping Hu", "fan": 1},
    {"id": "A2", "name_zh": "自摸 (Self-Draw)", "name_en": "Self-Draw", "fan": 1},
    {"id": "A3", "name_zh": "圈風刻 (Round Wind Pong)", "name_en": "Round Wind Triplet", "fan": 1},
    {"id": "A4", "name_zh": "門風刻 (Seat Wind Pong)", "name_en": "Seat Wind Triplet", "fan": 1},
    {"id": "A7_red", "name_zh": "紅中刻 (Red Dragon Pong)", "name_en": "Red Dragon Triplet", "fan": 1},
    {"id": "A7_green", "name_zh": "發財刻 (Green Dragon Pong)", "name_en": "Green Dragon Triplet", "fan": 1},
    {"id": "A7_white", "name_zh": "白板刻 (White Dragon Pong)", "name_en": "White Dragon Triplet", "fan": 1},
    {"id": "B1", "name_zh": "對對胡 (All Triplets)", "name_en": "All Triplets", "fan": 3},
    {"id": "B2", "name_zh": "混一色 (Half Flush)", "name_en": "Half Flush", "fan": 3},
    {"id": "B3", "name_zh": "小三元 (Little Three Dragons)", "name_en": "Little Three Dragons", "fan": 4},
    {"id": "B4", "name_zh": "小四喜 (Little Four Winds)", "name_en": "Little Four Winds", "fan": 5},
    {"id": "B5", "name_zh": "清一色 (Full Flush)", "name_en": "Full Flush", "fan": 7},
    {"id": "X1", "name_zh": "大三元 (Big Three Dragons)", "name_en": "Big Three Dragons", "fan": 8},
    {"id": "X2", "name_zh": "大四喜 (Big Four Winds)", "name_en": "Big Four Winds", "fan": 10},
    {"id": "X3", "name_zh": "十三幺 (Thirteen Orphans)", "name_en": "Thirteen Orphans", "fan": 10},
    {"id": "X4", "name_zh": "字一色 (All Honors)", "name_en": "All Honors", "fan": 10},
    {"id": "TRAP_CHICKEN", "name_zh": "雞胡 (0番 無效起胡 / Chicken Hand)", "name_en": "0-Fan Chicken Hand (Banned)", "fan": 0}
]


def generate_fan_quiz_puzzle(difficulty: str = "all") -> Dict[str, Any]:
    """
    Generates an authentic Mahjong winning hand puzzle for dynamic Fan calculation practice.
    Difficulty options: 'all', 'beginner' (1-3 fan), 'intermediate' (4-6 fan), 'limit' (7-10 fan), 'traps' (0 fan).
    """
    suits = ['m', 'p', 's']
    winds = ['1z', '2z', '3z', '4z']
    dragons = ['5z', '6z', '7z']

    # Hand builders
    def make_ping_hu():
        s1, s2 = random.sample(suits, 2)
        v1, v2 = random.randint(1, 7), random.randint(1, 7)
        v3, v4 = random.randint(1, 7), random.randint(1, 7)
        pair_val = random.randint(1, 9)
        tiles = [
            f"{v1}{s1}", f"{v1+1}{s1}", f"{v1+2}{s1}",
            f"{v2}{s1}", f"{v2+1}{s1}", f"{v2+2}{s1}",
            f"{v3}{s2}", f"{v3+1}{s2}", f"{v3+2}{s2}",
            f"{v4}{s2}", f"{v4+1}{s2}", f"{v4+2}{s2}",
            f"{pair_val}{s1}", f"{pair_val}{s1}"
        ]
        is_sd = random.choice([True, False])
        p_wind = random.choice(winds)
        s_wind = random.choice([w for w in winds if w != p_wind])
        return tiles, is_sd, p_wind, s_wind

    def make_dragon_or_wind_hand():
        s = random.choice(suits)
        d_tile = random.choice(dragons + winds)
        v1, v2, v3 = random.randint(1, 7), random.randint(1, 7), random.randint(1, 7)
        p_val = random.randint(1, 9)
        tiles = [
            d_tile, d_tile, d_tile,
            f"{v1}{s}", f"{v1+1}{s}", f"{v1+2}{s}",
            f"{v2}{s}", f"{v2+1}{s}", f"{v2+2}{s}",
            f"{v3}{s}", f"{v3+1}{s}", f"{v3+2}{s}",
            f"{p_val}{s}", f"{p_val}{s}"
        ]
        is_sd = random.choice([True, False])
        p_wind = d_tile if d_tile in winds else random.choice(winds)
        s_wind = random.choice(winds)
        return tiles, is_sd, p_wind, s_wind

    def make_half_flush():
        s = random.choice(suits)
        h = random.choice(dragons + winds)
        v1, v2, v3 = random.randint(1, 7), random.randint(1, 7), random.randint(1, 7)
        p_val = random.randint(1, 9)
        tiles = [
            h, h, h,
            f"{v1}{s}", f"{v1+1}{s}", f"{v1+2}{s}",
            f"{v2}{s}", f"{v2+1}{s}", f"{v2+2}{s}",
            f"{v3}{s}", f"{v3+1}{s}", f"{v3+2}{s}",
            f"{p_val}{s}", f"{p_val}{s}"
        ]
        is_sd = random.choice([True, False])
        p_wind = random.choice(winds)
        s_wind = random.choice(winds)
        return tiles, is_sd, p_wind, s_wind

    def make_all_triplets():
        s1, s2 = random.sample(suits, 2)
        v1, v2, v3 = random.sample(range(1, 10), 3)
        v4 = random.randint(1, 9)
        pv = random.randint(1, 9)
        h = random.choice(dragons + winds)
        tiles = [
            f"{v1}{s1}", f"{v1}{s1}", f"{v1}{s1}",
            f"{v2}{s1}", f"{v2}{s1}", f"{v2}{s1}",
            f"{v3}{s2}", f"{v3}{s2}", f"{v3}{s2}",
            h, h, h,
            f"{pv}{s2}", f"{pv}{s2}"
        ]
        is_sd = random.choice([True, False])
        p_wind = random.choice(winds)
        s_wind = random.choice(winds)
        return tiles, is_sd, p_wind, s_wind

    def make_little_three_dragons():
        s = random.choice(suits)
        d_pongs = random.sample(dragons, 2)
        d_pair = [d for d in dragons if d not in d_pongs][0]
        v1, v2 = random.randint(1, 7), random.randint(1, 7)
        tiles = [
            d_pongs[0], d_pongs[0], d_pongs[0],
            d_pongs[1], d_pongs[1], d_pongs[1],
            d_pair, d_pair,
            f"{v1}{s}", f"{v1+1}{s}", f"{v1+2}{s}",
            f"{v2}{s}", f"{v2+1}{s}", f"{v2+2}{s}"
        ]
        is_sd = random.choice([True, False])
        p_wind = random.choice(winds)
        s_wind = random.choice(winds)
        return tiles, is_sd, p_wind, s_wind

    def make_big_three_dragons():
        s = random.choice(suits)
        v1 = random.randint(1, 7)
        pv = random.randint(1, 9)
        tiles = [
            "5z", "5z", "5z",
            "6z", "6z", "6z",
            "7z", "7z", "7z",
            f"{v1}{s}", f"{v1+1}{s}", f"{v1+2}{s}",
            f"{pv}{s}", f"{pv}{s}"
        ]
        is_sd = random.choice([True, False])
        p_wind = random.choice(winds)
        s_wind = random.choice(winds)
        return tiles, is_sd, p_wind, s_wind

    def make_full_flush():
        s = random.choice(suits)
        v1, v2, v3, v4 = random.randint(1, 7), random.randint(1, 7), random.randint(1, 7), random.randint(1, 7)
        pv = random.randint(1, 9)
        tiles = [
            f"{v1}{s}", f"{v1+1}{s}", f"{v1+2}{s}",
            f"{v2}{s}", f"{v2+1}{s}", f"{v2+2}{s}",
            f"{v3}{s}", f"{v3+1}{s}", f"{v3+2}{s}",
            f"{v4}{s}", f"{v4+1}{s}", f"{v4+2}{s}",
            f"{pv}{s}", f"{pv}{s}"
        ]
        is_sd = random.choice([True, False])
        p_wind = random.choice(winds)
        s_wind = random.choice(winds)
        return tiles, is_sd, p_wind, s_wind

    def make_thirteen_orphans():
        t13 = list(THIRTEEN_ORPHANS_TILES)
        dup = random.choice(t13)
        tiles = t13 + [dup]
        is_sd = random.choice([True, False])
        p_wind = random.choice(winds)
        s_wind = random.choice(winds)
        return tiles, is_sd, p_wind, s_wind

    def make_all_honors():
        h_pool = list(winds + dragons)
        pongs = random.sample(h_pool, 4)
        rem = [h for h in h_pool if h not in pongs]
        pair = random.choice(rem)
        tiles = [
            pongs[0], pongs[0], pongs[0],
            pongs[1], pongs[1], pongs[1],
            pongs[2], pongs[2], pongs[2],
            pongs[3], pongs[3], pongs[3],
            pair, pair
        ]
        is_sd = random.choice([True, False])
        p_wind = random.choice(winds)
        s_wind = random.choice(winds)
        return tiles, is_sd, p_wind, s_wind

    def make_chicken_trap():
        # Valid 4-meld + 1-pair structure but with 0 Fan:
        # e.g. 1 triplet of number suit + 3 chows of mixed suits + non-honor pair, NOT self-draw!
        s1, s2, s3 = suits[0], suits[1], suits[2]
        t_val = random.randint(1, 9)
        v1, v2, v3 = random.randint(1, 7), random.randint(1, 7), random.randint(1, 7)
        pv = random.randint(1, 9)
        tiles = [
            f"{t_val}{s1}", f"{t_val}{s1}", f"{t_val}{s1}", # Triplet of number
            f"{v1}{s1}", f"{v1+1}{s1}", f"{v1+2}{s1}",       # Chow 1
            f"{v2}{s2}", f"{v2+1}{s2}", f"{v2+2}{s2}",       # Chow 2
            f"{v3}{s3}", f"{v3+1}{s3}", f"{v3+2}{s3}",       # Chow 3
            f"{pv}{s2}", f"{pv}{s2}"                         # Pair
        ]
        is_sd = False # Ron win, so no Self-Draw Fan
        p_wind = "1z"
        s_wind = "2z"
        return tiles, is_sd, p_wind, s_wind

    # Select candidate hand generator based on difficulty
    target_tier = difficulty.lower()
    if target_tier == "beginner":
        gen_fn = random.choice([make_ping_hu, make_dragon_or_wind_hand, make_half_flush, make_all_triplets])
    elif target_tier == "intermediate":
        gen_fn = random.choice([make_half_flush, make_all_triplets, make_little_three_dragons])
    elif target_tier in ["limit", "advanced"]:
        gen_fn = random.choice([make_full_flush, make_big_three_dragons, make_thirteen_orphans, make_all_honors])
    elif target_tier == "traps":
        gen_fn = make_chicken_trap
    else: # all
        gen_fn = random.choice([
            make_ping_hu, make_dragon_or_wind_hand, make_half_flush, 
            make_all_triplets, make_little_three_dragons, make_big_three_dragons, 
            make_full_flush, make_thirteen_orphans, make_all_honors, make_chicken_trap
        ])

    tiles, is_sd, p_wind, s_wind = gen_fn()
    tiles = sort_tiles(tiles)
    winning_tile = random.choice(tiles)

    # Evaluate ground truth
    ground_truth = calculate_fan(
        tiles=tiles,
        winning_tile=winning_tile,
        is_self_draw=is_sd,
        prevailing_wind=p_wind,
        seat_wind=s_wind
    )

    actual_fan = ground_truth["total_fan"]
    payout = get_point_payout_details(actual_fan, is_sd)

    # Determine quiz difficulty tag
    if actual_fan == 0:
        diff_label = "0-Fan Trap (雞胡陷阱)"
    elif actual_fan <= 3:
        diff_label = "Beginner (入門 1-3番)"
    elif actual_fan <= 6:
        diff_label = "Intermediate (進階 4-6番)"
    else:
        diff_label = "Master / Limit (例牌 7-10番+)"

    return {
        "hand_tiles": tiles,
        "winning_tile": winning_tile,
        "is_self_draw": is_sd,
        "prevailing_wind": p_wind,
        "seat_wind": s_wind,
        "difficulty_label": diff_label,
        "ground_truth": ground_truth,
        "payout": payout,
        "available_patterns": ALL_PATTERNS_LIST
    }

