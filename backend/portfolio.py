PORTFOLIO = {
    "Corporate Loans": 20_000_000,
    "Government Bonds": 15_000_000,
    "Corporate Bonds": 10_000_000,
    "Equities": 10_000_000,
    "Derivatives": 5_000_000,
}

def get_portfolio():
    return {
        "holdings": [{"name": name, "value": value} for name, value in PORTFOLIO.items()],
        "total": sum(PORTFOLIO.values()),
    }
