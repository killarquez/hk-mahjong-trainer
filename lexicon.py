"""
Cantonese Mahjong Lexicon Data Dictionary and Tile Metadata.
Strictly mapped according to Traditional Chinese, Jyutping romanization, and English.
"""

from typing import Dict, Any, List, Optional

# Core terminology dictionary
LEXICON_DICTIONARY: Dict[str, Dict[str, str]] = {
    # Suits
    "characters": {
        "chinese": "萬子",
        "jyutping": "Maan6zi2 (mahn-zee)",
        "english": "Characters Suit (Man)",
        "code_prefix": "m",
        "description": "Suit of Chinese Character numerical tiles from 1 to 9."
    },
    "dots": {
        "chinese": "筒子",
        "jyutping": "Tung4zi2 (toong-zee)",
        "english": "Dots / Circles Suit (Pin)",
        "code_prefix": "p",
        "description": "Suit of Circle / Dot numerical tiles from 1 to 9."
    },
    "bamboos": {
        "chinese": "索子",
        "jyutping": "Sok3zi2 (sawk-zee)",
        "english": "Bamboos / Sticks Suit (Sou)",
        "code_prefix": "s",
        "description": "Suit of Bamboo stick numerical tiles from 1 to 9."
    },

    # Winds (風牌)
    "east_wind": {
        "chinese": "東風",
        "jyutping": "Dung1 fung1 (doong-foong)",
        "english": "East Wind",
        "code": "1z",
        "description": "Honor tile representing the East direction."
    },
    "south_wind": {
        "chinese": "南風",
        "jyutping": "Naam4 fung1 (nahm-foong)",
        "english": "South Wind",
        "code": "2z",
        "description": "Honor tile representing the South direction."
    },
    "west_wind": {
        "chinese": "西風",
        "jyutping": "Sai1 fung1 (sigh-foong)",
        "english": "West Wind",
        "code": "3z",
        "description": "Honor tile representing the West direction."
    },
    "north_wind": {
        "chinese": "北風",
        "jyutping": "Bak1 fung1 (buhk-foong)",
        "english": "North Wind",
        "code": "4z",
        "description": "Honor tile representing the North direction."
    },

    # Dragons (三元牌)
    "red_dragon": {
        "chinese": "紅中",
        "jyutping": "Hung4 zung1 (hoong-zoong)",
        "english": "Red Dragon",
        "code": "5z",
        "description": "Dragon honor tile with red Chinese character 中."
    },
    "green_dragon": {
        "chinese": "發財",
        "jyutping": "Faat3 coi4 (fah-tsoy)",
        "english": "Green Dragon",
        "code": "6z",
        "description": "Dragon honor tile with green Chinese character 發."
    },
    "white_dragon": {
        "chinese": "白板",
        "jyutping": "Baak6 baan2 (bahk-bahn)",
        "english": "White Dragon",
        "code": "7z",
        "description": "Dragon honor tile represented by a blank white frame."
    },

    # Numbers Pronunciation Guide
    "num_1": {"chinese": "一", "jyutping": "jat1 (yut)", "english": "One (1)"},
    "num_2": {"chinese": "二", "jyutping": "ji6 (yee)", "english": "Two (2)"},
    "num_3": {"chinese": "三", "jyutping": "saam1 (sahm)", "english": "Three (3)"},
    "num_4": {"chinese": "四", "jyutping": "sei3 (say)", "english": "Four (4)"},
    "num_5": {"chinese": "五", "jyutping": "ng5 (ng)", "english": "Five (5)"},
    "num_6": {"chinese": "六", "jyutping": "luk6 (look)", "english": "Six (6)"},
    "num_7": {"chinese": "七", "jyutping": "cat1 (tsut)", "english": "Seven (7)"},
    "num_8": {"chinese": "八", "jyutping": "baat3 (baht)", "english": "Eight (8)"},
    "num_9": {"chinese": "九", "jyutping": "gau2 (gow)", "english": "Nine (9)"},

    # Concepts & Mechanics
    "terminals": {
        "chinese": "幺九",
        "jyutping": "Jiu1 gau2 (yiu-gow)",
        "english": "Terminals (1 and 9 of any suit)",
        "description": "Tiles with value 1 or 9 in Characters, Dots, or Bamboos."
    },
    "honors": {
        "chinese": "字牌",
        "jyutping": "Zi6 paai2 (zee-pie)",
        "english": "Honor Tiles (Winds and Dragons)",
        "description": "Non-suited tiles including East, South, West, North, Red, Green, White."
    },
    "fan": {
        "chinese": "番",
        "jyutping": "Faan1 (fahn)",
        "english": "Fan (Point / Multiplier unit)",
        "description": "Scoring unit in Cantonese Mahjong. TVB 2026 rules mandate min 1 Fan to win."
    },
    "pair": {
        "chinese": "眼 / 對子",
        "jyutping": "Ngaan5 / Deoi3zi2",
        "english": "Eye / Pair (Head)",
        "description": "Two identical tiles forming the hand's eye/head."
    },
    "pong": {
        "chinese": "刻子 / 碰",
        "jyutping": "Hak1zi2 / Pung3",
        "english": "Pong / Triplet",
        "description": "Three identical tiles."
    },
    "chow": {
        "chinese": "順子 / 吃",
        "jyutping": "Seon6zi2 / Hek3",
        "english": "Chow / Sequence",
        "description": "Three numerical tiles of the same suit in sequential order."
    },
    "kong": {
        "chinese": "槓子",
        "jyutping": "Gong3zi2",
        "english": "Kong / Quad",
        "description": "Four identical tiles."
    },
    "self_draw": {
        "chinese": "自摸",
        "jyutping": "Zi6 mo1 (zee-maw)",
        "english": "Self-Draw",
        "description": "Winning by drawing the winning tile yourself (+1 Fan)."
    },
    "win_by_discard": {
        "chinese": "出衝 / 食胡",
        "jyutping": "Ceon1 cung1 / Sik6 wu2",
        "english": "Win off Discard",
        "description": "Winning from a tile discarded by an opponent."
    },
    "chicken_hand": {
        "chinese": "雞胡",
        "jyutping": "Gai1 wu2 (guy-woo)",
        "english": "Chicken Hand (0 Fan)",
        "description": "A valid hand structure with 0 Fan. Strictly INVALID under TVB 2026 rules."
    },
    "half_flush": {
        "chinese": "混一色",
        "jyutping": "Wan6 jat1 sik1 (wun-yut-sik)",
        "english": "Half Flush (3 Fan)",
        "description": "A hand made exclusively of one suit plus honor tiles (Winds/Dragons)."
    },
    "full_flush": {
        "chinese": "清一色",
        "jyutping": "Cing1 jat1 sik1 (tsing-yut-sik)",
        "english": "Full Flush (7 Fan)",
        "description": "A hand made exclusively of a single numerical suit without any honors."
    },
    "all_triplets": {
        "chinese": "對對胡",
        "jyutping": "Deoi3 deoi3 wu2 (doy-doy-woo)",
        "english": "All Triplets / All Pongs (3 Fan)",
        "description": "A hand composed of four pongs/kongs and one pair."
    },
    "common_hand": {
        "chinese": "平胡",
        "jyutping": "Ping4 wu2 (ping-woo)",
        "english": "Common Hand / All Sequences (1 Fan)",
        "description": "A hand composed of four sequences and a non-value pair."
    },
    "thirteen_orphans": {
        "chinese": "十三幺",
        "jyutping": "Sap6 saam1 jiu1 (sup-sahm-yiu)",
        "english": "Thirteen Orphans (10 Fan Limit)",
        "description": "13 unique terminal/honor tiles + 1 duplicate to form a pair."
    },
    "all_honors": {
        "chinese": "字一色",
        "jyutping": "Zi6 jat1 sik1",
        "english": "All Honors (10 Fan Limit)",
        "description": "A hand composed entirely of honor tiles (Winds and Dragons)."
    },
    "big_four_winds": {
        "chinese": "大四喜",
        "jyutping": "Daai6 sei3 hei2",
        "english": "Big Four Winds (10 Fan Limit)",
        "description": "A hand containing pongs/kongs of all four winds (East, South, West, North)."
    },
    "full_shooter": {
        "chinese": "全包 / 包幫",
        "jyutping": "Cyun4 baau1 / Baau1 bong1",
        "english": "Full Shooter Penalty",
        "description": "TVB 2026 Rule: Discarding into a winning hand makes the discarder pay the entire penalty."
    },
    "twelve_tile_penalty": {
        "chinese": "十二張包自摸",
        "jyutping": "Sap6 ji6 zoeng1 baau1 zi6 mo1",
        "english": "12-Tile Penalty",
        "description": "TVB 2026 Rule: Feeding the 12th tile to an opponent showing 9 tiles of a potential limit hand makes discarder liable for all table losses if that opponent self-draws."
    }
}

# Individual Tile Lookup Table (Code -> Traditional Chinese, Jyutping, English)
TILE_LOOKUP: Dict[str, Dict[str, Any]] = {
    # Characters (萬)
    "1m": {"chinese": "一萬", "jyutping": "jat1 maan6", "english": "1 Character", "suit": "m", "value": 1, "is_terminal": True, "is_honor": False},
    "2m": {"chinese": "二萬", "jyutping": "ji6 maan6", "english": "2 Character", "suit": "m", "value": 2, "is_terminal": False, "is_honor": False},
    "3m": {"chinese": "三萬", "jyutping": "saam1 maan6", "english": "3 Character", "suit": "m", "value": 3, "is_terminal": False, "is_honor": False},
    "4m": {"chinese": "四萬", "jyutping": "sei3 maan6", "english": "4 Character", "suit": "m", "value": 4, "is_terminal": False, "is_honor": False},
    "5m": {"chinese": "五萬", "jyutping": "ng5 maan6", "english": "5 Character", "suit": "m", "value": 5, "is_terminal": False, "is_honor": False},
    "6m": {"chinese": "六萬", "jyutping": "luk6 maan6", "english": "6 Character", "suit": "m", "value": 6, "is_terminal": False, "is_honor": False},
    "7m": {"chinese": "七萬", "jyutping": "cat1 maan6", "english": "7 Character", "suit": "m", "value": 7, "is_terminal": False, "is_honor": False},
    "8m": {"chinese": "八萬", "jyutping": "baat3 maan6", "english": "8 Character", "suit": "m", "value": 8, "is_terminal": False, "is_honor": False},
    "9m": {"chinese": "九萬", "jyutping": "gau2 maan6", "english": "9 Character", "suit": "m", "value": 9, "is_terminal": True, "is_honor": False},

    # Dots (筒)
    "1p": {"chinese": "一筒", "jyutping": "jat1 tung4", "english": "1 Dot", "suit": "p", "value": 1, "is_terminal": True, "is_honor": False},
    "2p": {"chinese": "二筒", "jyutping": "ji6 tung4", "english": "2 Dot", "suit": "p", "value": 2, "is_terminal": False, "is_honor": False},
    "3p": {"chinese": "三筒", "jyutping": "saam1 tung4", "english": "3 Dot", "suit": "p", "value": 3, "is_terminal": False, "is_honor": False},
    "4p": {"chinese": "四筒", "jyutping": "sei3 tung4", "english": "4 Dot", "suit": "p", "value": 4, "is_terminal": False, "is_honor": False},
    "5p": {"chinese": "五筒", "jyutping": "ng5 tung4", "english": "5 Dot", "suit": "p", "value": 5, "is_terminal": False, "is_honor": False},
    "6p": {"chinese": "六筒", "jyutping": "luk6 tung4", "english": "6 Dot", "suit": "p", "value": 6, "is_terminal": False, "is_honor": False},
    "7p": {"chinese": "七筒", "jyutping": "cat1 tung4", "english": "7 Dot", "suit": "p", "value": 7, "is_terminal": False, "is_honor": False},
    "8p": {"chinese": "八筒", "jyutping": "baat3 tung4", "english": "8 Dot", "suit": "p", "value": 8, "is_terminal": False, "is_honor": False},
    "9p": {"chinese": "九筒", "jyutping": "gau2 tung4", "english": "9 Dot", "suit": "p", "value": 9, "is_terminal": True, "is_honor": False},

    # Bamboos (索)
    "1s": {"chinese": "一索", "jyutping": "jat1 sok3", "english": "1 Bamboo", "suit": "s", "value": 1, "is_terminal": True, "is_honor": False},
    "2s": {"chinese": "二索", "jyutping": "ji6 sok3", "english": "2 Bamboo", "suit": "s", "value": 2, "is_terminal": False, "is_honor": False},
    "3s": {"chinese": "三索", "jyutping": "saam1 sok3", "english": "3 Bamboo", "suit": "s", "value": 3, "is_terminal": False, "is_honor": False},
    "4s": {"chinese": "四索", "jyutping": "sei3 sok3", "english": "4 Bamboo", "suit": "s", "value": 4, "is_terminal": False, "is_honor": False},
    "5s": {"chinese": "五索", "jyutping": "ng5 sok3", "english": "5 Bamboo", "suit": "s", "value": 5, "is_terminal": False, "is_honor": False},
    "6s": {"chinese": "六索", "jyutping": "luk6 sok3", "english": "6 Bamboo", "suit": "s", "value": 6, "is_terminal": False, "is_honor": False},
    "7s": {"chinese": "七索", "jyutping": "cat1 sok3", "english": "7 Bamboo", "suit": "s", "value": 7, "is_terminal": False, "is_honor": False},
    "8s": {"chinese": "八索", "jyutping": "baat3 sok3", "english": "8 Bamboo", "suit": "s", "value": 8, "is_terminal": False, "is_honor": False},
    "9s": {"chinese": "九索", "jyutping": "gau2 sok3", "english": "9 Bamboo", "suit": "s", "value": 9, "is_terminal": True, "is_honor": False},

    # Winds (字)
    "1z": {"chinese": "東風", "jyutping": "dung1 fung1", "english": "East Wind", "suit": "z", "value": 1, "is_terminal": False, "is_honor": True, "honor_type": "wind"},
    "2z": {"chinese": "南風", "jyutping": "naam4 fung1", "english": "South Wind", "suit": "z", "value": 2, "is_terminal": False, "is_honor": True, "honor_type": "wind"},
    "3z": {"chinese": "西風", "jyutping": "sai1 fung1", "english": "West Wind", "suit": "z", "value": 3, "is_terminal": False, "is_honor": True, "honor_type": "wind"},
    "4z": {"chinese": "北風", "jyutping": "bak1 fung1", "english": "North Wind", "suit": "z", "value": 4, "is_terminal": False, "is_honor": True, "honor_type": "wind"},

    # Dragons (字)
    "5z": {"chinese": "紅中", "jyutping": "hung4 zung1", "english": "Red Dragon", "suit": "z", "value": 5, "is_terminal": False, "is_honor": True, "honor_type": "dragon"},
    "6z": {"chinese": "發財", "jyutping": "faat3 coi4", "english": "Green Dragon", "suit": "z", "value": 6, "is_terminal": False, "is_honor": True, "honor_type": "dragon"},
    "7z": {"chinese": "白板", "jyutping": "baak6 baan2", "english": "White Dragon", "suit": "z", "value": 7, "is_terminal": False, "is_honor": True, "honor_type": "dragon"},
}

def search_lexicon(query: str) -> List[Dict[str, Any]]:
    """Search terms in the Cantonese Mahjong Lexicon by English, Chinese, or Jyutping."""
    query_lower = query.lower().strip()
    results = []
    
    for key, item in LEXICON_DICTIONARY.items():
        if (query_lower in key or 
            query_lower in item.get("chinese", "").lower() or 
            query_lower in item.get("jyutping", "").lower() or 
            query_lower in item.get("english", "").lower()):
            results.append({"term_id": key, **item})
            
    return results
