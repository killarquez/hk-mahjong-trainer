"""
Unit tests for the Dynamic Fan Quiz Trainer & TVB 2026 Points Calculator.
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from fan_calculator import (
    generate_fan_quiz_puzzle,
    get_point_payout_details,
    calculate_fan,
    TVB_POINTS_TABLE
)

client = TestClient(app)


def test_tvb_point_payout_table():
    # Test Ron payout
    ron_3 = get_point_payout_details(fan=3, is_self_draw=False)
    assert ron_3["winner_gain"] == 30
    assert ron_3["shooter_loss"] == -30
    assert ron_3["non_shooter_loss"] == 0

    # Test Self-Draw payout
    sd_5 = get_point_payout_details(fan=5, is_self_draw=True)
    assert sd_5["winner_gain"] == 75
    assert sd_5["each_opponent_loss"] == -25

    # Test Limit Fan (10 Fan)
    sd_10 = get_point_payout_details(fan=10, is_self_draw=True)
    assert sd_10["winner_gain"] == 150
    assert sd_10["each_opponent_loss"] == -50

    # Test 0-Fan Chicken Hand
    trap_0 = get_point_payout_details(fan=0, is_self_draw=False)
    assert trap_0["winner_gain"] == 0


def test_fan_quiz_generator_difficulties():
    # Beginner: 1-3 Fan
    p_beg = generate_fan_quiz_puzzle(difficulty="beginner")
    assert len(p_beg["hand_tiles"]) == 14
    assert p_beg["ground_truth"]["total_fan"] >= 1
    assert p_beg["payout"] is not None

    # Limit hands: >= 7 Fan
    p_lim = generate_fan_quiz_puzzle(difficulty="limit")
    assert len(p_lim["hand_tiles"]) == 14
    assert p_lim["ground_truth"]["total_fan"] >= 7

    # Traps: 0 Fan
    p_trap = generate_fan_quiz_puzzle(difficulty="traps")
    assert len(p_trap["hand_tiles"]) == 14
    assert p_trap["ground_truth"]["total_fan"] == 0
    assert p_trap["ground_truth"]["is_valid_win"] is False


def test_fan_quiz_api_puzzle_endpoint():
    res = client.get("/api/fan-quiz/puzzle?difficulty=intermediate")
    assert res.status_code == 200
    data = res.json()
    assert "hand_tiles" in data
    assert len(data["hand_tiles"]) == 14
    assert "winning_tile" in data
    assert "ground_truth" in data
    assert "payout" in data


def test_fan_quiz_api_verify_correct_answer():
    # Hand: Ping Hu (123m 456m 234p 789s 55s) with seat 2z, prevailing 1z, ron
    hand = ["1m", "2m", "3m", "4m", "5m", "6m", "2p", "3p", "4p", "7s", "8s", "9s", "5s", "5s"]
    payload = {
        "hand_tiles": hand,
        "winning_tile": "5s",
        "is_self_draw": False,
        "prevailing_wind": "1z",
        "seat_wind": "2z",
        "user_fan": 1,
        "user_patterns": ["A1"]
    }
    res = client.post("/api/fan-quiz/verify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_correct_fan"] is True
    assert data["actual_fan"] == 1
    assert data["is_valid_win"] is True
    assert "平胡" in data["formula"]


def test_fan_quiz_api_verify_incorrect_answer():
    hand = ["1m", "2m", "3m", "4m", "5m", "6m", "2p", "3p", "4p", "7s", "8s", "9s", "5s", "5s"]
    payload = {
        "hand_tiles": hand,
        "winning_tile": "5s",
        "is_self_draw": False,
        "prevailing_wind": "1z",
        "seat_wind": "2z",
        "user_fan": 4, # Wrong fan count!
        "user_patterns": ["B1"]
    }
    res = client.post("/api/fan-quiz/verify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_correct_fan"] is False
    assert data["user_fan"] == 4
    assert data["actual_fan"] == 1
