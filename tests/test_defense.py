"""
Unit tests for TVB 2026 Hong Kong Mahjong Defensive Engine & Grandmaster Bot AI.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from engine.defense_engine import (
    calculate_suji_safety,
    calculate_kabe_safety,
    calculate_honor_safety,
    calculate_tile_danger_score,
    evaluate_threat_level,
    evaluate_push_fold_decision,
    generate_defense_drill_puzzle,
    verify_defense_drill_answer
)
from engine.bot_ai import MahjongBotAI

client = TestClient(app)


def test_genbutsu_and_suji_safety():
    # Opponent discarded 4m
    opp_river = [{"tile": "4m", "is_claimed": False}]
    
    # 1m and 7m should be detected as Outer Suji (表筋)
    suji_1m = calculate_suji_safety("1m", opp_river)
    assert suji_1m["is_suji"] is True
    assert suji_1m["suji_type"] == "outer_suji"

    suji_7m = calculate_suji_safety("7m", opp_river)
    assert suji_7m["is_suji"] is True
    assert suji_7m["suji_type"] == "outer_suji"

    # 5m is not protected by 4m discard
    suji_5m = calculate_suji_safety("5m", opp_river)
    assert suji_5m["is_suji"] is False


def test_kabe_wall_no_chance():
    # 4 copies of 7p visible on table
    vis_counts = [0] * 34
    vis_counts[15] = 4 # 7p index is 9 + 6 = 15

    # 8p and 9p should be protected by No-Chance wall
    kabe_8p = calculate_kabe_safety("8p", vis_counts)
    assert kabe_8p["has_kabe"] is True
    assert kabe_8p["kabe_type"] == "no_chance"

    kabe_9p = calculate_kabe_safety("9p", vis_counts)
    assert kabe_9p["has_kabe"] is True
    assert kabe_9p["kabe_type"] == "no_chance"


def test_honor_safety_hierarchy():
    vis_counts = [0] * 34
    vis_counts[27] = 3 # 1z (East) has 3 copies visible
    vis_counts[31] = 0 # 5z (Red Dragon) has 0 copies visible (Live / 生張)

    h_1z = calculate_honor_safety("1z", vis_counts, prevailing_wind="1z", seat_wind="2z")
    assert h_1z["safety_tier"] == "safe_95"

    h_5z = calculate_honor_safety("5z", vis_counts, prevailing_wind="1z", seat_wind="2z")
    assert h_5z["safety_tier"] == "danger_extreme"


def test_push_fold_decision_matrix():
    # Case A: Tenpai with high fan against medium threat -> PUSH
    tenpai_hand = ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "5z", "5z", "1z", "1z", "1m"]
    vis_counts = [0] * 34
    dec_a = evaluate_push_fold_decision(
        hand_tiles=tenpai_hand,
        seat_wind="1z",
        prevailing_wind="1z",
        threat_level="MEDIUM",
        threat_fan_estimate=2,
        visible_counts=vis_counts
    )
    assert dec_a["decision"] == "PUSH"

    # Case B: 3-Shanten hand against Critical Threat (opponent has 3 melds) -> FOLD (Betaori)
    scattered_hand = ["1m", "4m", "7m", "2p", "5p", "8p", "3s", "6s", "9s", "1z", "2z", "3z", "4z", "4z"]
    dec_b = evaluate_push_fold_decision(
        hand_tiles=scattered_hand,
        seat_wind="2z",
        prevailing_wind="1z",
        threat_level="CRITICAL",
        threat_fan_estimate=5,
        visible_counts=vis_counts
    )
    assert dec_b["decision"] == "FOLD"


def test_bot_ai_defensive_discard_under_threat():
    bot = MahjongBotAI("TestBot", "3z", "balanced")
    # Bot holds a 2-shanten hand with 1 Genbutsu (4m) and several dangerous live tiles
    bot_hand = ["4m", "5p", "6p", "5s", "6s", "7s", "1m", "2m", "8p", "9p", "3s", "4s", "5z", "5z"]
    
    # Opponent has 3 melds (Critical threat) and river has 4m
    opponents_data = [
        {
            "player_idx": 0,
            "seat_wind": "1z",
            "melds": [
                {"type": "pong", "tiles": ["7z", "7z", "7z"]},
                {"type": "chow", "tiles": ["1s", "2s", "3s"]},
                {"type": "chow", "tiles": ["4s", "5s", "6s"]}
            ],
            "river": [{"tile": "4m", "is_claimed": False}, {"tile": "1p", "is_claimed": False}]
        }
    ]

    res = bot.select_discard(
        hand_14=bot_hand,
        prevailing_wind="1z",
        visible_discards=["4m", "1p"],
        opponents_data=opponents_data
    )

    # Bot should fold and discard the 100% Genbutsu tile "4m" rather than pushing into the 3-meld opponent
    assert res["tile"] == "4m"
    assert "FOLD" in res.get("tactical_posture", "")


def test_defense_api_endpoints():
    # 1. Puzzle endpoint
    res = client.get("/api/defense/puzzle?scenario_type=betaori")
    assert res.status_code == 200
    data = res.json()
    assert "user_hand" in data
    assert "threat_info" in data
    assert "ground_truth" in data

    # 2. Verify endpoint
    puzzle = data
    payload = {
        "puzzle_type": "betaori",
        "user_choice": puzzle["ground_truth"]["safest_tiles"][0],
        "ground_truth": puzzle["ground_truth"]
    }
    v_res = client.post("/api/defense/verify", json=payload)
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["is_correct"] is True
