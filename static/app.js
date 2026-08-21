/* ==========================================================================
   Hong Kong Mahjong Efficiency Trainer - Pure Web Application Logic (app.js)
   Features: Discard Trainer, Tactical Puzzles & Endless Drills, Builder, Fan Counter
   ========================================================================== */

(function () {
  const ALL_34_TILES = [
    '1m','2m','3m','4m','5m','6m','7m','8m','9m',
    '1p','2p','3p','4p','5p','6p','7p','8p','9p',
    '1s','2s','3s','4s','5s','6s','7s','8s','9s',
    '1z','2z','3z','4z','5z','6z','7z'
  ];

  const SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'q', 'w'];

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

  // Web Audio Synthesizer
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
    }

    initCtx() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.ctx = new AudioContextClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }

    playTileClick() {
      if (this.isMuted) return;
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    }

    playSuccess() {
      if (this.isMuted) return;
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const now = this.ctx.currentTime + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.23);
      });
    }

    playWarning() {
      if (this.isMuted) return;
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    }

    playSuboptimal() {
      this.playWarning();
    }

    playError() {
      this.playWarning();
    }

    playVictory() {
      if (this.isMuted) return;
      this.initCtx();
      if (!this.ctx) return;

      const chordSeq = [
        { notes: [523.25, 659.25, 783.99], time: 0.0, dur: 0.18 },
        { notes: [587.33, 739.99, 880.00], time: 0.18, dur: 0.18 },
        { notes: [659.25, 830.61, 987.77], time: 0.36, dur: 0.22 },
        { notes: [783.99, 1046.50, 1318.51], time: 0.58, dur: 0.6 }
      ];

      chordSeq.forEach(({ notes, time, dur }) => {
        notes.forEach((freq) => {
          const now = this.ctx.currentTime + time;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + dur + 0.02);
        });
      });
    }
  }

  const sound = new SoundEngine();

  // Trainer State
  let currentHand = [];
  let currentEvaluation = null;
  let selectedDiscard = null;
  let seatWind = '1z';
  let prevailingWind = '1z';
  let continuousMode = true;
  let newlyDrawnTile = null;

  let totalMoves = 0;
  let correctMoves = 0;
  let currentStreak = 0;
  let customBuilderTiles = [];

  // Tactical Puzzles State
  let puzzleMode = 'curated'; // 'curated' | 'drill'
  const puzzles = TACTICAL_PUZZLES;
  let currentPuzzleIndex = 0;
  let solvedPuzzles = new Set();
  let activePuzzleCategory = 'all';
  let currentPuzzleHand = [];
  let currentPuzzleEvaluation = null;
  let currentDrillPuzzle = null;

  let drillStreak = 0;
  let drillCorrect = 0;
  let drillTotal = 0;
  let autoAdvanceOnWin = true;
  let autoAdvanceTimer = null;

  // =========================================================================
  // LocalStorage Persistence Manager (100% Client-Side, Zero Server Overhead)
  // =========================================================================
  const StorageManager = {
    loadAll() {
      this.loadTrainerStats();
      this.loadDrillStats();
      this.loadQuizStats();
      this.loadDefenseStats();
    },
    loadTrainerStats() {
      try {
        const data = JSON.parse(localStorage.getItem('hkm_trainer_stats') || '{}');
        totalMoves = data.totalMoves || 0;
        correctMoves = data.correctMoves || 0;
        currentStreak = data.currentStreak || 0;
        this.renderTrainerStats();
      } catch (e) {}
    },
    saveTrainerStats() {
      try {
        localStorage.setItem('hkm_trainer_stats', JSON.stringify({
          totalMoves, correctMoves, currentStreak
        }));
      } catch (e) {}
    },
    renderTrainerStats() {
      const acc = totalMoves > 0 ? Math.round((correctMoves / totalMoves) * 100) : 100;
      const accEl = document.getElementById('stat-accuracy');
      if (accEl) accEl.textContent = `${acc}%`;
      const streakEl = document.getElementById('stat-streak');
      if (streakEl) streakEl.textContent = `${currentStreak} 🔥`;
      const totalEl = document.getElementById('stat-total-moves');
      if (totalEl) totalEl.textContent = `${totalMoves}`;
    },
    loadDrillStats() {
      try {
        const data = JSON.parse(localStorage.getItem('hkm_drill_stats') || '{}');
        drillStreak = data.drillStreak || 0;
        drillCorrect = data.drillCorrect || 0;
        drillTotal = data.drillTotal || 0;
        const solved = JSON.parse(localStorage.getItem('hkm_solved_puzzles') || '[]');
        solvedPuzzles = new Set(solved);
      } catch (e) {}
    },
    saveDrillStats() {
      try {
        localStorage.setItem('hkm_drill_stats', JSON.stringify({
          drillStreak, drillCorrect, drillTotal
        }));
        localStorage.setItem('hkm_solved_puzzles', JSON.stringify([...solvedPuzzles]));
      } catch (e) {}
    },
    loadQuizStats() {
      try {
        const data = JSON.parse(localStorage.getItem('hkm_quiz_stats') || '{}');
        quizStreak = data.quizStreak || 0;
        quizBestStreak = data.quizBestStreak || 0;
        quizCorrectCount = data.quizCorrectCount || 0;
        quizTotalAnswered = data.quizTotalAnswered || 0;
      } catch (e) {}
    },
    saveQuizStats() {
      try {
        localStorage.setItem('hkm_quiz_stats', JSON.stringify({
          quizStreak, quizBestStreak, quizCorrectCount, quizTotalAnswered
        }));
      } catch (e) {}
    },
    loadDefenseStats() {
      try {
        const data = JSON.parse(localStorage.getItem('hkm_defense_stats') || '{}');
        defenseStreak = data.defenseStreak || 0;
        defenseBestStreak = data.defenseBestStreak || 0;
        defenseCorrectCount = data.defenseCorrectCount || 0;
        defenseTotalCount = data.defenseTotalCount || 0;
        defenseLanguage = data.defenseLanguage || 'en';
      } catch (e) {}
    },
    saveDefenseStats() {
      try {
        localStorage.setItem('hkm_defense_stats', JSON.stringify({
          defenseStreak, defenseBestStreak, defenseCorrectCount, defenseTotalCount, defenseLanguage
        }));
      } catch (e) {}
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    StorageManager.loadAll();
    setupDOM();
    bindEvents();
    initPuzzles();
    loadNewHand();
    initRulesCenter();
    initWorksheetSimulator();
    initSignaturePads();
    initBotGameListeners();
    initFanQuizTrainer();
    initDefenseCenter();
  }

  function setupDOM() {
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

  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));

    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (tabBtn) tabBtn.classList.add('active');

    const section = document.getElementById(tabId);
    if (section) section.classList.add('active');

    if (tabId === 'tab-bots') {
      const userRack = document.getElementById('bot-user-tiles-rack');
      if (userRack && userRack.children.length === 0) {
        startBotGame();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.tab;
        sound.playTileClick();
        switchTab(target);
      });
    });

    // Brand logo returns to Home
    document.getElementById('brand-home-link')?.addEventListener('click', () => {
      sound.playTileClick();
      switchTab('tab-home');
    });

    // Generic [data-navigate] elements
    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.navigate;
        if (target) {
          sound.playTileClick();
          switchTab(target);
        }
      });
    });

    // Wind Selectors
    document.getElementById('select-seat-wind')?.addEventListener('change', (e) => {
      seatWind = e.target.value;
      if (currentHand.length === 14) reEvaluateCurrentHand();
    });

    document.getElementById('select-prevailing-wind')?.addEventListener('change', (e) => {
      prevailingWind = e.target.value;
      if (currentHand.length === 14) reEvaluateCurrentHand();
    });

    // Action Buttons
    document.getElementById('btn-deal-random')?.addEventListener('click', () => {
      sound.playTileClick();
      loadNewHand();
    });

    document.getElementById('btn-next-turn')?.addEventListener('click', () => {
      advanceNextTurn();
    });

    document.getElementById('toggle-continuous')?.addEventListener('change', (e) => {
      continuousMode = e.target.checked;
    });

    document.getElementById('btn-sound-toggle')?.addEventListener('click', (e) => {
      const isMuted = sound.toggleMute();
      e.currentTarget.innerHTML = isMuted ? '🔇 Audio Off' : '🔊 Audio On';
    });

    // Custom Hand String Load
    document.getElementById('btn-load-custom')?.addEventListener('click', () => {
      const input = document.getElementById('input-custom-hand').value;
      loadStringIntoBuilder(input);
    });

    // Quick Preset Buttons in Builder
    document.querySelectorAll('#tab-builder .btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.dataset.preset;
        sound.playTileClick();
        loadStringIntoBuilder(preset);
      });
    });

    // Custom Builder Palette Click
    document.getElementById('palette-tiles')?.addEventListener('click', (e) => {
      const tileEl = e.target.closest('.palette-tile');
      if (tileEl) {
        addTileToCustomBuilder(tileEl.dataset.tile);
      }
    });

    document.getElementById('btn-clear-builder')?.addEventListener('click', () => {
      sound.playTileClick();
      customBuilderTiles = [];
      renderCustomBuilderHand();
      const report = document.getElementById('builder-analysis-report');
      if (report) report.style.display = 'none';
    });

    // Analyze Hand in Workbench (Maintains user on the same tab!)
    document.getElementById('btn-apply-builder')?.addEventListener('click', () => {
      sound.playTileClick();
      analyzeCustomBuilderHand();
    });

    // Send Hand from Builder to Trainer
    document.getElementById('btn-builder-send-trainer')?.addEventListener('click', () => {
      if (customBuilderTiles.length === 14) {
        sound.playTileClick();
        currentHand = [...customBuilderTiles];
        seatWind = document.getElementById('builder-select-seat').value;
        prevailingWind = document.getElementById('builder-select-round').value;
        document.getElementById('select-seat-wind').value = seatWind;
        document.getElementById('select-prevailing-wind').value = prevailingWind;
        reEvaluateCurrentHand();
        switchTab('tab-trainer');
      }
    });

    // Builder Wind Changes
    document.getElementById('builder-select-seat')?.addEventListener('change', () => {
      if (customBuilderTiles.length === 14) analyzeCustomBuilderHand();
    });
    document.getElementById('builder-select-round')?.addEventListener('change', () => {
      if (customBuilderTiles.length === 14) analyzeCustomBuilderHand();
    });

    // Fan Counter
    document.getElementById('btn-calculate-fan')?.addEventListener('click', () => {
      calculateCurrentFan();
    });

    // Tactical Puzzles Mode Switcher
    document.getElementById('btn-mode-curated')?.addEventListener('click', () => {
      setPuzzleMode('curated');
    });

    document.getElementById('btn-mode-drill')?.addEventListener('click', () => {
      setPuzzleMode('drill');
    });

    document.getElementById('check-auto-advance')?.addEventListener('change', (e) => {
      autoAdvanceOnWin = e.target.checked;
    });

    // Tactical Puzzles Navigation
    document.getElementById('btn-prev-puzzle')?.addEventListener('click', () => {
      prevPuzzle();
    });
    document.getElementById('btn-next-puzzle')?.addEventListener('click', () => {
      nextPuzzle();
    });
    document.getElementById('btn-next-puzzle-bottom')?.addEventListener('click', () => {
      nextPuzzle();
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
      const p = (puzzleMode === 'drill' && currentDrillPuzzle) ? currentDrillPuzzle : puzzles[currentPuzzleIndex];
      seatWind = p.seat_wind;
      prevailingWind = p.prevailing_wind;
      document.getElementById('select-seat-wind').value = p.seat_wind;
      document.getElementById('select-prevailing-wind').value = p.prevailing_wind;
      
      if (puzzleMode === 'drill' && currentDrillPuzzle) {
        currentHand = [...currentDrillPuzzle.tiles];
        reEvaluateCurrentHand();
      } else {
        loadCustomHandString(p.notation);
      }
      switchTab('tab-trainer');
    });

    // Puzzle Category Filters / Drill Theme Selector
    document.querySelectorAll('#puzzle-category-filters .btn-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#puzzle-category-filters .btn-filter').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activePuzzleCategory = e.currentTarget.dataset.category || 'all';

        if (puzzleMode === 'drill') {
          sound.playTileClick();
          loadNewDrillPuzzle(activePuzzleCategory);
        } else {
          renderPuzzleCatalog();
        }
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const trainerSection = document.getElementById('tab-trainer');
      if (trainerSection && trainerSection.classList.contains('active')) {
        if (currentEvaluation && currentEvaluation.is_winning_hand) return;

        const keyIndex = SHORTCUT_KEYS.indexOf(e.key.toLowerCase());
        if (keyIndex >= 0 && keyIndex < currentHand.length) {
          handleUserDiscard(currentHand[keyIndex]);
        }
      }
    });
  }

  // =========================================================================
  // TACTICAL PUZZLES & ENDLESS DRILL MANAGER
  // =========================================================================
  function setPuzzleMode(mode) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    puzzleMode = mode;
    sound.playTileClick();

    document.querySelectorAll('.btn-puzzle-mode').forEach(b => b.classList.remove('active'));
    if (mode === 'curated') {
      document.getElementById('btn-mode-curated')?.classList.add('active');
      document.getElementById('chip-curated-stats').style.display = 'inline-flex';
      document.getElementById('chip-drill-stats').style.display = 'none';
      document.getElementById('chip-drill-score').style.display = 'none';
      document.getElementById('label-auto-advance').style.display = 'none';
      document.getElementById('puzzle-catalog').style.display = 'grid';
      document.getElementById('puzzle-catalog-title').textContent = '📚 All Puzzles Curriculum (完整難題題庫)';
      loadPuzzleIntoArena(currentPuzzleIndex);
    } else {
      document.getElementById('btn-mode-drill')?.classList.add('active');
      document.getElementById('chip-curated-stats').style.display = 'none';
      document.getElementById('chip-drill-stats').style.display = 'inline-flex';
      document.getElementById('chip-drill-score').style.display = 'inline-flex';
      document.getElementById('label-auto-advance').style.display = 'inline-flex';
      document.getElementById('puzzle-catalog').style.display = 'none';
      document.getElementById('puzzle-catalog-title').textContent = '⚡ Select Drill Category Focus (選擇特訓主題):';
      loadNewDrillPuzzle(activePuzzleCategory);
    }
  }

  async function initPuzzles() {
    renderPuzzleCatalog();
    await loadPuzzleIntoArena(0);
  }

  async function loadPuzzleIntoArena(index) {
    if (index < 0 || index >= puzzles.length) return;
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);

    currentPuzzleIndex = index;
    const puzzle = puzzles[index];

    // Badges
    const badgeIndex = document.getElementById('puzzle-badge-index');
    if (badgeIndex) badgeIndex.textContent = `Lesson #${index + 1} of ${puzzles.length}`;

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

    const fb = document.getElementById('puzzle-feedback');
    if (fb) fb.style.display = 'none';

    try {
      const parseRes = await fetch('/api/parse-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input: puzzle.notation })
      });
      const parseData = await parseRes.json();
      currentPuzzleHand = parseData.tiles;

      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hand_tiles: parseData.tiles,
          seat_wind: puzzle.seat_wind,
          prevailing_wind: puzzle.prevailing_wind
        })
      });
      currentPuzzleEvaluation = await evalRes.json();

      renderPuzzleHand();
    } catch (err) {
      console.error(err);
    }

    renderPuzzleCatalog();
  }

  async function loadNewDrillPuzzle(category = 'waits') {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);

    try {
      const res = await fetch('/api/puzzles/generate-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category,
          seat_wind: seatWind,
          prevailing_wind: prevailingWind
        })
      });
      const data = await res.json();
      const drill = data.puzzle;
      currentDrillPuzzle = drill;
      currentPuzzleHand = drill.tiles;
      currentPuzzleEvaluation = drill.evaluation;

      // Badges
      const badgeIndex = document.getElementById('puzzle-badge-index');
      if (badgeIndex) badgeIndex.textContent = `⚡ Endless Drill #${drillTotal + 1}`;

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

      const fb = document.getElementById('puzzle-feedback');
      if (fb) fb.style.display = 'none';

      renderPuzzleHand();
    } catch (err) {
      console.error(err);
    }
  }

  function renderPuzzleHand() {
    const rack = document.getElementById('puzzle-tiles-rack');
    if (!rack) return;

    rack.innerHTML = currentPuzzleHand.map((code, idx) => `
      <div class="tile-card" data-tile="${code}" data-idx="${idx}" title="Click to discard this tile in puzzle">
        <span class="tile-shortcut">#${idx + 1}</span>
        <img src="/static/tiles/${code}.png" alt="${code}" class="tile-img" />
        <span class="tile-label-zh">${code}</span>
      </div>
    `).join('');

    rack.querySelectorAll('.tile-card').forEach(card => {
      card.addEventListener('click', (e) => {
        handlePuzzleDiscard(e.currentTarget.dataset.tile);
      });
    });
  }

  async function handlePuzzleDiscard(tile) {
    if (!currentPuzzleEvaluation) return;
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);

    const isDrill = (puzzleMode === 'drill');
    const puzzle = isDrill ? currentDrillPuzzle : puzzles[currentPuzzleIndex];

    sound.playTileClick();

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hand_tiles: currentPuzzleHand,
          user_discard: tile,
          seat_wind: puzzle.seat_wind,
          prevailing_wind: puzzle.prevailing_wind
        })
      });
      const evalRes = await res.json();
      const comp = evalRes.comparison;
      if (!comp) return;

      const fb = document.getElementById('puzzle-feedback');
      if (!fb) return;

      fb.style.display = 'block';
      fb.className = `feedback-box ${comp.status}`;

      if (comp.is_correct) {
        sound.playSuccess();

        if (isDrill) {
          drillTotal++;
          drillCorrect++;
          drillStreak++;
          updateDrillStats();

          fb.innerHTML = `
            <div class="feedback-header">
              <div class="feedback-title" style="color:var(--accent-emerald);">
                ✨ 🎉 正確！ Correct Tactical Move! (Streak: ${drillStreak} 🔥)
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
                ${autoAdvanceOnWin ? '⏱️ Loading next drill variation...' : 'Click button to generate next drill ➔'}
              </span>
              <button class="btn btn-primary btn-drill-next-step">
                ⚡ Next ${puzzle.category_name_zh} Variation ➔
              </button>
            </div>
          `;

          fb.querySelector('.btn-drill-next-step')?.addEventListener('click', () => {
            sound.playTileClick();
            loadNewDrillPuzzle(activePuzzleCategory);
          });

          if (autoAdvanceOnWin) {
            autoAdvanceTimer = setTimeout(() => {
              loadNewDrillPuzzle(activePuzzleCategory);
            }, 1200);
          }

        } else {
          // Curated Mode
          solvedPuzzles.add(puzzle.id);
          updateCuratedStats();
          renderPuzzleCatalog();

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
            nextPuzzle();
          });

          fb.querySelector('.btn-launch-drill-theme')?.addEventListener('click', () => {
            activePuzzleCategory = puzzle.category;
            document.querySelectorAll('#puzzle-category-filters .btn-filter').forEach(b => {
              if (b.dataset.category === puzzle.category) b.classList.add('active');
              else b.classList.remove('active');
            });
            setPuzzleMode('drill');
          });
        }
      } else {
        sound.playWarning();

        if (isDrill) {
          drillTotal++;
          drillStreak = 0;
          updateDrillStats();
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
          loadNewDrillPuzzle(activePuzzleCategory);
        });
      }
    } catch (err) {
      alert(err.message);
    }
  }

  function prevPuzzle() {
    if (puzzleMode === 'drill') {
      loadNewDrillPuzzle(activePuzzleCategory);
    } else if (currentPuzzleIndex > 0) {
      sound.playTileClick();
      loadPuzzleIntoArena(currentPuzzleIndex - 1);
    }
  }

  function nextPuzzle() {
    if (puzzleMode === 'drill') {
      sound.playTileClick();
      loadNewDrillPuzzle(activePuzzleCategory);
    } else if (currentPuzzleIndex < puzzles.length - 1) {
      sound.playTileClick();
      loadPuzzleIntoArena(currentPuzzleIndex + 1);
    } else {
      alert("🎉 Congratulations! You have completed all 10 curated lessons! Try 'Endless Themed Drill' mode for infinite variations!");
    }
  }

  function updateCuratedStats() {
    const solvedCount = solvedPuzzles.size;
    const statEl = document.getElementById('stat-puzzles-solved');
    if (statEl) statEl.textContent = `${solvedCount}/${puzzles.length} ⭐`;
    StorageManager.saveDrillStats();
  }

  function updateDrillStats() {
    const streakEl = document.getElementById('stat-drill-streak');
    if (streakEl) streakEl.textContent = `${drillStreak} 🔥`;

    const scoreEl = document.getElementById('stat-drill-score');
    if (scoreEl) {
      const pct = drillTotal > 0 ? Math.round((drillCorrect / drillTotal) * 100) : 0;
      scoreEl.textContent = `${drillCorrect}/${drillTotal} (${pct}%)`;
    }
    StorageManager.saveDrillStats();
  }

  function renderPuzzleCatalog() {
    const catalog = document.getElementById('puzzle-catalog');
    if (!catalog) return;

    const filtered = puzzles.filter(p => {
      if (activePuzzleCategory === 'all') return true;
      return p.category === activePuzzleCategory;
    });

    catalog.innerHTML = filtered.map((p) => {
      const realIndex = puzzles.findIndex(item => item.id === p.id);
      const isSolved = solvedPuzzles.has(p.id);
      const isActive = (realIndex === currentPuzzleIndex);

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
        const idx = parseInt(e.currentTarget.dataset.puzzleIdx, 10);
        sound.playTileClick();
        setPuzzleMode('curated');
        loadPuzzleIntoArena(idx);
        document.getElementById('puzzle-arena')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // =========================================================================
  // DISCARD TRAINER FUNCTIONS
  // =========================================================================
  async function loadNewHand() {
    try {
      const res = await fetch('/api/random-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seat_wind: seatWind, prevailing_wind: prevailingWind })
      });
      const data = await res.json();
      currentHand = data.tiles;
      currentEvaluation = data.evaluation;
      selectedDiscard = null;
      newlyDrawnTile = null;
      renderHand();

      if (data.evaluation.is_winning_hand) {
        showVictory(data.evaluation);
      } else {
        renderEvaluationTable(data.evaluation);
        hideFeedback();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCustomHandString(str) {
    try {
      const res = await fetch('/api/parse-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input: str })
      });
      const data = await res.json();
      if (!data.success || data.tiles.length !== 14) {
        alert(data.errors.join('\n') || 'Invalid 14-tile notation.');
        return;
      }
      currentHand = data.tiles;
      newlyDrawnTile = null;
      reEvaluateCurrentHand();
    } catch (err) {
      alert(err.message);
    }
  }

  async function reEvaluateCurrentHand() {
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hand_tiles: currentHand,
          seat_wind: seatWind,
          prevailing_wind: prevailingWind
        })
      });
      const evalData = await res.json();
      currentEvaluation = evalData;
      selectedDiscard = null;
      renderHand();

      if (evalData.is_winning_hand) {
        showVictory(evalData);
      } else {
        renderEvaluationTable(evalData);
        hideFeedback();
      }
    } catch (err) {
      alert(err.message);
    }
  }

  function renderHand() {
    const rack = document.getElementById('hand-tiles-rack');
    if (!rack) return;

    const isWinning = !!(currentEvaluation && currentEvaluation.is_winning_hand);

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

    rack.innerHTML = currentHand.map((code, idx) => {
      const isNew = (code === newlyDrawnTile && idx === currentHand.length - 1);
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
          handleUserDiscard(e.currentTarget.dataset.tile);
        });
      });
    }
  }

  async function handleUserDiscard(tile) {
    if (currentEvaluation && currentEvaluation.is_winning_hand) return;

    sound.playTileClick();
    selectedDiscard = tile;

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hand_tiles: currentHand,
          user_discard: tile,
          seat_wind: seatWind,
          prevailing_wind: prevailingWind
        })
      });
      const evalResult = await res.json();
      currentEvaluation = evalResult;

      const comp = evalResult.comparison;
      if (comp) {
        showFeedback(comp);
        updateStats(comp.is_correct, comp.outs_delta);
        if (comp.is_correct) {
          sound.playSuccess();
        } else {
          sound.playWarning();
        }
      }

      renderEvaluationTable(evalResult, tile);
    } catch (err) {
      alert(err.message);
    }
  }

  function showVictory(evalData) {
    sound.playVictory();

    const box = document.getElementById('feedback-box');
    if (!box) return;

    box.className = `feedback-box victory`;
    box.style.display = 'block';

    const fanData = evalData.winning_fan;
    const handName = fanData?.hand_name || '胡牌 (Winning Hand)';
    const totalFan = fanData?.total_fan || 1;
    const breakdown = fanData?.breakdown || [];

    box.innerHTML = `
      <div class="feedback-header" style="border-bottom:1px solid rgba(229,185,76,0.3); padding-bottom:12px; margin-bottom:14px;">
        <div class="victory-title">
          <span>🏆 🎉 自摸胡牌！ Winning Hand Achieved!</span>
          <span class="victory-fan-badge">${totalFan} 番 / Fan</span>
        </div>
        <button id="btn-victory-next-hand" class="btn btn-victory">
          🎲 Start Next Hand (再開一局) ➔
        </button>
      </div>

      <div style="font-size:1.05rem; margin-bottom:12px;">
        <strong>胡牌牌型：</strong> <span style="color:var(--accent-gold); font-size:1.15rem; font-weight:700;">${handName}</span>
      </div>

      <div style="background:rgba(0,0,0,0.35); border-radius:8px; padding:12px 16px; border:1px solid rgba(255,255,255,0.1); margin-bottom:16px;">
        <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; font-weight:600;">Scoring Breakdown (番數詳情):</div>
        <ul style="list-style:none; padding-left:0;">
          ${breakdown.map(b => `
            <li style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
              <span><strong>${b.name}</strong> <span style="color:var(--text-muted);">(${b.jyutping})</span> - ${b.desc}</span>
              <span style="color:var(--accent-gold); font-weight:700;">+${b.fan} 番</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <div style="font-size:0.9rem; color:var(--accent-emerald);">
        ✨ 牌局已完美結束！在真實比賽中達到胡牌條件即停止打牌。點擊上方按鈕開始新一輪牌效訓練！
      </div>
    `;

    document.getElementById('btn-victory-next-hand')?.addEventListener('click', () => {
      sound.playTileClick();
      loadNewHand();
    });

    renderEvaluationTable(evalData);
  }

  function showFeedback(comp) {
    const box = document.getElementById('feedback-box');
    if (!box) return;

    box.className = `feedback-box ${comp.status}`;
    box.style.display = 'block';

    box.innerHTML = `
      <div class="feedback-header">
        <div id="feedback-title" class="feedback-title">${comp.status === 'optimal' ? '✨' : '⚠️'} ${comp.title_zh} (${comp.title_en})</div>
        <button id="btn-next-turn" class="btn btn-primary" style="display:${continuousMode ? 'inline-flex' : 'none'};">
          Draw Next Tile (摸下一張牌) ➔
        </button>
      </div>
      <div id="feedback-desc" class="feedback-body">
        <p>${comp.delta_reasoning_zh.replace(/\n/g, '<br/>')}</p>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-top:6px;">${comp.delta_reasoning_en}</p>
      </div>

      <div class="outs-comparison-grid">
        <div id="user-outs-card" class="outs-card">
          <div class="outs-card-title">Your Discard: ${comp.user_discard}</div>
          <div class="outs-card-val" style="color: ${comp.is_correct ? 'var(--accent-emerald)' : 'var(--accent-coral)'};">
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

        <div id="optimal-outs-card" class="outs-card">
          <div class="outs-card-title">Optimal Discard: ${comp.optimal_discard}</div>
          <div class="outs-card-val" style="color: var(--accent-emerald);">
            ${comp.best_outs} Outs (${comp.best_shanten === 0 ? 'Tenpai' : comp.best_shanten + '-Shanten'})
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
      advanceNextTurn();
    });
  }

  function hideFeedback() {
    const box = document.getElementById('feedback-box');
    if (box) box.style.display = 'none';
  }

  function renderEvaluationTable(evalData, highlightedDiscard) {
    const tbody = document.getElementById('discards-table-body');
    if (!tbody) return;

    if (evalData.is_winning_hand) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px 16px; font-size:1.1rem; color:var(--accent-gold);">
            🏆 <strong>恭喜胡牌！ (Round Complete)</strong><br/>
            <span style="font-size:0.88rem; color:var(--text-muted);">手牌已達胡牌條件，無需再進行打牌。點擊上方「再開一局」開啟新練習。</span>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = evalData.discards.map((d, index) => {
      const isHighlighted = (d.tile === highlightedDiscard);
      const isOpt = d.is_optimal;
      const shantenClass = d.shanten <= 0 ? 'shanten-0' : (d.shanten === 1 ? 'shanten-1' : 'shanten-2');

      return `
        <tr class="${isOpt ? 'row-optimal' : ''} ${isHighlighted ? 'row-user-selected' : ''}">
          <td>
            <span class="rank-badge ${index === 0 ? 'rank-1' : ''}">#${index + 1}</span>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="/static/tiles/${d.tile}.png" alt="${d.tile}" style="width:28px; height:36px; object-fit:contain;" />
              <div>
                <strong style="color:${isOpt ? 'var(--accent-emerald)' : '#fff'}">${d.chinese} (${d.tile})</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${d.jyutping}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="shanten-badge ${shantenClass}">
              ${d.shanten === 0 ? '🎯 聽牌 (Tenpai)' : `${d.shanten}向聽 (${d.shanten}-Shanten)`}
            </span>
          </td>
          <td>
            <strong style="font-size:1.1rem; color:var(--accent-gold);">${d.total_outs}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);"> (${d.unique_acceptance_count} types)</span>
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
        handleUserDiscard(e.currentTarget.dataset.tile);
      });
    });
  }

  async function advanceNextTurn() {
    if (!selectedDiscard) return;
    try {
      const res = await fetch('/api/next-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hand_tiles: currentHand,
          discard_tile: selectedDiscard,
          seat_wind: seatWind,
          prevailing_wind: prevailingWind
        })
      });
      const data = await res.json();
      currentHand = data.hand_tiles;
      newlyDrawnTile = data.drawn_tile;
      selectedDiscard = null;
      currentEvaluation = data.evaluation;
      renderHand();

      if (data.evaluation.is_winning_hand) {
        showVictory(data.evaluation);
      } else {
        renderEvaluationTable(data.evaluation);
        hideFeedback();
        sound.playTileClick();
      }
    } catch (err) {
      alert(err.message);
    }
  }

  function updateStats(isCorrect, outsDelta) {
    totalMoves++;
    if (isCorrect) {
      correctMoves++;
      currentStreak++;
    } else {
      currentStreak = 0;
    }

    const acc = Math.round((correctMoves / totalMoves) * 100);
    const accEl = document.getElementById('stat-accuracy');
    if (accEl) accEl.textContent = `${acc}%`;

    const streakEl = document.getElementById('stat-streak');
    if (streakEl) streakEl.textContent = `${currentStreak} 🔥`;

    const totalEl = document.getElementById('stat-total-moves');
    if (totalEl) totalEl.textContent = `${totalMoves}`;

    StorageManager.saveTrainerStats();
  }

  function addTileToCustomBuilder(code) {
    const count = customBuilderTiles.filter(t => t === code).length;
    if (count >= 4) {
      alert(`Cannot add more than 4 copies of tile ${code} in a standard 136-tile deck.`);
      return;
    }
    if (customBuilderTiles.length >= 14) {
      alert("Hand already contains 14 tiles. Click 'Clear' or remove a tile to adjust.");
      return;
    }
    customBuilderTiles.push(code);
    sound.playTileClick();
    renderCustomBuilderHand();
  }

  function renderCustomBuilderHand() {
    const container = document.getElementById('builder-hand-tiles');
    if (!container) return;

    container.innerHTML = customBuilderTiles.map((code, idx) => `
      <div class="tile-card" data-idx="${idx}" title="Click to remove">
        <img src="/static/tiles/${code}.png?v=4" alt="${code}" class="tile-img" />
        <span class="tile-label-zh">${code}</span>
      </div>
    `).join('');

    container.querySelectorAll('.tile-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        customBuilderTiles.splice(idx, 1);
        renderCustomBuilderHand();
      });
    });

    const countEl = document.getElementById('builder-count');
    if (countEl) countEl.textContent = `${customBuilderTiles.length}/14`;
  }

  async function loadStringIntoBuilder(str) {
    try {
      const res = await fetch('/api/parse-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input: str })
      });
      const data = await res.json();
      if (!data.success || data.tiles.length !== 14) {
        alert(data.errors.join('\n') || 'Invalid 14-tile notation.');
        return;
      }
      customBuilderTiles = [...data.tiles];
      const inputEl = document.getElementById('input-custom-hand');
      if (inputEl) inputEl.value = str;
      renderCustomBuilderHand();
      analyzeCustomBuilderHand();
    } catch (err) {
      alert(err.message);
    }
  }

  async function analyzeCustomBuilderHand() {
    if (customBuilderTiles.length !== 14) {
      alert(`A full hand analysis requires exactly 14 tiles (currently ${customBuilderTiles.length}). Add more tiles from the palette.`);
      return;
    }

    const seatWind = document.getElementById('builder-select-seat')?.value || '1z';
    const roundWind = document.getElementById('builder-select-round')?.value || '1z';

    try {
      const res = await fetch('/api/hand/analyze-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hand_tiles: customBuilderTiles,
          seat_wind: seatWind,
          prevailing_wind: roundWind
        })
      });
      const data = await res.json();

      const report = document.getElementById('builder-analysis-report');
      if (!report) return;
      report.style.display = 'block';

      // 1. Hand Diagnosis Card
      const diag = document.getElementById('builder-diagnosis-card');
      if (diag) {
        const shanten = data.current_shanten;
        const optDiscard = data.optimal_discard;
        const isWinning = data.is_winning_hand;

        diag.innerHTML = `
          <div class="feedback-header">
            <div class="feedback-title" style="color:var(--accent-gold); font-size:1.15rem;">
              ${isWinning ? '🏆 Hand is Already a Valid Winning Hand (胡牌狀態)!' : `📊 Current State: ${data.fan_assessment.shanten_label}`}
            </div>
            <span class="badge" style="background:var(--accent-gold); color:#111; font-weight:800;">
              Optimal Discard: ${optDiscard}
            </span>
          </div>

          <div style="font-size:0.92rem; line-height:1.6; margin-top:8px;">
            <p>
              ${isWinning 
                ? `<strong>胡牌牌型：</strong> ${data.winning_fan?.hand_name} (${data.winning_fan?.total_fan} 番 / Fan)` 
                : `<strong>最優打法：</strong> 打出【${data.tactical_lines[0]?.discard_chinese} (${optDiscard})】進張面最高（${data.tactical_lines[0]?.total_outs} 張有效進張）。`}
            </p>
          </div>
        `;
      }

      // 2. Structural Blocks Breakdown
      const blocksContainer = document.getElementById('builder-blocks-list');
      if (blocksContainer) {
        const blocks = data.blocks_data.blocks;
        if (blocks.length === 0) {
          blocksContainer.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No standard sequential runs or triplets detected yet (Scattered Disconnects).</div>`;
        } else {
          blocksContainer.innerHTML = blocks.map((b) => `
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
        linesContainer.innerHTML = data.tactical_lines.slice(0, 4).map((line) => `
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
              ${line.accepted_tiles.map((t) => `
                <span class="chip-tile">
                  <img src="/static/tiles/${t.tile}.png" style="width:14px; height:18px; object-fit:contain;" />
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
        tbody.innerHTML = data.full_discards.map((d, idx) => `
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
                ${d.accepted_tiles.map((t) => `
                  <span class="chip-tile" style="font-size:0.72rem; padding:2px 4px;">
                    ${t.tile} (${t.count})
                  </span>
                `).join('')}
              </div>
            </td>
            <td>
              <div style="font-size:0.78rem; color:var(--accent-cyan);">
                ${d.viable_paths.slice(0, 2).map((p) => p.name).join(', ')}
              </div>
            </td>
          </tr>
        `).join('');
      }

      report.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      alert(err.message);
    }
  }

  // =========================================================================
  // Rules Center & Worksheet Simulator (TVB 2026 Official Rules & Appendices)
  // =========================================================================
  const FAN_CONVERSION_TABLE = [
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

  const OFFICIAL_FAN_RULES = [
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

  const PENALTY_RULES = [
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

  let currentRulesLang = 'zh';
  const signatureCanvases = {};

  function initRulesCenter() {
    // Language toggle buttons
    const langBtns = document.querySelectorAll('.rules-lang-switch .btn-lang');
    langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const lang = target.getAttribute('data-lang');
        if (lang) {
          setRulesLanguage(lang);
        }
      });
    });

    // Rules Sub-Navigation Tabs
    const subnavBtns = document.querySelectorAll('.rules-nav-btn');
    subnavBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const paneId = target.getAttribute('data-pane');
        if (!paneId) return;

        subnavBtns.forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        document.querySelectorAll('.rules-section-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(paneId);
        if (pane) pane.classList.add('active');
        playTileClick();
      });
    });

    // Render Tables
    renderPenaltyTable();
    renderFanConversionTable();
    renderApprovedWinningHandsTable();

    // Populate Worksheet
    initWorksheetSimulator();
  }

  function setRulesLanguage(lang) {
    currentRulesLang = lang;
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
    renderPenaltyTable();
    renderFanConversionTable();
    renderApprovedWinningHandsTable();
  }

  function renderPenaltyTable() {
    const tbody = document.getElementById('rules-penalty-table-body');
    if (!tbody) return;

    tbody.innerHTML = PENALTY_RULES.map(p => {
      const violation = currentRulesLang === 'zh' ? p.violation_zh : p.violation_en;
      const penalty = currentRulesLang === 'zh' ? p.penalty_zh : p.penalty_en;
      
      let badgeHtml = '';
      if (p.severity === 'dq') {
        badgeHtml = `<span class="badge-penalty-dq">${currentRulesLang === 'zh' ? '取消資格' : 'Disqualify'}</span>`;
      } else if (p.severity === 'dead_hand') {
        badgeHtml = `<span class="badge-penalty-dead">${currentRulesLang === 'zh' ? '當盤陪打' : 'Dead Hand'}</span>`;
      } else {
        badgeHtml = `<span class="badge-penalty-pts">${currentRulesLang === 'zh' ? '罰減十分' : '-10 Pts'}</span>`;
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

  function renderFanConversionTable() {
    const tbody = document.getElementById('rules-conversion-table-body');
    if (!tbody) return;

    tbody.innerHTML = FAN_CONVERSION_TABLE.map(row => `
      <tr>
        <td style="text-align:center; font-weight:800; color:#fff; font-size:0.95rem;">
          ${row.fan} ${currentRulesLang === 'zh' ? '番' : 'Fan'}
        </td>
        <td style="text-align:center; font-weight:700; color:var(--accent-emerald);">+${row.normal_winner}</td>
        <td style="text-align:center; font-weight:700; color:#f87171;">${row.normal_shooter}</td>
        <td style="text-align:center; font-weight:700; color:var(--accent-emerald);">+${row.self_draw_winner}</td>
        <td style="text-align:center; font-weight:700; color:#f87171;">${row.self_draw_opponent}</td>
      </tr>
    `).join('');
  }

  function renderApprovedWinningHandsTable() {
    const tbody = document.getElementById('rules-fan-rules-table-body');
    if (!tbody) return;

    tbody.innerHTML = OFFICIAL_FAN_RULES.map(r => {
      const name = currentRulesLang === 'zh' ? r.name_zh : r.name_en;
      const def = currentRulesLang === 'zh' ? r.definition_zh : r.definition_en;

      let examplesHtml = '';
      if (r.example_tiles && r.example_tiles.length > 0) {
        examplesHtml = `
          <div style="display:flex; flex-wrap:wrap; gap:2px; margin-top:4px;">
            ${r.example_tiles.map(t => `
              <img src="/static/tiles/${t}.png?v=4" alt="${t}" style="width:20px; height:28px; object-fit:contain; background:#fff; border-radius:2px; border:1px solid #d1d5db;" />
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
              ${r.fan} ${currentRulesLang === 'zh' ? '番' : 'Fan'}
            </span>
          </td>
          <td style="font-size:0.85rem; color:#e5e7eb; line-height:1.5;">${def}</td>
          <td>${examplesHtml}</td>
        </tr>
      `;
    }).join('');
  }

  function initWorksheetSimulator() {
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
      const dealerIndex = (i - 1) % 4;
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

    tbody.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('input', () => recalculateWorksheetTotals());
    });

    document.getElementById('btn-load-sample-match')?.addEventListener('click', () => loadSampleMatchData());
    document.getElementById('btn-reset-worksheet')?.addEventListener('click', () => resetWorksheetData());
    document.getElementById('btn-print-scorecard')?.addEventListener('click', () => {
      window.print();
    });

    initSignaturePads();
  }

  function recalculateWorksheetTotals() {
    let sum1 = 0, sum2 = 0, sum3 = 0, sum4 = 0;

    document.querySelectorAll('#worksheet-hands-body tr').forEach(row => {
      const p1 = parseInt(row.querySelector('.ws-p1-delta')?.value || '0', 10);
      const p2 = parseInt(row.querySelector('.ws-p2-delta')?.value || '0', 10);
      const p3 = parseInt(row.querySelector('.ws-p3-delta')?.value || '0', 10);
      const p4 = parseInt(row.querySelector('.ws-p4-delta')?.value || '0', 10);

      sum1 += isNaN(p1) ? 0 : p1;
      sum2 += isNaN(p2) ? 0 : p2;
      sum3 += isNaN(p3) ? 0 : p3;
      sum4 += isNaN(p4) ? 0 : p4;
    });

    const setVal = (id, val) => {
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

  function loadSampleMatchData() {
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
        const typeInput = row.querySelector('.ws-hand-type');
        const fanSelect = row.querySelector('.ws-hand-fan');
        const p1Input = row.querySelector('.ws-p1-delta');
        const p2Input = row.querySelector('.ws-p2-delta');
        const p3Input = row.querySelector('.ws-p3-delta');
        const p4Input = row.querySelector('.ws-p4-delta');

        if (typeInput) typeInput.value = sh.type;
        if (fanSelect) fanSelect.value = sh.fan.toString();
        if (p1Input) p1Input.value = sh.p1.toString();
        if (p2Input) p2Input.value = sh.p2.toString();
        if (p3Input) p3Input.value = sh.p3.toString();
        if (p4Input) p4Input.value = sh.p4.toString();
      }
    });

    recalculateWorksheetTotals();
    playSuccess();
  }

  function resetWorksheetData() {
    if (!confirm('Are you sure you want to reset the entire tournament scorecard?')) return;

    document.querySelectorAll('#worksheet-hands-body tr').forEach(row => {
      const typeInput = row.querySelector('.ws-hand-type');
      const fanSelect = row.querySelector('.ws-hand-fan');
      const p1Input = row.querySelector('.ws-p1-delta');
      const p2Input = row.querySelector('.ws-p2-delta');
      const p3Input = row.querySelector('.ws-p3-delta');
      const p4Input = row.querySelector('.ws-p4-delta');

      if (typeInput) typeInput.value = '';
      if (fanSelect) fanSelect.value = '0';
      if (p1Input) p1Input.value = '0';
      if (p2Input) p2Input.value = '0';
      if (p3Input) p3Input.value = '0';
      if (p4Input) p4Input.value = '0';
    });

    recalculateWorksheetTotals();
    clearAllSignatures();
  }

  function initSignaturePads() {
    const canvasIds = ['sign-canvas-p1', 'sign-canvas-p2', 'sign-canvas-p3', 'sign-canvas-p4', 'sign-canvas-ref'];

    canvasIds.forEach(id => {
      const canvas = document.getElementById(id);
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

      const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
          return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        }
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };

      const startDraw = (e) => {
        e.preventDefault();
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e) => {
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

      signatureCanvases[id] = { canvas, ctx, drawing: false };
    });

    document.querySelectorAll('.btn-sign-clear').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const canvasId = target.getAttribute('data-canvas');
        if (canvasId && signatureCanvases[canvasId]) {
          const item = signatureCanvases[canvasId];
          item.ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
        }
      });
    });
  }

  function clearAllSignatures() {
    Object.values(signatureCanvases).forEach(item => {
      item.ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
    });
  }

  // =========================================================================
  // Feature: 4-Player Table Game Arena vs 3 AI Bots
  // =========================================================================
  let botGameId = null;
  let isBotProcessing = false;
  let isBotHudVisible = true;
  let autoStepTimer = null;

  function initBotGameListeners() {
    document.getElementById('btn-restart-bot-game')?.addEventListener('click', () => {
      startBotGame();
    });

    document.getElementById('btn-restart-tournament')?.addEventListener('click', () => {
      const podium = document.getElementById('bot-tournament-podium-modal');
      if (podium) podium.style.display = 'none';
      startBotGame();
    });

    document.getElementById('btn-toggle-bot-hud')?.addEventListener('click', () => {
      isBotHudVisible = !isBotHudVisible;
      const hudEl = document.getElementById('bot-efficiency-hud-panel');
      const textEl = document.getElementById('hud-toggle-text');
      if (hudEl) hudEl.style.display = isBotHudVisible ? 'block' : 'none';
      if (textEl) {
        textEl.textContent = isBotHudVisible ? 'ON' : 'OFF';
        textEl.style.color = isBotHudVisible ? '#60a5fa' : '#9ca3af';
      }
    });

    document.getElementById('btn-modal-next-hand')?.addEventListener('click', () => {
      const modal = document.getElementById('bot-round-end-modal');
      if (modal) modal.style.display = 'none';
      startNextBotHand();
    });

    document.getElementById('btn-claim-win')?.addEventListener('click', () => {
      sendBotClaimAction('WIN');
    });
    document.getElementById('btn-claim-pong')?.addEventListener('click', () => {
      sendBotClaimAction('PONG');
    });
    document.getElementById('btn-claim-kong')?.addEventListener('click', () => {
      sendBotClaimAction('KONG');
    });
    document.getElementById('btn-claim-pass')?.addEventListener('click', () => {
      sendBotClaimAction('PASS');
    });
  }

  async function startBotGame() {
    if (autoStepTimer) clearTimeout(autoStepTimer);
    try {
      const res = await fetch('/api/bot-game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      botGameId = data.game_id;
      renderBotGameState(data);
      sound.playTileClick();

      if (data.current_turn_index !== 1) {
        scheduleBotAutoStep();
      }
    } catch (err) {
      alert(`Error starting match: ${err.message}`);
    }
  }

  async function startNextBotHand() {
    if (!botGameId) return;
    try {
      const res = await fetch('/api/bot-game/next-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: botGameId })
      });
      const data = await res.json();
      renderBotGameState(data);
      sound.playTileClick();

      if (data.current_turn_index !== 1) {
        scheduleBotAutoStep();
      }
    } catch (err) {
      alert(`Error starting next hand: ${err.message}`);
    }
  }

  async function discardBotUserTile(tile) {
    if (!botGameId || isBotProcessing) return;
    isBotProcessing = true;
    sound.playTileClick();

    try {
      const res = await fetch('/api/bot-game/discard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: botGameId, tile })
      });
      const data = await res.json();
      renderBotGameState(data);
      isBotProcessing = false;

      if (!data.game_over && !data.waiting_for_user_claim && !data.waiting_for_user_discard) {
        scheduleBotAutoStep();
      }
    } catch (err) {
      isBotProcessing = false;
      alert(`Discard error: ${err.message}`);
    }
  }

  async function sendBotClaimAction(action, meld) {
    if (!botGameId) return;
    const bar = document.getElementById('bot-claim-actions-bar');
    if (bar) bar.style.display = 'none';

    try {
      const res = await fetch('/api/bot-game/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: botGameId, action, meld })
      });
      const data = await res.json();
      renderBotGameState(data);

      if (!data.game_over && !data.waiting_for_user_claim && !data.waiting_for_user_discard) {
        scheduleBotAutoStep();
      }
    } catch (err) {
      alert(`Claim error: ${err.message}`);
    }
  }

  function scheduleBotAutoStep() {
    if (autoStepTimer) clearTimeout(autoStepTimer);
    autoStepTimer = setTimeout(() => stepBotTurn(), 600);
  }

  async function stepBotTurn() {
    if (!botGameId || isBotProcessing) return;
    isBotProcessing = true;

    try {
      const res = await fetch('/api/bot-game/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: botGameId })
      });
      const data = await res.json();
      renderBotGameState(data);
      sound.playTileClick();
      isBotProcessing = false;

      if (!data.game_over && !data.waiting_for_user_claim && !data.waiting_for_user_discard) {
        scheduleBotAutoStep();
      }
    } catch (err) {
      isBotProcessing = false;
      console.error('Bot turn step error:', err);
    }
  }

  function renderBotGameState(state) {
    const roundBadge = document.getElementById('bot-game-round-badge');
    const wallCount = document.getElementById('bot-game-wall-count');
    const dealerBadge = document.getElementById('bot-game-dealer-badge');

    const windNames = { '1z': '東風圈 (East)', '2z': '南風圈 (South)', '3z': '西風圈 (West)', '4z': '北風圈 (North)' };
    if (roundBadge) roundBadge.textContent = `🀄 ${windNames[state.prevailing_wind] || '東風圈'} • Hand #${state.hand_number || 1}/16`;
    if (wallCount) wallCount.textContent = `${state.remaining_wall_count ?? 0}`;
    if (dealerBadge) dealerBadge.textContent = `庄 Dealer: ${state.players ? state.players[state.dealer_index]?.name : ''}`;

    const centerWind = document.getElementById('table-center-wind');
    const turnInd = document.getElementById('table-turn-indicator');
    if (centerWind) centerWind.textContent = (windNames[state.prevailing_wind] || '東風').split(' ')[0];
    if (turnInd) {
      const activeP = state.players ? state.players[state.current_turn_index] : null;
      turnInd.textContent = `Turn: ${activeP?.name || 'Player'} (${state.current_turn_index === 1 ? '👉 Your Move' : 'Thinking...'})`;
      turnInd.style.color = state.current_turn_index === 1 ? '#60a5fa' : '#9ca3af';
    }

    [0, 1, 2, 3].forEach(idx => {
      const p = state.players[idx];
      const badge = document.getElementById(`badge-p${idx}`);
      const score = document.getElementById(`score-p${idx}`);
      const seat = document.getElementById(`seat-p${idx}`);
      const dealerTag = document.getElementById(`dealer-tag-p${idx}`);
      const isDealer = (state.dealer_index === idx);

      if (dealerTag) {
        dealerTag.style.display = isDealer ? 'inline-block' : 'none';
      }

      if (badge) {
        if (state.current_turn_index === idx) {
          badge.classList.add('active-turn');
        } else {
          badge.classList.remove('active-turn');
        }
        if (isDealer) {
          badge.classList.add('is-dealer-station');
        } else {
          badge.classList.remove('is-dealer-station');
        }
      }
      if (score) score.textContent = `${p.score} pts`;
      if (seat) {
        const windMap = { '1z': '東', '2z': '南', '3z': '西', '4z': '北' };
        seat.textContent = windMap[p.seat_wind] || '東';
        if (isDealer) {
          seat.classList.add('dealer');
        } else {
          seat.classList.remove('dealer');
        }
      }

      const meldsContainer = document.getElementById(`melds-p${idx}`);
      if (meldsContainer) {
        meldsContainer.innerHTML = p.melds.map(m => {
          const isConcealed = m.type === 'concealed_kong';
          return `
            <div class="meld-group ${isConcealed ? 'concealed-kong-meld' : ''}" title="${m.type.toUpperCase()}">
              ${m.tiles.map((t, tIdx) => {
                const isHidden = isConcealed && (tIdx === 0 || tIdx === 3) && !state.game_over && idx !== 1;
                return `
                  <div class="meld-tile ${isHidden ? 'meld-tile-hidden' : ''}">
                    ${isHidden 
                      ? '<div class="bot-tile-back" style="width:100%; height:100%; border-radius:2px;"></div>' 
                      : `<img src="/static/tiles/${t}.png?v=4" alt="${t}" />`}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('');
      }
    });

    [0, 1, 2, 3].forEach(idx => {
      const riverBox = document.getElementById(`river-p${idx}`);
      if (riverBox) {
        const p = state.players[idx];
        riverBox.innerHTML = p.river.map((item, rIdx) => {
          const isLast = (state.last_discard?.player_index === idx && rIdx === p.river.length - 1);
          return `
            <div class="river-tile-chip ${isLast ? 'last-discard' : ''}" title="${item.tile}">
              <img src="/static/tiles/${item.tile}.png?v=4" alt="${item.tile}" />
            </div>
          `;
        }).join('');
      }
    });

    const userRack = document.getElementById('bot-user-tiles-rack');
    if (userRack) {
      const userTiles = state.players[1]?.hand_tiles || [];
      const isUserTurn = (state.current_turn_index === 1 && (userTiles.length % 3 === 2 || state.waiting_for_user_discard));

      userRack.innerHTML = userTiles.map((t, idx) => {
        const isDrawn = ((userTiles.length % 3 === 2) && state.current_turn_index === 1 && (state.drawn_tile ? (t === state.drawn_tile && idx === userTiles.lastIndexOf(t)) : idx === userTiles.length - 1));
        return `
          <div class="user-interactive-tile ${isDrawn ? 'drawn-tile' : ''}" data-tile="${t}" title="Click to discard ${t}">
            <span class="tile-name-label">${t}</span>
            <img src="/static/tiles/${t}.png?v=4" alt="${t}" />
            <span style="font-size:0.6rem; color:#6b7280;">${isDrawn ? 'DRAW' : ''}</span>
          </div>
        `;
      }).join('');

      userRack.querySelectorAll('.user-interactive-tile').forEach(el => {
        el.addEventListener('click', (e) => {
          if (!isUserTurn) return;
          const tile = e.currentTarget.getAttribute('data-tile');
          if (tile) {
            discardBotUserTile(tile);
          }
        });
      });
    }

    const claimBar = document.getElementById('bot-claim-actions-bar');
    const claimPrompt = state.user_claim_prompt;
    if (claimBar) {
      if (state.waiting_for_user_claim && claimPrompt) {
        claimBar.style.display = 'flex';
        const winBtn = document.getElementById('btn-claim-win');
        const pongBtn = document.getElementById('btn-claim-pong');
        const kongBtn = document.getElementById('btn-claim-kong');
        const chowBtn = document.getElementById('btn-claim-chow');
        const fanBadge = document.getElementById('claim-win-fan-badge');

        if (winBtn) {
          winBtn.style.display = claimPrompt.can_win ? 'inline-flex' : 'none';
          if (fanBadge) fanBadge.textContent = `${claimPrompt.win_fan || 1}番`;
          if (claimPrompt.is_self_draw) {
            winBtn.innerHTML = `🀄 自摸 (Self-Draw) <span class="badge" style="background:#fff; color:#b91c1c; font-size:0.75rem;">${claimPrompt.win_fan || 1}番</span>`;
          } else {
            winBtn.innerHTML = `🀄 胡 (Win / Ron) <span class="badge" style="background:#fff; color:#b91c1c; font-size:0.75rem;">${claimPrompt.win_fan || 1}番</span>`;
          }
        }
        if (pongBtn) pongBtn.style.display = claimPrompt.can_pong ? 'inline-flex' : 'none';
        if (kongBtn) kongBtn.style.display = claimPrompt.can_kong ? 'inline-flex' : 'none';
        if (chowBtn) chowBtn.style.display = claimPrompt.can_chow ? 'inline-flex' : 'none';
      } else {
        claimBar.style.display = 'none';
      }
    }

    const hud = state.user_efficiency_hud;
    if (hud) {
      const hudShanten = document.getElementById('hud-shanten-badge');
      const hudOptText = document.getElementById('hud-optimal-discard-text');
      const hudOutsChips = document.getElementById('hud-live-outs-chips');

      if (hudShanten) {
        const sVal = hud.best_shanten !== undefined ? hud.best_shanten : (hud.shanten !== undefined ? hud.shanten : 0);
        hudShanten.textContent = sVal === 0 ? '🎯 Tenpai (聽牌)' : (sVal === -1 ? '🎉 Complete (胡牌)' : `${sVal}-Shanten (${sVal}向聽)`);
        hudShanten.className = `shanten-badge shanten-${Math.max(0, sVal)}`;
      }
      if (hudOptText) {
        if (hud.optimal_discard) {
          hudOptText.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="/static/tiles/${hud.optimal_discard}.png?v=4" style="width:24px; height:32px; object-fit:contain; background:#fff; border-radius:2px;" />
              <span>Discard <strong>${hud.optimal_discard}</strong> (${hud.max_outs || 0} live outs left in wall)</span>
            </div>
          `;
        } else {
          const sVal = hud.best_shanten !== undefined ? hud.best_shanten : (hud.shanten !== undefined ? hud.shanten : 0);
          if (sVal === -1) {
            hudOptText.textContent = '🎉 Hand is complete! You can declare Win (胡/自摸).';
          } else if (sVal === 0) {
            hudOptText.textContent = '🎯 Hand in Tenpai! Waiting on winning tiles.';
          } else {
            hudOptText.textContent = '⏳ Waiting for your draw to recommend optimal discard...';
          }
        }
      }
      if (hudOutsChips && hud.accepted_tiles) {
        hudOutsChips.innerHTML = hud.accepted_tiles.map(t => `
          <span class="chip-tile" style="font-size:0.75rem; padding:2px 6px;">
            <img src="/static/tiles/${t.tile}.png?v=4" style="width:14px; height:18px; object-fit:contain;" />
            ${t.tile} <strong style="color:var(--accent-gold);">(${t.count})</strong>
          </span>
        `).join('');
      }
    }

    const logBox = document.getElementById('bot-match-log-ticker');
    if (logBox && state.match_logs) {
      logBox.innerHTML = state.match_logs.map(l => `<div>${l}</div>`).join('');
      logBox.scrollTop = logBox.scrollHeight;
    }

    const endModal = document.getElementById('bot-round-end-modal');
    if (endModal && state.game_over && state.winner_info) {
      endModal.style.display = 'flex';
      const w = state.winner_info;

      const iconEl = document.getElementById('modal-winner-icon');
      const titleEl = document.getElementById('modal-winner-title');
      const handNameEl = document.getElementById('modal-hand-name');
      const rackEl = document.getElementById('modal-winning-hand-rack');
      const breakdownEl = document.getElementById('modal-fan-breakdown-box');
      const pointsEl = document.getElementById('modal-points-delta-table');

      if (w.is_exhaust_draw) {
        if (iconEl) iconEl.textContent = '🤝';
        if (titleEl) titleEl.textContent = '摸和流局 (Exhaust Draw)';
        if (handNameEl) handNameEl.textContent = 'Wall Depleted - Dealer Passes (過莊)';
        if (rackEl) rackEl.innerHTML = '';
        if (breakdownEl) breakdownEl.innerHTML = 'Zero points exchanged. Proceeding to next round.';
        if (pointsEl) pointsEl.innerHTML = '';
      } else {
        const isUserWinner = (w.winner_index === 1);
        if (iconEl) iconEl.textContent = isUserWinner ? '🏆🎉' : '💥';
        if (titleEl) titleEl.textContent = `${w.winner_name} ${w.is_self_draw ? '自摸胡牌 (Self-Draw)!' : '出銃胡牌 (Ron Win)!'}`;
        if (handNameEl) handNameEl.textContent = `${w.hand_name} (${w.fan} 番 / Fan)`;

        if (rackEl && w.winning_hand) {
          rackEl.innerHTML = w.winning_hand.map(t => `
            <img src="/static/tiles/${t}.png?v=4" alt="${t}" style="width:26px; height:36px; object-fit:contain; background:#fff; border-radius:3px;" />
          `).join('');
        }

        if (breakdownEl && w.breakdown) {
          breakdownEl.innerHTML = `
            <ul style="list-style:none; padding:0;">
              ${w.breakdown.map(b => `
                <li style="display:flex; justify-content:space-between; padding:2px 0;">
                  <span>${b.name} (${b.jyutping})</span>
                  <strong style="color:var(--accent-gold);">+${b.fan} 番</strong>
                </li>
              `).join('')}
            </ul>
          `;
        }

        if (pointsEl && w.point_delta) {
          pointsEl.innerHTML = state.players.map((p, pIdx) => {
            const delta = w.point_delta[pIdx];
            const color = delta > 0 ? 'var(--accent-emerald)' : (delta < 0 ? '#ef4444' : '#9ca3af');
            return `
              <div style="background:rgba(0,0,0,0.3); padding:6px; border-radius:6px;">
                <div style="font-size:0.75rem; color:#9ca3af;">${p.name}</div>
                <div style="color:${color}; font-size:1.1rem;">${delta > 0 ? `+${delta}` : delta} pts</div>
              </div>
            `;
          }).join('');
        }

        if (isUserWinner) {
          sound.playSuccess();
        } else {
          sound.playWarning();
        }
      }
    }
  }

  // =========================================================================
  // Fan Quiz Drill & Master Trainer (TVB 2026 Ruleset)
  // =========================================================================
  let currentQuizPuzzle = null;
  let selectedQuizFan = null;
  const selectedQuizPatterns = new Set();
  let quizDifficulty = 'all';
  let quizStreak = 0;
  let quizBestStreak = 0;
  let quizCorrectCount = 0;
  let quizTotalAnswered = 0;

  function initFanQuizTrainer() {
    const btnModeQuiz = document.getElementById('btn-fan-mode-quiz');
    const btnModeCustom = document.getElementById('btn-fan-mode-custom');
    const paneQuiz = document.getElementById('fan-pane-quiz');
    const paneCustom = document.getElementById('fan-pane-custom');

    btnModeQuiz?.addEventListener('click', () => {
      btnModeQuiz.className = 'btn btn-primary';
      btnModeCustom.className = 'btn btn-secondary';
      if (paneQuiz) paneQuiz.style.display = 'block';
      if (paneCustom) paneCustom.style.display = 'none';
      sound.playTileClick();
    });

    btnModeCustom?.addEventListener('click', () => {
      btnModeCustom.className = 'btn btn-primary';
      btnModeQuiz.className = 'btn btn-secondary';
      if (paneQuiz) paneQuiz.style.display = 'none';
      if (paneCustom) paneCustom.style.display = 'block';
      sound.playTileClick();
    });

    document.querySelectorAll('.btn-fan-diff').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-fan-diff').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        quizDifficulty = e.currentTarget.getAttribute('data-diff') || 'all';
        sound.playTileClick();
        loadNewFanQuizPuzzle();
      });
    });

    document.querySelectorAll('.btn-fan-num').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fanVal = parseInt(e.currentTarget.getAttribute('data-fan') || '0', 10);
        selectQuizFanNumber(fanVal);
      });
    });

    document.getElementById('btn-quiz-submit')?.addEventListener('click', () => {
      submitFanQuizAnswer();
    });

    document.getElementById('btn-quiz-next-puzzle')?.addEventListener('click', () => {
      sound.playTileClick();
      loadNewFanQuizPuzzle();
    });
    document.getElementById('btn-quiz-next-after-result')?.addEventListener('click', () => {
      sound.playTileClick();
      loadNewFanQuizPuzzle();
    });

    document.querySelectorAll('.btn-custom-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.getAttribute('data-preset');
        const input = document.getElementById('input-fan-tiles');
        if (input && preset) {
          input.value = preset;
          sound.playTileClick();
          calculateCurrentFan();
        }
      });
    });

    document.getElementById('btn-calculate-fan')?.addEventListener('click', () => {
      calculateCurrentFan();
    });

    const streakEl = document.getElementById('fan-quiz-streak');
    const bestEl = document.getElementById('fan-quiz-best');
    const accEl = document.getElementById('fan-quiz-acc');
    const fracEl = document.getElementById('fan-quiz-score-fraction');
    if (streakEl) streakEl.textContent = quizStreak.toString();
    if (bestEl) bestEl.textContent = quizBestStreak.toString();
    if (accEl) accEl.textContent = quizTotalAnswered > 0 ? `${Math.round((quizCorrectCount / quizTotalAnswered) * 100)}%` : '0%';
    if (fracEl) fracEl.textContent = `${quizCorrectCount}/${quizTotalAnswered}`;

    loadNewFanQuizPuzzle();
  }

  async function loadNewFanQuizPuzzle() {
    try {
      const res = await fetch(`/api/fan-quiz/puzzle?difficulty=${quizDifficulty}`);
      const puzzle = await res.json();
      currentQuizPuzzle = puzzle;
      selectedQuizFan = null;
      selectedQuizPatterns.clear();

      document.querySelectorAll('.btn-fan-num').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255, 255, 255, 0.08)';
        b.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        b.style.color = '#ffffff';
        b.style.boxShadow = 'none';
        b.style.transform = 'none';
        b.style.fontWeight = '700';
      });

      const fbCard = document.getElementById('quiz-feedback-card');
      if (fbCard) fbCard.style.display = 'none';

      const winBadge = document.getElementById('quiz-win-type-badge');
      if (winBadge) {
        winBadge.textContent = puzzle.is_self_draw ? '🀄 自摸 (Self-Draw)' : '🀄 食胡 (Ron Win)';
        winBadge.style.background = puzzle.is_self_draw ? 'var(--c-ruby-ring)' : 'var(--c-blue-diamond)';
      }

      const windNames = { '1z': '東風 (1z)', '2z': '南風 (2z)', '3z': '西風 (3z)', '4z': '北風 (4z)' };
      const roundBadge = document.getElementById('quiz-round-wind-badge');
      if (roundBadge) roundBadge.textContent = `圈風 (Round): ${windNames[puzzle.prevailing_wind] || puzzle.prevailing_wind}`;

      const seatBadge = document.getElementById('quiz-seat-wind-badge');
      if (seatBadge) seatBadge.textContent = `門風 (Seat): ${windNames[puzzle.seat_wind] || puzzle.seat_wind}`;

      const diffTag = document.getElementById('quiz-diff-tag');
      if (diffTag) diffTag.textContent = puzzle.difficulty_label;

      const rack = document.getElementById('quiz-hand-tiles-rack');
      if (rack) {
        rack.innerHTML = puzzle.hand_tiles.map((t, idx) => {
          const isWinTile = (t === puzzle.winning_tile && idx === puzzle.hand_tiles.lastIndexOf(t));
          return `
            <div class="quiz-tile-card ${isWinTile ? 'is-winning' : ''}" title="${t}">
              ${isWinTile ? '<span class="win-badge">WIN</span>' : ''}
              <img src="/static/tiles/${t}.png?v=4" alt="${t}" style="width:36px; height:48px; object-fit:contain;" />
              <span style="font-size:0.65rem; color:#475569; font-weight:700;">${t}</span>
            </div>
          `;
        }).join('');
      }

      const chipsGrid = document.getElementById('quiz-patterns-chips-grid');
      if (chipsGrid) {
        chipsGrid.innerHTML = puzzle.available_patterns.map(p => `
          <div class="quiz-pattern-chip" data-pid="${p.id}">
            <span class="chip-chk">⬜</span>
            <strong>${p.name_zh}</strong>
            <span style="font-size:0.75rem; opacity:0.8;">(+${p.fan}番)</span>
          </div>
        `).join('');

        chipsGrid.querySelectorAll('.quiz-pattern-chip').forEach(chip => {
          chip.addEventListener('click', (e) => {
            const pid = e.currentTarget.getAttribute('data-pid');
            toggleQuizPattern(pid, e.currentTarget);
          });
        });
      }

    } catch (err) {
      console.error('Failed to load fan quiz puzzle:', err);
    }
  }

  function selectQuizFanNumber(fan) {
    selectedQuizFan = fan;
    document.querySelectorAll('.btn-fan-num').forEach(btn => {
      const bFan = parseInt(btn.getAttribute('data-fan') || '0', 10);
      if (bFan === fan) {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #076cc0 0%, #034b87 100%)';
        btn.style.borderColor = '#38bdf8';
        btn.style.color = '#ffffff';
        btn.style.boxShadow = '0 0 18px rgba(56, 189, 248, 0.85)';
        btn.style.transform = 'scale(1.1) translateY(-2px)';
        btn.style.fontWeight = '800';
      } else {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255, 255, 255, 0.08)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        btn.style.color = '#ffffff';
        btn.style.boxShadow = 'none';
        btn.style.transform = 'none';
        btn.style.fontWeight = '700';
      }
    });
    sound.playTileClick();
  }

  function toggleQuizPattern(pid, chipEl) {
    if (selectedQuizPatterns.has(pid)) {
      selectedQuizPatterns.delete(pid);
      chipEl.classList.remove('active');
      chipEl.querySelector('.chip-chk').textContent = '⬜';
      chipEl.style.background = 'rgba(255, 255, 255, 0.06)';
      chipEl.style.borderColor = 'rgba(255, 255, 255, 0.18)';
      chipEl.style.color = '#e5e7eb';
      chipEl.style.boxShadow = 'none';
    } else {
      selectedQuizPatterns.add(pid);
      chipEl.classList.add('active');
      chipEl.querySelector('.chip-chk').textContent = '✅';
      chipEl.style.background = 'rgba(16, 185, 129, 0.25)';
      chipEl.style.borderColor = '#34d399';
      chipEl.style.color = '#34d399';
      chipEl.style.boxShadow = '0 0 12px rgba(52, 211, 153, 0.45)';
    }
    sound.playTileClick();
  }

  async function submitFanQuizAnswer() {
    if (selectedQuizFan === null) {
      alert('Please select the total Fan count in Step 1 (請先選擇總番數).');
      return;
    }
    if (!currentQuizPuzzle) return;

    try {
      const payload = {
        hand_tiles: currentQuizPuzzle.hand_tiles,
        winning_tile: currentQuizPuzzle.winning_tile,
        is_self_draw: currentQuizPuzzle.is_self_draw,
        prevailing_wind: currentQuizPuzzle.prevailing_wind,
        seat_wind: currentQuizPuzzle.seat_wind,
        user_fan: selectedQuizFan,
        user_patterns: Array.from(selectedQuizPatterns)
      };

      const res = await fetch('/api/fan-quiz/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      quizTotalAnswered++;
      if (data.is_correct_fan) {
        quizStreak++;
        quizCorrectCount++;
        quizBestStreak = Math.max(quizBestStreak, quizStreak);
        sound.playSuccess();
      } else {
        quizStreak = 0;
        sound.playSuboptimal();
      }

      const streakEl = document.getElementById('fan-quiz-streak');
      const bestEl = document.getElementById('fan-quiz-best');
      const accEl = document.getElementById('fan-quiz-acc');
      const fracEl = document.getElementById('fan-quiz-score-fraction');

      if (streakEl) streakEl.textContent = quizStreak.toString();
      if (bestEl) bestEl.textContent = quizBestStreak.toString();
      if (accEl) accEl.textContent = `${Math.round((quizCorrectCount / quizTotalAnswered) * 100)}%`;
      if (fracEl) fracEl.textContent = `${quizCorrectCount}/${quizTotalAnswered}`;

      StorageManager.saveQuizStats();

      const fbCard = document.getElementById('quiz-feedback-card');
      const resHeader = document.getElementById('quiz-result-header');
      const formulaText = document.getElementById('quiz-formula-text');
      const breakdownList = document.getElementById('quiz-breakdown-list');
      const payoutSummary = document.getElementById('quiz-payout-summary');

      if (fbCard && resHeader && formulaText && breakdownList && payoutSummary) {
        fbCard.style.display = 'block';
        if (data.is_correct_fan) {
          resHeader.innerHTML = `
            <span style="color:#34d399;">🎉 答對了！(Correct!)</span>
            <span class="badge" style="background:rgba(52,211,153,0.2); border:1px solid #34d399; color:#34d399; font-size:0.9rem;">
              ${data.actual_fan} 番 • ${data.hand_name}
            </span>
          `;
        } else {
          resHeader.innerHTML = `
            <span style="color:#f87171;">❌ 算錯了！(Incorrect)</span>
            <span class="badge" style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; font-size:0.9rem;">
              你選了 ${data.user_fan} 番，正確為 ${data.actual_fan} 番 (${data.hand_name})
            </span>
          `;
        }

        formulaText.textContent = data.formula;

        if (data.breakdown && data.breakdown.length > 0) {
          breakdownList.innerHTML = data.breakdown.map(b => `
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

    } catch (err) {
      alert(`Submission error: ${err.message}`);
    }
  }

  async function calculateCurrentFan() {
    const input = document.getElementById('input-fan-tiles')?.value;
    const isSelfDraw = document.getElementById('check-self-draw')?.checked || false;
    const seatWind = document.getElementById('custom-fan-select-seat')?.value || '1z';
    const roundWind = document.getElementById('custom-fan-select-round')?.value || '1z';

    try {
      const res = await fetch('/api/fan-counter/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiles: (await (await fetch('/api/parse-hand', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_input: input })
          })).json()).tiles,
          seat_wind: seatWind,
          prevailing_wind: roundWind,
          is_self_draw: isSelfDraw
        })
      });
      const fanRes = await res.json();
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
              ${fanRes.breakdown.map((b) => `
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
    } catch (err) {
      alert(err.message);
    }
  }

  // =========================================================================
  // Defense Center & Push/Fold Masterclass (Hong Kong Mahjong Ruleset)
  // =========================================================================
  // Defense & Push/Fold Center Module (Bilingual Support EN/ZH)
  // =========================================================================
  let currentDefensePuzzle = null;
  let selectedDefenseTile = null;
  let selectedPushFoldChoice = null;
  let defenseScenarioType = 'betaori';
  let defenseStreak = 0;
  let defenseBestStreak = 0;
  let defenseCorrectCount = 0;
  let defenseTotalCount = 0;
  let defenseLanguage = 'en';

  const DEFENSE_I18N = {
    en: {
      title: "🛡️ Hong Kong Mahjong Defense & Push/Fold Center",
      desc: "Master the supreme art of defense in Hong Kong Mahjong: Genbutsu (跟打熟牌), Suji Theory (筋牌法則 1-4-7/2-5-8/3-6-9), Kabe (壁牌/斷門), Withholding dangerous live honors, and TVB Push/Fold (攻守轉折點) decision-making.",
      modeDrills: "🎯 Defense Scenario Drills",
      modeTheory: "📚 Defensive Theory Masterclass",
      scenarioLabel: "Scenario Type:",
      scenarioBetaori: "🛡️ Full Betaori Safe Discard",
      scenarioPushFold: "⚖️ Push vs Fold Decision",
      threatPrefix: "⚠️ Threat Level:",
      estimatedFan: (f) => `Estimated Value: ${f}+ Fan`,
      targetPlayer: (name) => `Target: ${name}`,
      oppHeader: "Opponent's Exposed Melds & Table Discards:",
      meldsLabel: "Melds:",
      riverLabel: "River:",
      noMelds: "(Concealed Hand / 0 Melds)",
      nextScenario: "🔄 Next Scenario",
      handPromptBetaori: "Your 14-Tile Hand — Click on your safest defensive discard:",
      handPromptPushFold: "Your Hand — Evaluate value vs opponent threat and choose tactical move:",
      btnPush: "⚔️ PUSH (Attack / Tenpai)",
      btnMawashi: "⚖️ MAWASHI (Defensive Weaving)",
      btnFold: "🛡️ FOLD (Full Betaori)",
      btnSubmit: "🎯 Confirm Defensive Decision",
      nextAfterResult: "Next Scenario ➡️",
      heatmapHeader: "📊 Hand Tile Danger Ranking Heatmap (Safest → Most Dangerous):",
      dangerScore: (s) => `Danger: ${s}/10`,
      correctTitle: "🎉 Correct Decision!",
      dangerTitle: "❌ Dangerous Decision (Deal-In Risk)!",
      optimalStrategy: (opt) => `Optimal Defensive Play: ${opt}`,
      userVsOptimal: (u, opt) => `Your Choice: ${u} • Optimal Play: ${opt}`,
      selectTileAlert: "Please click on a tile in your hand to discard.",
      selectPostureAlert: "Please select a tactical posture (PUSH, MAWASHI, or FOLD).",
      theoryCards: [
        {
          icon: "🀄",
          title: "1. Genbutsu & Dead Honor Discards",
          content: `<strong>Genbutsu (跟打現物):</strong> Any tile already discarded by the threatening opponent has a strict 0% chance of dealing into them (Ron).<br/>
<strong>3-Dead / 4-Dead Honors (三見/四見字牌):</strong> Honor tiles (Winds & Dragons) with 3 or 4 copies visible on table cannot form triplets or pairs — 95%~100% safe!<br/>
<strong>Live Honors (生張字牌 - Extreme Danger):</strong> If opponent shows Half-Flush or 2+ melds, NEVER discard 0-visible Dragons or Seat Winds!`
        },
        {
          icon: "📏",
          title: "2. Suji Defensive Theory (1-4-7 / 2-5-8 / 3-6-9)",
          content: `<strong>Outer Suji (表筋):</strong> If an opponent discarded 4, then 1 and 7 cannot be won on via 2-3 or 5-6 two-sided sequence waits!<br/>
• Opponent discarded 4-Character $\\implies$ 1-Character & 7-Character are relatively safe.<br/>
• Opponent discarded 5-Dot $\\implies$ 2-Dot & 8-Dot are relatively safe.<br/>
• Opponent discarded 6-Bamboo $\\implies$ 3-Bamboo & 9-Bamboo are relatively safe.<br/>
<strong>Double Suji (雙筋):</strong> If both 1 and 7 have been discarded, the middle 4 becomes Double Suji (much safer than unsuited tiles).`
        },
        {
          icon: "🧱",
          title: "3. Kabe & Wall Reading (No-Chance / One-Chance)",
          content: `<strong>No-Chance (壁牌 / 斷門):</strong> If all 4 copies of a tile are visible on the table (e.g. all four 7-Dots are seen), the opponent CANNOT hold 7-8 waiting on 6-9, or 6-7 waiting on 5-8!<br/>
• 4x 7-Dots visible $\\implies$ 8-Dot and 9-Dot are safe from two-sided waits.<br/>
• 4x 3-Characters visible $\\implies$ 1-Character and 2-Character are extremely safe.<br/>
<strong>One-Chance:</strong> 3 copies visible cut terminal wait probabilities in half.`
        },
        {
          icon: "⚖️",
          title: "4. TVB Full Gun-Loss Push/Fold Matrix",
          content: `<strong>Full Gun-Loss Rule (全銃制):</strong> In TVB HK rules, the discarder pays the ENTIRE loss alone ($-10 \\times \\text{Fan}$).<br/>
• <strong>PUSH (進攻):</strong> Hand is in Tenpai (0-Shanten) with 3+ Fan value.<br/>
• <strong>MAWASHI (兜牌):</strong> 1-Shanten high-value hand — only discard safe Suji/Genbutsu while preserving winning draws.<br/>
• <strong>FOLD (Betaori / 完全棄和):</strong> 2-Shanten or worse against 2+ exposed melds or dealer threat — 100% discard safe tiles!`
        }
      ]
    },
    zh: {
      title: "🛡️ Hong Kong Mahjong 防守與攻守判斷特訓中心",
      desc: "精通香港麻雀全銃制防大牌必備神技：跟打熟牌 (Genbutsu)、筋牌法則 (Suji 1-4-7/2-5-8/3-6-9)、壁牌斷門 (Kabe)、死扣生張字牌與同門牌，以及 TVB 大賽攻守轉折點 (Push/Fold) 決策。",
      modeDrills: "🎯 防守實戰測驗 (Defense Drills)",
      modeTheory: "📚 防守理論大師庫 (Theory Masterclass)",
      scenarioLabel: "情境類型 (Scenario):",
      scenarioBetaori: "🛡️ 完全棄和找熟牌 (Betaori)",
      scenarioPushFold: "⚖️ 攻守轉折點抉擇 (Push vs Fold)",
      threatPrefix: "⚠️ 威脅等級:",
      estimatedFan: (f) => `大牌預警: ${f}+ 番`,
      targetPlayer: (name) => `威脅目標: ${name}`,
      oppHeader: "對手副露與牌河 (Opponent Melds & Discards):",
      meldsLabel: "副露:",
      riverLabel: "牌河:",
      noMelds: "(門清 Concealed / 無副露)",
      nextScenario: "🔄 換一題 (Next)",
      handPromptBetaori: "你的 14 張手牌 — 點選你手中最安全的防守捨牌:",
      handPromptPushFold: "手牌 — 評估手牌價值與對手威脅，選擇攻守方針:",
      btnPush: "⚔️ PUSH (進攻 / 押牌)",
      btnMawashi: "⚖️ MAWASHI (兜牌 / 兼顧牌效)",
      btnFold: "🛡️ FOLD (完全棄和 / Betaori)",
      btnSubmit: "🎯 驗證防守決策 (Confirm Decision)",
      nextAfterResult: "進入下一情境 ➡️",
      heatmapHeader: "📊 手中牌張危險度天梯表 (由安全到最危險):",
      dangerScore: (s) => `危險值: ${s}/10`,
      correctTitle: "🎉 防守成功！(Correct Decision!)",
      dangerTitle: "❌ 出銃高危警報！(Dangerous Decision)",
      optimalStrategy: (opt) => `最優防守策略: ${opt}`,
      userVsOptimal: (u, opt) => `你的選擇: ${u} • 最優解: ${opt}`,
      selectTileAlert: "請先點選一張防守捨牌。",
      selectPostureAlert: "請選擇攻守方針 (PUSH、MAWASHI 或 FOLD)。",
      theoryCards: [
        {
          icon: "🀄",
          title: "1. 跟打熟牌與現物 (Genbutsu)",
          content: `<strong>現物（跟打熟牌）：</strong>對手牌河中已經打過的牌，向其出銃率為 0%。<br/>
<strong>三見/四見字牌：</strong>牌桌上已見 3 張或 4 張的字牌（東南西北中發白），絕不可能成刻或成對，防守安全性高達 95%~100%！<br/>
<strong>生張字牌（極度危險）：</strong>若對手已亮混一色或兩副露，絕不可輕出 0 見的生張中發白或門風！`
        },
        {
          icon: "📏",
          title: "2. 筋牌防守法則 (Suji 1-4-7 / 2-5-8 / 3-6-9)",
          content: `<strong>表筋（外筋）：</strong>若對手打過 4，則 1 與 7 不會被 23 或 56 的兩面順子聽牌！<br/>
• 打過 4 萬 $\\implies$ 1 萬、7 萬相對安全。<br/>
• 打過 5 筒 $\\implies$ 2 筒、8 筒相對安全。<br/>
• 打過 6 索 $\\implies$ 3 索、9 索相對安全。<br/>
<strong>雙筋：</strong>若 1 與 7 皆已打出，中張 4 為雙筋，安全性大幅提升。`
        },
        {
          icon: "🧱",
          title: "3. 壁牌與斷門理論 (Kabe / No-Chance)",
          content: `<strong>No-Chance（斷牌）：</strong>若某張牌在牌桌上已見 4 張（如四張 7 筒全現），則對手不可能持有 78 聽 69 或 67 聽 58！<br/>
• 斷 7 筒 $\\implies$ 8 筒、9 筒為無筋安全牌。<br/>
• 斷 3 萬 $\\implies$ 1 萬、2 萬極度安全。<br/>
<strong>One-Chance：</strong>已見 3 張，危險度減半。`
        },
        {
          icon: "⚖️",
          title: "4. TVB 全銃制攻守轉折點 (Push / Fold)",
          content: `<strong>全銃制原則：</strong>TVB 大賽放銃者需全額承擔失分（$-10\\times\\text{番數}$）。<br/>
• <strong>進攻（Push）：</strong>手牌已聽牌（0向聽）且有 3+ 番價值。<br/>
• <strong>兜牌（Mawashi）：</strong>一向聽大牌，只出安全牌或筋牌保留進張。<br/>
• <strong>完全棄和（Betaori）：</strong>二向聽以上，對手已開兩副露或大牌，100% 跟打熟牌！`
        }
      ]
    }
  };

  function setDefenseLanguage(lang) {
    defenseLanguage = lang;
    const btnEn = document.getElementById('btn-defense-lang-en');
    const btnZh = document.getElementById('btn-defense-lang-zh');
    if (btnEn && btnZh) {
      if (lang === 'en') {
        btnEn.className = 'btn btn-primary';
        btnZh.className = 'btn btn-secondary';
      } else {
        btnZh.className = 'btn btn-primary';
        btnEn.className = 'btn btn-secondary';
      }
    }

    const t = DEFENSE_I18N[lang] || DEFENSE_I18N.en;

    const titleEl = document.getElementById('defense-section-title');
    if (titleEl) titleEl.textContent = t.title;
    const descEl = document.getElementById('defense-section-desc');
    if (descEl) descEl.textContent = t.desc;

    const btnModeDrills = document.getElementById('btn-defense-mode-drills');
    if (btnModeDrills) btnModeDrills.textContent = t.modeDrills;
    const btnModeTheory = document.getElementById('btn-defense-mode-theory');
    if (btnModeTheory) btnModeTheory.textContent = t.modeTheory;

    const scenLabel = document.getElementById('defense-scenario-label');
    if (scenLabel) scenLabel.textContent = t.scenarioLabel;
    const btnBetaori = document.getElementById('btn-defense-scenario-betaori');
    if (btnBetaori) btnBetaori.textContent = t.scenarioBetaori;
    const btnPushFold = document.getElementById('btn-defense-scenario-pushfold');
    if (btnPushFold) btnPushFold.textContent = t.scenarioPushFold;

    const oppHeader = document.getElementById('defense-opp-header');
    if (oppHeader) oppHeader.textContent = t.oppHeader;
    const meldsLabel = document.getElementById('defense-melds-label');
    if (meldsLabel) meldsLabel.textContent = t.meldsLabel;
    const riverLabel = document.getElementById('defense-river-label');
    if (riverLabel) riverLabel.textContent = t.riverLabel;

    const btnNextP = document.getElementById('btn-defense-next-puzzle');
    if (btnNextP) btnNextP.textContent = t.nextScenario;
    const btnSubmit = document.getElementById('btn-defense-submit');
    if (btnSubmit) btnSubmit.textContent = t.btnSubmit;
    const btnNextAfter = document.getElementById('btn-defense-next-after-result');
    if (btnNextAfter) btnNextAfter.textContent = t.nextAfterResult;
    const heatHeader = document.getElementById('defense-heatmap-header');
    if (heatHeader) heatHeader.textContent = t.heatmapHeader;

    const btnPfPush = document.getElementById('btn-pf-push');
    if (btnPfPush) btnPfPush.textContent = t.btnPush;
    const btnPfMawashi = document.getElementById('btn-pf-mawashi');
    if (btnPfMawashi) btnPfMawashi.textContent = t.btnMawashi;
    const btnPfFold = document.getElementById('btn-pf-fold');
    if (btnPfFold) btnPfFold.textContent = t.btnFold;

    renderDefenseTheory();

    if (currentDefensePuzzle) {
      renderDefensePuzzle(currentDefensePuzzle);
    }

    StorageManager.saveDefenseStats();
  }

  function renderDefenseTheory() {
    const container = document.getElementById('defense-theory-container');
    if (!container) return;
    const t = DEFENSE_I18N[defenseLanguage] || DEFENSE_I18N.en;
    const colors = ['var(--accent-emerald)', 'var(--c-blue-diamond)', 'var(--accent-gold)', 'var(--c-ruby-ring)'];

    container.innerHTML = t.theoryCards.map((card, idx) => `
      <div class="rules-card">
        <h3 style="color:${colors[idx % colors.length]}; display:flex; align-items:center; gap:8px;">
          <span>${card.icon}</span> ${card.title}
        </h3>
        <p style="font-size:0.88rem; color:#cbd5e1; line-height:1.6; margin-top:8px;">
          ${card.content}
        </p>
      </div>
    `).join('');
  }

  function initDefenseCenter() {
    const btnLangEn = document.getElementById('btn-defense-lang-en');
    const btnLangZh = document.getElementById('btn-defense-lang-zh');
    btnLangEn?.addEventListener('click', () => {
      sound.playTileClick();
      setDefenseLanguage('en');
    });
    btnLangZh?.addEventListener('click', () => {
      sound.playTileClick();
      setDefenseLanguage('zh');
    });

    const btnModeDrills = document.getElementById('btn-defense-mode-drills');
    const btnModeTheory = document.getElementById('btn-defense-mode-theory');
    const paneDrills = document.getElementById('defense-pane-drills');
    const paneTheory = document.getElementById('defense-pane-theory');

    btnModeDrills?.addEventListener('click', () => {
      btnModeDrills.className = 'btn btn-primary';
      btnModeTheory.className = 'btn btn-secondary';
      if (paneDrills) paneDrills.style.display = 'block';
      if (paneTheory) paneTheory.style.display = 'none';
      sound.playTileClick();
    });

    btnModeTheory?.addEventListener('click', () => {
      btnModeTheory.className = 'btn btn-primary';
      btnModeDrills.className = 'btn btn-secondary';
      if (paneDrills) paneDrills.style.display = 'none';
      if (paneTheory) paneTheory.style.display = 'block';
      sound.playTileClick();
    });

    document.querySelectorAll('.btn-defense-scenario').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-defense-scenario').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        defenseScenarioType = e.currentTarget.getAttribute('data-type') || 'betaori';
        sound.playTileClick();
        loadNewDefensePuzzle();
      });
    });

    document.querySelectorAll('.btn-pf-choice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-pf-choice').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        selectedPushFoldChoice = e.currentTarget.getAttribute('data-choice');
        sound.playTileClick();
      });
    });

    document.getElementById('btn-defense-submit')?.addEventListener('click', () => {
      submitDefenseDecision();
    });

    document.getElementById('btn-defense-next-puzzle')?.addEventListener('click', () => {
      sound.playTileClick();
      loadNewDefensePuzzle();
    });

    document.getElementById('btn-defense-next-after-result')?.addEventListener('click', () => {
      sound.playTileClick();
      loadNewDefensePuzzle();
    });

    const streakEl = document.getElementById('defense-drill-streak');
    const bestEl = document.getElementById('defense-drill-best');
    const accEl = document.getElementById('defense-drill-acc');
    const fracEl = document.getElementById('defense-drill-score-fraction');
    if (streakEl) streakEl.textContent = defenseStreak.toString();
    if (bestEl) bestEl.textContent = defenseBestStreak.toString();
    if (accEl) accEl.textContent = defenseTotalCount > 0 ? `${Math.round((defenseCorrectCount / defenseTotalCount) * 100)}%` : '0%';
    if (fracEl) fracEl.textContent = `${defenseCorrectCount}/${defenseTotalCount}`;

    setDefenseLanguage(defenseLanguage || 'en');
    loadNewDefensePuzzle();
  }

  async function loadNewDefensePuzzle() {
    try {
      const res = await fetch(`/api/defense/puzzle?scenario_type=${defenseScenarioType}`);
      const puzzle = await res.json();
      currentDefensePuzzle = puzzle;
      selectedDefenseTile = null;
      selectedPushFoldChoice = null;
      renderDefensePuzzle(puzzle);
    } catch (err) {
      console.error('Failed to load defense puzzle:', err);
    }
  }

  function renderDefensePuzzle(puzzle) {
    if (!puzzle) return;
    const t = DEFENSE_I18N[defenseLanguage] || DEFENSE_I18N.en;
    const isZh = (defenseLanguage === 'zh');

    const fbCard = document.getElementById('defense-feedback-card');
    if (fbCard) fbCard.style.display = 'none';

    const threatInfo = puzzle.threat_info || {};
    const threatBadge = document.getElementById('defense-threat-badge');
    if (threatBadge) {
      threatBadge.textContent = `${t.threatPrefix} ${threatInfo.threat_level}`;
      threatBadge.style.background = threatInfo.threat_level === 'CRITICAL' ? '#dc2626' : (threatInfo.threat_level === 'HIGH' ? '#ea580c' : '#076cc0');
    }

    const suspectedBadge = document.getElementById('defense-suspected-fan-badge');
    if (suspectedBadge) {
      suspectedBadge.textContent = t.estimatedFan(threatInfo.estimated_fan || 1);
    }

    const targetBadge = document.getElementById('defense-target-player-badge');
    if (targetBadge) {
      const pName = isZh ? (threatInfo.player_name_zh || threatInfo.player_name) : (threatInfo.player_name_en || threatInfo.player_name || 'Opponent');
      targetBadge.textContent = t.targetPlayer(pName);
    }

    const meldsRack = document.getElementById('defense-opp-melds-rack');
    if (meldsRack) {
      const melds = threatInfo.melds || [];
      if (melds.length === 0) {
        meldsRack.innerHTML = `<span style="color:#6b7280; font-size:0.8rem;">${t.noMelds}</span>`;
      } else {
        meldsRack.innerHTML = melds.map((m) => `
          <div style="display:flex; background:rgba(0,0,0,0.5); padding:2px 4px; border-radius:6px; gap:2px; border:1px solid rgba(255,255,255,0.1);">
            ${m.tiles.map((tile) => `
              <img src="/static/tiles/${tile}.png?v=4" alt="${tile}" style="width:24px; height:32px; object-fit:contain;" />
            `).join('')}
          </div>
        `).join('');
      }
    }

    const riverRack = document.getElementById('defense-opp-river-rack');
    if (riverRack) {
      const river = threatInfo.river || [];
      riverRack.innerHTML = river.map((r) => `
        <div style="display:flex; flex-direction:column; align-items:center; background:#fff; border-radius:3px; padding:1px 2px;">
          <img src="/static/tiles/${r.tile}.png?v=4" alt="${r.tile}" style="width:20px; height:26px; object-fit:contain;" />
        </div>
      `).join('');
    }

    const narrativeEl = document.getElementById('defense-threat-narrative');
    if (narrativeEl) {
      narrativeEl.textContent = isZh ? (threatInfo.threat_summary_zh || '') : (threatInfo.threat_summary_en || threatInfo.threat_summary_zh || '');
    }

    const pfActions = document.getElementById('defense-push-fold-actions');
    const handPrompt = document.getElementById('defense-hand-prompt');
    const userHandRack = document.getElementById('defense-user-hand-rack');

    if (puzzle.scenario_type === 'push_fold') {
      if (pfActions) pfActions.style.display = 'flex';
      if (handPrompt) handPrompt.textContent = t.handPromptPushFold;
      document.querySelectorAll('.btn-pf-choice').forEach(b => b.classList.remove('active'));
    } else {
      if (pfActions) pfActions.style.display = 'none';
      if (handPrompt) handPrompt.textContent = t.handPromptBetaori;
    }

    if (userHandRack) {
      userHandRack.innerHTML = puzzle.user_hand.map((tile, idx) => `
        <div class="user-interactive-tile defense-selectable-tile" data-tile="${tile}" data-idx="${idx}">
          <img src="/static/tiles/${tile}.png?v=4" alt="${tile}" />
          <span class="tile-name-label">${tile}</span>
        </div>
      `).join('');

      if (puzzle.scenario_type === 'betaori') {
        userHandRack.querySelectorAll('.defense-selectable-tile').forEach(tileCard => {
          tileCard.addEventListener('click', (e) => {
            userHandRack.querySelectorAll('.defense-selectable-tile').forEach(c => c.classList.remove('selected-for-discard'));
            e.currentTarget.classList.add('selected-for-discard');
            selectedDefenseTile = e.currentTarget.getAttribute('data-tile');
            sound.playTileClick();
          });
        });
      }
    }
  }

  async function submitDefenseDecision() {
    if (!currentDefensePuzzle) return;
    const t = DEFENSE_I18N[defenseLanguage] || DEFENSE_I18N.en;
    const isZh = (defenseLanguage === 'zh');
    const isPushFold = (currentDefensePuzzle.scenario_type === 'push_fold');
    const userChoice = isPushFold ? selectedPushFoldChoice : selectedDefenseTile;

    if (!userChoice) {
      alert(isPushFold ? t.selectPostureAlert : t.selectTileAlert);
      return;
    }

    try {
      const payload = {
        puzzle_type: currentDefensePuzzle.scenario_type,
        user_choice: userChoice,
        ground_truth: currentDefensePuzzle.ground_truth
      };

      const res = await fetch('/api/defense/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      defenseTotalCount++;
      if (data.is_correct) {
        defenseStreak++;
        defenseCorrectCount++;
        defenseBestStreak = Math.max(defenseBestStreak, defenseStreak);
        sound.playSuccess();
      } else {
        defenseStreak = 0;
        sound.playWarning();
      }

      const streakEl = document.getElementById('defense-drill-streak');
      const bestEl = document.getElementById('defense-drill-best');
      const accEl = document.getElementById('defense-drill-acc');
      const fracEl = document.getElementById('defense-drill-score-fraction');

      if (streakEl) streakEl.textContent = defenseStreak.toString();
      if (bestEl) bestEl.textContent = defenseBestStreak.toString();
      if (accEl) accEl.textContent = `${Math.round((defenseCorrectCount / defenseTotalCount) * 100)}%`;
      if (fracEl) fracEl.textContent = `${defenseCorrectCount}/${defenseTotalCount}`;

      StorageManager.saveDefenseStats();

      const fbCard = document.getElementById('defense-feedback-card');
      const resHeader = document.getElementById('defense-result-header');
      const expBox = document.getElementById('defense-explanation-box');
      const heatmapTable = document.getElementById('defense-heatmap-table');
      const heatmapContainer = document.getElementById('defense-heatmap-container');

      if (fbCard && resHeader && expBox) {
        fbCard.style.display = 'block';

        if (data.is_correct) {
          resHeader.innerHTML = `
            <span style="color:#34d399;">${t.correctTitle}</span>
            <span class="badge" style="background:rgba(52,211,153,0.2); border:1px solid #34d399; color:#34d399; font-size:0.9rem;">
              ${t.optimalStrategy(data.optimal_choice)}
            </span>
          `;
        } else {
          resHeader.innerHTML = `
            <span style="color:#f87171;">${t.dangerTitle}</span>
            <span class="badge" style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; font-size:0.9rem;">
              ${t.userVsOptimal(data.user_choice, data.optimal_choice)}
            </span>
          `;
        }

        const primaryExp = isZh ? (data.explanation_zh || data.explanation_en) : (data.explanation_en || data.explanation_zh);
        const secondaryExp = isZh ? data.explanation_en : data.explanation_zh;

        expBox.innerHTML = `
          <div style="font-size:0.95rem; margin-bottom:6px; color:#fff;">${primaryExp}</div>
          <div style="font-size:0.85rem; color:#9ca3af;">${secondaryExp}</div>
        `;

        if (data.tile_ratings && data.tile_ratings.length > 0 && heatmapTable && heatmapContainer) {
          heatmapContainer.style.display = 'block';
          heatmapTable.innerHTML = data.tile_ratings.map((r, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.06); padding:8px 12px; border-radius:6px; border-left:4px solid ${r.color};">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-family:var(--font-mono); font-weight:700; color:#9ca3af; font-size:0.85rem;">#${idx+1}</span>
                <img src="/static/tiles/${r.tile}.png?v=4" alt="${r.tile}" style="width:24px; height:32px; object-fit:contain;" />
                <div>
                  <strong style="color:#fff;">${r.tile}</strong>
                  <span style="color:${r.color}; font-weight:700; font-size:0.85rem; margin-left:6px;">[${isZh ? r.safety_label_zh : r.safety_label_en}]</span>
                  <div style="font-size:0.78rem; color:#cbd5e1; margin-top:2px;">${r.primary_reason}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <span class="badge" style="background:${r.color}; color:#111; font-weight:800; font-size:0.8rem;">
                  ${t.dangerScore(r.danger_score)}
                </span>
              </div>
            </div>
          `).join('');
        } else if (heatmapContainer) {
          heatmapContainer.style.display = 'none';
        }

        fbCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

    } catch (err) {
      alert(`Submission error: ${err.message}`);
    }
  }

  // Hook into navigation tab switching
  document.querySelectorAll('.tab-btn[data-tab="tab-bots"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!botGameId) {
        startBotGame();
      }
    });
  });

  document.querySelectorAll('[data-navigate="tab-bots"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!botGameId) {
        startBotGame();
      }
    });
  });

  initBotGameListeners();

  // Initialize Rules Center on load
  initRulesCenter();

  // Initialize Fan Quiz Trainer on load
  initFanQuizTrainer();

  // Initialize Defense Center on load
  initDefenseCenter();
})();


