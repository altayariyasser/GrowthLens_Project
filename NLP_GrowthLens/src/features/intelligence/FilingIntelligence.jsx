import { useDeferredValue, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { api, postJson } from "../../lib/api";
import { human, safeNumber } from "../../lib/format";
import { DocumentIcon, SearchIcon } from "../../components/Icons";
import { ChangeCard } from "./ChangeCard";
import { FilingAsk } from "./FilingAsk";
import { MemoPanel } from "./MemoPanel";
import { PeerMatrix } from "./PeerMatrix";

gsap.registerPlugin(useGSAP);

const TAPE_ITEMS = [
  "New risk language", "Capacity assumptions", "Customer concentration", "Liquidity narrative",
  "Supply dependencies", "Strategy shifts", "Numerical disclosures", "Peer divergence",
];
const EMPTY_COMPANIES = [];
const CHANGE_TYPES = [
  { value: "new", label: "New", color: "#477d5d" },
  { value: "modified", label: "Modified", color: "#8ca76f" },
  { value: "removed", label: "Removed", color: "#c78354" },
  { value: "intensified", label: "Intensified", color: "#956d55" },
  { value: "softened", label: "Softened", color: "#9da59d" },
];

function entityLabel(entity) {
  if (!entity) return "";
  return entity?.label || `${entity?.ticker || ""} — ${entity?.company_name || ""}`;
}

function FilingSelector({ companies, input, selected, onInput, onAnalyze, loading, error }) {
  return (
    <div className="filing-selector" id="company-selector">
      <div className="filing-selector__lead"><span>Begin with a company</span><p>GrowthLens compares the latest 10-K with the immediately previous annual filing.</p></div>
      <form onSubmit={onAnalyze}>
        <label htmlFor="fi-company">Company or ticker</label>
        <div className="fi-search"><SearchIcon/><input id="fi-company" value={input} onChange={(event) => onInput(event.target.value)} list="fi-companies" autoComplete="off" placeholder="Search precomputed company examples"/><datalist id="fi-companies">{companies.map((entity) => <option key={entity.cik} value={entityLabel(entity)}>{entity.ticker} · {entity.company_name}</option>)}</datalist>{selected ? <span>{selected.comparison_available ? "Two filings available" : "Single filing"}</span> : null}</div>
        <button className="fi-primary" type="submit" disabled={loading}><DocumentIcon/>{loading ? "Comparing filings…" : "Analyze filing changes"}</button>
      </form>
      {error ? <p className="selector-error" role="alert">{error}</p> : null}
    </div>
  );
}

function ChangePortrait({ changes }) {
  const total = changes.length;
  const typeCounts = new Map(CHANGE_TYPES.map((type) => [type.value, 0]));
  const topicCounts = new Map();
  changes.forEach((change) => {
    typeCounts.set(change.change_type, (typeCounts.get(change.change_type) || 0) + 1);
    const topic = change.topic_label || human(change.topic);
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  });
  let cursor = 0;
  const ringStops = CHANGE_TYPES.flatMap((type) => {
    const start = cursor;
    cursor += total ? ((typeCounts.get(type.value) || 0) / total) * 100 : 0;
    return [`${type.color} ${start}%`, `${type.color} ${cursor}%`];
  });
  const ring = total ? `conic-gradient(${ringStops.join(", ")})` : "#d7dbd4";
  const topics = [...topicCounts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4);
  const typeSummary = CHANGE_TYPES.map((type) => `${type.label}: ${typeCounts.get(type.value) || 0}`).join(", ");

  return (
    <article className="bento-change-map">
      <header><div><span>Change portrait</span><h3>How the filing narrative moved</h3></div><p>Type and theme distribution across surfaced changes.</p></header>
      <div className="change-portrait">
        <div className="change-ring" style={{ "--change-ring": ring }} role="img" aria-label={`${total} surfaced ${total === 1 ? "change" : "changes"}. ${typeSummary}`}><span><strong>{total}</strong><small>Surfaced changes</small></span></div>
        <div className="change-legend" aria-label="Change type totals">{CHANGE_TYPES.map((type) => <span key={type.value}><i style={{ background: type.color }}/><b>{typeCounts.get(type.value) || 0}</b><small>{type.label}</small></span>)}</div>
      </div>
      <div className="theme-pulse" aria-label="Most active filing themes">
        {topics.length ? topics.map(([label, count], index) => <div className={`theme-pulse__item theme-pulse__item--${index + 1}`} key={label}><strong>{count}</strong><span>{label}</span><small>{Math.round((count / total) * 100)}% of changes</small></div>) : <p>No material theme concentration was detected.</p>}
      </div>
    </article>
  );
}

function OverviewBento({ analysis, companyContext }) {
  const score = safeNumber(companyContext?.opportunity_signal?.score_percent);
  const summary = analysis.summary || {};
  const pair = analysis.filing_pair || {};
  const dominant = summary.dominant_topics?.[0];
  return (
    <section className="intelligence-overview" aria-labelledby="overview-heading">
      <header><div><span>Company overview</span><h2 id="overview-heading">{analysis.company.ticker} · {analysis.company.company_name}</h2></div><p>Comparison anchored to filing dates, not market dates.</p></header>
      <div className="intelligence-bento">
        <article className="bento-narrative"><span>Material narrative</span><h3>{dominant ? `${dominant.label} carries the most surfaced change.` : "No dominant disclosure theme was surfaced."}</h3><p>{summary.high_attention || 0} high-attention item{summary.high_attention === 1 ? "" : "s"} across {analysis.coverage?.comparable_sections?.length || 0} comparable section{analysis.coverage?.comparable_sections?.length === 1 ? "" : "s"}.</p><div><span>Current <b>{pair.current?.filing_date || "Unavailable"}</b></span><i/><span>Previous <b>{pair.previous?.filing_date || "Unavailable"}</b></span></div></article>
        <ChangePortrait changes={analysis.changes || []}/>
        <article className="bento-coverage"><span>Evidence coverage</span><strong>{human(analysis.coverage?.status)}</strong><p>{analysis.coverage?.paragraphs_compared || 0} source paragraphs reviewed.</p>{analysis.coverage?.prior_text_capped || analysis.coverage?.current_text_capped ? <em>Some supplied sections are capped; conclusions are explicitly partial.</em> : <em>All available comparable sections were reviewed.</em>}</article>
        <article className="bento-stat"><span>New disclosures</span><strong>{summary.new || 0}</strong><p>Present only in the current filing.</p></article>
        <article className="bento-score"><span>Discovery signal</span><strong>{score === null ? "N/A" : Math.round(score)}</strong><p>Separate shortlist signal; never blended with filing-change priority.</p></article>
      </div>
    </section>
  );
}

function PeerSection({ ticker, companies, onPeersChange }) {
  const [slots, setSlots] = useState(["", "", ""]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const choices = companies.filter((company) => company.ticker !== ticker && company.comparison_available);
  const selectedTickers = slots.filter(Boolean);
  const updateSlot = (index, value) => setSlots((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  const compare = async () => {
    const peers = [...new Set(selectedTickers)];
    if (!peers.length) { setError("Choose at least one peer company."); return; }
    setLoading(true); setError("");
    try { const result = await postJson("/api/filing-intelligence/peers", { ticker, peer_tickers: peers }); setData(result); onPeersChange(peers); }
    catch (nextError) { setError(nextError.message); }
    finally { setLoading(false); }
  };
  return (
    <section className="peer-chapter" id="peers" aria-labelledby="peers-heading">
      <header><div><span>Peer comparison</span><h2 id="peers-heading">See where the company’s disclosure diverges.</h2></div><p>Every column retains its filing date because peer periods rarely align perfectly.</p></header>
      <div className="peer-controls">{slots.map((value, index) => <label key={index}>Peer {index + 1}<select value={value} onChange={(event) => updateSlot(index, event.target.value)}><option value="">Choose company</option>{choices.filter((company) => !selectedTickers.includes(company.ticker) || company.ticker === value).map((company) => <option key={company.cik} value={company.ticker}>{company.ticker} · {company.company_name}</option>)}</select></label>)}<button className="fi-secondary" type="button" onClick={compare} disabled={loading}>{loading ? "Comparing…" : "Compare disclosure themes"}</button></div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}<PeerMatrix data={data}/>
    </section>
  );
}

function WorkspaceGates({ onChoose, comparisonUnavailable = false }) {
  return (
    <div className="workspace-gates" aria-label="Additional filing intelligence workspaces">
      <section className="workspace-gate" id="peers" aria-labelledby="peers-gate-heading">
        <span>Peer comparison</span>
        <h2 id="peers-gate-heading">Compare disclosure changes across companies.</h2>
        <p>{comparisonUnavailable ? "This company has no supplied prior filing. Choose another company with two filings to compare peers." : "Analyze a company first, then choose up to three peers with their filing dates kept visible."}</p>
        <button className="fi-secondary" type="button" onClick={onChoose}>{comparisonUnavailable ? "Choose another company" : "Choose a company"}</button>
      </section>
      <section className="workspace-gate" id="reports" aria-labelledby="reports-gate-heading">
        <span>Research reports</span>
        <h2 id="reports-gate-heading">Turn reviewed evidence into a decision brief.</h2>
        <p>{comparisonUnavailable ? "A change memo needs a prior comparable filing. Choose another company to create a cited report." : "Select a company to create a cited Markdown or PDF memo with explicit coverage limits."}</p>
        <button className="fi-secondary" type="button" onClick={onChoose}>{comparisonUnavailable ? "Choose another company" : "Choose a company"}</button>
      </section>
    </div>
  );
}

export function FilingIntelligence({ options, initialCompany, onToast, activeWorkspace = "intelligence" }) {
  const root = useRef(null);
  const companies = options?.company_options || EMPTY_COMPANIES;
  const initial = useMemo(() => {
    if (!initialCompany) return null;
    return companies.find((company) => company.ticker === initialCompany.ticker) || initialCompany;
  }, [companies, initialCompany]);
  const [companyInput, setCompanyInput] = useState(() => entityLabel(initial));
  const [selected, setSelected] = useState(() => initial);
  const [analysis, setAnalysis] = useState(null);
  const [companyContext, setCompanyContext] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [peerTickers, setPeerTickers] = useState([]);
  const deferredType = useDeferredValue(typeFilter);
  const deferredTopic = useDeferredValue(topicFilter);
  const lookup = useMemo(() => {
    const index = new Map();
    companies.forEach((company) => [company.ticker, company.company_name, entityLabel(company)].forEach((key) => index.set(String(key).toLowerCase(), company)));
    return index;
  }, [companies]);
  const filteredChanges = useMemo(() => (analysis?.changes || []).filter((change) => (deferredType === "all" || change.change_type === deferredType) && (deferredTopic === "all" || change.topic === deferredTopic)), [analysis, deferredType, deferredTopic]);

  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    gsap.from(".fi-hero__kicker, .fi-hero h1, .fi-hero__lede, .fi-hero__actions", { y: 28, opacity: 0, duration: .9, stagger: .11, ease: "power3.out" });
    gsap.fromTo(".hero-document", { scale: .8, opacity: .35 }, { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out" });
  }, { scope: root, dependencies: [analysis?.analysis_id], revertOnUpdate: true });

  const handleInput = (value) => { setCompanyInput(value); setSelected(lookup.get(value.trim().toLowerCase()) || null); setError(""); };
  const runAnalysis = async (event) => {
    event?.preventDefault();
    if (!selected) { setError("Choose one company from the filing directory."); return; }
    setLoading(true); setError(""); setAnalysis(null);
    try {
      const [result, context] = await Promise.all([
        postJson("/api/filing-intelligence/analyze", { ticker: selected.ticker }),
        api(`/api/company/${encodeURIComponent(selected.ticker)}`),
      ]);
      setAnalysis(result); setCompanyContext(context);
      const destination = activeWorkspace === "peers" || activeWorkspace === "reports" ? activeWorkspace : "filing-overview";
      window.requestAnimationFrame(() => window.setTimeout(() => document.getElementById(destination)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0));
    } catch (nextError) { setError(nextError.message); }
    finally { setLoading(false); }
  };
  const scrollToSelector = () => document.getElementById("company-selector")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const scrollToChanges = () => document.getElementById(analysis?.comparison_available ? "material-changes" : "company-selector")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="filing-intelligence" ref={root}>
      <section className="fi-hero">
        <div className="fi-ambient" aria-hidden="true"/><span className="fi-hero__kicker">Evidence-led filing change analysis</span>
        <h1>See what <span className="hero-document"><img src={`${import.meta.env.BASE_URL}filing-texture.svg`} alt=""/></span> changed.<br/>Understand why it matters.</h1>
        <p className="fi-hero__lede">Compare annual filings, surface material narrative shifts, and trace every conclusion to the original disclosure.</p>
        <div className="fi-hero__actions"><button className="fi-primary" type="button" onClick={scrollToSelector}>Analyze a company</button><button className="fi-ghost" type="button" onClick={scrollToChanges}>Review material changes</button></div>
        <div className="analyst-tape" aria-label="Filing intelligence capabilities"><div>{[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, index) => <span key={`${item}-${index}`}>{item}<i/></span>)}</div></div>
      </section>
      <section className="selector-chapter"><FilingSelector companies={companies} input={companyInput} selected={selected} onInput={handleInput} onAnalyze={runAnalysis} loading={loading} error={error}/></section>
      {!analysis?.comparison_available && !loading ? <WorkspaceGates onChoose={scrollToSelector} comparisonUnavailable={Boolean(analysis)}/> : null}
      {loading ? <section className="analysis-loading" aria-live="polite"><span className="fi-spinner"/><p>Pairing sections, aligning disclosures, and validating evidence.</p><small>The first analysis is cached for faster return visits.</small></section> : null}
      {analysis && !analysis.comparison_available ? <section className="single-filing"><span>Comparison unavailable</span><h2>A prior comparable 10-K was not supplied for {analysis.company.ticker}.</h2><p>You can still use the existing Company Research workspace, but GrowthLens will not manufacture a year-over-year change narrative.</p></section> : null}
      {analysis?.comparison_available ? <div id="filing-overview">
        <OverviewBento analysis={analysis} companyContext={companyContext}/>
        <section className="change-chapter" id="material-changes" aria-labelledby="changes-heading">
          <aside className="change-rail"><span>Material changes</span><h2 id="changes-heading">The disclosure delta, ranked for attention.</h2><p>Priority is transparent and evidence-driven. It is not a return prediction.</p><div className="change-filters"><label>Change<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All changes</option>{(options?.change_types || []).map((value) => <option value={value} key={value}>{human(value)}</option>)}</select></label><label>Theme<select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}><option value="all">All themes</option>{(options?.topics || []).map((topic) => <option value={topic.value} key={topic.value}>{topic.label}</option>)}</select></label></div><small>{filteredChanges.length} surfaced change{filteredChanges.length === 1 ? "" : "s"}</small></aside>
          <div className="change-stack">{filteredChanges.map((change, index) => <ChangeCard change={change} index={index} key={change.change_id}/>)}</div>
        </section>
        <PeerSection ticker={analysis.company.ticker} companies={companies} onPeersChange={setPeerTickers}/>
        <FilingAsk ticker={analysis.company.ticker}/>
        <MemoPanel ticker={analysis.company.ticker} peerTickers={peerTickers}/>
      </div> : null}
      <section className="fi-closing"><span>GrowthLens Filing Intelligence</span><h2>Turn disclosure into a decision brief.</h2><button className="fi-primary" type="button" onClick={scrollToSelector}>Analyze another company</button></section>
      <button className="sr-only" type="button" onClick={() => onToast("GrowthLens Filing Intelligence is available")}>Announce status</button>
    </div>
  );
}
