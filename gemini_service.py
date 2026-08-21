"""
Gemini Cognitive Engine Service.
Integrates Google Gemini API for Vision tile recognition and dynamic scenario delta evaluation.
Provides clear English explanations with Cantonese Jyutping pronunciation guides.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from PIL import Image
import io

logger = logging.getLogger("gemini_service")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
client = None

if GEMINI_API_KEY:
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini API Client initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini Client: {e}")
        client = None
else:
    logger.info("GEMINI_API_KEY not set. Using local rule engine.")


def analyze_hand_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Uses Gemini Vision API to analyze an image of Mahjong tiles and parse them into English & Cantonese notation with Jyutping pronunciations.
    """
    if not client:
        return {
            "success": False,
            "error": "Gemini API key is not configured. Please set GEMINI_API_KEY in environment.",
            "parsed_tiles": [],
            "raw_text": "Vision API disabled."
        }

    try:
        from google.genai import types
        image = Image.open(io.BytesIO(image_bytes))

        prompt = """
You are a Cantonese Mahjong Tile Recognition System (TVB Mahjong Championship 2026).
Analyze the uploaded image of Mahjong tiles carefully.
Identify all visible Mahjong tiles in order from left to right.

Convert each identified tile into standard Mahjong shorthand notation:
- Characters (萬子 1m to 9m)
- Dots (筒子 1p to 9p)
- Bamboos (索子 1s to 9s)
- Winds: East (東 1z), South (南 2z), West (西 3z), North (北 4z)
- Dragons: Red (中 5z), Green (發 6z), White (白 7z)

Return ONLY a JSON object with this exact structure:
{
  "tile_codes": ["1m", "2m", "3m", "4p", "5p", "6p", "7s", "8s", "9s", "1z", "1z", "5z", "5z", "5z"],
  "tile_string": "123m456p789s11z55z",
  "cantonese_description": "一萬 (jat1 maan6) 二萬 (ji6 maan6) 三萬 (saam1 maan6) ...",
  "english_description": "1 Character, 2 Character, 3 Character, 4 Dot, 5 Dot, 6 Dot, 7 Bamboo, 8 Bamboo, 9 Bamboo, East Wind, East Wind, Red Dragon, Red Dragon, Red Dragon",
  "confidence_notes": "All tiles identified clearly."
}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )

        result_json = json.loads(response.text)
        return {
            "success": True,
            "parsed_tiles": result_json.get("tile_codes", []),
            "tile_string": result_json.get("tile_string", ""),
            "cantonese_description": result_json.get("cantonese_description", ""),
            "english_description": result_json.get("english_description", ""),
            "confidence_notes": result_json.get("confidence_notes", "")
        }

    except Exception as e:
        logger.error(f"Gemini Vision API Error: {e}")
        return {
            "success": False,
            "error": f"Vision analysis error: {str(e)}",
            "parsed_tiles": []
        }


def generate_dynamic_scenario_commentary(
    hand_tiles: List[str],
    user_discard: str,
    optimal_discard: str,
    seat_wind: str,
    prevailing_wind: str,
    base_eval: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Uses Gemini API to generate dynamic tactical commentary in English with Cantonese Jyutping pronunciation guides.
    """
    if not client:
        return {
            "ai_enhanced": False,
            "commentary_en": base_eval.get("delta_reasoning_en", ""),
            "commentary_zh": base_eval.get("delta_reasoning_zh", ""),
            "tactical_rating": "Correct" if user_discard == optimal_discard else "Sub-optimal",
            "tvb_penalty_warning": "Warning: TVB 2026 Rules - Full Shooter (全包 - cyun4 baau1) and 12-Tile Penalty (十二張包自摸) penalties apply!"
        }

    try:
        from google.genai import types

        prompt = f"""
You are an expert Cantonese Mahjong Coach and Grandmaster Analyst for the TVB Mahjong Brain Fitness Championship 2026.
The user is an ENGLISH SPEAKER who is learning how to play Cantonese Mahjong and learn the Cantonese tile pronunciations (Jyutping).

Scenario Context:
- Player Hand Tiles: {hand_tiles}
- Seat Wind: {seat_wind}
- Prevailing Round Wind: {prevailing_wind}
- User Chosen Discard: {user_discard}
- Engine Recommended Optimal Discard: {optimal_discard}
- Priority Level: Level {base_eval.get('priority_level', 1)}
- Rule Engine Assessment: {base_eval.get('delta_reasoning_en')}

Provide a clear, encouraging, and tactical commentary IN ENGLISH. 
Whenever you mention any tile, suit, or rule name, ALWAYS include the Cantonese Jyutping pronunciation in parentheses (e.g., "East Wind (東風 - dung1 fung1)", "1 Character (一萬 - jat1 maan6)", "Half Flush (混一色 - wan6 jat1 sik1)").

Return a JSON object:
{{
  "tactical_rating": "S Grade / A Grade / B Grade / Risk Alert",
  "commentary_en": "Detailed English tactical commentary with Jyutping pronunciations explaining why the discard is optimal...",
  "commentary_zh": "Cantonese translation summary...",
  "tvb_penalty_warning": "Specific warning in English regarding Full Shooter (全包 - cyun4 baau1) or 12-Tile Penalty..."
}}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )

        result = json.loads(response.text)
        return {
            "ai_enhanced": True,
            "tactical_rating": result.get("tactical_rating", "Evaluated"),
            "commentary_en": result.get("commentary_en", ""),
            "commentary_zh": result.get("commentary_zh", ""),
            "tvb_penalty_warning": result.get("tvb_penalty_warning", "")
        }

    except Exception as e:
        logger.error(f"Gemini Commentary API Error: {e}")
        return {
            "ai_enhanced": False,
            "commentary_en": base_eval.get("delta_reasoning_en", ""),
            "commentary_zh": base_eval.get("delta_reasoning_zh", ""),
            "tactical_rating": "Evaluated",
            "tvb_penalty_warning": "Warning: TVB 2026 Rules - Full Shooter and 12-Tile Penalty apply."
        }
