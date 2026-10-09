from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from portfolio import get_portfolio
from risk_engine import analyze_text
from stress_test import run_stress_test

app = FastAPI(title="RiskPulse – AI Financial Risk Engine", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=8, max_length=12000)

@app.get("/health")
def health():
    return {"status": "ok", "service": "RiskPulse API"}

@app.get("/portfolio")
def portfolio():
    return get_portfolio()

@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    text = request.text.strip()
    if len(text) < 8:
        raise HTTPException(status_code=422, detail="Please enter at least 8 characters of financial news.")
    try:
        result = analyze_text(text)
        if result["impact_score"] >= 7:
            result["stress_test"] = run_stress_test(result["event_type"])
        else:
            result["stress_test"] = None
        return result
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Risk analysis failed: {exc}")
