"""
Unit Tests for Version 3.0 (TVB 2026 Tournament Master Edition) Features:
- Procedural Puzzle Generator across all tournament categories
- Hand Builder Deep Strategy analysis with Exposed Melds (Chow, Pong, Kong)
- Random Hand Drill Category filtering
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from engine.puzzle_generator import generate_puzzle_by_category
from engine.hand_analyzer import analyze_hand_deep_strategy

client = TestClient(app)

def test_procedural_puzzle_generator_all_categories():
    categories = [
        "multi_sided_waits",
        "one_fan_pivots",
        "flush_discards",
        "opening_discards",
        "waits",
        "fan_pivot",
        "limit_hands",
        "honors_defense",
        "all"
    ]
    for cat in categories:
        puz = generate_puzzle_by_category(cat)
        assert puz is not None
        assert "hand" in puz
        assert "tiles" in puz
        assert len(puz["hand"]) == 14
        assert "eval" in puz
        assert "optimal_discard" in puz["eval"]
        assert len(puz["eval"]["discards"]) > 0

def test_hand_builder_deep_strategy_with_open_melds():
    # 1 open Chow (1m 2m 3m) + 11 concealed tiles (4p 5p 6p 7s 8s 9s 1z 1z 5z 6z 7z)
    concealed = ["4p", "5p", "6p", "7s", "8s", "9s", "1z", "1z", "5z", "6z", "7z"]
    melds = [{"type": "chow", "tiles": ["1m", "2m", "3m"]}]

    res = analyze_hand_deep_strategy(
        tiles=concealed,
        seat_wind="1z",
        prevailing_wind="1z",
        open_melds=melds
    )

    assert res is not None
    assert "current_shanten" in res
    assert "optimal_discard" in res
    assert res["optimal_discard"] in concealed
    assert len(res["tactical_lines"]) > 0
    assert len(res["full_discards"]) == len(set(concealed))

def test_api_random_hand_categories():
    for cat in ["multi_sided_waits", "one_fan_pivots", "flush_discards", "opening_discards"]:
        res = client.post("/api/random-hand", json={
            "category": cat,
            "seat_wind": "1z",
            "prevailing_wind": "1z"
        })
        assert res.status_code == 200
        data = res.json()
        assert len(data["tiles"]) == 14
        assert "drill_info" in data
        assert data["drill_info"]["category"] == cat
