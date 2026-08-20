import { displayDate, human, probabilityPercent, safeNumber } from "../../lib/format";

export function EvidenceCard({ evidence, rank }) {
  const similarity = safeNumber(evidence.similarity_score);
  const tone = evidence.sentiment_label ? human(evidence.sentiment_label) : null;
  return (
    <article className="evidence-card">
      <span className="evidence-rank">{String(rank).padStart(2, "0")}</span>
      <div className="evidence-content">
        <header>
          <div>
            <strong className="evidence-company">{evidence.ticker || "Company"} · {evidence.company_name || ""}</strong>
            <span className="evidence-context">{displayDate(evidence.filing_date)} · {human(evidence.section)}</span>
          </div>
          <span className="evidence-match">{similarity === null ? "Supporting passage" : `${probabilityPercent(similarity)} match`}</span>
        </header>
        <p className="evidence-excerpt">{evidence.chunk_text || "Passage unavailable."}</p>
        <footer>
          <div className="evidence-tags">
            {evidence.chunk_id ? <span>Source {evidence.chunk_id}</span> : null}
            {tone ? <span>Filing outlook: {tone}</span> : null}
          </div>
          {evidence.source_url ? <a className="source-link" href={evidence.source_url} target="_blank" rel="noreferrer">Open filing ↗</a> : null}
        </footer>
      </div>
    </article>
  );
}
