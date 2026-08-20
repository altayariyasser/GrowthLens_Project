export const ENTITIES = [
  { entity_id: "cik:0001829576", cik: "0001829576", ticker: "CARE", company_name: "Carter Bankshares, Inc.", label: "CARE — Carter Bankshares, Inc.", sector: "Finance", industry: "Major Banks", comparison_available: true, filing_point_in_time_safe: true, has_profile: true, has_filing: true },
  { entity_id: "cik:0000006201", cik: "0000006201", ticker: "AAL", company_name: "American Airlines Group Inc.", label: "AAL — American Airlines Group Inc.", sector: "Consumer Discretionary", industry: "Air Freight/Delivery Services", comparison_available: true, filing_point_in_time_safe: true, has_profile: true, has_filing: true },
  { entity_id: "cik:0001500217", cik: "0001500217", ticker: "AAT", company_name: "American Assets Trust, Inc.", label: "AAT — American Assets Trust, Inc.", sector: "Real Estate", industry: "Real Estate Investment Trusts", comparison_available: true, filing_point_in_time_safe: true, has_profile: true, has_filing: true },
  { entity_id: "cik:0001158449", cik: "0001158449", ticker: "AAP", company_name: "Advance Auto Parts Inc.", label: "AAP — Advance Auto Parts Inc.", sector: "Consumer Discretionary", industry: "Auto & Home Supply Stores", comparison_available: true, filing_point_in_time_safe: true, has_profile: true, has_filing: true },
  { entity_id: "cik:0001722482", cik: "0001722482", ticker: "AVTR", company_name: "Avantor, Inc.", label: "AVTR — Avantor, Inc.", sector: "Industrials", industry: "Laboratory Instruments", comparison_available: true, filing_point_in_time_safe: true, has_profile: true, has_filing: true },
  { entity_id: "cik:0000771497", cik: "0000771497", ticker: "ABM", company_name: "ABM Industries Inc.", label: "ABM — ABM Industries Inc.", sector: "Consumer Discretionary", industry: "Diversified Commercial Services", comparison_available: true, filing_point_in_time_safe: true, has_profile: true, has_filing: true },
];

const makeOpportunity = ({ entity, exchange, score, bucket, cap, price, date, activity, momentum, revenue, margin, liabilities, positive, neutral, negative, highlights }) => ({
  company: { ...entity, name: entity.company_name, exchange },
  opportunity: { score: score / 100, score_percent: score, score_out_of_100: score, signal_status: score >= 32.5 ? "above_threshold" : "below_threshold", label: score >= 32.5 ? "Above opportunity threshold" : "Below opportunity threshold", decision_threshold: .325, not_a_probability: true },
  company_size: { bucket, label: `${bucket[0].toUpperCase()}${bucket.slice(1)} company`, market_cap_usd: cap },
  budget_fit: { applicable: true, budget_usd: 500, can_buy_one_whole_share: true, estimated_whole_shares: Math.floor(500 / price), estimated_invested_usd: Math.floor(500 / price) * price, cash_remaining_usd: 500 - Math.floor(500 / price) * price, reference_price_usd: price, price_as_of: date, quote_status: "not_live_quote" },
  reference_data: { reference_price_usd: price, price_as_of: date, price_age_days_from_snapshot: 0, freshness_status: "snapshot_date", average_daily_trading_value_usd: activity, quote_status: "not_live_quote" },
  key_metrics: { momentum_12m_pct: momentum, revenue_growth_yoy_pct: revenue, net_margin_pct: margin, liabilities_to_assets: liabilities, average_daily_trading_value_usd: activity },
  filing_tone: { available: true, label: "Neutral", score: positive - negative, positive_probability: positive, neutral_probability: neutral, negative_probability: negative, filing_date: date },
  research_coverage: { filing_insights_available: true, point_in_time_checked: true, status: "Filing insights available" },
  highlights,
});

export const OPPORTUNITIES = [
  makeOpportunity({ entity: ENTITIES[0], exchange: "Nasdaq", score: 54.9, bucket: "small", cap: 752881698.8, price: 33.88, date: "2026-08-06", activity: 681544, momentum: 98.0, revenue: 4.6, margin: 154.4, liabilities: .913, positive: .074, neutral: .604, negative: .322, highlights: ["Revenue growth +4.6% year over year", "Net margin +154.4%", "12-month momentum +98.0%"] }),
  makeOpportunity({ entity: ENTITIES[5], exchange: "NYSE", score: 31.1, bucket: "mid", cap: 2842053479, price: 48.515, date: "2026-08-06", activity: 1299838, momentum: 6.1, revenue: 4.6, margin: 1.9, liabilities: .661, positive: .156, neutral: .516, negative: .328, highlights: ["Revenue growth +4.6% year over year", "Net margin +1.9%", "12-month momentum +6.1%"] }),
  makeOpportunity({ entity: ENTITIES[4], exchange: "NYSE", score: 8.5, bucket: "mid", cap: 9005543752, price: 13.19, date: "2026-08-06", activity: 8546882, momentum: 13.3, revenue: -3.4, margin: -8.1, liabilities: .528, positive: .082, neutral: .543, negative: .375, highlights: ["Revenue growth -3.4% year over year", "Net margin -8.1%", "12-month momentum +13.3%"] }),
  makeOpportunity({ entity: ENTITIES[3], exchange: "NYSE", score: 5.0, bucket: "mid", cap: 3492274500, price: 57.915, date: "2026-08-06", activity: 6216791, momentum: 3.6, revenue: -5.4, margin: .5, liabilities: .814, positive: .067, neutral: .599, negative: .334, highlights: ["Revenue growth -5.4% year over year", "Net margin +0.5%", "12-month momentum +3.6%"] }),
  makeOpportunity({ entity: ENTITIES[1], exchange: "Nasdaq", score: 2.2, bucket: "mid", cap: 9817014373, price: 14.83, date: "2026-07-29", activity: 42347348, momentum: 28.2, revenue: .8, margin: .2, liabilities: null, positive: .066, neutral: .569, negative: .365, highlights: ["Revenue growth +0.8% year over year", "Net margin +0.2%", "12-month momentum +28.2%"] }),
  makeOpportunity({ entity: ENTITIES[2], exchange: "NYSE", score: 2.2, bucket: "small", cap: 1381296060, price: 22.5, date: "2026-08-06", activity: 544013, momentum: 25.1, revenue: -7.2, margin: 178.8, liabilities: .626, positive: .073, neutral: .676, negative: .251, highlights: ["Revenue growth -7.2% year over year", "Net margin +178.8%", "12-month momentum +25.1%"] }),
];

export const TOPICS = [
  { value: "growth_and_strategy", label: "Growth and strategy" },
  { value: "demand_and_competition", label: "Demand and competition" },
  { value: "operations_and_supply_chain", label: "Operations and supply chain" },
  { value: "liquidity_debt_margins_and_costs", label: "Liquidity, debt, margins and costs" },
  { value: "regulation_and_legal_risk", label: "Regulation and legal risk" },
  { value: "cybersecurity_and_technology", label: "Cybersecurity and technology" },
  { value: "human_capital", label: "Human capital" },
];

export const SORT_OPTIONS = [
  { value: "opportunity_desc", label: "Opportunity score: highest first" },
  { value: "revenue_growth_desc", label: "Revenue growth: highest first" },
  { value: "momentum_desc", label: "12-month momentum: highest first" },
  { value: "market_cap_asc", label: "Company size: smallest first" },
  { value: "market_cap_desc", label: "Company size: largest first" },
  { value: "price_asc", label: "Reference share price: lowest first" },
  { value: "price_desc", label: "Reference share price: highest first" },
];
