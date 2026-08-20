import { activityLabel, compactMoney, displayDate, integer, metricPercent, money, opportunityLabel, safeNumber, toneLabel } from "../../lib/format";

function DirectionalMetric({ label, value }) {
  const number = safeNumber(value);
  const direction = number === null ? "" : number > 0 ? "is-positive" : number < 0 ? "is-negative" : "";
  return <div><span>{label}</span><strong className={direction}>{metricPercent(value)}</strong></div>;
}
export function OpportunityCard({ item, compared, onCompare, onResearch }) {
  const company = item.company || {};
  const ticker = company.ticker || "—";
  const score = safeNumber(item.opportunity?.score_percent ?? item.opportunity?.score_out_of_100);
  const fit = item.budget_fit || {};
  const filingClass = item.filing_tone?.label === "positive" ? "is-positive" : item.filing_tone?.label === "negative" ? "is-negative" : "";
  const oldSnapshot = item.reference_data?.freshness_status === "older_reference";
  return (
    <article className={`opportunity-card ${compared ? "is-compared" : ""}`} data-ticker={ticker}>
      <header className="opportunity-card__header">
        <span className="rank-badge">{String(item.rank).padStart(2, "0")}</span>
        <div className="company-identity">
          <span className="company-avatar">{ticker.slice(0, 2)}</span>
          <div>
            <div className="ticker-line"><strong className="company-ticker">{ticker}</strong><span className="company-size-badge">{item.company_size?.bucket || ""}</span></div>
            <h3 className="company-name">{company.name || "Unknown company"}</h3>
            <p className="company-sector">{[company.sector, company.industry].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <label className="compare-check">
          <input type="checkbox" checked={compared} onChange={(event) => onCompare(item, event.target.checked)} aria-label={`Compare ${ticker} ${company.name || "company"}`} />
          <span aria-hidden="true"/><b>Compare</b>
        </label>
      </header>
      <div className="opportunity-card__body">
        <section className="score-block">
          <div className="score-copy"><span>Opportunity score</span><strong>{score === null ? "—" : Math.round(score)}</strong><small>{opportunityLabel(item)}</small></div>
          <div className="score-visual" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, score || 0))}%` }}/></div>
        </section>
        <section className="budget-block">
          <div><span>With your budget</span><strong>{fit.applicable ? `${integer(fit.estimated_whole_shares)} shares` : "Set a budget"}</strong><small>{fit.applicable ? `${money(fit.estimated_invested_usd, 2)} estimated · ${money(fit.cash_remaining_usd, 2)} left` : "Historical estimate"}</small></div>
          <div><span>Price snapshot</span><strong>{money(item.reference_data?.reference_price_usd, 2)}</strong><small>{displayDate(item.reference_data?.price_as_of)}</small></div>
        </section>
        <div className="metric-grid">
          <div><span>Market cap</span><strong>{compactMoney(item.company_size?.market_cap_usd)}</strong></div>
          <DirectionalMetric label="12m trend" value={item.key_metrics?.momentum_12m_pct} />
          <DirectionalMetric label="Revenue growth" value={item.key_metrics?.revenue_growth_yoy_pct} />
          <DirectionalMetric label="Profit margin" value={item.key_metrics?.net_margin_pct} />
        </div>
        <div className="insight-row">
          <span className={filingClass}>{toneLabel(item.filing_tone)}</span>
          <span>{activityLabel(item.reference_data?.average_daily_trading_value_usd)}</span>
          <span className={oldSnapshot ? "is-warning" : ""}>{oldSnapshot ? "Older snapshot" : "Recent snapshot"}</span>
        </div>
        <ul className="highlights">{(item.highlights || []).slice(0, 3).map((text) => <li key={text}>{String(text).replace(/([+-]?\d{4,}(?:\.\d+)?)%/g, ">999%")}</li>)}</ul>
      </div>
      <footer><span className="card-disclaimer">Snapshot estimate, not a live quote</span><button className="research-company" type="button" onClick={() => onResearch(item)}>Research company <span aria-hidden="true">→</span></button></footer>
    </article>
  );
}
