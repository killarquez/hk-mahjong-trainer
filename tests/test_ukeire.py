"""
Unit tests for TVB 2026 Ukeire (Tile Acceptance) and Evaluator.
"""

import pytest
from engine.tiles import hand_to_counts, parse_compact_string
from engine.ukeire import calculate_ukeire_for_13
from evaluator import evaluate_14_hand, compare_user_decision

def test_ukeire_tenpai_two_sided_wait():
    # 13-tile hand: 123m 456p 789s 23s 55m (Ping Hu path with numbered 55m pair)
    # Waiting on 1s or 4s to complete Ping Hu (1 Fan).
    # Remaining copies of 1s: 4 - 0 = 4; remaining copies of 4s: 4 - 0 = 4 -> Total outs = 8
    tiles, _ = parse_compact_string("123m456p789s23s55m")
    counts = hand_to_counts(tiles)
    ukeire = calculate_ukeire_for_13(counts, seat_wind="1z", prevailing_wind="1z")
    assert ukeire["shanten"] == 0 # Tenpai
    assert ukeire["total_outs"] >= 8
    accepted_tile_names = [t["tile"] for t in ukeire["accepted_tiles"]]
    assert "1s" in accepted_tile_names
    assert "4s" in accepted_tile_names


def test_evaluator_optimal_discard():
    # 14-tile hand: 123m 456p 789s 23s 55m + 4z (North wind, dead isolated honor)
    # Optimal discard should be 4z, leaving the Tenpai 123m 456p 789s 23s 55m hand!
    tiles, _ = parse_compact_string("123m456p789s23s55m4z")
    assert len(tiles) == 14
    eval_res = evaluate_14_hand(tiles, seat_wind="1z", prevailing_wind="1z")
    
    assert "4z" in eval_res["optimal_discards"]
    assert eval_res["best_shanten"] == 0 # Discarding 4z leaves Tenpai hand!


def test_compare_user_decision_correct_vs_suboptimal():
    tiles, _ = parse_compact_string("123m456p789s23s55m4z")
    
    # User makes optimal discard (4z)
    correct_comp = compare_user_decision(tiles, user_discard="4z", seat_wind="1z", prevailing_wind="1z")
    assert correct_comp["is_correct"] == True
    assert correct_comp["outs_delta"] == 0

    # User makes suboptimal discard (e.g. 1m which sets hand back to 1-shanten)
    suboptimal_comp = compare_user_decision(tiles, user_discard="1m", seat_wind="1z", prevailing_wind="1z")
    assert suboptimal_comp["is_correct"] == False
    assert suboptimal_comp["shanten_delta"] > 0
