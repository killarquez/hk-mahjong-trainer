/**
 * Hong Kong Mahjong Efficiency Trainer (TVB 2026 Rules) - Main Application Script
 */

import { 
  fetchRandomHand, 
  evaluateHand, 
  parseHandNotation, 
  executeNextTurn, 
  calculateFanBreakdown, 
  fetchDrillPuzzle,
  fetchHandBreakdown
} from './api';
import { HandEvaluation, DiscardEvaluation, UserComparison } from './types';
import { sound } from './audio';
import { FAN_CONVERSION_TABLE, OFFICIAL_FAN_RULES, PENALTY_RULES } from './rules_data';
import { BotGameManager } from './bot_game';
import './styles.css';

const getLanguage = () => 'zh';

// 34 Canonical Tiles list for visual builder
const ALL_34_TILES = [
  '1m','2m','3m','4m','5m','6m','7m','8m','9m',
  '1p','2p','3p','4p','5p','6p','7p','8p','9p',
  '1s','2s','3s','4s','5s','6s','7s','8s','9s',
  '1z','2z','3z','4z','5z','6z','7z'
];

const SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'q', 'w'];

// Curated Benchmark Tactical Puzzles Suite
const TACTICAL_PUZZLES = [
  {
    id: "p01_ryanmen_5_sided",
    category: "waits",
    category_name_zh: "多面聽牌效",
    difficulty: "Intermediate",
    difficulty_stars: 3,
    title: "5-Sided Ryanmen Wait Extension (五面聽牌效)",
    subtitle: "Unlocking multi-sequence flexibility in a continuous run",
    description: "You hold a 5-tile sequential block (23456m) combined with finished melds. Which discard maximizes your Tenpai winning waits to the highest possible outs?",
    notation: "23456m456p789s11z5z",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "Notice that 23456m contains two overlapping sequences (234m + 56m) or (23m + 456m). The isolated Dragon (5z) is completely disconnected.",
    detailed_explanation_zh: "打出孤張【紅中 (5z)】是最優解！打出後手牌進入聽牌/一向聽狀態，23456m 形成經典五面聽結構，可接受 1m, 4m, 7m 以及 3m, 6m 的多重進張，進張數高達 19-21 張！若錯打數牌將大幅破壞五面聽的連續延展性。",
    detailed_explanation_en: "Discarding isolated Red Dragon (5z) is mathematically optimal. The 23456m consecutive block provides massive multi-sided Ryanmen tile acceptance across 1m, 4m, 7m, 3m, and 6m.",
    proverb: "長條連續莫輕拆，五面聽張天下行"
  },
  {
    id: "p02_nobeta_4_sequence",
    category: "waits",
    category_name_zh: "多面聽牌效",
    difficulty: "Beginner",
    difficulty_stars: 2,
    title: "Nobeta 4-Tile Extension Shape (伸張四連形 2345m)",
    subtitle: "Recognizing 2-sided and pair formation flexibility",
    description: "Your hand has a 4-tile consecutive block (2345m). You also hold an isolated 9p terminal and completed melds. Which tile should you discard?",
    notation: "2345m678p456s78s9p2z",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "The 2345m block can either form a sequence (234m or 345m) and leave a pair/wait, or accept both 1m, 2m, 5m, 6m! The isolated 2z (South Wind) has no connections.",
    detailed_explanation_zh: "打出非門風孤張【南風 (2z)】或孤張【九筒 (9p)】。伸張四連形 (2345m) 具有雙向延伸性：摸入 1m 或 6m 可成兩副順子；摸入 2m 或 5m 可直接成為將牌（雀頭）。絕對不可拆除四連形！",
    detailed_explanation_en: "Discard isolated South Wind (2z). The 2345m 4-tile block (Nobeta) is extremely efficient: drawing 1m/6m creates finished sequences, while drawing 2m/5m creates a valuable pair head.",
    proverb: "四連伸張如生翼，孤風幺九早先投"
  },
  {
    id: "p03_aryamen_shape",
    category: "waits",
    category_name_zh: "多面聽牌效",
    difficulty: "Advanced",
    difficulty_stars: 4,
    title: "Aryamen Sub-Ryanmen Head Dilemma (亞兩面 2334p 形)",
    subtitle: "Choosing between pair locking and two-sided sequence expansion",
    description: "You hold 2334p alongside an isolated 1s and other pairs. How do you evaluate the 2334p shape?",
    notation: "2334p123m789m55s88s1s",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "2334p is an 'Aryamen' shape: it is both a sequence (234p) with a floating 3p, and a pair (33p) with a two-sided wait (24p). The isolated 1s has only 1-sided expansion.",
    detailed_explanation_zh: "打出孤張【一索 (1s)】為最優解！2334p 兼具順子與將牌雙重屬性：進 1p/4p 可成副，摸 2p/5p 亦可形成順子。保留亞兩面能保留最多向聽進張，孤張 1s 效率極低應果斷捨棄。",
    detailed_explanation_en: "Discard isolated 1s. The 2334p 'Aryamen' shape functions both as a finished Chow with a pair candidate (33p) or as a Ryanmen waiting on 1p/4p/2p/5p.",
    proverb: "亞兩面中藏好雀，孤單邊位早當除"
  },
  {
    id: "p04_chicken_hand_trap",
    category: "fan_pivot",
    category_name_zh: "1番起胡抉擇",
    difficulty: "Intermediate",
    difficulty_stars: 3,
    title: "Dragon Pair 0-Fan Chicken Hand Trap (0番雞胡陷阱)",
    subtitle: "Avoiding dead hands under TVB 2026 rules",
    description: "You have 4 sequences and a pair of Red Dragons (55z). In Hong Kong Mahjong (TVB 2026), a hand of 4 Chows with an honor pair is 0 Fan (Chicken Hand / 雞胡) and CANNOT win! How do you pivot to 1 Fan?",
    notation: "123m456p789s23s55z4z",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "Ping Hu (平胡 - 1 Fan) requires all sequences AND a numbered tile pair (no honors). Alternatively, Pong Pong Hu or Red Dragon Pong would yield Fan. First discard the isolated 4z (North Wind) to aim for a numbered Ping Hu head or Dragon Pong.",
    detailed_explanation_zh: "在 2026 TVB 大賽章程中，【全順子 + 中發白/風牌眼】為 0 番雞胡（不能起胡！）。打出死風【北風 (4z)】保留手牌靈活性。下一步可將 55z 碰成【紅中刻 (1番)】，或摸入 1s/4s 將 23s 延伸成順子並尋求數牌作眼達成【平胡 (1番)】。",
    detailed_explanation_en: "In TVB 2026 rules, 4 Chows + Dragon Pair is 0-Fan Chicken Hand and dead/illegal. Discard isolated North Wind (4z) to preserve paths to Dragon Pong (1 Fan) or full numbered Ping Hu (1 Fan).",
    proverb: "雞胡無分難自救，平胡字眼不可留"
  },
  {
    id: "p05_half_flush_pivot",
    category: "fan_pivot",
    category_name_zh: "1番起胡抉擇",
    difficulty: "Advanced",
    difficulty_stars: 4,
    title: "Half-Flush vs Ping-Hu Pivot (混一色與平胡抉擇)",
    subtitle: "Sacrificing speed for high-value 3-Fan conversion",
    description: "You hold 9 Bamboo tiles, 2 Honor pairs (East/South), and an isolated 5 Character (5m). Should you hold 5m for a generic Ping Hu, or discard 5m to lock in a 3-Fan Half Flush (混一色)?",
    notation: "123s456s789s11z22z5m",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "Your hand already possesses 9 Bamboo tiles and 4 Honors. Discarding 5m leaves a 1-Shanten Half Flush worth 3+ Fan, which easily satisfies the 1-Fan minimum with huge tournament point value.",
    detailed_explanation_zh: "果斷打出【五萬 (5m)】！打出 5m 後手牌直接進入【混一色 (3番)】一向聽。在 TVB 全銃制大賽中，混一色 3 番的得分回報遠高於冒險組 1 番平胡，且手牌條子結構已完全成型。",
    detailed_explanation_en: "Discard 5m immediately! Discarding 5m puts the hand in 1-Shanten for a guaranteed 3-Fan Half Flush (混一色).",
    proverb: "混一色成氣候足，莫留雜色阻前程"
  },
  {
    id: "p06_pong_pong_hu_pivot",
    category: "fan_pivot",
    category_name_zh: "1番起胡抉擇",
    difficulty: "Intermediate",
    difficulty_stars: 3,
    title: "All Triplets Transformation (對對胡 3番轉型)",
    subtitle: "Evaluating pair density for a 3-Fan Pong Pong Hu",
    description: "You hold 4 pairs (22m, 55m, 88p, 66z) and an open run (123s). You just drew a 9s. How do you pivot towards Pong Pong Hu?",
    notation: "22m55m88p66z123s9s",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "Remember Seven Pairs is BANNED in TVB 2026. 4 pairs must be turned into Pongs for Pong Pong Hu (3 Fan). The isolated 9s has no pair and should be discarded.",
    detailed_explanation_zh: "打出孤張【九索 (9s)】！注意：TVB 2026 嚴格禁止【七對子 (嚦咕嚦咕)】！手牌擁有多個對子時，唯一正確途徑是碰牌組成【對對胡 (3番)】。保留對子，拋棄無關孤張 9s。",
    detailed_explanation_en: "Discard isolated 9s. In TVB 2026 rules, Seven Pairs is strictly BANNED. With 4 pairs, the only valid path is converting them into Pong Pong Hu (All Triplets, 3 Fan).",
    proverb: "七對莫貪非正規，碰碰胡開見三番"
  },
  {
    id: "p07_dead_wind_priority",
    category: "honors_defense",
    category_name_zh: "字牌與防守",
    difficulty: "Beginner",
    difficulty_stars: 1,
    title: "Dead Wind vs Terminal Discard Priority (死風與幺九優先級)",
    subtitle: "Standard opening discard sequence",
    description: "On early Turn 2, you are East Seat (1z) in East Round (1z). You hold an isolated North Wind (4z, a guest/dead wind) and an isolated 9 Dots (9p). Which tile should be discarded first?",
    notation: "1m2m3m4p5p6p7s8s9s2s3s5m4z9p",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "North Wind (4z) has 0 Fan value for East seat and can only connect to itself (3 remaining outs). 9p can connect to 7p, 8p, or 9p (11 potential outs).",
    detailed_explanation_zh: "優先打出【北風 (4z)】！作為東家，北風為【客風/死風】，無番數價值且只能靠摸自身成對（最多3張進張）。而 9p 可與 7p/8p 形成邊張或順子（理論進張可達 11+ 張）。第一巡應先出客風死字。",
    detailed_explanation_en: "Discard dead North Wind (4z) first. For East seat, North is a zero-fan guest wind that can only form a pair with itself (3 remaining copies). 9p can connect with 7p/8p into Chows.",
    proverb: "起手先捨無番字，數牌留待看連張"
  },
  {
    id: "p08_live_dragon_holding",
    category: "honors_defense",
    category_name_zh: "字牌與防守",
    difficulty: "Intermediate",
    difficulty_stars: 3,
    title: "Holding Live Dragon vs Isolated 1-Pin (生張中發白與孤張幺九)",
    subtitle: "Weighing 1-Fan dragon potential vs terminal sequence chance",
    description: "You hold an isolated Green Dragon (6z) which is unplayed (Live/生張) and an isolated 1 Dot (1p). Your hand needs a 1-Fan guarantee. Which tile is more valuable to discard?",
    notation: "234m567m345s789s1p6z",
    seat_wind: "2z",
    prevailing_wind: "2z",
    hint: "A triplet of Green Dragon gives an automatic 1 Fan. However, if your other 4 melds are numbered Chows, you already qualify for Ping Hu (1 Fan) once you form a numbered pair! Holding 1p allows a 123p Ping Hu Chow.",
    detailed_explanation_zh: "若手牌已成 4 副順子雛形（234m, 567m, 345s, 789s），達成【平胡 (1番)】只需數牌將牌（雀頭）。此時字牌【發財 (6z)】無法作平胡將，應打出 6z 留下 1p 尋求摸 2p/3p 組成平胡數牌順子或將！",
    detailed_explanation_en: "If your hand already possesses 4 completed sequences and seeks Ping Hu (1 Fan), honor tiles cannot serve as the head for Ping Hu. Discard Green Dragon (6z) and keep 1p.",
    proverb: "平胡全順無字位，字牌雖好亦須投"
  },
  {
    id: "p09_thirteen_orphans_branch",
    category: "limit_hands",
    category_name_zh: "十番例牌",
    difficulty: "Master",
    difficulty_stars: 5,
    title: "Thirteen Orphans Branching Threshold (十三幺起手門檻)",
    subtitle: "Calculating when to pursue the 10-Fan maximum limit hand",
    description: "On the initial deal, you receive 10 unique Terminals and Honors: 19m, 19p, 19s, 1234z, and a duplicate 1m, plus 2m, 3m, 5s. Is it statistically optimal to discard 5s and pursue Thirteen Orphans (十三幺 - 10 Fan)?",
    notation: "119m19p19s1234z2m3m5s",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "You have 10 unique 13-Orphans tiles + 1 pair (11m), putting your hand at 3-Shanten for Thirteen Orphans (10 Fan)! Discarding the isolated 5s maintains the highest expected point value.",
    detailed_explanation_zh: "打出【五索 (5s)】！手牌已有 10 種不同幺九字牌且自帶 1m 一對，十三幺向聽數僅為 3 向聽！在 TVB 大賽 10 番滿胡規則下，10 種起手的十三幺數學期望值遠高於強行拼湊普通牌型。打出 5s, 2m, 3m 堅定直奔十三幺！",
    detailed_explanation_en: "Discard isolated 5s! With 10 unique terminals/honors and a 1m pair, the hand is only 3-Shanten for Thirteen Orphans (10-Fan Limit Hand). In tournament play, the expected value of pursuing 13 Orphans with 10+ starting tiles significantly exceeds forcing a regular low-fan hand.",
    proverb: "十張幺九十三起，滿胡十番莫遲疑"
  },
  {
    id: "p10_all_honors_pivot",
    category: "limit_hands",
    category_name_zh: "十番例牌",
    difficulty: "Advanced",
    difficulty_stars: 4,
    title: "All Honors vs Half-Flush Boundary (字一色與混一色邊界)",
    subtitle: "Balancing a 10-Fan limit hand against a 3-Fan Half Flush",
    description: "You hold 10 Honor tiles (11z, 22z, 55z, 66z, 7z, 3z) and 4 Character tiles (123m, 9m). Should you discard 9m to maintain the option for 字一色 (All Honors - 10 Fan) while keeping 123m as Half-Flush fallback?",
    notation: "11z22z55z66z7z3z123m9m",
    seat_wind: "1z",
    prevailing_wind: "1z",
    hint: "Discarding 9m preserves 4 Honor pairs for All Honors (10 Fan) or Pong Pong Hu (3 Fan) / Half Flush (3 Fan).",
    detailed_explanation_zh: "打出孤張【九萬 (9m)】！手牌有 4 對字牌加 2 張孤字，保留字牌可同時兼顧【字一色 (10番)】、【混一色對對胡 (6番)】與【混一色 (3番)】。打出 9m 是兼顧牌效與番數彈性的完美一手。",
    detailed_explanation_en: "Discard isolated 9m. Keeping all honor pairs allows flexible advancement towards All Honors (10 Fan Limit Hand), Half-Flush Pong Pong Hu (6 Fan), or standard Half Flush (3 Fan).",
    proverb: "字多莫走尋常路，例牌十番待風雲"
  }
];

class MahjongApp {
  // Trainer State
  private currentHand: string[] = [];
  private currentEvaluation: HandEvaluation | null = null;
  private selectedDiscard: string | null = null;
  private seatWind: string = '1z';
  private prevailingWind: string = '1z';
  private continuousMode: boolean = true;
  private newlyDrawnTile: string | null = null;
  
  // Trainer Stats
  private totalMoves: number = 0;
  private correctMoves: number = 0;
  private currentStreak: number = 0;
  private totalOutsLost: number = 0;

  // Custom builder buffer
  private customBuilderTiles: string[] = [];

  // Tactical Puzzles State
  private puzzleMode: 'curated' | 'drill' = 'curated';
  private puzzles = TACTICAL_PUZZLES;
  private currentPuzzleIndex: number = 0;
  private solvedPuzzles: Set<string> = new Set();
  private activePuzzleCategory: string = 'all';
  private currentPuzzleEvaluation: HandEvaluation | null = null;
  private currentPuzzleHand: string[] = [];
  private currentDrillPuzzle: any = null;

  // Drill Mode Stats
  private drillStreak: number = 0;
  private drillCorrect: number = 0;
  private drillTotal: number = 0;
  private autoAdvanceOnWin: boolean = true;
  private autoAdvanceTimer: any = null;

  // Bot Game Manager
  public botGame: BotGameManager;

  constructor() {
    this.initDOM();
    this.bindEvents();
    this.initPuzzles();
    this.loadNewHand();
    this.initRulesCenter();
    this.initFanQuiz();
    this.initDefenseCenter();
    this.botGame = new BotGameManager();
  }

  private initDOM() {
    // Generate Palette for Custom Hand Builder
    const palette = document.getElementById('palette-tiles');
    if (palette) {
      palette.innerHTML = ALL_34_TILES.map(code => `
        <div class="palette-tile" data-tile="${code}" title="${code}">
          <img src="/static/tiles/${code}.png?v=4" alt="${code}" />
          <span style="font-size:0.7rem; color:#222; font-weight:700;">${code}</span>
        </div>
      `).join('');
    }
  }

  public switchTab(tabId: string) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));

    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (tabBtn) tabBtn.classList.add('active');

    const section = document.getElementById(tabId);
    if (section) section.classList.add('active');

    if (tabId === 'tab-bots') {
      const userRack = document.getElementById('bot-user-tiles-rack');
      if (userRack && userRack.children.length === 0) {
        this.botGame.startMatch();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.tab!;
        sound.playTileClick();
        this.switchTab(target);
      });
    });

    // Brand logo returns to Home
    document.getElementById('brand-home-link')?.addEventListener('click', () => {
      sound.playTileClick();
      this.switchTab('tab-home');
    });

    // Generic [data-navigate] elements
    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.navigate!;
        sound.playTileClick();
        this.switchTab(target);
      });
    });

    // Wind Selectors
    document.getElementById('select-seat-wind')?.addEventListener('change', (e) => {
      this.seatWind = (e.target as HTMLSelectElement).value;
      if (this.currentHand.length === 14) this.reEvaluateCurrentHand();
    });

    document.getElementById('select-prevailing-wind')?.addEventListener('change', (e) => {
      this.prevailingWind = (e.target as HTMLSelectElement).value;
      if (this.currentHand.length === 14) this.reEvaluateCurrentHand();
    });

    // Action Buttons
    document.getElementById('btn-deal-random')?.addEventListener('click', () => {
      sound.playTileClick();
      this.loadNewHand();
    });

    document.getElementById('btn-next-turn')?.addEventListener('click', () => {
      this.advanceNextTurn();
    });

    // Continuous Mode Toggle
    document.getElementById('toggle-continuous')?.addEventListener('change', (e) => {
      this.continuousMode = (e.target as HTMLInputElement).checked;
    });

    // Sound Toggle
    document.getElementById('btn-sound-toggle')?.addEventListener('click', (e) => {
      const isMuted = sound.toggleMute();
      (e.currentTarget as HTMLElement).innerHTML = isMuted ? '🔇 Audio Off' : '🔊 Audio On';
    });

    // Custom Hand String Load
    document.getElementById('btn-load-custom')?.addEventListener('click', () => {
      const input = (document.getElementById('input-custom-hand') as HTMLInputElement).value;
      this.loadStringIntoBuilder(input);
    });

    // Quick Preset Buttons in Builder
    document.querySelectorAll('#tab-builder .btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = (e.currentTarget as HTMLElement).dataset.preset!;
        sound.playTileClick();
        this.loadStringIntoBuilder(preset);
      });
    });

    // Custom Builder Palette Click
    document.getElementById('palette-tiles')?.addEventListener('click', (e) => {
      const tileEl = (e.target as HTMLElement).closest('.palette-tile') as HTMLElement;
      if (tileEl) {
        const code = tileEl.dataset.tile!;
        this.addTileToCustomBuilder(code);
      }
    });

    document.getElementById('btn-clear-builder')?.addEventListener('click', () => {
      sound.playTileClick();
      this.customBuilderTiles = [];
      this.renderCustomBuilderHand();
      const report = document.getElementById('builder-analysis-report');
      if (report) report.style.display = 'none';
    });

    // Analyze Hand in Workbench (Maintains user on the same tab!)
    document.getElementById('btn-apply-builder')?.addEventListener('click', () => {
      sound.playTileClick();
      this.analyzeCustomBuilderHand();
    });

    // Send Hand from Builder to Trainer
    document.getElementById('btn-builder-send-trainer')?.addEventListener('click', () => {
      if (this.customBuilderTiles.length === 14) {
        sound.playTileClick();
        this.currentHand = [...this.customBuilderTiles];
        this.seatWind = (document.getElementById('builder-select-seat') as HTMLSelectElement).value;
        this.prevailingWind = (document.getElementById('builder-select-round') as HTMLSelectElement).value;
        (document.getElementById('select-seat-wind') as HTMLSelectElement).value = this.seatWind;
        (document.getElementById('select-prevailing-wind') as HTMLSelectElement).value = this.prevailingWind;
        this.reEvaluateCurrentHand();
        this.switchTab('tab-trainer');
      }
    });

    // Builder Wind Changes
    document.getElementById('builder-select-seat')?.addEventListener('change', () => {
      if (this.customBuilderTiles.length === 14) this.analyzeCustomBuilderHand();
    });
    document.getElementById('builder-select-round')?.addEventListener('change', () => {
      if (this.customBuilderTiles.length === 14) this.analyzeCustomBuilderHand();
    });

    // Fan Counter Button
    document.getElementById('btn-calculate-fan')?.addEventListener('click', () => {
      this.calculateCurrentFan();
    });

    // Tactical Puzzles Mode Switcher
    document.getElementById('btn-mode-curated')?.addEventListener('click', () => {
      this.setPuzzleMode('curated');
    });

    document.getElementById('btn-mode-drill')?.addEventListener('click', () => {
      this.setPuzzleMode('drill');
    });

    // Auto Advance Checkbox
    document.getElementById('check-auto-advance')?.addEventListener('change', (e) => {
      this.autoAdvanceOnWin = (e.target as HTMLInputElement).checked;
    });

    // Tactical Puzzles Controls
    document.getElementById('btn-prev-puzzle')?.addEventListener('click', () => {
      this.prevPuzzle();
    });
    document.getElementById('btn-next-puzzle')?.addEventListener('click', () => {
      this.nextPuzzle();
    });
    document.getElementById('btn-next-puzzle-bottom')?.addEventListener('click', () => {
      this.nextPuzzle();
    });

    document.getElementById('btn-toggle-hint')?.addEventListener('click', () => {
      const hintBox = document.getElementById('puzzle-hint-box');
      if (hintBox) {
        const isHidden = (hintBox.style.display === 'none' || !hintBox.style.display);
        hintBox.style.display = isHidden ? 'block' : 'none';
        const btn = document.getElementById('btn-toggle-hint');
        if (btn) btn.textContent = isHidden ? '💡 Hide Hint' : '💡 Show Hint';
      }
    });

    document.getElementById('btn-load-in-trainer')?.addEventListener('click', () => {
      const p = (this.puzzleMode === 'drill' && this.currentDrillPuzzle) ? this.currentDrillPuzzle : this.puzzles[this.currentPuzzleIndex];
      this.seatWind = p.seat_wind;
      this.prevailingWind = p.prevailing_wind;
      (document.getElementById('select-seat-wind') as HTMLSelectElement).value = p.seat_wind;
      (document.getElementById('select-prevailing-wind') as HTMLSelectElement).value = p.prevailing_wind;
      
      if (this.puzzleMode === 'drill' && this.currentDrillPuzzle) {
        this.currentHand = [...this.currentDrillPuzzle.tiles];
        this.reEvaluateCurrentHand();
      } else {
        this.loadCustomHandString(p.notation);
      }
      this.switchTab('tab-trainer');
    });

    // Puzzle Category Filters / Drill Theme Selector
    document.querySelectorAll('#puzzle-category-filters .btn-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#puzzle-category-filters .btn-filter').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        this.activePuzzleCategory = (e.currentTarget as HTMLElement).dataset.category || 'all';
        
        if (this.puzzleMode === 'drill') {
          sound.playTileClick();
          this.loadNewDrillPuzzle(this.activePuzzleCategory);
        } else {
          this.renderPuzzleCatalog();
        }
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const trainerSection = document.getElementById('tab-trainer');
      if (trainerSection?.classList.contains('active')) {
        if (this.currentEvaluation?.is_winning_hand) return;
        const keyIndex = SHORTCUT_KEYS.indexOf(e.key.toLowerCase());
        if (keyIndex >= 0 && keyIndex < this.currentHand.length) {
          const tile = this.currentHand[keyIndex];
          this.handleUserDiscard(tile);
        }
      }
    });
  }

  // =========================================================================
  // TACTICAL PUZZLES & DRILL MANAGER
  // =========================================================================
  public setPuzzleMode(mode: 'curated' | 'drill') {
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
    this.puzzleMode = mode;
    sound.playTileClick();

    document.querySelectorAll('.btn-puzzle-mode').forEach(b => b.classList.remove('active'));
    if (mode === 'curated') {
      document.getElementById('btn-mode-curated')?.classList.add('active');
      document.getElementById('chip-curated-stats')!.style.display = 'inline-flex';
      document.getElementById('chip-drill-stats')!.style.display = 'none';
      document.getElementById('chip-drill-score')!.style.display = 'none';
      document.getElementById('label-auto-advance')!.style.display = 'none';
      document.getElementById('puzzle-catalog')!.style.display = 'grid';
      document.getElementById('puzzle-catalog-title')!.textContent = '📚 All Puzzles Curriculum (完整難題題庫)';
      this.loadPuzzleIntoArena(this.currentPuzzleIndex);
    } else {
      document.getElementById('btn-mode-drill')?.classList.add('active');
      document.getElementById('chip-curated-stats')!.style.display = 'none';
      document.getElementById('chip-drill-stats')!.style.display = 'inline-flex';
      document.getElementById('chip-drill-score')!.style.display = 'inline-flex';
      document.getElementById('label-auto-advance')!.style.display = 'inline-flex';
      document.getElementById('puzzle-catalog')!.style.display = 'none';
      document.getElementById('puzzle-catalog-title')!.textContent = '⚡ Select Drill Category Focus (選擇特訓主題):';
      this.loadNewDrillPuzzle(this.activePuzzleCategory);
    }
  }

  private async initPuzzles() {
    this.renderPuzzleCatalog();
    await this.loadPuzzleIntoArena(0);
  }

  private async loadPuzzleIntoArena(index: number) {
    if (index < 0 || index >= this.puzzles.length) return;
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);

    this.currentPuzzleIndex = index;
    const puzzle = this.puzzles[index];

    // Update Header Badges
    const badgeIndex = document.getElementById('puzzle-badge-index');
    if (badgeIndex) badgeIndex.textContent = `Lesson #${index + 1} of ${this.puzzles.length}`;

    const badgeCat = document.getElementById('puzzle-badge-category');
    if (badgeCat) badgeCat.textContent = puzzle.category_name_zh;

    const badgeDiff = document.getElementById('puzzle-badge-difficulty');
    if (badgeDiff) badgeDiff.textContent = `${'⭐'.repeat(puzzle.difficulty_stars)} ${puzzle.difficulty}`;

    const badgeWinds = document.getElementById('puzzle-badge-winds');
    if (badgeWinds) badgeWinds.textContent = `Round: ${puzzle.prevailing_wind} • Seat: ${puzzle.seat_wind}`;

    // Titles & Texts
    const titleEl = document.getElementById('puzzle-title');
    if (titleEl) titleEl.textContent = puzzle.title;

    const subtitleEl = document.getElementById('puzzle-subtitle');
    if (subtitleEl) subtitleEl.textContent = puzzle.subtitle;

    const descEl = document.getElementById('puzzle-description');
    if (descEl) descEl.textContent = puzzle.description;

    const proverbBox = document.getElementById('puzzle-proverb-box');
    if (proverbBox) proverbBox.textContent = `💡 牌訣：${puzzle.proverb}`;

    // Hint Box
    const hintBox = document.getElementById('puzzle-hint-box');
    if (hintBox) {
      hintBox.style.display = 'none';
      hintBox.innerHTML = `<strong>💡 Tactical Hint:</strong> ${puzzle.hint}`;
      const hintBtn = document.getElementById('btn-toggle-hint');
      if (hintBtn) hintBtn.textContent = '💡 Show Hint';
    }

    // Hide previous feedback
    const fb = document.getElementById('puzzle-feedback');
    if (fb) fb.style.display = 'none';

    // Parse Hand and Evaluate
    try {
      const parseRes = await parseHandNotation(puzzle.notation);
      this.currentPuzzleHand = parseRes.tiles;

      const evalRes = await evaluateHand(parseRes.tiles, undefined, puzzle.seat_wind, puzzle.prevailing_wind);
      this.currentPuzzleEvaluation = evalRes;

      this.renderPuzzleHand();
    } catch (err: any) {
      console.error(err);
    }

    this.renderPuzzleCatalog();
  }

  public async loadNewDrillPuzzle(category = 'waits') {
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);

    try {
      const res = await fetchDrillPuzzle(category, this.seatWind, this.prevailingWind);
      const drill = res.puzzle;
      this.currentDrillPuzzle = drill;
      this.currentPuzzleHand = drill.tiles;
      this.currentPuzzleEvaluation = drill.evaluation;

      // Update Header Badges
      const badgeIndex = document.getElementById('puzzle-badge-index');
      if (badgeIndex) badgeIndex.textContent = `⚡ Endless Drill #${this.drillTotal + 1}`;

      const badgeCat = document.getElementById('puzzle-badge-category');
      if (badgeCat) badgeCat.textContent = drill.category_name_zh;

      const badgeDiff = document.getElementById('puzzle-badge-difficulty');
      if (badgeDiff) badgeDiff.textContent = `🔥 Dynamic Drill`;

      const badgeWinds = document.getElementById('puzzle-badge-winds');
      if (badgeWinds) badgeWinds.textContent = `Round: ${drill.prevailing_wind} • Seat: ${drill.seat_wind}`;

      // Titles & Texts
      const titleEl = document.getElementById('puzzle-title');
      if (titleEl) titleEl.textContent = `⚡ ${drill.title}`;

      const subtitleEl = document.getElementById('puzzle-subtitle');
      if (subtitleEl) subtitleEl.textContent = drill.subtitle;

      const descEl = document.getElementById('puzzle-description');
      if (descEl) descEl.textContent = drill.description;

      const proverbBox = document.getElementById('puzzle-proverb-box');
      if (proverbBox) proverbBox.textContent = `💡 牌訣：${drill.proverb}`;

      // Hint Box
      const hintBox = document.getElementById('puzzle-hint-box');
      if (hintBox) {
        hintBox.style.display = 'none';
        hintBox.innerHTML = `<strong>💡 Tactical Hint:</strong> ${drill.hint}`;
        const hintBtn = document.getElementById('btn-toggle-hint');
        if (hintBtn) hintBtn.textContent = '💡 Show Hint';
      }

      // Hide previous feedback
      const fb = document.getElementById('puzzle-feedback');
      if (fb) fb.style.display = 'none';

      this.renderPuzzleHand();
    } catch (err: any) {
      console.error(err);
    }
  }

  private renderPuzzleHand() {
    const rack = document.getElementById('puzzle-tiles-rack');
    if (!rack) return;

    rack.innerHTML = this.currentPuzzleHand.map((code, idx) => `
      <div class="tile-card" data-tile="${code}" data-idx="${idx}" title="Click to discard this tile in puzzle">
        <span class="tile-shortcut">#${idx + 1}</span>
        <img src="/static/tiles/${code}.png?v=4" alt="${code}" class="tile-img" />
        <span class="tile-label-zh">${code}</span>
      </div>
    `).join('');

    rack.querySelectorAll('.tile-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const tile = (e.currentTarget as HTMLElement).dataset.tile!;
        this.handlePuzzleDiscard(tile);
      });
    });
  }

  private async handlePuzzleDiscard(tile: string) {
    if (!this.currentPuzzleEvaluation) return;
    if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);

    const isDrill = (this.puzzleMode === 'drill');
    const puzzle = isDrill ? this.currentDrillPuzzle : this.puzzles[this.currentPuzzleIndex];

    sound.playTileClick();

    try {
      const evalRes = await evaluateHand(this.currentPuzzleHand, tile, puzzle.seat_wind, puzzle.prevailing_wind);
      const comp = evalRes.comparison;
      if (!comp) return;

      const fb = document.getElementById('puzzle-feedback');
      if (!fb) return;

      fb.style.display = 'block';
      fb.className = `feedback-box ${comp.status}`;

      if (comp.is_correct) {
        sound.playSuccess();

        if (isDrill) {
          this.drillTotal++;
          this.drillCorrect++;
          this.drillStreak++;
          this.updateDrillStats();

          fb.innerHTML = `
            <div class="feedback-header">
              <div class="feedback-title" style="color:var(--accent-emerald);">
                ✨ 🎉 正確！ Correct Tactical Move! (Streak: ${this.drillStreak} 🔥)
              </div>
              <span class="badge" style="background:var(--accent-emerald); color:#111; font-weight:700;">Optimal Choice</span>
            </div>

            <div style="font-size:0.95rem; line-height:1.6; margin-bottom:12px;">
              <p><strong>🎯 戰術解析：</strong> ${puzzle.hint || 'Optimal tile acceptance maintained.'}</p>
            </div>

            <div class="outs-comparison-grid">
              <div class="outs-card" style="border-color:var(--accent-emerald);">
                <div class="outs-card-title">Optimal Discard: ${comp.user_discard}</div>
                <div class="outs-card-val" style="color:var(--accent-emerald);">
                  ${comp.user_outs} Outs (${comp.user_shanten === 0 ? 'Tenpai' : comp.user_shanten + '-Shanten'})
                </div>
                <div class="outs-chips">
                  ${comp.user_accepted_tiles.map(t => `
                    <span class="chip-tile">
                      <img src="/static/tiles/${t.tile}.png?v=4" style="width:16px; height:20px; object-fit:contain;" />
                      ${t.tile} <span class="count">(${t.count})</span>
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>

            <div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <span id="drill-countdown-text" style="font-size:0.88rem; color:var(--accent-gold); font-weight:600;">
                ${this.autoAdvanceOnWin ? '⏱️ Loading next drill variation...' : 'Click button to generate next drill ➔'}
              </span>
              <button class="btn btn-primary btn-drill-next-step">
                ⚡ Next ${puzzle.category_name_zh} Variation ➔
              </button>
            </div>
          `;

          fb.querySelector('.btn-drill-next-step')?.addEventListener('click', () => {
            sound.playTileClick();
            this.loadNewDrillPuzzle(this.activePuzzleCategory);
          });

          if (this.autoAdvanceOnWin) {
            this.autoAdvanceTimer = setTimeout(() => {
              this.loadNewDrillPuzzle(this.activePuzzleCategory);
            }, 1200);
          }

        } else {
          // Curated Mode Success
          this.solvedPuzzles.add(puzzle.id);
          this.updateCuratedStats();
          this.renderPuzzleCatalog();

          fb.innerHTML = `
            <div class="feedback-header">
              <div class="feedback-title" style="color:var(--accent-emerald);">
                ✨ 🎉 難題破解成功！ Puzzle Solved Correctly!
              </div>
              <span class="badge" style="background:var(--accent-emerald); color:#111; font-weight:700;">Optimal Choice</span>
            </div>

            <div style="font-size:0.95rem; line-height:1.6; margin-bottom:12px;">
              <p><strong>🎯 戰術解析：</strong> ${puzzle.detailed_explanation_zh}</p>
              <p style="color:var(--text-muted); font-size:0.85rem; margin-top:6px;">${puzzle.detailed_explanation_en}</p>
            </div>

            <div class="outs-comparison-grid">
              <div class="outs-card" style="border-color:var(--accent-emerald);">
                <div class="outs-card-title">Optimal Discard: ${comp.user_discard}</div>
                <div class="outs-card-val" style="color:var(--accent-emerald);">
                  ${comp.user_outs} Outs (${comp.user_shanten === 0 ? 'Tenpai' : comp.user_shanten + '-Shanten'})
                </div>
                <div class="outs-chips">
                  ${comp.user_accepted_tiles.map(t => `
                    <span class="chip-tile">
                      <img src="/static/tiles/${t.tile}.png?v=4" style="width:16px; height:20px; object-fit:contain;" />
                      ${t.tile} <span class="count">(${t.count})</span>
                    </span>
                  `).join('')}
                </div>
              </div>
            </div>

            <div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <button class="btn btn-secondary btn-launch-drill-theme">
                ⚡ Practice More of this Theme (${puzzle.category_name_zh})
              </button>
              <button class="btn btn-primary btn-puzzle-next-step">
                Proceed to Next Lesson ➔
              </button>
            </div>
          `;

          fb.querySelector('.btn-puzzle-next-step')?.addEventListener('click', () => {
            this.nextPuzzle();
          });

          fb.querySelector('.btn-launch-drill-theme')?.addEventListener('click', () => {
            this.activePuzzleCategory = puzzle.category;
            document.querySelectorAll('#puzzle-category-filters .btn-filter').forEach(b => {
              if ((b as HTMLElement).dataset.category === puzzle.category) b.classList.add('active');
              else b.classList.remove('active');
            });
            this.setPuzzleMode('drill');
          });
        }
      } else {
        sound.playWarning();

        if (isDrill) {
          this.drillTotal++;
          this.drillStreak = 0;
          this.updateDrillStats();
        }

        fb.innerHTML = `
          <div class="feedback-header">
            <div class="feedback-title" style="color:var(--accent-coral);">
              ⚠️ 非最優打法 Suboptimal Move
            </div>
            <span class="badge" style="background:var(--accent-coral); color:#fff;">Loss of ${comp.outs_delta} Outs</span>
          </div>

          <div style="font-size:0.92rem; line-height:1.6; margin-bottom:12px;">
            <p>${comp.delta_reasoning_zh.replace(/\n/g, '<br/>')}</p>
            <p style="color:var(--text-muted); font-size:0.82rem; margin-top:6px;">${comp.delta_reasoning_en}</p>
          </div>

          <div class="outs-comparison-grid">
            <div class="outs-card">
              <div class="outs-card-title">Your Discard: ${comp.user_discard}</div>
              <div class="outs-card-val" style="color:var(--accent-coral);">${comp.user_outs} Outs</div>
            </div>
            <div class="outs-card">
              <div class="outs-card-title">Optimal Discard: ${comp.optimal_discard}</div>
              <div class="outs-card-val" style="color:var(--accent-emerald);">${comp.best_outs} Outs</div>
            </div>
          </div>

          <div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <span style="font-size:0.85rem; color:var(--text-muted);">💡 Click another tile in the rack above to retry!</span>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-show-solution">
                📖 Reveal Explanation
              </button>
              ${isDrill ? `
                <button class="btn btn-primary btn-drill-next-step">
                  ⚡ Try Next Scenario ➔
                </button>
              ` : ''}
            </div>
          </div>
        `;

        fb.querySelector('.btn-show-solution')?.addEventListener('click', () => {
          fb.innerHTML += `
            <div style="margin-top:14px; padding:12px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid var(--accent-gold);">
              <div style="color:var(--accent-gold); font-weight:700; margin-bottom:4px;">📖 Tactical Explanation:</div>
              <div style="font-size:0.88rem; line-height:1.5;">${puzzle.detailed_explanation_zh || puzzle.hint}</div>
            </div>
          `;
        });

        fb.querySelector('.btn-drill-next-step')?.addEventListener('click', () => {
          sound.playTileClick();
          this.loadNewDrillPuzzle(this.activePuzzleCategory);
        });
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  private prevPuzzle() {
    if (this.puzzleMode === 'drill') {
      this.loadNewDrillPuzzle(this.activePuzzleCategory);
    } else if (this.currentPuzzleIndex > 0) {
      sound.playTileClick();
      this.loadPuzzleIntoArena(this.currentPuzzleIndex - 1);
    }
  }

  private nextPuzzle() {
    if (this.puzzleMode === 'drill') {
      sound.playTileClick();
      this.loadNewDrillPuzzle(this.activePuzzleCategory);
    } else if (this.currentPuzzleIndex < this.puzzles.length - 1) {
      sound.playTileClick();
      this.loadPuzzleIntoArena(this.currentPuzzleIndex + 1);
    } else {
      alert("🎉 Congratulations! You have completed all 10 curated lessons! Try 'Endless Themed Drill' mode for infinite variations!");
    }
  }

  private updateCuratedStats() {
    const solvedCount = this.solvedPuzzles.size;
    const statEl = document.getElementById('stat-puzzles-solved');
    if (statEl) statEl.textContent = `${solvedCount}/${this.puzzles.length} ⭐`;
  }

  private updateDrillStats() {
    const streakEl = document.getElementById('stat-drill-streak');
    if (streakEl) streakEl.textContent = `${this.drillStreak} 🔥`;

    const scoreEl = document.getElementById('stat-drill-score');
    if (scoreEl) {
      const pct = this.drillTotal > 0 ? Math.round((this.drillCorrect / this.drillTotal) * 100) : 0;
      scoreEl.textContent = `${this.drillCorrect}/${this.drillTotal} (${pct}%)`;
    }
  }

  private renderPuzzleCatalog() {
    const catalog = document.getElementById('puzzle-catalog');
    if (!catalog) return;

    const filtered = this.puzzles.filter(p => {
      if (this.activePuzzleCategory === 'all') return true;
      return p.category === this.activePuzzleCategory;
    });

    catalog.innerHTML = filtered.map((p) => {
      const realIndex = this.puzzles.findIndex(item => item.id === p.id);
      const isSolved = this.solvedPuzzles.has(p.id);
      const isActive = (realIndex === this.currentPuzzleIndex);

      return `
        <div class="puzzle-card ${isActive ? 'active-in-arena' : ''} ${isSolved ? 'solved-check' : ''}" data-puzzle-idx="${realIndex}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span class="badge" style="font-size:0.7rem;">#${realIndex + 1} • ${p.category_name_zh}</span>
            <span style="font-size:0.75rem; color:var(--accent-gold);">${'⭐'.repeat(p.difficulty_stars)}</span>
          </div>
          <div class="puzzle-title">${p.title}</div>
          <div class="puzzle-desc">${p.subtitle}</div>
          <div style="font-family:monospace; font-size:0.8rem; color:var(--accent-cyan); margin-bottom:8px;">${p.notation}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; color:var(--text-muted);">
            <span>${p.difficulty}</span>
            <span style="color:var(--accent-gold); font-weight:600;">Load in Arena ➔</span>
          </div>
        </div>
      `;
    }).join('');

    catalog.querySelectorAll('.puzzle-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.puzzleIdx!, 10);
        sound.playTileClick();
        this.setPuzzleMode('curated');
        this.loadPuzzleIntoArena(idx);
        document.getElementById('puzzle-arena')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // =========================================================================
  // DISCARD TRAINER FUNCTIONS
  // =========================================================================
  public async loadNewHand() {
    try {
      const data = await fetchRandomHand(this.seatWind, this.prevailingWind);
      this.currentHand = data.tiles;
      this.currentEvaluation = data.evaluation;
      this.selectedDiscard = null;
      this.newlyDrawnTile = null;
      this.renderHand();
      
      if (data.evaluation.is_winning_hand) {
        this.showVictory(data.evaluation);
      } else {
        this.renderEvaluationTable(data.evaluation);
        this.hideFeedback();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error loading hand.');
    }
  }

  public async loadCustomHandString(str: string) {
    try {
      const data = await parseHandNotation(str);
      if (!data.success || data.tiles.length !== 14) {
        alert(data.errors.join('\n') || 'Invalid 14-tile notation.');
        return;
      }
      this.currentHand = data.tiles;
      this.newlyDrawnTile = null;
      this.reEvaluateCurrentHand();
    } catch (err: any) {
      alert(err.message);
    }
  }

  private async reEvaluateCurrentHand() {
    try {
      const evalData = await evaluateHand(this.currentHand, undefined, this.seatWind, this.prevailingWind);
      this.currentEvaluation = evalData;
      this.selectedDiscard = null;
      this.renderHand();

      if (evalData.is_winning_hand) {
        this.showVictory(evalData);
      } else {
        this.renderEvaluationTable(evalData);
        this.hideFeedback();
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  private renderHand() {
    const rack = document.getElementById('hand-tiles-rack');
    if (!rack) return;

    const isWinning = !!this.currentEvaluation?.is_winning_hand;

    const titleEl = document.querySelector('.hand-title');
    const tipEl = document.querySelector('.hand-tip');
    if (titleEl) {
      if (isWinning) {
        titleEl.innerHTML = `🏆 🎉 恭喜胡牌！ Winning Hand Completed (Agari)`;
      } else {
        titleEl.innerHTML = `🀄 Your 14-Tile Hand (Click any tile or press 1-9/0/-/=/q/w to discard):`;
      }
    }
    if (tipEl) {
      if (isWinning) {
        tipEl.innerHTML = `Round complete! You do not discard any more tiles. Click 'Start Next Hand' below to continue.`;
      } else {
        tipEl.innerHTML = `Optimal discard maximizes Ukeire Outs for lowest Shanten`;
      }
    }

    rack.innerHTML = this.currentHand.map((code, idx) => {
      const isNew = (code === this.newlyDrawnTile && idx === this.currentHand.length - 1);
      const shortcut = SHORTCUT_KEYS[idx] || '';
      return `
        <div class="tile-card ${isWinning ? 'winning-hand' : ''} ${isNew ? 'drawn-new' : ''}" data-tile="${code}" data-idx="${idx}" title="${isWinning ? 'Winning Hand - No Discard Needed' : `Click to Discard (Key: ${shortcut})`}">
          <span class="tile-shortcut">${isWinning ? '★' : shortcut}</span>
          <img src="/static/tiles/${code}.png?v=4" alt="${code}" class="tile-img" />
          <span class="tile-label-zh">${code}</span>
        </div>
      `;
    }).join('');

    if (!isWinning) {
      rack.querySelectorAll('.tile-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const tile = (e.currentTarget as HTMLElement).dataset.tile!;
          this.handleUserDiscard(tile);
        });
      });
    }
  }

  private async handleUserDiscard(tile: string) {
    if (this.currentEvaluation?.is_winning_hand) return;

    sound.playTileClick();
    this.selectedDiscard = tile;

    try {
      const evalResult = await evaluateHand(this.currentHand, tile, this.seatWind, this.prevailingWind);
      this.currentEvaluation = evalResult;
      
      const comp = evalResult.comparison;
      if (comp) {
        this.showFeedback(comp);
        this.updateStats(comp.is_correct, comp.outs_delta);
        if (comp.is_correct) {
          sound.playSuccess();
        } else {
          sound.playWarning();
        }
      }

      this.renderEvaluationTable(evalResult, tile);
    } catch (err: any) {
      alert(err.message);
    }
  }

  private showVictory(evalData: HandEvaluation) {
    const box = document.getElementById('feedback-box');
    if (!box) return;

    box.className = 'feedback-box victory';
    box.style.display = 'block';

    const isZh = getLanguage() === 'zh';
    const fanData = evalData.winning_fan;
    const handName = fanData?.hand_name || (isZh ? '胡牌' : 'Winning Hand');
    const totalFan = fanData?.total_fan || 1;
    const breakdown = fanData?.breakdown || [];

    box.innerHTML = `
      <div class="feedback-header" style="border-bottom:1px solid rgba(229,185,76,0.3); padding-bottom:12px; margin-bottom:14px;">
        <div class="victory-title">
          <span>🏆 🎉 ${isZh ? '自摸胡牌！' : 'Winning Hand Achieved!'}</span>
          <span class="victory-fan-badge">${totalFan} ${isZh ? '番' : 'Fan'}</span>
        </div>
        <button id="btn-victory-next-hand" class="btn btn-victory">
          🎲 ${isZh ? '再開一局 ➔' : 'Start Next Hand ➔'}
        </button>
      </div>

      <div style="font-size:1.05rem; margin-bottom:12px;">
        <strong>${isZh ? '胡牌牌型：' : 'Winning Pattern: '}</strong> <span style="color:var(--accent-gold); font-size:1.15rem; font-weight:700;">${handName}</span>
      </div>

      <div style="background:rgba(0,0,0,0.35); border-radius:8px; padding:12px 16px; border:1px solid rgba(255,255,255,0.1); margin-bottom:16px;">
        <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; font-weight:600;">${isZh ? '番數詳情 (Scoring Breakdown):' : 'Scoring Breakdown:'}</div>
        <ul style="list-style:none; padding-left:0;">
          ${breakdown.map(b => `
            <li style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
              <span><strong>${b.name}</strong> <span style="color:var(--text-muted);">(${b.jyutping})</span> - ${b.desc}</span>
              <span style="color:var(--accent-gold); font-weight:700;">+${b.fan} ${isZh ? '番' : 'Fan'}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div style="font-size:0.9rem; color:var(--accent-emerald);">
        ${isZh ? '✨ 牌局已完美結束！在真實比賽中達到胡牌條件即停止打牌。點擊上方按鈕開始新一輪牌效訓練！' : '✨ Hand completed successfully! Click above to start a new training hand.'}
      </div>
    `;

    document.getElementById('btn-victory-next-hand')?.addEventListener('click', () => {
      sound.playTileClick();
      this.loadNewHand();
    });

    this.renderEvaluationTable(evalData);
  }

  private showFeedback(comp: UserComparison) {
    const box = document.getElementById('feedback-box');
    if (!box) return;

    box.className = `feedback-box ${comp.status}`;
    box.style.display = 'block';

    const isZh = getLanguage() === 'zh';
    const title = isZh ? comp.title_zh : comp.title_en;
    const reasoning = isZh ? comp.delta_reasoning_zh : comp.delta_reasoning_en;
    const secondaryReasoning = isZh ? comp.delta_reasoning_en : comp.delta_reasoning_zh;

    box.innerHTML = `
      <div class="feedback-header">
        <div id="feedback-title" class="feedback-title">${comp.status === 'optimal' ? '✨' : '⚠️'} ${title}</div>
        <button id="btn-next-turn" class="btn btn-primary" style="display:${this.continuousMode ? 'inline-flex' : 'none'};">
          ${isZh ? '摸下一張牌 ➔' : 'Draw Next Tile ➔'}
        </button>
      </div>
      <div id="feedback-desc" class="feedback-body">
        <p>${reasoning.replace(/\n/g, '<br/>')}</p>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-top:6px;">${secondaryReasoning}</p>
      </div>

      <div class="outs-comparison-grid">
        <div id="user-outs-card" class="outs-card">
          <div class="outs-card-title">${isZh ? '你的捨牌' : 'Your Discard'}: ${comp.user_discard}</div>
          <div class="outs-card-val" style="color: ${comp.is_correct ? 'var(--accent-emerald)' : 'var(--accent-coral)'};">
            ${comp.user_outs} Outs (${comp.user_shanten === 0 ? (isZh ? '聽牌' : 'Tenpai') : (isZh ? comp.user_shanten + '向聽' : comp.user_shanten + '-Shanten')})
          </div>
          <div class="outs-chips">
            ${comp.user_accepted_tiles.map(t => `
              <span class="chip-tile">
                <img src="/static/tiles/${t.tile}.png?v=4" style="width:16px; height:20px; object-fit:contain;" />
                ${t.tile} <span class="count">(${t.count})</span>
              </span>
            `).join('')}
          </div>
        </div>

        <div id="optimal-outs-card" class="outs-card">
          <div class="outs-card-title">${isZh ? '最佳捨牌' : 'Optimal Discard'}: ${comp.optimal_discard}</div>
          <div class="outs-card-val" style="color: var(--accent-emerald);">
            ${comp.best_outs} Outs (${comp.best_shanten === 0 ? (isZh ? '聽牌' : 'Tenpai') : (isZh ? comp.best_shanten + '向聽' : comp.best_shanten + '-Shanten')})
          </div>
          <div class="outs-chips">
            ${comp.best_accepted_tiles.map(t => `
              <span class="chip-tile">
                <img src="/static/tiles/${t.tile}.png?v=4" style="width:16px; height:20px; object-fit:contain;" />
                ${t.tile} <span class="count">(${t.count})</span>
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-next-turn')?.addEventListener('click', () => {
      this.advanceNextTurn();
    });
  }

  private hideFeedback() {
    const box = document.getElementById('feedback-box');
    if (box) box.style.display = 'none';
  }

  private renderEvaluationTable(evalData: HandEvaluation, highlightedDiscard?: string) {
    const tbody = document.getElementById('discards-table-body');
    if (!tbody) return;

    const isZh = getLanguage() === 'zh';

    if (evalData.is_winning_hand) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px 16px; font-size:1.1rem; color:var(--accent-gold);">
            🏆 <strong>${isZh ? '恭喜胡牌！ (Round Complete)' : 'Congratulations! Winning Hand Achieved!'}</strong><br/>
            <span style="font-size:0.88rem; color:var(--text-muted);">${isZh ? '手牌已達胡牌條件，點擊上方按鈕開啟新練習。' : 'Hand meets winning conditions. Click above to deal a new hand.'}</span>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = evalData.discards.map((d, index) => {
      const isHighlighted = (d.tile === highlightedDiscard);
      const isOpt = d.is_optimal;
      const shantenClass = d.shanten <= 0 ? 'shanten-0' : (d.shanten === 1 ? 'shanten-1' : 'shanten-2');
      const shantenLabel = isZh ? 
        (d.shanten === 0 ? '🎯 聽牌 (Tenpai)' : `${d.shanten}向聽`) : 
        (d.shanten === 0 ? '🎯 Tenpai (0-Shanten)' : `${d.shanten}-Shanten`);
      const tileDisplayName = isZh ? `${d.chinese} (${d.tile})` : `${d.tile} (${d.chinese})`;
      
      return `
        <tr class="${isOpt ? 'row-optimal' : ''} ${isHighlighted ? 'row-user-selected' : ''}">
          <td>
            <span class="rank-badge ${index === 0 ? 'rank-1' : ''}">#${index + 1}</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="/static/tiles/${d.tile}.png" alt="${d.tile}" style="width:28px; height:36px; object-fit:contain;" />
              <div>
                <strong style="color:${isOpt ? 'var(--accent-emerald)' : '#fff'}">${tileDisplayName}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${d.jyutping}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="shanten-badge ${shantenClass}">
              ${shantenLabel}
            </span>
          </td>
          <td>
            <strong style="font-size:1.1rem; color:var(--accent-gold);">${d.total_outs}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);"> (${d.unique_acceptance_count} ${isZh ? '門' : 'tiles'})</span>
          </td>
          <td>
            <div class="outs-chips">
              ${d.accepted_tiles.map(t => `
                <span class="chip-tile">
                  <img src="/static/tiles/${t.tile}.png?v=4" style="width:14px; height:18px; object-fit:contain;" />
                  ${t.tile}<span class="count">(${t.count})</span>
                </span>
              `).join('')}
            </div>
          </td>
          <td>
            <div style="font-size:0.8rem; color:var(--accent-cyan);">
              ${d.viable_paths.slice(0, 2).map(p => p.name).join('<br/>')}
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-try-discard" data-tile="${d.tile}" style="padding:4px 10px; font-size:0.75rem;">
              Evaluate
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-try-discard').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tile = (e.currentTarget as HTMLElement).dataset.tile!;
        this.handleUserDiscard(tile);
      });
    });
  }

  public async advanceNextTurn() {
    if (!this.selectedDiscard) return;
    try {
      const data = await executeNextTurn(this.currentHand, this.selectedDiscard, this.seatWind, this.prevailingWind);
      this.currentHand = data.hand_tiles;
      this.newlyDrawnTile = data.drawn_tile;
      this.selectedDiscard = null;
      this.currentEvaluation = data.evaluation;
      this.renderHand();

      if (data.evaluation.is_winning_hand) {
        this.showVictory(data.evaluation);
      } else {
        this.renderEvaluationTable(data.evaluation);
        this.hideFeedback();
        sound.playTileClick();
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  private updateStats(isCorrect: boolean, outsDelta: number) {
    this.totalMoves++;
    if (isCorrect) {
      this.correctMoves++;
      this.currentStreak++;
    } else {
      this.currentStreak = 0;
      this.totalOutsLost += Math.max(0, outsDelta);
    }

    const acc = Math.round((this.correctMoves / this.totalMoves) * 100);
    const accEl = document.getElementById('stat-accuracy');
    if (accEl) accEl.textContent = `${acc}%`;

    const streakEl = document.getElementById('stat-streak');
    if (streakEl) streakEl.textContent = `${this.currentStreak} 🔥`;

    const totalEl = document.getElementById('stat-total-moves');
    if (totalEl) totalEl.textContent = `${this.totalMoves}`;
  }

  private addTileToCustomBuilder(code: string) {
    const count = this.customBuilderTiles.filter(t => t === code).length;
    if (count >= 4) {
      alert(`Cannot add more than 4 copies of tile ${code} in a standard 136-tile deck.`);
      return;
    }
    if (this.customBuilderTiles.length >= 14) {
      alert("Hand already contains 14 tiles. Click 'Clear' or remove a tile to adjust.");
      return;
    }
    this.customBuilderTiles.push(code);
    sound.playTileClick();
    this.renderCustomBuilderHand();
  }

  private renderCustomBuilderHand() {
    const container = document.getElementById('builder-hand-tiles');
    if (!container) return;

    container.innerHTML = this.customBuilderTiles.map((code, idx) => `
      <div class="tile-card" data-idx="${idx}" title="Click to remove">
        <img src="/static/tiles/${code}.png?v=4" alt="${code}" class="tile-img" />
        <span class="tile-label-zh">${code}</span>
      </div>
    `).join('');

    container.querySelectorAll('.tile-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.idx!, 10);
        this.customBuilderTiles.splice(idx, 1);
        this.renderCustomBuilderHand();
      });
    });

    const countEl = document.getElementById('builder-count');
    if (countEl) countEl.textContent = `${this.customBuilderTiles.length}/14`;
  }

  public async loadStringIntoBuilder(str: string) {
    try {
      const data = await parseHandNotation(str);
      if (!data.success || data.tiles.length !== 14) {
        alert(data.errors.join('\n') || 'Invalid 14-tile notation.');
        return;
      }
      this.customBuilderTiles = [...data.tiles];
      const inputEl = document.getElementById('input-custom-hand') as HTMLInputElement;
      if (inputEl) inputEl.value = str;
      this.renderCustomBuilderHand();
      this.analyzeCustomBuilderHand();
    } catch (err: any) {
      alert(err.message);
    }
  }

  public async analyzeCustomBuilderHand() {
    if (this.customBuilderTiles.length !== 14) {
      alert(`A full hand analysis requires exactly 14 tiles (currently ${this.customBuilderTiles.length}). Add more tiles from the palette.`);
      return;
    }

    const seatWind = (document.getElementById('builder-select-seat') as HTMLSelectElement)?.value || '1z';
    const roundWind = (document.getElementById('builder-select-round') as HTMLSelectElement)?.value || '1z';

    try {
      const res = await fetchHandBreakdown(this.customBuilderTiles, seatWind, roundWind);
      
      const report = document.getElementById('builder-analysis-report');
      if (!report) return;
      report.style.display = 'block';

      // 1. Hand Diagnosis Card
      const diag = document.getElementById('builder-diagnosis-card');
      if (diag) {
        const shanten = res.current_shanten;
        const optDiscard = res.optimal_discard;
        const isWinning = res.is_winning_hand;

        diag.innerHTML = `
          <div class="feedback-header">
            <div class="feedback-title" style="color:var(--accent-gold); font-size:1.15rem;">
              ${isWinning ? '🏆 Hand is Already a Valid Winning Hand (胡牌狀態)!' : `📊 Current State: ${res.fan_assessment.shanten_label}`}
            </div>
            <span class="badge" style="background:var(--accent-gold); color:#111; font-weight:800;">
              Optimal Discard: ${optDiscard}
            </span>
          </div>

          <div style="font-size:0.92rem; line-height:1.6; margin-top:8px;">
            <p>
              ${isWinning 
                ? `<strong>胡牌牌型：</strong> ${res.winning_fan?.hand_name} (${res.winning_fan?.total_fan} 番 / Fan)` 
                : `<strong>最優打法：</strong> 打出【${res.tactical_lines[0]?.discard_chinese} (${optDiscard})】進張面最高（${res.tactical_lines[0]?.total_outs} 張有效進張）。`}
            </p>
          </div>
        `;
      }

      // 2. Structural Blocks Breakdown
      const blocksContainer = document.getElementById('builder-blocks-list');
      if (blocksContainer) {
        const blocks = res.blocks_data.blocks;
        if (blocks.length === 0) {
          blocksContainer.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No standard sequential runs or triplets detected yet (Scattered Disconnects).</div>`;
        } else {
          blocksContainer.innerHTML = blocks.map((b: any) => `
            <div class="block-chip-row">
              <div>
                <strong style="color:var(--accent-gold);">${b.name_zh}</strong>
                <span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">(${b.name_en})</span>
              </div>
              <div style="font-size:0.82rem; color:#d1d5db; max-width:60%;">
                💡 ${b.theory}
              </div>
            </div>
          `).join('');
        }
      }

      // 3. Ranked Tactical Lines of Play
      const linesContainer = document.getElementById('builder-tactical-lines-container');
      if (linesContainer) {
        linesContainer.innerHTML = res.tactical_lines.slice(0, 4).map((line: any) => `
          <div class="tactical-line-card ${line.is_optimal ? 'line-optimal' : ''}">
            <div class="tactical-line-header">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="rank-badge ${line.rank === 1 ? 'rank-1' : ''}">Line #${line.rank}</span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <img src="/static/tiles/${line.discard_tile}.png" style="width:28px; height:36px; object-fit:contain;" />
                  <div>
                    <strong>Discard ${line.discard_chinese} (${line.discard_tile})</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${line.discard_jyutping}</div>
                  </div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge" style="background:rgba(255,255,255,0.08); font-size:0.75rem;">${line.category}</span>
                <span class="shanten-badge ${line.shanten <= 0 ? 'shanten-0' : (line.shanten === 1 ? 'shanten-1' : 'shanten-2')}">
                  ${line.shanten_label}
                </span>
                <strong style="color:var(--accent-gold); font-size:1.05rem;">${line.total_outs} Outs</strong>
              </div>
            </div>

            <div style="font-size:0.9rem; line-height:1.5; margin-bottom:10px; color:#e5e7eb;">
              <strong>🎯 Tactical Path:</strong> ${line.action_plan_zh}
              <div style="font-size:0.82rem; color:var(--text-muted); margin-top:4px;">${line.action_plan_en}</div>
            </div>

            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:4px; text-transform:uppercase; font-weight:600;">Accepted Tiles (進張牌):</div>
            <div class="outs-chips">
              ${line.accepted_tiles.map((t: any) => `
                <span class="chip-tile">
                  <img src="/static/tiles/${t.tile}.png?v=4" style="width:14px; height:18px; object-fit:contain;" />
                  ${t.tile}<span class="count">(${t.count})</span>
                </span>
              `).join('')}
            </div>
          </div>
        `).join('');
      }

      // 4. Full Discard Efficiency Table
      const tbody = document.getElementById('builder-discards-table-body');
      if (tbody) {
        tbody.innerHTML = res.full_discards.map((d: any, idx: number) => `
          <tr class="${d.is_optimal ? 'row-optimal' : ''}">
            <td><span class="rank-badge ${idx === 0 ? 'rank-1' : ''}">#${idx + 1}</span></td>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="/static/tiles/${d.tile}.png" style="width:24px; height:32px; object-fit:contain;" />
                <strong>${d.chinese} (${d.tile})</strong>
              </div>
            </td>
            <td>
              <span class="shanten-badge ${d.shanten <= 0 ? 'shanten-0' : (d.shanten === 1 ? 'shanten-1' : 'shanten-2')}">
                ${d.shanten === 0 ? '🎯 聽牌 (Tenpai)' : `${d.shanten}向聽`}
              </span>
            </td>
            <td><strong style="color:var(--accent-gold); font-size:1rem;">${d.total_outs}</strong></td>
            <td>
              <div class="outs-chips">
                ${d.accepted_tiles.map((t: any) => `
                  <span class="chip-tile" style="font-size:0.72rem; padding:2px 4px;">
                    ${t.tile} (${t.count})
                  </span>
                `).join('')}
              </div>
            </td>
            <td>
              <div style="font-size:0.78rem; color:var(--accent-cyan);">
                ${d.viable_paths.slice(0, 2).map((p: any) => p.name).join(', ')}
              </div>
            </td>
          </tr>
        `).join('');
      }

      // Smooth scroll to report
      report.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err: any) {
      alert(err.message);
    }
  }

  // =========================================================================
  // Rules Center & Worksheet Simulator (TVB 2026 Official Rules & Appendices)
  // =========================================================================
  private currentRulesLang: 'zh' | 'en' = 'zh';
  private signatureCanvases: { [id: string]: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; drawing: boolean } } = {};

  public initRulesCenter() {
    // Language toggle buttons
    const langBtns = document.querySelectorAll('.rules-lang-switch .btn-lang');
    langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const lang = target.getAttribute('data-lang') as 'zh' | 'en';
        if (lang) {
          this.setRulesLanguage(lang);
        }
      });
    });

    // Rules Sub-Navigation Tabs
    const subnavBtns = document.querySelectorAll('.rules-nav-btn');
    subnavBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const paneId = target.getAttribute('data-pane');
        if (!paneId) return;

        subnavBtns.forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        document.querySelectorAll('.rules-section-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(paneId);
        if (pane) pane.classList.add('active');
        sound.playTileClick();
      });
    });

    // Populate Tables
    this.renderPenaltyTable();
    this.renderFanConversionTable();
    this.renderApprovedWinningHandsTable();

    // Populate Worksheet
    this.initWorksheetSimulator();
  }

  public setRulesLanguage(lang: 'zh' | 'en') {
    this.currentRulesLang = lang;
    document.querySelectorAll('.rules-lang-switch .btn-lang').forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Translate all .t-text elements
    document.querySelectorAll('.t-text').forEach(el => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) {
        el.textContent = text;
      }
    });

    // Rerender dynamic tables
    this.renderPenaltyTable();
    this.renderFanConversionTable();
    this.renderApprovedWinningHandsTable();
  }

  private renderPenaltyTable() {
    const tbody = document.getElementById('rules-penalty-table-body');
    if (!tbody) return;

    tbody.innerHTML = PENALTY_RULES.map(p => {
      const violation = this.currentRulesLang === 'zh' ? p.violation_zh : p.violation_en;
      const penalty = this.currentRulesLang === 'zh' ? p.penalty_zh : p.penalty_en;
      
      let badgeHtml = '';
      if (p.severity === 'dq') {
        badgeHtml = `<span class="badge-penalty-dq">${this.currentRulesLang === 'zh' ? '取消資格' : 'Disqualify'}</span>`;
      } else if (p.severity === 'dead_hand') {
        badgeHtml = `<span class="badge-penalty-dead">${this.currentRulesLang === 'zh' ? '當盤陪打' : 'Dead Hand'}</span>`;
      } else {
        badgeHtml = `<span class="badge-penalty-pts">${this.currentRulesLang === 'zh' ? '罰減十分' : '-10 Pts'}</span>`;
      }

      return `
        <tr>
          <td><strong style="color:var(--c-blue-diamond); font-family:var(--font-mono);">${p.id}</strong></td>
          <td style="font-weight:600; color:#fff;">${violation}</td>
          <td style="color:#e5e7eb; font-size:0.85rem;">${penalty}</td>
          <td style="text-align:center;">${badgeHtml}</td>
        </tr>
      `;
    }).join('');
  }

  private renderFanConversionTable() {
    const tbody = document.getElementById('rules-conversion-table-body');
    if (!tbody) return;

    tbody.innerHTML = FAN_CONVERSION_TABLE.map(row => `
      <tr>
        <td style="text-align:center; font-weight:800; color:#fff; font-size:0.95rem;">
          ${row.fan} ${this.currentRulesLang === 'zh' ? '番' : 'Fan'}
        </td>
        <td style="text-align:center; font-weight:700; color:var(--accent-emerald);">+${row.normal_winner}</td>
        <td style="text-align:center; font-weight:700; color:#f87171;">${row.normal_shooter}</td>
        <td style="text-align:center; font-weight:700; color:var(--accent-emerald);">+${row.self_draw_winner}</td>
        <td style="text-align:center; font-weight:700; color:#f87171;">${row.self_draw_opponent}</td>
      </tr>
    `).join('');
  }

  private renderApprovedWinningHandsTable() {
    const tbody = document.getElementById('rules-fan-rules-table-body');
    if (!tbody) return;

    tbody.innerHTML = OFFICIAL_FAN_RULES.map(r => {
      const name = this.currentRulesLang === 'zh' ? r.name_zh : r.name_en;
      const def = this.currentRulesLang === 'zh' ? r.definition_zh : r.definition_en;

      let examplesHtml = '';
      if (r.example_tiles && r.example_tiles.length > 0) {
        examplesHtml = `
          <div style="display:flex; flex-wrap:wrap; gap:2px; margin-top:4px;">
            ${r.example_tiles.map(t => `
              <img src="/tiles/${t}.png?v=4" alt="${t}" style="width:20px; height:28px; object-fit:contain; background:#fff; border-radius:2px; border:1px solid #d1d5db;" />
            `).join('')}
          </div>
        `;
      }

      return `
        <tr>
          <td><strong style="color:var(--c-blue-diamond); font-family:var(--font-mono);">${r.code}</strong></td>
          <td>
            <strong style="color:#ffffff; font-size:0.92rem;">${name}</strong>
            <div style="font-size:0.75rem; color:var(--c-cosmic-quest); font-family:var(--font-mono);">${r.jyutping}</div>
          </td>
          <td style="text-align:center;">
            <span class="badge" style="background:rgba(7,108,192,0.25); color:#60a5fa; font-weight:800; font-size:0.85rem;">
              ${r.fan} ${this.currentRulesLang === 'zh' ? '番' : 'Fan'}
            </span>
          </td>
          <td style="font-size:0.85rem; color:#e5e7eb; line-height:1.5;">${def}</td>
          <td>${examplesHtml}</td>
        </tr>
      `;
    }).join('');
  }

  private initWorksheetSimulator() {
    const tbody = document.getElementById('worksheet-hands-body');
    if (!tbody) return;

    const roundNames = [
      '東風圈 - 1 (E-1)', '東風圈 - 2 (E-2)', '東風圈 - 3 (E-3)', '東風圈 - 4 (E-4)',
      '南風圈 - 1 (S-1)', '南風圈 - 2 (S-2)', '南風圈 - 3 (S-3)', '南風圈 - 4 (S-4)',
      '西風圈 - 1 (W-1)', '西風圈 - 2 (W-2)', '西風圈 - 3 (W-3)', '西風圈 - 4 (W-4)',
      '北風圈 - 1 (N-1)', '北風圈 - 2 (N-2)', '北風圈 - 3 (N-3)', '北風圈 - 4 (N-4)'
    ];

    let rowsHtml = '';
    for (let i = 1; i <= 16; i++) {
      const dealerIndex = (i - 1) % 4; // 0=East, 1=South, 2=West, 3=North
      const dealerName = ['東莊 (East)', '南莊 (South)', '西莊 (West)', '北莊 (North)'][dealerIndex];

      rowsHtml += `
        <tr data-hand-index="${i}">
          <td><strong>#${i}</strong></td>
          <td style="font-size:0.75rem;">${roundNames[i - 1]}<br/><span style="color:#076cc0; font-weight:700;">${dealerName}</span></td>
          <td>
            <input type="text" class="ws-hand-type" placeholder="e.g. 平胡+自摸 / 混一色" style="font-size:0.75rem;" />
          </td>
          <td>
            <select class="ws-hand-fan" style="font-size:0.75rem; padding:2px;">
              <option value="0">-</option>
              <option value="1">1 番</option>
              <option value="2">2 番</option>
              <option value="3">3 番</option>
              <option value="4">4 番</option>
              <option value="5">5 番</option>
              <option value="6">6 番</option>
              <option value="7">7 番</option>
              <option value="8">8 番</option>
              <option value="9">9 番</option>
              <option value="10">10 番</option>
            </select>
          </td>
          <td><input type="number" class="ws-p1-delta" value="0" style="font-weight:700;" /></td>
          <td><input type="number" class="ws-p2-delta" value="0" style="font-weight:700;" /></td>
          <td><input type="number" class="ws-p3-delta" value="0" style="font-weight:700;" /></td>
          <td><input type="number" class="ws-p4-delta" value="0" style="font-weight:700;" /></td>
        </tr>
      `;
    }
    tbody.innerHTML = rowsHtml;

    // Attach change listeners for live score recalculation
    tbody.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('input', () => this.recalculateWorksheetTotals());
    });

    // Attach listeners for action buttons
    document.getElementById('btn-load-sample-match')?.addEventListener('click', () => this.loadSampleMatchData());
    document.getElementById('btn-reset-worksheet')?.addEventListener('click', () => this.resetWorksheetData());
    document.getElementById('btn-print-scorecard')?.addEventListener('click', () => {
      window.print();
    });

    // Initialize Signature Pads
    this.initSignaturePads();
  }

  private recalculateWorksheetTotals() {
    let sum1 = 0, sum2 = 0, sum3 = 0, sum4 = 0;

    document.querySelectorAll('#worksheet-hands-body tr').forEach(row => {
      const p1 = parseInt((row.querySelector('.ws-p1-delta') as HTMLInputElement)?.value || '0', 10);
      const p2 = parseInt((row.querySelector('.ws-p2-delta') as HTMLInputElement)?.value || '0', 10);
      const p3 = parseInt((row.querySelector('.ws-p3-delta') as HTMLInputElement)?.value || '0', 10);
      const p4 = parseInt((row.querySelector('.ws-p4-delta') as HTMLInputElement)?.value || '0', 10);

      sum1 += isNaN(p1) ? 0 : p1;
      sum2 += isNaN(p2) ? 0 : p2;
      sum3 += isNaN(p3) ? 0 : p3;
      sum4 += isNaN(p4) ? 0 : p4;
    });

    const setVal = (id: string, val: number) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = (val > 0 ? `+${val}` : `${val}`);
        el.style.color = val > 0 ? 'var(--c-blue-diamond)' : (val < 0 ? '#ef4444' : '#374151');
      }
    };

    setVal('ws-sum-p1', sum1);
    setVal('ws-sum-p2', sum2);
    setVal('ws-sum-p3', sum3);
    setVal('ws-sum-p4', sum4);

    setVal('ws-p1-final', sum1);
    setVal('ws-p2-final', sum2);
    setVal('ws-p3-final', sum3);
    setVal('ws-p4-final', sum4);
  }

  public loadSampleMatchData() {
    const sampleHands = [
      { hand: 1, type: '平胡+自摸 (Ping Hu Zi Mo)', fan: 2, p1: 30, p2: -10, p3: -10, p4: -10 },
      { hand: 2, type: '混一色 (Half Flush)', fan: 3, p1: -30, p2: 30, p3: 0, p4: 0 },
      { hand: 3, type: '紅中刻+自摸 (Red Dragon)', fan: 2, p1: -10, p2: -10, p3: 30, p4: -10 },
      { hand: 4, type: '對對胡 (All Pongs)', fan: 3, p1: 0, p2: 0, p3: -30, p4: 30 },
      { hand: 5, type: '平胡 (Ping Hu)', fan: 1, p1: 10, p2: -10, p3: 0, p4: 0 },
      { hand: 6, type: '清一色 (Full Flush)', fan: 7, p1: -70, p2: 70, p3: 0, p4: 0 },
      { hand: 7, type: '摸和 (Exhaust Draw)', fan: 0, p1: 0, p2: 0, p3: 0, p4: 0 },
      { hand: 8, type: '小三元+自摸 (Little Three Dragons)', fan: 5, p1: -25, p2: -25, p3: -25, p4: 75 },
      { hand: 9, type: '門風東刻 (Seat Wind East)', fan: 1, p1: 10, p2: 0, p3: -10, p4: 0 },
      { hand: 10, type: '自摸 (Self-Draw)', fan: 1, p1: -5, p2: 15, p3: -5, p4: -5 },
      { hand: 11, type: '混一色+發財刻 (Half Flush Green)', fan: 4, p1: 0, p2: -40, p3: 40, p4: 0 },
      { hand: 12, type: '平胡+自摸 (Ping Hu Zi Mo)', fan: 2, p1: -10, p2: -10, p3: -10, p4: 30 },
      { hand: 13, type: '對對胡+混一色 (All Pongs Half Flush)', fan: 6, p1: 60, p2: 0, p3: -60, p4: 0 },
      { hand: 14, type: '白板刻 (White Dragon)', fan: 1, p1: 0, p2: 10, p3: 0, p4: -10 },
      { hand: 15, type: '摸和 (Exhaust Draw)', fan: 0, p1: 0, p2: 0, p3: 0, p4: 0 },
      { hand: 16, type: '大三元 (Big Three Dragons 8番)', fan: 8, p1: -80, p2: 0, p3: 80, p4: 0 },
    ];

    const rows = document.querySelectorAll('#worksheet-hands-body tr');
    sampleHands.forEach((sh, idx) => {
      if (idx < rows.length) {
        const row = rows[idx];
        const typeInput = row.querySelector('.ws-hand-type') as HTMLInputElement;
        const fanSelect = row.querySelector('.ws-hand-fan') as HTMLSelectElement;
        const p1Input = row.querySelector('.ws-p1-delta') as HTMLInputElement;
        const p2Input = row.querySelector('.ws-p2-delta') as HTMLInputElement;
        const p3Input = row.querySelector('.ws-p3-delta') as HTMLInputElement;
        const p4Input = row.querySelector('.ws-p4-delta') as HTMLInputElement;

        if (typeInput) typeInput.value = sh.type;
        if (fanSelect) fanSelect.value = sh.fan.toString();
        if (p1Input) p1Input.value = sh.p1.toString();
        if (p2Input) p2Input.value = sh.p2.toString();
        if (p3Input) p3Input.value = sh.p3.toString();
        if (p4Input) p4Input.value = sh.p4.toString();
      }
    });

    this.recalculateWorksheetTotals();
    sound.playSuccess();
  }

  public resetWorksheetData() {
    if (!confirm('Are you sure you want to reset the entire tournament scorecard?')) return;

    document.querySelectorAll('#worksheet-hands-body tr').forEach(row => {
      const typeInput = row.querySelector('.ws-hand-type') as HTMLInputElement;
      const fanSelect = row.querySelector('.ws-hand-fan') as HTMLSelectElement;
      const p1Input = row.querySelector('.ws-p1-delta') as HTMLInputElement;
      const p2Input = row.querySelector('.ws-p2-delta') as HTMLInputElement;
      const p3Input = row.querySelector('.ws-p3-delta') as HTMLInputElement;
      const p4Input = row.querySelector('.ws-p4-delta') as HTMLInputElement;

      if (typeInput) typeInput.value = '';
      if (fanSelect) fanSelect.value = '0';
      if (p1Input) p1Input.value = '0';
      if (p2Input) p2Input.value = '0';
      if (p3Input) p3Input.value = '0';
      if (p4Input) p4Input.value = '0';
    });

    this.recalculateWorksheetTotals();
    this.clearAllSignatures();
  }

  private initSignaturePads() {
    const canvasIds = ['sign-canvas-p1', 'sign-canvas-p2', 'sign-canvas-p3', 'sign-canvas-p4', 'sign-canvas-ref'];

    canvasIds.forEach(id => {
      const canvas = document.getElementById(id) as HTMLCanvasElement;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      let isDrawing = false;

      const getPos = (e: MouseEvent | TouchEvent) => {
        const r = canvas.getBoundingClientRect();
        if ('touches' in e && e.touches.length > 0) {
          return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        }
        return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top };
      };

      const startDraw = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };

      const stopDraw = () => {
        isDrawing = false;
      };

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDraw);

      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', stopDraw);

      this.signatureCanvases[id] = { canvas, ctx, drawing: false };
    });

    // Clear signature buttons
    document.querySelectorAll('.btn-sign-clear').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const canvasId = target.getAttribute('data-canvas');
        if (canvasId && this.signatureCanvases[canvasId]) {
          const item = this.signatureCanvases[canvasId];
          item.ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
        }
      });
    });
  }

  private clearAllSignatures() {
    Object.values(this.signatureCanvases).forEach(item => {
      item.ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
    });
  }

  // =========================================================================
  // Fan Quiz Drill & Master Trainer (TVB 2026 Ruleset)
  // =========================================================================
  private currentQuizPuzzle: any = null;
  private selectedQuizFan: number | null = null;
  private selectedQuizPatterns: Set<string> = new Set();
  private quizDifficulty: string = 'all';
  private quizStreak: number = 0;
  private quizBestStreak: number = 0;
  private quizCorrectCount: number = 0;
  private quizTotalAnswered: number = 0;

  public initFanQuiz() {
    // Mode Switchers
    const btnModeQuiz = document.getElementById('btn-fan-mode-quiz');
    const btnModeCustom = document.getElementById('btn-fan-mode-custom');
    const paneQuiz = document.getElementById('fan-pane-quiz');
    const paneCustom = document.getElementById('fan-pane-custom');

    btnModeQuiz?.addEventListener('click', () => {
      btnModeQuiz.className = 'btn btn-primary';
      btnModeCustom!.className = 'btn btn-secondary';
      if (paneQuiz) paneQuiz.style.display = 'block';
      if (paneCustom) paneCustom.style.display = 'none';
      sound.playTileClick();
    });

    btnModeCustom?.addEventListener('click', () => {
      btnModeCustom.className = 'btn btn-primary';
      btnModeQuiz!.className = 'btn btn-secondary';
      if (paneQuiz) paneQuiz.style.display = 'none';
      if (paneCustom) paneCustom.style.display = 'block';
      sound.playTileClick();
    });

    // Difficulty Filter Pills
    document.querySelectorAll('.btn-fan-diff').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        document.querySelectorAll('.btn-fan-diff').forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        this.quizDifficulty = target.getAttribute('data-diff') || 'all';
        sound.playTileClick();
        this.loadNewFanQuizPuzzle();
      });
    });

    // Fan Number Selectors
    document.querySelectorAll('.btn-fan-num').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const fanVal = parseInt(target.getAttribute('data-fan') || '0', 10);
        this.selectQuizFanNumber(fanVal);
      });
    });

    // Submit Answer Button
    document.getElementById('btn-quiz-submit')?.addEventListener('click', () => {
      this.submitFanQuizAnswer();
    });

    // Next Hand Buttons
    document.getElementById('btn-quiz-next-puzzle')?.addEventListener('click', () => {
      sound.playTileClick();
      this.loadNewFanQuizPuzzle();
    });
    document.getElementById('btn-quiz-next-after-result')?.addEventListener('click', () => {
      sound.playTileClick();
      this.loadNewFanQuizPuzzle();
    });

    // Custom Calculator Presets
    document.querySelectorAll('.btn-custom-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = (e.currentTarget as HTMLElement).getAttribute('data-preset');
        const input = document.getElementById('input-fan-tiles') as HTMLInputElement;
        if (input && preset) {
          input.value = preset;
          sound.playTileClick();
          this.calculateCurrentFan();
        }
      });
    });

    // Custom Calculate Button
    document.getElementById('btn-calculate-fan')?.addEventListener('click', () => {
      this.calculateCurrentFan();
    });

    // Load initial quiz puzzle
    this.loadNewFanQuizPuzzle();
  }

  public async loadNewFanQuizPuzzle() {
    try {
      const res = await fetch(`/api/fan-quiz/puzzle?difficulty=${this.quizDifficulty}`);
      const puzzle = await res.json();
      this.currentQuizPuzzle = puzzle;
      this.selectedQuizFan = null;
      this.selectedQuizPatterns.clear();

      // Reset Fan Buttons
      document.querySelectorAll('.btn-fan-num').forEach(b => {
        const el = b as HTMLElement;
        el.classList.remove('active');
        el.style.background = 'rgba(255, 255, 255, 0.08)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        el.style.color = '#ffffff';
        el.style.boxShadow = 'none';
        el.style.transform = 'none';
        el.style.fontWeight = '700';
      });

      // Hide Feedback Card
      const fbCard = document.getElementById('quiz-feedback-card');
      if (fbCard) fbCard.style.display = 'none';

      const isZh = getLanguage() === 'zh';

      // 1. Context Indicators
      const winBadge = document.getElementById('quiz-win-type-badge');
      if (winBadge) {
        winBadge.textContent = puzzle.is_self_draw ? 
          (isZh ? '🀄 自摸 (Self-Draw)' : '🀄 Self-Draw (Zi Mo)') : 
          (isZh ? '🀄 食胡 (Ron Win)' : '🀄 Ron Win');
        winBadge.style.background = puzzle.is_self_draw ? 'var(--c-ruby-ring)' : 'var(--c-blue-diamond)';
      }

      const windNamesZh: { [k: string]: string } = { '1z': '東風', '2z': '南風', '3z': '西風', '4z': '北風' };
      const windNamesEn: { [k: string]: string } = { '1z': 'East', '2z': 'South', '3z': 'West', '4z': 'North' };
      const windMap = isZh ? windNamesZh : windNamesEn;

      const roundBadge = document.getElementById('quiz-round-wind-badge');
      if (roundBadge) {
        roundBadge.textContent = isZh ? `圈風: ${windMap[puzzle.prevailing_wind] || puzzle.prevailing_wind}` : `Round Wind: ${windMap[puzzle.prevailing_wind] || puzzle.prevailing_wind}`;
      }

      const seatBadge = document.getElementById('quiz-seat-wind-badge');
      if (seatBadge) {
        seatBadge.textContent = isZh ? `門風: ${windMap[puzzle.seat_wind] || puzzle.seat_wind}` : `Seat Wind: ${windMap[puzzle.seat_wind] || puzzle.seat_wind}`;
      }

      const diffTag = document.getElementById('quiz-diff-tag');
      if (diffTag) diffTag.textContent = puzzle.difficulty_label;

      // 2. Render Hand Tiles
      const rack = document.getElementById('quiz-hand-tiles-rack');
      if (rack) {
        rack.innerHTML = puzzle.hand_tiles.map((t: string, idx: number) => {
          const isWinTile = (t === puzzle.winning_tile && idx === puzzle.hand_tiles.lastIndexOf(t));
          return `
            <div class="quiz-tile-card ${isWinTile ? 'is-winning' : ''}" title="${t}">
              ${isWinTile ? '<span class="win-badge">WIN</span>' : ''}
              <img src="/tiles/${t}.png?v=4" alt="${t}" style="width:36px; height:48px; object-fit:contain;" />
              <span style="font-size:0.65rem; color:#475569; font-weight:700;">${t}</span>
            </div>
          `;
        }).join('');
      }

      // 3. Render Pattern Chips
      this.renderQuizPatterns(puzzle);

    } catch (err: any) {
      console.error('Failed to load fan quiz puzzle:', err);
    }
  }

  public renderQuizPatterns(puzzle: any) {
    const chipsGrid = document.getElementById('quiz-patterns-chips-grid');
    if (!chipsGrid || !puzzle) return;
    const isZh = getLanguage() === 'zh';

    chipsGrid.innerHTML = puzzle.available_patterns.map((p: any) => {
      const isSelected = this.selectedQuizPatterns.has(p.id);
      const name = isZh ? p.name_zh : (p.name_en || p.name_zh);
      const fanUnit = isZh ? '番' : ' Fan';
      return `
        <div class="quiz-pattern-chip ${isSelected ? 'active' : ''}" data-pid="${p.id}" style="background:${isSelected ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}; border-color:${isSelected ? '#34d399' : 'rgba(255,255,255,0.18)'}; color:${isSelected ? '#34d399' : '#e5e7eb'};">
          <span class="chip-chk">${isSelected ? '✅' : '⬜'}</span>
          <strong>${name}</strong>
          <span style="font-size:0.75rem; opacity:0.8;">(+${p.fan}${fanUnit})</span>
        </div>
      `;
    }).join('');

    chipsGrid.querySelectorAll('.quiz-pattern-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const pid = target.getAttribute('data-pid')!;
        this.toggleQuizPattern(pid, target);
      });
    });
  }

  public selectQuizFanNumber(fan: number) {
    this.selectedQuizFan = fan;
    document.querySelectorAll('.btn-fan-num').forEach(btn => {
      const el = btn as HTMLElement;
      const bFan = parseInt(el.getAttribute('data-fan') || '0', 10);
      if (bFan === fan) {
        el.classList.add('active');
        el.style.background = 'linear-gradient(135deg, #076cc0 0%, #034b87 100%)';
        el.style.borderColor = '#38bdf8';
        el.style.color = '#ffffff';
        el.style.boxShadow = '0 0 18px rgba(56, 189, 248, 0.85)';
        el.style.transform = 'scale(1.1) translateY(-2px)';
        el.style.fontWeight = '800';
      } else {
        el.classList.remove('active');
        el.style.background = 'rgba(255, 255, 255, 0.08)';
        el.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        el.style.color = '#ffffff';
        el.style.boxShadow = 'none';
        el.style.transform = 'none';
        el.style.fontWeight = '700';
      }
    });
    sound.playTileClick();
  }

  public toggleQuizPattern(pid: string, chipEl: HTMLElement) {
    if (this.selectedQuizPatterns.has(pid)) {
      this.selectedQuizPatterns.delete(pid);
      chipEl.classList.remove('active');
      chipEl.querySelector('.chip-chk')!.textContent = '⬜';
      chipEl.style.background = 'rgba(255, 255, 255, 0.06)';
      chipEl.style.borderColor = 'rgba(255, 255, 255, 0.18)';
      chipEl.style.color = '#e5e7eb';
      chipEl.style.boxShadow = 'none';
    } else {
      this.selectedQuizPatterns.add(pid);
      chipEl.classList.add('active');
      chipEl.querySelector('.chip-chk')!.textContent = '✅';
      chipEl.style.background = 'rgba(16, 185, 129, 0.25)';
      chipEl.style.borderColor = '#34d399';
      chipEl.style.color = '#34d399';
      chipEl.style.boxShadow = '0 0 12px rgba(52, 211, 153, 0.45)';
    }
    sound.playTileClick();
  }

  public async submitFanQuizAnswer() {
    const isZh = getLanguage() === 'zh';
    if (this.selectedQuizFan === null) {
      alert(isZh ? '請先在第 1 步選擇總番數。' : 'Please select the total Fan count in Step 1.');
      return;
    }
    if (!this.currentQuizPuzzle) return;

    try {
      const payload = {
        hand_tiles: this.currentQuizPuzzle.hand_tiles,
        winning_tile: this.currentQuizPuzzle.winning_tile,
        is_self_draw: this.currentQuizPuzzle.is_self_draw,
        prevailing_wind: this.currentQuizPuzzle.prevailing_wind,
        seat_wind: this.currentQuizPuzzle.seat_wind,
        user_fan: this.selectedQuizFan,
        user_patterns: Array.from(this.selectedQuizPatterns)
      };

      const res = await fetch('/api/fan-quiz/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      // Update Stats
      this.quizTotalAnswered++;
      if (data.is_correct_fan) {
        this.quizStreak++;
        this.quizCorrectCount++;
        this.quizBestStreak = Math.max(this.quizBestStreak, this.quizStreak);
        sound.playSuccess();
      } else {
        this.quizStreak = 0;
        sound.playWarning();
      }

      // Update Scoreboard Badges
      const streakEl = document.getElementById('fan-quiz-streak');
      const bestEl = document.getElementById('fan-quiz-best');
      const accEl = document.getElementById('fan-quiz-acc');
      const fracEl = document.getElementById('fan-quiz-score-fraction');

      if (streakEl) streakEl.textContent = this.quizStreak.toString();
      if (bestEl) bestEl.textContent = this.quizBestStreak.toString();
      if (accEl) accEl.textContent = `${Math.round((this.quizCorrectCount / this.quizTotalAnswered) * 100)}%`;
      if (fracEl) fracEl.textContent = `${this.quizCorrectCount}/${this.quizTotalAnswered}`;

      // Render Feedback Card
      const fbCard = document.getElementById('quiz-feedback-card');
      const resHeader = document.getElementById('quiz-result-header');
      const formulaText = document.getElementById('quiz-formula-text');
      const breakdownList = document.getElementById('quiz-breakdown-list');
      const payoutSummary = document.getElementById('quiz-payout-summary');

      if (fbCard && resHeader && formulaText && breakdownList && payoutSummary) {
        fbCard.style.display = 'block';
        if (data.is_correct_fan) {
          resHeader.innerHTML = `
            <span style="color:#34d399;">${isZh ? '🎉 答對了！ (Correct!)' : '🎉 Correct Answer!'}</span>
            <span class="badge" style="background:rgba(52,211,153,0.2); border:1px solid #34d399; color:#34d399; font-size:0.9rem;">
              ${data.actual_fan} ${isZh ? '番' : 'Fan'} • ${data.hand_name}
            </span>
          `;
        } else {
          resHeader.innerHTML = `
            <span style="color:#f87171;">${isZh ? '❌ 算錯了！ (Incorrect)' : '❌ Incorrect Fan Count!'}</span>
            <span class="badge" style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; font-size:0.9rem;">
              ${isZh ? `你選了 ${data.user_fan} 番，正確為 ${data.actual_fan} 番 (${data.hand_name})` : `You selected ${data.user_fan} Fan, Actual is ${data.actual_fan} Fan (${data.hand_name})`}
            </span>
          `;
        }

        formulaText.textContent = data.formula;

        if (data.breakdown && data.breakdown.length > 0) {
          breakdownList.innerHTML = data.breakdown.map((b: any) => `
            <div style="background:rgba(255,255,255,0.06); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(255,255,255,0.08);">
              <div>
                <strong style="color:#fff; font-size:0.95rem;">${b.name}</strong> 
                <span style="font-size:0.8rem; color:#9ca3af; margin-left:6px;">(${b.jyutping})</span>
                <div style="font-size:0.8rem; color:#cbd5e1; margin-top:2px;">${b.desc}</div>
              </div>
              <span style="color:var(--c-blue-diamond); font-size:1.1rem; font-weight:800; white-space:nowrap; margin-left:12px;">+${b.fan} 番</span>
            </div>
          `).join('');
        } else {
          breakdownList.innerHTML = `
            <div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; padding:10px 14px; border-radius:8px; color:#fca5a5;">
              <strong>⚠️ 0番 雞胡（Chicken Hand）</strong>：手牌雖然合乎 4副面子+1副將牌，但沒有任何具番數的組合。根據 TVB 2026 比賽規定（最低 1 番起胡），此手牌<strong>不能食胡</strong>！
            </div>
          `;
        }

        payoutSummary.innerHTML = `
          <div style="color:var(--accent-gold); font-weight:700; margin-bottom:4px;">${data.payout.summary_zh}</div>
          <div style="font-size:0.85rem; color:#9ca3af;">${data.payout.summary_en}</div>
        `;

        fbCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    }
  }

  public async calculateCurrentFan() {
    const input = (document.getElementById('input-fan-tiles') as HTMLInputElement).value;
    const isSelfDraw = (document.getElementById('check-self-draw') as HTMLInputElement).checked;
    const seatWind = (document.getElementById('custom-fan-select-seat') as HTMLSelectElement)?.value || '1z';
    const roundWind = (document.getElementById('custom-fan-select-round') as HTMLSelectElement)?.value || '1z';

    try {
      const parseRes = await parseHandNotation(input);
      if (!parseRes.success || parseRes.tiles.length !== 14) {
        alert(parseRes.errors.join('\n') || 'Please enter 14 valid tiles.');
        return;
      }
      const fanRes = await calculateFanBreakdown(parseRes.tiles, seatWind, roundWind, isSelfDraw);
      const resBox = document.getElementById('fan-results-box');
      if (resBox) {
        resBox.style.display = 'block';
        if (fanRes.is_valid_win) {
          resBox.innerHTML = `
            <div style="color:var(--accent-emerald); font-size:1.25rem; font-weight:800; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
              <span>🎉 ${fanRes.hand_name}</span>
              <span class="badge" style="background:var(--c-blue-diamond); color:#fff; font-size:1rem; padding:4px 12px;">${fanRes.total_fan} 番 / Fan</span>
            </div>
            <div style="margin-bottom:14px; display:flex; flex-direction:column; gap:8px;">
              ${fanRes.breakdown.map((b: any) => `
                <div style="padding:8px 12px; background:rgba(255,255,255,0.06); border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong>${b.name}</strong> <span style="color:#9ca3af; font-size:0.8rem;">(${b.jyutping})</span> - <span style="color:#cbd5e1; font-size:0.82rem;">${b.desc}</span>
                  </div>
                  <strong style="color:var(--c-blue-diamond); font-size:1rem; margin-left:10px;">+${b.fan} 番</strong>
                </div>
              `).join('')}
            </div>
            <div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:10px 14px; font-size:0.9rem;">
              <strong style="color:var(--accent-gold);">📊 Appendix 1 Points Transfer (附錄一得失分):</strong>
              <div style="color:#fff; margin-top:2px;">${fanRes.payout?.summary_zh || ''}</div>
            </div>
          `;
        } else {
          resBox.innerHTML = `
            <div style="color:var(--accent-coral); font-size:1.1rem; font-weight:700; margin-bottom:6px;">
              ❌ ${fanRes.hand_name}
            </div>
            <div style="color:var(--text-muted); font-size:0.9rem;">${fanRes.error || 'Does not meet TVB 2026 winning conditions.'}</div>
          `;
        }
        resBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  // =========================================================================
  // Defense Center & Push/Fold Masterclass (Hong Kong Mahjong Ruleset)
  // =========================================================================
  private currentDefensePuzzle: any = null;
  private selectedDefenseTile: string | null = null;
  private selectedPushFoldChoice: string | null = null;
  private defenseScenarioType: string = 'betaori';
  private defenseStreak: number = 0;
  private defenseBestStreak: number = 0;
  private defenseCorrectCount: number = 0;
  private defenseTotalCount: number = 0;

  public initDefenseCenter() {
    const btnModeDrills = document.getElementById('btn-defense-mode-drills');
    const btnModeTheory = document.getElementById('btn-defense-mode-theory');
    const paneDrills = document.getElementById('defense-pane-drills');
    const paneTheory = document.getElementById('defense-pane-theory');

    btnModeDrills?.addEventListener('click', () => {
      btnModeDrills.className = 'btn btn-primary';
      btnModeTheory!.className = 'btn btn-secondary';
      if (paneDrills) paneDrills.style.display = 'block';
      if (paneTheory) paneTheory.style.display = 'none';
      sound.playTileClick();
    });

    btnModeTheory?.addEventListener('click', () => {
      btnModeTheory.className = 'btn btn-primary';
      btnModeDrills!.className = 'btn btn-secondary';
      if (paneDrills) paneDrills.style.display = 'none';
      if (paneTheory) paneTheory.style.display = 'block';
      sound.playTileClick();
    });

    // Scenario Type Filters
    document.querySelectorAll('.btn-defense-scenario').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-defense-scenario').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('active');
        this.defenseScenarioType = target.getAttribute('data-type') || 'betaori';
        sound.playTileClick();
        this.loadNewDefensePuzzle();
      });
    });

    // Push/Fold Choice Buttons
    document.querySelectorAll('.btn-pf-choice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-pf-choice').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('active');
        this.selectedPushFoldChoice = target.getAttribute('data-choice');
        sound.playTileClick();
      });
    });

    // Submit Decision
    document.getElementById('btn-defense-submit')?.addEventListener('click', () => {
      this.submitDefenseDecision();
    });

    // Next Scenario Buttons
    document.getElementById('btn-defense-next-puzzle')?.addEventListener('click', () => {
      sound.playTileClick();
      this.loadNewDefensePuzzle();
    });
    document.getElementById('btn-defense-next-after-result')?.addEventListener('click', () => {
      sound.playTileClick();
      this.loadNewDefensePuzzle();
    });

    this.loadNewDefensePuzzle();
  }

  public async loadNewDefensePuzzle() {
    try {
      const res = await fetch(`/api/defense/puzzle?scenario_type=${this.defenseScenarioType}`);
      const puzzle = await res.json();
      this.currentDefensePuzzle = puzzle;
      this.selectedDefenseTile = null;
      this.selectedPushFoldChoice = null;
      this.renderDefenseScenario(puzzle);
    } catch (err: any) {
      console.error('Failed to load defense puzzle:', err);
    }
  }

  public renderDefenseScenario(puzzle: any) {
    if (!puzzle) return;
    const isZh = getLanguage() === 'zh';

    // Hide Feedback Card
    const fbCard = document.getElementById('defense-feedback-card');
    if (fbCard) fbCard.style.display = 'none';

    // 1. Threat Info Header & Badges
    const threatInfo = puzzle.threat_info || {};
    const threatBadge = document.getElementById('defense-threat-badge');
    if (threatBadge) {
      threatBadge.textContent = isZh ? `⚠️ 威脅等級: ${threatInfo.threat_level}` : `⚠️ Threat Level: ${threatInfo.threat_level}`;
      threatBadge.style.background = threatInfo.threat_level === 'CRITICAL' ? '#dc2626' : (threatInfo.threat_level === 'HIGH' ? '#ea580c' : '#076cc0');
    }

    const suspectedBadge = document.getElementById('defense-suspected-fan-badge');
    if (suspectedBadge) {
      suspectedBadge.textContent = isZh ? `估算番數: ${threatInfo.estimated_fan || 1}+ 番` : `Estimated Value: ${threatInfo.estimated_fan || 1}+ Fan`;
    }

    const targetBadge = document.getElementById('defense-target-player-badge');
    if (targetBadge) {
      targetBadge.textContent = isZh ? `威脅目標: ${threatInfo.player_name || '對手'}` : `Threat Target: ${threatInfo.player_name || 'Opponent'}`;
    }

    // 2. Opponent Melds & River
    const meldsRack = document.getElementById('defense-opp-melds-rack');
    if (meldsRack) {
      const melds = threatInfo.melds || [];
      if (melds.length === 0) {
        meldsRack.innerHTML = `<span style="color:#6b7280; font-size:0.8rem;">${isZh ? '(門清 Concealed / 無副露)' : '(Concealed Hand / 0 Melds)'}</span>`;
      } else {
        meldsRack.innerHTML = melds.map((m: any) => `
          <div style="display:flex; background:rgba(0,0,0,0.5); padding:2px 4px; border-radius:6px; gap:2px; border:1px solid rgba(255,255,255,0.1);">
            ${m.tiles.map((t: string) => `
              <img src="/tiles/${t}.png?v=4" alt="${t}" style="width:24px; height:32px; object-fit:contain;" />
            `).join('')}
          </div>
        `).join('');
      }
    }

    const riverRack = document.getElementById('defense-opp-river-rack');
    if (riverRack) {
      const river = threatInfo.river || [];
      riverRack.innerHTML = river.map((r: any) => `
        <div style="display:flex; flex-direction:column; align-items:center; background:#fff; border-radius:3px; padding:1px 2px;">
          <img src="/tiles/${r.tile}.png?v=4" alt="${r.tile}" style="width:20px; height:26px; object-fit:contain;" />
        </div>
      `).join('');
    }

    const narrativeEl = document.getElementById('defense-threat-narrative');
    if (narrativeEl) {
      narrativeEl.textContent = isZh ? (threatInfo.threat_summary_zh || '') : (threatInfo.threat_summary_en || threatInfo.threat_summary_zh || '');
    }

    // 3. User Hand & Prompt
    const pfActions = document.getElementById('defense-push-fold-actions');
    const handPrompt = document.getElementById('defense-hand-prompt');
    const userHandRack = document.getElementById('defense-user-hand-rack');

    if (puzzle.scenario_type === 'push_fold') {
      if (pfActions) pfActions.style.display = 'flex';
      if (handPrompt) {
        handPrompt.textContent = isZh ? 
          '你的手牌 — 評估手牌價值與對手威脅，選擇攻守方針 (Push/Fold):' : 
          'Your Hand — Evaluate value vs opponent threat and select tactical posture (Push/Fold):';
      }
      document.querySelectorAll('.btn-pf-choice').forEach(b => b.classList.remove('active'));
    } else {
      if (pfActions) pfActions.style.display = 'none';
      if (handPrompt) {
        handPrompt.textContent = isZh ? 
          '你的 14 張手牌 — 點選你手中最安全的防守捨牌 (100% 跟打熟牌或壁牌):' : 
          'Your 14-Tile Hand — Click on your safest defensive discard (100% Genbutsu or Kabe Safe Tile):';
      }
    }

    if (userHandRack) {
      userHandRack.innerHTML = puzzle.user_hand.map((t: string, idx: number) => `
        <div class="user-interactive-tile defense-selectable-tile" data-tile="${t}" data-idx="${idx}">
          <img src="/tiles/${t}.png?v=4" alt="${t}" />
          <span class="tile-name-label">${t}</span>
        </div>
      `).join('');

      if (puzzle.scenario_type === 'betaori') {
        userHandRack.querySelectorAll('.defense-selectable-tile').forEach(tileCard => {
          tileCard.addEventListener('click', (e) => {
            userHandRack.querySelectorAll('.defense-selectable-tile').forEach(c => c.classList.remove('selected-for-discard'));
            const target = e.currentTarget as HTMLElement;
            target.classList.add('selected-for-discard');
            this.selectedDefenseTile = target.getAttribute('data-tile');
            sound.playTileClick();
          });
        });
      }
    }
  }

  public async submitDefenseDecision() {
    if (!this.currentDefensePuzzle) return;
    const isPushFold = (this.currentDefensePuzzle.scenario_type === 'push_fold');
    const userChoice = isPushFold ? this.selectedPushFoldChoice : this.selectedDefenseTile;
    const isZh = getLanguage() === 'zh';

    if (!userChoice) {
      alert(isPushFold ? 
        (isZh ? '請選擇攻守方針 (PUSH、MAWASHI 或 FOLD)。' : 'Please select a tactical posture (PUSH, MAWASHI, or FOLD).') : 
        (isZh ? '請先點選手牌中一張防守捨牌。' : 'Please click on a tile in your hand to discard.'));
      return;
    }

    try {
      const payload = {
        puzzle_type: this.currentDefensePuzzle.scenario_type,
        user_choice: userChoice,
        ground_truth: this.currentDefensePuzzle.ground_truth
      };

      const res = await fetch('/api/defense/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      this.defenseTotalCount++;
      if (data.is_correct) {
        this.defenseStreak++;
        this.defenseCorrectCount++;
        this.defenseBestStreak = Math.max(this.defenseBestStreak, this.defenseStreak);
        sound.playSuccess();
      } else {
        this.defenseStreak = 0;
        sound.playWarning();
      }

      // Update Scoreboard
      const streakEl = document.getElementById('defense-drill-streak');
      const bestEl = document.getElementById('defense-drill-best');
      const accEl = document.getElementById('defense-drill-acc');
      const fracEl = document.getElementById('defense-drill-score-fraction');

      if (streakEl) streakEl.textContent = this.defenseStreak.toString();
      if (bestEl) bestEl.textContent = this.defenseBestStreak.toString();
      if (accEl) accEl.textContent = `${Math.round((this.defenseCorrectCount / this.defenseTotalCount) * 100)}%`;
      if (fracEl) fracEl.textContent = `${this.defenseCorrectCount}/${this.defenseTotalCount}`;

      // Render Feedback Card
      const fbCard = document.getElementById('defense-feedback-card');
      const resHeader = document.getElementById('defense-result-header');
      const expBox = document.getElementById('defense-explanation-box');
      const heatmapTable = document.getElementById('defense-heatmap-table');
      const heatmapContainer = document.getElementById('defense-heatmap-container');

      if (fbCard && resHeader && expBox) {
        fbCard.style.display = 'block';

        if (data.is_correct) {
          resHeader.innerHTML = `
            <span style="color:#34d399;">${isZh ? '🎉 防守成功！ (Correct Decision!)' : '🎉 Defense Successful! (Correct Decision!)'}</span>
            <span class="badge" style="background:rgba(52,211,153,0.2); border:1px solid #34d399; color:#34d399; font-size:0.9rem;">
              ${isZh ? '最優策略' : 'Optimal Choice'}: ${data.optimal_choice}
            </span>
          `;
        } else {
          resHeader.innerHTML = `
            <span style="color:#f87171;">${isZh ? '❌ 出銃高危警報！ (Dangerous Move)' : '❌ High Risk of Dealing-in! (Dangerous Move)'}</span>
            <span class="badge" style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; font-size:0.9rem;">
              ${isZh ? '你的選擇' : 'Your Choice'}: ${data.user_choice} • ${isZh ? '最優解' : 'Optimal'}: ${data.optimal_choice}
            </span>
          `;
        }

        expBox.innerHTML = `
          <div style="font-size:0.95rem; margin-bottom:6px;">${isZh ? data.explanation_zh : (data.explanation_en || data.explanation_zh)}</div>
          <div style="font-size:0.85rem; color:#9ca3af;">${isZh ? data.explanation_en : data.explanation_zh}</div>
        `;

        if (data.tile_ratings && data.tile_ratings.length > 0 && heatmapTable && heatmapContainer) {
          heatmapContainer.style.display = 'block';
          heatmapTable.innerHTML = data.tile_ratings.map((r: any, idx: number) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.06); padding:8px 12px; border-radius:6px; border-left:4px solid ${r.color};">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-family:var(--font-mono); font-weight:700; color:#9ca3af; font-size:0.85rem;">#${idx+1}</span>
                <img src="/tiles/${r.tile}.png?v=4" alt="${r.tile}" style="width:24px; height:32px; object-fit:contain;" />
                <div>
                  <strong style="color:#fff;">${r.tile}</strong>
                  <span style="color:${r.color}; font-weight:700; font-size:0.85rem; margin-left:6px;">[${isZh ? r.safety_label_zh : (r.safety_label_en || r.safety_label_zh)}]</span>
                  <div style="font-size:0.78rem; color:#cbd5e1; margin-top:2px;">${r.primary_reason}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <span class="badge" style="background:${r.color}; color:#111; font-weight:800; font-size:0.8rem;">
                  Danger: ${r.danger_score}/10
                </span>
              </div>
            </div>
          `).join('');
        } else if (heatmapContainer) {
          heatmapContainer.style.display = 'none';
        }

      fbCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    }
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  const app = new MahjongApp();
  app.initRulesCenter();
  app.initFanQuiz();
  app.initDefenseCenter();
});

