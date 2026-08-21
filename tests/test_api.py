"""
Integration API Tests for FastAPI Mahjong Efficiency Trainer endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["min_fan"] == 1
    assert data["seven_pairs_allowed"] == False


def test_random_hand_endpoint():
    res = client.post("/api/random-hand", json={"seat_wind": "1z", "prevailing_wind": "1z"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["tiles"]) == 14
    assert "evaluation" in data
    assert "optimal_discard" in data["evaluation"]
    assert len(data["evaluation"]["discards"]) > 0


def test_evaluate_endpoint_optimal_comparison():
    # Hand with 4z (isolated dead North wind)
    tiles = ["1m","2m","3m","4p","5p","6p","7s","8s","9s","2s","3s","5m","5m","4z"]
    res = client.post("/api/evaluate", json={
        "hand_tiles": tiles,
        "user_discard": "4z",
        "seat_wind": "1z",
        "prevailing_wind": "1z"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["optimal_discard"] == "4z"
    assert data["comparison"]["is_correct"] == True
    assert data["comparison"]["status"] == "optimal"


def test_evaluate_endpoint_suboptimal_comparison():
    tiles = ["1m","2m","3m","4p","5p","6p","7s","8s","9s","2s","3s","5m","5m","4z"]
    res = client.post("/api/evaluate", json={
        "hand_tiles": tiles,
        "user_discard": "1m",
        "seat_wind": "1z",
        "prevailing_wind": "1z"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["comparison"]["is_correct"] == False
    assert data["comparison"]["status"] == "suboptimal"
    assert data["comparison"]["shanten_delta"] > 0 or data["comparison"]["outs_delta"] > 0


def test_parse_hand_endpoint_14_tiles():
    res = client.post("/api/parse-hand", json={"raw_input": "123m456p789s111z55z"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] == True
    assert data["is_14_tiles"] == True
    assert len(data["tiles"]) == 14
    assert data["evaluation"] is not None


def test_parse_hand_endpoint_13_tiles():
    res = client.post("/api/parse-hand", json={"raw_input": "123m456p789s11z55z"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] == True
    assert data["is_14_tiles"] == False
    assert len(data["tiles"]) == 13


def test_next_turn_endpoint():
    tiles = ["1m","2m","3m","4p","5p","6p","7s","8s","9s","2s","3s","5m","5m","4z"]
    res = client.post("/api/next-turn", json={
        "hand_tiles": tiles,
        "discard_tile": "4z",
        "seat_wind": "1z",
        "prevailing_wind": "1z"
    })
    assert res.status_code == 200
    data = res.json()
    assert "drawn_tile" in data
    assert len(data["hand_tiles"]) == 14
    assert "4z" not in data["hand_tiles"] or data["hand_tiles"].count("4z") < tiles.count("4z")


def test_fan_counter_endpoint():
    tiles = ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1m","1m","1m","2m","2m"]
    res = client.post("/api/fan-counter/calculate", json={
        "tiles": tiles,
        "seat_wind": "1z",
        "prevailing_wind": "1z"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid_win"] == True
    assert data["total_fan"] >= 7


def test_puzzles_endpoint():
    res = client.get("/api/puzzles")
    assert res.status_code == 200
    data = res.json()
    assert "puzzles" in data
    assert len(data["puzzles"]) >= 10


def test_generate_drill_endpoint():
    for category in ["waits", "fan_pivot", "honors_defense", "limit_hands"]:
        res = client.post("/api/puzzles/generate-drill", json={
            "category": category,
            "seat_wind": "1z",
            "prevailing_wind": "1z"
        })
        assert res.status_code == 200
        data = res.json()
        assert "puzzle" in data
        assert len(data["puzzle"]["tiles"]) == 14
        assert "evaluation" in data["puzzle"]
        assert "optimal_discard" in data["puzzle"]["evaluation"]


def test_hand_breakdown_endpoint():
    # 5-sided run hand: 23456m456p789s11z5z
    tiles = ["2m", "3m", "4m", "5m", "6m", "4p", "5p", "6p", "7s", "8s", "9s", "1z", "1z", "5z"]
    res = client.post("/api/hand/analyze-breakdown", json={
        "hand_tiles": tiles,
        "seat_wind": "1z",
        "prevailing_wind": "1z"
    })
    assert res.status_code == 200
    data = res.json()
    assert "blocks_data" in data
    assert "tactical_lines" in data
    assert len(data["tactical_lines"]) > 0
    assert "optimal_discard" in data
    assert data["optimal_discard"] == "5z"
    assert data["tactical_lines"][0]["discard_tile"] == "5z"
    assert data["tactical_lines"][0]["is_optimal"] == True


