"""
FastAPI Main Web Application for Hong Kong Mahjong Efficiency Trainer (TVB 2026 Rules).
"""

import json
import random
import uuid
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db, init_db
import models
import schemas
from engine.tiles import (
    ALL_TILE_CODES,
    TILE_INFO_MAP,
    sort_tiles,
    hand_to_counts,
    counts_to_hand,
    create_full_deck,
    create_shuffled_wall,
    parse_compact_string
)
from engine.shanten import calculate_tvb_shanten
from engine.ukeire import calculate_ukeire_for_13
from evaluator import evaluate_14_hand, compare_user_decision, generate_random_scenario
from fan_calculator import calculate_fan, generate_fan_quiz_puzzle, get_point_payout_details, ALL_PATTERNS_LIST
from lexicon import LEXICON_DICTIONARY, TILE_LOOKUP, search_lexicon
from parser import parse_tile_string, format_tiles_cantonese
from gemini_service import analyze_hand_image, generate_dynamic_scenario_commentary
from engine.table_game import TableMatchGame, ACTIVE_TABLE_GAMES
from engine.defense_engine import (
    generate_defense_drill_puzzle,
    verify_defense_drill_answer,
    calculate_tile_danger_score
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title="Hong Kong Mahjong Efficiency Trainer (TVB 2026 Rules)",
    description="Mathematical Shanten & Ukeire Tile Acceptance Engine for Hong Kong Mahjong.",
    version="2.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
def startup_event():
    """Initialize database tables on application startup."""
    try:
        init_db()
    except Exception as e:
        logger.warning(f"Database initialization deferred/skipped: {e}")

@app.get("/", response_class=HTMLResponse)
def read_root():
    """Serve main web UI frontend with no-cache headers to prevent stale JS/CSS."""
    return FileResponse(
        "static/index.html",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "ruleset": "TVB 2026 Hong Kong Mahjong", "min_fan": 1, "seven_pairs_allowed": False}

# --- Core Mahjong Efficiency APIs ---

@app.post("/api/evaluate")
def evaluate_hand_api(req: schemas.EvaluateHandRequest, db: Session = Depends(get_db)):
    """
    Evaluates a 14-tile hand, computing Shanten, Ukeire outs, and optimal discard for every option.
    If user_discard is provided, returns mathematical delta comparison and outs difference.
    """
    try:
        eval_result = evaluate_14_hand(req.hand_tiles, req.seat_wind, req.prevailing_wind)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    comparison = None
    if req.user_discard:
        comparison = compare_user_decision(
            hand_tiles=req.hand_tiles,
            user_discard=req.user_discard,
            seat_wind=req.seat_wind,
            prevailing_wind=req.prevailing_wind,
            eval_result=eval_result
        )

        # Log decision if session_id provided
        if req.session_id:
            try:
                user_sess = db.query(models.UserSession).filter(models.UserSession.id == req.session_id).first()
                if not user_sess:
                    user_sess = models.UserSession(id=req.session_id)
                    db.add(user_sess)
                    db.commit()

                dec_log = models.DecisionLog(
                    scenario_id=0,
                    session_id=req.session_id,
                    user_discard=req.user_discard,
                    optimal_discard=eval_result["optimal_discard"],
                    is_correct=comparison["is_correct"],
                    priority_level=1 if comparison["is_correct"] else 2,
                    delta_reasoning_zh=comparison["delta_reasoning_zh"]
                )
                db.add(dec_log)
                db.commit()

                # Update accuracy metric
                metric = db.query(models.AccuracyMetric).filter(models.AccuracyMetric.session_id == req.session_id).first()
                if not metric:
                    metric = models.AccuracyMetric(session_id=req.session_id, total_scenarios=0, correct_count=0, accuracy_percentage=0.0)
                    db.add(metric)
                
                total = db.query(models.DecisionLog).filter(models.DecisionLog.session_id == req.session_id).count()
                correct = db.query(models.DecisionLog).filter(models.DecisionLog.session_id == req.session_id, models.DecisionLog.is_correct == True).count()
                
                metric.total_scenarios = total
                metric.correct_count = correct
                metric.accuracy_percentage = round((correct / total * 100.0), 1) if total > 0 else 0.0
                db.commit()
            except Exception as db_err:
                logger.warning(f"Error logging decision to DB: {db_err}")

    return {
        **eval_result,
        "comparison": comparison
    }


@app.post("/api/random-hand")
@app.post("/api/scenario/generate")
def random_hand_api(req: schemas.RandomHandRequest, db: Session = Depends(get_db)):
    """Deals a random 14-tile hand from a freshly shuffled 136-tile wall and computes full efficiency evaluation."""
    scenario_data = generate_random_scenario(seat_wind=req.seat_wind, prevailing_wind=req.prevailing_wind)
    formatted_tiles = format_tiles_cantonese(scenario_data["tiles"])

    return {
        "tiles": scenario_data["tiles"],
        "formatted_tiles": formatted_tiles,
        "seat_wind": req.seat_wind,
        "prevailing_wind": req.prevailing_wind,
        "remaining_wall_count": scenario_data.get("remaining_wall_count", 122),
        "evaluation": scenario_data["evaluation"]
    }


@app.post("/api/parse-hand")
@app.post("/api/tiles/parse")
def parse_hand_api(req: schemas.ParseTileRequest):
    """Parses text input (compact or verbose) into tiles and evaluates them if 14 tiles."""
    tiles, errors = parse_tile_string(req.raw_input)
    formatted = format_tiles_cantonese(tiles)
    
    evaluation = None
    if len(tiles) == 14 and not errors:
        try:
            evaluation = evaluate_14_hand(tiles)
        except Exception as e:
            errors.append(str(e))

    return {
        "success": (len(errors) == 0),
        "tile_count": len(tiles),
        "is_14_tiles": (len(tiles) == 14),
        "tiles": tiles,
        "formatted_tiles": formatted,
        "errors": errors,
        "evaluation": evaluation
    }


@app.get("/api/puzzles")
def get_puzzles_api():
    """Returns the list of curated benchmark tactical puzzles."""
    from engine.puzzles import get_all_puzzles
    return {"puzzles": get_all_puzzles()}


@app.get("/api/puzzles/{puzzle_id}")
def get_single_puzzle_api(puzzle_id: str):
    """Returns a specific puzzle by ID."""
    from engine.puzzles import get_puzzle_by_id
    return {"puzzle": get_puzzle_by_id(puzzle_id)}


@app.post("/api/puzzles/generate-drill")
def generate_drill_puzzle_api(req: schemas.PuzzleDrillRequest):
    """Generates an infinite procedural tactical puzzle matching the requested category/theme."""
    from engine.puzzle_generator import generate_procedural_puzzle
    puzzle = generate_procedural_puzzle(
        category=req.category,
        seat_wind=req.seat_wind,
        prevailing_wind=req.prevailing_wind
    )
    return {"puzzle": puzzle}


@app.post("/api/hand/analyze-breakdown")
def analyze_hand_breakdown_api(req: schemas.EvaluateHandRequest):
    """Performs a deep tactical and structural breakdown of a 14-tile hand for the Hand Builder workbench."""
    from engine.hand_analyzer import analyze_hand_deep_strategy
    if len(req.hand_tiles) != 14:
        raise HTTPException(status_code=400, detail=f"A full hand analysis requires exactly 14 tiles, got {len(req.hand_tiles)}.")
    
    analysis = analyze_hand_deep_strategy(
        tiles=req.hand_tiles,
        seat_wind=req.seat_wind,
        prevailing_wind=req.prevailing_wind
    )
    return analysis


@app.post("/api/next-turn")
def next_turn_api(req: schemas.NextTurnRequest):
    """
    Simulates the next turn in continuous practice mode:
    1. Removes discarded tile from the 14-tile hand (leaving 13 tiles).
    2. Draws a tile from the remaining unseen 136-tile deck (or a specific drawn tile).
    3. Returns the new 14-tile hand and its complete efficiency evaluation.
    """
    if req.discard_tile not in req.hand_tiles:
        raise HTTPException(status_code=400, detail=f"Discarded tile '{req.discard_tile}' is not in hand.")

    remaining_hand = list(req.hand_tiles)
    remaining_hand.remove(req.discard_tile)

    # Build unseen deck (136 minus remaining hand)
    hand_counts = hand_to_counts(remaining_hand)
    unseen_pool = []
    for idx in range(34):
        unseen_copies = 4 - hand_counts[idx]
        if unseen_copies > 0:
            unseen_pool.extend([ALL_TILE_CODES[idx]] * unseen_copies)

    if not unseen_pool:
        raise HTTPException(status_code=400, detail="No remaining tiles in wall.")

    drawn_tile = req.draw_tile if (req.draw_tile and req.draw_tile in unseen_pool) else random.choice(unseen_pool)

    new_hand = sort_tiles(remaining_hand + [drawn_tile])
    eval_result = evaluate_14_hand(new_hand, req.seat_wind, req.prevailing_wind)

    drawn_info = TILE_INFO_MAP.get(drawn_tile, {})

    return {
        "drawn_tile": drawn_tile,
        "drawn_tile_info": drawn_info,
        "hand_tiles": new_hand,
        "seat_wind": req.seat_wind,
        "prevailing_wind": req.prevailing_wind,
        "evaluation": eval_result
    }


# --- Feature: Fan Counter & Dynamic Fan Quiz APIs ---
@app.post("/api/fan-counter/calculate")
def fan_counter_api(req: schemas.FanCalculatorRequest):
    """Calculate Fan value and detailed Cantonese breakdown for a 14-tile winning hand under TVB 2026 rules."""
    result = calculate_fan(
        tiles=req.tiles,
        winning_tile=req.winning_tile,
        is_self_draw=req.is_self_draw,
        prevailing_wind=req.prevailing_wind,
        seat_wind=req.seat_wind
    )
    payout = get_point_payout_details(result.get("total_fan", 0), req.is_self_draw)
    return {**result, "payout": payout}


@app.get("/api/fan-quiz/puzzle")
def get_fan_quiz_puzzle_api(difficulty: str = "all"):
    """Generates a dynamic Fan calculation puzzle for interactive practice."""
    puzzle = generate_fan_quiz_puzzle(difficulty=difficulty)
    return puzzle


@app.post("/api/fan-quiz/verify")
def verify_fan_quiz_api(req: schemas.VerifyFanQuizRequest):
    """Verifies a user's Fan count and pattern choices against TVB 2026 ground truth."""
    ground_truth = calculate_fan(
        tiles=req.hand_tiles,
        winning_tile=req.winning_tile,
        is_self_draw=req.is_self_draw,
        prevailing_wind=req.prevailing_wind,
        seat_wind=req.seat_wind
    )

    actual_fan = ground_truth.get("total_fan", 0)
    is_correct_fan = (req.user_fan == actual_fan)
    payout = get_point_payout_details(actual_fan, req.is_self_draw)

    # Build human-friendly formula & educational notes
    breakdown = ground_truth.get("breakdown", [])
    if breakdown:
        formula_parts = [f"{b['name']} (+{b['fan']}番)" for b in breakdown]
        formula_str = " + ".join(formula_parts) + f" = 總共 {actual_fan} 番"
    else:
        formula_str = "無有效番種 = 0 番（雞胡）"

    return {
        "is_correct_fan": is_correct_fan,
        "user_fan": req.user_fan,
        "actual_fan": actual_fan,
        "hand_name": ground_truth.get("hand_name", ""),
        "is_valid_win": ground_truth.get("is_valid_win", False),
        "formula": formula_str,
        "breakdown": breakdown,
        "payout": payout,
        "error_detail": ground_truth.get("error", None)
    }


# --- Feature: Defensive Mahjong & Push/Fold Center APIs ---
@app.get("/api/defense/puzzle")
def get_defense_puzzle_api(scenario_type: str = "betaori"):
    """Generates a procedural Hong Kong Mahjong defensive scenario drill (Betaori, Push/Fold, Suji reading)."""
    puzzle = generate_defense_drill_puzzle(scenario_type=scenario_type)
    return puzzle


@app.post("/api/defense/verify")
def verify_defense_decision_api(req: schemas.VerifyDefenseDecisionRequest):
    """Verifies a user's defensive discard or Push/Fold posture against ground truth."""
    result = verify_defense_drill_answer(
        puzzle_type=req.puzzle_type,
        user_choice=req.user_choice,
        ground_truth=req.ground_truth
    )
    return result


@app.post("/api/defense/analyze-hand-safety")
def analyze_hand_safety_api(req: schemas.AnalyzeHandSafetyRequest):
    """Calculates composite danger scores for all tiles in hand against a threatening opponent."""
    vis_counts = req.table_visible_counts or [0] * 34
    ratings = []
    for t in req.hand_tiles:
        rating = calculate_tile_danger_score(
            tile=t,
            target_player_river=req.target_river,
            table_visible_counts=vis_counts,
            prevailing_wind=req.prevailing_wind,
            target_seat_wind=req.target_seat_wind,
            target_melds_count=req.target_melds_count
        )
        ratings.append(rating)
    return {"ratings": ratings}



# --- Feature: Lexicon & Vision APIs ---
@app.get("/api/lexicon/all")
def get_all_lexicon():
    """Get complete Cantonese Mahjong Lexicon data dictionary."""
    return {"dictionary": LEXICON_DICTIONARY, "tile_lookup": TILE_LOOKUP}

@app.post("/api/lexicon/search")
def search_lexicon_api(req: schemas.LexiconSearchRequest):
    """Search Cantonese Mahjong terms by Chinese, Jyutping, or English."""
    results = search_lexicon(req.query)
    return {"query": req.query, "results": results}

@app.post("/api/tiles/vision-parse")
async def vision_parse_api(file: UploadFile = File(...)):
    """Upload an image of Mahjong tiles to parse using Gemini Vision API."""
    contents = await file.read()
    result = analyze_hand_image(contents)
    
    if result.get("success") and result.get("parsed_tiles"):
        formatted = format_tiles_cantonese(result["parsed_tiles"])
        result["formatted_tiles"] = formatted
        
    return result


# --- Feature: Session & Analytics APIs ---
@app.post("/api/session/start", response_model=schemas.UserSessionResponse)
def start_session(db: Session = Depends(get_db)):
    """Initialize or retrieve a user training session."""
    user_sess = models.UserSession()
    db.add(user_sess)
    db.commit()
    db.refresh(user_sess)

    metric = models.AccuracyMetric(session_id=user_sess.id, total_scenarios=0, correct_count=0, accuracy_percentage=0.0)
    db.add(metric)
    db.commit()

    return schemas.UserSessionResponse(
        session_id=user_sess.id,
        created_at=user_sess.created_at.isoformat()
    )

@app.get("/api/metrics/{session_id}")
def get_metrics_api(session_id: str, db: Session = Depends(get_db)):
    """Retrieve accuracy metrics and decision logs for a user session."""
    metric = db.query(models.AccuracyMetric).filter(models.AccuracyMetric.session_id == session_id).first()
    logs = db.query(models.DecisionLog).filter(models.DecisionLog.session_id == session_id).order_by(models.DecisionLog.created_at.desc()).all()
    
    log_list = []
    for l in logs:
        log_list.append({
            "id": l.id,
            "user_discard": l.user_discard,
            "optimal_discard": l.optimal_discard,
            "is_correct": l.is_correct,
            "priority_level": l.priority_level,
            "created_at": l.created_at.isoformat()
        })

    return {
        "session_id": session_id,
        "metrics": {
            "total_scenarios": metric.total_scenarios if metric else 0,
            "correct_count": metric.correct_count if metric else 0,
            "accuracy_percentage": metric.accuracy_percentage if metric else 0.0
        },
        "history": log_list
    }


# =========================================================================
# Feature: 4-Player Table Game Match vs 3 AI Bots (人機對戰)
# =========================================================================

@app.post("/api/bot-game/start")
def start_bot_game(user_name: str = "Player (You)"):
    """Initializes a full 4-player Hong Kong Mahjong match vs 3 AI Bots."""
    game_id = str(uuid.uuid4())
    game = TableMatchGame(game_id=game_id, user_name=user_name)
    ACTIVE_TABLE_GAMES[game_id] = game
    return game.get_state()


@app.post("/api/bot-game/step")
def step_bot_game(req: Dict[str, Any]):
    """Advances the bot game loop by executing bot turns or advancing turns."""
    game_id = req.get("game_id")
    if not game_id or game_id not in ACTIVE_TABLE_GAMES:
        raise HTTPException(status_code=404, detail="Game session not found.")
    game = ACTIVE_TABLE_GAMES[game_id]
    return game.step_game_loop()


@app.post("/api/bot-game/discard")
def user_discard_tile(req: Dict[str, Any]):
    """Human player (seat 1) discards a tile."""
    game_id = req.get("game_id")
    tile = req.get("tile")
    if not game_id or game_id not in ACTIVE_TABLE_GAMES:
        raise HTTPException(status_code=404, detail="Game session not found.")
    if not tile:
        raise HTTPException(status_code=400, detail="Tile is required for discard.")

    game = ACTIVE_TABLE_GAMES[game_id]
    try:
        game.execute_discard(player_idx=1, tile=tile)
        # Advance game loop to process bot claims or next turns
        return game.step_game_loop()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/bot-game/claim")
def user_claim_action(req: Dict[str, Any]):
    """Human player takes a claim action: WIN, PONG, KONG, CHOW, PASS."""
    game_id = req.get("game_id")
    action = req.get("action")
    meld = req.get("meld")
    if not game_id or game_id not in ACTIVE_TABLE_GAMES:
        raise HTTPException(status_code=404, detail="Game session not found.")
    if not action:
        raise HTTPException(status_code=400, detail="Action is required.")

    game = ACTIVE_TABLE_GAMES[game_id]
    try:
        return game.execute_user_claim(action=action, meld=meld)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/bot-game/next-hand")
def start_next_hand_api(req: Dict[str, Any]):
    """Starts the next hand of the 16-hand TVB match."""
    game_id = req.get("game_id")
    if not game_id or game_id not in ACTIVE_TABLE_GAMES:
        raise HTTPException(status_code=404, detail="Game session not found.")
    game = ACTIVE_TABLE_GAMES[game_id]
    game.start_new_hand()
    return game.get_state()

