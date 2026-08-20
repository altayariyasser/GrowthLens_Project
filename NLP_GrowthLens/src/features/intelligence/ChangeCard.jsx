import { human } from "../../lib/format";

function EvidencePanel({ evidence, label }) {
  if (!evidence) {
    return <div className="evidence-panel evidence-panel--empty"><span>{label}</span><p>No comparable passage is present in this filing section.</p></div>;
  }
  return (
    <div className="evidence-panel">
      <header><span>{label}</span><time>{evidence.filing_date}</time></header>
      <p>“{evidence.text_excerpt}”</p>
      <footer><span>{human(evidence.section)} · {evidence.accession_number}</span>{evidence.source_url ? <a href={evidence.source_url} target="_blank" rel="noreferrer">Open SEC filing ↗</a> : null}</footer>
    </div>
  );
}
export function ChangeCard({ change, index }) {
  const attention = change.attention || {};
  return (
    <details className={`change-card change-card--${attention.label || "low"}`} style={{ "--stack-index": index }}>
      <summary className="change-card__summary">
        <span className="change-rank" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <span className="change-card__summary-main">
          <span className="change-card__meta"><span className="change-kind">{human(change.change_type)}</span><span className="change-topic">{change.topic_label}</span></span>
          <strong>{change.explanation}</strong>
        </span>
        <span className="attention-mark"><strong>{attention.score}</strong><span>{attention.label} attention</span></span>
        <span className="change-toggle" aria-hidden="true"><span>Review details</span><i/></span>
      </summary>
      <div className="change-card__details">
        <div className="change-card__copy"><span>Analyst relevance</span><p>{change.analyst_relevance}</p></div>
        {change.numeric_deltas?.length ? <div className="number-deltas" aria-label="Numerical changes">{change.numeric_deltas.map((delta, itemIndex) => <span key={`${delta.previous}-${delta.current}-${itemIndex}`}><b>{delta.previous || "Not stated"}</b><i>→</i><strong>{delta.current || "Not stated"}</strong></span>)}</div> : null}
        <div className="evidence-pair"><EvidencePanel evidence={change.previous_evidence} label="Previous filing"/><EvidencePanel evidence={change.current_evidence} label="Current filing"/></div>
        <section className="priority-details" aria-label="Attention priority factors">
          <h4>Why this requires attention</h4>
          <div>{(attention.factors || []).map((factor) => <span key={factor.label}><i style={{ width: `${Math.min(100, factor.points * 5)}%` }}/><b>{factor.label}</b><em>+{factor.points}</em></span>)}</div>
        </section>
      </div>
    </details>
  );
}
