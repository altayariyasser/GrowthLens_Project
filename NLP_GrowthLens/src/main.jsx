import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const filings = {
  CARE: {
    ticker: "CARE",
    company: "Carter Bankshares, Inc.",
    sector: "Finance",
    previous: "2025-03-07",
    current: "2026-03-05",
    previousUrl: "https://www.sec.gov/Archives/edgar/data/1829576/000182957625000016/care-20241231.htm",
    currentUrl: "https://www.sec.gov/Archives/edgar/data/1829576/000182957626000018/care-20251231.htm",
    paragraphs: 482,
    total: 24,
    changes: [
      { type: "New", score: 89, topic: "Liquidity, debt, margins and costs", section: "Risk factors", title: "Commercial real-estate concentration is quantified", summary: "The current filing newly quantifies commercial real-estate exposure at approximately $2.2 billion, representing 57.1% of the loan portfolio.", values: ["$2.2B", "57.1%"], after: "The Company maintains a significant concentration in loans secured by CRE... As of December 31, 2025, loans secured by commercial purpose real estate, excluding construction loans, totaled approximately $2.2 billion, or 57.1% of the Company’s total loan portfolio.", evidence: "71b5397d4ae8f6dc82a8" },
      { type: "New", score: 84, topic: "Demand and competition", section: "Business", title: "CRE concentration thresholds receive more detail", summary: "The filing adds regulatory concentration metrics and the risk-management practices expected when those thresholds are reached.", values: ["100%", "300%"], after: "The guidance states that construction and land-development loans representing 100% or more of risk-based capital, or broader CRE loans representing 300% or more, may indicate concentration.", evidence: "6a4c03817b95c1c4a593" },
      { type: "Removed", score: 82, topic: "Liquidity, debt, margins and costs", section: "Management discussion", title: "Prior capital-ratio narrative is no longer in the comparable section", summary: "The prior filing’s discussion of Tier 1, Total Capital and Basel treatment is absent from the comparable current section.", values: ["10.88%", "12.13%"], before: "Risk-based Tier 1 and Total Capital ratios were 10.88% and 12.13%, respectively, above the well-capitalized guidelines of 8.00% and 10.00%.", evidence: "8c0b37a5cb6710ff43b9" },
      { type: "Removed", score: 82, topic: "Operations and supply chain", section: "Management discussion", title: "Credit-loss drivers were removed from the comparable narrative", summary: "Details about charge-offs, reserve releases and deposit growth in the prior discussion are absent from the current comparable section.", values: ["$15.0M", "$431.5M"], before: "The decrease related to a $15.0 million charge-off, reserve releases, and curtailment payments. Total deposits increased $431.5 million to $4.2 billion.", evidence: "8f55d2788eacec06f498" },
      { type: "New", score: 82, topic: "Growth and strategy", section: "Management discussion", title: "Investment portfolio composition and yield sensitivity are expanded", summary: "The current filing adds portfolio composition and explains how Treasury-yield movements affected unrealized losses.", values: ["33.9%", "3.73%"], after: "States and political subdivision securities comprise 33.9% and are largely general obligations and essential-purpose revenue bonds... intermediate-term Treasury yields declined.", evidence: "ebae1cb8d4cf13694a9c" },
      { type: "New", score: 82, topic: "Regulation and legal risk", section: "Risk factors", title: "Consumer-fee oversight receives explicit treatment", summary: "The filing adds discussion of CFPB interpretations, fee practices and their possible effect on product revenue.", values: ["$10B"], after: "The CFPB’s interpretation of prohibitions against unfair, deceptive and abusive practices and its application to so-called junk fees may affect products, services and revenue.", evidence: "c9c23e8a1babdf7467a8" },
    ],
  },
  AAL: {
    ticker: "AAL",
    company: "American Airlines Group Inc.",
    sector: "Industrials",
    previous: "2025-02-19",
    current: "2026-02-18",
    previousUrl: "https://www.sec.gov/Archives/edgar/data/6201/000000620125000010/aal-20241231.htm",
    currentUrl: "https://www.sec.gov/Archives/edgar/data/6201/000000620126000014/aal-20251231.htm",
    paragraphs: 733,
    total: 24,
    changes: [
      { type: "New", score: 86, topic: "Cybersecurity and technology", section: "Management discussion", title: "Operational technology outages gain concrete examples", summary: "The filing adds examples involving the 2024 CrowdStrike outage and a 2025 fiber cut at Dallas/Fort Worth.", values: ["2024", "2025"], after: "The CrowdStrike-caused systems outage in July 2024 significantly impacted airline operations. In September 2025, hundreds of flights were delayed or cancelled at DFW after fiberoptic cables were cut.", evidence: "63629c31b69a2ebdace6" },
      { type: "New", score: 85, topic: "Liquidity, debt, margins and costs", section: "Risk factors", title: "Term-loan pricing and maturity detail is expanded", summary: "The current filing adds base-rate floors, SOFR margins and maturity dates for major facilities.", values: ["2028", "2.25%"], after: "The 2013 Term Loan Facility matures in February 2028 and bears interest at a base rate plus an applicable margin, or SOFR plus an applicable margin of 2.25% per annum.", evidence: "411a5311bba44d0e2b2a" },
      { type: "New", score: 85, topic: "Liquidity, debt, margins and costs", section: "Risk factors", title: "Fleet depreciation disclosure is refreshed", summary: "Depreciation and amortization amounts and impairment-testing context are stated in the current filing.", values: ["$2.2B", "$2.3B"], after: "Total mainline and regional depreciation and amortization expense was $2.2 billion for each of 2025 and 2024, and $2.3 billion for 2023.", evidence: "ed843e88fbf323efe19e" },
    ],
  },
  AAT: {
    ticker: "AAT",
    company: "American Assets Trust, Inc.",
    sector: "Real Estate",
    previous: "2025-02-12",
    current: "2026-02-06",
    previousUrl: "https://www.sec.gov/Archives/edgar/data/1500217/000150021725000007/aat-20241231.htm",
    currentUrl: "https://www.sec.gov/Archives/edgar/data/1500217/000150021726000008/aat-20251231.htm",
    paragraphs: 510,
    total: 24,
    changes: [
      { type: "New", score: 85, topic: "Growth and strategy", section: "Risk factors", title: "Debt repayment and senior-note schedule is updated", summary: "The current filing describes repayment of Series B and C notes and terms for later senior-note series.", values: ["$100M", "$250M"], after: "The company repaid the Series B Notes in December 2024 and Series C Notes in February 2025, and describes $250 million of 4.29% Series D Notes due in 2027.", evidence: "e04a0c02dcb83cee80a4" },
      { type: "New", score: 81, topic: "Liquidity, debt, margins and costs", section: "Risk factors", title: "Treasury locks and covenant limits are newly detailed", summary: "The filing adds the effective rate created by treasury-lock settlements and enumerates leverage covenants.", values: ["6.209%", "60%"], after: "The effective rate on the 6.150% Senior Notes is 6.209% per annum. Covenants include a maximum aggregate debt ratio of 60% and minimum debt-service ratio of 1.5x.", evidence: "f09866e717e3b2355ba4" },
      { type: "Removed", score: 81, topic: "Liquidity, debt, margins and costs", section: "Risk factors", title: "Prior swap and term-loan repayment detail is removed", summary: "The comparable current section no longer includes prior term-loan repayment and interest-rate swap language.", values: ["5.47%", "5.57%"], before: "The Operating Partnership entered into swaps intended to fix the effective interest rate at 5.47% and later 5.57%, subject to leverage-ratio adjustments.", evidence: "9fb062003186b2012f24" },
    ],
  },
};

const opportunities = [
  { ticker: "ABTC", company: "American Bitcoin Corp.", sector: "Finance", size: "Small", score: 98.9, price: 6.185, cap: 512.1, revenue: 801.5, margin: -82.7, momentum: -93.2 },
  { ticker: "HLI", company: "Houlihan Lokey, Inc.", sector: "Finance", size: "Micro", score: 97.4, price: 127.57, cap: 75.0, revenue: 9.5, margin: 16.3, momentum: -32.7 },
  { ticker: "FWDI", company: "Forward Industries, Inc.", sector: "Finance", size: "Small", score: 96.6, price: 4.165, cap: 311.0, revenue: -39.8, margin: -918.1, momentum: -67.9 },
  { ticker: "PRIM", company: "Primoris Services Corp", sector: "Industrials", size: "Mid", score: 95.8, price: 80.24, cap: 4319.5, revenue: 19.0, margin: 3.6, momentum: -25.9 },
  { ticker: "LMB", company: "Limbach Holdings, Inc.", sector: "Consumer Discretionary", size: "Small", score: 95.6, price: 47.81, cap: 570.1, revenue: 24.7, margin: 6.0, momentum: -64.5 },
  { ticker: "EVEX", company: "Eve Holding, Inc.", sector: "Industrials", size: "Small", score: 94.9, price: 2.63, cap: 916.5, revenue: null, margin: null, momentum: -60.6 },
  { ticker: "HOV", company: "Hovnanian Enterprises Inc.", sector: "Consumer Discretionary", size: "Micro", score: 93.9, price: 134.15, cap: 96.6, revenue: -0.9, margin: 2.1, momentum: -0.5 },
  { ticker: "DSGN", company: "Design Therapeutics, Inc.", sector: "Health Care", size: "Small", score: 93.4, price: 13.775, cap: 862.1, revenue: null, margin: null, momentum: 238.5 },
];

const Icon = ({ name }) => {
  const paths = {
    file: <><path d="M5 2h9l5 5v15H5z"/><path d="M14 2v6h5M8 13h8M8 17h8"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    users: <><circle cx="9" cy="8" r="3"/><circle cx="18" cy="9" r="2.5"/><path d="M3 21c0-4 2.5-7 6-7s6 3 6 7M15 15c3.5 0 6 2.5 6 6"/></>,
    report: <><path d="M5 2h14v20H5z"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

function Header({ page, setPage }) {
  const tabs = [["intelligence", "file", "Filing Intelligence"], ["discover", "chart", "Discover"], ["peers", "users", "Peers"], ["reports", "report", "Reports"]];
  return <header className="topbar"><button className="brand" onClick={() => setPage("intelligence")}><span className="brand-mark">GL</span><span><strong>GrowthLens</strong><small>Filing Intelligence</small></span></button><nav aria-label="Product navigation">{tabs.map(([id, icon, label]) => <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}><Icon name={icon}/>{label}</button>)}</nav><a className="repo-link" href="https://github.com/altayariyasser/GrowthLens_Project" target="_blank" rel="noreferrer">View project ↗</a></header>;
}

function ChangeCard({ change, filing }) {
  return <details className="change-card"><summary><div><span className={`type type-${change.type.toLowerCase()}`}>{change.type}</span><span className="topic">{change.topic}</span></div><h3>{change.title}</h3><p>{change.summary}</p><div className="change-meta"><b>{change.score}</b><span>Attention</span><span>{change.section}</span><span>{change.values.join(" · ")}</span></div></summary><div className="evidence"><div className="evidence-head"><span>Source evidence</span><code>{change.evidence}</code></div>{change.before ? <article><small>Previous filing · {filing.previous}</small><p>{change.before}</p><a href={filing.previousUrl} target="_blank" rel="noreferrer">Open previous SEC filing ↗</a></article> : null}{change.after ? <article><small>Current filing · {filing.current}</small><p>{change.after}</p><a href={filing.currentUrl} target="_blank" rel="noreferrer">Open current SEC filing ↗</a></article> : null}</div></details>;
}

function FilingIntelligence() {
  const [ticker, setTicker] = useState("CARE");
  const [filter, setFilter] = useState("All");
  const filing = filings[ticker];
  const visible = filter === "All" ? filing.changes : filing.changes.filter((item) => item.type === filter);
  const counts = filing.changes.reduce((acc, item) => ({ ...acc, [item.type]: (acc[item.type] || 0) + 1 }), {});
  return <>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">Annual disclosure research</span><h1>See what changed.<br/><em>Understand why it matters.</em></h1><p>Compare consecutive 10-K filings, surface material narrative shifts, and trace every conclusion to original SEC evidence.</p><div className="hero-actions"><a href="#analysis" className="button primary">Explore filing changes <Icon name="arrow"/></a><span>Public showcase · precomputed research examples</span></div></div><div className="hero-visual"><div className="document prior"><span>PRIOR / 10-K</span><i/><i/><i/><b>2024</b></div><div className="document current"><span>CURRENT / 10-K</span><i/><i className="highlight"/><i/><b>2025</b></div><div className="change-pulse"><strong>24</strong><span>narrative shifts</span></div></div></section>
    <section className="analysis" id="analysis"><div className="section-heading"><div><span className="eyebrow dark">Company analysis</span><h2>One company. Two filings.<br/>A clearer research trail.</h2></div><label>Choose a precomputed example<select value={ticker} onChange={(event) => { setTicker(event.target.value); setFilter("All"); }}>{Object.values(filings).map((item) => <option key={item.ticker} value={item.ticker}>{item.ticker} · {item.company}</option>)}</select></label></div>
      <div className="overview-grid"><article className="company-overview"><div><span className="ticker">{filing.ticker}</span><p>{filing.sector}</p></div><h3>{filing.company}</h3><div className="filing-line"><span><small>Previous</small><b>{filing.previous}</b></span><i/><span><small>Current</small><b>{filing.current}</b></span></div></article><article className="portrait"><div className="ring" style={{"--value": `${Math.min(100, filing.total * 3.2)}%`}}><span><b>{filing.total}</b><small>surfaced</small></span></div><div><strong>Change portrait</strong><p>{counts.New || 0} new · {counts.Removed || 0} removed in this curated preview</p><small>{filing.paragraphs} source paragraphs compared</small></div></article><article className="coverage"><span>Evidence coverage</span><strong>3 comparable sections</strong><p>Business, management discussion, and risk factors.</p><div className="coverage-bars"><i/><i/><i/></div></article></div>
      <div className="changes-layout"><aside><span className="eyebrow dark">Material changes</span><h2>Review the signal.<br/>Open the evidence.</h2><p>Changes are condensed for scanning. Expand only the items that matter to your thesis.</p><div className="filter-row">{["All", "New", "Removed"].map((item) => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><small>{visible.length} preview changes shown from {filing.total} surfaced changes</small></aside><div className="change-list">{visible.map((change) => <ChangeCard change={change} filing={filing} key={change.evidence}/>)}</div></div>
    </section>
    <section className="local-callout"><div><span className="eyebrow">Full local edition</span><h2>Research the complete company universe on your machine.</h2><p>The full application adds live local generation, evidence retrieval, memo export, and the complete filing corpus. The public site stays intentionally lightweight.</p></div><a href="https://github.com/altayariyasser/GrowthLens_Project" target="_blank" rel="noreferrer" className="button lime">Open repository <Icon name="arrow"/></a></section>
  </>;
}

function Discover() {
  const [budget, setBudget] = useState(500);
  const [sector, setSector] = useState("All");
  const [size, setSize] = useState("All");
  const sectors = ["All", ...new Set(opportunities.map((item) => item.sector))];
  const results = useMemo(() => opportunities.filter((item) => item.price <= budget && (sector === "All" || item.sector === sector) && (size === "All" || item.size === size)), [budget, sector, size]);
  return <main className="workspace"><div className="workspace-hero"><span className="eyebrow">Discovery workspace</span><h1>Build a research shortlist<br/>around your mandate.</h1><p>Filter a dated sample of ranked companies by available capital, sector, and company size.</p></div><div className="discover-shell"><aside className="filters"><label>Available capital<div className="money"><span>$</span><input type="number" min="1" value={budget} onChange={(event) => setBudget(Number(event.target.value) || 0)}/></div></label><label>Sector<select value={sector} onChange={(event) => setSector(event.target.value)}>{sectors.map((item) => <option key={item}>{item}</option>)}</select></label><label>Company size<select value={size} onChange={(event) => setSize(event.target.value)}>{["All", "Micro", "Small", "Mid"].map((item) => <option key={item}>{item}</option>)}</select></label><div className="snapshot-note"><strong>Dated research sample</strong><p>Prices are references from August 6, 2026—not live quotes.</p></div></aside><section className="results"><header><div><span className="eyebrow dark">Ranked candidates</span><h2>{results.length} companies fit</h2></div><p>Opportunity score is a separate discovery aid, not a prediction or filing-change priority.</p></header><div className="company-grid">{results.map((item, index) => { const shares = Math.floor(budget / item.price); return <article className="company-card" key={item.ticker}><div className="rank">{String(index + 1).padStart(2, "0")}</div><div className="company-card-head"><span>{item.ticker}</span><b>{item.score}</b></div><h3>{item.company}</h3><p>{item.sector} · {item.size} · ${item.cap.toLocaleString("en-US")}M market cap</p><div className="metrics"><span><small>Reference price</small><b>${item.price.toFixed(2)}</b></span><span><small>Budget fit</small><b>{shares} shares</b></span><span><small>Revenue YoY</small><b>{item.revenue == null ? "—" : `${item.revenue > 0 ? "+" : ""}${item.revenue}%`}</b></span></div></article>; })}</div>{!results.length ? <div className="empty"><h3>No sample companies fit those choices.</h3><p>Increase the budget or broaden the sector and size filters.</p></div> : null}</section></div></main>;
}

function Peers() {
  const rows = [
    ["Filing pair", "2025 → 2026", "2025 → 2026", "2025 → 2026"],
    ["Preview changes", "6 of 24", "3 of 24", "3 of 24"],
    ["Leading theme", "Liquidity & costs", "Liquidity & costs", "Growth & strategy"],
    ["Highest attention", "89", "86", "85"],
    ["Coverage", "3 sections", "3 sections", "3 sections"],
  ];
  return <main className="workspace"><div className="workspace-hero"><span className="eyebrow">Peer comparison</span><h1>Compare the language,<br/>not just the numbers.</h1><p>Keep each company’s filing date visible while reviewing where disclosure themes converge or diverge.</p></div><section className="peer-table-wrap"><div className="peer-intro"><span>Precomputed example</span><p>Comparable annual filing pairs from the public showcase.</p></div><table className="peer-table"><thead><tr><th>Research dimension</th>{Object.values(filings).map((item) => <th key={item.ticker}><span>{item.ticker}</span>{item.company}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index ? <td key={index}>{cell}</td> : <th key={cell}>{cell}</th>)}</tr>)}</tbody></table></section></main>;
}

function Reports() {
  return <main className="workspace reports-page"><div className="report-sheet"><span>GROWTHLENS</span><strong>CARE</strong><div/><div/><small>Material changes</small><div/><div/><small>Evidence register</small><div/></div><div className="report-copy"><span className="eyebrow">Research memo</span><h1>Move from disclosure review to an institutional brief.</h1><p>The full local edition generates neutral Markdown and PDF memos with material changes, filing evidence, peer context, and explicit coverage limitations.</p><div className="report-features"><span>Executive view</span><span>Material changes</span><span>Peer context</span><span>Evidence register</span></div><a className="button lime" href="https://github.com/altayariyasser/GrowthLens_Project/blob/main/GrowthLens_Report.pdf" target="_blank" rel="noreferrer">View project report <Icon name="arrow"/></a></div></main>;
}

function App() {
  const [page, setPage] = useState("intelligence");
  return <><a className="skip-link" href="#content">Skip to content</a><Header page={page} setPage={setPage}/><div id="content">{page === "intelligence" ? <FilingIntelligence/> : page === "discover" ? <Discover/> : page === "peers" ? <Peers/> : <Reports/>}</div><footer><strong>GrowthLens Filing Intelligence</strong><span>Evidence-led annual-disclosure research · Not investment advice</span><a href="https://www.sec.gov/edgar/search/" target="_blank" rel="noreferrer">SEC EDGAR ↗</a></footer></>;
}

createRoot(document.getElementById("root")).render(<StrictMode><App/></StrictMode>);
