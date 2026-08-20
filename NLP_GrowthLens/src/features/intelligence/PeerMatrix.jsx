export function PeerMatrix({ data }) {
  if (!data) return null;
  const tickers = data.companies.map((company) => company.ticker);
  return (
    <div className="peer-result">
      <div className="peer-narrative"><span>Peer reading</span><p>{data.narrative}</p></div>
      <div className="peer-table-wrap">
        <table className="peer-table">
          <thead><tr><th>Disclosure theme</th>{tickers.map((ticker) => <th key={ticker}><strong>{ticker}</strong><small>{data.filing_dates[ticker] || "Date unavailable"}</small></th>)}</tr></thead>
          <tbody>{data.matrix.map((row) => <tr key={row.topic}><th>{row.label}</th>{tickers.map((ticker) => { const cell = row.companies[ticker]; return <td key={ticker}><span className={`peer-level peer-level--${cell.attention}`}>{cell.attention.replaceAll("_", " ")}</span><small>{cell.change_count} surfaced change{cell.change_count === 1 ? "" : "s"}</small></td>; })}</tr>)}</tbody>
        </table>
      </div>
      <p className="peer-disclaimer">{data.disclaimer}</p>
    </div>
  );
}
