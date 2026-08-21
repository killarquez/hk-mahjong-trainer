"""
TVB 2026 Ukeire (Tile Acceptance / 進張數) Calculator Engine.
Calculates for any 13-tile hand:
- Shanten to nearest valid >= 1 Fan winning hand
- Set of accepted tiles (進張牌) that advance Shanten (or win if Tenpai)
- Remaining unseen counts in wall (max 4 per tile type minus copies in hand)
- Total Ukeire outs
- Resulting Shanten upon drawing each accepted tile
- Viable TVB winning paths for each acceptance tile
"""

from typing import List, Dict, Any, Tuple, Optional
from engine.tiles import (
    ALL_TILE_CODES,
    TILE_INDEX_MAP,
    INDEX_TILE_MAP,
    TILE_UNICODE_MAP,
    TILE_INFO_MAP,
    hand_to_counts,
    counts_to_hand,
    sort_tiles
)
from engine.shanten import calculate_tvb_shanten
from fan_calculator import calculate_fan

def calculate_ukeire_for_13(
    counts: List[int],
    seat_wind: str = "1z",
    prevailing_wind: str = "1z",
    visible_counts: Optional[List[int]] = None,
    open_melds: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates Ukeire (Tile Acceptance) for a 13-tile hand.
    Accepts optional visible_counts (accounting for river discards + exposed melds + hand).
    If open_melds is provided, ensures win checks strictly honor fixed open melds.
    Returns:
    - shanten: int
    - total_outs: int
    - accepted_tiles: List[Dict]
    - viable_paths: List[Dict]
    - is_chicken_hand_trap: bool
    """
    eval_curr = calculate_tvb_shanten(counts, seat_wind, prevailing_wind)
    current_shanten = eval_curr["shanten"]

    accepted_tiles = []
    total_outs = 0

    # Iterate through all 34 standard tile types
    for idx in range(34):
        if visible_counts is not None:
            wall_rem = max(0, 4 - visible_counts[idx])
        else:
            hand_c = counts[idx]
            wall_rem = max(0, 4 - hand_c)

        if wall_rem <= 0:
            continue

        # Temporarily draw tile idx (forming 14 tiles)
        counts[idx] += 1

        is_accepted = False
        res_shanten = current_shanten

        if current_shanten == 0:
            # Current hand is Tenpai: check if drawing idx wins (Shanten == -1)
            if open_melds:
                draw_tiles = counts_to_hand(counts)
                win_check = calculate_fan(
                    tiles=sort_tiles(draw_tiles),
                    winning_tile=INDEX_TILE_MAP[idx],
                    is_self_draw=True,
                    prevailing_wind=prevailing_wind,
                    seat_wind=seat_wind,
                    open_melds=open_melds
                )
                if win_check.get("is_valid_win") and win_check.get("total_fan", 0) >= 1:
                    is_accepted = True
                    res_shanten = -1
            else:
                eval_draw = calculate_tvb_shanten(counts, seat_wind, prevailing_wind)
                if eval_draw["shanten"] == -1:
                    is_accepted = True
                    res_shanten = -1
        else:
            # Current hand is S-shanten (S > 0): check if discarding any tile achieves S-1
            # We only need to test discarding tiles that exist in hand
            best_sub_shanten = 99
            for d_idx in range(34):
                if counts[d_idx] > 0:
                    counts[d_idx] -= 1
                    sub_eval = calculate_tvb_shanten(counts, seat_wind, prevailing_wind)
                    if sub_eval["shanten"] < best_sub_shanten:
                        best_sub_shanten = sub_eval["shanten"]
                    counts[d_idx] += 1
                    if best_sub_shanten < current_shanten:
                        break # Found an advancing discard

            if best_sub_shanten < current_shanten:
                is_accepted = True
                res_shanten = best_sub_shanten

        # Revert drawn tile
        counts[idx] -= 1

        if is_accepted:
            t_code = INDEX_TILE_MAP[idx]
            info = TILE_INFO_MAP[t_code]
            total_outs += wall_rem
            accepted_tiles.append({
                "tile": t_code,
                "unicode": info["unicode"],
                "chinese": info["chinese"],
                "jyutping": info["jyutping"],
                "english": info["english"],
                "suit": info["suit"],
                "value": info["value"],
                "count": wall_rem,
                "resulting_shanten": res_shanten,
                "status_text": "胡牌 (Win)" if res_shanten == -1 else ("聽牌 (Tenpai)" if res_shanten == 0 else f"{res_shanten}向聽")
            })

    # Sort accepted tiles canonically (m -> p -> s -> z)
    accepted_tiles.sort(key=lambda x: TILE_INDEX_MAP[x["tile"]])

    # Shanten name formatting
    shanten_text = "胡牌 (Agari / Complete)" if current_shanten == -1 else (
        "聽牌 (Tenpai / Ready)" if current_shanten == 0 else (
            "一向聽 (1-Shanten)" if current_shanten == 1 else (
                "二向聽 (2-Shanten)" if current_shanten == 2 else f"{current_shanten}向聽 ({current_shanten}-Shanten)"
            )
        )
    )

    return {
        "shanten": current_shanten,
        "shanten_text": shanten_text,
        "total_outs": total_outs,
        "outs_count": total_outs,
        "unique_acceptance_count": len(accepted_tiles),
        "accepted_tiles": accepted_tiles,
        "viable_paths": eval_curr["viable_paths"],
        "is_chicken_hand_trap": eval_curr["is_chicken_hand_trap"],
        "unconstrained_shanten": eval_curr["unconstrained_shanten"]
    }
