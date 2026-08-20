# GrowthLens GitHub Pages showcase

This folder contains the lightweight public edition of GrowthLens Filing Intelligence. It uses the same React interface and product workspaces as the local application.

It is intentionally separate from the full local application. Filing analysis, discovery, peer comparison, evidence summaries, and Markdown memo creation run from a small set of precomputed browser data. The public edition contains no Flask server, model runtime, embeddings, private files, or large parquet artifacts, and it makes no local API calls.

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
