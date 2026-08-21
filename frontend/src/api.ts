import { HandEvaluation, UserComparison, NextTurnResponse, FanCalculationResponse } from './types';

const API_BASE = '/api';

export async function fetchRandomHand(seatWind = '1z', prevailingWind = '1z', sessionId: string | null = null): Promise<{
  tiles: string[];
  seat_wind: string;
  prevailing_wind: string;
  remaining_wall_count: number;
  evaluation: HandEvaluation;
}> {
  const res = await fetch(`${API_BASE}/random-hand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seat_wind: seatWind,
      prevailing_wind: prevailingWind,
      session_id: sessionId
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to deal random hand.');
  }
  return res.json();
}

export async function evaluateHand(
  handTiles: string[],
  userDiscard?: string,
  seatWind = '1z',
  prevailingWind = '1z',
  sessionId: string | null = null
): Promise<HandEvaluation> {
  const res = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hand_tiles: handTiles,
      user_discard: userDiscard || null,
      seat_wind: seatWind,
      prevailing_wind: prevailingWind,
      session_id: sessionId
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to evaluate hand.');
  }
  return res.json();
}

export async function parseHandNotation(rawInput: string): Promise<{
  success: boolean;
  tiles: string[];
  errors: string[];
  evaluation?: HandEvaluation;
}> {
  const res = await fetch(`${API_BASE}/parse-hand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_input: rawInput })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to parse hand notation.');
  }
  return res.json();
}

export async function executeNextTurn(
  handTiles: string[],
  discardTile: string,
  seatWind = '1z',
  prevailingWind = '1z',
  sessionId: string | null = null
): Promise<NextTurnResponse> {
  const res = await fetch(`${API_BASE}/next-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hand_tiles: handTiles,
      discard_tile: discardTile,
      seat_wind: seatWind,
      prevailing_wind: prevailingWind,
      session_id: sessionId
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to draw next turn.');
  }
  return res.json();
}

export async function calculateFanBreakdown(
  tiles: string[],
  seatWind = '1z',
  prevailingWind = '1z',
  isSelfDraw = false
): Promise<FanCalculationResponse> {
  const res = await fetch(`${API_BASE}/fan-counter/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tiles,
      seat_wind: seatWind,
      prevailing_wind: prevailingWind,
      is_self_draw: isSelfDraw
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to calculate Fan.');
  }
  return res.json();
}

export async function fetchDrillPuzzle(
  category = 'waits',
  seatWind = '1z',
  prevailingWind = '1z'
): Promise<{ puzzle: any }> {
  const res = await fetch(`${API_BASE}/puzzles/generate-drill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
      seat_wind: seatWind,
      prevailing_wind: prevailingWind
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to generate drill puzzle.');
  }
  return res.json();
}

export async function fetchHandBreakdown(
  handTiles: string[],
  seatWind = '1z',
  prevailingWind = '1z'
): Promise<any> {
  const res = await fetch(`${API_BASE}/hand/analyze-breakdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hand_tiles: handTiles,
      seat_wind: seatWind,
      prevailing_wind: prevailingWind
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to analyze hand breakdown.');
  }
  return res.json();
}



