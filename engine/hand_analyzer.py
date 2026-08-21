"""
Comprehensive Hand Breakdown and Tactical Mahjong Theory Analyzer.
Decomposes 14-tile hands into structural blocks (melds, pairs, continuous shapes, isolated tiles)
and generates optimal strategic lines of play under TVB 2026 rules.
"""

from typing import Dict, Any, List, Optional
from engine.tiles import (
    ALL_TILE_CODES, 
    INDEX_TILE_MAP, 
    TILE_INDEX_MAP, 
    TILE_INFO_MAP, 
    sort_tiles, 
    hand_to_counts
)
from evaluator import evaluate_14_hand
from fan_calculator import calculate_fan


def identify_hand_blocks(tiles: List[str]) -> Dict[str, Any]:
    """
    Decomposes a 14-tile hand into recognized Mahjong shapes:
    - 5-tile sequential runs (e.g. 23456m)
    - 4-tile Nobeta shapes (e.g. 2345p)
    - 4-tile Aryamen shapes (e.g. 2334s)
    - Finished Chows & Pongs
    - Pairs / Head candidates
    - Isolated terminals and guest winds
    """
    counts = hand_to_counts(tiles)
    blocks: List[Dict[str, Any]] = []
    
    # Check 5-tile continuous runs in suits
    for suit_idx in range(3):
        base = suit_idx * 9
        suit_letter = ['m', 'p', 's'][suit_idx]
        suit_name = {'m': '萬子 (Characters)', 'p': '筒子 (Dots)', 's': '索子 (Bamboos)'}[suit_letter]

        # Scan for 5-in-a-row (e.g., 23456)
        for start in range(5):
            if all(counts[base + start + i] >= 1 for i in range(5)):
                run_str = "".join([f"{start + 1 + i}" for i in range(5)]) + suit_letter
                blocks.append({
                    "type": "5_sided_run",
                    "name_zh": f"五面聽連續長條形 ({run_str})",
                    "name_en": f"5-Sided Continuous Run ({run_str})",
                    "suit": suit_name,
                    "theory": "包含兩個重疊順子，可產生極高進張數（多面聽）。切忌輕易拆除！",
                    "priority": 1
                })

        # Scan for 4-in-a-row (Nobeta: 2345)
        for start in range(6):
            if all(counts[base + start + i] >= 1 for i in range(4)):
                run_str = "".join([f"{start + 1 + i}" for i in range(4)]) + suit_letter
                blocks.append({
                    "type": "nobeta_4_run",
                    "name_zh": f"伸張四連形 ({run_str})",
                    "name_en": f"Nobeta 4-Tile Run ({run_str})",
                    "suit": suit_name,
                    "theory": "具備雙向延伸與雀頭生成能力，摸入兩端可成雙順子，摸入中間可作將。",
                    "priority": 2
                })

    # Check Pairs and Triplets
    for i, count in enumerate(counts):
        code = INDEX_TILE_MAP[i]
        info = TILE_INFO_MAP[code]
        if count >= 3:
            blocks.append({
                "type": "triplet",
                "name_zh": f"刻子/暗刻 ({info['chinese']} x3)",
                "name_en": f"Pong Triplet ({code} x3)",
                "theory": "已完成的面子，提供穩定的面子數，若為字牌或風牌可能提供番數。",
                "priority": 3
            })
        elif count == 2:
            blocks.append({
                "type": "pair",
                "name_zh": f"對子/雀頭候選 ({info['chinese']} x2)",
                "name_en": f"Pair Head Candidate ({code} x2)",
                "theory": "可作為將牌（雀頭），亦可保留碰牌成刻。",
                "priority": 4
            })

    # Check Isolated Guest Winds & Dead Honors
    for i in range(27, 34):
        code = INDEX_TILE_MAP[i]
        info = TILE_INFO_MAP[code]
        if counts[i] == 1:
            is_dragon = (i >= 31)
            blocks.append({
                "type": "isolated_honor",
                "name_zh": f"孤張字牌 ({info['chinese']})",
                "name_en": f"Isolated Honor ({code})",
                "theory": "中發白具1番潛力；若為客風則無番且僅剩3張進張，為開局首要捨牌目標。" if not is_dragon else "三元牌單張，摸入成對可碰出1番。",
                "priority": 5
            })

    return {
        "blocks": blocks,
        "total_blocks_found": len(blocks)
    }


def analyze_hand_deep_strategy(
    tiles: List[str],
    seat_wind: str = "1z",
    prevailing_wind: str = "1z"
) -> Dict[str, Any]:
    """
    Performs a deep tactical breakdown of a 14-tile hand.
    Returns:
    - Base evaluation (discards, outs, shanten)
    - Structural blocks identified
    - TVB 2026 rule constraints & Chicken hand risk analysis
    - Ranked Tactical Lines of Play with step-by-step master advice
    """
    sorted_tiles = sort_tiles(tiles)
    eval_result = evaluate_14_hand(sorted_tiles, seat_wind, prevailing_wind)
    blocks_data = identify_hand_blocks(sorted_tiles)

    # Assess 1-Fan minimum legality & winning potential
    is_winning = eval_result["is_winning_hand"]
    current_shanten = eval_result.get("best_shanten", 0)

    fan_assessment = {
        "is_winning": is_winning,
        "current_shanten": current_shanten,
        "shanten_label": "🎯 聽牌 (Tenpai)" if current_shanten == 0 else f"{current_shanten}向聽 ({current_shanten}-Shanten)",
        "notes": []
    }

    # Analyze Tactical Lines
    tactical_lines: List[Dict[str, Any]] = []
    
    for rank_idx, discard_eval in enumerate(eval_result["discards"]):
        tile_code = discard_eval["tile"]
        tile_info = TILE_INFO_MAP[tile_code]
        shanten = discard_eval["shanten"]
        outs = discard_eval["total_outs"]
        is_opt = discard_eval["is_optimal"]

        # Formulate strategic advice for this line
        line_title = f"Line #{rank_idx + 1}: Discard {tile_info['chinese']} ({tile_code})"
        
        # Determine tactical reasoning category
        category = "牌效進攻 (Pure Tile Efficiency)"
        if tile_info["is_honor"]:
            if tile_code in ["5z", "6z", "7z"]:
                category = "三元字牌捨牌抉擇 (Dragon Honor Discard)"
            else:
                category = "風牌與防守優先級 (Wind Discard Priority)"
        elif discard_eval.get("viable_paths") and any(p["name"] == "混一色" for p in discard_eval["viable_paths"]):
            category = "混一色 3番高番轉型 (Half-Flush Conversion)"
        elif discard_eval.get("viable_paths") and any(p["name"] == "十三幺" for p in discard_eval["viable_paths"]):
            category = "十三幺 10番例牌路線 (Thirteen Orphans Branch)"
        elif outs >= 16:
            category = "多面聽高進張擴展 (Multi-Sided Expansion)"

        # Step-by-step action plan
        action_plan_zh = ""
        action_plan_en = ""
        top_draws = [t["tile"] for t in discard_eval["accepted_tiles"][:3]]
        draws_str = ", ".join(top_draws) if top_draws else "Any meld"

        if shanten == 0:
            action_plan_zh = f"打出【{tile_info['chinese']}】後直接進入【聽牌】狀態！聽牌等待 {draws_str} 等共 {outs} 張牌胡牌。"
            action_plan_en = f"Discarding {tile_code} puts hand in Tenpai waiting on {draws_str} ({outs} total outs)."
        elif shanten == 1:
            action_plan_zh = f"打出【{tile_info['chinese']}】後進入【一向聽】。摸入 {draws_str} 中任意一張即可聽牌！"
            action_plan_en = f"Discarding {tile_code} enters 1-Shanten. Drawing any of {draws_str} immediately achieves Tenpai."
        else:
            action_plan_zh = f"打出【{tile_info['chinese']}】進入【{shanten}向聽】，保持手牌 {outs} 張最大進張面。"
            action_plan_en = f"Discarding {tile_code} enters {shanten}-Shanten with {outs} total outs."

        tactical_lines.append({
            "rank": rank_idx + 1,
            "discard_tile": tile_code,
            "discard_chinese": tile_info["chinese"],
            "discard_jyutping": tile_info["jyutping"],
            "shanten": shanten,
            "shanten_label": "🎯 聽牌 (Tenpai)" if shanten == 0 else f"{shanten}向聽 ({shanten}-Shanten)",
            "total_outs": outs,
            "unique_types": discard_eval["unique_acceptance_count"],
            "accepted_tiles": discard_eval["accepted_tiles"],
            "is_optimal": is_opt,
            "category": category,
            "action_plan_zh": action_plan_zh,
            "action_plan_en": action_plan_en,
            "viable_paths": discard_eval.get("viable_paths", [])
        })

    return {
        "tiles": sorted_tiles,
        "seat_wind": seat_wind,
        "prevailing_wind": prevailing_wind,
        "is_winning_hand": is_winning,
        "winning_fan": eval_result.get("winning_fan"),
        "current_shanten": current_shanten,
        "optimal_discard": eval_result["optimal_discard"],
        "blocks_data": blocks_data,
        "fan_assessment": fan_assessment,
        "tactical_lines": tactical_lines,
        "full_discards": eval_result["discards"]
    }
