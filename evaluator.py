"""
TVB 2026 Hong Kong Mahjong Tactical Scenario & Efficiency Evaluator.
Calculates mathematical efficiency, Shanten, Ukeire outs, and optimal discard
for 14-tile hands strictly compliant with TVB 2026 Championship Rules.
"""

from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
from engine.tiles import (
    ALL_TILE_CODES,
    TILE_INDEX_MAP,
    INDEX_TILE_MAP,
    TILE_UNICODE_MAP,
    TILE_INFO_MAP,
    hand_to_counts,
    counts_to_hand,
    sort_tiles,
    create_shuffled_wall,
    parse_compact_string
)
from engine.shanten import calculate_tvb_shanten
from engine.ukeire import calculate_ukeire_for_13
from fan_calculator import calculate_fan


def generate_random_scenario(seat_wind: str = "1z", prevailing_wind: str = "1z") -> Dict[str, Any]:
    """Generates a random 14-tile hand from a freshly shuffled 136-tile wall and evaluates it."""
    wall = create_shuffled_wall()
    hand_tiles = sort_tiles(wall[:14])
    remaining_wall = wall[14:]

    evaluation = evaluate_14_hand(hand_tiles, seat_wind, prevailing_wind)

    return {
        "tiles": hand_tiles,
        "seat_wind": seat_wind,
        "prevailing_wind": prevailing_wind,
        "remaining_wall_count": len(remaining_wall),
        "evaluation": evaluation
    }


def evaluate_14_hand(
    hand_tiles: List[str], 
    seat_wind: str = "1z", 
    prevailing_wind: str = "1z",
    visible_discards: Optional[List[str]] = None,
    visible_counts: Optional[List[int]] = None,
    allowed_discards: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluates all possible discards for a 14-tile hand.
    For each unique discard:
    - Calculates resulting 13-tile Shanten towards valid >= 1 Fan TVB winning paths.
    - Calculates Ukeire (total unseen outs in wall and accepted tiles list, accounting for visible discards).
    - Identifies mathematically optimal discard(s) (lowest Shanten, then highest Ukeire).
    """
    if len(hand_tiles) % 3 != 2:
        raise ValueError(f"Hand must contain a turn-discard count of tiles (14, 11, 8, 5, 2), got {len(hand_tiles)}.")

    counts = hand_to_counts(hand_tiles)
    if allowed_discards is not None:
        unique_tiles = [t for t in set(allowed_discards) if counts[TILE_INDEX_MAP[t]] > 0]
    else:
        unique_tiles = [INDEX_TILE_MAP[i] for i in range(34) if counts[i] > 0]

    # Compute overall visible counts across hand + discards
    full_vis_counts = None
    if visible_counts is not None:
        full_vis_counts = list(visible_counts)
    elif visible_discards is not None:
        full_vis_counts = [counts[i] for i in range(34)]
        disc_c = hand_to_counts(visible_discards)
        for i in range(34):
            full_vis_counts[i] += disc_c[i]

    initial_eval = calculate_tvb_shanten(counts, seat_wind, prevailing_wind)
    is_winning_hand = (initial_eval["shanten"] == -1)
    winning_fan = None

    if is_winning_hand:
        winning_fan = calculate_fan(
            tiles=hand_tiles,
            is_self_draw=True,
            prevailing_wind=prevailing_wind,
            seat_wind=seat_wind
        )

    discard_results = []
    min_shanten = 999
    max_outs = -1

    for d_tile in unique_tiles:
        d_idx = TILE_INDEX_MAP[d_tile]
        
        counts[d_idx] -= 1

        ukeire_res = calculate_ukeire_for_13(
            counts, 
            seat_wind, 
            prevailing_wind, 
            visible_counts=full_vis_counts
        )
        shanten = ukeire_res["shanten"]
        outs = ukeire_res["total_outs"]

        if shanten < min_shanten:
            min_shanten = shanten
            max_outs = outs
        elif shanten == min_shanten and outs > max_outs:
            max_outs = outs

        info = TILE_INFO_MAP[d_tile]

        discard_results.append({
            "tile": d_tile,
            "unicode": info["unicode"],
            "chinese": info["chinese"],
            "jyutping": info["jyutping"],
            "english": info["english"],
            "suit": info["suit"],
            "value": info["value"],
            "shanten": shanten,
            "shanten_text": ukeire_res["shanten_text"],
            "total_outs": outs,
            "outs_count": outs,
            "unique_acceptance_count": ukeire_res["unique_acceptance_count"],
            "accepted_tiles": ukeire_res["accepted_tiles"],
            "viable_paths": ukeire_res["viable_paths"],
            "is_chicken_hand_trap": ukeire_res["is_chicken_hand_trap"],
            "unconstrained_shanten": ukeire_res["unconstrained_shanten"],
            "is_optimal": False
        })

        counts[d_idx] += 1

    # Mark optimal discards
    optimal_discards = []
    for res in discard_results:
        if res["shanten"] == min_shanten and res["total_outs"] == max_outs:
            res["is_optimal"] = True
            optimal_discards.append(res["tile"])

    # Sort discards by efficiency: (shanten ASC, total_outs DESC, canonical order)
    discard_results.sort(key=lambda x: (x["shanten"], -x["total_outs"], TILE_INDEX_MAP[x["tile"]]))

    primary_optimal = discard_results[0] if discard_results else None
    opt_info = TILE_INFO_MAP[primary_optimal["tile"]] if primary_optimal else {}

    summary_en = (
        f"Optimal Discard: {opt_info.get('english', '')} ({primary_optimal['tile'] if primary_optimal else ''}) "
        f"leaving {primary_optimal['total_outs'] if primary_optimal else 0} outs ({primary_optimal['shanten_text'] if primary_optimal else ''})."
    )
    summary_zh = (
        f"最佳打牌：{opt_info.get('chinese', '')} ({opt_info.get('jyutping', '')})，"
        f"進張數 {primary_optimal['total_outs'] if primary_optimal else 0} 張 ({primary_optimal['shanten_text'] if primary_optimal else ''})。"
    )

    return {
        "hand_tiles": hand_tiles,
        "seat_wind": seat_wind,
        "prevailing_wind": prevailing_wind,
        "is_winning_hand": is_winning_hand,
        "winning_fan": winning_fan,
        "best_shanten": min_shanten,
        "max_outs": max_outs,
        "total_outs": max_outs,
        "optimal_discard": primary_optimal["tile"] if primary_optimal else "",
        "optimal_discards": optimal_discards,
        "accepted_tiles": primary_optimal["accepted_tiles"] if primary_optimal else [],
        "summary_en": summary_en,
        "summary_zh": summary_zh,
        "discards": discard_results
    }


def compare_user_decision(
    hand_tiles: List[str],
    user_discard: str,
    seat_wind: str = "1z",
    prevailing_wind: str = "1z",
    eval_result: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Compares user's selected discard against mathematically optimal discard.
    Provides detailed math breakdown: outs difference, Shanten difference, and accepted tiles.
    """
    if eval_result is None or "discards" not in eval_result:
        eval_result = evaluate_14_hand(hand_tiles, seat_wind, prevailing_wind)

    user_info = TILE_INFO_MAP.get(user_discard, {"chinese": user_discard, "jyutping": "", "english": user_discard, "unicode": "🀄"})
    optimal_tile = eval_result["optimal_discard"]
    optimal_info = TILE_INFO_MAP.get(optimal_tile, {"chinese": optimal_tile, "jyutping": "", "english": optimal_tile, "unicode": "🀄"})

    user_opt = next((d for d in eval_result["discards"] if d["tile"] == user_discard), None)
    best_opt = eval_result["discards"][0] if eval_result["discards"] else None

    is_correct = user_discard in eval_result["optimal_discards"]

    user_outs = user_opt["total_outs"] if user_opt else 0
    best_outs = best_opt["total_outs"] if best_opt else 0
    outs_delta = best_outs - user_outs

    user_shanten = user_opt["shanten"] if user_opt else 99
    best_shanten = best_opt["shanten"] if best_opt else 99
    shanten_delta = user_shanten - best_shanten

    if is_correct:
        status = "optimal"
        title_en = "Optimal Discard! ✨"
        title_zh = "最佳打牌！完全正確 ✨"
        delta_en = f"You discarded {user_info['unicode']} {user_info['english']} ({user_discard}), achieving the highest efficiency with {user_outs} outs ({user_opt['shanten_text']})."
        delta_zh = f"你選擇打出 {user_info['unicode']} {user_info['chinese']} ({user_info['jyutping']})，達成最佳牌效，進張數為 {user_outs} 張 ({user_opt['shanten_text']})。"
    else:
        status = "suboptimal"
        title_en = "Suboptimal Discard ⚠️"
        title_zh = "非最佳打法 ⚠️"

        if shanten_delta > 0:
            delta_en = (
                f"You discarded {user_info['unicode']} {user_info['english']} ({user_discard}) leaving {user_outs} outs, but this sets your hand back to {user_opt['shanten_text']}. "
                f"The optimal discard was {optimal_info['unicode']} {optimal_info['english']} ({optimal_tile}), which puts your hand at {best_opt['shanten_text']} with {best_outs} outs!"
            )
            delta_zh = (
                f"你打出了 {user_info['unicode']} {user_info['chinese']} ({user_info['jyutping']})，進張 {user_outs} 張，但手牌退步至 {user_opt['shanten_text']}。\n"
                f"最佳打牌應為 {optimal_info['unicode']} {optimal_info['chinese']} ({optimal_info['jyutping']})，可直接達成 {best_opt['shanten_text']} 並保有 {best_outs} 張進張！"
            )
        else:
            delta_en = (
                f"You discarded {user_info['unicode']} {user_info['english']} ({user_discard}) leaving {user_outs} outs ({user_opt['shanten_text']}). "
                f"The optimal discard was {optimal_info['unicode']} {optimal_info['english']} ({optimal_tile}), which leaves {best_outs} outs ({best_opt['shanten_text']}) "
                f"— a difference of {outs_delta} outs!"
            )
            delta_zh = (
                f"你打出了 {user_info['unicode']} {user_info['chinese']} ({user_info['jyutping']})，剩餘進張 {user_outs} 張 ({user_opt['shanten_text']})。\n"
                f"最佳打牌應為 {optimal_info['unicode']} {optimal_info['chinese']} ({optimal_info['jyutping']})，進張多達 {best_outs} 張 ({best_opt['shanten_text']}) "
                f"— 相差 {outs_delta} 張進張！"
            )

    return {
        "is_correct": is_correct,
        "status": status,
        "title_en": title_en,
        "title_zh": title_zh,
        "user_discard": user_discard,
        "user_discard_info": user_info,
        "user_outs": user_outs,
        "user_shanten": user_shanten,
        "user_accepted_tiles": user_opt["accepted_tiles"] if user_opt else [],
        "user_viable_paths": user_opt["viable_paths"] if user_opt else [],
        "optimal_discard": optimal_tile,
        "optimal_discard_info": optimal_info,
        "optimal_discards": eval_result["optimal_discards"],
        "best_outs": best_outs,
        "best_shanten": best_shanten,
        "best_accepted_tiles": best_opt["accepted_tiles"] if best_opt else [],
        "best_viable_paths": best_opt["viable_paths"] if best_opt else [],
        "outs_delta": outs_delta,
        "shanten_delta": shanten_delta,
        "delta_reasoning_en": delta_en,
        "delta_reasoning_zh": delta_zh,
        "evaluation": eval_result
    }
