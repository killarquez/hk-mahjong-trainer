# Hong Kong Mahjong Efficiency Trainer (TVB 2026 Rules) — Full System Checkpoint

**Date / Timestamp:** 2026-08-19  
**Status:** All 8 Navigation Tabs Fully Operational, 44 Automated Pytest Units Passing (100%), Uvicorn Daemon Active on Port 8000.  
**Theme:** Luxury Deep Ocean Blue & Obsidian Black (`#0a254a`, `#040e1c`, `#02060d`, `#38bdf8`, `#076cc0`).

---

## 1. Project Architecture & File Hierarchy

```
c:\Users\alfre\Desktop\antigravity\cli\
├── engine/
│   ├── tiles.py             # 136 standard tiles, deck validation, compact string parser (m/p/s/z)
│   ├── shanten.py           # TVB 2026 recursive Shanten engine (4 Melds + 1 Head / 13 Orphans; rejects 7 Pairs)
│   ├── ukeire.py            # Complete Ukeire tile acceptance calculator for 13-tile hands
│   ├── table_game.py        # 4-player real-time match engine against 3 AI bots with claim priority & scoring
│   └── defense_engine.py    # Genbutsu, Suji (1-4-7/2-5-8/3-6-9), Kabe (No-Chance), Push/Fold decision matrix
├── evaluator.py             # 14-tile discard evaluator, delta comparison, and random scenario generator
├── fan_calculator.py        # TVB 2026 Appendix 3 Fan scoring engine (1-Fan min, Limit hands, Jyutping)
├── lexicon.py               # Cantonese mahjong terminology dictionary, tiles lookup & fuzzy search
├── parser.py                # Tile notations & compact string parsing
├── database.py              # SQLite database session & engine
├── models.py                # Database models for hand histories and quiz attempts
├── schemas.py               # Pydantic schemas for API validation
├── main.py                  # FastAPI server, static mounts, and REST API endpoints
├── static/
│   ├── index.html           # Main frontend single-page application (8 top-level view sections)
│   ├── styles.css           # Luxury Deep Blue & Black design system (CSS variables, glow, cards, table arena)
│   ├── app.js               # Vanilla client application logic & event handlers
│   ├── audio.js             # Web Audio API sound effects synthesizer
│   └── tiles/               # PNG tile asset collection (1m-9m, 1p-9p, 1s-9s, 1z-7z)
├── frontend/                # TypeScript + Vite source files
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       ├── bot_game.ts
│       ├── api.ts
│       ├── audio.ts
│       ├── types.ts
│       ├── rules_data.ts
│       └── styles.css
├── tests/
│   ├── test_api.py          # API endpoint unit tests
│   ├── test_bot_game.py     # 4-player bot game match logic & AI decision tests
│   ├── test_defense.py      # Defense engine, Genbutsu, Suji, and Push/Fold tests
│   ├── test_fan_quiz.py     # Dynamic Fan quiz generator & scoring tests
│   ├── test_mahjong.py      # Core tile parsing, deck validation, and Fan rules tests
│   ├── test_shanten.py      # Standard hand, Tenpai, Iishanten, and 7-Pairs rejection tests
│   └── test_ukeire.py       # Tile acceptance & optimal discard comparison tests
└── CHECKPOINT_FULL.md       # This full system checkpoint documentation
```

---

## 2. Official TVB 2026 Tournament Ruleset (LA Championship)

1. **Tile Set (136 Standard Tiles, Zero Flowers)**:
   - 36 Characters (`1m`–`9m`), 36 Dots (`1p`–`9p`), 36 Bamboos (`1s`–`9s`).
   - 16 Winds (`1z` East, `2z` South, `3z` West, `4z` North).
   - 12 Dragons (`5z` Red Chun, `6z` Green Fat, `7z` White Board).
   - **Zero Flower/Season tiles**.

2. **1-Fan Minimum (一番起胡)**:
   - 0-Fan "Chicken Hand" (雞胡) is strictly illegal and cannot win.
   - Any win without a recognized scoring pattern (e.g. Ping-Hu, Dragon Pong, Seat/Round Wind, All Chows, Self-Draw, Half Flush, etc.) is penalized as a False Win (詐胡).

3. **Seven Pairs Strictly Banned (排除七對子 / 嚦咕嚦咕)**:
   - Hand structure must be **4 Melds + 1 Pair (雀頭)** or **Thirteen Orphans (十三幺, 10 Fan)**.

4. **Full Shooter Liability (全包制 / 全銃制)**:
   - Discarding the winning tile incurs **full point liability** ($\text{Points} = -10 \times \text{Fan}$).
   - Other two non-winning players neither gain nor lose points on direct discard wins.
   - On Self-Draw (自摸), all 3 opponents pay equally.

5. **12-Tile Penalty (十二張包自摸 / 附錄二包胡懲罰)**:
   - Feeding a 4th exposed meld of the same suit (Full Flush), same honor group (All Honors / Great Dragons), or pure meld sequence incurs 100% liability for any subsequent self-draw by that player.

6. **Dealer Progression (過莊制)**:
   - Dealer passes on every hand (過莊), including dealer wins and exhaust draws (摸和).
   - Full tournament match consists of exactly **16 hands** (4 hands $\times$ 4 wind rounds: East, South, West, North).

---

## 3. Core Features & Navigation Map

### Tab 0: Home Portal (`#tab-home`)
- **Hero Banner**: Launchers to Discard Trainer and Tactical Puzzles.
- **7 Feature Portal Cards Grid**:
  1. `🀄 Discard Efficiency Trainer` (`tab-trainer`)
  2. `🧩 Tactical Benchmark Puzzles` (`tab-puzzles`)
  3. `🤖 Play vs 3 AI Bots` (`tab-bots`)
  4. `✏️ Custom Hand Builder & Analyzer` (`tab-builder`)
  5. `🛡️ Defense Center & Push/Fold` (`tab-defense`)
  6. `🧮 Fan Counting & Dynamic Quiz` (`tab-fan`)
  7. `📜 Championship Rules & Strategy Guide` (`tab-rules`)
- **Quick Highlights Cheat Sheet**: 1-Fan min, Seven Pairs ban, 136 standard tiles, Full Shooter rule.

### Tab 1: Discard Efficiency Trainer (`#tab-trainer`)
- Deals random 14-tile hands from live 136-tile deck.
- Seat and Round Wind selectors (`1z`–`4z`).
- Discard interaction via tile clicks or keyboard shortcuts (`1`–`9`, `0`, `-`, `=`, `q`, `w`).
- Mathematical delta evaluation:
  - Exact loss in Ukeire outs compared to optimal discard.
  - Detailed explanation of block structures and strategic trade-offs.
  - Full 14-tile discard table ranked by Shanten and total outs.
- Continuous mode: draws turn-by-turn until Agari victory celebration with Fan breakdown.

### Tab 2: Tactical Benchmark Puzzles & Drills (`#tab-puzzles`)
- **Curated Lessons Mode**: 10 hand-crafted benchmark puzzles (5-sided Ryanmen waits, Nobeta 4-runs, Aryamen dilemmas, Chicken Hand pivots, Thirteen Orphans branching).
- **Endless Themed Drill Mode**: Infinite procedural generation across 4 categories (`waits`, `fan_pivot`, `honors_defense`, `limit_hands`).
- Streak tracking, accuracy counter, hints toggle, and "Load into Trainer" shortcut.

### Tab 3: 4-Player Table Arena vs 3 AI Bots (`#tab-bots`)
- Full 4-player table simulation with West (Player 2), North (Player 3), and East (Player 0) AI bots.
- Real-time discard rivers (河) for all 4 players.
- Turn rotation with thinking indicators and dealer glow.
- Claim action triggers: `胡 (Win)`, `碰 (Pong)`, `槓 (Kong)`, `上 (Chow)`, `過 (Pass)`.
- Live Coach Efficiency HUD: displays live Shanten status and recommended discard with out count.
- End-of-round modal with Appendix 1 points delta adjustment matrix.

### Tab 4: Custom Hand Builder & Tactical Analyzer (`#tab-builder`)
- Visual click-to-add 34-tile bone palette with 136-tile deck copy limit validation.
- Compact string notation input (`123m456p789s11z55z`).
- Quick preset buttons for classic test patterns.
- Deep Tactical Breakdown Report: structural blocks, pair candidates, 1-Fan legality check, and full 14-discard ranking table.

### Tab 5: Defense Masterclass & Push/Fold Center (`#tab-defense`)
- **Scenario Drills**:
  - *Full Betaori Discards*: Pick the 100% safe Genbutsu tile or lowest-risk Suji/Kabe out against a declared high-threat opponent.
  - *Push vs Fold Turning Points*: Decide posture (`PUSH`, `MAWASHI / PIVOT`, `FOLD / BETAORI`) based on hand value, Shanten, and opponent risk.
- **Opponent Threat Radar**: Analyzes exposed melds and discards to estimate threat level and suspected Fan range (e.g. 4+ Fan Half-Flush).
- **4-Part Defensive Theory Masterclass**:
  1. *Genbutsu & Dead Honor Discards (跟打熟牌與現物)*
  2. *Suji Defensive Line Rules (1-4-7 / 2-5-8 / 3-6-9 筋牌法則)*
  3. *Kabe & Wall Theory (No-Chance & One-Chance 壁牌斷門)*
  4. *TVB Full Loss Push/Fold Decision Tree (全銃制攻守轉折點)*

### Tab 6: Fan Counting Master & Dynamic Quiz (`#tab-fan`)
- **Dynamic Fan Quiz**:
  - Generates random valid 14-tile winning hands across 4 difficulty tiers: *Beginner (1-3 Fan)*, *Intermediate (4-6 Fan)*, *Limit (7-10+ Fan)*, and *0-Fan Traps (雞胡陷阱)*.
  - Multi-choice Fan number selection with interactive highlight states.
  - Pattern checklist chips for bonus yaku classification.
  - Detailed step-by-step scoring breakdown with Appendix 1 points verification.
- **Custom Calculator**: Calculate Fan and point payout for any 14-tile notation with preset examples.

### Tab 7: TVB Tournament Rules & Signed Scorecard (`#tab-rules`)
- Official competition rules (136 tiles, zero flowers, 1-Fan minimum, dealer rotation, scoring hierarchy).
- Appendix 1 point calculation table & Jyutping pronunciation guide.
- Appendix 2 liability penalties (12-tile penalty, False Win penalty).
- Appendix 3 complete Fan scoring index (1 Fan to 10 Fan limit patterns).
- Interactive 16-Hand Tournament Match Scorecard simulator with 5 HTML5 signature pads (East, South, West, North, Referee).

---

## 4. Complete REST API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, ruleset verification (`TVB 2026`), and configuration. |
| `GET` | `/api/hand/random` | Deals a random valid 14-tile hand from a shuffled 136-tile deck. |
| `POST` | `/api/evaluate` | Evaluates a 14-tile hand, returning Shanten, Ukeire outs, and optimal discard comparison. |
| `POST` | `/api/parse-hand` | Parses compact notation (`123m456p789s11z55z`) into validated tile lists. |
| `POST` | `/api/next-turn` | Draws next tile from remaining wall after user discard. |
| `POST` | `/api/fan-counter` | Computes Fan breakdown, recognized patterns, and point values for any 14-tile hand. |
| `GET` | `/api/puzzles` | Retrieves curated benchmark tactical puzzles catalog. |
| `GET` | `/api/puzzles/drill` | Generates infinite procedural tactical drill scenarios by category. |
| `POST` | `/api/hand-breakdown` | Generates deep block breakdown and ranked matrix for Custom Hand Builder. |
| `GET` | `/api/fan-quiz/puzzle` | Generates a random Fan quiz scenario with difficulty filter. |
| `POST` | `/api/fan-quiz/verify` | Grades user's selected Fan count and pattern choices with full scoring details. |
| `GET` | `/api/defense/puzzle` | Generates a defensive discard or Push/Fold drill scenario. |
| `POST` | `/api/defense/verify` | Grades defensive discard selection with tile safety danger scores. |
| `POST` | `/api/bot-game/start` | Initializes a new 4-player match session vs 3 AI bots. |
| `POST` | `/api/bot-game/step` | Advances bot turn simulation or processes pending bot claims. |
| `POST` | `/api/bot-game/discard` | Human player executes a tile discard. |
| `POST` | `/api/bot-game/claim` | Human player executes a claim action (`WIN`, `PONG`, `KONG`, `CHOW`, `PASS`). |
| `POST` | `/api/bot-game/next-hand` | Advances to the next hand of the 16-hand tournament match. |

---

## 5. Verification & Test Commands

### Run Unit Test Suite
```powershell
# In c:\Users\alfre\Desktop\antigravity\cli
python -m pytest tests/ -v
```
*Expected Result: 44 passed in ~16s (100% pass rate).*

### Build Frontend Bundle
```powershell
# In c:\Users\alfre\Desktop\antigravity\cli\frontend
npm.cmd run build
```
*Expected Result: Clean TypeScript compilation and Vite production build into `dist/`.*

### Run Web Application Server
```powershell
# In c:\Users\alfre\Desktop\antigravity\cli
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
*Accessible at: `http://localhost:8000`.*
