# DermaMind

**Your skin, backed by science.**

DermaMind is an AI-powered skincare education app that answers questions about ingredients, routines, and the research behind them. Built on Claude (Anthropic), it delivers structured, evidence-based responses tailored to your skin type and specific concerns.

## 🌐 Live Demo
👉 https://dermamind.zeabur.app
---

> ⚠️ **Disclaimer**
> DermaMind is for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified dermatologist or healthcare provider before changing your skincare routine, especially if you have a skin condition, allergy, or are taking medication. Individual results may vary.

---

## What It Does

- **Analyze any skincare question** — ask about routines, ingredients, skin concerns, or general skin science and get a structured, type-aware response
- **Ingredient deep-dives** — look up any ingredient to get its mechanism of action, evidence tier, effective concentration range, and what skin concerns it addresses
- **Latest skincare news** — a real-time sidebar pulls recent skincare research and articles via Anthropic's web search tool
- **Skin type context** — tag your skin type (Dry, Oily, Combination) to personalize every response
- **Session chat history** — switch between up to 5 conversations within a session

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Font | Inter (Google Fonts) |
| Routing | React Router v7 |
| Backend | FastAPI, Python 3.11+ |
| AI | Anthropic Claude (`claude-sonnet-4-5`) |
| Caching | Prompt caching (ephemeral) + in-memory ingredient cache |
| Deployment | Zeabur |

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- An [Anthropic API key](https://console.anthropic.com)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then add your ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_URL=http://localhost:8000
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Deploy to Zeabur

1. Push this repo to GitHub
2. Go to [zeabur.com](https://zeabur.com) and create a new project
3. Add two services — one for `backend/`, one for `frontend/`
4. Set environment variables:
   - **Backend**: `ANTHROPIC_API_KEY=sk-ant-...`
   - **Frontend**: `VITE_API_URL=https://your-backend.zeabur.app`
5. Zeabur auto-detects FastAPI and Vite — no extra config needed
6. After deploy, update `VITE_API_URL` in your frontend service to point to the live backend domain

---

## Project Structure

```
DermaMind/
├── backend/
│   ├── main.py            # FastAPI app — all routes and Claude calls
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main app, routing shell
│   │   ├── main.jsx       # Entry point with BrowserRouter
│   │   ├── index.css      # Tailwind base + custom animations
│   │   └── components/
│   │       ├── Terms.jsx
│   │       └── Disclaimer.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── LICENSE
└── README.md
```

---

## API Reference

All requests go to the FastAPI backend.

### `POST /analyze`

Analyzes a skincare question and returns a structured, type-aware response.

**Request body**
```json
{ "query": "What ingredients help with hyperpigmentation?" }
```

**Response**
```json
{
  "analysis": {
    "type": "concern",
    "summary": "...",
    "content": { "explanation": "...", "ingredients": [...] },
    "disclaimer": "..."
  },
  "usage": {
    "input_tokens": 120,
    "output_tokens": 340,
    "cache_read_input_tokens": 98,
    "cache_creation_input_tokens": 0
  }
}
```

Response `type` is one of: `routine` | `ingredient` | `general` | `concern`

---

### `POST /ingredient`

Returns a detailed breakdown of a single ingredient. Results are cached in-memory for the lifetime of the server process.

**Request body**
```json
{ "name": "niacinamide" }
```

**Response**
```json
{
  "ingredient": "niacinamide",
  "cached": false,
  "data": {
    "function": "...",
    "mechanism": "...",
    "evidence_tier": "strong",
    "key_studies": ["...", "..."],
    "best_for": ["hyperpigmentation", "pores", "oiliness"],
    "disclaimer": "..."
  }
}
```

---

### `GET /articles`

Fetches recent skincare news via Anthropic's web search tool. Retries once on failure and returns hardcoded fallback articles if both attempts fail.

**Response**
```json
{
  "articles": [
    {
      "title": "...",
      "source": "...",
      "date": "2025",
      "url": "https://...",
      "summary": "..."
    }
  ]
}
```

---

### `GET /health`

Returns server status and model info.

```json
{
  "status": "ok",
  "model": "claude-sonnet-4-5",
  "api_key_configured": true
}
```

---

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | `backend/.env` | Your Anthropic API key — required |
| `VITE_API_URL` | `frontend/.env` | Backend base URL (e.g. `http://localhost:8000`) |

---

## AI Behavior and Safety Design

- **No image input** — `/analyze` accepts text only; no skin photo analysis
- **Structured JSON output** — Claude is prompted to return typed JSON (`routine`, `ingredient`, `general`, `concern`) so the frontend renders responses appropriately rather than showing raw markdown
- **Prompt caching** — system prompts use `cache_control: ephemeral` to reduce latency and API cost on repeated requests
- **In-memory ingredient cache** — ingredient lookups are cached by lowercase name for the server session to avoid redundant API calls
- **Hardcoded disclaimer** — the warning notice is rendered client-side on every response card, independent of Claude's output, so it cannot be omitted
- **Fallback articles** — the news endpoint always returns content even if the web search fails, preventing an empty sidebar
- **No data persistence** — DermaMind stores no user data. Chat history lives in React state only and is cleared on page refresh

---

## Roadmap

- [ ] Ingredient comparison (side-by-side cards)
- [ ] Routine builder with drag-and-drop step ordering
- [ ] Product scanner (INCI list parser)
- [ ] Citation links on ingredient evidence claims
- [ ] Dark mode

---

## Built By

**Xueying Wu** — Data Science student, CompTIA Data+ certified.

DermaMind is an independent educational project built to explore applied AI in the consumer health and wellness space.

---

## License

Copyright © 2026 Xueying Wu. All rights reserved.

This software may not be copied, modified, distributed, or used in any form without explicit written permission from the copyright holder. See [LICENSE](LICENSE) for full terms.
