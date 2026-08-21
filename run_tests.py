"""
Standalone Test Runner for Cantonese Mahjong Training Bot.
Runs unit tests using Python's standard unittest framework.
"""

import unittest
from lexicon import search_lexicon
from parser import parse_tile_string, validate_hand
from fan_calculator import calculate_fan
from evaluator import evaluate_opening_discard

class TestMahjongBot(unittest.TestCase):

    def test_tile_parser_compact(self):
        tiles, errors = parse_tile_string("123m456p789s111z55z")
        self.assertEqual(len(errors), 0)
        self.assertEqual(len(tiles), 14)
        self.assertEqual(tiles, ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "1z", "1z", "1z", "5z", "5z"])

    def test_deck_validation_exceed_limit(self):
        tiles = ["1m"] * 5
        errors = validate_hand(tiles)
        self.assertEqual(len(errors), 1)
        self.assertIn("exceeds 4 copies limit", errors[0])

    def test_fan_calculator_thirteen_orphans(self):
        tiles = ["1m", "9m", "1p", "9p", "1s", "9s", "1z", "2z", "3z", "4z", "5z", "6z", "7z", "1m"]
        result = calculate_fan(tiles)
        self.assertTrue(result["is_valid_win"])
        self.assertEqual(result["total_fan"], 10)
        self.assertIn("十三幺", result["hand_name"])

    def test_fan_calculator_full_flush(self):
        tiles = ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "1m", "1m", "1m", "2m", "2m"]
        result = calculate_fan(tiles)
        self.assertTrue(result["is_valid_win"])
        self.assertGreaterEqual(result["total_fan"], 7)
        self.assertTrue(any("清一色" in b["name"] for b in result["breakdown"]))

    def test_fan_calculator_chicken_hand_min_1_fan(self):
        tiles = ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "2s", "3s", "4s", "5z", "5z"]
        result = calculate_fan(tiles)
        self.assertFalse(result["is_valid_win"])
        self.assertEqual(result["total_fan"], 0)

    def test_evaluator_priority_1_dead_honor(self):
        tiles = ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "1s", "2s", "3s", "5m", "2z"]
        res = evaluate_opening_discard(tiles, seat_wind="1z", prevailing_wind="1z")
        self.assertEqual(res["priority_level"], 1)
        self.assertEqual(res["optimal_discard"], "2z")

    def test_lexicon_search(self):
        results = search_lexicon("混一色")
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["chinese"], "混一色")

if __name__ == "__main__":
    unittest.main()
