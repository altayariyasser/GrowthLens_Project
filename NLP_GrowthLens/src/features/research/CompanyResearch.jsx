import { useCallback, useEffect, useMemo, useState } from "react";
import { postJson } from "../../lib/api";
import { SendIcon, SearchIcon } from "../../components/Icons";
import { human, probabilityPercent, safeNumber } from "../../lib/format";
import { EvidenceCard } from "./EvidenceCard";

const EXAMPLES = [
  ["Growth & risks", "What are the main growth drivers and material risks disclosed by management?"],
  ["Financial resilience", "How strong is the company's liquidity position and what are its near-term capital needs?"],
  ["What to watch", "What could materially change the investment case over the next year?"],
];

function companyLabel(entity) {
  if (!entity) return "";
  return entity.label || `${entity.ticker || ""} — ${entity.company_name || ""}`;
}
function AnswerText({ text }) {
  const paragraphs = String(text || "No answer returned.").trim().split(/\n{2,}/);
  return <div className="answer-body">{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div>;
}

function ResearchResult({ data, onCopy }) {
  const evidence = data.evidence || [];
  const entity = data.selected_entity || {};
  const generationUsed = Boolean(data.generation?.used);
  const score = safeNumber(data.opportunity_signal?.score_percent);
  const tone = data.sentiment || {};
  const tonePosition = tone.available ? Math.max(0, Math.min(100, 50 + Number(tone.sentiment_score || 0) * 50)) : 0;
  const statusTitle = data.grounding_status === "grounded" ? "Supported by filing evidence" : data.grounding_status === "refused" ? "Request outside available evidence" : "Limited supporting evidence";
  const statusDetail = generationUsed ? "Prepared from cited filing evidence" : data.generation?.fallback_reason || "Prepared from available sources";
  return (
    <div className="research-result">
      <header className="answer-toolbar"><div><span className="eyebrow">Decision brief</span><h2 id="answer-title">Company research answer</h2></div><div><span className="answer-company">{entity.ticker ? `${entity.ticker} · ${entity.company_name}` : "Selected company"}</span><button className="icon-button" type="button" onClick={onCopy} aria-label="Copy answer" title="Copy answer">Copy</button></div></header>
      <article className="answer-card">
        <header><div className="answer-status"><span className="grounding-dot" aria-hidden="true"/><div><strong>{statusTitle}</strong><small>{statusDetail}</small></div></div><span className="answer-badge">{generationUsed ? "Local AI answer" : "Evidence summary"}</span></header>
        <AnswerText text={data.answer} />
        <footer><span>Research support only · Not investment advice</span><span>{safeNumber(data.latency_ms) === null ? "" : `${(data.latency_ms / 1000).toFixed(1)} seconds`}</span></footer>
      </article>
      <section className="company-context" aria-labelledby="context-title">
        <header><div><span className="eyebrow">Decision context</span><h3 id="context-title">Signals at a glance</h3></div><p>Context for your review, not a recommendation.</p></header>
        <div className="context-grid">
          <article className="context-card context-card--score"><span>Opportunity score</span><div><strong>{score === null ? "—" : Math.round(score)}</strong><small>/100</small></div><p>{data.opportunity_signal?.available ? "Comparative research signal, not a forecast" : "Signal unavailable"}</p></article>
          <article className="context-card context-card--tone"><span>Filing outlook</span><strong>{tone.available ? human(tone.sentiment_label) : "Unavailable"}</strong><div className="tone-meter"><i style={{ width: `${tonePosition}%` }}/></div><p>{tone.available ? `${probabilityPercent(tone.positive_probability)} positive · ${probabilityPercent(tone.neutral_probability)} neutral · ${probabilityPercent(tone.negative_probability)} cautious` : "No eligible filing outlook"}</p></article>
          <article className="context-card"><span>Evidence coverage</span><strong>{evidence.length} sources</strong><p>{data.profile?.filing_point_in_time_safe ? "Point-in-time filing evidence" : "Limited filing coverage"}</p></article>
        </div>
      </section>
      <section className="evidence-section" aria-labelledby="evidence-title"><header><div><span className="eyebrow">Source trail</span><h3 id="evidence-title">Evidence behind the answer</h3></div><span className="evidence-count">{evidence.length} passage{evidence.length === 1 ? "" : "s"}</span></header><div className="evidence-list">{evidence.map((item, index) => <EvidenceCard evidence={item} rank={index + 1} key={item.chunk_id || index} />)}</div></section>
      <details className="answer-methodology"><summary>How this answer was prepared</summary><div><p>GrowthLens found filing passages related to your question and prepared an answer limited to that evidence.</p><ul><li>Sources are shown so you can verify the context.</li><li>Weak or missing evidence is stated instead of filled with assumptions.</li><li>Scores and filing outlook are research signals, not forecasts or advice.</li></ul></div></details>
    </div>
  );
}

export function CompanyResearch({ options, entityIndex, initialCompany, onCompanyChange, onBack, onToast }) {
  const [scopeInput, setScopeInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState("");
  const [section, setSection] = useState("");
  const [asOfDate, setAsOfDate] = useState("");
  const [topK, setTopK] = useState(5);
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const companies = options?.company_options || options?.entities || [];

  useEffect(() => {
    if (!initialCompany) return;
    const entity = entityIndex.get(String(initialCompany.ticker || "").toLowerCase()) || initialCompany;
    setSelected(entity);
    setScopeInput(companyLabel(entity));
  }, [initialCompany, entityIndex]);

  const coverage = useMemo(() => selected?.filing_point_in_time_safe ? "Filing insights" : "Limited filing coverage", [selected]);
  const resolveScope = useCallback((value) => entityIndex.get(String(value).trim().toLowerCase()) || null, [entityIndex]);
  const handleScopeChange = (value) => {
    setScopeInput(value);
    const entity = resolveScope(value);
    setSelected(entity);
    onCompanyChange(entity);
    if (entity) setErrors((current) => ({ ...current, scope: "" }));
  };
  const clear = () => {
    setScopeInput(""); setSelected(null); setQuestion(""); setSection(""); setAsOfDate(""); setTopK(5); setResult(null); setNotice(""); setErrors({}); onCompanyChange(null);
  };
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = { scope: selected ? "" : "Select one company from the list.", question: question.trim() ? "" : "Enter a focused question." };
    setErrors(nextErrors);
    if (nextErrors.scope || nextErrors.question) return;
    setIsLoading(true); setResult(null); setNotice("");
    try {
      const data = await postJson("/api/ask", { question: question.trim(), entity_id: selected.entity_id || "", cik: selected.cik || "", ticker: selected.ticker || "", section, as_of_date: asOfDate, top_k: topK });
      setResult(data);
      if (data.generator_error) setNotice("The answer writer did not complete, so GrowthLens prepared an evidence summary.");
      else if (data.weak_evidence) setNotice("The available evidence is limited, so GrowthLens has not forced a confident answer.");
    } catch (error) { setNotice(error.message); }
    finally { setIsLoading(false); }
  };
  const copyAnswer = async () => {
    try { await navigator.clipboard.writeText(result?.answer || ""); onToast("Answer copied"); }
    catch { onToast("Copy is unavailable in this browser"); }
  };
  return (
    <section className="product-view is-active" aria-labelledby="research-title">
      <div className="research-hero"><div><span className="eyebrow eyebrow--mint">Company due diligence</span><h1 id="research-title">Ask a company. Get an evidence-backed answer.</h1><p>Turn filing disclosures into a concise decision brief, with source passages available for review.</p></div><button className="back-to-explorer" type="button" onClick={onBack}><span aria-hidden="true">←</span> Back to opportunities</button></div>
      <div className="research-shell">
        <aside className="research-panel" aria-labelledby="research-form-title">
          <div className="panel-title-row"><div><span className="eyebrow">Ask GrowthLens</span><h2 id="research-form-title">Research a company</h2></div><button className="text-button" type="button" onClick={clear}>Clear</button></div>
          <form onSubmit={submit} noValidate>
            <div className="field-group"><label htmlFor="company-scope">Company or ticker</label><div className="search-input-wrap"><SearchIcon/><input id="company-scope" value={scopeInput} onChange={(event) => handleScopeChange(event.target.value)} onBlur={() => { if (!selected && scopeInput) setErrors((current) => ({ ...current, scope: "Select one company from the list." })); }} list="company-scope-options" autoComplete="off" spellCheck="false" placeholder="Search e.g. AAOI"/><button type="button" onClick={() => handleScopeChange("")} aria-label="Clear selected company" hidden={!scopeInput}>×</button></div><datalist id="company-scope-options">{companies.map((entity) => <option value={companyLabel(entity)} key={entity.entity_id || entity.cik || entity.ticker}>{entity.ticker} · {entity.company_name}</option>)}</datalist>{errors.scope ? <small className="field-error" role="alert">{errors.scope}</small> : null}</div>
            {selected ? <div className="selected-company"><span className="company-monogram">{selected.ticker?.slice(0, 2)}</span><div><strong>{selected.ticker} · {selected.company_name}</strong><small>{[selected.sector, selected.industry].filter(Boolean).join(" · ")}</small></div><span className="coverage-badge">{coverage}</span></div> : null}
            <div className="field-group"><label htmlFor="question">Your decision question</label><div className="textarea-shell"><textarea id="question" rows="6" maxLength="1200" value={question} onChange={(event) => { setQuestion(event.target.value); if (event.target.value.trim()) setErrors((current) => ({ ...current, question: "" })); }} placeholder="What are the main growth drivers, financial strengths, and risks disclosed by management?"/><span className="char-count">{question.length}/1200</span></div>{errors.question ? <small className="field-error" role="alert">{errors.question}</small> : null}</div>
            <div className="examples"><span>Popular questions</span><div className="chip-row">{EXAMPLES.map(([label, value]) => <button type="button" onClick={() => setQuestion(value)} key={label}>{label}</button>)}</div></div>
            <details className="research-options"><summary>Refine evidence</summary><div className="two-fields"><div className="field-group"><label htmlFor="section">Filing section</label><select id="section" value={section} onChange={(event) => setSection(event.target.value)}><option value="">All filing sections</option>{(options?.sections || []).map((value) => <option value={value} key={value}>{human(value)}</option>)}</select></div><div className="field-group"><label htmlFor="as-of-date">Known by date</label><input id="as-of-date" type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)}/></div></div><div className="field-group"><label htmlFor="top-k">Source passages <output>{topK}</output></label><input id="top-k" type="range" min="2" max="10" step="1" value={topK} onChange={(event) => setTopK(Number(event.target.value))}/></div></details>
            <button className="primary-action" type="submit" disabled={isLoading}><SendIcon/>{isLoading ? "Preparing decision brief…" : "Ask GrowthLens"}</button>
          </form>
        </aside>
        <section className="research-workspace" aria-labelledby="answer-title" aria-busy={isLoading}>
          {notice ? <div className="workspace-notice workspace-notice--research" role="status">{notice}</div> : null}
          {isLoading ? <div className="research-loading" aria-live="polite"><span className="spinner spinner--large"/><span className="eyebrow">Reviewing filing evidence</span><h2>Preparing your decision brief</h2><p>Finding relevant disclosures, checking context, and building a sourced answer…</p><div className="loading-path"><span>Find evidence</span><i/><span>Read context</span><i/><span>Draft answer</span></div></div> : result ? <ResearchResult data={result} onCopy={copyAnswer}/> : <div className="research-empty"><div className="research-empty__visual" aria-hidden="true"><svg viewBox="0 0 170 130"><path d="M33 17h70l24 24v72H33z"/><path d="M103 17v24h24M51 58h51M51 74h42M51 90h28"/><circle cx="120" cy="91" r="25"/><path d="m138 109 19 18"/></svg></div><span className="eyebrow">Evidence-based decision support</span><h2>Start with the question behind the decision.</h2><p>Select a company and ask what you need to understand. GrowthLens will answer from available filing evidence and show the sources.</p><div className="research-benefits"><span><b>01</b> Plain-language brief</span><span><b>02</b> Filing outlook</span><span><b>03</b> Reviewable evidence</span></div></div>}
        </section>
      </div>
    </section>
  );
}
