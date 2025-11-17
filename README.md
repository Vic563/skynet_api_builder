# Skynet API Builder (React + TS)

Quick portal to browse Skynet endpoints, fill parameters, and generate YAML/JSON request bodies.

## Setup

```bash
npm install
# Already good to go: src/data/skynetSpec.json is pre-generated from your doc.
# Optional (only if the upstream doc changes):
npm run build-spec   # parses /Users/DT232381/Desktop/skynet-docs/network_api_docs.md into src/data/skynetSpec.json

npm run dev          # start the UI
```

> Note: Keep the `build-spec` script handy for future updates. If you later run `/init` or pull fresh docs, rerun `npm run build-spec` to refresh `src/data/skynetSpec.json` so the sidebar stays in sync with the latest APIs.

## Current behavior (/init snapshot)
- All Skynet endpoints from your doc are preloaded (no need to run build-spec unless docs change).
- Forms: required fields are prefilled from doc examples; optional fields start empty. `sdn_version` defaults to **2 (SDN2)** unless the doc explicitly shows 1/1.0.
- GET/DELETE params are emitted under `query:`, POST/PUT under `body:`.
- Copy YAML button uses a fallback clipboard method (works even without `navigator.clipboard`).
- Optional fields toggle only appears when an endpoint actually has optional params.

## Notes
- The spec parser is heuristic. If the upstream doc changes format, rerun `npm run build-spec` and spot-check.
- The form accepts any value type; required fields are flagged. Empty values are omitted from the generated payload.
- “Generate YAML” produces a YAML body with a comment header containing method/path; copy or download via the UI.

## Tests

```bash
npm test
```
