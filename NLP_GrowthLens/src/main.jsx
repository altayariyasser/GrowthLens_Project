import { StrictMode, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "./components/Header";
import { Toast } from "./components/Toast";
import { OpportunityExplorer } from "./features/explorer/OpportunityExplorer";
import { FilingIntelligence } from "./features/intelligence/FilingIntelligence";
import { loadBootstrap } from "./lib/api";
import "@fontsource-variable/geist";
import "./styles.css";
import "./intelligence.css";

function App() {
  const [activeView, setActiveView] = useState("intelligence");
  const [screenOptions, setScreenOptions] = useState(null);
  const [researchOptions, setResearchOptions] = useState(null);
  const [filingOptions, setFilingOptions] = useState(null);
  const [bootstrapError, setBootstrapError] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadBootstrap()
      .then(([, nextScreen, nextResearch, nextFiling]) => {
        if (cancelled) return;
        setScreenOptions(nextScreen);
        setResearchOptions(nextResearch);
        setFilingOptions(nextFiling);
      })
      .catch((error) => { if (!cancelled) setBootstrapError(error.message); });
    return () => { cancelled = true; };
  }, []);

  const entityIndex = useMemo(() => {
    const index = new Map();
    const options = filingOptions?.company_options || researchOptions?.company_options || researchOptions?.entities || [];
    options.forEach((entity) => {
      const ticker = String(entity.ticker || "").toUpperCase();
      const company = String(entity.company_name || entity.company || "");
      const label = entity.label || `${ticker} — ${company}`;
      const normalized = { ...entity, ticker, company_name: company, label };
      [label, ticker, company].filter(Boolean).forEach((key) => index.set(key.toLowerCase(), normalized));
    });
    return index;
  }, [filingOptions, researchOptions]);

  const navigate = useCallback((view) => {
    const anchor = view === "peers" || view === "reports" ? view : null;
    setActiveView(view);
    if (anchor) {
      window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const openResearch = useCallback((company) => {
    setSelectedCompany(company);
    navigate("intelligence");
  }, [navigate]);
  const closeToast = useCallback(() => setToast(""), []);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <span className="sr-only">GrowthLens Research Desk</span>
      <Header activeView={activeView} onNavigate={navigate} />
      <main id="main-content">
        {activeView === "explorer" ? <OpportunityExplorer options={screenOptions} bootstrapError={bootstrapError} onResearch={openResearch} entityIndex={entityIndex} onToast={setToast}/> : <FilingIntelligence options={filingOptions} initialCompany={selectedCompany} onToast={setToast} activeWorkspace={activeView}/>}
      </main>
      <footer className="site-footer"><p><strong>GrowthLens Filing Intelligence</strong> · Evidence-led annual-disclosure research</p><p>Verify original filings · Explicit coverage limits · Not investment advice</p></footer>
      <Toast message={toast} onClose={closeToast} />
    </>
  );
}

createRoot(document.getElementById("root")).render(<StrictMode><App /></StrictMode>);
