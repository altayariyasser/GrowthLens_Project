# GrowthLens Decision Support Platform

GrowthLens is an evidence-led equity-research platform that helps decision makers discover companies through ML opportunity scoring and investigate them through NLP analysis of annual filings.

The product has two distinct analytical parts. Its structured ML workflow creates a comparative opportunity score for company discovery. Its NLP workflow organizes material disclosure changes, shows the earlier and current evidence, explains why each change deserves attention, and keeps the original filing context visible.

[Open the public GrowthLens experience](https://altayariyasser.github.io/GrowthLens_Project/)

> GrowthLens supports research and review. It does not provide investment recommendations, return forecasts, live prices, or financial advice.

## Product walkthrough

![Animated GrowthLens demo showing Filing Intelligence, material-change evidence, research questions, and company discovery](./docs/assets/growthlens-demo.gif)

The walkthrough follows the core research journey: open Filing Intelligence, choose a company, review its change portrait, scan ranked disclosures, expand source evidence, ask a filing-scoped question, and discover additional research candidates.

## What the project does

GrowthLens brings company discovery and annual-filing analysis into one research workflow:

- **Filing Intelligence** compares two annual filings and surfaces new, removed, modified, intensified, and softened disclosures.
- **Material Changes** groups changes into understandable business themes and assigns a transparent attention priority.
- **Evidence Review** connects every surfaced change to prior and current filing passages, dates, sections, accessions, and source links.
- **Peer Comparison** compares narrative themes across selected companies while preserving each company's filing date.
- **Ask GrowthLens** answers questions from the available filing evidence and produces an evidence-limited response when support is insufficient.
- **Research Memos** create a neutral, citation-oriented summary for further analyst review.
- **Discover Companies** filters research candidates by budget, sector, company size, financial characteristics, and a separate opportunity signal.

The opportunity signal is a discovery aid. It is not mathematically blended with filing-change attention and must not be interpreted as a probability, recommendation, or expected return.

## System architecture

GrowthLens is a decision-support platform with two independent analytical engines. The structured ML engine follows the workflow in [`GrowthLens_Project.ipynb`](./GrowthLens_Project.ipynb) and estimates a comparative opportunity signal. The NLP engine processes SEC disclosures, detects filing changes, and powers evidence-grounded research. Their outputs meet in one workspace, but their scores remain separate.

The diagram describes the full research architecture. The public GitHub Pages demonstration serves precomputed examples and does not run these models in the visitor's browser.

```mermaid
flowchart TB
    PLATFORM["GrowthLens<br/>Decision-Support Platform"]

    subgraph ML["Part 1 · Structured ML — Opportunity Prediction"]
        direction TB
        ML_DATA["Structured company data<br/>fundamentals · market data · financial ratios"]
        ML_TARGET["Cleaning and target creation<br/>3-year market-cap growth greater than 50%"]
        ML_FEATURES["EDA and feature engineering<br/>leakage-prone fields excluded"]
        ML_SPLITS["Temporal evaluation design<br/>chronological 80/10/10<br/>plus exploratory 3-month/1-month folds"]
        ML_PREP["Train-only preprocessing<br/>imputation · encoding · scaling · PCA"]
        ML_MODELS["GPU model experiments<br/>cuML PCA stacking · CatBoost<br/>exploratory XGBoost"]
        ML_EVAL["Model evaluation<br/>AUC · F1 · balanced accuracy<br/>training time · inference · GPU usage"]
        ML_OUTPUT["Comparative model score<br/>Opportunity / Not Opportunity"]

        ML_DATA --> ML_TARGET --> ML_FEATURES --> ML_SPLITS --> ML_PREP --> ML_MODELS --> ML_EVAL --> ML_OUTPUT
    end

    subgraph NLP["Part 2 · NLP — Filing Intelligence"]
        direction TB
        NLP_SOURCE["SEC 10-K disclosure collection<br/>Business · Risk Factors · MD&A"]
        NLP_CLEAN["Text extraction · normalization<br/>cleaning and deduplication"]
        NLP_CHUNKS["Section-aware chunking with provenance<br/>CIK · ticker · accession · filing date<br/>section · chunk ID · source URL"]

        NLP_SOURCE --> NLP_CLEAN --> NLP_CHUNKS

        subgraph CHANGE["Two-filing change-analysis path"]
            direction TB
            NLP_PAIR["Pair previous and current filings<br/>by CIK · accession · filing date · section"]
            NLP_ALIGN["Paragraph matching<br/>exact normalized hashes + MiniLM similarity<br/>mutual one-to-one alignment"]
            NLP_EXTRACT["Entity and numerical extraction<br/>dates · percentages · monetary values"]
            NLP_CHANGE["Disclosure change classification<br/>New · Removed · Modified<br/>Intensified · Softened"]
            NLP_PRIORITY["Explainable attention priority<br/>novelty · section importance · risk language<br/>numerical deltas · evidence quality"]

            NLP_PAIR --> NLP_ALIGN --> NLP_EXTRACT --> NLP_CHANGE --> NLP_PRIORITY
        end

        subgraph RAG["Metadata-filtered RAG path"]
            direction TB
            NLP_EMBED["MiniLM sentence embeddings<br/>384-dimensional · L2-normalized"]
            NLP_INDEX["FAISS IndexFlatIP<br/>exact inner-product cosine index"]
            NLP_QUERY["Research question and scope<br/>company/ticker · sector · section · known-by date"]
            NLP_FILTER["Canonical entity resolution<br/>metadata + point-in-time accession filtering"]
            NLP_SEARCH["Semantic top-k retrieval<br/>cosine threshold · duplicate removal<br/>lexical diagnostic fallback when unavailable"]
            NLP_CONTEXT["Prompt context assembly<br/>retrieved passages + allowed source IDs"]
            NLP_QWEN["Qwen 2.5 3B through local Ollama<br/>loopback-only constrained generation"]
            NLP_GUARD["Grounding guardrails<br/>citation allow-list and value validation<br/>weak-evidence refusal · extractive fallback"]
            NLP_ANSWER["Grounded answer<br/>with filing passages and source links"]

            NLP_EMBED --> NLP_INDEX --> NLP_SEARCH
            NLP_QUERY --> NLP_FILTER --> NLP_SEARCH
            NLP_SEARCH --> NLP_CONTEXT --> NLP_QWEN --> NLP_GUARD --> NLP_ANSWER
        end

        NLP_CHUNKS --> NLP_PAIR
        NLP_CHUNKS --> NLP_EMBED
        NLP_CHUNKS --> NLP_FILTER
        NLP_CHUNKS -.-> NLP_TONE["Optional FinBERT filing-tone metadata<br/>not used as investment quality"]

        NLP_PRIORITY --> NLP_OUTPUTS["Filing Intelligence outputs<br/>material changes · peer comparison<br/>evidence Q&A · research memo"]
        NLP_ANSWER --> NLP_OUTPUTS
        NLP_TONE -.-> NLP_OUTPUTS
        NLP_OUTPUTS -.-> NLP_CACHE["Fingerprint cache<br/>inputs · model · prompt · configuration"]
    end

    PLATFORM --> ML_DATA
    PLATFORM --> NLP_SOURCE

    ML_OUTPUT --> WORKSPACE["Decision-maker research workspace"]
    NLP_OUTPUTS --> WORKSPACE
    WORKSPACE --> OUTCOME["Evidence-led company review<br/>and better-informed decisions"]

    ML_OUTPUT -.-> SEPARATION["Independent signals<br/>ML opportunity score ≠ NLP attention priority"]
    NLP_PRIORITY -.-> SEPARATION

    classDef platform fill:#071b16,color:#f5f3eb,stroke:#aaff55,stroke-width:2px;
    classDef ml fill:#e8f5ef,color:#071b16,stroke:#2f7f62,stroke-width:1px;
    classDef nlp fill:#f5f1e8,color:#071b16,stroke:#d28b52,stroke-width:1px;
    classDef rag fill:#edf3ee,color:#071b16,stroke:#6f8f80,stroke-width:1px;
    classDef decision fill:#aaff55,color:#071b16,stroke:#071b16,stroke-width:2px;
    classDef note fill:#fff4d8,color:#071b16,stroke:#d2a64b,stroke-dasharray:5 3;

    class PLATFORM platform;
    class ML_DATA,ML_TARGET,ML_FEATURES,ML_SPLITS,ML_PREP,ML_MODELS,ML_EVAL,ML_OUTPUT ml;
    class NLP_SOURCE,NLP_CLEAN,NLP_CHUNKS,NLP_PAIR,NLP_ALIGN,NLP_EXTRACT,NLP_CHANGE,NLP_PRIORITY,NLP_OUTPUTS nlp;
    class NLP_EMBED,NLP_INDEX,NLP_QUERY,NLP_FILTER,NLP_SEARCH,NLP_CONTEXT,NLP_QWEN,NLP_GUARD,NLP_ANSWER rag;
    class WORKSPACE,OUTCOME decision;
    class SEPARATION,NLP_TONE,NLP_CACHE note;
```

### NLP and RAG techniques represented

- **Section-aware ingestion:** extracts Business, Risk Factors, and MD&A disclosures, then cleans, deduplicates, and chunks the text while preserving source metadata.
- **Semantic embeddings:** represents passages and questions with L2-normalized `all-MiniLM-L6-v2` vectors in 384 dimensions.
- **Exact vector search:** uses FAISS `IndexFlatIP`; because the vectors are normalized, inner product is equivalent to cosine similarity.
- **Metadata filtering:** scopes retrieval by canonical company identity, CIK/accession, sector, filing section, and known-by date, including point-in-time-safe filing selection.
- **Evidence selection:** retrieves semantic top-k passages, removes duplicate text, and applies a minimum similarity threshold before allowing a grounded answer.
- **Lexical fallback:** uses normalized term coverage only when semantic query encoding is unavailable. It is a diagnostic fallback, not a score blended with semantic search.
- **Local generation:** sends the selected passages and an allow-list of source IDs to Qwen 2.5 3B through a loopback-only Ollama endpoint.
- **Grounding guardrails:** validates returned citation IDs and quoted values, rejects unsupported citations, refuses weak evidence, and can fall back to an extractive answer.
- **Two-filing alignment:** uses exact normalized hashes first, then MiniLM similarity with mutual one-to-one matching for comparable prior/current paragraphs.
- **Change intelligence:** extracts entities and numbers, classifies new, removed, modified, intensified, and softened disclosures, and calculates an explainable attention priority.
- **Optional enrichment and caching:** retains FinBERT filing-tone metadata as a secondary descriptor and fingerprints inputs, models, prompts, and configuration for repeatable cached analyses.

The ML diagram intentionally ends at the evaluated comparative score and class. Budget, sector, company-size, and ranking controls belong to the product interface; they are not stages in the notebook's ML training pipeline.

### How decision makers use both parts

1. **Discover:** use the comparative ML output to identify companies that merit deeper research.
2. **Investigate:** use NLP filing intelligence to review material narrative changes and their source evidence.
3. **Compare:** examine peers, filing dates, numerical deltas, and disclosure themes without merging the two signals.
4. **Document:** ask evidence-scoped questions and export a neutral research memo for further review.

## Product workspaces

### Filing Intelligence

Select a company to review:

- filing-pair coverage;
- a visual change overview;
- material changes by topic and change type;
- attention-priority distribution;
- numerical changes found in disclosures;
- expandable prior/current evidence;
- peer context;
- evidence-based questions;
- memo export.

### Discover Companies

The discovery workspace lets a user explore companies using:

- investment budget and whole-share affordability;
- sector;
- micro-, small-, or mid-cap company size;
- minimum opportunity score;
- revenue growth, profitability, and momentum filters;
- price, market-cap, growth, momentum, and score sorting;
- side-by-side company comparison.

Prices in the demonstration are dated reference values, not live quotes. The budget tool estimates whole shares and does not represent trade execution.

### Peers and Reports

The peer workspace compares filing themes across selected companies. The reports workspace produces a research memo with material changes, filing context, evidence, and explicit limitations.

## Repository structure

```text
GrowthLens_Project/
|-- .github/workflows/pages.yml      # GitHub Pages build and deployment
|-- GrowthLens_Project.ipynb         # Structured financial-ML research notebook
|-- GrowthLens_Report.pdf            # Project report
|-- NLP_GrowthLens/                   # Public React/Vite application
|   |-- public/                       # Static visual assets
|   |-- src/
|   |   |-- components/               # Shared interface components
|   |   |-- data/                     # Curated precomputed public examples
|   |   |-- features/
|   |   |   |-- explorer/             # Company discovery and comparison
|   |   |   |-- intelligence/         # Filing changes, peers, Q&A, and memos
|   |   |   `-- research/             # Evidence presentation components
|   |   `-- lib/                      # Browser-side data and formatting layer
|   |-- package.json
|   `-- vite.config.js
`-- README.md
```


All public-edition operations happen inside the visitor's browser. The interface does not call a hidden API or require a running computer elsewhere.

## Research methodology

The Filing Intelligence design follows these principles:

- use filing date as the disclosure-availability date;
- keep prior and current evidence separate;
- preserve company, CIK, accession, section, filing date, and source provenance;
- treat added and removed passages as one-sided evidence cases;
- prevent a single paragraph from being matched to multiple passages;
- validate quoted values against source text;
- distinguish evidence quality from business importance;
- label capped or missing filing sections as partial coverage;
- refuse unsupported certainty;
- keep narrative attention separate from the structured opportunity score.

Attention priority is an explainable review-ordering aid based on disclosure novelty, section importance, risk-language movement, numerical changes, and evidence quality. It is not a prediction of price movement or company performance.

## Data and privacy

The public repository contains only curated demonstration records. It does not include the complete SEC corpus, structured parquet datasets, private caches, embeddings, model weights, credentials, or user data.

The GitHub Pages application is static. Questions in the public demonstration are processed against precomputed evidence in the browser and are not sent to an AI provider.

## Limitations

- The public edition is a product demonstration, not the full research universe.
- Filing comparisons may cover only the available sections and should not be described as complete-document analysis.
- Demonstration prices and financial fields are snapshots rather than live market data.
- An attention score measures review priority, not investment attractiveness.
- The opportunity signal is comparative and is not a calibrated probability.
- Generated or summarized conclusions should always be checked against the linked filing evidence.
- The notebook is a research artifact and may require its original data, GPU-oriented dependencies, and environment-specific configuration; it is not required to run the public website.

## Technology

- React 19
- Vite
- GSAP
- GitHub Pages and GitHub Actions
- Python/Jupyter for the structured research notebook
- SEC annual-filing data and structured company fundamentals in the private research workflow

## Project report

The accompanying [GrowthLens project report](./GrowthLens_Report.pdf) provides additional project context.

## Responsible use

GrowthLens is designed as a decision-support and research-organization tool. Users remain responsible for reviewing source filings, checking data freshness and completeness, and making independent financial decisions.
