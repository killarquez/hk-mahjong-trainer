"""
Unit Tests for Hong Kong Mahjong Efficiency Engine (TVB 2026 Rules).
Tests parser, 136-tile deck rules, Fan calculator, Shanten, and Ukeire evaluator.
"""

import pytest
from lexicon import search_lexicon, TILE_LOOKUP
from parser import parse_tile_string, validate_hand
from fan_calculator import calculate_fan
from evaluator import evaluate_14_hand, compare_user_decision

def test_tile_parser_compact():
    tiles, errors = parse_tile_string("123m456p789s111z55z")
    assert len(errors) == 0
    assert len(tiles) == 14
    assert tiles == ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "1z", "1z", "1z", "5z", "5z"]

def test_deck_validation_exceed_limit():
    tiles = ["1m"] * 5
    errors = validate_hand(tiles)
    assert len(errors) == 1
    assert "exceeds 4 copies limit" in errors[0]

def test_fan_calculator_thirteen_orphans():
    tiles = ["1m", "9m", "1p", "9p", "1s", "9s", "1z", "2z", "3z", "4z", "5z", "6z", "7z", "1m"]
    result = calculate_fan(tiles)
    assert result["is_valid_win"] == True
    assert result["total_fan"] == 10
    assert "十三幺" in result["hand_name"]

def test_fan_calculator_full_flush():
    tiles = ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "1m", "1m", "1m", "2m", "2m"]
    result = calculate_fan(tiles)
    assert result["is_valid_win"] == True
    assert result["total_fan"] >= 7
    assert any("清一色" in b["name"] for b in result["breakdown"])

def test_fan_calculator_chicken_hand_min_1_fan():
    # 4 chows + dragon pair (5z 5z) -> dragon pair prevents Ping Hu, not a pong so 0 fan total
    tiles = ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "2s", "3s", "4s", "5z", "5z"]
    result = calculate_fan(tiles)
    assert result["is_valid_win"] == False
    assert result["total_fan"] == 0
    assert "雞胡" in result["error"] or "雞胡" in result["hand_name"]

def test_evaluator_optimal_discard_dead_honor():
    # Hand with isolated dead wind (2z South wind when seat/prevailing is 1z East wind)
    tiles = ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "1s", "2s", "3s", "5m", "2z"]
    res = evaluate_14_hand(tiles, seat_wind="1z", prevailing_wind="1z")
    assert "2z" in res["optimal_discards"]

def test_lexicon_search():
    results = search_lexicon("混一色")
    assert len(results) >= 1
    assert results[0]["chinese"] == "混一色"
