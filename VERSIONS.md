# Version History & Release Rollback Index

This repository uses **Git Commits & Semantic Tags** to preserve every snapshot of the application. If any new experiment, design change, or feature breaks or is disliked, you can roll back instantly to any past tag.

---

## 📌 Release Tags & Milestones

### `v2.0.0-stable` — **Current Stable Baseline** *(2026-08-19)*
- **Theme**: Luxury Deep Ocean Blue & Obsidian Black (`#0a254a`, `#040e1c`, `#38bdf8`).
- **Core Engine**: Pure Python 136-tile recursive Shanten, Ukeire outs, delta comparison.
- **TVB 2026 Strict Rules**: 1-Fan minimum, Seven Pairs banned, Full Shooter liability ($-10 \times \text{Fan}$), 12-Tile Penalty, 0 flowers.
- **8 Fully Operational Tabs**:
  1. `🏠 Home Portal` (Hero banner & 7 balanced responsive feature cards)
  2. `🎯 Discard Efficiency Trainer` (14-tile out delta engine, continuous turn practice, Agari celebration)
  3. `🤖 4-Player Table vs 3 AI Bots` (Real-time discard rivers, AI calls for Win/Pong/Kong/Chow/Pass, live coach HUD)
  4. `🧩 Tactical Benchmark Puzzles & Drills` (10 curated master lessons & infinite procedural drills)
  5. `✏️ Custom Hand Builder & Analyzer` (Visual 34-tile palette, copy limit validation, deep tactical breakdown)
  6. `🛡️ Defense Center & Push/Fold` (Genbutsu, Suji, Kabe, live opponent threat radar, 4-part masterclass)
  7. `🧮 Fan Counting Master & Quiz` (Dynamic multi-tier quiz, 0-Fan trap detection, custom calculator)
  8. `📜 TVB Rules & Signed Scorecard` (Official appendices, 16-hand match tracker, 5 canvas signature pads)
- **Tests**: 44 / 44 automated unit test suites passing (100%).

---

## 🔄 Instant Rollback Cheat Sheet

### 1. Roll back your local workspace to this exact version:
```powershell
git checkout v2.0.0-stable
```

### 2. Discard all uncommitted changes and return to the latest commit:
```powershell
git reset --hard HEAD
```

### 3. Create a new experiment branch (safe testing without affecting main):
```powershell
git checkout -b feature/new-experiment
```

### 4. Create a new permanent version checkpoint after a successful feature:
```powershell
git add .
git commit -m "feat: added new feature description"
git tag -a v2.1.0 -m "Release description"
```
