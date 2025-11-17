# Skynet API Builder

A React + TypeScript portal to browse Skynet endpoints, fill parameters, and generate YAML request bodies.

## Quick Start

```bash
npm install
npm run dev          # start the UI
# Optional: regenerate spec if doc changes
npm run build-spec   # parses /Users/DT232381/Desktop/skynet-docs/network_api_docs.md into src/data/skynetSpec.json
```

## How It Works
- Endpoints are preloaded from the Skynet doc (spec JSON committed); build-spec only needed when the doc updates.
- Required fields prefill from doc examples; optional fields start empty. `sdn_version` defaults to 2 unless the doc shows 1/1.0.
- GET/DELETE params render under `query:`; POST/PUT under `body:`.
- Copy YAML uses a clipboard fallback for broader browser support.
- Optional-fields toggle appears only when an endpoint has optional params.

## Usage Tips
- Use the search box and dropdown to pick an endpoint, fill required fields, optionally reveal optional fields, then “Generate YAML”.
- YAML includes `endpoint`, `method`, and `body` (or `query` for GET/DELETE). Empty inputs are omitted.
- If the upstream doc changes, rerun `npm run build-spec` and restart dev server.
