"""
Tests for 4-Player Bot Table Match Engine and Bot AI under TVB 2026 Rules.
"""

import pytest
from engine.table_game import TableMatchGame
from engine.bot_ai import MahjongBotAI
from engine.ukeire import calculate_ukeire_for_13
from engine.tiles import hand_to_counts, sort_tiles
from evaluator import evaluate_14_hand


def test_table_game_initialization():
    game = TableMatchGame(game_id="test-123", user_name="Alfre")
    state = game.get_state()

    assert state["game_id"] == "test-123"
    assert state["hand_number"] == 1
    assert state["prevailing_wind"] == "1z"
    assert len(state["players"]) == 4
    assert state["remaining_wall_count"] == 136 - (13 * 4) - 1 # 83 tiles left
    assert len(game.hands[0]) == 14 # Dealer dealt 14 opening tiles
    assert len(game.hands[1]) == 13 # User dealt 13 tiles

    # On first step, dealer discards opening tile
    step_state = game.step_game_loop()
    assert step_state["remaining_wall_count"] == 83
    assert len(step_state["players"][0]["river"]) == 1 # Dealer discarded into river
    assert len(game.hands[0]) == 13 # Dealer back to 13 tiles after discard


def test_bot_ai_discard_selection():
    bot = MahjongBotAI(name="TestBot", seat_wind="1z")
    # Hand with 1-9m + 1-4p + 1 isolated dead white dragon 7z
    hand_14 = ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "1p", "2p", "3p", "4p", "7z"]
    res = bot.select_discard(hand_14, prevailing_wind="1z")

    assert res["action"] == "discard"
    # Should discard 7z (isolated honor) or 4p to maintain Ping Hu / Pure Flush shape
    assert res["tile"] in ["7z", "4p", "1p"]


def test_bot_ai_claim_dragon_pong():
    bot = MahjongBotAI(name="TestBot", seat_wind="1z")
    # Bot holds 2 Red Dragons (5z)
    hand_13 = ["1m", "2m", "3m", "4m", "5m", "6m", "7s", "8s", "9s", "1p", "2p", "5z", "5z"]
    claim = bot.evaluate_claim(
        hand_13=hand_13,
        discarded_tile="5z",
        discarder_seat="2z",
        prevailing_wind="1z"
    )

    assert claim["action"] == "PONG"
    assert claim["tile"] == "5z"


def test_visible_counts_reduces_ukeire_outs():
    # Hand with 2m3m waiting on 1m and 4m
    counts = [0] * 34
    counts[1] = 1 # 2m
    counts[2] = 1 # 3m
    # 11 other dummy tiles
    for i in range(10, 21):
        counts[i] = 1

    # Fresh wall: 1m has 4 outs, 4m has 4 outs
    fresh_res = calculate_ukeire_for_13(counts, seat_wind="1z", prevailing_wind="1z")
    fresh_1m_out = next(t for t in fresh_res["accepted_tiles"] if t["tile"] == "1m")
    assert fresh_1m_out["count"] == 4

    # Visible discards: 2 copies of 1m are already visible on table in discard rivers
    vis_counts = list(counts)
    vis_counts[0] += 2 # 2 copies of 1m dead on table

    depleted_res = calculate_ukeire_for_13(counts, seat_wind="1z", prevailing_wind="1z", visible_counts=vis_counts)
    depleted_1m_out = next(t for t in depleted_res["accepted_tiles"] if t["tile"] == "1m")
    assert depleted_1m_out["count"] == 2 # 4 - 2 = 2 outs left!


def test_user_promoted_kong():
    game = TableMatchGame(game_id="test-promoted-kong", user_name="Tester")
    # Set up user with an exposed Pong of Green Dragons (6z) and holding 10 tiles + 4th Green Dragon (6z)
    game.melds[1] = [{"type": "pong", "tiles": ["6z", "6z", "6z"]}]
    game.hands[1] = ["1m", "2m", "3m", "4m", "5m", "6m", "7s", "8s", "9s", "1p", "6z"] # 11 tiles (discard turn)
    game.current_turn_index = 1
    game.last_discard = None

    # Step game loop on user turn -> should prompt for Kong
    res = game.step_game_loop()
    assert res.get("waiting_for_user_claim") is True
    prompt = res.get("user_claim_prompt")
    assert prompt["can_kong"] is True
    assert prompt["kong_options"][0]["type"] == "promoted"
    assert prompt["kong_options"][0]["tile"] == "6z"

    # Execute Promoted Kong
    initial_wall_len = len(game.wall)
    claim_res = game.execute_user_claim(action="KONG", meld={"type": "promoted", "tile": "6z"})
    assert game.melds[1][0]["type"] == "kong"
    assert len(game.melds[1][0]["tiles"]) == 4
    assert "6z" not in game.hands[1] # removed from hand
    assert len(game.wall) == initial_wall_len - 1 # drew 1 replacement tile
    assert claim_res.get("waiting_for_user_discard") is True


def test_user_concealed_kong():
    game = TableMatchGame(game_id="test-concealed-kong", user_name="Tester")
    # Set up user holding 4 White Dragons (7z) + 10 other tiles = 14 tiles
    game.melds[1] = []
    game.hands[1] = ["1m", "2m", "3m", "4m", "5m", "6m", "7s", "8s", "9s", "1p", "7z", "7z", "7z", "7z"]
    game.current_turn_index = 1
    game.last_discard = None

    res = game.step_game_loop()
    assert res.get("waiting_for_user_claim") is True
    prompt = res.get("user_claim_prompt")
    assert prompt["can_kong"] is True
    assert prompt["kong_options"][0]["type"] == "concealed"
    assert prompt["kong_options"][0]["tile"] == "7z"

    # Execute Concealed Kong
    initial_wall_len = len(game.wall)
    claim_res = game.execute_user_claim(action="KONG", meld={"type": "concealed", "tile": "7z"})
    assert game.melds[1][0]["type"] == "concealed_kong"
    assert len(game.melds[1][0]["tiles"]) == 4
    assert "7z" not in game.hands[1]
    assert len(game.wall) == initial_wall_len - 1
    assert claim_res.get("waiting_for_user_discard") is True
