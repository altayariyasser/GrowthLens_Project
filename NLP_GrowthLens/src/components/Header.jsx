import { BrandMark, ChartIcon, DocumentIcon, PeopleIcon, ReportIcon } from "./Icons";

export function Header({ activeView, onNavigate }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button className="brand brand-button" type="button" onClick={() => onNavigate("intelligence")} aria-label="GrowthLens Filing Intelligence home">
          <span className="brand__mark" aria-hidden="true"><BrandMark /></span>
          <span className="brand__copy"><strong>GrowthLens</strong><small>Filing Intelligence</small></span>
        </button>
        <nav className="product-nav" aria-label="Main navigation">
          <button className={`product-nav__item ${activeView === "intelligence" ? "is-active" : ""}`} type="button" onClick={() => onNavigate("intelligence")} aria-current={activeView === "intelligence" ? "page" : undefined}><DocumentIcon />Filing Intelligence</button>
          <button className={`product-nav__item ${activeView === "explorer" ? "is-active" : ""}`} type="button" onClick={() => onNavigate("explorer")} aria-current={activeView === "explorer" ? "page" : undefined}><ChartIcon />Discover</button>
          <button className={`product-nav__item product-nav__item--optional ${activeView === "peers" ? "is-active" : ""}`} type="button" onClick={() => onNavigate("peers")} aria-current={activeView === "peers" ? "page" : undefined}><PeopleIcon />Peers</button>
          <button className={`product-nav__item product-nav__item--optional ${activeView === "reports" ? "is-active" : ""}`} type="button" onClick={() => onNavigate("reports")} aria-current={activeView === "reports" ? "page" : undefined}><ReportIcon />Reports</button>
        </nav>
      </div>
    </header>
  );
}
