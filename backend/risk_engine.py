"""FinBERT sentiment with a deterministic fallback if model download is unavailable."""
import os
import re

EVENT_KEYWORDS = {
    "Geopolitical": ["war", "conflict", "invasion", "sanction", "geopolitical", "military", "terror", "supply chain"],
    "Macroeconomic": ["inflation", "interest rate", "recession", "gdp", "unemployment", "central bank", "currency", "economic growth"],
    "Credit Event": ["default", "bankruptcy", "debt restructuring", "missed payment", "credit downgrade", "insolvency", "bond default"],
    "Merger/Acquisition": ["merger", "acquisition", "acquire", "takeover", "buyout"],
    "Product Launch": ["product launch", "launches a product", "new product", "product release"],
    "Regulatory": ["regulation", "regulatory", "fine", "lawsuit", "antitrust", "compliance", "investigation", "ban"],
    "Operational": ["cyberattack", "data breach", "outage", "factory", "recall", "disruption", "operational failure"],
    "Earnings": ["earnings", "revenue", "profit", "quarterly results", "losses", "forecast", "guidance"],
}
NEGATIVE = {"crisis": 2, "severe": 2, "default": 3, "collapse": 3, "disrupted": 2, "decline": 1, "loss": 1, "risk": 1, "fraud": 2, "bankruptcy": 3, "uncertainty": 1, "downgrade": 2, "fall": 1, "plunge": 2}
POSITIVE = {"growth": 1, "surge": 2, "profit": 1, "strong": 1, "record": 1, "upgrade": 2, "recovery": 1, "beat": 1, "expansion": 1}

_classifier = None
_model_error = None

def _get_finbert():
    global _classifier, _model_error
    if _classifier is not None:
        return _classifier
    if _model_error:
        return None
    if os.getenv("RISKPULSE_DISABLE_FINBERT", "").lower() in {"1", "true", "yes"}:
        _model_error = "FinBERT disabled by environment"
        return None
    try:
        from transformers import pipeline
        _classifier = pipeline("text-classification", model="ProsusAI/finbert", tokenizer="ProsusAI/finbert", top_k=None)
        return _classifier
    except Exception as exc:
        _model_error = str(exc)
        return None

def sentiment_score(text):
    model = _get_finbert()
    if model:
        try:
            predictions = model(text[:4000])[0]
            scores = {item["label"].lower(): float(item["score"]) for item in predictions}
            return round(max(-1.0, min(1.0, scores.get("positive", 0.0) - scores.get("negative", 0.0))), 4), "FinBERT"
        except Exception:
            pass
    words = re.findall(r"[a-z]+", text.lower())
    score = sum(NEGATIVE.get(w, 0) for w in words) - sum(POSITIVE.get(w, 0) for w in words)
    # Bounded deterministic fallback, used only when FinBERT cannot be loaded.
    return round(max(-1.0, min(1.0, score / 8.0)), 4), "keyword fallback"

def classify_event(text):
    lowered = text.lower()
    scores = {category: sum(lowered.count(keyword) for keyword in keywords) for category, keywords in EVENT_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Other"

def calculate_impact(text, sentiment, event_type):
    # Combines negative sentiment strength, event-specific severity, and text signals.
    base = {
        "Geopolitical": 7, "Macroeconomic": 6, "Credit Event": 8,
        "Merger/Acquisition": 4, "Product Launch": 3, "Regulatory": 7,
        "Operational": 6, "Earnings": 5, "Other": 3,
    }[event_type]
    negative_strength = max(0.0, -sentiment)
    severe_terms = ["severe", "major", "critical", "default", "collapse", "bankruptcy", "disrupted", "crisis"]
    severity_bonus = min(2, sum(1 for term in severe_terms if term in text.lower()) // 2 + (1 if any(term in text.lower() for term in severe_terms) else 0))
    # Negative sentiment increases impact; positive sentiment moderates it slightly.
    impact = round(base + negative_strength * 2 + severity_bonus - max(0.0, sentiment) * 1.5)
    return max(1, min(10, int(impact)))

def analyze_text(text):
    score, model_used = sentiment_score(text)
    event_type = classify_event(text)
    impact = calculate_impact(text, score, event_type)
    return {
        "text": text,
        "sentiment_score": score,
        "event_type": event_type,
        "impact_score": impact,
        "high_risk": impact >= 7,
        "sentiment_model": model_used,
    }
