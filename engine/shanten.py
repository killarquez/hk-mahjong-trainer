"""
Ultra-Fast Dynamic Programming Shanten Engine for TVB 2026 Rules.
Decomposes hand across suits (m, p, s, z) with LRU caching for microsecond-speed evaluations.
"""

from functools import lru_cache
from typing import List, Dict, Any, Tuple, Optional, Set
from engine.tiles import (
    ALL_TILE_CODES,
    TILE_INDEX_MAP,
    INDEX_TILE_MAP,
    THIRTEEN_ORPHANS_INDICES,
    DRAGON_INDICES,
    WIND_INDICES,
    HONOR_INDICES,
    TILE_INFO_MAP
)

@lru_cache(maxsize=65536)
def _solve_numbered_suit(counts_tuple: Tuple[int, ...]) -> Tuple[Tuple[int, int, int], ...]:
    """
    Given a tuple of 9 tile counts for a single numbered suit (m, p, or s),
    returns all valid tuples of (melds, partials, has_head).
    """
    counts = list(counts_tuple)
    results: Set[Tuple[int, int, int]] = set()

    def backtrack(idx: int, m: int, p: int, h: int):
        while idx < 9 and counts[idx] == 0:
            idx += 1

        if idx >= 9 or m >= 4:
            results.add((m, min(p, 4 - m), h))
            return

        # 1. Triplet (Pong)
        if counts[idx] >= 3:
            counts[idx] -= 3
            backtrack(idx, m + 1, p, h)
            counts[idx] += 3

        # 2. Sequence (Chow)
        if idx <= 6 and counts[idx+1] > 0 and counts[idx+2] > 0:
            counts[idx] -= 1
            counts[idx+1] -= 1
            counts[idx+2] -= 1
            backtrack(idx, m + 1, p, h)
            counts[idx] += 1
            counts[idx+1] += 1
            counts[idx+2] += 1

        # 3. Head (Pair as eye)
        if h == 0 and counts[idx] >= 2:
            counts[idx] -= 2
            backtrack(idx, m, p, 1)
            counts[idx] += 2

        # 4. Partial: Pair
        if counts[idx] >= 2 and (m + p < 4):
            counts[idx] -= 2
            backtrack(idx, m, p + 1, h)
            counts[idx] += 2

        # 5. Partial: Ryanmen / Penchan (idx, idx+1)
        if idx <= 7 and counts[idx+1] > 0 and (m + p < 4):
            counts[idx] -= 1
            counts[idx+1] -= 1
            backtrack(idx, m, p + 1, h)
            counts[idx] += 1
            counts[idx+1] += 1

        # 6. Partial: Kanchan (idx, idx+2)
        if idx <= 6 and counts[idx+2] > 0 and (m + p < 4):
            counts[idx] -= 1
            counts[idx+2] -= 1
            backtrack(idx, m, p + 1, h)
            counts[idx] += 1
            counts[idx+2] += 1

        # 7. Skip
        backtrack(idx + 1, m, p, h)

    backtrack(0, 0, 0, 0)
    return tuple(sorted(results, key=lambda x: (2*x[0] + x[1] + x[2]), reverse=True))


@lru_cache(maxsize=16384)
def _solve_honors_suit(counts_tuple: Tuple[int, ...]) -> Tuple[Tuple[int, int, int], ...]:
    """Given a tuple of 7 tile counts for honors, returns (melds, partials, has_head)."""
    counts = list(counts_tuple)
    results: Set[Tuple[int, int, int]] = set()

    def backtrack(idx: int, m: int, p: int, h: int):
        while idx < 7 and counts[idx] == 0:
            idx += 1

        if idx >= 7 or m >= 4:
            results.add((m, min(p, 4 - m), h))
            return

        # 1. Triplet (Pong)
        if counts[idx] >= 3:
            counts[idx] -= 3
            backtrack(idx + 1, m + 1, p, h)
            counts[idx] += 3

        # 2. Pair as Head
        if h == 0 and counts[idx] >= 2:
            counts[idx] -= 2
            backtrack(idx + 1, m, p, 1)
            counts[idx] += 2

        # 3. Pair as Partial
        if counts[idx] >= 2 and (m + p < 4):
            counts[idx] -= 2
            backtrack(idx + 1, m, p + 1, h)
            counts[idx] += 2

        # 4. Skip
        backtrack(idx + 1, m, p, h)

    backtrack(0, 0, 0, 0)
    return tuple(sorted(results, key=lambda x: (2*x[0] + x[1] + x[2]), reverse=True))


@lru_cache(maxsize=65536)
def _solve_pinghu_numbered_suit(counts_tuple: Tuple[int, ...]) -> Tuple[Tuple[int, int, int], ...]:
    """Evaluates Chows and Ryanmen/Kanchan partials ONLY for Ping Hu."""
    counts = list(counts_tuple)
    results: Set[Tuple[int, int, int]] = set()

    def backtrack(idx: int, m: int, p: int, h: int):
        while idx < 9 and counts[idx] == 0:
            idx += 1

        if idx >= 9 or m >= 4:
            results.add((m, min(p, 4 - m), h))
            return

        # Chow
        if idx <= 6 and counts[idx+1] > 0 and counts[idx+2] > 0:
            counts[idx] -= 1
            counts[idx+1] -= 1
            counts[idx+2] -= 1
            backtrack(idx, m + 1, p, h)
            counts[idx] += 1
            counts[idx+1] += 1
            counts[idx+2] += 1

        # Head (Numbered Pair)
        if h == 0 and counts[idx] >= 2:
            counts[idx] -= 2
            backtrack(idx, m, p, 1)
            counts[idx] += 2

        # Partial: Ryanmen / Penchan
        if idx <= 7 and counts[idx+1] > 0 and (m + p < 4):
            counts[idx] -= 1
            counts[idx+1] -= 1
            backtrack(idx, m, p + 1, h)
            counts[idx] += 1
            counts[idx+1] += 1

        # Partial: Kanchan
        if idx <= 6 and counts[idx+2] > 0 and (m + p < 4):
            counts[idx] -= 1
            counts[idx+2] -= 1
            backtrack(idx, m, p + 1, h)
            counts[idx] += 1
            counts[idx+2] += 1

        # Skip
        backtrack(idx + 1, m, p, h)

    backtrack(0, 0, 0, 0)
    return tuple(sorted(results, key=lambda x: (2*x[0] + x[1] + x[2]), reverse=True))


def calculate_general_shanten_unconstrained(counts: List[int]) -> int:
    """Combines independent suit states to find minimal 4 melds + 1 pair Shanten."""
    total_tiles = sum(counts)
    m_states = _solve_numbered_suit(tuple(counts[0:9]))
    p_states = _solve_numbered_suit(tuple(counts[9:18]))
    s_states = _solve_numbered_suit(tuple(counts[18:27]))
    z_states = _solve_honors_suit(tuple(counts[27:34]))

    min_shanten = 8

    for m1, p1, h1 in m_states:
        for m2, p2, h2 in p_states:
            for m3, p3, h3 in s_states:
                for m4, p4, h4 in z_states:
                    total_melds = m1 + m2 + m3 + m4
                    if total_melds > 4:
                        continue
                    has_head = (h1 + h2 + h3 + h4) >= 1
                    total_partials = min(4 - total_melds, p1 + p2 + p3 + p4)
                    
                    if has_head:
                        shanten = 8 - 2 * total_melds - total_partials - 1
                    else:
                        used_tiles = 3 * total_melds + 2 * total_partials
                        has_spare = (total_tiles > used_tiles)
                        shanten = 8 - 2 * total_melds - total_partials if has_spare else 8 - 2 * total_melds - total_partials + 1

                    if shanten < min_shanten:
                        min_shanten = shanten
                        if min_shanten == -1:
                            return -1

    return min_shanten


def calculate_thirteen_orphans_shanten(counts: List[int]) -> int:
    """Thirteen Orphans Shanten."""
    unique_count = 0
    has_pair = 0
    for idx in THIRTEEN_ORPHANS_INDICES:
        c = counts[idx]
        if c > 0:
            unique_count += 1
            if c >= 2:
                has_pair = 1

    return 13 - unique_count - has_pair


def calculate_ping_hu_shanten(counts: List[int]) -> int:
    """Ping Hu Shanten: 4 Chows in numbered suits + 1 numbered Pair (0 honors)."""
    numbered_tiles_count = sum(counts[0:27])
    m_states = _solve_pinghu_numbered_suit(tuple(counts[0:9]))
    p_states = _solve_pinghu_numbered_suit(tuple(counts[9:18]))
    s_states = _solve_pinghu_numbered_suit(tuple(counts[18:27]))

    min_shanten = 8

    for m1, p1, h1 in m_states:
        for m2, p2, h2 in p_states:
            for m3, p3, h3 in s_states:
                total_melds = m1 + m2 + m3
                if total_melds > 4:
                    continue
                has_head = (h1 + h2 + h3) >= 1
                total_partials = min(4 - total_melds, p1 + p2 + p3)
                
                if has_head:
                    shanten = 8 - 2 * total_melds - total_partials - 1
                else:
                    used_tiles = 3 * total_melds + 2 * total_partials
                    has_spare = (numbered_tiles_count > used_tiles)
                    shanten = 8 - 2 * total_melds - total_partials if has_spare else 8 - 2 * total_melds - total_partials + 1

                if shanten < min_shanten:
                    min_shanten = shanten
                    if min_shanten == -1:
                        return -1

    return min_shanten


def calculate_pong_pong_hu_shanten(counts: List[int]) -> int:
    """Pong Pong Hu Shanten (4 Pongs + 1 Pair across all tiles)."""
    triplets = 0
    pairs = 0

    for i in range(34):
        if counts[i] >= 3:
            triplets += 1
        elif counts[i] == 2:
            pairs += 1

    if pairs > 0:
        used_triplets = min(4, triplets)
        rem_slots = 4 - used_triplets
        used_pairs = min(rem_slots, pairs - 1)
        shanten = 8 - 2 * used_triplets - used_pairs - 1
    else:
        used_triplets = min(4, triplets)
        shanten = 8 - 2 * used_triplets

    return max(-1, shanten)


def calculate_suit_flush_shanten(counts: List[int], suit: str, allow_honors: bool) -> int:
    """Half Flush or Full Flush Shanten."""
    if suit == 'm':
        m_states = _solve_numbered_suit(tuple(counts[0:9]))
        p_states = ((0, 0, 0),)
        s_states = ((0, 0, 0),)
    elif suit == 'p':
        m_states = ((0, 0, 0),)
        p_states = _solve_numbered_suit(tuple(counts[9:18]))
        s_states = ((0, 0, 0),)
    else:
        m_states = ((0, 0, 0),)
        p_states = ((0, 0, 0),)
        s_states = _solve_numbered_suit(tuple(counts[18:27]))

    z_states = _solve_honors_suit(tuple(counts[27:34])) if allow_honors else ((0, 0, 0),)

    min_shanten = 8
    for m1, p1, h1 in m_states:
        for m2, p2, h2 in p_states:
            for m3, p3, h3 in s_states:
                for m4, p4, h4 in z_states:
                    total_melds = m1 + m2 + m3 + m4
                    if total_melds > 4:
                        continue
                    total_heads = 1 if (h1 + h2 + h3 + h4) >= 1 else 0
                    total_partials = min(4 - total_melds, p1 + p2 + p3 + p4)
                    shanten = 8 - 2 * total_melds - total_partials - total_heads
                    if shanten < min_shanten:
                        min_shanten = shanten

    return min_shanten


def calculate_honor_pong_shanten(counts: List[int], honor_tile_idx: int) -> int:
    """Calculates Shanten towards a hand containing a specific Honor Pong."""
    c = counts[honor_tile_idx]
    needed_for_pong = max(0, 3 - c)

    temp_counts = list(counts)
    temp_counts[honor_tile_idx] = 0

    m_states = _solve_numbered_suit(tuple(temp_counts[0:9]))
    p_states = _solve_numbered_suit(tuple(temp_counts[9:18]))
    s_states = _solve_numbered_suit(tuple(temp_counts[18:27]))
    z_states = _solve_honors_suit(tuple(temp_counts[27:34]))

    target_other_melds = 3
    min_shanten = 8

    for m1, p1, h1 in m_states:
        for m2, p2, h2 in p_states:
            for m3, p3, h3 in s_states:
                for m4, p4, h4 in z_states:
                    other_melds = min(target_other_melds, m1 + m2 + m3 + m4)
                    rem_slots = target_other_melds - other_melds
                    other_partials = min(rem_slots, p1 + p2 + p3 + p4)
                    has_head = 1 if (h1 + h2 + h3 + h4) >= 1 else 0
                    
                    # 1 meld dedicated to this honor pong
                    total_melds = 1 + other_melds
                    total_partials = other_partials
                    
                    shanten = 8 - 2 * total_melds - total_partials - has_head + needed_for_pong
                    if shanten < min_shanten:
                        min_shanten = shanten

    return min_shanten


def calculate_tvb_shanten(
    counts: List[int], 
    seat_wind: str = "1z", 
    prevailing_wind: str = "1z"
) -> Dict[str, Any]:
    """
    Master TVB 2026 Shanten Evaluator.
    Returns the minimum Shanten across all valid >= 1 Fan paths and excludes Seven Pairs.
    """
    seat_idx = TILE_INDEX_MAP[seat_wind]
    prev_idx = TILE_INDEX_MAP[prevailing_wind]

    value_honor_indices = set(DRAGON_INDICES)
    value_honor_indices.add(seat_idx)
    value_honor_indices.add(prev_idx)

    paths = []

    # 1. Thirteen Orphans (10 Fan)
    s_13 = calculate_thirteen_orphans_shanten(counts)
    paths.append({"name": "十三幺 (Thirteen Orphans)", "fan": 10, "shanten": s_13, "code": "13_orphans"})

    # 2. Ping Hu (平胡 - 1 Fan)
    s_pinghu = calculate_ping_hu_shanten(counts)
    paths.append({"name": "平胡 (Common Hand)", "fan": 1, "shanten": s_pinghu, "code": "ping_hu"})

    # 3. Pong Pong Hu (對對胡 - 3 Fan)
    s_pph = calculate_pong_pong_hu_shanten(counts)
    paths.append({"name": "對對胡 (All Triplets)", "fan": 3, "shanten": s_pph, "code": "pong_pong_hu"})

    # 4. Half Flush / Full Flush (3 / 7 Fan)
    for s_code, s_name in [('m', '萬子 (Characters)'), ('p', '筒子 (Dots)'), ('s', '索子 (Bamboos)')]:
        s_half = calculate_suit_flush_shanten(counts, s_code, allow_honors=True)
        paths.append({"name": f"混一色 ({s_name} Half Flush)", "fan": 3, "shanten": s_half, "code": f"half_flush_{s_code}"})
        s_full = calculate_suit_flush_shanten(counts, s_code, allow_honors=False)
        paths.append({"name": f"清一色 ({s_name} Full Flush)", "fan": 7, "shanten": s_full, "code": f"full_flush_{s_code}"})

    # 5. Value Honor Pongs (1+ Fan each)
    for h_idx in value_honor_indices:
        h_code = INDEX_TILE_MAP[h_idx]
        h_info = TILE_INFO_MAP[h_code]
        s_hp = calculate_honor_pong_shanten(counts, h_idx)
        paths.append({"name": f"{h_info['chinese']}刻 ({h_info['english']} Pong)", "fan": 1, "shanten": s_hp, "code": f"honor_pong_{h_code}"})

    # 6. All Honors (10 Fan)
    s_all_honors = calculate_suit_flush_shanten(counts, 'z', allow_honors=True)
    paths.append({"name": "字一色 (All Honors)", "fan": 10, "shanten": s_all_honors, "code": "all_honors"})

    min_tvb_shanten = min(p["shanten"] for p in paths)
    unconstrained = calculate_general_shanten_unconstrained(counts)

    viable = [p for p in paths if p["shanten"] <= min_tvb_shanten + 1]
    viable.sort(key=lambda x: (x["shanten"], -x["fan"]))

    is_chicken_hand_trap = (unconstrained < min_tvb_shanten)

    return {
        "shanten": min_tvb_shanten,
        "unconstrained_shanten": unconstrained,
        "is_chicken_hand_trap": is_chicken_hand_trap,
        "viable_paths": viable,
        "all_paths": paths
    }
