/**
 * TVB Mahjong Brain Fitness Championship 2026 - Official Rules & Scoring Data (Bilingual)
 * Extracted from official tournament rulebooks and appendices.
 */

export interface FanRuleItem {
  code: string;
  name_zh: string;
  name_en: string;
  jyutping: string;
  fan: number;
  definition_zh: string;
  definition_en: string;
  example_tiles?: string[];
}

export interface PenaltyItem {
  id: string;
  violation_zh: string;
  violation_en: string;
  penalty_zh: string;
  penalty_en: string;
  severity: 'dq' | 'penalty' | 'dead_hand' | 'warning';
}

export interface ScoreTableRow {
  fan: number;
  normal_winner: number;
  normal_shooter: number;
  self_draw_winner: number;
  self_draw_opponent: number;
}

export const FAN_CONVERSION_TABLE: ScoreTableRow[] = [
  { fan: 1, normal_winner: 10, normal_shooter: -10, self_draw_winner: 15, self_draw_opponent: -5 },
  { fan: 2, normal_winner: 20, normal_shooter: -20, self_draw_winner: 30, self_draw_opponent: -10 },
  { fan: 3, normal_winner: 30, normal_shooter: -30, self_draw_winner: 45, self_draw_opponent: -15 },
  { fan: 4, normal_winner: 40, normal_shooter: -40, self_draw_winner: 60, self_draw_opponent: -20 },
  { fan: 5, normal_winner: 50, normal_shooter: -50, self_draw_winner: 75, self_draw_opponent: -25 },
  { fan: 6, normal_winner: 60, normal_shooter: -60, self_draw_winner: 90, self_draw_opponent: -30 },
  { fan: 7, normal_winner: 70, normal_shooter: -70, self_draw_winner: 105, self_draw_opponent: -35 },
  { fan: 8, normal_winner: 80, normal_shooter: -80, self_draw_winner: 120, self_draw_opponent: -40 },
  { fan: 9, normal_winner: 90, normal_shooter: -90, self_draw_winner: 135, self_draw_opponent: -45 },
  { fan: 10, normal_winner: 100, normal_shooter: -100, self_draw_winner: 150, self_draw_opponent: -50 },
];

export const OFFICIAL_FAN_RULES: FanRuleItem[] = [
  {
    code: 'A1',
    name_zh: '平胡',
    name_en: 'Ping Hu (All Chows)',
    jyutping: 'ping4 wu4',
    fan: 1,
    definition_zh: '由一對眼及四副順子（序數牌）組成，手牌不得含有任何字牌。',
    definition_en: 'Composed of 1 pair and 4 Chows (sequences) exclusively in suited tiles (no honor tiles).',
    example_tiles: ['1m', '2m', '3m', '4p', '5p', '6p', '7s', '8s', '9s', '2s', '3s', '4s', '5m', '5m']
  },
  {
    code: 'A2',
    name_zh: '自摸',
    name_en: 'Self-Draw (Zi Mo)',
    jyutping: 'zi6 mo1',
    fan: 1,
    definition_zh: '自己摸到能胡牌的牌，並報胡牌。',
    definition_en: 'Drawing the winning tile from the wall yourself and declaring victory.',
  },
  {
    code: 'A3',
    name_zh: '圈風刻',
    name_en: 'Round Wind Pong',
    jyutping: 'hyun1 fung1 hak1',
    fan: 1,
    definition_zh: '與當前圈風相同的風牌刻子（即東、南、西或北風）。',
    definition_en: 'A Pong (triplet) or Kong of the prevailing Round Wind (East/South/West/North).',
  },
  {
    code: 'A4',
    name_zh: '門風刻',
    name_en: 'Seat Wind Pong',
    jyutping: 'mun4 fung1 hak1',
    fan: 1,
    definition_zh: '與自己所坐門風相同的風牌刻子。',
    definition_en: "A Pong (triplet) or Kong of the player's own assigned Seat Wind.",
  },
  {
    code: 'A5',
    name_zh: '海底撈月',
    name_en: 'Last Tile Win (Under the Sea)',
    jyutping: 'hoi2 dai2 lou4 jyut6',
    fan: 1,
    definition_zh: '胡牌局中摸出的最後一張牌（打出或自摸）。',
    definition_en: 'Winning on the very last tile of the wall (either via self-draw or claimed discard).',
  },
  {
    code: 'A6',
    name_zh: '槓上自摸',
    name_en: 'Kong Replacement Win (Out on Kong)',
    jyutping: 'gong3 soeng5 zi6 mo1',
    fan: 1,
    definition_zh: '開槓之後摸取補牌即自摸胡牌。',
    definition_en: 'Self-drawing the winning tile immediately from the replacement tile after declaring a Kong.',
  },
  {
    code: 'A7',
    name_zh: '中發白其中一刻',
    name_en: '1st Dragon Pong',
    jyutping: 'zung1 faat3 baak6 jat1 hak1',
    fan: 1,
    definition_zh: '由中、發、白三張相同的牌組成的一副刻子（不能與小三元重複計算）。',
    definition_en: 'A Pong or Kong of any Dragon tile (Red, Green, or White). Cannot stack with Little Three Dragons.',
  },
  {
    code: 'A8',
    name_zh: '中發白其中第二刻',
    name_en: '2nd Dragon Pong',
    jyutping: 'zung1 faat3 baak6 ji6 hak1',
    fan: 1,
    definition_zh: '手牌中第二個由中、發、白組成的刻子（不能與小三元重複計算）。',
    definition_en: 'A second distinct Dragon Pong in the same hand. Cannot stack with Little Three Dragons.',
  },
  {
    code: 'B1',
    name_zh: '對對胡',
    name_en: 'All Pongs (Pong Pong Hu)',
    jyutping: 'deoi3 deoi3 wu4',
    fan: 3,
    definition_zh: '由四副刻子（或槓牌）加一對眼組成的胡牌。',
    definition_en: 'A winning hand composed of 4 Pongs/Kongs and 1 Pair.',
    example_tiles: ['1m', '1m', '1m', '4p', '4p', '4p', '7s', '7s', '7s', '9m', '9m', '9m', '5z', '5z']
  },
  {
    code: 'B2',
    name_zh: '混一色',
    name_en: 'Half Flush (Mixed One Suit)',
    jyutping: 'wan6 jat1 sik1',
    fan: 3,
    definition_zh: '由一種花色的序數牌（萬/筒/索）與字牌組成的胡牌。',
    definition_en: 'A winning hand formed exclusively by one suit plus honor tiles (Winds and/or Dragons).',
    example_tiles: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1z', '1z', '1z', '5z', '5z']
  },
  {
    code: 'B3',
    name_zh: '小三元',
    name_en: 'Little Three Dragons',
    jyutping: 'siu2 saam1 jyun4',
    fan: 4,
    definition_zh: '胡牌中有兩副中、發、白刻子（或槓）及一對中、發、白作眼。',
    definition_en: 'Hand containing 2 Dragon Pongs and 1 Dragon Pair (Red, Green, and White Dragons all present).',
    example_tiles: ['5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z', '1p', '2p', '3p', '7s', '8s', '9s']
  },
  {
    code: 'B4',
    name_zh: '小四喜',
    name_en: 'Little Four Winds',
    jyutping: 'siu2 sei3 hei2',
    fan: 5,
    definition_zh: '由三副風牌刻子（或槓）及一對風牌作眼組成的胡牌。',
    definition_en: 'Hand containing 3 Wind Pongs and 1 Wind Pair (all 4 Winds present in hand).',
    example_tiles: ['1z', '1z', '1z', '2z', '2z', '2z', '3z', '3z', '3z', '4z', '4z', '2m', '3m', '4m']
  },
  {
    code: 'B5',
    name_zh: '清一色',
    name_en: 'Full Flush (Pure One Suit)',
    jyutping: 'cing1 jat1 sik1',
    fan: 7,
    definition_zh: '由同一種花色的序數牌（全萬子、全筒子或全索子）組成，無任何字牌。',
    definition_en: 'Hand composed entirely of a single suit with zero honor tiles.',
    example_tiles: ['1m', '2m', '3m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '9m', '9m', '5m', '5m']
  },
  {
    code: 'X1',
    name_zh: '大三元',
    name_en: 'Big Three Dragons (Limit Hand)',
    jyutping: 'daai6 saam1 jyun4',
    fan: 8,
    definition_zh: '胡牌中齊集紅中、發財、白板三副刻子（或槓牌）。',
    definition_en: 'Hand containing all 3 Dragon Pongs (Red Dragon, Green Dragon, and White Dragon).',
    example_tiles: ['5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z', '7z', '1m', '2m', '3m', '9p', '9p']
  },
  {
    code: 'X2',
    name_zh: '大四喜',
    name_en: 'Big Four Winds (Limit Hand)',
    jyutping: 'daai6 sei3 hei2',
    fan: 10,
    definition_zh: '由東、南、西、北四副風牌刻子（或槓牌）組成的例牌胡牌。',
    definition_en: 'Hand containing all 4 Wind Pongs (East, South, West, and North Winds). Maximum 10-Fan limit.',
    example_tiles: ['1z', '1z', '1z', '2z', '2z', '2z', '3z', '3z', '3z', '4z', '4z', '4z', '8s', '8s']
  },
  {
    code: 'X3',
    name_zh: '十三幺',
    name_en: 'Thirteen Orphans (Limit Hand)',
    jyutping: 'sap6 saam1 jiu1',
    fan: 10,
    definition_zh: '由三種序數牌的一、九牌（1m,9m,1p,9p,1s,9s）及七種字牌（東南西北中發白）各一張，加其中任意一張作眼組成。',
    definition_en: 'One of each terminal tile (1m, 9m, 1p, 9p, 1s, 9s) and all 7 honor tiles (1-4z, 5-7z) + any one duplicated as the pair.',
    example_tiles: ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z', '1m']
  },
  {
    code: 'X4',
    name_zh: '字一色',
    name_en: 'All Honors (Limit Hand)',
    jyutping: 'zi6 jat1 sik1',
    fan: 10,
    definition_zh: '由全字牌刻子（東南西北中發白）加一對字牌作眼組成的例牌胡牌。',
    definition_en: 'Hand composed entirely of honor tiles (Winds and Dragons) in 4 Pongs and 1 Pair.',
    example_tiles: ['1z', '1z', '1z', '2z', '2z', '2z', '5z', '5z', '5z', '6z', '6z', '6z', '7z', '7z']
  }
];

export const PENALTY_RULES: PenaltyItem[] = [
  {
    id: 'PEN_01',
    violation_zh: '換牌、偷牌、藏牌或其他嚴重作弊行為',
    violation_en: 'Switching, stealing, concealing tiles, or any cheating',
    penalty_zh: '即時驅逐出場地，並取消其全部參賽資格',
    penalty_en: 'Immediate expulsion from the tournament and complete disqualification',
    severity: 'dq'
  },
  {
    id: 'PEN_02',
    violation_zh: '錯上、錯碰、錯槓（牌型組合不符規定）',
    violation_en: 'Invalid Chow, Pong, or Kong combination',
    penalty_zh: '同階段賽事內第一次警告；其後每次違規罰減十分 (-10 分)',
    penalty_en: '1st offense: Official Warning; Subsequent offenses: -10 points penalty per occurrence',
    severity: 'penalty'
  },
  {
    id: 'PEN_03',
    violation_zh: '空上、空碰、空槓（報牌後無法亮出或收回）',
    violation_en: 'Calling Chow, Pong, or Kong then failing/refusing to expose',
    penalty_zh: '同階段賽事內第一次警告；其後每次違規罰減十分 (-10 分)',
    penalty_en: '1st offense: Official Warning; Subsequent offenses: -10 points penalty per occurrence',
    severity: 'penalty'
  },
  {
    id: 'PEN_04',
    violation_zh: '出牌者於出牌時不報上牌名或報錯牌名',
    violation_en: 'Failing to announce tile name or miscalling the discarded tile',
    penalty_zh: '同階段賽事內第一次警告；其後每次違規罰減十分 (-10 分)',
    penalty_en: '1st offense: Official Warning; Subsequent offenses: -10 points penalty per occurrence',
    severity: 'penalty'
  },
  {
    id: 'PEN_05',
    violation_zh: '上家未出牌便提前摸牌',
    violation_en: 'Drawing a tile from the wall before the upper seat has discarded',
    penalty_zh: '同階段賽事內第一次警告；其後每次違規罰減十分 (-10 分)',
    penalty_en: '1st offense: Official Warning; Subsequent offenses: -10 points penalty per occurrence',
    severity: 'penalty'
  },
  {
    id: 'PEN_06',
    violation_zh: '牌張數目多於或少於規定張數（大相公 / 小相公）',
    violation_en: 'Holding incorrect tile count (Too many / too few tiles: Xiang Gong)',
    penalty_zh: '於該盤內即時喪失胡牌權利，只能作陪打',
    penalty_en: 'Hand declared dead for the round; player must play along without the right to win',
    severity: 'dead_hand'
  },
  {
    id: 'PEN_07',
    violation_zh: '除麻將所需用語外，以任何形式與同桌其他參加者溝通',
    violation_en: 'Non-mahjong communication with other players at the table',
    penalty_zh: '第一次警告；其後每次罰減十分 (-10 分)；情節嚴重者視為作弊取消資格',
    penalty_en: '1st offense: Warning; Subsequent offenses: -10 points penalty; Severe cases treated as cheating',
    severity: 'penalty'
  },
  {
    id: 'PEN_08',
    violation_zh: '詐胡（未滿1番起胡、誤認胡牌、牌型錯誤亮牌）',
    violation_en: 'False Win / Chombo (Insufficient Fan < 1, wrong tile, invalid shape declared)',
    penalty_zh: '詐胡者罰減一百五十分 (-150 分)，並於該盤內喪失胡牌權利（只作陪打）',
    penalty_en: 'Severe -150 points deduction penalty and forfeiture of winning rights for the round',
    severity: 'dq'
  },
  {
    id: 'PEN_09',
    violation_zh: '故意將其他方的手牌暴露',
    violation_en: "Deliberately exposing another player's hand",
    penalty_zh: '第一次警告；其後每次罰減十分 (-10 分)；情節嚴重者視為作弊',
    penalty_en: '1st offense: Warning; Subsequent offenses: -10 points penalty; Severe cases treated as cheating',
    severity: 'penalty'
  },
  {
    id: 'PEN_10',
    violation_zh: '摸牌後停留思考超過二十秒仍未出牌',
    violation_en: 'Exceeding 20 seconds to discard after drawing a tile (Turn Stalling)',
    penalty_zh: '同階段賽事內第一次警告；其後每次違規罰減十分 (-10 分)',
    penalty_en: '1st offense: Warning; Subsequent offenses: -10 points penalty per occurrence',
    severity: 'penalty'
  }
];
