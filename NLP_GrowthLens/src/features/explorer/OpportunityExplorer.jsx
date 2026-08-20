import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { postJson } from "../../lib/api";
import { human, integer, money, safeNumber } from "../../lib/format";
import { ChartIcon, LockIcon } from "../../components/Icons";
import { CompareDialog } from "./CompareDialog";
import { OpportunityCard } from "./OpportunityCard";

const DEFAULT_FILTERS = {
  budget: "500", sector: "", sizes: ["micro", "small", "mid"], score: 0,
  query: "", minCap: "", maxCap: "", growingRevenue: false, profitable: false,
  positiveTrend: false, recentOnly: true, activeOnly: true, sort: "opportunity_desc",
};

function buildPayload(filters, offset = 0) {
  const minCap = safeNumber(filters.minCap);
  const maxCap = safeNumber(filters.maxCap);
  return {
    budget_usd: safeNumber(filters.budget), sector: filters.sector || null,
    company_size: filters.sizes, signal_status: "all", min_opportunity_score: filters.score / 100,
    min_market_cap_usd: minCap === null ? null : minCap * 1_000_000,
    max_market_cap_usd: maxCap === null ? null : maxCap * 1_000_000,
    query: filters.query.trim() || null, positive_revenue_growth: filters.growingRevenue,
    profitable: filters.profitable, positive_momentum: filters.positiveTrend,
    include_stale: !filters.recentOnly, include_low_activity: !filters.activeOnly,
    sort: filters.sort, limit: 20, offset,
  };
}
function validateFilters(filters) {
  const budget = safeNumber(filters.budget);
  const minCap = safeNumber(filters.minCap);
  const maxCap = safeNumber(filters.maxCap);
  if (budget === null || budget <= 0) return "Enter an investment amount greater than $0.";
  if (!filters.sizes.length) return "Select at least one company size.";
  if (filters.minCap.trim() && (minCap === null || minCap < 0)) return "Enter a valid minimum company value in millions.";
  if (filters.maxCap.trim() && (maxCap === null || maxCap < 0)) return "Enter a valid maximum company value in millions.";
  if (minCap !== null && maxCap !== null && minCap > maxCap) return "Minimum company value cannot be greater than the maximum.";
  return "";
}

function FilterChips({ payload }) {
  const values = [
    payload.budget_usd ? `Budget ${money(payload.budget_usd)}` : null,
    payload.sector || "All sectors",
    payload.company_size.length === 3 ? "All company sizes" : payload.company_size.map(human).join(", "),
    `Score ≥ ${Math.round(payload.min_opportunity_score * 100)}`,
    payload.include_stale ? "Older snapshots included" : "Recent snapshots",
    payload.include_low_activity ? "All activity levels" : "Established trading activity",
    payload.positive_revenue_growth ? "Growing revenue" : null,
    payload.profitable ? "Profitable" : null,
    payload.positive_momentum ? "Positive 12-month trend" : null,
  ].filter(Boolean);
  return <div className="filter-chip-row" aria-label="Applied filters">{values.map((value) => <span className="filter-chip" key={value}>{value}</span>)}</div>;
}

export function OpportunityExplorer({ options, bootstrapError, onResearch, entityIndex, onToast }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [results, setResults] = useState([]);
  const [response, setResponse] = useState(null);
  const [notice, setNotice] = useState(bootstrapError);
  const [isPending, setIsPending] = useState(false);
  const initialized = useRef(false);
  const requestSequence = useRef(0);
  const [compared, setCompared] = useState(new Map());
  const [compareOpen, setCompareOpen] = useState(false);
  const payload = useMemo(() => buildPayload(filters), [filters]);
  const advancedCount = [filters.query, filters.minCap, filters.maxCap, filters.growingRevenue, filters.profitable, filters.positiveTrend, !filters.recentOnly, !filters.activeOnly].filter(Boolean).length;

  const runScreen = useCallback(async (offset = 0, append = false, override = null) => {
    const active = override || filters;
    const validation = validateFilters(active);
    if (validation) { setNotice(validation); return; }
    const requestPayload = buildPayload(active, offset);
    if (!append) { setCompared(new Map()); setCompareOpen(false); }
    setNotice("");
    const requestId = ++requestSequence.current;
    setIsPending(true);
    try {
      const data = await postJson("/api/screener", requestPayload);
      if (requestId !== requestSequence.current) return;
      setResponse(data);
      setResults((current) => append ? [...current, ...(data.results || [])] : (data.results || []));
      if (!data.summary?.matched_companies && data.summary?.suggestions?.length) setNotice(data.summary.suggestions.join(" "));
    } catch (error) {
      if (requestId === requestSequence.current) setNotice(error.message);
    } finally {
      if (requestId === requestSequence.current) setIsPending(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!options || initialized.current) return;
    initialized.current = true;
    runScreen();
  }, [options, runScreen]);

  useEffect(() => {
    if (bootstrapError) setNotice(bootstrapError);
  }, [bootstrapError]);

  const update = useCallback((key, value) => setFilters((current) => ({ ...current, [key]: value })), []);
  const toggleSize = useCallback((size) => setFilters((current) => ({ ...current, sizes: current.sizes.includes(size) ? current.sizes.filter((item) => item !== size) : [...current.sizes, size] })), []);
  const selectBudget = useCallback((budget) => setFilters((current) => ({ ...current, budget })), []);

  const toggleCompare = useCallback((item, enabled) => {
    setCompared((current) => {
      const next = new Map(current);
      const ticker = item.company?.ticker;
      if (enabled && !next.has(ticker) && next.size >= 3) { onToast("Choose up to three companies"); return current; }
      if (enabled) next.set(ticker, item); else next.delete(ticker);
      return next;
    });
  }, [onToast]);

  const openCompany = useCallback((item) => {
    const ticker = item.company?.ticker || "";
    onResearch(entityIndex.get(ticker.toLowerCase()) || { ticker, company_name: item.company?.name, sector: item.company?.sector, label: `${ticker} — ${item.company?.name}` });
  }, [entityIndex, onResearch]);

  const reset = () => { setFilters(DEFAULT_FILTERS); runScreen(0, false, DEFAULT_FILTERS); };
  const broaden = () => {
    const next = { ...filters, sector: "", sizes: ["micro", "small", "mid"], score: 0, query: "", minCap: "", maxCap: "", growingRevenue: false, profitable: false, positiveTrend: false, recentOnly: false, activeOnly: false };
    setFilters(next); runScreen(0, false, next);
  };
  const total = response?.summary?.matched_companies || 0;
  const compareItems = [...compared.values()];
  return (
    <section className="product-view is-active" aria-labelledby="explorer-title">
      <div className="explorer-hero">
        <div><span className="eyebrow eyebrow--mint">Decision workspace</span><h1 id="explorer-title">Find companies that fit your mandate.</h1><p>Set your available capital, preferred sector, and company size. GrowthLens ranks suitable research candidates and shows why each one deserves a closer look.</p></div>
        <ol className="decision-path" aria-label="Decision workflow"><li className="is-current"><span>1</span><strong>Discover</strong></li><li><span>2</span><strong>Compare</strong></li><li><span>3</span><strong>Review evidence</strong></li><li><span>4</span><strong>Ask GrowthLens</strong></li></ol>
      </div>
      <div className="explorer-shell">
        <aside className="screen-panel" aria-labelledby="screen-title">
          <div className="panel-title-row"><div><span className="eyebrow">Your criteria</span><h2 id="screen-title">Build your shortlist</h2></div><button className="text-button" type="button" onClick={reset}>Reset</button></div>
          <form onSubmit={(event) => { event.preventDefault(); runScreen(); }} noValidate>
            <section className="filter-section filter-section--budget"><div className="filter-heading"><span className="filter-number">1</span><div><strong>Investment amount</strong><small>Capital available for one company</small></div></div><label className="money-input"><span>$</span><input value={filters.budget} onChange={(event) => update("budget", event.target.value)} inputMode="decimal" aria-label="Investment amount" /></label><div className="preset-row">{[50, 100, 250, 500].map((budget) => <button type="button" className={filters.budget === String(budget) ? "is-selected" : ""} onClick={() => selectBudget(String(budget))} key={budget}>${budget}</button>)}</div><small>Used to estimate affordable whole shares at each saved price snapshot.</small></section>
            <section className="filter-section"><div className="filter-heading"><span className="filter-number">2</span><div><strong>Company focus</strong><small>Choose the business profile you want</small></div></div><div className="field-group"><label htmlFor="screen-sector">Sector</label><select id="screen-sector" value={filters.sector} onChange={(event) => update("sector", event.target.value)}><option value="">All sectors</option>{(options?.sectors || []).map((item) => <option value={item.value} key={item.value}>{item.label} ({integer(item.count)})</option>)}</select></div><fieldset className="size-fieldset"><legend>Company size</legend>{[["micro", "Micro", "$25M–$300M"], ["small", "Small", "$300M–$2B"], ["mid", "Mid", "$2B–$10B"]].map(([value, label, range]) => <label key={value}><input type="checkbox" checked={filters.sizes.includes(value)} onChange={() => toggleSize(value)} /><span><strong>{label}</strong><small>{range}</small></span></label>)}</fieldset></section>
            <section className="filter-section"><div className="filter-heading"><span className="filter-number">3</span><div><strong>Opportunity strength</strong><small>Minimum comparative research score</small></div></div><div className="range-label"><label htmlFor="screen-score">Minimum score</label><output>{filters.score}</output></div><input className="score-range" id="screen-score" type="range" min="0" max="90" value={filters.score} onChange={(event) => update("score", Number(event.target.value))} /><div className="range-scale"><span>Broader list</span><span>Stronger signal</span></div></section>
            <details className="more-filters"><summary>More filters <span>{advancedCount ? `${advancedCount} active` : "Optional"}</span></summary><div className="more-filters__body"><div className="field-group"><label htmlFor="screen-query">Company or ticker</label><input id="screen-query" type="search" value={filters.query} onChange={(event) => update("query", event.target.value)} placeholder="Search the universe" /></div><div className="two-fields"><div className="field-group"><label htmlFor="screen-min-cap">Minimum market cap</label><div className="suffix-input"><span>$</span><input id="screen-min-cap" value={filters.minCap} onChange={(event) => update("minCap", event.target.value)} inputMode="decimal" placeholder="25"/><b>M</b></div></div><div className="field-group"><label htmlFor="screen-max-cap">Maximum market cap</label><div className="suffix-input"><span>$</span><input id="screen-max-cap" value={filters.maxCap} onChange={(event) => update("maxCap", event.target.value)} inputMode="decimal" placeholder="10,000"/><b>M</b></div></div></div><div className="preference-group" role="group" aria-label="Business preferences"><strong>Business preferences</strong><div className="preference-grid">{[["growingRevenue", "Growing revenue"], ["profitable", "Profitable"], ["positiveTrend", "Positive 12-month trend"]].map(([key, label]) => <label className="preference-check" key={key}><input type="checkbox" checked={filters[key]} onChange={(event) => update(key, event.target.checked)} /><span>{label}</span></label>)}</div></div>{[["recentOnly", "Prefer recent price snapshots", "Hide snapshots older than 90 days"], ["activeOnly", "Minimum trading activity", "At least $100K average dollar volume"]].map(([key, label, description]) => <label className="toggle-row" key={key}><input type="checkbox" checked={filters[key]} onChange={(event) => update(key, event.target.checked)} /><span className="toggle" aria-hidden="true"/><span><strong>{label}</strong><small>{description}</small></span></label>)}</div></details>
            <button className="primary-action" type="submit" disabled={isPending}><ChartIcon />{isPending ? "Building shortlist…" : "Find opportunities"}</button><p className="form-trust"><LockIcon />Historical affordability estimate—not an order or live quote.</p>
          </form>
        </aside>
        <section className="opportunity-workspace" aria-labelledby="results-title" aria-busy={isPending}>
          <header className="results-header"><div><span className="eyebrow">Ranked research candidates</span><h2 id="results-title">Top opportunities</h2><p aria-live="polite">{total ? `${integer(total)} companies match your choices. Showing the strongest ${integer(results.length)}.` : isPending ? "Preparing your company universe…" : "No companies match every selected filter."}</p></div><div className="results-controls"><label htmlFor="screen-sort">Sort by</label><select id="screen-sort" value={filters.sort} onChange={(event) => { const next = { ...filters, sort: event.target.value }; setFilters(next); runScreen(0, false, next); }}>{(options?.sort_options || []).map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></div></header>
          <FilterChips payload={payload} />
          {notice ? <div className="workspace-notice" role="status">{notice}</div> : null}
          {isPending && !results.length ? <div className="screen-loading"><div className="loading-head"><span className="spinner"/><div><strong>Building your shortlist</strong><small>Checking fit across the local company universe…</small></div></div><div className="skeleton-grid"><span/><span/><span/><span/></div></div> : null}
          {!isPending && !total ? <div className="screen-empty"><h3>No companies match every filter</h3><p>Try a larger budget, a lower opportunity score, or a broader company-size selection.</p><button className="secondary-action" type="button" onClick={broaden}>Broaden filters</button></div> : null}
          {results.length ? <div className="opportunity-grid">{results.map((item) => <OpportunityCard key={`${item.company.ticker}-${item.rank}`} item={item} compared={compared.has(item.company.ticker)} onCompare={toggleCompare} onResearch={openCompany} />)}</div> : null}
          {total ? <div className="results-footer"><p>Coverage: U.S.-listed micro, small, and mid-cap companies from $25M to $10B.</p>{response?.pagination?.has_more ? <button className="secondary-action" type="button" onClick={() => runScreen(response.pagination.next_offset, true)} disabled={isPending}>Show more companies</button> : null}</div> : null}
          <details className="methodology-card"><summary><span>How to use this shortlist</span><span>Methodology & limits</span></summary><div className="methodology-grid"><div><strong>A comparative signal</strong><p>The opportunity score ranks companies for further research. It is not a return forecast or probability.</p></div><div><strong>Snapshot affordability</strong><p>Share estimates use the saved closing price and date shown on each card. They are not live quotes or executable orders.</p></div><div><strong>Focused universe</strong><p>Coverage includes micro, small, and mid-cap companies from $25M to $10B.</p></div><div><strong>Your decision</strong><p>Use filing evidence and your own due diligence before any investment decision.</p></div></div></details>
        </section>
      </div>
      {compareItems.length ? <aside className="compare-tray" aria-live="polite"><div><span className="compare-count">{compareItems.length}</span><div><strong>Companies selected</strong><small>Choose up to 3 to compare side by side</small></div></div><div className="compare-selection">{compareItems.map((item) => <span className="compare-pill" key={item.company.ticker}>{item.company.ticker}<button type="button" onClick={() => toggleCompare(item, false)} aria-label={`Remove ${item.company.ticker} from comparison`}>×</button></span>)}</div><div className="compare-actions"><button className="text-button text-button--light" type="button" onClick={() => setCompared(new Map())}>Clear</button><button className="compare-open" type="button" disabled={compareItems.length < 2} onClick={() => setCompareOpen(true)}>Compare selected</button></div></aside> : null}
      <CompareDialog open={compareOpen} items={compareItems} onClose={() => setCompareOpen(false)} />
    </section>
  );
}
