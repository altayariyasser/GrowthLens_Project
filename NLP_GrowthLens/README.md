# GrowthLens GitHub Pages showcase

This folder contains the lightweight public edition of GrowthLens Filing Intelligence.

It is intentionally separate from the full local application. The public edition uses a small set of precomputed research examples and contains no Flask server, Ollama models, embeddings, private files, or large parquet artifacts.

## Run locally

```powershell
cd NLP_GrowthLens
npm.cmd install
npm.cmd run dev
```

## Build

```powershell
npm.cmd run build
```

The Vite base path is configured for `https://altayariyasser.github.io/GrowthLens_Project/`.

## Publish

The repository workflow in `.github/workflows/pages.yml` builds this folder and deploys `NLP_GrowthLens/dist` to GitHub Pages whenever `main` changes.

In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
