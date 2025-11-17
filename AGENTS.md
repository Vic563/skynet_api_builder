# Repository Guidelines

## Project Structure & Module Organization
- `src/` React + TypeScript source; entry at `src/main.tsx`, app shell in `src/App.tsx`, styles in `src/App.css` and `src/index.css`.
- `src/data/skynetSpec.json` pre-generated endpoint catalog (parsed from the Skynet doc). Regenerate via `npm run build-spec` if the doc changes.
- `scripts/` utility scripts (notably `scripts/build-spec.js`).
- `public/` static assets served by Vite; `dist/` is Vite’s build output (generated).
- Tests live alongside code (add `*.test.tsx`/`*.test.ts` near components).

## Build, Test, and Development Commands
- `npm run dev` — start Vite dev server with HMR.
- `npm run build` — type-check (tsc -b) and produce production bundle.
- `npm test` — run Vitest suite in jsdom.
- `npm run build-spec` — (optional) parse `/Users/DT232381/Desktop/skynet-docs/network_api_docs.md` into `src/data/skynetSpec.json`; rerun after updating docs.

## Coding Style & Naming Conventions
- TypeScript strict mode is on; prefer explicit types on exports and complex objects.
- Components: PascalCase filenames (e.g., `EndpointList.tsx`); hooks: `useSomething.ts`.
- Use functional React components and hooks; avoid class components.
- Formatting via project defaults (Vite + ESLint). Run `npm run lint` if added; otherwise follow existing style (2-space indent, single quotes, semicolons).

## Testing Guidelines
- Framework: Vitest with jsdom, utilities from Testing Library.
- Name tests `*.test.tsx` for React, `*.test.ts` for util modules.
- Prefer behavior tests over implementation details; assert visible text and DOM roles.
- Keep fast unit tests; mock network where needed (React Query not yet used).

## Commit & Pull Request Guidelines
- Commit messages: short imperative summaries (e.g., "Add YAML generator UI").
- Keep commits scoped; avoid bundling unrelated changes.
- PRs should describe intent, list key changes, and note testing performed (`npm test`, `npm run build`). Include screenshots/GIFs for UI-affecting changes when possible.

## Security & Config Tips
- No secrets in repo; base URL/auth tokens should stay out of source—inject via runtime config or .env (not checked in).
- Regenerating specs reads the local doc path; confirm it exists before running `npm run build-spec`.
