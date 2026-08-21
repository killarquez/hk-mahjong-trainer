"""
TVB 2026 4-Player Hong Kong Mahjong Table Game Engine.
Manages a full table match with 1 human player and 3 AI bots:
- 136-tile shuffled wall (0 flowers)
- Live discard rivers (河) for all 4 players
- Full turn cycle: Draw -> Discard -> Check claims (Win/Pong/Kong/Chow) -> Dealer progression
- Appendix 1 scoring calculation on Win / Exhaust Draw
"""

import uuid
import random
from typing import List, Dict, Any, Optional
from engine.tiles import (
    ALL_TILE_CODES,
    TILE_INDEX_MAP,
    INDEX_TILE_MAP,
    TILE_INFO_MAP,
    create_shuffled_wall,
    sort_tiles,
    hand_to_counts,
    counts_to_hand
)
from engine.shanten import calculate_tvb_shanten
from engine.ukeire import calculate_ukeire_for_13
from engine.bot_ai import MahjongBotAI
from fan_calculator import calculate_fan

ACTIVE_TABLE_GAMES: Dict[str, "TableMatchGame"] = {}

class TableMatchGame:
    def __init__(self, game_id: str, user_name: str = "Player (You)"):
        self.game_id = game_id
        self.user_name = user_name
        self.prevailing_wind = "1z" # East Round
        self.hand_number = 1       # Hand 1 of 16
        
        # 4 Seats: 0: User (South 2z), 1: Bot East (1z), 2: Bot West (3z), 3: Bot North (4z)
        # Standard Hong Kong table seating: East (1z) -> South (2z) -> West (3z) -> North (4z)
        self.seat_winds = ["1z", "2z", "3z", "4z"]
        self.player_names = ["Master Chan (陳大師)", f"{user_name}", "Tactical Lee (李戰術)", "Steady Cheung (張沉著)"]
        self.is_human = [False, True, False, False]
        self.scores = [500, 500, 500, 500]

        self.bots = [
            MahjongBotAI("Master Chan", "1z", "aggressive"),
            None, # Human
            MahjongBotAI("Tactical Lee", "3z", "balanced"),
            MahjongBotAI("Steady Cheung", "4z", "efficient")
        ]

        self.wall: List[str] = []
        self.hands: List[List[str]] = [[], [], [], []]
        self.melds: List[List[Dict[str, Any]]] = [[], [], [], []] # [{type: "pong"|"chow"|"kong", tiles: [...]}]
        self.rivers: List[List[Dict[str, Any]]] = [[], [], [], []] # [{tile: "1m", is_claimed: bool}]
        
        self.current_turn_index = 0 # 0=East (Dealer) starts
        self.dealer_index = 0
        self.drawn_tile: Optional[str] = None
        self.last_discard: Optional[Dict[str, Any]] = None # {player_index: int, tile: str}
        self.user_passed_last_discard = False
        self.game_over = False
        self.match_over = False
        self.winner_info: Optional[Dict[str, Any]] = None
        self.final_standings: List[Dict[str, Any]] = []
        self.match_logs: List[str] = []

        self.start_new_hand()

    def compute_final_standings(self) -> List[Dict[str, Any]]:
        """Computes final 16-hand tournament standings ranked 1st through 4th."""
        ranked = []
        for i in range(4):
            ranked.append({
                "player_index": i,
                "name": self.player_names[i],
                "is_human": self.is_human[i],
                "seat_wind": self.seat_winds[i],
                "score": self.scores[i],
                "score_delta": self.scores[i] - 500
            })
        ranked.sort(key=lambda x: x["score"], reverse=True)
        for rank_idx, item in enumerate(ranked):
            item["rank"] = rank_idx + 1
            if rank_idx == 0:
                item["rank_title"] = "🥇 冠軍 (Champion)"
            elif rank_idx == 1:
                item["rank_title"] = "🥈 亞軍 (1st Runner-Up)"
            elif rank_idx == 2:
                item["rank_title"] = "🥉 季軍 (2nd Runner-Up)"
            else:
                item["rank_title"] = "4th 殿軍 (4th Place)"
        return ranked

    def start_new_hand(self):
        """Shuffles 136 tiles and deals 13 tiles to each player with dynamic Wind and Seating updates."""
        if self.hand_number > 16:
            self.match_over = True
            self.game_over = True
            self.final_standings = self.compute_final_standings()
            return

        self.wall = create_shuffled_wall()
        self.hands = [[], [], [], []]
        self.melds = [[], [], [], []]
        self.rivers = [[], [], [], []]
        self.game_over = False
        self.winner_info = None
        self.user_passed_last_discard = False

        # 1. Update Prevailing Round Wind (圈風) for 16-hand match:
        # Hand 1-4: 1z (East), Hand 5-8: 2z (South), Hand 9-12: 3z (West), Hand 13-16: 4z (North)
        wind_cycle = ["1z", "2z", "3z", "4z"]
        round_wind_idx = ((self.hand_number - 1) // 4) % 4
        self.prevailing_wind = wind_cycle[round_wind_idx]

        # 2. Update Dynamic Seat Winds (門風): Dealer is ALWAYS East (1z) for the hand
        for i in range(4):
            seat_offset = (i - self.dealer_index) % 4
            self.seat_winds[i] = wind_cycle[seat_offset]
            if self.bots[i]:
                self.bots[i].seat_wind = self.seat_winds[i]

        # Deal 13 tiles to each
        for i in range(4):
            self.hands[i] = sort_tiles(self.wall[:13])
            self.wall = self.wall[13:]

        # Dealer draws opening 14th tile
        self.current_turn_index = self.dealer_index
        drawn = self.wall.pop(0)
        self.drawn_tile = drawn
        self.hands[self.dealer_index].append(drawn)
        self.hands[self.dealer_index] = sort_tiles(self.hands[self.dealer_index])
        self.last_discard = None

        dealer_name = self.player_names[self.dealer_index]
        prev_name = TILE_INFO_MAP[self.prevailing_wind]['chinese']
        self.match_logs.append(f"🀄 Hand #{self.hand_number}/16 started. 圈風 (Round): {prev_name}. 莊家 (Dealer): {dealer_name}.")

    def get_all_visible_discards(self) -> List[str]:
        """Returns all tiles discarded into rivers across all 4 players."""
        vis = []
        for r in self.rivers:
            for item in r:
                vis.append(item["tile"])
        for m_list in self.melds:
            for m in m_list:
                vis.extend(m["tiles"])
        return vis

    def get_user_claim_options(self, discarded_tile: str, discarder_idx: int) -> Dict[str, Any]:
        """
        Checks what claims (Win, Pong, Kong, Chow) are available for the human player (seat 1).
        """
        user_idx = 1
        if discarder_idx == user_idx or self.game_over:
            return {"can_win": False, "can_pong": False, "can_kong": False, "can_chow": False, "chow_options": []}

        user_hand = self.hands[user_idx]
        counts = hand_to_counts(user_hand)
        d_idx = TILE_INDEX_MAP[discarded_tile]

        # 1. Check Win (Ron / 出銃)
        can_win = False
        win_fan = 0
        hand_name = ""
        try:
            full_test_tiles = list(user_hand)
            for m in self.melds[user_idx]:
                full_test_tiles.extend(m["tiles"][:3])
            full_test_tiles.append(discarded_tile)

            if len(full_test_tiles) == 14:
                fan_res = calculate_fan(
                    tiles=sort_tiles(full_test_tiles),
                    winning_tile=discarded_tile,
                    is_self_draw=False,
                    prevailing_wind=self.prevailing_wind,
                    seat_wind=self.seat_winds[user_idx]
                )
                if fan_res.get("is_valid_win") and fan_res.get("total_fan", 0) >= 1:
                    can_win = True
                    win_fan = fan_res["total_fan"]
                    hand_name = fan_res["hand_name"]
        except Exception:
            pass

        # 2. Check Pong (碰)
        can_pong = (counts[d_idx] >= 2)

        # 3. Check Kong (槓)
        can_kong = (counts[d_idx] >= 3)

        # 4. Check Chow (上 - only if discarder is Upper Seat / player 0)
        can_chow = False
        chow_options = []
        if discarder_idx == (user_idx - 1) % 4 and d_idx < 27:
            suit_start = (d_idx // 9) * 9
            rel_num = (d_idx % 9) + 1 # 1..9

            # Pattern A: (d-2, d-1, d)
            if rel_num >= 3 and counts[d_idx - 2] > 0 and counts[d_idx - 1] > 0:
                chow_options.append([INDEX_TILE_MAP[d_idx - 2], INDEX_TILE_MAP[d_idx - 1], discarded_tile])

            # Pattern B: (d-1, d, d+1)
            if rel_num >= 2 and rel_num <= 8 and counts[d_idx - 1] > 0 and counts[d_idx + 1] > 0:
                chow_options.append([INDEX_TILE_MAP[d_idx - 1], discarded_tile, INDEX_TILE_MAP[d_idx + 1]])

            # Pattern C: (d, d+1, d+2)
            if rel_num <= 7 and counts[d_idx + 1] > 0 and counts[d_idx + 2] > 0:
                chow_options.append([discarded_tile, INDEX_TILE_MAP[d_idx + 1], INDEX_TILE_MAP[d_idx + 2]])

            if len(chow_options) > 0:
                can_chow = True

        return {
            "can_win": can_win,
            "win_fan": win_fan,
            "hand_name": hand_name,
            "can_pong": can_pong,
            "can_kong": can_kong,
            "can_chow": can_chow,
            "chow_options": chow_options
        }

    def execute_discard(self, player_idx: int, tile: str) -> Dict[str, Any]:
        """Player discards a tile into their river."""
        if tile not in self.hands[player_idx]:
            raise ValueError(f"Tile {tile} not in player's hand.")

        self.hands[player_idx].remove(tile)
        self.hands[player_idx] = sort_tiles(self.hands[player_idx])
        self.rivers[player_idx].append({"tile": tile, "is_claimed": False})
        self.last_discard = {"player_index": player_idx, "tile": tile}
        self.user_passed_last_discard = False
        p_name = self.player_names[player_idx]
        t_info = TILE_INFO_MAP[tile]
        self.match_logs.append(f"{p_name} discarded {t_info['chinese']} ({tile}).")

        return {
            "player_index": player_idx,
            "tile": tile
        }

    def step_game_loop(self) -> Dict[str, Any]:
        """
        Advances the match state:
        - If someone just discarded, checks other players' claims.
        - If bots can claim, executes bot claim.
        - If human player can claim, pauses and returns prompt.
        - Otherwise, advances to the next player's draw and discard turn.
        """
        if self.game_over:
            return self.get_state()

        # Check claims on the last discard
        if self.last_discard:
            disc_tile = self.last_discard["tile"]
            disc_idx = self.last_discard["player_index"]

            # First: check if Human Player (index 1) has claim available (and hasn't passed)
            if not self.user_passed_last_discard:
                user_claims = self.get_user_claim_options(disc_tile, disc_idx)
                if user_claims["can_win"] or user_claims["can_pong"] or user_claims["can_kong"] or user_claims["can_chow"]:
                    return {
                        **self.get_state(),
                        "user_claim_prompt": user_claims,
                        "waiting_for_user_claim": True
                    }

            # Check if any Bot claims Win > Pong/Kong > Chow
            # Check in turn order starting from discarder + 1
            for offset in range(1, 4):
                b_idx = (disc_idx + offset) % 4
                if not self.is_human[b_idx]:
                    bot = self.bots[b_idx]
                    b_hand = self.hands[b_idx]
                    b_melds = self.melds[b_idx]
                    claim = bot.evaluate_claim(
                        hand_13=b_hand,
                        melds=b_melds,
                        discarded_tile=disc_tile,
                        discarder_seat=self.seat_winds[disc_idx],
                        prevailing_wind=self.prevailing_wind,
                        visible_discards=self.get_all_visible_discards()
                    )

                    if claim["action"] == "WIN":
                        # Bot wins!
                        self.process_win(winner_idx=b_idx, shooter_idx=disc_idx, winning_tile=disc_tile, is_self_draw=False)
                        return self.get_state()

                    if claim["action"] in ["PONG", "KONG"]:
                        self.execute_bot_pong_or_kong(b_idx, disc_tile, claim["action"])
                        self.last_discard = None
                        self.user_passed_last_discard = False
                        return self.get_state()

                    if claim["action"] == "CHOW" and (disc_idx == (b_idx - 1) % 4):
                        self.execute_bot_chow(b_idx, disc_tile, claim["meld"])
                        self.last_discard = None
                        self.user_passed_last_discard = False
                        return self.get_state()

            # No claims on last discard
            self.last_discard = None
            self.user_passed_last_discard = False
            # Advance to next turn
            self.current_turn_index = (disc_idx + 1) % 4

        curr_idx = self.current_turn_index

        # Next player draws from wall if they need a tile (hand size % 3 == 1)
        if len(self.hands[curr_idx]) % 3 == 1:
            if len(self.wall) == 0:
                # Wall exhausted - Exhaust Draw (流局 / 摸和)
                self.process_exhaust_draw()
                return self.get_state()

            drawn = self.wall.pop(0)
            self.drawn_tile = drawn
            self.hands[curr_idx].append(drawn)
            self.hands[curr_idx] = sort_tiles(self.hands[curr_idx])
        else:
            drawn = self.drawn_tile

        # If it's Human Turn: pause for user discard (and check Self-Draw Win + Promoted/Concealed Kong)
        if self.is_human[curr_idx]:
            full_user_tiles = list(self.hands[curr_idx])
            for m in self.melds[curr_idx]:
                full_user_tiles.extend(m["tiles"][:3])
            full_user_tiles = sort_tiles(full_user_tiles)

            # 1. Check Self-Draw Win (自摸)
            can_win = False
            win_fan = 0
            hand_name = ""
            if len(full_user_tiles) == 14:
                try:
                    fan_res = calculate_fan(
                        tiles=full_user_tiles,
                        winning_tile=drawn or self.hands[curr_idx][-1],
                        is_self_draw=True,
                        prevailing_wind=self.prevailing_wind,
                        seat_wind=self.seat_winds[curr_idx]
                    )
                    if fan_res.get("is_valid_win") and fan_res.get("total_fan", 0) >= 1:
                        can_win = True
                        win_fan = fan_res["total_fan"]
                        hand_name = fan_res["hand_name"]
                except Exception:
                    pass

            # 2. Check Promoted Kong (加槓) and Concealed Kong (暗槓)
            can_kong = False
            kong_options = []
            # Promoted Kong: hand tile matches exposed Pong meld
            for m in self.melds[curr_idx]:
                if m["type"] == "pong":
                    p_tile = m["tiles"][0]
                    if p_tile in self.hands[curr_idx]:
                        can_kong = True
                        kong_options.append({
                            "type": "promoted",
                            "tile": p_tile,
                            "desc": f"加槓 {TILE_INFO_MAP[p_tile]['chinese']} ({p_tile})"
                        })

            # Concealed Kong: 4 identical tiles in concealed hand
            u_counts = hand_to_counts(self.hands[curr_idx])
            for i in range(34):
                if u_counts[i] == 4:
                    c_tile = INDEX_TILE_MAP[i]
                    can_kong = True
                    kong_options.append({
                        "type": "concealed",
                        "tile": c_tile,
                        "desc": f"暗槓 {TILE_INFO_MAP[c_tile]['chinese']} ({c_tile})"
                    })

            if drawn:
                t_zh = TILE_INFO_MAP[drawn]['chinese']
                self.match_logs.append(f"👉 Your turn! You drew {t_zh} ({drawn}).")
            else:
                self.match_logs.append("👉 Your turn! Please select a tile to discard.")

            resp = {
                **self.get_state(),
                "waiting_for_user_discard": True
            }
            if can_win or can_kong:
                resp["user_claim_prompt"] = {
                    "can_win": can_win,
                    "is_self_draw": True,
                    "win_fan": win_fan,
                    "hand_name": hand_name,
                    "can_pong": False,
                    "can_kong": can_kong,
                    "kong_options": kong_options,
                    "can_chow": False,
                    "chow_options": []
                }
                resp["waiting_for_user_claim"] = True

            return resp

        # If it's a Bot turn:
        bot = self.bots[curr_idx]

        # Check if Bot can execute Promoted Kong (加槓) or Concealed Kong (暗槓)
        bot_did_kong = False
        for m in self.melds[curr_idx]:
            if m["type"] == "pong":
                p_tile = m["tiles"][0]
                if p_tile in self.hands[curr_idx]:
                    self.hands[curr_idx].remove(p_tile)
                    m["type"] = "kong"
                    m["tiles"] = [p_tile, p_tile, p_tile, p_tile]
                    p_name = self.player_names[curr_idx]
                    self.match_logs.append(f"⚡ {p_name} called Promoted Kong (加槓) on {TILE_INFO_MAP[p_tile]['chinese']} ({p_tile})!")
                    if len(self.wall) > 0:
                        drawn = self.wall.pop(-1)
                        self.drawn_tile = drawn
                        self.hands[curr_idx].append(drawn)
                        self.hands[curr_idx] = sort_tiles(self.hands[curr_idx])
                    bot_did_kong = True
                    break

        if not bot_did_kong:
            b_counts = hand_to_counts(self.hands[curr_idx])
            for i in range(34):
                if b_counts[i] == 4:
                    c_tile = INDEX_TILE_MAP[i]
                    for _ in range(4):
                        self.hands[curr_idx].remove(c_tile)
                    self.melds[curr_idx].append({"type": "concealed_kong", "tiles": [c_tile, c_tile, c_tile, c_tile]})
                    p_name = self.player_names[curr_idx]
                    self.match_logs.append(f"⚡ {p_name} called Concealed Kong (暗槓) on {TILE_INFO_MAP[c_tile]['chinese']} ({c_tile})!")
                    if len(self.wall) > 0:
                        drawn = self.wall.pop(-1)
                        self.drawn_tile = drawn
                        self.hands[curr_idx].append(drawn)
                        self.hands[curr_idx] = sort_tiles(self.hands[curr_idx])
                    break

        # Collect opponents' data for defensive threat analysis
        opponents_data = []
        for opp_idx in range(4):
            if opp_idx != curr_idx:
                opponents_data.append({
                    "player_idx": opp_idx,
                    "name": self.player_names[opp_idx],
                    "seat_wind": self.seat_winds[opp_idx],
                    "melds": self.melds[opp_idx],
                    "river": self.rivers[opp_idx]
                })

        bot_res = bot.select_discard(
            hand_14=self.hands[curr_idx],
            prevailing_wind=self.prevailing_wind,
            visible_discards=self.get_all_visible_discards(),
            opponents_data=opponents_data
        )

        if bot_res["is_win"]:
            # Bot Self-Draw (自摸)
            self.process_win(winner_idx=curr_idx, shooter_idx=None, winning_tile=drawn or self.hands[curr_idx][-1], is_self_draw=True)
            return self.get_state()

        # Bot discards
        chosen_discard = bot_res["tile"]
        self.execute_discard(curr_idx, chosen_discard)
        return self.get_state()

    def execute_bot_pong_or_kong(self, player_idx: int, tile: str, action: str):
        p_name = self.player_names[player_idx]
        if self.last_discard and len(self.rivers[self.last_discard["player_index"]]) > 0:
            self.rivers[self.last_discard["player_index"]].pop()

        remove_count = 2 if action == "PONG" else 3
        for _ in range(remove_count):
            self.hands[player_idx].remove(tile)

        meld_tiles = [tile] * (3 if action == "PONG" else 4)
        self.melds[player_idx].append({"type": action.lower(), "tiles": meld_tiles})
        self.match_logs.append(f"⚡ {p_name} called {action} on {TILE_INFO_MAP[tile]['chinese']} ({tile})!")

        self.current_turn_index = player_idx
        # If Kong: draw replacement from back of wall
        if action == "KONG" and len(self.wall) > 0:
            drawn = self.wall.pop(-1)
            self.hands[player_idx].append(drawn)
            self.drawn_tile = drawn

        bot = self.bots[player_idx]
        bot_res = bot.select_discard(self.hands[player_idx], self.prevailing_wind, self.get_all_visible_discards())
        self.execute_discard(player_idx, bot_res["tile"])

    def execute_bot_chow(self, player_idx: int, tile: str, meld: List[str]):
        p_name = self.player_names[player_idx]
        if self.last_discard and len(self.rivers[self.last_discard["player_index"]]) > 0:
            self.rivers[self.last_discard["player_index"]].pop()

        for t in meld:
            if t != tile:
                self.hands[player_idx].remove(t)
        self.melds[player_idx].append({"type": "chow", "tiles": meld})
        self.match_logs.append(f"⚡ {p_name} called Chow on {TILE_INFO_MAP[tile]['chinese']} ({tile})!")
        self.current_turn_index = player_idx
        bot = self.bots[player_idx]
        bot_res = bot.select_discard(self.hands[player_idx], self.prevailing_wind, self.get_all_visible_discards())
        self.execute_discard(player_idx, bot_res["tile"])

    def execute_user_claim(self, action: str, meld: Optional[Any] = None) -> Dict[str, Any]:
        """Executes human user claim (WIN, PONG, KONG, CHOW, PASS)."""
        user_idx = 1

        if action == "WIN":
            if not self.last_discard:
                # Self-Draw Win (自摸)
                winning_tile = self.drawn_tile or self.hands[user_idx][-1]
                self.process_win(winner_idx=user_idx, shooter_idx=None, winning_tile=winning_tile, is_self_draw=True)
            else:
                # Ron Win (出銃 / 食胡)
                disc_tile = self.last_discard["tile"]
                disc_idx = self.last_discard["player_index"]
                if len(self.rivers[disc_idx]) > 0:
                    self.rivers[disc_idx].pop()
                self.process_win(winner_idx=user_idx, shooter_idx=disc_idx, winning_tile=disc_tile, is_self_draw=False)
            return self.get_state()

        if action == "KONG":
            # Case A: Direct Exposed Kong (大明槓) on opponent's discard
            if self.last_discard:
                disc_tile = self.last_discard["tile"]
                disc_idx = self.last_discard["player_index"]
                if len(self.rivers[disc_idx]) > 0:
                    self.rivers[disc_idx].pop()
                for _ in range(3):
                    self.hands[user_idx].remove(disc_tile)
                self.melds[user_idx].append({"type": "kong", "tiles": [disc_tile, disc_tile, disc_tile, disc_tile]})
                self.match_logs.append(f"🎉 You called Kong (大明槓) on {TILE_INFO_MAP[disc_tile]['chinese']} ({disc_tile})!")
                self.current_turn_index = user_idx
                self.last_discard = None
                self.user_passed_last_discard = False
            else:
                # Case B: On User's own turn -> Promoted Kong (加槓) or Concealed Kong (暗槓)
                target_tile = None
                kong_type = "promoted"
                if isinstance(meld, dict):
                    target_tile = meld.get("tile")
                    kong_type = meld.get("type", "promoted")
                elif isinstance(meld, list) and len(meld) > 0:
                    target_tile = meld[0]
                elif isinstance(meld, str):
                    target_tile = meld

                # Auto-detect target tile if not specified
                if not target_tile:
                    for m in self.melds[user_idx]:
                        if m["type"] == "pong" and m["tiles"][0] in self.hands[user_idx]:
                            target_tile = m["tiles"][0]
                            kong_type = "promoted"
                            break
                    if not target_tile:
                        u_counts = hand_to_counts(self.hands[user_idx])
                        for i in range(34):
                            if u_counts[i] == 4:
                                target_tile = INDEX_TILE_MAP[i]
                                kong_type = "concealed"
                                break

                if not target_tile:
                    raise ValueError("No valid Kong available to declare.")

                if kong_type == "promoted":
                    self.hands[user_idx].remove(target_tile)
                    for m in self.melds[user_idx]:
                        if m["type"] == "pong" and m["tiles"][0] == target_tile:
                            m["type"] = "kong"
                            m["tiles"] = [target_tile, target_tile, target_tile, target_tile]
                            break
                    self.match_logs.append(f"🎉 You called Promoted Kong (加槓/補槓) on {TILE_INFO_MAP[target_tile]['chinese']} ({target_tile})!")
                else:
                    for _ in range(4):
                        self.hands[user_idx].remove(target_tile)
                    self.melds[user_idx].append({"type": "concealed_kong", "tiles": [target_tile, target_tile, target_tile, target_tile]})
                    self.match_logs.append(f"🎉 You called Concealed Kong (暗槓) on {TILE_INFO_MAP[target_tile]['chinese']} ({target_tile})!")

            # Draw replacement tile from the back of the wall (槓尾補牌)
            drawn = None
            if len(self.wall) > 0:
                drawn = self.wall.pop(-1)
                self.drawn_tile = drawn
                self.hands[user_idx].append(drawn)
                self.hands[user_idx] = sort_tiles(self.hands[user_idx])
                self.match_logs.append(f"👉 You drew replacement tile {TILE_INFO_MAP[drawn]['chinese']} ({drawn}) from Kong (槓尾補牌)!")

            # Check if replacement tile triggers Kong Bloom Self-Draw Win (槓上開花)
            full_user_tiles = list(self.hands[user_idx])
            for m in self.melds[user_idx]:
                full_user_tiles.extend(m["tiles"][:3])
            full_user_tiles = sort_tiles(full_user_tiles)

            user_self_draw_claim = None
            if len(full_user_tiles) == 14:
                try:
                    fan_res = calculate_fan(
                        tiles=full_user_tiles,
                        winning_tile=drawn or self.hands[user_idx][-1],
                        is_self_draw=True,
                        prevailing_wind=self.prevailing_wind,
                        seat_wind=self.seat_winds[user_idx]
                    )
                    if fan_res.get("is_valid_win") and fan_res.get("total_fan", 0) >= 1:
                        user_self_draw_claim = {
                            "can_win": True,
                            "is_self_draw": True,
                            "win_fan": fan_res["total_fan"],
                            "hand_name": f"{fan_res['hand_name']} (槓上開花 / Kong Bloom)",
                            "can_pong": False,
                            "can_kong": False,
                            "can_chow": False,
                            "chow_options": []
                        }
                except Exception:
                    pass

            resp = {
                **self.get_state(),
                "waiting_for_user_discard": True
            }
            if user_self_draw_claim:
                resp["user_claim_prompt"] = user_self_draw_claim
                resp["waiting_for_user_claim"] = True

            return resp

        if not self.last_discard:
            raise ValueError("No active discard to claim.")

        disc_tile = self.last_discard["tile"]
        disc_idx = self.last_discard["player_index"]

        if action == "PASS":
            self.match_logs.append("You passed on the discard.")
            self.user_passed_last_discard = True
            return self.step_game_loop()

        if action == "PONG":
            if len(self.rivers[disc_idx]) > 0:
                self.rivers[disc_idx].pop()
            for _ in range(2):
                self.hands[user_idx].remove(disc_tile)
            self.melds[user_idx].append({"type": "pong", "tiles": [disc_tile, disc_tile, disc_tile]})
            self.match_logs.append(f"🎉 You called Pong on {TILE_INFO_MAP[disc_tile]['chinese']} ({disc_tile})!")
            self.current_turn_index = user_idx
            self.last_discard = None
            self.user_passed_last_discard = False
            return {
                **self.get_state(),
                "waiting_for_user_discard": True
            }

        if action == "CHOW":
            if not meld:
                raise ValueError("Meld required for Chow.")
            if len(self.rivers[disc_idx]) > 0:
                self.rivers[disc_idx].pop()
            for t in meld:
                if t != disc_tile:
                    self.hands[user_idx].remove(t)
            self.melds[user_idx].append({"type": "chow", "tiles": meld})
            self.match_logs.append(f"🎉 You called Chow on {TILE_INFO_MAP[disc_tile]['chinese']} ({disc_tile})!")
            self.current_turn_index = user_idx
            self.last_discard = None
            self.user_passed_last_discard = False
            return {
                **self.get_state(),
                "waiting_for_user_discard": True
            }

        return self.get_state()

    def process_win(self, winner_idx: int, shooter_idx: Optional[int], winning_tile: str, is_self_draw: bool):
        """Calculates TVB 2026 Appendix 1 payout and updates scores."""
        self.game_over = True
        winner_name = self.player_names[winner_idx]
        winner_seat = self.seat_winds[winner_idx]

        full_hand_tiles = list(self.hands[winner_idx])
        for m in self.melds[winner_idx]:
            full_hand_tiles.extend(m["tiles"][:3])
        if not is_self_draw and len(full_hand_tiles) == 13:
            full_hand_tiles.append(winning_tile)
        full_hand_tiles = sort_tiles(full_hand_tiles)

        fan_res = calculate_fan(
            tiles=full_hand_tiles,
            winning_tile=winning_tile,
            is_self_draw=is_self_draw,
            prevailing_wind=self.prevailing_wind,
            seat_wind=winner_seat
        )

        total_fan = min(10, max(1, fan_res["total_fan"]))
        point_delta = [0, 0, 0, 0]

        # TVB 2026 Appendix 1 Point Formula
        # Normal Win: Winner gets +10 * fan, Shooter loses -10 * fan
        # Self-Draw: Winner gets +15 * fan, Each opponent loses -5 * fan
        if is_self_draw:
            win_pts = total_fan * 15
            loss_pts = -(total_fan * 5)
            for i in range(4):
                if i == winner_idx:
                    point_delta[i] = win_pts
                else:
                    point_delta[i] = loss_pts
            win_desc = f"🎉 {winner_name} 自摸 (Self-Draw) {fan_res['hand_name']} ({total_fan} 番 / Fan)!"
        else:
            shooter_name = self.player_names[shooter_idx] if shooter_idx is not None else "Opponent"
            win_pts = total_fan * 10
            point_delta[winner_idx] = win_pts
            if shooter_idx is not None:
                point_delta[shooter_idx] = -win_pts
            win_desc = f"🎯 {winner_name} 出銃胡牌 (Ron Win) off {shooter_name} with {fan_res['hand_name']} ({total_fan} 番 / Fan)!"

        for i in range(4):
            self.scores[i] += point_delta[i]

        self.match_logs.append(win_desc)

        self.winner_info = {
            "winner_index": winner_idx,
            "winner_name": winner_name,
            "shooter_index": shooter_idx,
            "is_self_draw": is_self_draw,
            "winning_tile": winning_tile,
            "fan": total_fan,
            "hand_name": fan_res["hand_name"],
            "breakdown": fan_res["breakdown"],
            "point_delta": point_delta,
            "winning_hand": self.hands[winner_idx]
        }

        # Advance dealer on every hand (TVB 過莊規則)
        self.dealer_index = (self.dealer_index + 1) % 4
        self.hand_number += 1
        if self.hand_number > 16:
            self.match_over = True
            self.final_standings = self.compute_final_standings()
            self.match_logs.append("🏆 16-Hand Tournament Match Complete! (16盤大會賽事全部結束，進行總結算)")

    def process_exhaust_draw(self):
        """Handles Exhaust Draw (摸和 / 流局) when wall reaches 0."""
        self.game_over = True
        self.match_logs.append("🤝 牌牆摸完！摸和流局 (Exhaust Draw - Wall Depleted). 過莊 (Dealer passes).")
        self.winner_info = {
            "winner_index": None,
            "is_exhaust_draw": True,
            "point_delta": [0, 0, 0, 0]
        }
        self.dealer_index = (self.dealer_index + 1) % 4
        self.hand_number += 1
        if self.hand_number > 16:
            self.match_over = True
            self.final_standings = self.compute_final_standings()
            self.match_logs.append("🏆 16-Hand Tournament Match Complete! (16盤大會賽事全部結束，進行總結算)")

    def get_state(self) -> Dict[str, Any]:
        """Returns the full table match state for the frontend."""
        vis_discards = self.get_all_visible_discards()

        # Compute user's live efficiency HUD
        full_user_tiles = list(self.hands[1])
        for m in self.melds[1]:
            full_user_tiles.extend(m["tiles"][:3])

        user_eval = None
        if len(full_user_tiles) % 3 == 2:
            try:
                user_eval = evaluate_14_hand(
                    full_user_tiles,
                    seat_wind=self.seat_winds[1],
                    prevailing_wind=self.prevailing_wind,
                    visible_discards=vis_discards,
                    allowed_discards=self.hands[1]
                )
            except Exception:
                pass
        elif len(full_user_tiles) % 3 == 1:
            try:
                u_counts = hand_to_counts(full_user_tiles)
                user_eval = calculate_ukeire_for_13(
                    u_counts,
                    seat_wind=self.seat_winds[1],
                    prevailing_wind=self.prevailing_wind,
                    visible_counts=hand_to_counts(full_user_tiles + vis_discards)
                )
            except Exception:
                pass

        displayed_hand_num = min(16, self.hand_number) if not self.match_over else 16

        return {
            "game_id": self.game_id,
            "hand_number": displayed_hand_num,
            "is_final_hand": (self.hand_number == 16 or self.match_over),
            "match_over": self.match_over,
            "final_standings": self.final_standings if self.match_over else None,
            "prevailing_wind": self.prevailing_wind,
            "dealer_index": self.dealer_index,
            "current_turn_index": self.current_turn_index,
            "remaining_wall_count": len(self.wall),
            "drawn_tile": self.drawn_tile,
            "last_discard": self.last_discard,
            "game_over": self.game_over,
            "winner_info": self.winner_info,
            "players": [
                {
                    "name": self.player_names[i],
                    "seat_wind": self.seat_winds[i],
                    "is_human": self.is_human[i],
                    "score": self.scores[i],
                    "hand_count": len(self.hands[i]),
                    "hand_tiles": self.hands[i] if self.is_human[i] or self.game_over else [],
                    "melds": self.melds[i],
                    "river": self.rivers[i]
                }
                for i in range(4)
            ],
            "user_efficiency_hud": user_eval,
            "match_logs": self.match_logs[-8:] # Return last 8 events
        }
