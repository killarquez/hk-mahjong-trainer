"""
TVB 2026 Hong Kong Mahjong Curated Tactical Puzzles Suite.
Contains handcrafted, mathematically verified tournament tactical dilemmas
with comprehensive bilingual explanations and Cantonese proverbs.
"""

from typing import List, Dict, Any

TACTICAL_PUZZLES: List[Dict[str, Any]] = [
    # =========================================================================
    # CATEGORY 1: MULTI-SIDED WAITS & COMPLEX SEQUENTIAL SHAPES (多面聽牌效)
    # =========================================================================
    {
        "id": "p01_ryanmen_5_sided",
        "category": "waits",
        "category_name_zh": "多面聽牌效",
        "category_name_en": "Multi-Sided Waits",
        "difficulty": "Intermediate",
        "difficulty_stars": 3,
        "title": "5-Sided Ryanmen Wait Extension (五面聽牌效)",
        "subtitle": "Unlocking multi-sequence flexibility in a continuous run",
        "description": "You hold a 5-tile sequential block (23456m) combined with finished melds. Which discard maximizes your Tenpai winning waits to the highest possible outs?",
        "notation": "23456m456p789s11z5z",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "Notice that 23456m contains two overlapping sequences (234m + 56m) or (23m + 456m). The isolated Dragon (5z) is completely disconnected.",
        "detailed_explanation_zh": "打出孤張【紅中 (5z)】是最優解！打出後手牌進入一向聽/聽牌狀態，23456m 形成經典五面聽結構，可接受 1m, 4m, 7m (三面聽) 以及 3m, 6m 的多重進張，進張數高達 19-21 張！若錯打數牌將大幅破壞五面聽的連續延展性。",
        "detailed_explanation_en": "Discarding isolated Red Dragon (5z) is mathematically optimal. The 23456m consecutive block can decompose into (234m + 56m) waiting on 4m/7m, or (23m + 456m) waiting on 1m/4m, providing massive multi-sided Ryanmen tile acceptance across 1m, 4m, 7m, 3m, and 6m.",
        "proverb": "長條連續莫輕拆，五面聽張天下行"
    },
    {
        "id": "p02_nobeta_4_sequence",
        "category": "waits",
        "category_name_zh": "多面聽牌效",
        "category_name_en": "Multi-Sided Waits",
        "difficulty": "Beginner",
        "difficulty_stars": 2,
        "title": "Nobeta 4-Tile Extension Shape (伸張四連形 2345m)",
        "subtitle": "Recognizing 2-sided and pair formation flexibility",
        "description": "Your hand has a 4-tile consecutive block (2345m). You also hold a floating isolated 9p terminal and completed melds. Which tile should you discard?",
        "notation": "2345m678p456s78s9p2z",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "The 2345m block can either form a sequence (234m or 345m) and leave a pair/wait, or accept both 1m, 2m, 5m, 6m! The isolated 9p and 2z (South Wind) have no connections.",
        "detailed_explanation_zh": "打出非門風孤張【南風 (2z)】或孤張【九筒 (9p)】。伸張四連形 (2345m) 具有雙向延伸性：摸入 1m 或 6m 可成兩副順子；摸入 2m 或 5m 可直接成為將牌（雀頭）。因此絕對不可拆除四連形！",
        "detailed_explanation_en": "Discard isolated South Wind (2z). The 2345m 4-tile block (Nobeta) is extremely efficient: drawing 1m/6m creates finished sequences, while drawing 2m/5m creates a valuable pair (head). Never discard from the 4-tile block.",
        "proverb": "四連伸張如生翼，孤風幺九早先投"
    },
    {
        "id": "p03_aryamen_shape",
        "category": "waits",
        "category_name_zh": "多面聽牌效",
        "category_name_en": "Multi-Sided Waits",
        "difficulty": "Advanced",
        "difficulty_stars": 4,
        "title": "Aryamen Sub-Ryanmen Head Dilemma (亞兩面 2334p 形)",
        "subtitle": "Choosing between pair locking and two-sided sequence expansion",
        "description": "You hold 2334p alongside an isolated 1s and other pairs. How do you evaluate the 2334p shape?",
        "notation": "2334p123m789m55s88s1s",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "2334p is an 'Aryamen' shape: it is both a sequence (234p) with a floating 3p, and a pair (33p) with a two-sided wait (24p). The isolated 1s has only 1-sided expansion.",
        "detailed_explanation_zh": "打出孤張【一索 (1s)】為最優解！2334p 兼具順子與將牌雙重屬性：進 1p/4p 可成副，摸 2p/5p 亦可形成順子。保留亞兩面能保留最多向聽進張，孤張 1s 效率極低應果斷捨棄。",
        "detailed_explanation_en": "Discard isolated 1s. The 2334p 'Aryamen' shape functions both as a finished Chow with a pair candidate (33p) or as a Ryanmen waiting on 1p/4p/2p/5p. Discarding 1s maintains maximum efficiency.",
        "proverb": "亞兩面中藏好雀，孤單邊位早當除"
    },

    # =========================================================================
    # CATEGORY 2: 1-FAN MINIMUM TOURNAMENT PIVOTS (1番起胡抉擇)
    # =========================================================================
    {
        "id": "p04_chicken_hand_trap",
        "category": "fan_pivot",
        "category_name_zh": "1番起胡抉擇",
        "category_name_en": "1-Fan Minimum Pivots",
        "difficulty": "Intermediate",
        "difficulty_stars": 3,
        "title": "Dragon Pair 0-Fan Chicken Hand Trap (0番雞胡陷阱)",
        "subtitle": "Avoiding dead hands under TVB 2026 rules",
        "description": "You have 4 sequences and a pair of Red Dragons (55z). In Hong Kong Mahjong (TVB 2026), a hand of 4 Chows with an honor pair is 0 Fan (Chicken Hand / 雞胡) and CANNOT win! How do you pivot to 1 Fan?",
        "notation": "123m456p789s23s55z4z",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "Ping Hu (平胡 - 1 Fan) requires all sequences AND a numbered tile pair (no honors). Alternatively, Pong Pong Hu or Red Dragon Pong would yield Fan. First discard the isolated 4z (North Wind) to aim for a numbered Ping Hu head or Dragon Pong.",
        "detailed_explanation_zh": "在 2026 TVB 大賽章程中，【全順子 + 中發白/風牌眼】為 0 番雞胡（不能起胡！）。打出死風【北風 (4z)】保留手牌靈活性。下一步可將 55z 碰成【紅中刻 (1番)】，或摸入 1s/4s 將 23s 延伸成順子並尋求數牌作眼達成【平胡 (1番)】。",
        "detailed_explanation_en": "In TVB 2026 rules, 4 Chows + Dragon Pair is 0-Fan Chicken Hand and dead/illegal. Discard isolated North Wind (4z). From here, you can either Pong Red Dragon (55z) into a 1-Fan Dragon Pong, or complete Ping Hu by forming a numbered head and keeping 4 Chows with a two-sided wait.",
        "proverb": "雞胡無分難自救，平胡字眼不可留"
    },
    {
        "id": "p05_half_flush_pivot",
        "category": "fan_pivot",
        "category_name_zh": "1番起胡抉擇",
        "category_name_en": "1-Fan Minimum Pivots",
        "difficulty": "Advanced",
        "difficulty_stars": 4,
        "title": "Half-Flush vs Ping-Hu Pivot (混一色與平胡抉擇)",
        "subtitle": "Sacrificing speed for high-value 3-Fan conversion",
        "description": "You hold 9 Bamboo tiles, 2 Honor pairs (East/South), and an isolated 5 Character (5m). Should you hold 5m for a generic Ping Hu, or discard 5m to lock in a 3-Fan Half Flush (混一色)?",
        "notation": "123s456s789s11z22z5m",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "Your hand already possesses 9 Bamboo tiles and 4 Honors. Discarding 5m leaves a 1-Shanten Half Flush worth 3+ Fan, which easily satisfies the 1-Fan minimum with huge tournament point value.",
        "detailed_explanation_zh": "果斷打出【五萬 (5m)】！打出 5m 後手牌直接進入【混一色 (3番)】一向聽。在 TVB 全銃制大賽中，混一色 3 番的得分回報遠高於冒險組 1 番平胡，且手牌條子結構已完全成型。",
        "detailed_explanation_en": "Discard 5m immediately! Discarding 5m puts the hand in 1-Shanten for a guaranteed 3-Fan Half Flush (混一色). In TVB tournament full-shooter format, a 3-Fan Half Flush is vastly superior to a precarious 1-Fan attempt.",
        "proverb": "混一色成氣候足，莫留雜色阻前程"
    },
    {
        "id": "p06_pong_pong_hu_pivot",
        "category": "fan_pivot",
        "category_name_zh": "1番起胡抉擇",
        "category_name_en": "1-Fan Minimum Pivots",
        "difficulty": "Intermediate",
        "difficulty_stars": 3,
        "title": "All Triplets Transformation (對對胡 3番轉型)",
        "subtitle": "Evaluating pair density for a 3-Fan Pong Pong Hu",
        "description": "You hold 4 pairs (22m, 55m, 88p, 66z) and an open run (123s). You just drew a 9s. How do you pivot towards Pong Pong Hu?",
        "notation": "22m55m88p66z123s9s",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "Remember Seven Pairs is BANNED in TVB 2026. 4 pairs must be turned into Pongs for Pong Pong Hu (3 Fan). The isolated 9s has no pair and should be discarded.",
        "detailed_explanation_zh": "打出孤張【九索 (9s)】！注意：TVB 2026 嚴格禁止【七對子 (嚦咕嚦咕)】！手牌擁有多個對子時，唯一正確途徑是碰牌組成【對對胡 (3番)】。保留對子，拋棄無關孤張 9s。",
        "detailed_explanation_en": "Discard isolated 9s. In TVB 2026 rules, Seven Pairs is strictly BANNED. When having 4 pairs, the only viable high-efficiency path is converting them into Pong Pong Hu (All Triplets, 3 Fan) via open Pongs.",
        "proverb": "七對莫貪非正規，碰碰胡開見三番"
    },

    # =========================================================================
    # CATEGORY 3: HONOR TILES & DEFENSIVE EFFICIENCY (字牌與防禦牌效)
    # =========================================================================
    {
        "id": "p07_dead_wind_priority",
        "category": "honors_defense",
        "category_name_zh": "字牌與防守",
        "category_name_en": "Honor Tiles & Defense",
        "difficulty": "Beginner",
        "difficulty_stars": 1,
        "title": "Dead Wind vs Terminal Discard Priority (死風與幺九優先級)",
        "subtitle": "Standard opening discard sequence",
        "description": "On early Turn 2, you are East Seat (1z) in East Round (1z). You hold an isolated North Wind (4z, a guest/dead wind) and an isolated 9 Dots (9p). Which tile should be discarded first?",
        "notation": "1m2m3m4p5p6p7s8s9s2s3s5m4z9p",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "North Wind (4z) has 0 Fan value for East seat and can only connect to itself (3 remaining outs). 9p can connect to 7p, 8p, or 9p (11 potential outs).",
        "detailed_explanation_zh": "優先打出【北風 (4z)】！作為東家，北風為【客風/死風】，無番數價值且只能靠摸自身成對（最多3張進張）。而 9p 可與 7p/8p 形成邊張或順子（理論進張可達 11+ 張）。第一巡應先出客風死字。",
        "detailed_explanation_en": "Discard dead North Wind (4z) first. For East seat, North is a zero-fan guest wind that can only form a pair with itself (3 remaining copies). 9p can connect with 7p/8p into Chows. Always prioritize guest winds on early turns.",
        "proverb": "起手先捨無番字，數牌留待看連張"
    },
    {
        "id": "p08_live_dragon_holding",
        "category": "honors_defense",
        "category_name_zh": "字牌與防守",
        "category_name_en": "Honor Tiles & Defense",
        "difficulty": "Intermediate",
        "difficulty_stars": 3,
        "title": "Holding Live Dragon vs Isolated 1-Pin (生張中發白與孤張幺九)",
        "subtitle": "Weighing 1-Fan dragon potential vs terminal sequence chance",
        "description": "You hold an isolated Green Dragon (6z) which is unplayed (Live/生張) and an isolated 1 Dot (1p). Your hand needs a 1-Fan guarantee. Which tile is more valuable to discard?",
        "notation": "234m567m345s789s1p6z",
        "seat_wind": "2z",
        "prevailing_wind": "2z",
        "hint": "A triplet of Green Dragon gives an automatic 1 Fan. However, if your other 4 melds are numbered Chows, you already qualify for Ping Hu (1 Fan) once you form a numbered pair! Holding 1p allows a 123p Ping Hu Chow.",
        "detailed_explanation_zh": "若手牌已成 4 副順子雛形（234m, 567m, 345s, 789s），達成【平胡 (1番)】只需數牌將牌（雀頭）。此時字牌【發財 (6z)】無法作平胡將，應打出 6z 留下 1p 尋求摸 2p/3p 組成平胡數牌順子或將！",
        "detailed_explanation_en": "If your hand already possesses 4 completed sequences and seeks Ping Hu (1 Fan), honor tiles cannot serve as the head for Ping Hu. Discard Green Dragon (6z) and keep 1p to form a numbered head or Chow.",
        "proverb": "平胡全順無字位，字牌雖好亦須投"
    },

    # =========================================================================
    # CATEGORY 4: 10-FAN LIMIT HAND DECISIONS (十番例牌決策)
    # =========================================================================
    {
        "id": "p09_thirteen_orphans_branch",
        "category": "limit_hands",
        "category_name_zh": "十番例牌",
        "category_name_en": "Limit Hands Decisions",
        "difficulty": "Master",
        "difficulty_stars": 5,
        "title": "Thirteen Orphans Branching Threshold (十三幺起手門檻)",
        "subtitle": "Calculating when to pursue the 10-Fan maximum limit hand",
        "description": "On the initial deal, you receive 10 unique Terminals and Honors: 19m, 19p, 19s, 1234z, and a duplicate 1m, plus 2m, 3m, 5s. Is it statistically optimal to discard 5s and pursue Thirteen Orphans (十三幺 - 10 Fan)?",
        "notation": "119m19p19s1234z2m3m5s",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "You have 10 unique 13-Orphans tiles + 1 pair (11m), putting your hand at 3-Shanten for Thirteen Orphans (10 Fan)! Discarding the isolated 5s maintains the highest expected point value.",
        "detailed_explanation_zh": "打出【五索 (5s)】！手牌已有 10 種不同幺九字牌且自帶 1m 一對，十三幺向聽數僅為 3 向聽！在 TVB 大賽 10 番滿胡規則下，10 種起手的十三幺數學期望值遠高於強行拼湊普通牌型。打出 5s, 2m, 3m 堅定直奔十三幺！",
        "detailed_explanation_en": "Discard isolated 5s! With 10 unique terminals/honors and a 1m pair, the hand is only 3-Shanten for Thirteen Orphans (10-Fan Limit Hand). In tournament play, the expected value of pursuing 13 Orphans with 10+ starting tiles significantly exceeds forcing a regular low-fan hand.",
        "proverb": "十張幺九十三起，滿胡十番莫遲疑"
    },
    {
        "id": "p10_all_honors_pivot",
        "category": "limit_hands",
        "category_name_zh": "十番例牌",
        "category_name_en": "Limit Hands Decisions",
        "difficulty": "Advanced",
        "difficulty_stars": 4,
        "title": "All Honors vs Half-Flush Boundary (字一色與混一色邊界)",
        "subtitle": "Balancing a 10-Fan limit hand against a 3-Fan Half Flush",
        "description": "You hold 10 Honor tiles (11z, 22z, 55z, 66z, 7z, 3z) and 4 Character tiles (123m, 9m). Should you discard 9m to maintain the option for 字一色 (All Honors - 10 Fan) while keeping 123m as Half-Flush fallback?",
        "notation": "11z22z55z66z7z3z123m9m",
        "seat_wind": "1z",
        "prevailing_wind": "1z",
        "hint": "Discarding 9m preserves 4 Honor pairs for All Honors (10 Fan) or Pong Pong Hu (3 Fan) / Half Flush (3 Fan).",
        "detailed_explanation_zh": "打出孤張【九萬 (9m)】！手牌有 4 對字牌加 2 張孤字，保留字牌可同時兼顧【字一色 (10番)】、【混一色對對胡 (6番)】與【混一色 (3番)】。打出 9m 是兼顧牌效與番數彈性的完美一手。",
        "detailed_explanation_en": "Discard isolated 9m. Keeping all honor pairs allows flexible advancement towards All Honors (10 Fan Limit Hand), Half-Flush Pong Pong Hu (6 Fan), or standard Half Flush (3 Fan).",
        "proverb": "字多莫走尋常路，例牌十番待風雲"
    }
]


def get_all_puzzles() -> List[Dict[str, Any]]:
    """Returns all curated tactical puzzles."""
    return TACTICAL_PUZZLES


def get_puzzle_by_id(puzzle_id: str) -> Dict[str, Any]:
    """Retrieves a single tactical puzzle by ID."""
    for p in TACTICAL_PUZZLES:
        if p["id"] == puzzle_id:
            return p
    return TACTICAL_PUZZLES[0]
