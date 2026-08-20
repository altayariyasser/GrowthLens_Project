import { useEffect, useRef } from "react";
import { compactMoney, displayDate, integer, metricPercent, money, toneLabel } from "../../lib/format";

const ROWS = [
  ["Opportunity score", (item) => `${Math.round(item.opportunity.score_percent)} / 100`],
  ["Budget fit", (item) => `${integer(item.budget_fit.estimated_whole_shares)} shares`],
  ["Snapshot price", (item) => `${money(item.reference_data.reference_price_usd, 2)} · ${displayDate(item.reference_data.price_as_of)}`],
  ["Market cap", (item) => compactMoney(item.company_size.market_cap_usd)],
  ["12m trend", (item) => metricPercent(item.key_metrics.momentum_12m_pct)],
  ["Revenue growth", (item) => metricPercent(item.key_metrics.revenue_growth_yoy_pct)],
  ["Profit margin", (item) => metricPercent(item.key_metrics.net_margin_pct)],
  ["Filing outlook", (item) => toneLabel(item.filing_tone)],
];

export function CompareDialog({ open, items, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={dialogRef} className="compare-dialog" aria-labelledby="compare-title" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="dialog-shell">
        <header><div><span className="eyebrow">Side-by-side review</span><h2 id="compare-title">Compare opportunities</h2><p>Use consistent signals to decide which company deserves deeper research.</p></div><button className="dialog-close" type="button" onClick={onClose} aria-label="Close comparison">×</button></header>
        <div className="comparison-wrap">
          <table className="comparison-table">
            <thead><tr><th>Decision factor</th>{items.map((item) => <th key={item.company.ticker}>{item.company.ticker} · {item.company.name}</th>)}</tr></thead>
            <tbody>{ROWS.map(([label, read]) => <tr key={label}><th>{label}</th>{items.map((item) => <td key={item.company.ticker}>{read(item)}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <footer><p>Snapshot estimates and research signals only · Not investment advice</p><button className="secondary-action" type="button" onClick={onClose}>Done</button></footer>
      </div>
    </dialog>
  );
}
