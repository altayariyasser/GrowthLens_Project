import { useState } from "react";
import { postJson } from "../../lib/api";
import { DocumentIcon } from "../../components/Icons";

export function MemoPanel({ ticker, peerTickers }) {
  const [memo, setMemo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const buildMemo = async () => {
    setLoading(true); setError("");
    try { setMemo(await postJson("/api/research-memos", { ticker, peer_tickers: peerTickers })); }
    catch (nextError) { setError(nextError.message); }
    finally { setLoading(false); }
  };
  return (
    <section className="memo-studio" id="reports" aria-labelledby="memo-heading">
      <div className="memo-preview" aria-hidden="true"><div className="memo-paper"><span>GROWTHLENS</span><strong>{ticker}</strong><i/><i/><i/><b>Material changes</b><i/><i/><b>Evidence register</b><i/></div></div>
      <div className="memo-copy"><span>Research memo</span><h2 id="memo-heading">Move from disclosure review to an institutional brief.</h2><p>Generate a neutral memo with material changes, filing evidence, peer context, and explicit coverage limitations.</p><ul><li>Executive view</li><li>Material changes and numerical deltas</li><li>Peer context</li><li>Evidence register and limitations</li></ul><button className="fi-primary fi-primary--paper" type="button" onClick={buildMemo} disabled={loading}><DocumentIcon/>{loading ? "Building memo…" : "Create research memo"}</button>{error ? <p className="form-error" role="alert">{error}</p> : null}{memo ? <div className="memo-downloads"><a href={memo.markdown_url} download={`${ticker}_GrowthLens_memo.md`}>Download Markdown</a>{memo.pdf_url ? <a href={memo.pdf_url} target="_blank" rel="noreferrer">View PDF</a> : <span>PDF unavailable</span>}</div> : null}</div>
    </section>
  );
}
