"""
Pydantic Schemas for Mahjong Efficiency Trainer API.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# --- Tile Schemas ---
class FormattedTile(BaseModel):
    code: str
    unicode: str
    chinese: str
    jyutping: str
    english: str
    suit: str
    value: int
    is_terminal: bool
    is_honor: bool


class ParseTileRequest(BaseModel):
    raw_input: str = Field(..., json_schema_extra={"example": "123m456p789s1122z"})


class ParseTileResponse(BaseModel):
    success: bool
    tiles: List[str]
    formatted_tiles: List[Dict[str, Any]]
    errors: List[str]


# --- Efficiency Evaluator Schemas ---
class AcceptedTileOut(BaseModel):
    tile: str
    unicode: str
    chinese: str
    jyutping: str
    english: str
    suit: str
    value: int
    count: int
    resulting_shanten: int
    status_text: str


class DiscardEvaluation(BaseModel):
    tile: str
    unicode: str
    chinese: str
    jyutping: str
    english: str
    suit: str
    value: int
    shanten: int
    shanten_text: str
    total_outs: int
    unique_acceptance_count: int
    accepted_tiles: List[AcceptedTileOut]
    viable_paths: List[Dict[str, Any]]
    is_chicken_hand_trap: bool
    unconstrained_shanten: int
    is_optimal: bool


class HandEvaluationResponse(BaseModel):
    hand_tiles: List[str]
    seat_wind: str
    prevailing_wind: str
    is_winning_hand: bool
    winning_fan: Optional[Dict[str, Any]] = None
    best_shanten: int
    max_outs: int
    optimal_discard: str
    optimal_discards: List[str]
    summary_en: str
    summary_zh: str
    discards: List[DiscardEvaluation]
    comparison: Optional[Dict[str, Any]] = None


class EvaluateHandRequest(BaseModel):
    hand_tiles: List[str] = Field(..., json_schema_extra={"example": ["1m","2m","3m","4p","5p","6p","7s","8s","9s","1z","1z","1z","5z","6z"]})
    user_discard: Optional[str] = Field(None, json_schema_extra={"example": "6z"})
    seat_wind: str = Field("1z", json_schema_extra={"example": "1z"})
    prevailing_wind: str = Field("1z", json_schema_extra={"example": "1z"})
    session_id: Optional[str] = None
    open_melds: Optional[List[Dict[str, Any]]] = None


class RandomHandRequest(BaseModel):
    category: Optional[str] = Field("all", json_schema_extra={"example": "all"})
    seat_wind: str = Field("1z", json_schema_extra={"example": "1z"})
    prevailing_wind: str = Field("1z", json_schema_extra={"example": "1z"})
    session_id: Optional[str] = None


class NextTurnRequest(BaseModel):
    hand_tiles: List[str] = Field(...)
    discard_tile: str = Field(..., json_schema_extra={"example": "1z"})
    draw_tile: Optional[str] = None
    seat_wind: str = Field("1z")
    prevailing_wind: str = Field("1z")
    session_id: Optional[str] = None
    open_melds: Optional[List[Dict[str, Any]]] = None


# --- Fan Calculator & Quiz Schemas ---
class FanCalculatorRequest(BaseModel):
    tiles: List[str] = Field(..., min_length=14, max_length=14, json_schema_extra={"example": ["1m","2m","3m","4p","5p","6p","7s","8s","9s","1z","1z","1z","5z","5z"]})
    winning_tile: Optional[str] = None
    is_self_draw: bool = False
    prevailing_wind: str = "1z"
    seat_wind: str = "1z"


class VerifyFanQuizRequest(BaseModel):
    hand_tiles: List[str] = Field(..., min_length=14, max_length=14)
    winning_tile: Optional[str] = None
    is_self_draw: bool = False
    prevailing_wind: str = "1z"
    seat_wind: str = "1z"
    user_fan: int
    user_patterns: List[str] = Field(default_factory=list)


# --- Puzzle Drill Schemas ---
class PuzzleDrillRequest(BaseModel):
    category: str = Field("waits", json_schema_extra={"example": "waits"})
    seat_wind: str = Field("1z", json_schema_extra={"example": "1z"})
    prevailing_wind: str = Field("1z", json_schema_extra={"example": "1z"})


# --- Lexicon Schemas ---
class LexiconSearchRequest(BaseModel):
    query: str = Field(..., json_schema_extra={"example": "混一色"})


# --- Session & Analytics Schemas ---
class UserSessionResponse(BaseModel):
    session_id: str
    created_at: str


# --- Defense Engine & Drills Schemas ---
class VerifyDefenseDecisionRequest(BaseModel):
    puzzle_type: str = "betaori"
    user_choice: str
    ground_truth: Dict[str, Any]


class AnalyzeHandSafetyRequest(BaseModel):
    hand_tiles: List[str] = Field(..., min_length=1, max_length=14)
    target_river: List[Dict[str, Any]] = Field(default_factory=list)
    table_visible_counts: Optional[List[int]] = None
    prevailing_wind: str = "1z"
    target_seat_wind: str = "1z"
    target_melds_count: int = 0



class AccuracyMetricResponse(BaseModel):
    session_id: str
    total_scenarios: int
    correct_count: int
    accuracy_percentage: float
