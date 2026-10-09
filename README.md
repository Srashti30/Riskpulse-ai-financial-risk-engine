# RiskPulse – AI Financial Risk Engine

A beginner-friendly hackathon prototype that turns financial news into a sentiment signal, event category, impact score, and (for high-impact events) a synthetic portfolio stress test.

## What it does

1. Accepts financial news or market commentary in the React UI.
2. Uses Hugging Face **ProsusAI/finbert** for financial sentiment where available.
3. Classifies the event with a transparent keyword/rule-based classifier.
4. Calculates a deterministic impact score from event severity, negative sentiment strength, and severe-event terms.
5. If impact is 7 or higher, applies fixed event-specific shocks to a $60M synthetic portfolio.
6. Displays before/after values, estimated loss, a Recharts visualization, and in-session event history.

If FinBERT cannot be downloaded or loaded, the backend uses a deterministic keyword sentiment fallback so the demo can still run. The response identifies the engine used in `sentiment_model`.

## Project structure

```text
riskpulse/
├── backend/
│   ├── main.py
│   ├── risk_engine.py
│   ├── stress_test.py
│   ├── portfolio.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
└── README.md
```

## Requirements

- Python 3.10–3.12 recommended for the ML dependencies.
- Node.js 20 or newer and npm.
- Internet access on the first run if you want to download the FinBERT model. The model weights are downloaded by Hugging Face and cached locally.

## Run locally (Windows PowerShell)

Open **two terminals** from the `riskpulse` project directory.

### 1. Backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

If `py -3.12` is not installed, use `python -m venv .venv` with your installed supported Python version. On first analysis, FinBERT may take a little while to download and load.

If PowerShell blocks activation, run this in that terminal and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Optional quick demo without downloading FinBERT (keyword fallback sentiment):

```powershell
$env:RISKPULSE_DISABLE_FINBERT="1"
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API docs are at http://127.0.0.1:8000/docs.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally http://127.0.0.1:5173.

## API endpoints

### `GET /health`

Returns API health status.

### `GET /portfolio`

Returns the fixed synthetic holdings and portfolio total.

### `POST /analyze`

Request:

```json
{
  "text": "A major geopolitical conflict has disrupted global supply chains and caused severe market uncertainty."
}
```

Response fields include `sentiment_score` (-1 to +1), `event_type`, `impact_score` (1 to 10), `high_risk`, and `sentiment_model`. When impact is at least 7, `stress_test` contains `portfolio_before`, `portfolio_after`, `loss`, per-holding values, and scenario assumptions. For lower impact scores, `stress_test` is `null`.

## Portfolio and scenario assumptions

The synthetic starting portfolio is $60,000,000:
- Corporate Loans: $20,000,000
- Government Bonds: $15,000,000
- Corporate Bonds: $10,000,000
- Equities: $10,000,000
- Derivatives: $5,000,000

Shocks are fixed in `backend/stress_test.py` and vary by event category. The loss is `portfolio_after - portfolio_before`, so a loss is represented as a negative number. These scenarios are illustrative, not a forecast or investment advice.

## Troubleshooting

- **Frontend says API offline:** make sure the backend terminal is still running on port 8000.
- **FinBERT download/load fails:** the backend automatically falls back to keyword sentiment. For a fast offline-style demo, set `RISKPULSE_DISABLE_FINBERT=1` before starting the backend.
- **Port 8000 or 5173 is busy:** stop the other process or change the port in the backend command / `frontend/vite.config.js` and update the API URL in `frontend/src/App.jsx` if needed.
- **CORS:** the backend allows the local Vite URLs `localhost:5173` and `127.0.0.1:5173`.

## Important note

This is a hackathon demonstration using a fixed synthetic portfolio and simplified impact logic. It is not designed for production financial decisions and does not provide investment advice.
