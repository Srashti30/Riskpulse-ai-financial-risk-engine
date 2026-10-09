import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3,
  CheckCircle2, CircleDollarSign, Clock3, Newspaper, RefreshCw, ShieldAlert,
  ShieldCheck, TrendingDown, Zap
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

const API = "http://127.0.0.1:8000";
const money = (n) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0
}).format(n ?? 0);
const compactMoney = (n) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return money(n);
};
const sampleNews = "A major geopolitical conflict has disrupted global supply chains and caused severe market uncertainty.";

function MetricCard({ label, value, sub, icon: Icon, tone = "blue" }) {
  return <div className="metric-card">
    <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
    {sub && <div className="metric-sub">{sub}</div>}
  </div>;
}

export default function App() {
  const [news, setNews] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    fetch(`${API}/health`).then(r => {
      if (!r.ok) throw new Error("API unavailable");
      return r.json();
    }).then(() => setApiOnline(true)).catch(() => setApiOnline(false));
    fetch(`${API}/portfolio`).then(r => r.json()).then(setPortfolio).catch(() => {});
  }, []);

  const chartData = useMemo(() => {
    const holdings = result?.stress_test?.holdings;
    if (!holdings) return [];
    const groupNames = {
      "Corporate Loans": "Loans",
      "Government Bonds": "Gov. bonds",
      "Corporate Bonds": "Corp. bonds",
      "Equities": "Equities",
      "Derivatives": "Derivatives",
    };
    return holdings.map(h => ({
      name: groupNames[h.name] || h.name,
      Before: h.before,
      After: h.after,
    }));
  }, [result]);

  async function analyze(event) {
    event.preventDefault();
    if (!news.trim()) {
      setError("Paste some financial news or market commentary to analyze.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: news.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Analysis failed. Please try again.");
      setResult(data);
      setHistory(previous => [{ ...data, id: Date.now(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...previous].slice(0, 8));
    } catch (err) {
      setError(`${err.message}. Make sure the FastAPI backend is running at ${API}.`);
    } finally {
      setLoading(false);
    }
  }

  const stress = result?.stress_test;
  const riskColor = result?.high_risk ? "red" : "green";

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><Activity size={23} strokeWidth={2.5} /></div>
        <div><div className="brand-name">Risk<span>Pulse</span></div><div className="brand-subtitle">AI FINANCIAL RISK INTELLIGENCE</div></div>
      </div>
      <div className="topbar-right">
        <div className={`api-status ${apiOnline ? "online" : "offline"}`}><span className="status-dot" />{apiOnline ? "API CONNECTED" : "API OFFLINE"}</div>
        <div className="avatar">RP</div>
      </div>
    </header>

    <main className="dashboard">
      <section className="welcome-row">
        <div><div className="eyebrow"><span className="eyebrow-line" /> RISK MONITORING / OVERVIEW</div>
          <h1>Financial risk <span>at a glance.</span></h1>
          <p className="muted">Turn market headlines into structured signals and portfolio stress scenarios.</p>
        </div>
        <div className="market-pill"><span className="pulse-dot" /> LIVE ANALYSIS WORKSPACE</div>
      </section>

      <section className="analysis-layout">
        <div className="panel input-panel">
          <div className="panel-heading"><div className="heading-icon"><Newspaper size={18} /></div><div><h2>News intelligence</h2><p>Analyze a financial event or market headline</p></div></div>
          <form onSubmit={analyze}>
            <label htmlFor="news" className="field-label">FINANCIAL NEWS / TEXT</label>
            <textarea id="news" value={news} onChange={e => setNews(e.target.value)} maxLength={12000}
              placeholder="Paste financial news, an earnings update, regulatory announcement, or macroeconomic event…" />
            <div className="input-footer"><span>{news.length.toLocaleString()} / 12,000 characters</span><button type="button" className="text-button" onClick={() => setNews(sampleNews)}>Load sample <ArrowUpRight size={13} /></button></div>
            {error && <div className="error-box"><AlertTriangle size={16} />{error}</div>}
            <button className="analyze-button" type="submit" disabled={loading || !news.trim()}>
              {loading ? <><RefreshCw className="spin" size={17} /> Analyzing signal…</> : <><Zap size={17} /> Analyze risk <ArrowUpRight size={16} /></>}
            </button>
            <div className="privacy-note"><ShieldCheck size={14} /> Prototype mode · Text is processed by your local backend</div>
          </form>
        </div>

        <div className="panel signal-panel">
          <div className="panel-heading"><div className="heading-icon purple"><Activity size={18} /></div><div><h2>Risk signal</h2><p>Model output and event classification</p></div>
            <span className="panel-tag">LATEST</span>
          </div>
          {result ? <>
            <div className={`risk-banner ${result.high_risk ? "high" : "normal"}`}>
              {result.high_risk ? <ShieldAlert size={21} /> : <ShieldCheck size={21} />}
              <div><strong>{result.high_risk ? "HIGH RISK EVENT DETECTED" : "NO HIGH-RISK THRESHOLD BREACH"}</strong><span>{result.high_risk ? "Impact threshold met · Stress test triggered" : "Impact score is below 7 · No stress test triggered"}</span></div>
            </div>
            <div className="signal-grid">
              <div className="signal-stat"><span className="signal-label">SENTIMENT SCORE</span><strong className={result.sentiment_score < 0 ? "negative" : "positive"}>{result.sentiment_score > 0 ? "+" : ""}{result.sentiment_score.toFixed(2)}</strong><div className="sentiment-track"><div className={`sentiment-fill ${result.sentiment_score < 0 ? "neg-fill" : "pos-fill"}`} style={{ width: `${Math.abs(result.sentiment_score) * 100}%` }} /></div><small>{result.sentiment_score < -0.25 ? "Negative sentiment" : result.sentiment_score > 0.25 ? "Positive sentiment" : "Neutral / mixed sentiment"}</small></div>
              <div className="signal-stat"><span className="signal-label">EVENT TYPE</span><strong className="event-type">{result.event_type}</strong><small>Rule-based classification</small></div>
              <div className="signal-stat impact-stat"><span className="signal-label">IMPACT SCORE</span><strong>{result.impact_score}<span className="out-of"> / 10</span></strong><div className="impact-track">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < result.impact_score ? (result.impact_score >= 7 ? "filled red-fill" : "filled blue-fill") : ""} />)}</div><small>{result.impact_score >= 7 ? "Elevated portfolio sensitivity" : "Below automatic stress threshold"}</small></div>
            </div>
            <div className="model-footnote"><span>Sentiment engine</span><strong>{result.sentiment_model || "FinBERT"}</strong><span className="footnote-separator">·</span><span>Impact threshold</span><strong>7 / 10</strong></div>
          </> : <div className="empty-state"><div className="empty-orbit"><Activity size={28} /></div><strong>Awaiting your first signal</strong><p>Submit a news item to see sentiment, event classification, and impact scoring here.</p><div className="empty-chips"><span>Sentiment</span><span>Event type</span><span>Impact score</span></div></div>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-title-row"><div><div className="eyebrow">PORTFOLIO EXPOSURE</div><h2>Stress test overview</h2></div><div className="section-caption"><span className="tiny-dot" /> Synthetic fixed portfolio <span className="separator">/</span> USD</div></div>
        {stress ? <>
          <div className="portfolio-metrics">
            <MetricCard label="PORTFOLIO BEFORE" value={money(stress.portfolio_before)} sub="Baseline portfolio value" icon={CircleDollarSign} />
            <MetricCard label="PORTFOLIO AFTER" value={money(stress.portfolio_after)} sub="Post-shock estimated value" icon={BarChart3} tone="purple" />
            <MetricCard label="ESTIMATED LOSS" value={money(Math.abs(stress.loss))} sub={`${((Math.abs(stress.loss) / stress.portfolio_before) * 100).toFixed(2)}% portfolio drawdown`} icon={TrendingDown} tone="red" />
            <MetricCard label="SCENARIO" value={stress.event_type} sub="Predefined event-type shocks" icon={Zap} tone="amber" />
          </div>
          <div className="panel chart-panel">
            <div className="chart-heading"><div><h3>Portfolio value by asset class</h3><p>Before vs. after the {stress.event_type.toLowerCase()} scenario</p></div><div className="chart-legend"><span><i className="legend-before" /> Before</span><span><i className="legend-after" /> After</span></div></div>
            <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 12, right: 10, left: 4, bottom: 4 }} barGap={7}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#202c3d" />
              <XAxis dataKey="name" tick={{ fill: "#91a0b5", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={compactMoney} tick={{ fill: "#91a0b5", fontSize: 11 }} axisLine={false} tickLine={false} width={68} />
              <Tooltip formatter={(value) => money(value)} contentStyle={{ background: "#111b2b", border: "1px solid #29374a", borderRadius: 10, color: "#f3f6fb" }} labelStyle={{ color: "#a9b6c8" }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ display: "none" }} />
              <Bar dataKey="Before" fill="#52647e" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="After" fill="#39c6a2" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart></ResponsiveContainer></div>
            <div className="chart-note"><AlertTriangle size={14} /> Scenario shocks are illustrative assumptions, not a market forecast or investment advice.</div>
          </div>
        </> : <div className="portfolio-placeholder">
          <div className="placeholder-icon"><BarChart3 size={21} /></div><div><strong>Portfolio stress test will appear here</strong><p>When an event scores 7 or higher, RiskPulse applies predefined shocks and visualizes the estimated change.</p></div>
          <div className="placeholder-total"><span>BASE PORTFOLIO</span><strong>{money(portfolio?.total ?? 60000000)}</strong></div>
        </div>}
      </section>

      <section className="section-block history-section">
        <div className="section-title-row"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>Event history <span className="count-badge">{history.length}</span></h2></div><div className="section-caption"><Clock3 size={14} /> This session only</div></div>
        <div className="panel history-panel">
          {history.length ? <div className="table-scroll"><table><thead><tr><th>EVENT / NEWS</th><th>EVENT TYPE</th><th>SENTIMENT</th><th>IMPACT</th><th>STATUS</th><th>TIME</th></tr></thead><tbody>
            {history.map(item => <tr key={item.id}><td className="news-cell">{item.text}</td><td><span className="type-pill">{item.event_type}</span></td><td className={item.sentiment_score < 0 ? "negative" : "positive"}>{item.sentiment_score > 0 ? "+" : ""}{item.sentiment_score.toFixed(2)}</td><td><span className={`impact-pill ${item.high_risk ? "high" : ""}`}>{item.impact_score}/10</span></td><td><span className={`status-pill ${item.high_risk ? "danger" : "safe"}`}>{item.high_risk ? "High risk" : "Monitored"}</span></td><td className="time-cell">{item.time}</td></tr>)}
          </tbody></table></div> : <div className="history-empty"><Clock3 size={18} /><span>Your analyzed news items will appear here during this session.</span></div>}
        </div>
      </section>
      <footer><div className="footer-brand"><Activity size={15} /> RiskPulse</div><span>Hackathon prototype · Synthetic portfolio data · Not financial advice</span><span className="footer-version">v1.0.0</span></footer>
    </main>
  </div>;
}
