import { useState } from "react";
import { postJson } from "../../lib/api";
import { SendIcon } from "../../components/Icons";

export function FilingAsk({ ticker }) {
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState("detected_changes");
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!question.trim()) { setError("Enter a focused filing question."); return; }
    setLoading(true); setError(""); setAnswer(null);
    try { setAnswer(await postJson("/api/filing-intelligence/ask", { ticker, question: question.trim(), filing_scope: scope })); }
    catch (nextError) { setError(nextError.message); }
    finally { setLoading(false); }
  };
  return (
    <section className="ask-studio" aria-labelledby="ask-heading">
      <div className="ask-studio__intro"><span>Ask the filing pair</span><h2 id="ask-heading">Interrogate the change, not a generic document.</h2><p>Choose the evidence boundary before asking. GrowthLens will stay inside that filing scope.</p></div>
      <div className="ask-studio__work">
        <form onSubmit={submit}><label htmlFor="filing-scope">Evidence scope</label><select id="filing-scope" value={scope} onChange={(event) => setScope(event.target.value)}><option value="detected_changes">Detected changes</option><option value="current">Current filing</option><option value="prior">Previous filing</option><option value="both">Both filings</option></select><label htmlFor="filing-question">Research question</label><textarea id="filing-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows="5" placeholder="How did management’s capacity expansion narrative change?"/><button className="fi-primary" type="submit" disabled={loading}><SendIcon/>{loading ? "Reviewing evidence…" : "Ask GrowthLens"}</button>{error ? <p className="form-error" role="alert">{error}</p> : null}</form>
        {answer ? <article className="filing-answer"><header><span>{answer.generation?.used ? "Generated research answer" : "Evidence summary"}</span><strong>{answer.company?.ticker || ticker}</strong></header>{String(answer.answer || "").split(/\n{2,}/).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>)}<footer>{answer.evidence?.length || 0} cited passage{answer.evidence?.length === 1 ? "" : "s"}</footer></article> : <div className="ask-placeholder"><span>Questions grounded in two filing versions</span><p>Examples: What risk became more specific? Which operating assumptions changed? What disappeared from management’s discussion?</p></div>}
      </div>
    </section>
  );
}
