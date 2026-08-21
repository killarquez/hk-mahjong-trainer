"""
TVB 2026 Grandmaster Defensive Mahjong Engine.
Provides mathematical tile safety analysis, Suji/Kabe/Genbutsu calculations,
threat assessment, Push/Fold (押し引き) decision evaluation, and defense scenario generation.
"""

from typing import List, Dict, Any, Optional, Tuple, Set
import random
from engine.tiles import (
    ALL_TILE_CODES,
    TILE_INDEX_MAP,
    INDEX_TILE_MAP,
    TILE_INFO_MAP,
    hand_to_counts,
    counts_to_hand,
    sort_tiles,
    create_shuffled_wall
)
from engine.shanten import calculate_tvb_shanten
from engine.ukeire import calculate_ukeire_for_13
from fan_calculator import calculate_fan


# =========================================================================
# 1. Suji & Kabe Lookup Constants
# =========================================================================

# 1-4-7, 2-5-8, 3-6-9 Suji Groups per suit
SUJI_PAIRS = [
    (1, 4), (4, 7), (1, 7), # 1-4-7
    (2, 5), (5, 8), (2, 8), # 2-5-8
    (3, 6), (6, 9), (3, 9)  # 3-6-9
]

# Proverb catalog for defensive advice
DEFENSE_PROVERBS = {
    "genbutsu": "現物跟打最安心，十拿九穩不漏風。",
    "suji_outer": "四萬已出打一七，筋牌防守見奇功。",
    "suji_inner": "一七皆見打中四，雙筋中張莫遲疑。",
    "kabe_no_chance": "七筒全見斷通路，八九無筋亦如山。",
    "dead_honor": "三見字牌皆作古，無眼無刻安全生。",
    "push_fold": "聽大牌好方可押，一向聽淺早收心。"
}


# =========================================================================
# 2. Mathematical Safety Rating Core
# =========================================================================

def get_genbutsu_tiles_for_player(player_river: List[Dict[str, Any]]) -> Set[str]:
    """Returns all tiles discarded by this specific player (100% Genbutsu against them)."""
    return {r["tile"] for r in player_river}


def get_table_cycle_genbutsu(rivers: List[List[Dict[str, Any]]], current_turn_idx: int) -> Set[str]:
    """
    Returns tiles discarded in the immediate current turn cycle (同巡現物).
    Tiles discarded after your previous turn cannot be called for Ron by players who have already discarded since.
    """
    cycle_tiles = set()
    for r in rivers:
        if len(r) > 0:
            cycle_tiles.add(r[-1]["tile"])
    return cycle_tiles


def calculate_suji_safety(tile: str, opponent_river: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes whether a suited tile (m, p, s) is safe via Suji (筋牌) based on opponent's discards.
    """
    info = TILE_INFO_MAP[tile]
    suit = info["suit"]
    val = info["value"]
    if suit == "z" or val == 0:
        return {"is_suji": False, "suji_type": "none", "safety_factor": 0.0, "reason": "Honor tile"}

    river_tiles = {r["tile"] for r in opponent_river}
    
    # Check 1-4-7
    if val == 1:
        if f"4{suit}" in river_tiles:
            return {"is_suji": True, "suji_type": "outer_suji", "safety_factor": 0.75, "reason": f"Outer Suji (表筋): {tile} protected because 4{suit} was discarded."}
    elif val == 7:
        if f"4{suit}" in river_tiles:
            return {"is_suji": True, "suji_type": "outer_suji", "safety_factor": 0.75, "reason": f"Outer Suji (表筋): {tile} protected because 4{suit} was discarded."}
    elif val == 4:
        has_1 = f"1{suit}" in river_tiles
        has_7 = f"7{suit}" in river_tiles
        if has_1 and has_7:
            return {"is_suji": True, "suji_type": "double_suji", "safety_factor": 0.85, "reason": f"Double Suji (雙筋): {tile} protected because both 1{suit} and 7{suit} were discarded."}
        elif has_1 or has_7:
            return {"is_suji": True, "suji_type": "half_suji", "safety_factor": 0.40, "reason": f"Half Suji (半筋): {tile} partially protected (only 1 of 1/7 seen)."}

    # Check 2-5-8
    elif val == 2:
        if f"5{suit}" in river_tiles:
            return {"is_suji": True, "suji_type": "outer_suji", "safety_factor": 0.70, "reason": f"Outer Suji (表筋): {tile} protected because 5{suit} was discarded."}
    elif val == 8:
        if f"5{suit}" in river_tiles:
            return {"is_suji": True, "suji_type": "outer_suji", "safety_factor": 0.70, "reason": f"Outer Suji (表筋): {tile} protected because 5{suit} was discarded."}
    elif val == 5:
        has_2 = f"2{suit}" in river_tiles
        has_8 = f"8{suit}" in river_tiles
        if has_2 and has_8:
            return {"is_suji": True, "suji_type": "double_suji", "safety_factor": 0.80, "reason": f"Double Suji (雙筋): {tile} protected because both 2{suit} and 8{suit} were discarded."}
        elif has_2 or has_8:
            return {"is_suji": True, "suji_type": "half_suji", "safety_factor": 0.35, "reason": f"Half Suji (半筋): {tile} partially protected."}

    # Check 3-6-9
    elif val == 3:
        if f"6{suit}" in river_tiles:
            return {"is_suji": True, "suji_type": "outer_suji", "safety_factor": 0.70, "reason": f"Outer Suji (表筋): {tile} protected because 6{suit} was discarded."}
    elif val == 9:
        if f"6{suit}" in river_tiles:
            return {"is_suji": True, "suji_type": "outer_suji", "safety_factor": 0.75, "reason": f"Outer Suji (表筋): {tile} protected because 6{suit} was discarded."}
    elif val == 6:
        has_3 = f"3{suit}" in river_tiles
        has_9 = f"9{suit}" in river_tiles
        if has_3 and has_9:
            return {"is_suji": True, "suji_type": "double_suji", "safety_factor": 0.85, "reason": f"Double Suji (雙筋): {tile} protected because both 3{suit} and 9{suit} were discarded."}
        elif has_3 or has_9:
            return {"is_suji": True, "suji_type": "half_suji", "safety_factor": 0.40, "reason": f"Half Suji (半筋): {tile} partially protected."}

    return {"is_suji": False, "suji_type": "none", "safety_factor": 0.0, "reason": "No Suji protection (無筋危險牌)"}


def calculate_kabe_safety(tile: str, visible_counts: List[int]) -> Dict[str, Any]:
    """
    Calculates Kabe (Wall / 壁牌 / 斷牌) safety based on table-wide visible tiles.
    - No-Chance (4 visible copies): impossible for opponent to hold Ryanmen chow across this barrier.
    - One-Chance (3 visible copies): highly improbable Ryanmen.
    """
    info = TILE_INFO_MAP[tile]
    suit = info["suit"]
    val = info["value"]
    if suit == "z" or val == 0:
        return {"has_kabe": False, "kabe_type": "none", "safety_factor": 0.0, "reason": "Honor tile"}

    # Base index for suit: m=0, p=9, s=18
    base_offset = 0 if suit == "m" else (9 if suit == "p" else 18)

    # 1. Check Terminal No-Chance / One-Chance (1 & 9)
    # For 1: needs 2 and 3 to form 123 chow. If 2 is dead OR 3 is dead -> No-Chance.
    if val == 1:
        c2 = visible_counts[base_offset + 1] # count of 2
        c3 = visible_counts[base_offset + 2] # count of 3
        if c2 >= 4 or c3 >= 4:
            dead_tile = f"2{suit}" if c2 >= 4 else f"3{suit}"
            return {"has_kabe": True, "kabe_type": "no_chance", "safety_factor": 0.90, "reason": f"No-Chance Wall (斷{dead_tile}/壁牌): All four {dead_tile} visible, impossible to form {tile}23{suit} Chow wait."}
        elif c2 == 3 or c3 == 3:
            return {"has_kabe": True, "kabe_type": "one_chance", "safety_factor": 0.60, "reason": f"One-Chance (一壁): Three copies of 2{suit} or 3{suit} visible."}

    elif val == 9:
        c7 = visible_counts[base_offset + 6] # count of 7
        c8 = visible_counts[base_offset + 7] # count of 8
        if c8 >= 4 or c7 >= 4:
            dead_tile = f"8{suit}" if c8 >= 4 else f"7{suit}"
            return {"has_kabe": True, "kabe_type": "no_chance", "safety_factor": 0.90, "reason": f"No-Chance Wall (斷{dead_tile}/壁牌): All four {dead_tile} visible, impossible to form 78{tile} Chow wait."}
        elif c8 == 3 or c7 == 3:
            return {"has_kabe": True, "kabe_type": "one_chance", "safety_factor": 0.60, "reason": f"One-Chance (一壁): Three copies of 7{suit} or 8{suit} visible."}

    elif val == 2:
        c3 = visible_counts[base_offset + 2] # count of 3
        c4 = visible_counts[base_offset + 3] # count of 4
        if c3 >= 4:
            return {"has_kabe": True, "kabe_type": "no_chance", "safety_factor": 0.85, "reason": f"No-Chance Wall (斷3{suit}/壁牌): All four 3{suit} visible, impossible to form 123{suit} or 234{suit} wait."}
        elif c4 >= 4:
            return {"has_kabe": True, "kabe_type": "no_chance", "safety_factor": 0.70, "reason": f"No-Chance Wall (斷4{suit}/壁牌): All four 4{suit} visible, impossible to form 234{suit} wait."}
        elif c3 == 3 or c4 == 3:
            return {"has_kabe": True, "kabe_type": "one_chance", "safety_factor": 0.55, "reason": f"One-Chance (一壁): Three copies of 3{suit} or 4{suit} visible."}

    elif val == 8:
        c7 = visible_counts[base_offset + 6] # count of 7
        c6 = visible_counts[base_offset + 5] # count of 6
        if c7 >= 4:
            return {"has_kabe": True, "kabe_type": "no_chance", "safety_factor": 0.85, "reason": f"No-Chance Wall (斷7{suit}/壁牌): All four 7{suit} visible, impossible to form 789{suit} or 678{suit} wait."}
        elif c6 >= 4:
            return {"has_kabe": True, "kabe_type": "no_chance", "safety_factor": 0.70, "reason": f"No-Chance Wall (斷6{suit}/壁牌): All four 6{suit} visible, impossible to form 678{suit} wait."}
        elif c7 == 3 or c6 == 3:
            return {"has_kabe": True, "kabe_type": "one_chance", "safety_factor": 0.55, "reason": f"One-Chance (一壁): Three copies of 7{suit} or 6{suit} visible."}

    return {"has_kabe": False, "kabe_type": "none", "safety_factor": 0.0, "reason": "No Kabe protection"}


def calculate_honor_safety(tile: str, visible_counts: List[int], prevailing_wind: str, seat_wind: str) -> Dict[str, Any]:
    """
    Evaluates safety of Honor tiles (Winds & Dragons):
    - 3 or 4 visible on table -> 100% Safe (Except rare single wait Tanki if 3 visible).
    - 2 visible -> High Safety.
    - 1 visible -> Moderate Danger.
    - 0 visible (Live / 生張) -> Very High Danger (Potential Dragon/Seat Wind pair or triplet).
    """
    info = TILE_INFO_MAP[tile]
    if info["suit"] != "z":
        return {"is_honor": False, "visible_count": 0, "safety_factor": 0.0, "reason": "Not an honor tile"}

    t_idx = TILE_INDEX_MAP[tile]
    vis = visible_counts[t_idx]
    is_dragon = tile in ["5z", "6z", "7z"]
    is_val_wind = tile in [prevailing_wind, seat_wind]

    if vis >= 4:
        return {"is_honor": True, "visible_count": vis, "safety_factor": 1.0, "safety_tier": "safe_100", "reason": f"4-Dead Honor (四見熟字): 100% safe from all regular winning hands."}
    elif vis == 3:
        return {"is_honor": True, "visible_count": vis, "safety_factor": 0.95, "safety_tier": "safe_95", "reason": f"3-Dead Honor (三見熟字): Only 1 copy remaining in entire game; impossible to form triplet or pair, only Tanki wait possible."}
    elif vis == 2:
        return {"is_honor": True, "visible_count": vis, "safety_factor": 0.75, "safety_tier": "safe_75", "reason": f"2-Dead Honor (二見字牌): 2 copies visible; moderately safe."}
    elif vis == 1:
        return {"is_honor": True, "visible_count": vis, "safety_factor": 0.40, "safety_tier": "danger_medium", "reason": f"1-Dead Honor (一見字牌): 3 copies unaccounted for."}
    else:
        # 0 visible -> Live Honor (生張)
        danger_text = "Live Dragon (生張役牌/中發白)" if is_dragon else ("Live Value Wind (生張風牌)" if is_val_wind else "Live Guest Wind (生張客風)")
        return {"is_honor": True, "visible_count": 0, "safety_factor": 0.10, "safety_tier": "danger_extreme", "reason": f"{danger_text}: 0 copies visible on table! Extremely dangerous to discard against Tenpai."}


# =========================================================================
# 3. Composite Danger Score Algorithm ($0.0 = \text{Safe} \to 10.0 = \text{Extreme}$)
# =========================================================================

def calculate_tile_danger_score(
    tile: str,
    target_player_river: List[Dict[str, Any]],
    table_visible_counts: List[int],
    prevailing_wind: str = "1z",
    target_seat_wind: str = "1z",
    target_melds_count: int = 0
) -> Dict[str, Any]:
    """
    Computes a definitive mathematical danger rating (0.0 to 10.0) for a given tile
    against a target threatening opponent.
    """
    info = TILE_INFO_MAP[tile]
    genbutsu_set = get_genbutsu_tiles_for_player(target_player_river)

    # 1. Absolute Genbutsu (現物) -> Danger 0.0 (100% Safe)
    if tile in genbutsu_set:
        return {
            "tile": tile,
            "danger_score": 0.0,
            "safety_level": "safe_100",
            "safety_label_zh": "100% 現物 (絕對安全)",
            "safety_label_en": "100% Genbutsu (Absolute Safe)",
            "color": "#10b981", # emerald
            "primary_reason": f"Target player already discarded {info['chinese']} ({tile}). Strictly 0% chance of Ron (無銃可能).",
            "proverb": DEFENSE_PROVERBS["genbutsu"]
        }

    # 2. Honor Tiles Safety
    if info["suit"] == "z":
        h_eval = calculate_honor_safety(tile, table_visible_counts, prevailing_wind, target_seat_wind)
        vis = h_eval["visible_count"]
        if vis >= 4:
            score = 0.0
            label_zh = "100% 四見字牌 (絕對安全)"
            label_en = "4-Dead Honor (100% Safe)"
            col = "#10b981"
        elif vis == 3:
            score = 0.5
            label_zh = "95% 三見字牌 (極度安全)"
            label_en = "3-Dead Honor (Extremely Safe)"
            col = "#34d399"
        elif vis == 2:
            score = 2.5
            label_zh = "二見字牌 (相對安全)"
            label_en = "2-Dead Honor (Relatively Safe)"
            col = "#38bdf8"
        elif vis == 1:
            score = 6.0
            label_zh = "一見字牌 (具危險性)"
            label_en = "1-Dead Honor (Dangerous)"
            col = "#f59e0b"
        else:
            score = 9.5
            label_zh = "⚠️ 生張字牌 (極度危險)"
            label_en = "Live Honor Tile (Extreme Danger)"
            col = "#ef4444"

        return {
            "tile": tile,
            "danger_score": score,
            "safety_level": h_eval["safety_tier"],
            "safety_label_zh": label_zh,
            "safety_label_en": label_en,
            "color": col,
            "primary_reason": h_eval["reason"],
            "proverb": DEFENSE_PROVERBS["dead_honor"] if vis >= 3 else DEFENSE_PROVERBS["push_fold"]
        }

    # 3. Suji & Kabe for Suited Tiles (1-9 m/p/s)
    suji_res = calculate_suji_safety(tile, target_player_river)
    kabe_res = calculate_kabe_safety(tile, table_visible_counts)

    val = info["value"]
    # Base danger by tile position: Terminals (1,9) safer than 2,8, safer than 3,7, middle 4,5,6 highest raw danger
    if val in [1, 9]:
        base_danger = 5.0
    elif val in [2, 8]:
        base_danger = 6.5
    elif val in [3, 7]:
        base_danger = 7.5
    else: # 4, 5, 6
        base_danger = 8.5

    # Apply Suji discounts
    if suji_res["is_suji"]:
        if suji_res["suji_type"] == "double_suji":
            base_danger -= 6.0
        elif suji_res["suji_type"] == "outer_suji":
            base_danger -= 4.5
        elif suji_res["suji_type"] == "half_suji":
            base_danger -= 2.0

    # Apply Kabe discounts
    if kabe_res["has_kabe"]:
        if kabe_res["kabe_type"] == "no_chance":
            base_danger -= 5.0
        elif kabe_res["kabe_type"] == "one_chance":
            base_danger -= 2.5

    final_score = max(0.2, min(10.0, base_danger))

    if final_score <= 1.5:
        lvl = "safe_high"
        label_zh = "安全筋牌 / 壁牌 (極安全)"
        label_en = "Safe Suji / Kabe (Very Safe)"
        col = "#34d399"
        prov = DEFENSE_PROVERBS["suji_outer"]
    elif final_score <= 4.0:
        lvl = "safe_medium"
        label_zh = "半筋 / 幺九牌 (相對安全)"
        label_en = "Half Suji / Terminal (Moderate)"
        col = "#38bdf8"
        prov = DEFENSE_PROVERBS["kabe_no_chance"]
    elif final_score <= 7.0:
        lvl = "danger_medium"
        label_zh = "無筋數牌 (具危險性)"
        label_en = "Unsafe Numbered Tile (Dangerous)"
        col = "#f59e0b"
        prov = DEFENSE_PROVERBS["push_fold"]
    else:
        lvl = "danger_extreme"
        label_zh = "⚠️ 無筋危險中張 (極高危)"
        label_en = "Unsafe Central Tile (Extreme Danger)"
        col = "#ef4444"
        prov = DEFENSE_PROVERBS["push_fold"]

    reasons = []
    if suji_res["is_suji"]:
        reasons.append(suji_res["reason"])
    if kabe_res["has_kabe"]:
        reasons.append(kabe_res["reason"])
    if not reasons:
        reasons.append(f"Unsafe non-suji {info['chinese']} ({tile}) against target player (無筋生牌，易成順子聽張).")

    return {
        "tile": tile,
        "danger_score": round(final_score, 1),
        "safety_level": lvl,
        "safety_label_zh": label_zh,
        "safety_label_en": label_en,
        "color": col,
        "primary_reason": " • ".join(reasons),
        "proverb": prov
    }


# =========================================================================
# 4. Threat Assessment & Push/Fold (攻守判斷) Decision Engine
# =========================================================================

def evaluate_threat_level(
    player_melds: List[Dict[str, Any]],
    player_river: List[Dict[str, Any]],
    seat_wind: str,
    prevailing_wind: str
) -> Dict[str, Any]:
    """
    Analyzes an opponent's table state to determine threat level (Low, Medium, High, Critical / Tenpai).
    """
    meld_count = len(player_melds)
    discards_count = len(player_river)

    # Detect dangerous exposed melds
    dragon_pongs = 0
    wind_pongs = 0
    suit_counts = {"m": 0, "p": 0, "s": 0}

    for m in player_melds:
        m_tiles = m.get("tiles", [])
        if m_tiles:
            first_t = m_tiles[0]
            if first_t in ["5z", "6z", "7z"]:
                dragon_pongs += 1
            elif first_t in ["1z", "2z", "3z", "4z"]:
                wind_pongs += 1
            else:
                s = TILE_INFO_MAP[first_t]["suit"]
                suit_counts[s] += 1

    # Check potential Half-Flush (混一色)
    is_pure_single_suit = False
    active_suits = [s for s, c in suit_counts.items() if c > 0]
    if len(active_suits) == 1 and meld_count >= 2:
        is_pure_single_suit = True

    # Threat categorization
    threat_level = "LOW"
    threat_fan_estimate = 1
    threat_description_zh = "常規起手，威脅度低"

    if meld_count >= 3:
        threat_level = "CRITICAL"
        threat_fan_estimate = 3 + dragon_pongs + (3 if is_pure_single_suit else 0)
        threat_description_zh = f"已亮三副露（{meld_count}副露），極大概率已聽牌！"
    elif meld_count == 2:
        threat_level = "HIGH"
        threat_fan_estimate = 2 + dragon_pongs + (3 if is_pure_single_suit else 0)
        threat_description_zh = f"已開兩副露，進入聽牌/一向聽階段。"
    elif discards_count >= 10:
        threat_level = "HIGH"
        threat_fan_estimate = 1
        threat_description_zh = f"進入第 {discards_count} 巡中後期，手牌已成型。"
    elif meld_count == 1:
        threat_level = "MEDIUM"
        threat_fan_estimate = 1 + dragon_pongs
        threat_description_zh = f"已開一副露（{meld_count}副露）。"

    return {
        "threat_level": threat_level, # "LOW", "MEDIUM", "HIGH", "CRITICAL"
        "estimated_fan": max(1, threat_fan_estimate),
        "is_half_flush_threat": is_pure_single_suit,
        "dragon_pongs": dragon_pongs,
        "description_zh": threat_description_zh
    }


def evaluate_push_fold_decision(
    hand_tiles: List[str],
    seat_wind: str,
    prevailing_wind: str,
    threat_level: str,
    threat_fan_estimate: int,
    visible_counts: List[int]
) -> Dict[str, Any]:
    """
    Evaluates whether the player/bot should:
    - ⚔️ PUSH (進攻/押牌): High hand value / Tenpai
    - ⚖️ MAWASHI (兜牌/回牌): 1-Shanten with decent outs, discarding low danger tiles
    - 🛡️ FOLD (全面棄和/防守 - Betaori): Low hand value / 2+ Shanten against high threat
    """
    counts = hand_to_counts(hand_tiles)
    sh_res = calculate_tvb_shanten(counts, seat_wind, prevailing_wind)
    curr_shanten = sh_res["shanten"]

    # Calculate expected hand value
    potential_fan = 1
    if any(hand_tiles.count(t) >= 3 for t in ["5z", "6z", "7z"]):
        potential_fan += 1
    # Check half-flush
    suits_in_hand = {TILE_INFO_MAP[t]["suit"] for t in hand_tiles if TILE_INFO_MAP[t]["suit"] != "z"}
    if len(suits_in_hand) == 1:
        potential_fan += 3

    # Decision Matrix (Push / Mawashi / Fold)
    if curr_shanten == 0: # Tenpai (聽牌)
        if potential_fan >= 3 or threat_level in ["LOW", "MEDIUM"]:
            decision = "PUSH"
            reason_zh = f"手牌已聽牌（0向聽）且番數具備競爭力（估算 {potential_fan} 番），應堅定【進攻/押牌】！"
            reason_en = f"Hand is in Tenpai with high value ({potential_fan} Fan). Mathematically optimal to PUSH."
        else:
            # Low value 1-fan tenpai against critical threat -> evaluate
            if threat_level == "CRITICAL" and threat_fan_estimate >= 5:
                decision = "MAWASHI"
                reason_zh = f"雖已聽牌但僅有 1 番，對手威脅高達 {threat_fan_estimate} 番，建議【兜牌/轉聽安全牌】。"
                reason_en = f"Low 1-Fan Tenpai vs High Threat. Opt for Mawashi."
            else:
                decision = "PUSH"
                reason_zh = f"手牌已聽牌，收益期望值為正，果斷【進攻】！"
                reason_en = "Tenpai hand warrants a positive EV Push."

    elif curr_shanten == 1: # 1-Shanten (一向聽)
        if threat_level in ["HIGH", "CRITICAL"]:
            if potential_fan >= 4:
                decision = "MAWASHI"
                reason_zh = f"一向聽大牌（{potential_fan} 番），可選擇【兜牌】，兼顧進攻進張並避免打出最高危牌。"
                reason_en = "High value 1-Shanten allows Mawashi (Semi-Folding)."
            else:
                decision = "FOLD"
                reason_zh = f"手牌僅為一向聽小牌（{potential_fan} 番），面對對手 {threat_fan_estimate} 番威脅，應果斷【全面棄胡 (Betaori)】防守！"
                reason_en = "Low value 1-Shanten facing severe threat. Optimal play is Full Fold (Betaori)."
        else:
            decision = "PUSH"
            reason_zh = f"對手威脅較低，手牌一向聽應全力追求進張成副【進攻】。"
            reason_en = "Opponent threat is low. Push forward in 1-Shanten."

    else: # 2-Shanten or worse (二向聽以上)
        if threat_level in ["HIGH", "CRITICAL"]:
            decision = "FOLD"
            reason_zh = f"手牌處於二向聽以上（{curr_shanten}向聽），距離胡牌過遠。對手已亮威脅，必須【完全防守 (Betaori)】！"
            reason_en = f"Hand is {curr_shanten}-Shanten. Distance to win is too far; Full Betaori is required."
        elif threat_level == "MEDIUM":
            decision = "MAWASHI"
            reason_zh = f"手牌進度落後，應轉為【兜牌】，先出安全客風與斷筋牌。"
            reason_en = "Trailing hand development. Practice cautious Mawashi."
        else:
            decision = "PUSH"
            reason_zh = f"對局初期，對手未開露，維持正常牌效【推進】。"
            reason_en = "Early game, low threat. Build hand normally."

    return {
        "decision": decision, # "PUSH", "MAWASHI", "FOLD"
        "shanten": curr_shanten,
        "potential_fan": potential_fan,
        "threat_level": threat_level,
        "threat_fan_estimate": threat_fan_estimate,
        "reason_zh": reason_zh,
        "reason_en": reason_en
    }


# =========================================================================
# 5. Interactive Defense Scenario Generator (防守題庫生成器)
# =========================================================================

def generate_defense_drill_puzzle(scenario_type: str = "betaori") -> Dict[str, Any]:
    """
    Generates rich procedural defense training puzzles:
    - 'betaori': Target opponent is Tenpai, find the safest tile to discard from 14 tiles.
    - 'push_fold': Decide whether to Push, Mawashi, or Fold based on hand quality vs threat.
    - 'suji_reading': Pick the correct Suji/Kabe safe tile among multiple traps.
    """
    # 1. Setup Table State
    prevailing_wind = "1z"
    seat_wind = "2z" # South
    target_seat = "1z" # East Dealer is threatening
    target_name = "Master Chan (陳大師 - 東家)"

    # Opponent River with key discards
    suit = random.choice(["m", "p", "s"])
    other_suit = "p" if suit == "m" else "m"

    if scenario_type == "betaori":
        # Target opponent river has: 4m, 6p, 1z, 2z, 9s, 5s...
        opp_river_tiles = [f"4{suit}", f"6{other_suit}", "1z", "2z", f"9s", f"5s", f"2{suit}"]
        opp_river = [{"tile": t, "is_claimed": False} for t in opp_river_tiles]
        opp_melds = [
            {"type": "pong", "tiles": ["5z", "5z", "5z"]}, # Red Dragon
            {"type": "chow", "tiles": [f"1{suit}", f"2{suit}", f"3{suit}"]}
        ]

        # Your 14 tiles contain 1 100% Genbutsu, 1 Suji outer tile, 1 3-dead honor, and several live dangerous tiles
        genbutsu_tile = f"4{suit}"
        safe_suji_tile = f"1{suit}"
        dead_honor = "7z" # White Dragon (3 visible)
        danger_live_tiles = [f"5{other_suit}", f"4{other_suit}", "6z", f"3{other_suit}", f"8{suit}", f"7{other_suit}"]

        hand = [
            genbutsu_tile, safe_suji_tile, dead_honor,
            f"1{other_suit}", f"2{other_suit}", f"3{other_suit}",
            f"4{other_suit}", f"5{other_suit}", f"6{other_suit}",
            "6z", f"8{suit}", f"7{other_suit}", f"3{suit}", f"3{suit}"
        ]
        hand = sort_tiles(hand)

        # Table visible counts
        vis_counts = [0] * 34
        # Set 3-dead for 7z (3 copies in discards)
        vis_counts[TILE_INDEX_MAP["7z"]] = 3
        # Set river counts
        for t in opp_river_tiles:
            vis_counts[TILE_INDEX_MAP[t]] += 1
        for m in opp_melds:
            for t in m["tiles"]:
                vis_counts[TILE_INDEX_MAP[t]] += 1

        # Analyze all tiles in hand
        tile_ratings = []
        for t in set(hand):
            rating = calculate_tile_danger_score(
                tile=t,
                target_player_river=opp_river,
                table_visible_counts=vis_counts,
                prevailing_wind=prevailing_wind,
                target_seat_wind=target_seat,
                target_melds_count=len(opp_melds)
            )
            tile_ratings.append(rating)

        tile_ratings.sort(key=lambda x: x["danger_score"])
        safest_tiles = [r["tile"] for r in tile_ratings if r["danger_score"] == tile_ratings[0]["danger_score"]]

        return {
            "puzzle_id": f"def_{random.randint(1000, 9999)}",
            "scenario_type": "betaori",
            "title_zh": "🛡️ 完全防守棄和 (Full Betaori Safe Discard Drill)",
            "title_en": "Full Betaori: Identify the Safest Discard",
            "threat_info": {
                "player_name": target_name,
                "seat_wind": target_seat,
                "melds": opp_melds,
                "river": opp_river,
                "threat_level": "CRITICAL",
                "estimated_fan": 4,
                "threat_summary_zh": "東家莊家已開兩副露（紅中刻 + 順子），估計起碼 4 番起跳！你手牌處於二向聽，請找出【最安全的防守捨牌】。"
            },
            "user_hand": hand,
            "ground_truth": {
                "optimal_decision": "FOLD",
                "safest_tiles": safest_tiles,
                "best_discard": safest_tiles[0],
                "tile_ratings": tile_ratings,
                "explanation_zh": f"最優解為打出 100% 現物【{TILE_INFO_MAP[safest_tiles[0]]['chinese']} ({safest_tiles[0]})】或三見字牌【{dead_honor}】。對手已露兩副大牌且自己向聽數過遠，不可打出任何無筋生張！",
                "explanation_en": f"Optimal discard is 100% Genbutsu {safest_tiles[0]} or 3-dead Honor {dead_honor}."
            }
        }

    else: # Push/Fold scenario
        opp_melds = [
            {"type": "pong", "tiles": ["6z", "6z", "6z"]} # Green Dragon
        ]
        opp_river = [{"tile": t, "is_claimed": False} for t in ["1m", "9p", "1s", "4z", "2z"]]

        # Generate a 1-Shanten high value hand (e.g. Half Flush)
        hand = ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "55z", "11z", "3p"]
        hand = sort_tiles(hand)

        vis_counts = [0] * 34

        push_eval = evaluate_push_fold_decision(
            hand_tiles=hand,
            seat_wind=seat_wind,
            prevailing_wind=prevailing_wind,
            threat_level="MEDIUM",
            threat_fan_estimate=2,
            visible_counts=vis_counts
        )

        return {
            "puzzle_id": f"def_{random.randint(1000, 9999)}",
            "scenario_type": "push_fold",
            "title_zh": "⚖️ 攻守轉折點抉擇 (Push vs Fold Turning Point)",
            "title_en": "Push vs Fold Tactical Decision Drill",
            "threat_info": {
                "player_name": target_name,
                "seat_wind": target_seat,
                "melds": opp_melds,
                "river": opp_river,
                "threat_level": "MEDIUM",
                "estimated_fan": 2,
                "threat_summary_zh": "對手開出一副露發財刻（估計 1-2 番），巡目尚早。你的手牌已有清一色/混一色高番雛形（一向聽），此時應選擇【進攻】、【兜牌】還是【全面棄和】？"
            },
            "user_hand": hand,
            "ground_truth": {
                "optimal_decision": push_eval["decision"],
                "shanten": push_eval["shanten"],
                "potential_fan": push_eval["potential_fan"],
                "explanation_zh": push_eval["reason_zh"],
                "explanation_en": push_eval["reason_en"]
            }
        }


def verify_defense_drill_answer(
    puzzle_type: str,
    user_choice: str, # either selected tile for betaori, or "PUSH"|"MAWASHI"|"FOLD"
    ground_truth: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Verifies user's defense drill submission against ground truth calculation.
    """
    if puzzle_type == "betaori":
        safest = ground_truth.get("safest_tiles", [])
        is_correct = (user_choice in safest)
        ratings = ground_truth.get("tile_ratings", [])
        chosen_rating = next((r for r in ratings if r["tile"] == user_choice), None)

        return {
            "is_correct": is_correct,
            "user_choice": user_choice,
            "optimal_choice": safest[0] if safest else None,
            "safest_tiles": safest,
            "tile_ratings": ratings,
            "user_tile_danger": chosen_rating["danger_score"] if chosen_rating else 99.0,
            "explanation_zh": ground_truth.get("explanation_zh", ""),
            "explanation_en": ground_truth.get("explanation_en", "")
        }
    else: # push_fold
        opt_decision = ground_truth.get("optimal_decision", "FOLD")
        is_correct = (user_choice == opt_decision)

        return {
            "is_correct": is_correct,
            "user_choice": user_choice,
            "optimal_choice": opt_decision,
            "explanation_zh": ground_truth.get("explanation_zh", ""),
            "explanation_en": ground_truth.get("explanation_en", "")
        }
