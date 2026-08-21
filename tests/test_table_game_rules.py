import pytest
from engine.table_game import TableMatchGame
from fan_calculator import calculate_fan

def test_melded_round_wind_pong_allows_ron_win():
    """Verify that a player with an exposed Round Wind Pong can claim Ron win."""
    game = TableMatchGame(game_id="test_game_1", user_name="TestPlayer")
    game.prevailing_wind = "1z"  # East Round
    game.seat_winds[1] = "2z"    # User is South Seat
    
    # User has an exposed Pong of 1z (Round Wind) and 3 concealed chows waiting on pair
    game.melds[1] = [{"type": "pong", "tiles": ["1z", "1z", "1z"]}]
    game.hands[1] = ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "5m"]
    
    # Discarder (Bot 0) discards 5m (the winning tile completing the pair)
    claim_opts = game.get_user_claim_options(discarded_tile="5m", discarder_idx=0)
    
    assert claim_opts["can_win"] is True
    assert claim_opts["win_fan"] >= 1
    assert "圈風刻" in claim_opts["hand_name"] or "Round Wind" in claim_opts["hand_name"]

def test_melded_seat_wind_pong_allows_ron_win():
    """Verify that a player with an exposed Seat Wind Pong can claim Ron win."""
    game = TableMatchGame(game_id="test_game_2", user_name="TestPlayer")
    game.prevailing_wind = "1z"  # East Round
    game.seat_winds[1] = "2z"    # User is South Seat
    
    # User has an exposed Pong of 2z (Seat Wind)
    game.melds[1] = [{"type": "pong", "tiles": ["2z", "2z", "2z"]}]
    game.hands[1] = ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "9p"]
    
    claim_opts = game.get_user_claim_options(discarded_tile="9p", discarder_idx=0)
    
    assert claim_opts["can_win"] is True
    assert claim_opts["win_fan"] >= 1
    assert "門風刻" in claim_opts["hand_name"] or "Seat Wind" in claim_opts["hand_name"]

def test_double_wind_pong_gives_two_fan():
    """Verify that holding a Pong of the wind when Seat Wind == Round Wind gives 2 Fan."""
    # Dealer (East) in East Round
    res = calculate_fan(
        tiles=["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "1z", "1z", "1z", "5m", "5m"],
        winning_tile="5m",
        is_self_draw=False,
        prevailing_wind="1z",
        seat_wind="1z"
    )
    assert res["is_valid_win"] is True
    assert res["total_fan"] == 2  # 1 for Round Wind + 1 for Seat Wind
    breakdown_names = [b["name"] for b in res["breakdown"]]
    assert any("圈風" in name for name in breakdown_names)
    assert any("門風" in name for name in breakdown_names)

def test_dealer_advances_every_hand_without_retention():
    """Verify TVB rule: Dealer passes to the next seat on every hand (no dealer retention)."""
    game = TableMatchGame(game_id="test_game_3", user_name="TestPlayer")
    assert game.dealer_index == 0
    assert game.hand_number == 1
    
    # Simulate a win by the dealer (player 0)
    game.process_win(winner_idx=0, shooter_idx=1, winning_tile="1m", is_self_draw=False)
    
    # Dealer should still pass to player 1 (no retention)
    assert game.dealer_index == 1
    assert game.hand_number == 2

def test_16_hand_tournament_cap():
    """Verify match strictly caps at 16 hands and triggers final standings."""
    game = TableMatchGame(game_id="test_game_4", user_name="TestPlayer")
    game.hand_number = 16
    
    # Complete Hand 16
    game.process_win(winner_idx=1, shooter_idx=0, winning_tile="5m", is_self_draw=False)
    
    assert game.match_over is True
    assert game.hand_number == 17
    
    state = game.get_state()
    assert state["match_over"] is True
    assert state["final_standings"] is not None
    assert len(state["final_standings"]) == 4
    assert state["final_standings"][0]["rank"] == 1
    assert "冠軍" in state["final_standings"][0]["rank_title"]
