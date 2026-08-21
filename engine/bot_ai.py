"""
TVB 2026 Hong Kong Mahjong Bot AI Engine (Grandmaster Offense & Defense).
Implements state-of-the-art decision-making for AI opponents playing under TVB 2026 rules:
- Dynamic discard selection based on lowest Shanten and highest Ukeire (with river awareness)
- Table-wide threat detection & mathematical Push/Fold (攻守判斷) engine
- Tactical Betaori (全面防守/棄和) discarding Genbutsu, Suji, and Kabe safe tiles against Tenpai opponents
- Claim evaluations (Hu, Pong, Kong, Chow) prioritizing valid >= 1 Fan winning conditions
"""

from typing import List, Dict, Any, Optional, Tuple
from engine.tiles import (
    ALL_TILE_CODES,
    TILE_INDEX_MAP,
    INDEX_TILE_MAP,
    TILE_INFO_MAP,
    hand_to_counts,
    counts_to_hand,
    sort_tiles
)
from engine.shanten import calculate_tvb_shanten
from engine.ukeire import calculate_ukeire_for_13
from fan_calculator import calculate_fan
from evaluator import evaluate_14_hand
from engine.defense_engine import (
    calculate_tile_danger_score,
    evaluate_threat_level,
    evaluate_push_fold_decision
)


class MahjongBotAI:
    def __init__(self, name: str, seat_wind: str, personality: str = "balanced"):
        self.name = name
        self.seat_wind = seat_wind
        self.personality = personality # "balanced", "aggressive", "efficient"

    def select_discard(
        self,
        hand_14: List[str],
        prevailing_wind: str = "1z",
        visible_discards: Optional[List[str]] = None,
        opponents_data: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Determines the optimal discard for a 14-tile hand.
        Balances offensive tile efficiency (Ukeire) with defensive threat evaluation (Push/Fold).
        """
        eval_res = evaluate_14_hand(
            hand_tiles=hand_14,
            seat_wind=self.seat_wind,
            prevailing_wind=prevailing_wind,
            visible_discards=visible_discards
        )

        if eval_res["is_winning_hand"]:
            return {
                "action": "tsumo",
                "tile": None,
                "is_win": True,
                "winning_fan": eval_res["winning_fan"]
            }

        # 1. Evaluate Table Threat Level
        highest_threat = "LOW"
        highest_threat_fan = 1
        most_dangerous_opp = None

        vis_counts = hand_to_counts((visible_discards or []) + hand_14)

        if opponents_data:
            for opp in opponents_data:
                melds = opp.get("melds", [])
                river = opp.get("river", [])
                seat = opp.get("seat_wind", "1z")
                threat = evaluate_threat_level(melds, river, seat, prevailing_wind)

                if threat["threat_level"] in ["CRITICAL", "HIGH"] and highest_threat not in ["CRITICAL"]:
                    highest_threat = threat["threat_level"]
                    highest_threat_fan = threat["estimated_fan"]
                    most_dangerous_opp = opp
                elif threat["threat_level"] == "MEDIUM" and highest_threat == "LOW":
                    highest_threat = "MEDIUM"
                    highest_threat_fan = threat["estimated_fan"]
                    most_dangerous_opp = opp

        # 2. Push / Fold Posture Decision
        push_eval = evaluate_push_fold_decision(
            hand_tiles=hand_14,
            seat_wind=self.seat_wind,
            prevailing_wind=prevailing_wind,
            threat_level=highest_threat,
            threat_fan_estimate=highest_threat_fan,
            visible_counts=vis_counts
        )

        posture = push_eval["decision"] # "PUSH", "MAWASHI", "FOLD"

        # Defensive Branch: Full Betaori (全面防守/棄和)
        if posture == "FOLD" and most_dangerous_opp:
            target_river = most_dangerous_opp.get("river", [])
            target_seat = most_dangerous_opp.get("seat_wind", "1z")
            target_melds_count = len(most_dangerous_opp.get("melds", []))

            # Score danger of each unique tile held
            scored_tiles = []
            for t in set(hand_14):
                danger = calculate_tile_danger_score(
                    tile=t,
                    target_player_river=target_river,
                    table_visible_counts=vis_counts,
                    prevailing_wind=prevailing_wind,
                    target_seat_wind=target_seat,
                    target_melds_count=target_melds_count
                )
                scored_tiles.append((t, danger["danger_score"], danger))

            scored_tiles.sort(key=lambda x: x[1])
            safest_tile = scored_tiles[0][0]

            return {
                "action": "discard",
                "tile": safest_tile,
                "is_win": False,
                "shanten": eval_res.get("best_shanten", 99),
                "total_outs": eval_res.get("max_outs", 0),
                "tactical_posture": "FOLD (Betaori / 完全棄和)",
                "danger_score": scored_tiles[0][1],
                "evaluation": eval_res
            }

        # Semi-Defensive Branch: Mawashi (兜牌 / 兼顧防守與牌效)
        if posture == "MAWASHI" and most_dangerous_opp and "discards" in eval_res:
            target_river = most_dangerous_opp.get("river", [])
            target_seat = most_dangerous_opp.get("seat_wind", "1z")
            target_melds_count = len(most_dangerous_opp.get("melds", []))

            # Pick among optimal / viable discards that have minimum danger
            viable_discards = [d["tile"] for d in eval_res["discards"] if d.get("shanten", 99) <= eval_res.get("best_shanten", 99)]
            if not viable_discards:
                viable_discards = hand_14

            scored_viable = []
            for t in viable_discards:
                danger = calculate_tile_danger_score(
                    tile=t,
                    target_player_river=target_river,
                    table_visible_counts=vis_counts,
                    prevailing_wind=prevailing_wind,
                    target_seat_wind=target_seat,
                    target_melds_count=target_melds_count
                )
                scored_viable.append((t, danger["danger_score"]))

            scored_viable.sort(key=lambda x: x[1])
            chosen_tile = scored_viable[0][0]

            return {
                "action": "discard",
                "tile": chosen_tile,
                "is_win": False,
                "shanten": eval_res.get("best_shanten", 99),
                "total_outs": eval_res.get("max_outs", 0),
                "tactical_posture": "MAWASHI (兜牌 / 安全牌效兼顧)",
                "danger_score": scored_viable[0][1],
                "evaluation": eval_res
            }

        # Offensive Branch: Pure Mathematical Efficiency (Push / 進攻)
        chosen_tile = eval_res.get("optimal_discard") or (hand_14[-1] if hand_14 else "1m")
        best_shanten = eval_res.get("best_shanten", 99)
        max_outs = eval_res.get("max_outs", 0)

        return {
            "action": "discard",
            "tile": chosen_tile,
            "is_win": False,
            "shanten": best_shanten,
            "total_outs": max_outs,
            "tactical_posture": "PUSH (進攻 / 最大牌效)",
            "evaluation": eval_res
        }

    def evaluate_claim(
        self,
        hand_13: List[str],
        discarded_tile: str,
        discarder_seat: str,
        prevailing_wind: str = "1z",
        visible_discards: Optional[List[str]] = None,
        melds: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates whether the bot should claim a discarded tile for:
        1. Hu (Ron Win)
        2. Kong (Melded Kong)
        3. Pong (Melded Pong)
        4. Chow (Melded Chow from Upper seat)
        Returns: { "action": "WIN" | "KONG" | "PONG" | "CHOW" | "PASS", "meld": [...] }
        """
        counts = hand_to_counts(hand_13)
        d_idx = TILE_INDEX_MAP[discarded_tile]

        # 1. Check WIN (Ron / 胡牌)
        full_test_tiles = list(hand_13)
        if melds:
            for m in melds:
                full_test_tiles.extend(m["tiles"][:3])
        full_test_tiles.append(discarded_tile)

        if len(full_test_tiles) == 14:
            try:
                fan_res = calculate_fan(
                    tiles=sort_tiles(full_test_tiles),
                    winning_tile=discarded_tile,
                    is_self_draw=False,
                    prevailing_wind=prevailing_wind,
                    seat_wind=self.seat_wind,
                    open_melds=melds
                )
                if fan_res.get("is_valid_win") and fan_res.get("total_fan", 0) >= 1:
                    return {
                        "action": "WIN",
                        "tile": discarded_tile,
                        "fan": fan_res["total_fan"],
                        "hand_name": fan_res["hand_name"],
                        "meld": [discarded_tile]
                    }
            except Exception:
                pass

        # 2. Check Pong & Kong
        held_count = counts[d_idx]

        # 2a. Melded Kong (槓) if holding 3 copies
        if held_count == 3:
            # Dragons (5z, 6z, 7z) or Seat/Round Wind are high value Kongs
            if discarded_tile in ["5z", "6z", "7z", self.seat_wind, prevailing_wind]:
                return {
                    "action": "KONG",
                    "tile": discarded_tile,
                    "meld": [discarded_tile, discarded_tile, discarded_tile, discarded_tile]
                }

        # 2b. Melded Pong (碰) if holding 2+ copies
        if held_count >= 2:
            # Dragons give guaranteed 1 Fan
            if discarded_tile in ["5z", "6z", "7z"]:
                return {
                    "action": "PONG",
                    "tile": discarded_tile,
                    "meld": [discarded_tile, discarded_tile, discarded_tile]
                }
            # Seat Wind or Round Wind gives guaranteed 1 Fan
            if discarded_tile in [self.seat_wind, prevailing_wind]:
                return {
                    "action": "PONG",
                    "tile": discarded_tile,
                    "meld": [discarded_tile, discarded_tile, discarded_tile]
                }

            # For numbered tiles: Pong if it reduces current Shanten
            curr_ukeire = calculate_ukeire_for_13(counts, self.seat_wind, prevailing_wind, visible_counts=None)
            curr_shanten = curr_ukeire["shanten"]

            # Simulate Pong
            temp_counts = list(counts)
            temp_counts[d_idx] -= 2
            best_post_pong_shanten = 99
            for out_idx in range(34):
                if temp_counts[out_idx] > 0:
                    temp_counts[out_idx] -= 1
                    post_u = calculate_ukeire_for_13(temp_counts, self.seat_wind, prevailing_wind, visible_counts=None)
                    best_post_pong_shanten = min(best_post_pong_shanten, post_u["shanten"])
                    temp_counts[out_idx] += 1

            if best_post_pong_shanten < curr_shanten:
                return {
                    "action": "PONG",
                    "tile": discarded_tile,
                    "meld": [discarded_tile, discarded_tile, discarded_tile]
                }

        # 3. Check Chow (Melded Chow) - Only valid if tile is a number tile (1-9 m/p/s)
        d_info = TILE_INFO_MAP[discarded_tile]
        if d_info["suit"] != "z":
            suit = d_info["suit"]
            val = d_info["value"]
            curr_ukeire = calculate_ukeire_for_13(counts, self.seat_wind, prevailing_wind, visible_counts=None)
            curr_shanten = curr_ukeire["shanten"]

            # Check potential Chow shapes: (val-2, val-1, val), (val-1, val, val+1), (val, val+1, val+2)
            candidates = []
            if val >= 3:
                candidates.append([f"{val-2}{suit}", f"{val-1}{suit}", discarded_tile])
            if val >= 2 and val <= 8:
                candidates.append([f"{val-1}{suit}", discarded_tile, f"{val+1}{suit}"])
            if val <= 7:
                candidates.append([discarded_tile, f"{val+1}{suit}", f"{val+2}{suit}"])

            for c in candidates:
                needed = [t for t in c if t != discarded_tile]
                if all(hand_13.count(t) >= needed.count(t) for t in needed):
                    temp_counts = list(counts)
                    for t in needed:
                        temp_counts[TILE_INDEX_MAP[t]] -= 1

                    best_post_chow_shanten = 99
                    for out_idx in range(34):
                        if temp_counts[out_idx] > 0:
                            temp_counts[out_idx] -= 1
                            post_u = calculate_ukeire_for_13(temp_counts, self.seat_wind, prevailing_wind, visible_counts=None)
                            best_post_chow_shanten = min(best_post_chow_shanten, post_u["shanten"])
                            temp_counts[out_idx] += 1

                    if best_post_chow_shanten < curr_shanten:
                        return {
                            "action": "CHOW",
                            "tile": discarded_tile,
                            "meld": c
                        }

        return {"action": "PASS", "tile": None, "meld": []}
