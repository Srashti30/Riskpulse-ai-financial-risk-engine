from portfolio import PORTFOLIO

# Shocks are illustrative scenario assumptions, not market forecasts.
SHOCKS = {
    "Geopolitical": {"Corporate Loans": -0.05, "Government Bonds": -0.03, "Corporate Bonds": -0.03, "Equities": -0.10, "Derivatives": -0.12},
    "Macroeconomic": {"Corporate Loans": -0.04, "Government Bonds": -0.06, "Corporate Bonds": -0.06, "Equities": -0.08, "Derivatives": -0.08},
    "Credit Event": {"Corporate Loans": -0.20, "Government Bonds": -0.03, "Corporate Bonds": -0.15, "Equities": -0.12, "Derivatives": -0.10},
    "Merger/Acquisition": {"Corporate Loans": -0.02, "Government Bonds": 0.00, "Corporate Bonds": -0.02, "Equities": -0.05, "Derivatives": -0.04},
    "Product Launch": {"Corporate Loans": 0.00, "Government Bonds": 0.00, "Corporate Bonds": 0.00, "Equities": -0.02, "Derivatives": -0.02},
    "Regulatory": {"Corporate Loans": -0.08, "Government Bonds": -0.05, "Corporate Bonds": -0.05, "Equities": -0.10, "Derivatives": -0.08},
    "Operational": {"Corporate Loans": -0.05, "Government Bonds": 0.00, "Corporate Bonds": -0.04, "Equities": -0.06, "Derivatives": -0.07},
    "Earnings": {"Corporate Loans": -0.02, "Government Bonds": 0.00, "Corporate Bonds": -0.03, "Equities": -0.07, "Derivatives": -0.06},
    "Other": {"Corporate Loans": -0.02, "Government Bonds": -0.01, "Corporate Bonds": -0.02, "Equities": -0.03, "Derivatives": -0.03},
}

def run_stress_test(event_type):
    shocks = SHOCKS.get(event_type, SHOCKS["Other"])
    rows = []
    before = sum(PORTFOLIO.values())
    after = 0
    for name, old_value in PORTFOLIO.items():
        shock = shocks[name]
        new_value = round(old_value * (1 + shock), 2)
        after += new_value
        rows.append({
            "name": name,
            "before": old_value,
            "after": new_value,
            "shock_pct": round(shock * 100, 2),
        })
    after = round(after, 2)
    return {
        "portfolio_before": before,
        "portfolio_after": after,
        "loss": round(after - before, 2),
        "holdings": rows,
        "event_type": event_type,
        "assumptions": "Illustrative fixed shocks; not financial advice or a market forecast.",
    }
