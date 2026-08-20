import { ENTITIES, OPPORTUNITIES, SORT_OPTIONS, TOPICS } from "../data/static";

const ANALYSES = {
  CARE: () => import("../data/CARE.json").then((module) => module.default),
  AAL: () => import("../data/AAL.json").then((module) => module.default),
  AAT: () => import("../data/AAT.json").then((module) => module.default),
  AAP: () => import("../data/AAP.json").then((module) => module.default),
  AVTR: () => import("../data/AVTR.json").then((module) => module.default),
  ABM: () => import("../data/ABM.json").then((module) => module.default),
};

const opportunityByTicker = new Map(OPPORTUNITIES.map((item) => [item.company.ticker, item]));
const entityByTicker = new Map(ENTITIES.map((item) => [item.ticker, item]));
const sections = ["business", "management_discussion", "risk_factors"];
const changeTypes = ["new", "removed", "modified", "intensified", "softened"];

const filingOptions = {
  company_options: ENTITIES,
  topics: TOPICS,
  change_types: changeTypes,
  sections,
  filing_scopes: ["detected_changes", "current", "prior", "both"],
  paired_companies: ENTITIES.length,
  total_companies: ENTITIES.length,
  pipeline_version: "public-precomputed-v1",
};

const sectors = [...new Set(ENTITIES.map((item) => item.sector))].sort().map((value) => ({ value, label: value, count: ENTITIES.filter((item) => item.sector === value).length }));
const screenerOptions = {
  sectors,
  company_sizes: ["micro", "small", "mid"],
  signal_statuses: ["all", "above_threshold", "below_threshold"],
  sort_options: SORT_OPTIONS,
  budget_presets_usd: [50, 100, 250, 500],
  defaults: { budget_usd: 500, min_opportunity_score: 0 },
  universe: { total_companies: ENTITIES.length, public_showcase: true },
  score_semantics: "Comparative research score; not a probability or forecast.",
  budget_semantics: "Dated whole-share estimate; not a live quote.",
  response_schema_version: "1.0",
};

const researchOptions = {
  tickers: ENTITIES.map((item) => item.ticker),
  companies: ENTITIES.map((item) => item.company_name),
  company_options: ENTITIES,
  entities: ENTITIES,
  sectors: sectors.map((item) => item.value),
  sections,
  defaults: { top_k: 5 },
  response_schema_version: "2.0",
};

function clone(value) {
  return structuredClone(value);
}

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase();
}

async function loadAnalysis(ticker) {
  const normalized = normalizeTicker(ticker);
  const loader = ANALYSES[normalized];
  if (!loader) throw new Error("This company is not included in the public precomputed showcase.");
  return clone(await loader());
}

function companyContext(ticker) {
  const normalized = normalizeTicker(ticker);
  const entity = entityByTicker.get(normalized);
  const item = opportunityByTicker.get(normalized);
  if (!entity || !item) throw new Error("Company context is unavailable in the public showcase.");
  return {
    selected_entity: entity,
    profile: { ...entity, filing_point_in_time_safe: true, nlp_status: "available", number_of_analyzed_chunks: 0 },
    opportunity_signal: { available: true, score: item.opportunity.score, score_percent: item.opportunity.score_percent, label: item.opportunity.label, note: "Precomputed comparative research signal; not a forecast." },
    sentiment: { available: true, sentiment_label: item.filing_tone.label, sentiment_score: item.filing_tone.score, positive_probability: item.filing_tone.positive_probability, neutral_probability: item.filing_tone.neutral_probability, negative_probability: item.filing_tone.negative_probability, analyzed_chunks: null, aggregation_scope: "precomputed_filing_summary" },
    response_schema_version: "2.0",
  };
}

function applyBudget(item, budget) {
  const next = clone(item);
  const amount = Number.isFinite(Number(budget)) && Number(budget) > 0 ? Number(budget) : 500;
  const price = next.reference_data.reference_price_usd;
  const shares = Math.floor(amount / price);
  next.budget_fit = { ...next.budget_fit, budget_usd: amount, can_buy_one_whole_share: shares > 0, estimated_whole_shares: shares, estimated_invested_usd: shares * price, cash_remaining_usd: amount - shares * price };
  return next;
}

function screenCompanies(payload = {}) {
  const sizes = new Set(payload.company_size || ["micro", "small", "mid"]);
  const query = String(payload.query || "").trim().toLowerCase();
  const minScore = Number(payload.min_opportunity_score || 0) * 100;
  const budget = Number(payload.budget_usd || 500);
  let items = OPPORTUNITIES.filter((item) =>
    sizes.has(item.company_size.bucket)
    && (!payload.sector || item.company.sector === payload.sector)
    && item.opportunity.score_percent >= minScore
    && item.reference_data.reference_price_usd <= budget
    && (!query || `${item.company.ticker} ${item.company.name}`.toLowerCase().includes(query))
    && (!payload.positive_revenue_growth || Number(item.key_metrics.revenue_growth_yoy_pct) > 0)
    && (!payload.profitable || Number(item.key_metrics.net_margin_pct) > 0)
    && (!payload.positive_momentum || Number(item.key_metrics.momentum_12m_pct) > 0)
  ).map((item) => applyBudget(item, budget));
  const readers = {
    opportunity_desc: (a, b) => b.opportunity.score_percent - a.opportunity.score_percent,
    revenue_growth_desc: (a, b) => Number(b.key_metrics.revenue_growth_yoy_pct ?? -Infinity) - Number(a.key_metrics.revenue_growth_yoy_pct ?? -Infinity),
    momentum_desc: (a, b) => Number(b.key_metrics.momentum_12m_pct ?? -Infinity) - Number(a.key_metrics.momentum_12m_pct ?? -Infinity),
    market_cap_asc: (a, b) => a.company_size.market_cap_usd - b.company_size.market_cap_usd,
    market_cap_desc: (a, b) => b.company_size.market_cap_usd - a.company_size.market_cap_usd,
    price_asc: (a, b) => a.reference_data.reference_price_usd - b.reference_data.reference_price_usd,
    price_desc: (a, b) => b.reference_data.reference_price_usd - a.reference_data.reference_price_usd,
  };
  items.sort(readers[payload.sort] || readers.opportunity_desc);
  const total = items.length;
  const offset = Math.max(0, Number(payload.offset || 0));
  const limit = Math.max(1, Number(payload.limit || 20));
  items = items.slice(offset, offset + limit).map((item, index) => ({ ...item, rank: offset + index + 1 }));
  return {
    results: items,
    summary: { matched_companies: total, returned_companies: items.length, offset, message: `Showing ${items.length} of ${total} precomputed research examples.`, suggestions: total ? [] : ["Try lowering the minimum score or broadening the filters."] },
    pagination: { limit, offset, total, has_more: offset + items.length < total, next_offset: offset + items.length },
    applied_filters: payload,
    data_snapshot: { as_of_date: "2026-08-06", universe_count: ENTITIES.length, matched_count: total, price_status: "dated_reference_prices_not_live_quotes" },
    methodology: { score: screenerOptions.score_semantics, budget: screenerOptions.budget_semantics, disclaimer: "Decision support only — not financial advice." },
    response_schema_version: "1.0",
  };
}

function themeCounts(analysis) {
  const counts = new Map();
  for (const change of analysis.changes || []) counts.set(change.topic, (counts.get(change.topic) || 0) + 1);
  return counts;
}

async function peerComparison(payload) {
  const tickers = [...new Set([normalizeTicker(payload.ticker), ...(payload.peer_tickers || []).map(normalizeTicker)])].filter(Boolean).slice(0, 4);
  const analyses = await Promise.all(tickers.map(loadAnalysis));
  const counts = new Map(analyses.map((analysis) => [analysis.company.ticker, themeCounts(analysis)]));
  return {
    companies: analyses.map((analysis) => analysis.company),
    filing_dates: Object.fromEntries(analyses.map((analysis) => [analysis.company.ticker, analysis.filing_pair.current.filing_date])),
    matrix: TOPICS.map((topic) => ({
      topic: topic.value,
      label: topic.label,
      companies: Object.fromEntries(analyses.map((analysis) => {
        const count = counts.get(analysis.company.ticker).get(topic.value) || 0;
        return [analysis.company.ticker, { change_count: count, attention: count >= 5 ? "high" : count >= 2 ? "moderate" : count ? "limited" : "none" }];
      })),
    })),
    narrative: "This comparison highlights differences in surfaced filing themes. Filing dates remain visible because company reporting periods are not perfectly aligned.",
    disclaimer: "Precomputed public examples for research support only — not investment advice.",
  };
}

function selectChanges(analysis, question) {
  const words = String(question || "").toLowerCase().split(/\W+/).filter((word) => word.length > 4);
  const scored = (analysis.changes || []).map((change) => ({ change, score: words.reduce((sum, word) => sum + `${change.topic_label} ${change.explanation} ${change.analyst_relevance}`.toLowerCase().includes(word), 0) }));
  scored.sort((a, b) => b.score - a.score || (b.change.attention?.score || 0) - (a.change.attention?.score || 0));
  return scored.slice(0, 3).map((item) => item.change);
}

async function filingAnswer(payload) {
  const analysis = await loadAnalysis(payload.ticker);
  const changes = selectChanges(analysis, payload.question);
  const bullets = changes.map((change) => `${change.change_type[0].toUpperCase()}${change.change_type.slice(1)} — ${change.explanation}`).join("\n\n");
  const evidence = changes.flatMap((change) => [change.previous_evidence, change.current_evidence].filter(Boolean));
  return {
    company: analysis.company,
    answer: `The precomputed filing comparison surfaces ${analysis.summary.total_changes} changes between ${analysis.filing_pair.previous.filing_date} and ${analysis.filing_pair.current.filing_date}. The items most relevant to your question are:\n\n${bullets}\n\nOpen the cited filing passages before drawing a conclusion.`,
    evidence,
    generation: { used: false, status: "precomputed_evidence_summary" },
    grounding_status: "grounded",
  };
}

async function researchMemo(payload) {
  const analysis = await loadAnalysis(payload.ticker);
  const top = (analysis.changes || []).slice(0, 8);
  const markdown = [
    `# GrowthLens research memo — ${analysis.company.ticker}`,
    "",
    `**Company:** ${analysis.company.company_name}`,
    `**Filing comparison:** ${analysis.filing_pair.previous.filing_date} → ${analysis.filing_pair.current.filing_date}`,
    "",
    "## Executive view",
    `${analysis.summary.total_changes} disclosure changes were surfaced across the supplied comparable sections. This memo is a precomputed public example and should be verified against the cited filings.`,
    "",
    "## Material changes",
    ...top.flatMap((change) => [`### ${change.topic_label} — ${change.change_type}`, change.explanation, `Attention priority: ${change.attention?.score || "N/A"}`, ""]),
    "## Limitations",
    "Research support only. This is not investment advice, a recommendation, or a live analysis.",
  ].join("\n");
  return {
    markdown_url: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    pdf_url: "https://github.com/altayariyasser/GrowthLens_Project/blob/main/GrowthLens_Report.pdf",
  };
}

export async function api(path) {
  if (path === "/api/health") return { status: "ready", mode: "public_precomputed" };
  if (path === "/api/screener/options") return clone(screenerOptions);
  if (path === "/api/options") return clone(researchOptions);
  if (path === "/api/filing-intelligence/options") return clone(filingOptions);
  if (path.startsWith("/api/company/")) return companyContext(decodeURIComponent(path.split("/").pop()));
  throw new Error("This action is available only in the full local edition.");
}

export async function postJson(path, payload = {}) {
  if (path === "/api/screener") return screenCompanies(payload);
  if (path === "/api/filing-intelligence/analyze") return loadAnalysis(payload.ticker);
  if (path === "/api/filing-intelligence/peers") return peerComparison(payload);
  if (path === "/api/filing-intelligence/ask" || path === "/api/ask") return filingAnswer(payload);
  if (path === "/api/research-memos") return researchMemo(payload);
  throw new Error("This action is available only in the full local edition.");
}

export function loadBootstrap() {
  return Promise.all([api("/api/health"), api("/api/screener/options"), api("/api/options"), api("/api/filing-intelligence/options")]);
}
