"""
Unit tests for TVB 2026 Shanten Calculation Engine.
"""

import pytest
from engine.tiles import hand_to_counts, parse_compact_string
from engine.shanten import (
    calculate_general_shanten_unconstrained,
    calculate_thirteen_orphans_shanten,
    calculate_ping_hu_shanten,
    calculate_pong_pong_hu_shanten,
    calculate_tvb_shanten
)

def test_tenpai_standard_hand():
    # 13-tile hand: 123m 456p 789s 11z 55z -> Wait on 1z or 5z (Tenpai, Shanten = 0)
    tiles, _ = parse_compact_string("123m456p789s11z55z")
    assert len(tiles) == 13
    counts = hand_to_counts(tiles)
    res = calculate_tvb_shanten(counts, seat_wind="1z", prevailing_wind="1z")
    assert res["shanten"] == 0


def test_winning_hand_agari():
    # 14-tile winning hand: 123m 456p 789s 111z 55z (Agari, Shanten = -1)
    tiles, _ = parse_compact_string("123m456p789s111z55z")
    assert len(tiles) == 14
    counts = hand_to_counts(tiles)
    res = calculate_tvb_shanten(counts, seat_wind="1z", prevailing_wind="1z")
    assert res["shanten"] == -1


def test_iishanten_one_away():
    # 13-tile hand: 123m 456p 78s 11z 5z 8p 9m (1-away / Iishanten)
    tiles, _ = parse_compact_string("123m456p78s11z5z8p9m")
    counts = hand_to_counts(tiles)
    res = calculate_tvb_shanten(counts, seat_wind="1z", prevailing_wind="1z")
    assert res["shanten"] >= 1


def test_thirteen_orphans_shanten():
    # 13 unique orphans without pair (Tenpai for 13-sided wait! Shanten = 0)
    tiles, _ = parse_compact_string("19m19p19s1234567z")
    counts = hand_to_counts(tiles)
    s13 = calculate_thirteen_orphans_shanten(counts)
    assert s13 == 0

    # 12 unique orphans + 1 pair (Tenpai waiting on 13th unique, Shanten = 0)
    tiles, _ = parse_compact_string("119m19p19s123456z")
    counts = hand_to_counts(tiles)
    s13 = calculate_thirteen_orphans_shanten(counts)
    assert s13 == 0

    # 14-tile complete Thirteen Orphans (Agari, Shanten = -1)
    tiles, _ = parse_compact_string("119m19p19s1234567z")
    counts = hand_to_counts(tiles)
    s13 = calculate_thirteen_orphans_shanten(counts)
    assert s13 == -1


def test_seven_pairs_banned_exclusion():
    # 13-tile hand with 6 pairs + 1 single: 11m 33m 55p 77p 99s 22z 4z
    # In Japanese Riichi / 7-pairs rules, this would be Shanten = 0 (Tenpai for 7-pairs).
    # BUT in TVB 2026 rules, Seven Pairs is BANNED!
    # Shanten must be evaluated strictly for 4 melds + 1 pair.
    tiles, _ = parse_compact_string("1133m5577p99s224z")
    counts = hand_to_counts(tiles)
    res = calculate_tvb_shanten(counts, seat_wind="1z", prevailing_wind="1z")
    # For standard 4 melds + 1 pair, 6 scattered pairs has Shanten = 2 (Ryanshanten) or 3, NOT 0.
    assert res["shanten"] > 0


def test_ping_hu_shanten_rejects_honors():
    # Hand with 4 sequences + dragon pair (5z 5z).
    # Ping Hu prohibits honors. Therefore Ping Hu shanten for this hand requires replacing the dragon pair with a numbered pair.
    tiles, _ = parse_compact_string("123m456p789s123s55z")
    counts = hand_to_counts(tiles)
    s_pinghu = calculate_ping_hu_shanten(counts)
    # The 4 chows exist, but pair 55z cannot be used for Ping Hu
    assert s_pinghu >= 1
