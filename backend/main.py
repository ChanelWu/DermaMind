from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import anthropic
import json
from dotenv import load_dotenv
import os
import asyncio
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

app = FastAPI(title="DermaMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://dermamind.zeabur.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── rate limiting ──────────────────────────────────────────────────────────────

RATE_LIMIT = 10        # max requests
RATE_WINDOW = 3600     # per hour (seconds)

# { ip: [timestamp, timestamp, ...] }
_rate_store: dict[str, list[float]] = defaultdict(list)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health checks
    if request.url.path == "/health":
        return await call_next(request)

    ip = _get_client_ip(request)
    now = time.time()
    window_start = now - RATE_WINDOW

    # Drop timestamps outside the current window
    _rate_store[ip] = [t for t in _rate_store[ip] if t > window_start]

    if len(_rate_store[ip]) >= RATE_LIMIT:
        oldest = _rate_store[ip][0]
        retry_after = int(oldest + RATE_WINDOW - now) + 1
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Rate limit exceeded. Please try again later.",
                "retry_after_seconds": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )

    _rate_store[ip].append(now)
    return await call_next(request)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-5"

ANALYZE_SYSTEM = """\
You are DermaMind, an educational skincare science assistant. \
Answer the user's specific question directly and clearly.
Tailor your response format to the question type:
- For routine requests: provide a structured morning and evening routine with specific steps and why each step matters
- For ingredient questions: explain the science, mechanism, and evidence behind that specific ingredient
- For general skin questions: give a clear educational answer
- For skin concern questions: explain the concern and mention 2-3 relevant ingredients with brief explanations
Always be specific, educational, and directly answer what was asked. \
Never give the same generic ingredient list regardless of the question. \
Include disclaimer at the end: 'For personal advice, consult a dermatologist.'

Return JSON only (no markdown, no prose) with these exact keys:
- type: one of "routine" | "ingredient" | "general" | "concern"
- summary: one sentence overview of your answer
- content: object structured by type:
  * if type is "routine": { "morning": [{"step": string, "why": string}], "evening": [{"step": string, "why": string}] }
  * if type is "ingredient": { "mechanism": string, "evidence_tier": "strong"|"moderate"|"emerging", "best_for": [string], "concentration": string }
  * if type is "general": { "answer": string }
  * if type is "concern": { "explanation": string, "ingredients": [{"name": string, "function": string, "evidence_tier": string}] }
- disclaimer: "Educational purposes only. DermaMind provides general skincare science information and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified dermatologist or healthcare provider before making changes to your skincare routine, especially if you have a skin condition, allergy, or are taking medication. Individual results may vary."\
"""

INGREDIENT_SYSTEM = """\
You are a cosmetic dermatology research assistant providing educational skincare science only. \
For the given ingredient, return JSON only with these keys:
- function: what it does
- mechanism: one sentence on how it works at a cellular level
- evidence_tier: one of strong / moderate / emerging
- key_studies: array of 2 real published study citations with year
- best_for: skin concerns it has been studied for
- disclaimer: always include 'This information is for educational purposes only. Consult a dermatologist for personal advice.'

Be concise. Return JSON only, no preamble, no markdown.\
"""

_ingredient_cache: dict[str, dict] = {}


class AnalyzeRequest(BaseModel):
    query: str


class IngredientRequest(BaseModel):
    name: str


@app.post("/analyze")
async def analyze_skin(request: AnalyzeRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1000,
            system=[
                {
                    "type": "text",
                    "text": ANALYZE_SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": request.query}],
        )
        raw = next((b.text for b in response.content if b.type == "text"), "{}")
        start, end = raw.find("{"), raw.rfind("}") + 1
        data = json.loads(raw[start:end]) if start != -1 and end > start else {}
        return {
            "analysis": data,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "cache_read_input_tokens": getattr(response.usage, "cache_read_input_tokens", 0),
                "cache_creation_input_tokens": getattr(response.usage, "cache_creation_input_tokens", 0),
            },
        }
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Invalid JSON from model: {e}")


@app.post("/ingredient")
async def ingredient_breakdown(request: IngredientRequest):
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Ingredient name cannot be empty")

    cache_key = name.lower()
    if cache_key in _ingredient_cache:
        return {"ingredient": name, "cached": True, "data": _ingredient_cache[cache_key]}

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=600,
            system=[
                {
                    "type": "text",
                    "text": INGREDIENT_SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": name}],
        )
        raw = next((b.text for b in response.content if b.type == "text"), "{}")
        start, end = raw.find("{"), raw.rfind("}") + 1
        data = json.loads(raw[start:end]) if start != -1 and end > start else {}
        _ingredient_cache[cache_key] = data
        return {"ingredient": name, "cached": False, "data": data}
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Invalid JSON from model: {e}")


FALLBACK_ARTICLES = [
    {
        "title": "The Science Behind Retinol: What Research Says",
        "source": "Journal of Dermatology",
        "date": "2025",
        "url": "#",
        "summary": "A look at decades of retinol research and why it remains the gold standard in anti-aging skincare.",
    },
    {
        "title": "Niacinamide: The Multitasking Ingredient Dermatologists Love",
        "source": "Dermatology Times",
        "date": "2025",
        "url": "#",
        "summary": "How this vitamin B3 derivative addresses multiple skin concerns simultaneously.",
    },
    {
        "title": "SPF Every Day: Why Sun Protection Is the Best Anti-Aging Tool",
        "source": "American Academy of Dermatology",
        "date": "2025",
        "url": "#",
        "summary": "Research consistently shows daily SPF use prevents premature aging better than any serum.",
    },
]


def _fetch_articles_once() -> list:
    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[{
            "role": "user",
            "content": (
                "skincare anti-aging serum retinol collagen news 2025. "
                "Respond with a JSON array only — no prose, no markdown fences. "
                "Each item must have exactly these keys: title, source, date, url, summary "
                "(summary is one sentence description of the article)."
            ),
        }],
    )
    raw = next((b.text for b in response.content if b.type == "text"), "[]")
    start, end = raw.find("["), raw.rfind("]") + 1
    return json.loads(raw[start:end]) if start != -1 and end > start else []


def _web_search_articles() -> list:
    try:
        items = _fetch_articles_once()
        if items:
            return items
        print("[articles] First attempt returned empty, retrying in 2s...")
    except Exception as e:
        print(f"[articles] First attempt failed: {e!r}, retrying in 2s...")

    time.sleep(2)

    try:
        items = _fetch_articles_once()
        if items:
            return items
        print("[articles] Retry also returned empty, using fallback.")
    except Exception as e:
        print(f"[articles] Retry failed: {e!r}, using fallback.")

    return FALLBACK_ARTICLES


@app.get("/articles")
async def get_articles():
    try:
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as pool:
            items = await loop.run_in_executor(pool, _web_search_articles)
        return {"articles": items[:5]}
    except Exception as e:
        print(f"[articles] Unexpected error in endpoint: {e!r}")
        return {"articles": FALLBACK_ARTICLES}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": MODEL,
        "api_key_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
    }
